import {
    ChatRequest,
    ChatResponse,
    Session,
    SseEventData,
} from "../../types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * 发送消息
 * @param request 聊天请求参数
 * @returns 聊天响应
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * 流式发送消息
 * @param request 聊天请求参数
 * @param onEvent 事件回调函数
 * @param onComplete 完成回调函数
 * @param onError 错误回调函数
 * @param signal 中止信号
 * @returns Promise
 */
export function sendMessageStream(
    request: ChatRequest,
    onEvent: (event: SseEventData) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("Response body is not a readable stream");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data:")) {
                            const data = line.substring(5).trim();
                            if (data) {
                                try {
                                    const eventData = JSON.parse(
                                        data,
                                    ) as SseEventData;
                                    onEvent(eventData);
                                } catch (parseError) {
                                    console.error(
                                        "Error parsing SSE message:",
                                        parseError,
                                    );
                                }
                            }
                        }
                    }
                }
            }
            if (done) {
                console.log(buffer);
            }

            onComplete?.();
            resolve();
        } catch (error) {
            console.error("Stream Error:", error);
            onError?.(
                error instanceof Error ? error : new Error(String(error)),
            );
            reject(error);
        }
    });
}

/**
 * 获取会话列表
 * @returns 会话列表
 */
export async function getSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * 获取单个会话
 * @param sessionId 会话ID
 * @returns 会话信息或 undefined（如果不存在）
 */
export async function getSession(
    sessionId: string,
): Promise<Session | undefined> {
    const response = await fetch(
        `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    if (!response.ok) {
        if (response.status === 404) {
            return undefined;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * 删除会话
 * @param sessionId 会话ID
 * @returns 删除结果
 */
export async function deleteSession(
    sessionId: string,
): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
        `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// 导出 API 对象
export const chatApi = {
    sendMessage,
    sendMessageStream,
    getSessions,
    getSession,
    deleteSession,
};

export default chatApi;
