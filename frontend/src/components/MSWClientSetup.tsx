'use client';

import { useEffect } from 'react';

const MSWClientSetup = () => {
  useEffect(() => {
    // 仅在浏览器环境中运行，并且当使用mock时
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      // 动态导入MSW设置，确保只在客户端执行
      import('../mock/setup').then(({ setupMockServer }) => {
        setupMockServer();
      });
    }
  }, []);

  return null;
};

export default MSWClientSetup;