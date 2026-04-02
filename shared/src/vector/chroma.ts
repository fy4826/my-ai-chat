import { ChromaClient, Collection } from 'chromadb';

// ChromaDB配置接口
export interface ChromaDBConfig {
  // 数据库路径或URL
  path?: string;
  // 集合名称
  collectionName: string;
  // 嵌入维度
  embeddingDimension?: number;
}

// 默认ChromaDB配置
export const DEFAULT_CHROMA_CONFIG: ChromaDBConfig = {
  collectionName: 'documents',
  embeddingDimension: 1024
};

// ChromaDB服务类
export class ChromaDBService {
  private client: ChromaClient;
  private collection?: Collection;
  private config: ChromaDBConfig;

  constructor(config: ChromaDBConfig = DEFAULT_CHROMA_CONFIG) {
    this.config = config;
    // 创建ChromaDB客户端
    this.client = new ChromaClient({
      path: config.path
    });
  }

  // 初始化集合
  async initialize() {
    this.collection = await this.client.getOrCreateCollection({
      name: this.config.collectionName
    });
    return this.collection;
  }

  // 获取集合
  getCollection(): Collection {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }
    return this.collection;
  }

  // 添加文档
  async addDocuments(documents: {
    ids: string[];
    documents: string[];
    embeddings?: number[][];
    metadatas?: any[];
  }) {
    const collection = this.getCollection();
    await collection.add(documents);
  }

  // 相似度搜索
  async similaritySearch(
    query: string | number[],
    k: number = 3,
    filter?: any
  ) {
    const collection = this.getCollection();
    return await collection.query({
      queryTexts: typeof query === 'string' ? [query] : undefined,
      queryEmbeddings: typeof query === 'string' ? undefined : [query],
      nResults: k,
      where: filter
    });
  }

  // 删除文档
  async deleteDocuments(ids: string[]) {
    const collection = this.getCollection();
    await collection.delete({
      ids
    });
  }

  // 清空集合
  async clear() {
    const collection = this.getCollection();
    await collection.delete({});
  }

  // 关闭客户端
  async close() {
    // ChromaDB客户端没有显式的close方法
    // 这里可以添加清理逻辑
  }
}
