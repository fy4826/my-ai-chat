'use client';
import { useRef, useEffect, RefObject, memo, useLayoutEffect } from 'react';
import { useVirtualizer, defaultRangeExtractor, Range } from '@tanstack/react-virtual';
import { ChatMessage } from '../types/chat';
import { markdownToReact } from '../lib/utils/markdown';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  containerRef: RefObject<HTMLDivElement>; // 设为必选，简化逻辑
}

// 1. 抽离时间格式化，避免重复计算
const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

// 2. 使用 memo 包裹消息内容，防止历史消息在流式输出时重新渲染
const MessageContent = memo(({ message }: { message: ChatMessage }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('code-block-copy')) {
        const code = target.dataset.code;
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            const oldText = target.textContent;
            target.textContent = 'Copied!';
            setTimeout(() => target.textContent = oldText, 2000);
          });
        }
      }
    };

    const handleToggle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('code-block-toggle')) {
        const container = target.closest('.code-block-container');
        const pre = container?.querySelector('pre');
        if (pre) {
          pre.classList.toggle('collapsed');
          target.classList.toggle('collapsed');
          target.textContent = target.classList.contains('collapsed') ? '^' : '^';
        }
      }
    };

    const el = contentRef.current;
    el?.addEventListener('click', handleCopy);
    el?.addEventListener('click', handleToggle);
    return () => {
      el?.removeEventListener('click', handleCopy);
      el?.removeEventListener('click', handleToggle);
    };
  }, []);

  return (
    <div ref={contentRef} className="prose prose-sm max-w-none break-words">
      {message.thinking && (
        <div className="bg-gray-50 border-l-2 border-gray-300 p-2 rounded text-sm italic mb-2 text-gray-600">
          <span className="font-medium not-italic">思考：</span>
          {markdownToReact(message.thinking)}
        </div>
      )}
      {message.role === 'assistant' ? markdownToReact(message.content) : message.content}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

export default function MessageList({ messages, isLoading, containerRef }: MessageListProps) {
  const isUserScrolled = useRef(false);
  const lastScrollTop = useRef(0);

  // 分离历史消息和正在流式输出的消息
  const showStreamingLast = isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant';
  const historyMessages = showStreamingLast ? messages.slice(0, -1) : messages;
  const streamingMessage = showStreamingLast ? messages[messages.length - 1] : null;

  const virtualizer = useVirtualizer({
    count: historyMessages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 100, // 预估高度
    overscan: 10,
    // 关键：当消息列表长度变化时，通知虚拟列表
    getItemKey: (index) => historyMessages[index].id || index,
  });

  // 3. 监听滚动状态：判断用户是否在向上看历史
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      // 检查当前滚动位置
      const { scrollTop, scrollHeight, clientHeight } = el;
      // 向上滚动时，标记用户在手动浏览
      if (scrollTop < lastScrollTop.current) {
        // 如果距离底部超过一定距离，认为用户在向上看
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        if (!isNearBottom) {
          isUserScrolled.current = true;
        }
      }
      // 如果滚动回到底部附近，自动恢复自动滚动模式
      const atBottom = scrollHeight - scrollTop - clientHeight < 200;
      if (atBottom) {
        isUserScrolled.current = false;
      }
      lastScrollTop.current = scrollTop;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef]);

  // 4. 自动滚动逻辑：适配流式输出
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || isUserScrolled.current) return;

    // AI 正在输出或新消息到达时，滚动到底部
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'auto', // AI 对话建议用 auto，smooth 会有延迟感
    });
  }, [messages, streamingMessage?.content]); // 监听内容变化实现实时跟随

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-20">💬</div>
          <p>新对话，新启发</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 虚拟化区域 */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const msg = historyMessages[virtualRow.index];
          const isUser = msg.role === 'user';

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} p-4`}>
                <div className={`max-w-[95%] rounded-2xl px-4 py-2 shadow-sm ${isUser ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white border border-gray-100 text-gray-800'
                  }`}>
                  <MessageContent message={msg} />
                  <div className={`text-[10px] mt-1 opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 非虚拟化区域：正在输出的消息（永远在最后） */}
      {streamingMessage && (
        <div className="flex justify-start p-4">
          <div className="max-w-[95%] rounded-2xl px-4 py-2 bg-white border border-gray-100 text-gray-800 shadow-sm">
            <MessageContent message={streamingMessage} />
            <div className="text-[10px] mt-1 text-gray-400">正在输入...</div>
          </div>
        </div>
      )}

      {/* 占位符：处理 Loading 状态 */}
      {isLoading && !streamingMessage && (
        <div className="p-4 flex justify-start">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex gap-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      )}

      {/* 底部间距 */}
      <div className="h-4" />
    </div>
  );
}