import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import Profile from './components/Profile';
import ParticleBackground from './components/ParticleBackground';
import Logo from './components/Logo';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        <ParticleBackground />
        
        {/* Header */}
        <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Logo />
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
              >
                {isDarkMode ? '🌞' : '🌙'}
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 relative">
          <div className="absolute inset-0 flex">
            {/* 左侧栏 - 30% 宽度 */}
            <div className="w-[30%] h-full p-4 flex flex-col space-y-4 overflow-y-auto">
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <FileUpload />
              </div>
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <Profile />
              </div>
            </div>
            
            {/* 右侧对话框 - 70% 宽度 */}
            <div className="w-[70%] h-full p-4">
              <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ChatInterface />
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">关于我们</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">使用条款</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">隐私政策</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">帮助中心</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
