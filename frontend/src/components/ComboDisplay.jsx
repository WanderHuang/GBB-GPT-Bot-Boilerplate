import React, { useEffect, useState } from 'react';

function ComboDisplay({ combo, totalCount, isInputFocused }) {
  const [visible, setVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);

  useEffect(() => {
    if (combo > 0 && isInputFocused) {
      setVisible(true);
      
      // 清除之前的定时器
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      // 设置3秒后隐藏
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      setHideTimeout(timeout);
    }
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [combo, isInputFocused]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 flex flex-col items-end space-y-2">
      <div className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 animate-bounce">
        <span className="text-2xl font-bold">{combo}x</span> Combo!
      </div>
      {totalCount > 0 && (
        <div className="bg-purple-400/80 text-white px-3 py-1 rounded-md text-sm">
          Total: {totalCount} chars
        </div>
      )}
    </div>
  );
}

export default ComboDisplay;
