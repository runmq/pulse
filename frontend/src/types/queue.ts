export interface QueueSummary {
  name: string;
  processorName: string;
  messages: number;
  messagesReady: number;
  messagesUnacknowledged: number;
  consumers: number;
  state: string;
  retriesEnabled: boolean;
  dlqEnabled: boolean;
  isRunMQManaged: boolean;
}

export interface QueueDetails extends QueueSummary {
  retryDelay: number | null;
  maxRetries: number | null;
  topology: {
    retriesEnabled: boolean;
    dlqEnabled: boolean;
    retryDelay: number | null;
    maxRetries: number | null;
    description: string;
  };
  dlqMessageCount: number;
  retryQueueMessageCount: number;
  shovelPluginEnabled: boolean;
}