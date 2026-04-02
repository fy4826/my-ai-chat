'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => Promise<void>;
  onCancelRequest?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

// 功能配置对象，包含各功能的名称和对应的提示词模板
const featureConfigs = [
  {
    id: 'search',
    name: '搜索',
    prompt: '请搜索以下内容，并提供详细的搜索结果：{content}'
  },
  {
    id: 'code',
    name: '代码生成',
    prompt: '请根据以下需求生成代码，并提供详细的代码注释：{content}'
  },
  {
    id: 'document',
    name: '文档分析',
    prompt: '请分析以下文档内容，并提供详细的分析结果：{content}'
  },
  {
    id: 'translate',
    name: '翻译',
    prompt: '请将以下内容翻译成中文，并保持原文的风格和准确性：{content}'
  }
];

export default function InputArea({
  onSendMessage,
  onCancelRequest,
  isLoading,
  placeholder = '输入消息...',
}: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // 点击外部关闭工具菜单和/触发菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target as Node)) {
        setShowToolMenu(false);
      }
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target as Node)) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    let messageToSend = message.trim();
    
    // 检查是否包含功能触发词
    for (const feature of featureConfigs) {
      if (messageToSend.startsWith(`/${feature.id} `)) {
        // 提取用户输入内容
        const content = messageToSend.substring(`/${feature.id} `.length);
        // 替换提示词模板中的变量占位符
        messageToSend = feature.prompt.replace('{content}', content);
        break;
      }
    }

    setMessage('');
    setShowSlashMenu(false);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      setMessage(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // 检查是否以/开头且后面没有其他内容，显示/触发菜单
    if (value === '/') {
      setShowSlashMenu(true);
    } else if (!value.startsWith('/')) {
      setShowSlashMenu(false);
    }
  };

  const toggleDeepThinking = () => {
    setIsDeepThinking(!isDeepThinking);
  };

  const toggleToolMenu = () => {
    setShowToolMenu(!showToolMenu);
    setShowSlashMenu(false);
  };

  const handleFeatureSelect = (feature: typeof featureConfigs[0]) => {
    // 清空输入框并添加功能提示词模板
    setMessage(`/${feature.id} `);
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    let messageToSend = message.trim();
    
    // 检查是否包含功能触发词
    for (const feature of featureConfigs) {
      if (messageToSend.startsWith(`/${feature.id} `)) {
        // 提取用户输入内容
        const content = messageToSend.substring(`/${feature.id} `.length);
        // 替换提示词模板中的变量占位符
        messageToSend = feature.prompt.replace('{content}', content);
        break;
      }
    }

    setMessage('');
    setShowSlashMenu(false);

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      setMessage(message.trim());
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="border border-gray-300 rounded-lg p-4">
        <form id="chat-form" onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 resize-none focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            
            {/* /触发菜单 */}
            {showSlashMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50" ref={slashMenuRef}>
                {featureConfigs.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => handleFeatureSelect(feature)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                  >
                    <span className="text-gray-500">/{feature.id}</span>
                    <span>{feature.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* 按钮区 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* 深度思考按钮 */}
            <button
              type="button"
              onClick={toggleDeepThinking}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isDeepThinking
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              深度思考
            </button>

            {/* 工具图标按钮 */}
            <div className="relative" ref={toolMenuRef}>
              <button
                type="button"
                onClick={toggleToolMenu}
                disabled={isLoading}
                className="w-10 h-10 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* 工具下拉菜单 */}
              {showToolMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    搜索
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    代码生成
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    文档分析
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    翻译
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 提交/取消按钮 */}
          {isLoading ? (
            <button
              type="button"
              onClick={() => onCancelRequest?.()}
              className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              form="chat-form"
              disabled={!message.trim()}
              className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
