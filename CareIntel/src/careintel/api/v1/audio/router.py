"""
FastAPI router for Audio and Speech capabilities.
"""

import json
import logging
import os
import tempfile
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
import httpx
from pydantic import BaseModel, Field

from careintel.api.deps import get_current_user, get_speech_provider, get_speech_service
from careintel.application.audio.speech_service import SpeechService
from careintel.core.config import Settings, get_settings
from careintel.domain.auth.models import UserContext
from careintel.infrastructure.stt.port import SpeechProvider

router = APIRouter(prefix="/audio", tags=["audio"])


class TextToSpeechRequest(BaseModel):
    text: str = Field(..., max_length=4096, description="Text to synthesize into speech")
    voice: str | None = Field(None, description="Optional voice to use for synthesis")


@router.post(
    "/speech",
    summary="Synthesize Speech",
    description="Generates audio speech from provided text using the configured TTS provider.",
    responses={
        200: {
            "content": {
                "audio/mpeg": {},
                "audio/wav": {},
                "audio/ogg": {},
            },
            "description": "The generated audio file.",
        }
    },
)
async def synthesize_speech(
    request: TextToSpeechRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
    speech_service: Annotated[SpeechService, Depends(get_speech_service)],
) -> Response:
    """
    Generate speech from text. Returns binary audio.
    """
    result = await speech_service.synthesize_speech(
        text=request.text,
        voice=request.voice,
        user=user,
    )

    # Map common formats to their mime types
    media_types = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "opus": "audio/ogg",
        "aac": "audio/aac",
        "flac": "audio/flac",
    }

    media_type = media_types.get(result.audio_format, "application/octet-stream")

    return Response(content=result.audio_bytes, media_type=media_type)


class SegmentResponse(BaseModel):
    id: str
    start_time_ms: int
    end_time_ms: int
    text: str
    speaker_label: str | None = None


class SymptomExtracted(BaseModel):
    name: str
    duration: str
    severity: str


class AudioTranscriptionResponse(BaseModel):
    transcript: str
    language: str
    translation: str
    segments: list[SegmentResponse] = []
    symptoms: list[SymptomExtracted] = []
    provider: str
    duration_ms: int = 0


@router.post(
    "/transcribe",
    response_model=AudioTranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe Audio Speech",
    description="Transcribes recorded speech using Azure Speech-to-Text with speaker diarization and extracts clinical English translation.",
)
async def transcribe_audio(
    file: Annotated[UploadFile, File(...)],
    user: Annotated[UserContext, Depends(get_current_user)],
    speech_provider: Annotated[SpeechProvider, Depends(get_speech_provider)],
    settings: Annotated[Settings, Depends(get_settings)],
    language: Annotated[str | None, Form()] = None,
    target_language: Annotated[str, Form()] = "en",
) -> AudioTranscriptionResponse:
    """
    Accepts uploaded audio (e.g. webm, wav, mp3), executes Speech-to-Text via the configured
    STT provider, and extracts clinical English translation and candidate symptoms.
    """
    logger = logging.getLogger(__name__)
    run_id = str(uuid.uuid4())

    # Determine extension
    original_name = file.filename or "recording.webm"
    ext = os.path.splitext(original_name)[1].lower()
    if not ext:
        ext = ".webm"

    fd, temp_path = tempfile.mkstemp(prefix=f"audio_stt_{run_id}_", suffix=ext)
    try:
        content = await file.read()
        with os.fdopen(fd, "wb") as f:
            f.write(content)

        # Execute STT via configured provider
        stt_result = await speech_provider.process_audio(temp_path, run_id)

        # Aggregate transcript
        full_text = " ".join(s.text for s in stt_result.segments if s.text).strip()
        detected_lang = language or (stt_result.segments[0].language if stt_result.segments and stt_result.segments[0].language else "en")

        segments_resp = [
            SegmentResponse(
                id=str(s.segment_id),
                start_time_ms=s.start_time_ms,
                end_time_ms=s.end_time_ms,
                text=s.text,
                speaker_label=s.speaker_label,
            )
            for s in stt_result.segments
        ]

        total_duration = max((s.end_time_ms for s in stt_result.segments), default=0)

        clinical_translation = full_text
        symptoms: list[SymptomExtracted] = []

        # If transcript is non-empty, use Azure LLM to provide clinical English translation and extract symptoms
        if full_text and settings.azure_openai_api_key and settings.azure_openai_endpoint:
            try:
                ep = settings.azure_openai_endpoint.rstrip("/")
                key = settings.azure_openai_api_key.get_secret_value()
                deployment = settings.azure_llm_deployment
                prompt = (
                    f"You are a clinical triage AI. A patient spoke the following intake statement (Language: '{detected_lang}'):\n"
                    f"\"{full_text}\"\n\n"
                    "Instructions:\n"
                    "1. Translate into clear, objective clinical English.\n"
                    "2. Extract any mentioned symptoms, duration, and severity (MILD, MODERATE, SEVERE).\n\n"
                    "Respond ONLY with a JSON object containing keys:\n"
                    "- \"clinical_translation\": string\n"
                    "- \"symptoms\": list of objects with fields: \"name\" (string), \"duration\" (string), \"severity\" (one of MILD, MODERATE, SEVERE)"
                )
                async with httpx.AsyncClient(timeout=25.0) as client:
                    llm_resp = await client.post(
                        f"{ep}/openai/deployments/{deployment}/chat/completions?api-version={settings.azure_llm_api_version}",
                        headers={"api-key": key},
                        json={
                            "messages": [{"role": "user", "content": prompt}],
                            "max_completion_tokens": 500,
                            "response_format": {"type": "json_object"},
                        },
                    )
                    if llm_resp.status_code == 200:
                        parsed = json.loads(llm_resp.json()["choices"][0]["message"]["content"])
                        clinical_translation = parsed.get("clinical_translation", full_text)
                        raw_syms = parsed.get("symptoms", [])
                        for rs in raw_syms:
                            symptoms.append(
                                SymptomExtracted(
                                    name=str(rs.get("name", "Reported symptom")),
                                    duration=str(rs.get("duration", "Recent")),
                                    severity=str(rs.get("severity", "MODERATE")).upper(),
                                )
                            )
            except Exception as llm_err:
                logger.warning(f"Clinical translation LLM fallback notice: {llm_err}")

        return AudioTranscriptionResponse(
            transcript=full_text,
            language=detected_lang,
            translation=clinical_translation or full_text,
            segments=segments_resp,
            symptoms=symptoms,
            provider=stt_result.provider_version,
            duration_ms=total_duration,
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

