export interface QueueMetadata {
  version: number;
  maxRetries: number;
  createdAt: string;
  updatedAt?: string;
}

export interface QueueTopology {
  retriesEnabled: boolean;
  dlqEnabled: boolean;
  retryDelay: number | null;
  maxRetries: number | null;
  description: string;
}
