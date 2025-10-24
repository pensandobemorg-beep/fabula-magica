import { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Message } from '../types';
import type { Chat, Content } from "@google/genai";
import { createChatSession, continueStory, generateSpeech, generateIllustration } from '../services/geminiService';
import { i18n } from '../i18n';
import type { Language } from '../contexts/LanguageContext';

const LOCAL_STORAGE_KEY = 'fabula-magica-story';

interface StoryManagerProps {
  language: Language;
  t: (key: string) => string;
}

export function useStoryManager({ language, t }: StoryManagerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [hasSavedStory, setHasSavedStory] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isSavingPdf, setIsSavingPdf] = useState<boolean>(false);

    const chatRef = useRef<Chat | null>(null);
    const storyContentRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedStory = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedStory) {
                setHasSavedStory(true);
            }
        } catch (error) {
            console.error("Failed to read from localStorage:", error);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startNewStory = useCallback(async () => {
        chatRef.current = createChatSession(language);
        const initialText = i18n[language].initialMessage;
        const initialMsg: Message = {
            id: 'start-1',
            role: 'model',
            text: initialText,
            isLoadingAudio: true,
            isLoadingImage: true,
        };
        setMessages([initialMsg]);

        try {
             const [audioResult, imageResult] = await Promise.all([
                generateSpeech(initialText, language),
                generateIllustration(initialText, language)
            ]);

            setMessages(prev => prev.map(msg =>
                msg.id === initialMsg.id ? { 
                    ...msg, 
                    audioUrl: audioResult.audioUrl, 
                    isLoadingAudio: false,
                    imageUrl: imageResult.imageUrl,
                    isLoadingImage: false
                } : msg
            ));
        } catch (error) {
            console.error("Failed to generate initial content:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === initialMsg.id ? { ...msg, text: t('errors.initialLoad'), isError: true, isLoadingAudio: false, isLoadingImage: false } : msg
            ));
        }
    }, [language, t]);
    
    const loadSavedStory = useCallback(async () => {
         try {
            const savedStoryJson = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedStoryJson) {
                const savedMessages: Message[] = JSON.parse(savedStoryJson);
                const chatHistory: Content[] = savedMessages
                    .filter(msg => msg.id !== 'start-1')
                    .map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    }));

                chatRef.current = createChatSession(language, chatHistory);
                setMessages(savedMessages);
                return;
            }
        } catch (error) {
            console.error("Failed to load or parse saved story:", error);
        }
        await startNewStory(); // Fallback to new story if loading fails
    }, [language, startNewStory]);

    const handleStart = useCallback((loadSaved: boolean) => {
        setIsStarted(true);
        if (loadSaved) {
            loadSavedStory();
        } else {
            startNewStory();
        }
    }, [loadSavedStory, startNewStory]);
    
    const submitMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        
        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const modelResponseId = `model-${Date.now()}`;
        try {
            if (!chatRef.current) throw new Error("Chat session not initialized");

            const storyResult = await continueStory(chatRef.current, userMessage.text, language);
            if (storyResult.error) {
                const errorMessage: Message = { id: modelResponseId, role: 'model', text: storyResult.error, isError: true };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }
            
            const storyText = storyResult.storyText!;
            const modelMessage: Message = { 
                id: modelResponseId, 
                role: 'model', 
                text: storyText, 
                isLoadingAudio: true, 
                isLoadingImage: true 
            };
            setMessages(prev => [...prev, modelMessage]);

            const [audioResult, imageResult] = await Promise.all([
                generateSpeech(storyText, language),
                generateIllustration(storyText, language)
            ]);

            setMessages(prev => prev.map(msg => 
                msg.id === modelResponseId ? { 
                    ...msg, 
                    audioUrl: audioResult.audioUrl, 
                    isLoadingAudio: false,
                    imageUrl: imageResult.imageUrl,
                    isLoadingImage: false
                } : msg
            ));

        } catch (error) {
            console.error("Failed to get model response:", error);
            const errorMessage: Message = { id: `error-${Date.now()}`, role: 'model', text: t('errors.modelResponse'), isError: true };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, language, t]);
    
    const handleSaveStory = useCallback(() => {
        if (messages.length > 1) {
            setSaveStatus('saving');
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
                setHasSavedStory(true);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error("Failed to save story:", error);
                setSaveStatus('idle');
            }
        }
    }, [messages]);

    const handleSaveAsPdf = useCallback(async () => {
        const storyElement = storyContentRef.current;
        if (!storyElement || messages.length <= 1) return;
    
        setIsSavingPdf(true);
        
        const originalStyles = {
            overflowY: storyElement.style.overflowY,
            height: storyElement.style.height,
        };
    
        try {
            storyElement.style.overflowY = 'visible';
            storyElement.style.height = 'auto';
    
            await new Promise(resolve => setTimeout(resolve, 100));
    
            const canvas = await html2canvas(storyElement, {
                useCORS: true,
                scale: 1.5,
                backgroundColor: '#fffbeb',
            });
    
            storyElement.style.overflowY = originalStyles.overflowY;
            storyElement.style.height = originalStyles.height;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });
    
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('fabula-magica.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
            storyElement.style.overflowY = originalStyles.overflowY;
            storyElement.style.height = originalStyles.height;
        } finally {
            setIsSavingPdf(false);
        }
    }, [messages]);
    
    const lastModelMessageId = [...messages].reverse().find(m => m.role === 'model')?.id;

    return {
        messages,
        isLoading,
        isStarted,
        hasSavedStory,
        saveStatus,
        isSavingPdf,
        storyContentRef,
        messagesEndRef,
        lastModelMessageId,
        handleStart,
        submitMessage,
        handleSaveStory,
        handleSaveAsPdf,
    };
}