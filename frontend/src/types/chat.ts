export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    thinking?: string;
    timestamp: number;
    metadata?: any;
}

export interface ChatRequest {
    message: string;
    sessionId?: string;
    model?: string;
    apiKey?: string;
    metadata?: any;
}

export interface ChatResponse {
    id: string;
    content: string;
    sessionId: string;
    metadata?: any;
}

export interface Session {
    id: string;
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    createdAt: number;
    updatedAt: number;
}

// 定义流式事件类型
export interface StreamEvent {
    type: "reasoning" | "content" | "done";
    text: string;
}

// 定义 SSE 事件数据类型
export interface SseEventData {
    event: string;
    text?: string;
    content?: string;
    thinking?: string;
    chunk?: string;
    error?: string;
}
