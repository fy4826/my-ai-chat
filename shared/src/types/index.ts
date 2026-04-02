// 聊天消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: any;
}

// 聊天会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: any;
}

// 聊天请求类型
export interface ChatRequest {
  message: string;
  sessionId?: string;
  metadata?: any;
}

// 聊天响应类型
export interface ChatResponse {
  id: string;
  content: string;
  sessionId: string;
  metadata?: any;
}

// 文档上传请求类型
export interface DocumentUploadRequest {
  files: File[];
  metadata?: any;
}

// 文档上传响应类型
export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: 'success' | 'error';
  message?: string;
}

// 检索结果类型
export interface RetrievalResult {
  documentId: string;
  content: string;
  score: number;
  metadata?: any;
}

// 错误响应类型
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}
