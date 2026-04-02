'use client';

import { useEffect, useRef } from 'react';

interface TooltipProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
  timeout?: number;
}

export default function Tooltip({
  show,
  title,
  message,
  onClose,
  type = 'info',
  timeout = 0
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 自动关闭功能
  useEffect(() => {
    if (show && timeout > 0) {
      const timer = setTimeout(onClose, timeout);
      return () => clearTimeout(timer);
    }
  }, [show, timeout, onClose]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  // 根据类型获取不同的样式
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          titleColor: 'text-red-600',
          borderColor: 'border-red-300',
          bgColor: 'bg-red-50'
        };
      case 'success':
        return {
          titleColor: 'text-green-600',
          borderColor: 'border-green-300',
          bgColor: 'bg-green-50'
        };
      case 'warning':
        return {
          titleColor: 'text-yellow-600',
          borderColor: 'border-yellow-300',
          bgColor: 'bg-yellow-50'
        };
      case 'info':
      default:
        return {
          titleColor: 'text-blue-600',
          borderColor: 'border-blue-300',
          bgColor: 'bg-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
      <div
        ref={tooltipRef}
        className={`rounded-lg shadow-xl p-6 max-w-md w-full border ${styles.borderColor} ${styles.bgColor}`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${styles.titleColor}`}>
          {title}
        </h3>
        <p className="text-gray-700 mb-6 whitespace-pre-wrap">
          {message}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
