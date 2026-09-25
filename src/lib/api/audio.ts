/**
 * CareIntel Audio & Speech Synthesis (TTS) API Client
 */

import { apiFetch } from './client';
import { TextToSpeechRequest } from './types';

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
};
