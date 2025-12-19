export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}
export const APP_CONSTANTS = {
    DEFAULT_MODEL: "qwen3:8b",
};
