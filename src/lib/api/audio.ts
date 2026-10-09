/**
 * CareIntel Audio & Speech Synthesis (TTS) API Client
 */

import { apiFetch } from './client';
import { TextToSpeechRequest } from './types';

export interface AudioTranscriptionSegment {
  id: string;
  start_time_ms: number;
  end_time_ms: number;
  text: string;
  speaker_label?: string | null;
}

export interface ExtractedSymptom {
  name: string;
  duration: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface AudioTranscriptionResponse {
  transcript: string;
  language: string;
  translation: string;
  segments: AudioTranscriptionSegment[];
  symptoms: ExtractedSymptom[];
  provider: string;
  duration_ms: number;
}

export const audioApi = {
  /**
   * Synthesize natural speech audio from text using Azure OpenAI TTS / Demo provider.
   * Returns a binary audio Blob that can be played in the browser.
   */
  async synthesizeSpeech(payload: TextToSpeechRequest): Promise<Blob> {
    return apiFetch<Blob>('/audio/speech', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Helper: Synthesize speech and create an HTML5 Audio object or object URL.
   */
  async createAudioUrl(text: string, voice = 'nova'): Promise<string> {
    const blob = await this.synthesizeSpeech({ text, voice });
    return URL.createObjectURL(blob);
  },

  /**
   * Transcribe recorded audio with Azure Speech-to-Text and extract clinical English translation.
   */
  async transcribeAudio(
    audioBlob: Blob,
    fileName = 'recording.webm',
    language?: string
  ): Promise<AudioTranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    if (language) {
      formData.append('language', language);
    }
    return apiFetch<AudioTranscriptionResponse>('/audio/transcribe', {
      method: 'POST',
      body: formData,
    });
  },
};

