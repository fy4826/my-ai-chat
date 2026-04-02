import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";

// 模型类型枚举
export enum ModelType {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    OLLAMA = "ollama",
}

// 模型配置接口
export interface ModelConfig {
    type: ModelType;
    model: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    baseUrl?: string;
    think?: boolean;
}

// 默认模型配置
export const DEFAULT_MODELS: Record<string, ModelConfig> = {
    // 本地ollama模型
    qwen3: {
        type: ModelType.OLLAMA,
        model: "qwen3:4b",
        temperature: 0.25,
        maxTokens: 256,
    },
    // 本地嵌入模型
    qwen3Embedding: {
        type: ModelType.OLLAMA,
        model: "qwen3-embedding:4b",
        temperature: 0,
    },
    // OpenAI模型
    gpt4: {
        type: ModelType.OPENAI,
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 4096,
    },
    // Anthropic模型
    claude3: {
        type: ModelType.ANTHROPIC,
        model: "claude-3-opus-20240229",
        temperature: 0.7,
        maxTokens: 4096,
    },
    // OpenAI API模型（需要API key）
    gpt35: {
        type: ModelType.OPENAI,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 4096,
    },
    // Qwen3 Max API模型（需要API key）
    qwen3Max: {
        type: ModelType.OPENAI,
        model: "qwen3-max",
        temperature: 0.7,
        maxTokens: 4096,
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 通义千问 API 端点
    },
};

// 创建模型实例的工厂函数
export function createModel(config: ModelConfig) {
    switch (config.type) {
        case ModelType.OPENAI:
            return new ChatOpenAI({
                model: config.model,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                apiKey: config.apiKey,
                configuration: config.baseUrl
                    ? { baseURL: config.baseUrl }
                    : undefined,
            });
        case ModelType.ANTHROPIC:
            return new ChatAnthropic({
                model: config.model,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                apiKey: config.apiKey,
            });
        case ModelType.OLLAMA:
            return new ChatOllama({
                model: config.model,
                temperature: config.temperature,
                baseUrl: config.baseUrl || "http://localhost:11434",
            });
        default:
            throw new Error(`Unsupported model type: ${config.type}`);
    }
}
