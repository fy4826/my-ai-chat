import { Injectable, Logger } from '@nestjs/common';
import { ChatRequestDto, ChatResponseDto, Session } from './dto/chat.dto';
import { createModel, DEFAULT_MODELS, ModelType } from 'shared';
import { generateId } from 'shared';

// 定义流式事件类型
export interface StreamEvent {
  type: 'reasoning' | 'content' | 'done';
  text: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly sessions = new Map<string, Session>();

  constructor() {
    this.logger.log('ChatService initialized');
  }

  // 处理聊天请求（传统方式）
  async handleChat(request: ChatRequestDto): Promise<any> {
    try {
      // 获取或创建会话
      const session = this.getOrCreateSession(request.sessionId);

      // 添加用户消息到会话
      session.messages.push({
        role: 'user',
        content: request.message,
      });
      session.updatedAt = Date.now();

      // 创建模型实例
      const modelName = request.model || 'qwen3';
      const modelConfig = { ...DEFAULT_MODELS[modelName] };

      // 日志输出，确认接收到的模型和API key信息
      this.logger.log(
        `Received chat request: model=${modelName}, apiKeyProvided=${!!request.apiKey}`,
      );

      // 如果提供了API key，添加到配置中
      if (request.apiKey) {
        modelConfig.apiKey = request.apiKey;
        this.logger.log(`Using provided API key for model: ${modelName}`);
      } else if (modelConfig.type !== ModelType.OLLAMA) {
        // 对于需要API key的模型，如果没有提供，抛出错误
        this.logger.error(`API key is required for model: ${modelName}`);
        throw new Error(`API key is required for model: ${modelName}`);
      }

      let model;
      try {
        model = createModel(modelConfig);
        this.logger.log(`Model created successfully: ${modelName}`);
      } catch (error) {
        this.logger.error('Model initialization error:', error);
        if (error instanceof Error && error.message.includes('API key')) {
          throw new Error('Invalid API key provided');
        }
        throw error;
      }

      // 构建提示
      const prompt = this.buildPrompt(session.messages);

      // 调用模型生成响应
      const response = await model.invoke(prompt);

      // 提取响应内容
      const responseContent =
        typeof response === 'string'
          ? response
          : response.content?.toString() || 'No response';

      // 分离思考部分和正文部分
      let thinking: string | undefined;
      let content: string = responseContent;

      // 添加助手消息到会话
      session.messages.push({
        role: 'assistant',
        content: content,
        thinking: thinking,
      });
      session.updatedAt = Date.now();

      // 保存会话
      this.sessions.set(session.id, session);

      // 构建响应
      return {
        id: generateId(),
        content: content,
        thinking: thinking,
        sessionId: session.id,
        metadata: {
          model: DEFAULT_MODELS.qwen3.model,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error('Error handling chat request:', error);
      throw new Error('Failed to generate response');
    }
  }

  // 处理聊天请求（流式方式）
  async handleChatStream(
    request: ChatRequestDto,
    onEvent: (event: StreamEvent) => void,
  ): Promise<{ content: string; thinking?: string }> {
    try {
      // 获取或创建会话
      const session = this.getOrCreateSession(request.sessionId);

      // 添加用户消息到会话
      session.messages.push({
        role: 'user',
        content: request.message,
      });
      session.updatedAt = Date.now();

      // 创建模型实例
      const modelName = request.model || 'qwen3';
      const modelConfig = { ...DEFAULT_MODELS[modelName] };

      // 日志输出，确认接收到的模型和API key信息
      this.logger.log(
        `Received chat stream request: model=${modelName}, apiKeyProvided=${!!request.apiKey}`,
      );

      // 如果提供了API key，添加到配置中
      if (request.apiKey) {
        modelConfig.apiKey = request.apiKey;
        this.logger.log(`Using provided API key for model: ${modelName}`);
      } else if (modelConfig.type !== ModelType.OLLAMA) {
        // 对于需要API key的模型，如果没有提供，抛出错误
        this.logger.error(`API key is required for model: ${modelName}`);
        throw new Error(`API key is required for model: ${modelName}`);
      }

      let model;
      try {
        model = createModel(modelConfig);
        this.logger.log(`Model created successfully: ${modelName}`);
      } catch (error) {
        this.logger.error('Model initialization error:', error);
        if (error instanceof Error && error.message.includes('API key')) {
          throw new Error('Invalid API key provided');
        }
        throw error;
      }

      // 构建提示
      const prompt = this.buildPrompt(session.messages);
      console.log('prompt:', prompt);
      // 流式调用模型
      const response = await model.stream(prompt);

      // 收集完整响应
      let fullResponse = '';
      let thinkingContent = '';
      let finalContent = '';

      // --- 状态机解析逻辑 ---
      let buffer = '';
      let isThinking = true; // 默认处于思考状态，直到遇到 ###ANSWER### 标记
      const ANSWER_TAG = '###ANSWER###';
      let first = true;

      // 处理流式响应
      for await (const chunk of response) {
        // 处理 ChatOllama 返回的数据类型
        let chunkContent = '';

        if (typeof chunk === 'string') {
          // 字符串类型
          chunkContent = chunk;
        } else if (chunk.content) {
          // AIMessageChunk 类型，具有 content 属性
          chunkContent = chunk.content?.toString() || '';
        } else if (chunk.text) {
          // 其他可能的格式，具有 text 属性
          chunkContent = chunk.text?.toString() || '';
        }

        if (!chunkContent) continue;

        buffer += chunkContent;
        fullResponse += chunkContent;

        // 如果正在思考模式中
        if (isThinking) {
          // 检测 ###ANSWER### 标记
          if (buffer.includes(ANSWER_TAG)) {
            const [thought, rest] = buffer.split(ANSWER_TAG);

            if (thought) {
              onEvent({ type: 'reasoning', text: thought });
              thinkingContent += thought;
            }

            // 思考结束，进入回答模式
            isThinking = false;
            buffer = rest; // 剩下的就是正式回答

            // 剩下的部分立即输出为 content
            if (buffer) {
              onEvent({ type: 'content', text: buffer });
              finalContent += buffer;
              buffer = '';
            }
          } else {
            // 简单策略：直接输出思考内容，因为我们不需要担心标签被切断的问题
            // 为了演示效果流畅，我们尽量实时输出 reasoning
            onEvent({ type: 'reasoning', text: buffer });
            thinkingContent += buffer;
            buffer = '';
          }
        } else {
          // 回答模式，直接输出内容
          onEvent({ type: 'content', text: buffer });
          finalContent += buffer;
          buffer = '';
        }
      }

      // 循环结束，清理 buffer
      if (buffer) {
        // 处理剩余的 buffer
        if (isThinking) {
          // 如果还在思考状态，检查是否包含 ###ANSWER### 标记
          if (buffer.includes(ANSWER_TAG)) {
            const [thought, rest] = buffer.split(ANSWER_TAG);

            if (thought) {
              onEvent({ type: 'reasoning', text: thought });
              thinkingContent += thought;
            }

            if (rest) {
              onEvent({ type: 'content', text: rest });
              finalContent += rest;
            }
          } else {
            onEvent({ type: 'reasoning', text: buffer });
            thinkingContent += buffer;
          }
        } else {
          onEvent({ type: 'content', text: buffer });
          finalContent += buffer;
        }
      }

      // 发送完成事件
      onEvent({ type: 'done', text: '' });

      // 整理最终内容
      const content = finalContent.trim();
      const thinking = thinkingContent.trim() || undefined;

      // 添加助手消息到会话
      session.messages.push({
        role: 'assistant',
        content: content,
        thinking: thinking,
      });
      session.updatedAt = Date.now();

      // 保存会话
      this.sessions.set(session.id, session);

      return {
        content: content,
        thinking: thinking,
      };
    } catch (error) {
      this.logger.error('Error generating streaming response:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate streaming response');
    }
  }

  // 获取或创建会话
  private getOrCreateSession(sessionId?: string): Session {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const newSession: Session = {
      id: sessionId || generateId(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  // 构建提示
  private buildPrompt(
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>,
  ): Array<{ role: string; content: string }> {
    // 系统指令，要求大模型用think标签包裹所有思考过程

    // 构建消息数组，用于 ChatOllama
    const chatMessages = [...messages];

    return chatMessages;
  }

  // 获取会话历史
  getSessionHistory(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  // 清除会话
  clearSession(sessionId: string) {
    return this.sessions.delete(sessionId);
  }

  // 获取所有会话
  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}
