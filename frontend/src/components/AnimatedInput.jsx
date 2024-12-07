import React, { useEffect, useRef, useState } from 'react';

function AnimatedInput({ 
  value, 
  onChange, 
  onKeyDown,
  onFocus,
  onBlur,
  placeholder,
  onComboChange
}) {
  const inputRef = useRef(null);
  const lastKeyPressTime = useRef(Date.now());
  const comboCount = useRef(0);
  const comboResetTimeout = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const adjustHeight = () => {
      const input = inputRef.current;
      if (!input) return;
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
    };

    adjustHeight();
  }, [value]);

  useEffect(() => {
    if (value.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [value]);

  const handleKeyPress = (e) => {
    const now = Date.now();
    const timeDiff = now - lastKeyPressTime.current;
    
    if (timeDiff < 500) {
      comboCount.current += 1;
      onComboChange(comboCount.current);
      
      if (comboResetTimeout.current) {
        clearTimeout(comboResetTimeout.current);
      }
    } else {
      comboCount.current = 0;
      onComboChange(0);
    }
    
    comboResetTimeout.current = setTimeout(() => {
      comboCount.current = 0;
      onComboChange(0);
    }, 500);
    
    lastKeyPressTime.current = now;
  };

  return (
    <div className="relative">
      <style>
        {`
          .hide-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          @keyframes cursor-blink {
            0%, 100% { border-color: transparent; }
            50% { border-color: rgb(168 85 247); }
          }
          
          .typing-animation {
            border-right: 2px solid;
            animation: cursor-blink 1s step-end infinite;
          }
        `}
      </style>
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyPress={handleKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={1}
        className={`${isTyping ? 'typing-animation' : ''} w-full min-h-[48px] max-h-[200px] p-3 bg-white dark:bg-gray-800 rounded-xl shadow-inner
          border-2 border-transparent
          focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
          transition-all duration-300 ease-in-out
          resize-none hide-scrollbar
          placeholder-gray-400 dark:placeholder-gray-500
          text-gray-900 dark:text-white
          outline-none`}
        style={{
          overflowY: 'auto',
        }}
      />
      <div className="absolute left-0 -bottom-6 text-sm text-gray-500 dark:text-gray-400">
        {value.length > 0 && `${value.length} 个字符`}
      </div>
    </div>
  );
}

export default AnimatedInput;
