import { useState, useRef, useCallback } from 'react';
import { connectTeleCaller } from '../services/geminiService';
import { CallStatus, Message, Sender } from '../types';
import type { LiveSession, LiveServerMessage } from '@google/genai';


// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
// --- End Audio Utility Functions ---


export const useTeleCaller = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [transcript, setTranscript] = useState<Message[]>([]);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const sources = useRef(new Set<AudioBufferSourceNode>()).current;
  const nextStartTime = useRef(0);

  const cleanup = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    mediaStreamRef.current = null;
    scriptProcessorRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    sessionPromiseRef.current = null;
    
    sources.forEach(source => source.stop());
    sources.clear();
    nextStartTime.current = 0;
  }, [sources]);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    // Real-time transcription updates
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      setTranscript(prev => {
        const newTranscript = [...prev];
        const lastMessage = newTranscript[newTranscript.length - 1];
        if (lastMessage && lastMessage.sender === Sender.User && !lastMessage.isFinal) {
          lastMessage.text += text;
        } else {
          newTranscript.push({ id: `user-${Date.now()}`, text: text, sender: Sender.User, isFinal: false });
        }
        return newTranscript;
      });
    }

    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      setTranscript(prev => {
        const newTranscript = [...prev];
        const lastMessage = newTranscript[newTranscript.length - 1];
        if (lastMessage && lastMessage.sender === Sender.AI && !lastMessage.isFinal) {
          lastMessage.text += text;
        } else {
          newTranscript.push({ id: `ai-${Date.now()}`, text: text, sender: Sender.AI, isFinal: false });
        }
        return newTranscript;
      });
    }

    if (message.serverContent?.turnComplete) {
      setTranscript(prev =>
        prev.map(msg =>
          msg.isFinal ? msg : { ...msg, isFinal: true, text: msg.text.trim() }
        )
      );
    }

    // Handle audio playback
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = outputAudioContextRef.current;
      await audioContext.resume();

      nextStartTime.current = Math.max(nextStartTime.current, audioContext.currentTime);

      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.addEventListener('ended', () => {
        sources.delete(source);
      });

      source.start(nextStartTime.current);
      nextStartTime.current += audioBuffer.duration;
      sources.add(source);
    }
     
    if (message.serverContent?.interrupted) {
        sources.forEach(source => source.stop());
        sources.clear();
        nextStartTime.current = 0;
    }
  }, [sources]);


  const startCall = useCallback(async () => {
    setCallStatus(CallStatus.CONNECTING);
    setTranscript([]);

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      sessionPromiseRef.current = connectTeleCaller({
        onopen: async () => {
          setCallStatus(CallStatus.CONNECTED);
          
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const audioContext = inputAudioContextRef.current;
          await audioContext.resume();
          
          const source = audioContext.createMediaStreamSource(mediaStreamRef.current!);
          scriptProcessorRef.current = audioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessorRef.current.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
            };
            sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessorRef.current);
          scriptProcessorRef.current.connect(audioContext.destination);
        },
        onmessage: handleMessage,
        onerror: (e) => {
          console.error("Session error:", e);
          setCallStatus(CallStatus.ENDED);
          cleanup();
        },
        onclose: () => {
          setCallStatus(CallStatus.ENDED);
          cleanup();
        },
      });

    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus(CallStatus.ENDED);
      cleanup();
    }
  }, [cleanup, handleMessage]);

  const endCall = useCallback(async () => {
    const session = await sessionPromiseRef.current;
    session?.close();
    cleanup();
    setCallStatus(CallStatus.ENDED);
  }, [cleanup]);

  return { callStatus, transcript, startCall, endCall };
};