import handlers from "./handlers";

// 仅在浏览器环境中创建 worker 实例
let worker;

// 导出 setupMockServer 函数
export const setupMockServer = async () => {
  if (typeof window !== 'undefined') {
    // 动态导入 msw/browser，确保只在浏览器环境中执行
    const { setupWorker } = await import("msw/browser");
    worker = setupWorker(...handlers);
    await worker.start();
    console.log('MSW worker started');
  }
};

export default worker;
