export interface RabbitMQPolicy {
  name: string;
  vhost: string;
  pattern: string;
  'apply-to': 'queues' | 'exchanges' | 'all';
  definition: {
    'message-ttl'?: number;
    'max-length'?: number;
    'expires'?: number;
    [key: string]: any;
  };
  priority: number;
}
