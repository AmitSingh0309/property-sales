import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender } from '../types';
import type { Content, ContentPart } from '../types';
import { sendMessageToAI } from '../services/geminiService';
import MessageBubble from './Message';
import SendIcon from './icons/SendIcon';
import UploadIcon from './icons/UploadIcon';
import LoadingIcon from './icons/LoadingIcon';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<Content[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialGreeting = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialPrompt = "Namaste! Please greet me and start our conversation about real estate in Uttar Pradesh.";
      const aiResponseText = await sendMessageToAI([], initialPrompt, null);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: Sender.AI,
      };
      
      setMessages([aiMessage]);
      setChatHistory([
        { role: 'user', parts: [{ text: initialPrompt }] },
        { role: 'model', parts: [{ text: aiResponseText }] }
      ]);
    } catch (error) {
      console.error("Failed to fetch initial greeting:", error);
      const errorMessage: Message = {
        id: 'error-init',
        text: 'Sorry, I am having trouble connecting. Please refresh the page.',
        sender: Sender.AI
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchInitialGreeting();
  }, [fetchInitialGreeting]);

  const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ data: base64Data, mimeType: file.type });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async () => {
    if ((!userInput.trim() && !pendingImage) || isLoading) return;

    const userMessageText = userInput || "Please analyze this image.";
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: Sender.User,
      image: pendingImage?.previewUrl,
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    
    let imagePayload: { data: string; mimeType: string } | null = null;
    if (pendingImage) {
      imagePayload = await fileToBase64(pendingImage.file);
    }
    setPendingImage(null);
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessageToAI(chatHistory, userMessageText, imagePayload);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: Sender.AI,
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // FIX: Explicitly type userParts to allow for both text and image parts, fixing the type error.
      const userParts: ContentPart[] = [{text: userMessageText}];
      if(imagePayload) {
          userParts.unshift({ inlineData: { data: imagePayload.data, mimeType: imagePayload.mimeType } });
      }

      setChatHistory(prev => [
          ...prev,
          { role: 'user', parts: userParts },
          { role: 'model', parts: [{ text: aiResponseText }] }
      ]);

    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Maaf kijiye, ek samasya aa gayi hai. Kripya dobara koshish karein.',
        sender: Sender.AI
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg rounded-bl-none shadow">
               <LoadingIcon />
               <p className="text-gray-600 italic text-sm">Soch raha hoon...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        {pendingImage && (
            <div className="relative w-24 h-24 mb-2 p-1 border rounded-md">
                <img src={pendingImage.previewUrl} alt="upload preview" className="w-full h-full object-cover rounded-md" />
                <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
            </div>
        )}
        <div className="flex items-center space-x-2">
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            accept="image/*"
            />
            <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
                <UploadIcon />
            </button>
            <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Apna sandesh yahan likhein..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={isLoading}
            />
            <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200"
            disabled={isLoading || (!userInput.trim() && !pendingImage)}
            >
                <SendIcon />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
