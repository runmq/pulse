import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service.js';
import {
  QueueMetadata,
  QueueTopology,
} from './interfaces/queue-metadata.interface.js';
import { Constants } from '../constants.js';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private readonly rabbitmqService: RabbitMQService) {}

  async getMetadata(processorName: string): Promise<QueueMetadata | null> {
    const paramName = `${Constants.METADATA_STORE_PREFIX}${processorName}`;
    return this.rabbitmqService.getGlobalParameter<QueueMetadata>(paramName);
  }

  async getTopology(processorName: string): Promise<QueueTopology> {
    const [retriesEnabled, dlqEnabled, retryDelay, metadata] =
      await Promise.all([
        this.rabbitmqService.areRetriesEnabled(processorName),
        this.rabbitmqService.isDLQEnabled(processorName),
        this.rabbitmqService.getDelayForProcessor(processorName),
        this.getMetadata(processorName),
      ]);

    const maxRetries = metadata?.maxRetries || null;

    let description = '';
    if (retriesEnabled && maxRetries && retryDelay) {
      description += `${maxRetries} retries with ${retryDelay}ms delay`;
    } else if (retriesEnabled) {
      description += 'Retries enabled';
    } else {
      description += 'No retries';
    }

    if (dlqEnabled) {
      description += ', then to DLQ';
    } else {
      description += ', no DLQ';
    }

    return {
      retriesEnabled,
      dlqEnabled,
      retryDelay,
      maxRetries,
      description,
    };
  }

  extractProcessorName(queueName: string): string {
    if (queueName.startsWith(Constants.RETRY_DELAY_QUEUE_PREFIX)) {
      return queueName.replace(Constants.RETRY_DELAY_QUEUE_PREFIX, '');
    }
    if (queueName.startsWith(Constants.DLQ_QUEUE_PREFIX)) {
      return queueName.replace(Constants.DLQ_QUEUE_PREFIX, '');
    }
    return queueName;
  }
}
