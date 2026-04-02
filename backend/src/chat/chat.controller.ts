import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Logger,
  Res,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto, Session } from './dto/chat.dto';

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {
    this.logger.log('ChatController initialized');
  }

  // 处理聊天请求（SSE方式）
  @Post('stream')
  async chatStream(@Body() request: ChatRequestDto, @Res() res: any) {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 发送初始化事件
    res.write(
      `event: initialize\ndata: ${JSON.stringify({ status: 'starting' })}\n\n`,
    );

    try {
      // 调用服务处理聊天请求，使用流式回调
      const result = await this.chatService.handleChatStream(
        request,
        (event) => {
          res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        },
      );

      // 发送分离结果事件
      res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);

      // 发送完成事件
      res.write(
        `event: complete\ndata: ${JSON.stringify({ status: 'completed' })}\n\n`,
      );
    } catch (error) {
      this.logger.error('Error handling chat stream request:', error);

      // 提取详细的错误信息
      let errorMessage = 'Failed to generate streaming response';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // 处理 OpenAI 认证错误等复杂错误对象
        if ('error' in error && typeof error.error === 'object') {
          errorMessage = error.error.message || errorMessage;
        } else if ('message' in error) {
          errorMessage = String(error.message);
        }
      }

      // 发送错误事件
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`,
      );
    } finally {
      // 结束响应
      res.end();
    }
  }

  // 处理聊天请求（传统方式，保留以兼容旧客户端）
  @Post()
  async chat(@Body() request: ChatRequestDto): Promise<any> {
    this.logger.log(
      `Received chat request: ${request.message.substring(0, 50)}...`,
    );
    try {
      const response = await this.chatService.handleChat(request);
      this.logger.log(
        `Generated response: ${response.content.substring(0, 50)}...`,
      );
      return response;
    } catch (error) {
      this.logger.error('Error handling chat request:', error);
      throw error;
    }
  }

  // 获取所有会话
  @Get('sessions')
  async getSessions(): Promise<Session[]> {
    this.logger.log('Getting all sessions');
    return this.chatService.getAllSessions();
  }

  // 获取特定会话
  @Get('sessions/:id')
  async getSession(@Param('id') id: string): Promise<Session | undefined> {
    this.logger.log(`Getting session: ${id}`);
    return this.chatService.getSessionHistory(id);
  }

  // 删除会话
  @Delete('sessions/:id')
  async deleteSession(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting session: ${id}`);
    const result = this.chatService.clearSession(id);
    return {
      success: result,
      message: result ? 'Session deleted' : 'Session not found',
    };
  }
}
