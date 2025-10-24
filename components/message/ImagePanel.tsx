import React from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

interface ImagePanelProps {
  imageUrl?: string;
  isLoading?: boolean;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ imageUrl, isLoading }) => {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center mt-3 p-4 bg-fuchsia-100 rounded-lg">
                <LoadingSpinner className="w-8 h-8 mr-3 text-fuchsia-700" />
                <span className="text-fuchsia-800 font-semibold">{t('loading.image')}</span>
            </div>
        );
    }

    if (!imageUrl) return null;

    return (
        <div className="mt-3 relative">
            <img src={imageUrl} alt={t('alt.illustration')} className="rounded-lg shadow-md w-full" />
        </div>
    );
};

export default ImagePanel;