import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

const flags: Record<Language, React.ReactNode> = {
    pt: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className="w-8 h-8"><path fill="#009639" d="M0 0h9v6H0z"/><path fill="#FEDD00" d="m4.5 1-3 2 3 2 3-2z"/><path fill="#002776" d="M4.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>
    ),
    en: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className="w-8 h-8"><path fill="#B22234" d="M0 0h9v6H0z"/><path fill="#fff" d="M0 1h9v1H0zm0 2h9v1H0zM0 5h9v1H0zM0 0h4v3H0z"/><path fill="#3C3B6E" d="M0 0h4v3H0z"/></svg>
    ),
    es: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className="w-8 h-8"><path fill="#C60B1E" d="M0 0h9v6H0z"/><path fill="#FFC400" d="M0 1.5h9v3H0z"/></svg>
    ),
};

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ['pt', 'en', 'es'];

  return (
    <div className="flex justify-center items-center gap-2 bg-white/50 p-1 rounded-full">
      {languages.map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`p-1 rounded-full transition-all duration-300 flex items-center justify-center ${
            language === code ? 'bg-pink-400 scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
          }`}
          aria-label={`Change language to ${code}`}
        >
          {flags[code]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;