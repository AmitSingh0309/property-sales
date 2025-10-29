import React from 'react';
import { Message, Sender } from '../types';

interface TranscriptMessageProps {
  message: Message;
}

const TranscriptMessage: React.FC<TranscriptMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 bg-blue-500 rounded-full h-8 w-8 flex items-center justify-center text-white font-bold">
          AI
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg shadow ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center text-gray-600 font-bold">
          You
        </div>
      )}
    </div>
  );
};

export default TranscriptMessage;
