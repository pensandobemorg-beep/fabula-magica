import type { Chat } from "@google/genai";

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioUrl?: string;
  isLoadingAudio?: boolean;
  isError?: boolean;
  imageUrl?: string;
  isLoadingImage?: boolean;
}