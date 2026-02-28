export interface RabbitMQMessage {
  payload: string;
  payload_encoding: string;
  payload_bytes: number;
  properties: {
    headers?: Record<string, any>;
    content_type?: string;
    [key: string]: any;
  };
  routing_key: string;
  redelivered: boolean;
  exchange: string;
  message_count: number;
}
