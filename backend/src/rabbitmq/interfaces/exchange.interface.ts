export interface RabbitMQExchange {
  name: string;
  vhost: string;
  type: 'direct' | 'fanout' | 'topic' | 'headers';
  durable: boolean;
  auto_delete: boolean;
  internal: boolean;
  arguments: Record<string, any>;
}
