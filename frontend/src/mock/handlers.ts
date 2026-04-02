import { http, HttpResponse } from "msw";
import mockData from "./data/chat.json";

// 模拟数据
const { sessions, chatResponse, streamEvents } = mockData;

// 模拟流式响应的延迟函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 定义 handlers
const handlers = [
    // 处理普通聊天请求
    http.post("/api/chat", async ({ request }) => {
        // 模拟网络延迟
        await delay(500);

        const requestData = (await request.json()) as any;

        return HttpResponse.json(
            {
                ...chatResponse,
                content: `模拟响应：${requestData.message}`,
                model: requestData.model || "qwen3",
            },
            { status: 200 },
        );
    }),

    // 处理流式聊天请求
    http.post("/api/chat/stream", async () => {
        // 模拟网络延迟
        await delay(100);

        // 模拟真实的流式传输，逐段发送事件
        const stream = new ReadableStream({
            async start(controller) {
                for (const event of streamEvents) {
                    // 构建 SSE 格式的事件
                    const eventString = `data: ${JSON.stringify({ event: event.type, text: event.text })}\n\n`;
                    const encoder = new TextEncoder();
                    const chunk = encoder.encode(eventString);
                    // 发送当前事件
                    controller.enqueue(chunk);
                    // 模拟事件之间的延迟，使流式效果更明显
                    await delay(100);
                }

                // 关闭流
                controller.close();
            },
        });

        return new HttpResponse(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }),

    // 处理获取会话列表请求
    http.get("/api/chat/sessions", async () => {
        // 模拟网络延迟
        await delay(300);

        return HttpResponse.json(sessions, { status: 200 });
    }),

    // 处理获取单个会话请求
    http.get("/api/chat/sessions/:id", async ({ params }) => {
        // 模拟网络延迟
        await delay(200);

        const { id } = params;
        const session = sessions.find((s) => s.id === id);

        if (session) {
            return HttpResponse.json(session, { status: 200 });
        } else {
            return HttpResponse.json(
                { error: "Session not found" },
                { status: 404 },
            );
        }
    }),

    // 处理删除会话请求
    http.delete("/api/chat/sessions/:id", async ({ params }) => {
        // 模拟网络延迟
        await delay(400);

        const { id } = params;

        return HttpResponse.json(
            {
                success: true,
                message: `会话 ${id} 已成功删除`,
            },
            { status: 200 },
        );
    }),
];

export default handlers;
