'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChatRequest, SseEventData } from '../types/chat';
import { chatApi } from '../lib/services/chat-api';
import InputArea from './InputArea';
import MessageList from './MessageList';
import Tooltip from './Tooltip';
import ScrollToBottom from './ScrollToBottom';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const StreamChatInterface: React.FC = () => {
  // 状态管理
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    thinking?: string;
    role: 'user' | 'assistant';
    timestamp: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<string>('qwen3');
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  } | null>(null);

  // 引用管理
  const abortControllerRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messageBufferRef = useRef<Array<{ type: string; text: string }>>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 显示错误提示
  const showError = useCallback((message: string) => {
    setError({
      show: true,
      title: "发送失败",
      message: message,
      type: 'error'
    });
  }, []);

  // 取消请求
  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      showError('请求已取消');
    }
  }, [showError]);

  // 清除对话
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    abortControllerRef.current = null;
  }, []);

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // 创建 AbortController 实例
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    // 添加用户消息
    const userMessage = {
      id: generateId(),
      content: content,
      role: 'user' as const,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 创建临时的助手消息用于显示流式内容
    const assistantMessageId = generateId();
    const tempAssistantMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant' as const,
      timestamp: Date.now(),
    };

    // 添加临时助手消息
    setMessages((prev) => [...prev, tempAssistantMessage]);

    // 准备请求参数
    const request: ChatRequest = {
      message: content,
      sessionId,
      model: selectedModel,
      apiKey: selectedModel !== 'qwen3' ? apiKey : undefined,
    };

    const signal = controller.signal;

    try {
      // 日志输出，确认发送到后端的模型和API key信息
      console.log('Sending message with:', {
        model: selectedModel,
        apiKeyProvided: !!apiKey,
        message: content
      });

      // 初始化变量
      let fullContent = '';
      let fullThinking = '';

      // 使用 chatApi 发送流式消息
      await chatApi.sendMessageStream(
        request,
        (eventData: SseEventData) => {
          // 处理流式事件
          if (
            eventData.event === "reasoning" ||
            eventData.event === "content" ||
            eventData.event === "done"
          ) {
            const event = {
              type: eventData.event,
              text: eventData.text
            };

            if (event.type === 'reasoning') {
              fullThinking += event.text;
            } else if (event.type === 'content') {
              fullContent += event.text;
            }

            // 使用 requestAnimationFrame 更新状态
            if (messageBufferRef.current.length > 0) {
              if (animationFrameRef.current === null) {
                animationFrameRef.current = requestAnimationFrame(() => {
                  const events = [...messageBufferRef.current];
                  messageBufferRef.current = [];
                  animationFrameRef.current = null;

                  events.forEach(event => {
                    if (event.type === 'reasoning') {
                      fullThinking += event.text;
                    } else if (event.type === 'content') {
                      fullContent += event.text;
                    }
                  });

                  // 更新消息列表
                  setMessages(prev => {
                    return prev.map((msg) => {
                      if (msg.id === assistantMessageId) {
                        return {
                          ...msg,
                          content: fullContent,
                          thinking: fullThinking,
                        };
                      }
                      return msg;
                    });
                  });
                });
              }
            } else {
              // 直接更新消息列表
              setMessages(prev => {
                return prev.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: fullContent,
                      thinking: fullThinking,
                    };
                  }
                  return msg;
                });
              });
            }
          }
          // 处理分离结果事件
          if (eventData.event === "result" && eventData.content) {
            fullContent = eventData.content || '';
            fullThinking = eventData.thinking || '';

            // 更新消息列表
            setMessages(prev => {
              return prev.map((msg) => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: fullContent,
                    thinking: fullThinking,
                  };
                }
                return msg;
              });
            });
          }
          // 兼容旧格式
          if (eventData.event === "message" && eventData.chunk) {
            fullContent += eventData.chunk;

            // 更新消息列表
            setMessages(prev => {
              return prev.map((msg) => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: fullContent,
                    thinking: fullThinking,
                  };
                }
                return msg;
              });
            });
          }
          // 处理错误事件
          if (eventData.event === "error" && eventData.error) {
            showError(eventData.error);

            // 在聊天界面显示错误信息
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: `发送失败: ${eventData.error}` }
                  : msg
              )
            );
          }
        },
        () => {
          // 流式传输完成
          console.log('Stream completed');
          // 打印最后的数据
          console.log('Final content:', fullContent);
          console.log('Final thinking:', fullThinking);
          setIsLoading(false);
          abortControllerRef.current = null;
        },
        (error) => {
          // 处理错误
          console.error('Stream error:', error);
          showError(error.message);

          // 在聊天界面显示错误信息
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: `发送失败: ${error.message}` }
                : msg
            )
          );

          setIsLoading(false);
          abortControllerRef.current = null;
        },
        signal
      );
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showError(error.message);

        // 在聊天界面显示错误信息
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `发送失败: ${error.message}` }
              : msg
          )
        );
      }
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, selectedModel, apiKey, showError]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* 错误提示 - 使用全局 Tooltip 组件 */}
      {error && (
        <Tooltip
          show={error.show}
          title={error.title}
          message={error.message}
          type={error.type}
          onClose={clearError}
        />
      )}

      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI 对话助手</h1>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* 模型选择 */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="model" className="text-sm font-medium text-gray-700">模型：</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="qwen3">Qwen3 (本地)</option>
              <option value="qwen3Max">Qwen3 Max (API)</option>
              <option value="gpt35">GPT-3.5 Turbo (API)</option>
              <option value="gpt4">GPT-4 (API)</option>
              <option value="claude3">Claude 3 (API)</option>
            </select>
          </div>

          {/* API Key 输入 */}
          {(selectedModel !== 'qwen3') && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label htmlFor="apiKey" className="text-sm font-medium text-gray-700">API Key：</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入 API Key"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              清除对话
            </button>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={messagesContainerRef}
        style={{
          position: 'relative',
          overflowAnchor: 'none',
          scrollBehavior: 'auto',
        }}
      >
        <MessageList messages={messages} isLoading={isLoading} containerRef={messagesContainerRef} />
      </div>

      <ScrollToBottom
        containerRef={messagesContainerRef}
        threshold={50}
        arrowSize="28px"
        arrowColor="#666"
        isLoading={isLoading}
      />

      <InputArea
        onSendMessage={handleSendMessage}
        onCancelRequest={handleCancelRequest}
        isLoading={isLoading}
        placeholder="输入消息与AI对话... 按 Enter 发送，Shift + Enter 换行"
      />
    </div>
  );
};

export default StreamChatInterface;