export class DLQMessageDto {
  index: number;
  payload: string;
  payloadEncoding: string;
  payloadBytes: number;
  routingKey: string;
  exchange: string;
  redelivered: boolean;
  properties: { headers: Record<string, any>; contentType?: string };
}
