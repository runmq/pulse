export class QueueSummaryDto {
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
