export interface RabbitMQShovelConfig {
  value: {
    'src-uri': string;
    'src-queue': string;
    'dest-uri': string;
    'dest-exchange'?: string;
    'dest-queue'?: string;
    'ack-mode': 'on-confirm' | 'on-publish' | 'no-ack';
    'delete-after'?: 'never' | 'queue-length';
    'dest-add-timestamp-header'?: boolean;
  };
}

export interface RabbitMQShovel {
  name: string;
  vhost: string;
  component: string;
  value: RabbitMQShovelConfig['value'];
  state: string;
}
