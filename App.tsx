import React, { FormEvent, useState } from 'react';
import MessageBubble from './components/MessageBubble';
import LoadingSpinner from './components/LoadingSpinner';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useStoryManager } from './hooks/useStoryManager';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

export default function App() {
  const { language, t } = useLanguage();
  const [showSendPulse, setShowSendPulse] = useState(false);

  const {
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
  } = useStoryManager({ language, t });
  
  const handleVoiceSubmission = () => {
    setShowSendPulse(true);
    setTimeout(() => setShowSendPulse(false), 600);
  };

  const {
    userInput,
    isListening,
    isSpeechRecognitionSupported,
    handleMicPress,
    handleMicRelease,
    handleUserInputChange,
  } = useSpeechRecognition({
    language,
    onSubmit: submitMessage,
    onSubmission: handleVoiceSubmission,
  });

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
        submitMessage(userInput.trim());
        handleUserInputChange(''); // Clear input after submit
    }
  };

  const MemoizedLanguageSwitcher = React.memo(LanguageSwitcher);

  if (!isStarted) {
    return (
      <div className="flex flex-col h-screen bg-amber-50 text-gray-800 items-center justify-center text-center p-4">
         <div className="bg-white/60 p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <h1 className="text-4xl font-bold tracking-wider text-pink-500">{t('start.title')}</h1>
            <p className="text-lg mt-2 mb-6">{t('start.subtitle')}</p>
            <div className="mb-6">
              <MemoizedLanguageSwitcher />
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleStart(false)}
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full py-3 px-8 text-xl font-bold transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                {t('start.newStory')}
              </button>
              {hasSavedStory && (
                <button
                  onClick={() => handleStart(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full py-3 px-8 text-xl font-bold transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('start.continueStory')}
                </button>
              )}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-amber-50 text-gray-800">
      <header className="bg-pink-400 text-white p-4 shadow-md z-10 flex justify-between items-center">
        <div className="text-center flex-grow">
          <h1 className="text-3xl font-bold tracking-wider">{t('header.title')}</h1>
          <p className="text-sm">{t('header.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
            <MemoizedLanguageSwitcher />
            <button onClick={handleSaveStory} disabled={saveStatus !== 'idle'} className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full p-2 transition-colors duration-200">
                {saveStatus === 'saved' ? t('buttons.saved') : saveStatus === 'saving' ? <LoadingSpinner className="w-5 h-5"/> : t('buttons.saveStory')}
            </button>
            <button onClick={handleSaveAsPdf} disabled={isSavingPdf} className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-full p-2 transition-colors duration-200">
                {isSavingPdf ? <LoadingSpinner className="w-5 h-5"/> : t('buttons.savePdf')}
            </button>
        </div>
      </header>
      
      <main ref={storyContentRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {messages.map(msg => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                    isLastModelMessage={msg.id === lastModelMessageId}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200 sticky bottom-0">
        <form onSubmit={handleSubmitForm} className="max-w-4xl mx-auto">
          <div className="flex items-center bg-white rounded-full border-2 border-pink-300 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-200 shadow-sm p-2 gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => handleUserInputChange(e.target.value)}
              placeholder={isLoading ? t('placeholder.thinking') : isListening ? t('placeholder.listening') : t('placeholder.next')}
              className="flex-grow bg-transparent focus:outline-none px-4 text-lg"
              disabled={isLoading}
            />
            {isSpeechRecognitionSupported && (
                <button 
                  type="button" 
                  onMouseDown={handleMicPress} 
                  onMouseUp={handleMicRelease} 
                  onTouchStart={handleMicPress}
                  onTouchEnd={handleMicRelease}
                  className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1h-2v1a9 9 0 0 0 8 8.94V22h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 11v-1h-2z"/>
                    </svg>
                </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className={`bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-full p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex-shrink-0 ${showSendPulse ? 'bg-green-500 animate-pulse' : ''}`}
            >
              {isLoading ? (
                <LoadingSpinner className="w-6 h-6" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}