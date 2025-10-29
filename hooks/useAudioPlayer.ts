
import { useState, useCallback, useRef } from 'react';
import { getSpeech } from '../services/geminiService';

// Utility to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Utility to decode raw PCM data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (text: string, messageId: string) => {
    if (isLoading || isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
      setIsLoading(false);
      if (activeMessageId === messageId) {
        setActiveMessageId(null);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setActiveMessageId(messageId);

    try {
      const base64Audio = await getSpeech(text);
      if (!base64Audio) {
        throw new Error("Failed to generate audio.");
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      await audioContext.resume();

      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setActiveMessageId(null);
        sourceRef.current = null;
      };
      
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      setError("Audio playback failed.");
      setActiveMessageId(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying, activeMessageId]);

  return { playAudio, isPlaying, isLoading, error, activeMessageId };
};
