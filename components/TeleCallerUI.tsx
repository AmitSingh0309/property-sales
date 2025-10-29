import React, { useEffect, useRef } from 'react';
import { useTeleCaller } from '../hooks/useTeleCaller';
import { CallStatus } from '../types';
import TranscriptMessage from './Message';
import CallIcon from './icons/CallIcon';
import EndCallIcon from './icons/EndCallIcon';
import LoadingIcon from './icons/LoadingIcon';

const TeleCallerUI: React.FC = () => {
  const { callStatus, transcript, startCall, endCall } = useTeleCaller();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const getStatusText = () => {
    switch (callStatus) {
      case CallStatus.IDLE:
        return 'Ready to Call';
      case CallStatus.CONNECTING:
        return 'Connecting...';
      case CallStatus.CONNECTED:
        return 'Connected - Live';
      case CallStatus.ENDED:
        return 'Call Ended';
      default:
        return '';
    }
  };

  const isCallActive = callStatus === CallStatus.CONNECTED;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {transcript.map((msg) => (
          <TranscriptMessage key={msg.id} message={msg} />
        ))}
        <div ref={transcriptEndRef} />
      </div>

      {/* Footer / Control Area */}
      <div className="bg-white border-t border-gray-200 p-4 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2 mb-3">
           <div className={`h-3 w-3 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
           <p className="text-gray-600 font-medium">{getStatusText()}</p>
        </div>
        
        {callStatus === CallStatus.IDLE && (
            <button
            onClick={startCall}
            className="bg-green-500 text-white rounded-full p-4 hover:bg-green-600 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="Start Call"
            >
            <CallIcon />
            </button>
        )}
        
        {callStatus === CallStatus.CONNECTING && (
           <div className="flex flex-col items-center">
              <LoadingIcon />
              <p className="text-sm text-gray-500 mt-2">Please allow microphone access</p>
           </div>
        )}

        {callStatus === CallStatus.CONNECTED && (
            <button
            onClick={endCall}
            className="bg-red-500 text-white rounded-full p-4 hover:bg-red-600 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="End Call"
            >
            <EndCallIcon />
            </button>
        )}

         {callStatus === CallStatus.ENDED && (
            <button
            onClick={startCall}
            className="bg-blue-500 text-white rounded-full px-6 py-3 hover:bg-blue-600 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Call Again"
            >
            Call Again
            </button>
        )}

      </div>
    </div>
  );
};

export default TeleCallerUI;