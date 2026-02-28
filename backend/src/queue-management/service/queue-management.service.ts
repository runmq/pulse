import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service.js';
import { MetadataService } from '../metadata.service.js';
import { QueueSummaryDto } from '../dto/queue-summary.dto.js';
import { QueueDetailsDto } from '../dto/queue-details.dto.js';
import { DLQMessageDto } from '../dto/dlq-message.dto.js';
import { Constants } from '../../constants.js';
import { ShovelSchedulerService } from './shovel-scheduler.service';

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly metadataService: MetadataService,
    private readonly shovelScheduler: ShovelSchedulerService,
  ) {}

  async getRunMQQueues(): Promise<QueueSummaryDto[]> {
    const queues = await this.rabbitmqService.getRunMQQueues();

    // Group by processor (main queue only, exclude retry and DLQ queues)
    const mainQueues = queues.filter(
      (q) =>
        !q.name.startsWith(Constants.RETRY_DELAY_QUEUE_PREFIX) && !q.name.startsWith(Constants.DLQ_QUEUE_PREFIX),
    );

    const summaries = await Promise.all(
      mainQueues.map(async (queue) => {
        const processorName =
          this.metadataService.extractProcessorName(queue.name);
        const [retriesEnabled, dlqEnabled] = await Promise.all([
          this.rabbitmqService.areRetriesEnabled(processorName),
          this.rabbitmqService.isDLQEnabled(processorName),
        ]);

        return {
          name: queue.name,
          processorName,
          messages: queue.messages,
          messagesReady: queue.messages_ready,
          messagesUnacknowledged: queue.messages_unacknowledged,
          consumers: queue.consumers,
          state: queue.state,
          retriesEnabled,
          dlqEnabled,
          isRunMQManaged: true,
        } as QueueSummaryDto;
      }),
    );

    return summaries;
  }

  private async getQueueOrThrow(queueName: string) {
    try {
      return await this.rabbitmqService.getQueue(queueName);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Queue not found: ${queueName}`);
      }
      this.logger.error(`Failed to fetch queue: ${queueName}`, error.stack);
      throw new ServiceUnavailableException('RabbitMQ API is unavailable');
    }
  }

  async getQueueDetails(processorName: string): Promise<QueueDetailsDto> {
    const queue = await this.getQueueOrThrow(processorName);

    const [retriesEnabled, dlqEnabled, topology, dlqQueue, retryQueue, shovelPluginEnabled] =
      await Promise.all([
        this.rabbitmqService.areRetriesEnabled(processorName),
        this.rabbitmqService.isDLQEnabled(processorName),
        this.metadataService.getTopology(processorName),
        this.rabbitmqService
          .getQueue(`${Constants.DLQ_QUEUE_PREFIX}${processorName}`)
          .catch(() => null),
        this.rabbitmqService
          .getQueue(`${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`)
          .catch(() => null),
        this.rabbitmqService.isShovelPluginEnabled(),
      ]);

    return {
      name: queue.name,
      processorName,
      messages: queue.messages,
      messagesReady: queue.messages_ready,
      messagesUnacknowledged: queue.messages_unacknowledged,
      consumers: queue.consumers,
      state: queue.state,
      retriesEnabled,
      dlqEnabled,
      isRunMQManaged: true,
      retryDelay: topology.retryDelay,
      maxRetries: topology.maxRetries,
      topology: {
        retriesEnabled: topology.retriesEnabled,
        dlqEnabled: topology.dlqEnabled,
        retryDelay: topology.retryDelay,
        maxRetries: topology.maxRetries,
        description: topology.description,
      },
      dlqMessageCount: dlqQueue?.messages || 0,
      retryQueueMessageCount: retryQueue?.messages || 0,
      shovelPluginEnabled,
    };
  }

  async enableRetries(processorName: string): Promise<void> {
    const retryQueueName = `${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`;
    const exchangeName = Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME;
    const routingKey = processorName;

    await this.rabbitmqService.createBinding(
      exchangeName,
      retryQueueName,
      routingKey,
    );

    this.logger.log(`Enabled retries for: ${processorName}`);
  }

  async disableRetries(processorName: string): Promise<void> {
    const retryQueueName = `${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`;
    const exchangeName = Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME;

    const bindings =
      await this.rabbitmqService.getQueueBindings(retryQueueName);
    const binding = bindings.find(
      (b) =>
        b.source === exchangeName && b.routing_key === processorName,
    );

    if (!binding) {
      this.logger.warn(`Retry binding not found for: ${processorName}`);
      return;
    }

    await this.rabbitmqService.deleteBinding(
      exchangeName,
      retryQueueName,
      binding.properties_key,
    );

    this.logger.log(`Disabled retries for: ${processorName}`);
  }

  async enableDLQ(processorName: string): Promise<void> {
    const dlqName = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;
    const exchangeName = Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME;
    const routingKey = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;

    await this.rabbitmqService.createBinding(
      exchangeName,
      dlqName,
      routingKey,
    );

    this.logger.log(`Enabled DLQ for: ${processorName}`);
  }

  async disableDLQ(processorName: string): Promise<void> {
    const dlqName = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;
    const exchangeName = Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME;

    const bindings =
      await this.rabbitmqService.getQueueBindings(dlqName);
    const binding = bindings.find(
      (b) =>
        b.source === exchangeName &&
        b.routing_key === `${Constants.DLQ_QUEUE_PREFIX}${processorName}`,
    );

    if (!binding) {
      this.logger.warn(`DLQ binding not found for: ${processorName}`);
      return;
    }

    await this.rabbitmqService.deleteBinding(
      exchangeName,
      dlqName,
      binding.properties_key,
    );

    this.logger.log(`Disabled DLQ for: ${processorName}`);
  }

  async updateRetryDelay(
    processorName: string,
    delayMs: number,
  ): Promise<void> {
    const policyName = `${Constants.MESSAGE_TTL_OPERATOR_POLICY_PREFIX}${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`;
    const pattern = `^${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}$`;

    await this.rabbitmqService.putOperatorPolicy(
      policyName,
      pattern,
      { 'message-ttl': delayMs },
      'queues',
      10,
    );

    this.logger.log(
      `Updated retry delay for ${processorName}: ${delayMs}ms`,
    );
  }

  async reprocessDLQ(processorName: string): Promise<string> {
    return this.shovelScheduler.createOneTimeShovel(processorName);
  }

  async clearDLQ(processorName: string): Promise<void> {
    const dlqName = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;

    await this.getQueueOrThrow(dlqName);

    await this.rabbitmqService.purgeQueue(dlqName);
    this.logger.log(`Cleared DLQ for: ${processorName}`);
  }

  async getDLQMessages(
    processorName: string,
    count: number = 100,
  ): Promise<{ messages: DLQMessageDto[]; totalInQueue: number }> {
    return this.getQueueMessages(
      `${Constants.DLQ_QUEUE_PREFIX}${processorName}`,
      count,
    );
  }

  async getRetryMessages(
    processorName: string,
    count: number = 100,
  ): Promise<{ messages: DLQMessageDto[]; totalInQueue: number }> {
    return this.getQueueMessages(
      `${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`,
      count,
    );
  }

  private async getQueueMessages(
    queueName: string,
    count: number,
  ): Promise<{ messages: DLQMessageDto[]; totalInQueue: number }> {
    const clampedCount = Math.min(Math.max(count, 1), 500);

    const queue = await this.getQueueOrThrow(queueName);
    const totalInQueue = queue.messages || 0;

    if (totalInQueue === 0) {
      return { messages: [], totalInQueue: 0 };
    }

    const rawMessages = await this.rabbitmqService.getMessages(
      queueName,
      clampedCount,
    );

    const messages: DLQMessageDto[] = rawMessages.map((msg, index) => ({
      index,
      payload: msg.payload,
      payloadEncoding: msg.payload_encoding,
      payloadBytes: msg.payload_bytes,
      routingKey: msg.routing_key,
      exchange: msg.exchange,
      redelivered: msg.redelivered,
      properties: {
        headers: msg.properties?.headers || {},
        contentType: msg.properties?.content_type,
      },
    }));

    return { messages, totalInQueue };
  }
}
