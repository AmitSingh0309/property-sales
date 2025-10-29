
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 6a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm1 3a1 1 0 000 2h10a1 1 0 100-2H5zm-1 3a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm1 3a1 1 0 000 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">UP Real Estate AI Agent</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
