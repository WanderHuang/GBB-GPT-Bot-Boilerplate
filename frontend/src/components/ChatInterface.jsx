import React, { useState, useRef, useEffect } from 'react';
import AnimatedInput from './AnimatedInput';
import ComboDisplay from './ComboDisplay';
import UserAvatar from './UserAvatar';
import MarkdownRenderer from './MarkdownRenderer';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [combo, setCombo] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    // 获取关键词
    fetch(`${process.env.REACT_APP_API_URL}/keywords`)
      .then(response => response.json())
      .then(data => {
        if (data.keywords) {
          setKeywords(data.keywords);
        }
      })
      .catch(error => {
        console.error('获取关键词失败:', error);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = () => {
    setTotalCount(prev => prev + 1);
    
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    
    resetTimerRef.current = setTimeout(() => {
      setTotalCount(0);
      setCombo(0);
    }, 15000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputValue }),
      });

      const data = await response.json();
      
      const aiResponse = {
        text: data.answer,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        sourceType: data.source_type, // 添加来源类型
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('查询失败:', error);
      const errorMessage = {
        text: '抱歉，处理您的请求时出现了错误。',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        sourceType: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordClick = (keyword) => {
    setInputValue(keyword);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
              {message.sender === 'user' ? (
                <UserAvatar size={32} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-purple-100 dark:bg-purple-900/50'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <div className={`${
                  message.sender === 'user'
                    ? 'text-purple-900 dark:text-purple-100'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {message.sender === 'user' ? (
                    <p className="text-sm">{message.text}</p>
                  ) : (
                    <>
                      {message.sourceType && message.sourceType !== 'error' && (
                        <div className="mb-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            message.sourceType === 'document' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : message.sourceType === 'hybrid'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {message.sourceType === 'document' 
                              ? '知识库返回'
                              : message.sourceType === 'hybrid'
                              ? '混合返回'
                              : '大模型返回'}
                          </span>
                        </div>
                      )}
                      <MarkdownRenderer content={message.text} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[70%] gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-lg animate-bounce">🤖</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框区域 */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        {/* 关键词提示 */}
        {keywords.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {keywords.slice(0, 5).map((keyword, index) => (
              <button
                key={index}
                onClick={() => handleKeywordClick(keyword)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-start space-x-4">
          <div className="flex-1 relative pb-8">
            <AnimatedInput
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleKeyPress();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="输入你的问题..."
              onComboChange={setCombo}
            />
          </div>
          <button
            type="submit"
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 self-start"
            disabled={!inputValue.trim()}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 transform rotate-45"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Combo显示 */}
      <ComboDisplay 
        combo={combo} 
        totalCount={totalCount}
        isInputFocused={isInputFocused}
      />
    </div>
  );
}

export default ChatInterface;
