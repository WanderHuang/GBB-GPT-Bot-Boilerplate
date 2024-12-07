import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-2"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 rounded`} {...props}>
              {children}
            </code>
          );
        },
        // 自定义其他 Markdown 元素的样式
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        a: ({ children, href }) => (
          <a href={href} className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
        img: ({ src, alt }) => (
          <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 my-4">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
