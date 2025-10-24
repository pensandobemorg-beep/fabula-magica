import React, { useRef, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

interface AudioPanelProps {
  audioUrl?: string;
  isLoading?: boolean;
  isLast: boolean;
}

const AudioPanel: React.FC<AudioPanelProps> = ({ audioUrl, isLoading, isLast }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (audioRef.current && isLast && audioUrl) {
           audioRef.current.play().catch(e => console.error("A reprodução automática de áudio falhou:", e));
        }
    }, [audioUrl, isLast]);

  if (isLoading) {
    return (
      <div className="flex items-center mt-3 text-fuchsia-800">
        <LoadingSpinner className="w-5 h-5 mr-2" />
        <span>{t('loading.audio')}</span>
      </div>
    );
  }

  if (!audioUrl) return null;

  return <audio ref={audioRef} key={audioUrl} controls src={audioUrl} className="mt-3 w-full" />;
};

export default AudioPanel;