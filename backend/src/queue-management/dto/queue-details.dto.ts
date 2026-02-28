import { QueueSummaryDto } from './queue-summary.dto.js';

export class QueueDetailsDto extends QueueSummaryDto {
  retryDelay: number | null;
  maxRetries: number | null;
  topology: {
    retriesEnabled: boolean;
    dlqEnabled: boolean;
    retryDelay: number | null;
    maxRetries: number | null;
    description: string;
  };
  shovelPluginEnabled: boolean;
}
