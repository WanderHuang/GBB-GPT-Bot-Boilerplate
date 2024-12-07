import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

function FileUpload() {
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    // 重置状态
    setUploadStatus('');
    setError('');

    // 一次只处理一个文件
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);  // 使用 'file' 而不是 'files'

    setUploadStatus('正在上传...');

    fetch(`${process.env.REACT_APP_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.detail || '上传失败');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Upload successful:', data);
      setUploadStatus('上传成功！');
    })
    .catch(error => {
      console.error('Upload failed:', error);
      setError(error.message || '上传失败，请重试');
      setUploadStatus('');
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub']
    },
    multiple: false  // 一次只允许上传一个文件
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">文档上传</h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200
          ${isDragActive 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-400'
          }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className={`h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4 ${isDragActive ? 'text-purple-500' : ''}`} />
        <p className={`text-sm ${isDragActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {isDragActive
            ? "放开以上传文件..."
            : "拖放 PDF 或 EPUB 文件到这里，或点击选择文件"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          支持的格式：PDF, EPUB
        </p>
      </div>
      {uploadStatus && (
        <p className="mt-4 text-sm text-center text-purple-600 dark:text-purple-400">
          {uploadStatus}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-center text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
