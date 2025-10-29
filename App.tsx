
import React from 'react';
import TeleCallerUI from './components/TeleCallerUI';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <TeleCallerUI />
      </main>
    </div>
  );
};

export default App;