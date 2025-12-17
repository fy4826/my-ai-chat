import type { ChatMessage } from "@my-ai-chat/shared";
import { useState } from "react";

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) {
            return;
        }
        const userMessage: ChatMessage = {
            role: "user",
            content: input,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            if (!response.body) {
                throw new Error("Response body is null");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "",
                },
            ]);
            let aiResponseText = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data:")) {
                        const jsonStr = line.replace("data: ", "").trim();
                        if (jsonStr === "[DONE]") {
                            break;
                        }
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.content) {
                                aiResponseText += data.content;
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    newMessages[
                                        newMessages.length - 1
                                    ].content = aiResponseText;
                                    return newMessages;
                                });
                            }
                        } catch (error) {
                            console.error("Error parsing JSON:", error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching chat response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        input,
        setInput,
        isLoading,
        sendMessage,
    };
}
