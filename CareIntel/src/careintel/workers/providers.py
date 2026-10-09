"""Lazy provider composition shared by Celery business tasks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, cast

from careintel.core.config import Settings, get_settings
from careintel.infrastructure.language.demo_provider import DemoLanguageProvider
from careintel.infrastructure.processing_providers import (
    build_extraction_provider,
    build_ocr_provider,
)
from careintel.infrastructure.storage.azure_provider import AzureBlobProvider
from careintel.infrastructure.storage.fake_provider import FakeBlobProvider
from careintel.infrastructure.stt.demo_provider import DemoSpeechProvider
from careintel.infrastructure.translation.demo_provider import DemoTranslationProvider


@dataclass
class WorkerProviders:
    blob: Any
    ocr: Any
    speech: Any
    language: Any
    translation: Any
    extraction: Any
    embedding: Any
    llm: Any

    async def close(self) -> None:
        await self.blob.close()


_providers: WorkerProviders | None = None


def _build(settings: Settings) -> WorkerProviders:
    if settings.azure_storage_connection_string:
        blob: Any = AzureBlobProvider(
            connection_string=settings.azure_storage_connection_string.get_secret_value(),
            container_name=settings.azure_storage_container,
        )
    else:
        blob = FakeBlobProvider()

    ocr = build_ocr_provider(settings)

    if (
        settings.stt_provider in {"azure_openai_transcribe", "azure_openai_diarize"}
        and settings.azure_openai_api_key
    ):
        from careintel.infrastructure.stt.azure_provider import AzureSpeechProvider

        mode = "diarize" if settings.stt_provider == "azure_openai_diarize" else "transcribe"
        speech: Any = AzureSpeechProvider(
            endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key.get_secret_value(),
            api_version=(
                settings.azure_stt_diarize_api_version
                if mode == "diarize"
                else settings.azure_stt_api_version
            ),
            deployment=(
                settings.azure_stt_diarize_deployment
                if mode == "diarize"
                else settings.azure_stt_deployment
            ),
            mode=cast(Literal["transcribe", "diarize"], mode),
        )
    else:
        speech = DemoSpeechProvider()

    if settings.embedding_provider == "azure_openai" and settings.azure_openai_api_key:
        from careintel.infrastructure.embedding.azure_provider import AzureEmbeddingProvider

        embedding: Any = AzureEmbeddingProvider(
            endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key.get_secret_value(),
            deployment=settings.azure_embedding_deployment,
        )
    else:
        from careintel.infrastructure.embedding.demo_provider import DemoEmbeddingProvider

        embedding = DemoEmbeddingProvider()

    if settings.llm_provider == "azure_openai" and settings.azure_openai_api_key:
        from careintel.infrastructure.ai.azure_openai_adapter import AzureOpenAIAdapter

        llm: Any = AzureOpenAIAdapter(
            endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key.get_secret_value(),
            deployment=settings.azure_llm_deployment,
            api_version=settings.azure_llm_api_version,
        )
    else:
        from careintel.infrastructure.ai.demo_adapter import DemoLLMProvider

        llm = DemoLLMProvider()

    return WorkerProviders(
        blob=blob,
        ocr=ocr,
        speech=speech,
        language=DemoLanguageProvider(),
        translation=DemoTranslationProvider(),
        extraction=build_extraction_provider(settings),
        embedding=embedding,
        llm=llm,
    )


async def get_worker_providers() -> WorkerProviders:
    global _providers
    if _providers is None:
        _providers = _build(get_settings())
    return _providers


async def close_worker_providers() -> None:
    global _providers
    if _providers is not None:
        await _providers.close()
        _providers = None
