import React, { useEffect, useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

function UserAvatar({ size = 32, seed }) {
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const generateAvatar = async () => {
      try {
        // 从 localStorage 获取或生成新的种子
        const storedSeed = localStorage.getItem('userAvatarSeed') || generateRandomSeed();
        const finalSeed = seed || storedSeed;

        if (!localStorage.getItem('userAvatarSeed')) {
          localStorage.setItem('userAvatarSeed', finalSeed);
        }

        const avatar = createAvatar(lorelei, {
          seed: finalSeed,
          size: size,
          backgroundColor: ['b6e3f4','c0aede','d1d4f9'],
        });

        const svg = avatar.toString();
        const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        setAvatarUrl(url);
      } catch (error) {
        console.error('Error generating avatar:', error);
      }
    };

    generateAvatar();
  }, [size, seed]);

  const generateRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  return (
    <div 
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="User avatar" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-purple-200 animate-pulse" />
      )}
    </div>
  );
}

export default UserAvatar;
