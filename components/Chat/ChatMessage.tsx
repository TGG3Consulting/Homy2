'use client';

import { ChatMessage as ChatMessageType } from '@/lib/types';
import PropertyGrid from '../Properties/PropertyGrid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}>
      <div className={`${isUser ? 'max-w-[70%]' : 'max-w-[85%]'} ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-md'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Заголовки
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-gray-900 mb-3 mt-2 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-3 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-gray-700 mb-2 mt-2">{children}</h3>
                  ),

                  // Параграфы
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),

                  // Списки
                  ul: ({ children }) => (
                    <ul className="list-none space-y-1 mb-3 ml-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 mb-3 ml-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{children}</span>
                    </li>
                  ),

                  // Ссылки
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300 hover:decoration-emerald-500 transition-colors"
                    >
                      {children}
                    </a>
                  ),

                  // Жирный и курсив
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-700">{children}</em>
                  ),

                  // Код
                  code: ({ className, children }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-gray-100 text-emerald-700 px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-50 rounded-lg mb-3 overflow-hidden">{children}</pre>
                  ),

                  // Таблицы - красивые!
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-3 rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-emerald-50 to-emerald-50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-white divide-y divide-gray-100">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-gray-50 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {children}
                    </td>
                  ),

                  // Горизонтальная линия
                  hr: () => (
                    <hr className="my-4 border-gray-200" />
                  ),

                  // Цитаты
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-emerald-400 pl-4 py-1 my-3 bg-emerald-50 rounded-r-lg italic text-gray-700">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div
          className={`text-xs text-gray-400 mt-1.5 ${
            isUser ? 'text-right pr-1' : 'text-left pl-1'
          }`}
        >
          {timestamp}
        </div>

        {/* Property Grid for assistant messages with properties */}
        {!isUser && message.properties && message.properties.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm p-2">
            <PropertyGrid properties={message.properties} />
          </div>
        )}
      </div>
    </div>
  );
}
