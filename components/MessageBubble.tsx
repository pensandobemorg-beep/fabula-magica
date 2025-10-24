
import React from 'react';
import type { Message } from '../types';
import ImagePanel from './message/ImagePanel';
import AudioPanel from './message/AudioPanel';

interface MessageBubbleProps {
  message: Message;
  isLastModelMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLastModelMessage }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500 text-white rounded-3xl rounded-br-lg p-4 max-w-sm shadow-md">
          <p>{message.text}</p>
        </div>
      </div>
    );
  }

  const bubbleClasses = message.isError
    ? 'bg-red-100 border-red-200'
    : 'bg-white border-gray-100';

  return (
    <div className="flex justify-start mb-4">
      <div className={`rounded-3xl rounded-bl-lg p-4 max-w-xl shadow-md border ${bubbleClasses}`}>
        <p className="text-gray-800 text-lg">{message.text}</p>
        
        {!message.isError && (
             <ImagePanel imageUrl={message.imageUrl} isLoading={message.isLoadingImage} />
        )}

        {!message.isError && (
          <div className="mt-2">
              <AudioPanel audioUrl={message.audioUrl} isLoading={message.isLoadingAudio} isLast={isLastModelMessage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;