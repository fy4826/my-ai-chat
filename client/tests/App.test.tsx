import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

// 简单测试 App 组件的渲染
test('App renders correctly', () => {
  render(<App />);

  // 检查页面标题是否存在
  expect(screen.getByText('My AI Chat (Rsbuild)')).toBeInTheDocument();

  // 检查输入框是否存在
  expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();

  // 检查发送按钮是否存在
  const sendButton = screen.getByRole('button');
  expect(sendButton).toBeInTheDocument();

  // 检查初始消息是否显示
  expect(screen.getByText('开始新的对话...')).toBeInTheDocument();
});
