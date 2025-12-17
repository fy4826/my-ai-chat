import dotenv from "dotenv";
import { APP_CONSTANTS } from "@my-ai-chat/shared";
dotenv.config();
export const config = {
    port: Number(process.env.PORT) || 3000,
    ollamaHost: process.env.OLLAMA_HOST || "http://localhost:11434",
    modelName: process.env.MODEL_NAME || APP_CONSTANTS.DEFAULT_MODEL,
};
