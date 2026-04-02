// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化时间
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

// 格式化日期
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

// 验证API密钥
export function isValidApiKey(key: string): boolean {
  return !!key && key.length > 0;
}

// 处理错误
export function handleError(error: any): {
  code: string;
  message: string;
  details?: any;
} {
  if (error.response) {
    // API错误
    return {
      code: error.response.status.toString(),
      message: error.response.data.message || 'API error',
      details: error.response.data
    };
  } else if (error.request) {
    // 网络错误
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error, please check your connection'
    };
  } else {
    // 其他错误
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error'
    };
  }
}

// 分块文本
export function chunkText(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.substring(start, end));
    start = end - chunkOverlap;
  }
  
  return chunks;
}

// 计算相似度（简单的余弦相似度）
export function calculateSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] ** 2;
    norm2 += embedding2[i] ** 2;
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  return dotProduct / (norm1 * norm2);
}
