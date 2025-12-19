import { expect, test } from '@rstest/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useChat } from '../src/hooks/useChat';

// Save original fetch
const originalFetch = global.fetch;

test('useChat initializes with empty messages', () => {
  const { result } = renderHook(() => useChat());

  expect(result.current.messages).toEqual([]);
  expect(result.current.input).toBe('');
  expect(result.current.isLoading).toBe(false);
});

test('useChat handles input changes', () => {
  const { result } = renderHook(() => useChat());

  act(() => {
    result.current.setInput('Hello AI');
  });

  expect(result.current.input).toBe('Hello AI');
});

test('useChat handles sendMessage with empty input', () => {
  const { result } = renderHook(() => useChat());

  act(() => {
    result.current.setInput('');
    result.current.sendMessage();
  });

  expect(result.current.messages).toEqual([]);
});

test('useChat handles sendMessage successfully', async () => {
  const mockResponse = {
    ok: true,
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"content":"Hello!"}\n\n'),
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
  };

  // Mock fetch
  global.fetch = () => Promise.resolve(mockResponse as unknown as Response);

  const { result } = renderHook(() => useChat());

  act(() => {
    result.current.setInput('Hello');
  });

  act(() => {
    result.current.sendMessage();
  });

  // Check if loading state is set
  expect(result.current.isLoading).toBe(true);

  // Check if user message is added
  expect(result.current.messages.length).toBe(1);
  expect(result.current.messages[0].role).toBe('user');
  expect(result.current.messages[0].content).toBe('Hello');

  // Check if input is cleared
  expect(result.current.input).toBe('');

  // Restore original fetch
  global.fetch = originalFetch;
});

test('useChat handles sendMessage with error', async () => {
  // Mock a failed fetch
  global.fetch = () => Promise.reject(new Error('Network error'));

  const { result } = renderHook(() => useChat());

  // Set input
  act(() => {
    result.current.setInput('Hello');
  });

  // Create a promise to track when sendMessage completes
  const sendMessageCompleted = new Promise<void>((resolve) => {
    // Override console.error to capture the error
    const originalError = console.error;
    console.error = (...args) => {
      originalError(...args);
      // When an error is logged, assume sendMessage completed
      resolve();
    };

    // Send message
    act(() => {
      result.current.sendMessage();
    });

    // Restore console.error after the test
    return () => {
      console.error = originalError;
    };
  });

  // Wait for the message to be sent and the error to be processed
  await sendMessageCompleted;

  // Wait for the loading state to reset
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  // Restore original fetch
  global.fetch = originalFetch;
});

test('useChat handles streaming response correctly', async () => {
  const mockResponse = {
    ok: true,
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"content":"Hel"}\n\n'),
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"content":"lo"}\n\n'),
        );
        controller.enqueue(
          new TextEncoder().encode('data: {"content":"!"}\n\n'),
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
  };

  // Mock fetch
  global.fetch = () => Promise.resolve(mockResponse as unknown as Response);

  const { result } = renderHook(() => useChat());

  act(() => {
    result.current.setInput('Hello');
    result.current.sendMessage();
  });

  // Restore original fetch
  global.fetch = originalFetch;
});
