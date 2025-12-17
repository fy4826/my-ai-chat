import { Request, Response } from "express";
import { Ollama } from "ollama";
import { config } from "../config/index.js";
import { ChatMessage } from "@my-ai-chat/shared";

const ollama = new Ollama({
    host: config.ollamaHost,
});
export const chatController = async (req: Request, res: Response) => {
    const messages: ChatMessage[] = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
            error: "messages is required and must be an array",
        });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
        const responce = await ollama.chat({
            model: config.modelName,
            messages,
            stream: true,
        });
        req.on("close", () => {
            ollama.abort();
            res.end();
        });
        for await (const part of responce) {
            if (!part.message.content) {
                continue;
            }
            const chunkData = JSON.stringify({
                content: part.message.content,
                done: part.done,
            });
            res.write(`data: ${chunkData}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({
                error: "AI processing failed",
            });
        } else {
            res.write(
                `event:error\ndata: ${JSON.stringify({
                    error: "Stream error",
                })}\n\n`
            );
            res.end();
        }
    }
};
