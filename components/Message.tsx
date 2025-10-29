
import React from 'react';
import { Message, Sender } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import SpeakerIcon from './icons/SpeakerIcon';
import LoadingIcon from './icons/LoadingIcon';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const { playAudio, isPlaying, isLoading, activeMessageId } = useAudioPlayer();

  const handlePlayAudio = () => {
    playAudio(message.text, message.id);
  };

  const isThisMessageAudioActive = activeMessageId === message.id;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg shadow ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        }`}
      >
        {message.image && (
          <img
            src={message.image}
            alt="user upload"
            className="rounded-lg mb-2 max-h-48 w-full object-cover"
          />
        )}
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        {!isUser && (
          <div className="mt-2">
            <button
              onClick={handlePlayAudio}
              className={`p-1 rounded-full transition-colors duration-200 ${
                isThisMessageAudioActive && isPlaying ? 'text-green-500' : 'text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isThisMessageAudioActive && isLoading ? <LoadingIcon /> : <SpeakerIcon isPlaying={isThisMessageAudioActive && isPlaying} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
