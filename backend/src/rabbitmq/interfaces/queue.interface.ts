export interface RabbitMQQueue {
  name: string;
  vhost: string;
  durable: boolean;
  auto_delete: boolean;
  arguments: {
    'x-dead-letter-exchange'?: string;
    'x-dead-letter-routing-key'?: string;
    'x-message-ttl'?: number;
    [key: string]: any;
  };
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  state: 'running' | 'idle' | 'flow';
  memory: number;
  message_stats?: {
    publish?: number;
    deliver?: number;
    ack?: number;
  };
}
