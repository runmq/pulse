export interface RabbitMQBinding {
  source: string;
  vhost: string;
  destination: string;
  destination_type: 'queue' | 'exchange';
  routing_key: string;
  arguments: Record<string, any>;
  properties_key: string;
}
