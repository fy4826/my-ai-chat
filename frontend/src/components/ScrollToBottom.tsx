'use client';

import { useState, useEffect, useRef } from 'react';
import './ScrollToBottom.css';

interface ScrollToBottomProps {
  threshold?: number;
  arrowSize?: string;
  arrowColor?: string;
  position?: {
    bottom?: string;
    right?: string;
    left?: string;
    top?: string;
  };
  zIndex?: number;
  animationDuration?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  isLoading?: boolean;
}

const ScrollToBottom: React.FC<ScrollToBottomProps> = ({
  threshold = 50,
  arrowSize = '24px',
  arrowColor = '#333',
  containerRef,
  isLoading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 计算容器下方未显示内容的高度
  const calculateRemainingHeight = () => {
    if (!containerRef?.current) return 0;

    const container = containerRef.current;
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    return scrollHeight - (scrollTop + clientHeight);
  };

  // 防抖处理函数
  const debounce = (func: () => void, delay: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(func, delay);
  };

  // 滚动事件处理
  const handleScroll = () => {
    if (isScrolling) return;

    debounce(() => {
      const remainingHeight = calculateRemainingHeight();
      setIsVisible(remainingHeight > threshold);
    }, 100);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (!containerRef?.current) return;

    setIsScrolling(true);
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });

    // 滚动结束后重置状态
    setTimeout(() => {
      setIsScrolling(false);
      setIsVisible(false);
    }, 1000);
  };

  useEffect(() => {
    // 初始化时检查
    const remainingHeight = calculateRemainingHeight();
    setIsVisible(remainingHeight > threshold);

    // 添加滚动事件监听
    const container = containerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);

      // 清理函数
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }
  }, [threshold, containerRef]);

  return (
    <div style={{ position: 'relative', height: '0px' }}>
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '20px',
          background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
          zIndex: '999'
        }} />
      )}
      <div className={`scroll-to-bottom-container ${isVisible ? 'visible' : 'hidden'}`}>
        <div
          className={`button-container ${isLoading ? 'loading' : ''}`}
          style={{
            width: `${parseInt(arrowSize) + 6}px`,
            height: `${parseInt(arrowSize) + 6}px`
          }}
        >
          <button
            className="scroll-button"
            onClick={scrollToBottom}
            aria-label="滚动到底部"
          >
            <svg
              className="arrow-icon"
              style={{
                width: `${parseInt(arrowSize) * 0.7}px`,
                height: `${parseInt(arrowSize) * 0.7}px`,
                color: arrowColor
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrollToBottom;