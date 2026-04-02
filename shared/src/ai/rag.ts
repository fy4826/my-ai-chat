import { VectorStore } from '@langchain/core/vectorstores';
import { Embeddings } from '@langchain/core/embeddings';

// RAG配置接口
export interface RAGConfig {
  // 嵌入模型配置
  embeddingModel: string;
  // 向量存储配置
  vectorStore: {
    type: 'chromadb';
    collectionName: string;
    path?: string;
  };
  // 检索配置
  retrieval: {
    // 相似度阈值
    similarityThreshold: number;
    // 检索结果数量
    k: number;
  };
  // 分块配置
  chunking: {
    // 块大小（token）
    chunkSize: number;
    // 重叠大小（token）
    chunkOverlap: number;
  };
}

// 默认RAG配置
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  embeddingModel: 'qwen3:embedding',
  vectorStore: {
    type: 'chromadb',
    collectionName: 'documents'
  },
  retrieval: {
    similarityThreshold: 0.7,
    k: 3
  },
  chunking: {
    chunkSize: 512,
    chunkOverlap: 100
  }
};

// 文档接口
export interface Document {
  id: string;
  content: string;
  metadata: {
    source?: string;
    title?: string;
    chunkIndex?: number;
    [key: string]: any;
  };
}

// RAG服务接口
export interface RAGService {
  // 初始化
  initialize(): Promise<void>;
  // 添加文档
  addDocuments(documents: Document[]): Promise<void>;
  // 检索相关文档
  retrieve(query: string, k?: number): Promise<Document[]>;
  // 增强提示
  augmentPrompt(query: string, documents: Document[]): string;
  // 清理
  clear(): Promise<void>;
}
