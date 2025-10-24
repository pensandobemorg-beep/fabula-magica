
import { GoogleGenAI, Chat, Modality, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { createAudioUrl } from '../utils/audioUtils';
import { i18n } from '../i18n';
import type { Language } from "../contexts/LanguageContext";

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

export function createChatSession(lang: Language, history?: Content[]): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: i18n[lang].systemInstruction,
      safetySettings,
    },
  });
  return chat;
}

export async function continueStory(chat: Chat, prompt: string, lang: Language): Promise<{ storyText?: string, error?: string }> {
  try {
    const response = await chat.sendMessage({ message: prompt });
    return { storyText: response.text };
  } catch (error) {
    console.error("Error continuing story:", error);
    return { error: i18n[lang].errors.story };
  }
}

export async function generateIllustration(storyText: string, lang: Language): Promise<{ imageUrl: string; }> {
  const prompt = i18n[lang].imagePromptPrefix.replace('[STORY_TEXT]', storyText);
  
  // Plan A: High-quality model
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      // FIX: The `safetySettings` property must be inside the `config` object.
      config: {
        safetySettings,
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return { imageUrl: `data:image/png;base64,${base64ImageBytes}` };
  } catch (error) {
    console.warn("Plan A (Imagen) failed, trying Plan B (Gemini Flash Image).", error);
    
    // Plan B: Fallback AI model
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseModalities: [Modality.IMAGE],
          safetySettings,
        },
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return { imageUrl: `data:image/png;base64,${base64ImageBytes}` };
        }
      }
      throw new Error("Gemini Flash Image did not return an image part.");
    } catch (fallbackError) {
      console.warn("Plan B (Gemini Flash Image) failed, using Plan C (picsum.photos).", fallbackError);
      // Plan C: Guaranteed placeholder
      return { imageUrl: `https://picsum.photos/800/600?random=${Date.now()}` };
    }
  }
}

export async function generateSpeech(storyText: string, lang: Language): Promise<{ audioUrl?: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${i18n[lang].speechPromptPrefix} ${storyText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
        safetySettings,
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return { audioUrl: createAudioUrl(base64Audio) };
    }
    return { audioUrl: undefined };
  } catch (error) {
    console.error("Error generating speech, failing silently:", error);
    return { audioUrl: undefined };
  }
}