import { IsString, IsOptional } from 'class-validator';

// 会话接口
export interface Session {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    thinking?: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

// 聊天请求DTO
export class ChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  metadata?: any;
}

// 聊天响应DTO
export class ChatResponseDto {
  id: string;
  content: string;
  thinking?: string;
  sessionId: string;
  metadata?: any;
}

// 消息DTO
export class MessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  timestamp: number;
  metadata?: any;
}
