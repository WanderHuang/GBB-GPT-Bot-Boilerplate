import React from 'react';
import profileImage from '../assets/profile.png';

function Profile() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
        <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-transparent bg-clip-text">
          Wander + windsurf
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">作品</span>
      </h2>
      <div className="flex items-start space-x-4">
        <img
          src={profileImage}
          alt="AI Assistant Profile"
          className="w-20 h-20 rounded-lg object-cover shadow-lg flex-shrink-0"
        />
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Windsurf是一款革新性的智能文档管理工具，结合了AI的强大能力。它能够智能解析PDF和EPUB文档，
            通过自然语言交互，帮助用户快速定位和理解文档内容，让文档管理和信息检索变得轻松高效。
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
              智能问答
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
              文档解析
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
