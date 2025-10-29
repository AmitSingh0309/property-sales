
import React from 'react';
import ChatWindow from './components/ChatWindow';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
};

export default App;
