import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QueueManagementService } from '../../src/queue-management/service/queue-management.service';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';
import { MetadataService } from '../../src/queue-management/metadata.service';
import { ShovelSchedulerService } from '../../src/queue-management/service/shovel-scheduler.service';

describe('QueueManagementService', () => {
  let service: QueueManagementService;

  const mockRabbitMQService = {
    getRunMQQueues: jest.fn(),
    getQueue: jest.fn(),
    areRetriesEnabled: jest.fn(),
    isDLQEnabled: jest.fn(),
    getQueueBindings: jest.fn(),
    createBinding: jest.fn(),
    deleteBinding: jest.fn(),
    putPolicy: jest.fn(),
    putOperatorPolicy: jest.fn(),
    isShovelPluginEnabled: jest.fn(),
    purgeQueue: jest.fn(),
    getMessages: jest.fn(),
  };

  const mockMetadataService = {
    extractProcessorName: jest.fn((name: string) => name),
    getTopology: jest.fn(),
  };

  const mockShovelScheduler = {
    createOneTimeShovel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRabbitMQService.isShovelPluginEnabled.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueManagementService,
        { provide: RabbitMQService, useValue: mockRabbitMQService },
        { provide: MetadataService, useValue: mockMetadataService },
        {
          provide: ShovelSchedulerService,
          useValue: mockShovelScheduler,
        },
      ],
    }).compile();

    service = module.get<QueueManagementService>(QueueManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRunMQQueues', () => {
    it('should return summaries for main queues only', async () => {
      mockRabbitMQService.getRunMQQueues.mockResolvedValue([
        {
          name: 'order_processor',
          messages: 10,
          messages_ready: 8,
          messages_unacknowledged: 2,
          consumers: 3,
          state: 'running',
        },
        {
          name: '_runmq_retry_delay_order_processor',
          messages: 5,
          messages_ready: 5,
          messages_unacknowledged: 0,
          consumers: 0,
          state: 'idle',
        },
        {
          name: '_runmq_dlq_order_processor',
          messages: 1,
          messages_ready: 1,
          messages_unacknowledged: 0,
          consumers: 0,
          state: 'idle',
        },
      ]);
      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(true);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(true);

      const result = await service.getRunMQQueues();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'order_processor',
        processorName: 'order_processor',
        messages: 10,
        messagesReady: 8,
        messagesUnacknowledged: 2,
        consumers: 3,
        state: 'running',
        retriesEnabled: true,
        dlqEnabled: true,
        isRunMQManaged: true,
      });
    });

    it('should return empty array when no queues exist', async () => {
      mockRabbitMQService.getRunMQQueues.mockResolvedValue([]);

      const result = await service.getRunMQQueues();

      expect(result).toEqual([]);
    });
  });

  describe('getQueueDetails', () => {
    it('should return detailed queue info', async () => {
      mockRabbitMQService.getQueue
        .mockResolvedValueOnce({
          name: 'order_processor',
          messages: 10,
          messages_ready: 8,
          messages_unacknowledged: 2,
          consumers: 3,
          state: 'running',
        })
        .mockResolvedValueOnce({ messages: 5 }) // dlq
        .mockResolvedValueOnce({ messages: 3 }); // retry

      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(true);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(true);
      mockMetadataService.getTopology.mockResolvedValue({
        retriesEnabled: true,
        dlqEnabled: true,
        retryDelay: 5000,
        maxRetries: 10,
        description: '10 retries with 5000ms delay, then to DLQ',
      });

      const result = await service.getQueueDetails('order_processor');

      expect(result.name).toBe('order_processor');
      expect(result.processorName).toBe('order_processor');
      expect(result.retriesEnabled).toBe(true);
      expect(result.dlqEnabled).toBe(true);
      expect(result.topology.description).toBe(
        '10 retries with 5000ms delay, then to DLQ',
      );
      expect(result.dlqMessageCount).toBe(5);
      expect(result.retryQueueMessageCount).toBe(3);
    });

    it('should throw NotFoundException when queue not found', async () => {
      mockRabbitMQService.getQueue.mockRejectedValue({
        response: { status: 404 },
      });

      await expect(service.getQueueDetails('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle missing DLQ and retry queues gracefully', async () => {
      mockRabbitMQService.getQueue
        .mockResolvedValueOnce({
          name: 'order_processor',
          messages: 0,
          messages_ready: 0,
          messages_unacknowledged: 0,
          consumers: 1,
          state: 'idle',
        })
        .mockRejectedValueOnce(new Error('not found')) // dlq
        .mockRejectedValueOnce(new Error('not found')); // retry

      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(false);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(false);
      mockMetadataService.getTopology.mockResolvedValue({
        retriesEnabled: false,
        dlqEnabled: false,
        retryDelay: null,
        maxRetries: null,
        description: 'No retries, no DLQ',
      });

      const result = await service.getQueueDetails('order_processor');

      expect(result.dlqMessageCount).toBe(0);
      expect(result.retryQueueMessageCount).toBe(0);
    });
  });

  describe('enableRetries', () => {
    it('should create binding for retry queue', async () => {
      mockRabbitMQService.createBinding.mockResolvedValue(undefined);

      await service.enableRetries('order_processor');

      expect(mockRabbitMQService.createBinding).toHaveBeenCalledWith(
        '_runmq_dead_letter_router',
        '_runmq_retry_delay_order_processor',
        'order_processor',
      );
    });
  });

  describe('disableRetries', () => {
    it('should delete binding for retry queue', async () => {
      mockRabbitMQService.getQueueBindings.mockResolvedValue([
        {
          source: '_runmq_dead_letter_router',
          routing_key: 'order_processor',
          properties_key: 'order_processor',
        },
      ]);
      mockRabbitMQService.deleteBinding.mockResolvedValue(undefined);

      await service.disableRetries('order_processor');

      expect(mockRabbitMQService.deleteBinding).toHaveBeenCalledWith(
        '_runmq_dead_letter_router',
        '_runmq_retry_delay_order_processor',
        'order_processor',
      );
    });

    it('should not throw when binding not found', async () => {
      mockRabbitMQService.getQueueBindings.mockResolvedValue([]);

      await expect(
        service.disableRetries('order_processor'),
      ).resolves.not.toThrow();
      expect(mockRabbitMQService.deleteBinding).not.toHaveBeenCalled();
    });
  });

  describe('enableDLQ', () => {
    it('should create binding for DLQ', async () => {
      mockRabbitMQService.createBinding.mockResolvedValue(undefined);

      await service.enableDLQ('order_processor');

      expect(mockRabbitMQService.createBinding).toHaveBeenCalledWith(
        '_runmq_dead_letter_router',
        '_runmq_dlq_order_processor',
        '_runmq_dlq_order_processor',
      );
    });
  });

  describe('disableDLQ', () => {
    it('should delete binding for DLQ', async () => {
      mockRabbitMQService.getQueueBindings.mockResolvedValue([
        {
          source: '_runmq_dead_letter_router',
          routing_key: '_runmq_dlq_order_processor',
          properties_key: '_runmq_dlq_order_processor',
        },
      ]);
      mockRabbitMQService.deleteBinding.mockResolvedValue(undefined);

      await service.disableDLQ('order_processor');

      expect(mockRabbitMQService.deleteBinding).toHaveBeenCalledWith(
        '_runmq_dead_letter_router',
        '_runmq_dlq_order_processor',
        '_runmq_dlq_order_processor',
      );
    });

    it('should not throw when binding not found', async () => {
      mockRabbitMQService.getQueueBindings.mockResolvedValue([]);

      await expect(
        service.disableDLQ('order_processor'),
      ).resolves.not.toThrow();
      expect(mockRabbitMQService.deleteBinding).not.toHaveBeenCalled();
    });
  });

  describe('updateRetryDelay', () => {
    it('should update policy with new TTL', async () => {
      mockRabbitMQService.putOperatorPolicy.mockResolvedValue(undefined);

      await service.updateRetryDelay('order_processor', 10000);

      expect(mockRabbitMQService.putOperatorPolicy).toHaveBeenCalledWith(
        '_runmq_message_ttl_operator_policy_runmq_retry_delay_order_processor',
        '^_runmq_retry_delay_order_processor$',
        { 'message-ttl': 10000 },
        'queues',
        10,
      );
    });
  });

  describe('reprocessDLQ', () => {
    it('should delegate to shovel scheduler', async () => {
      mockShovelScheduler.createOneTimeShovel.mockResolvedValue(
        'shovel_name',
      );

      const result = await service.reprocessDLQ('order_processor');

      expect(result).toBe('shovel_name');
      expect(
        mockShovelScheduler.createOneTimeShovel,
      ).toHaveBeenCalledWith('order_processor');
    });
  });

  describe('clearDLQ', () => {
    it('should purge the DLQ queue', async () => {
      mockRabbitMQService.getQueue.mockResolvedValue({
        name: '_runmq_dlq_order_processor',
        messages: 5,
      });
      mockRabbitMQService.purgeQueue.mockResolvedValue(undefined);

      await service.clearDLQ('order_processor');

      expect(mockRabbitMQService.getQueue).toHaveBeenCalledWith(
        '_runmq_dlq_order_processor',
      );
      expect(mockRabbitMQService.purgeQueue).toHaveBeenCalledWith(
        '_runmq_dlq_order_processor',
      );
    });

    it('should throw when DLQ queue does not exist', async () => {
      mockRabbitMQService.getQueue.mockRejectedValue(
        new Error('Queue not found'),
      );

      await expect(service.clearDLQ('nonexistent')).rejects.toThrow();
      expect(mockRabbitMQService.purgeQueue).not.toHaveBeenCalled();
    });
  });

  describe('getDLQMessages', () => {
    it('should return mapped messages with total count', async () => {
      mockRabbitMQService.getQueue.mockResolvedValue({
        name: '_runmq_dlq_order_processor',
        messages: 3,
      });
      mockRabbitMQService.getMessages.mockResolvedValue([
        {
          payload: '{"key":"value"}',
          payload_encoding: 'string',
          payload_bytes: 15,
          properties: { headers: { 'x-death': [] }, content_type: 'application/json' },
          routing_key: 'order_processor',
          redelivered: true,
          exchange: '',
          message_count: 2,
        },
        {
          payload: 'raw text',
          payload_encoding: 'string',
          payload_bytes: 8,
          properties: {},
          routing_key: 'order_processor',
          redelivered: false,
          exchange: '',
          message_count: 1,
        },
      ]);

      const result = await service.getDLQMessages('order_processor');

      expect(result.totalInQueue).toBe(3);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual({
        index: 0,
        payload: '{"key":"value"}',
        payloadEncoding: 'string',
        payloadBytes: 15,
        routingKey: 'order_processor',
        exchange: '',
        redelivered: true,
        properties: {
          headers: { 'x-death': [] },
          contentType: 'application/json',
        },
      });
      expect(result.messages[1].properties.headers).toEqual({});
      expect(result.messages[1].properties.contentType).toBeUndefined();
    });

    it('should return empty array when queue has no messages', async () => {
      mockRabbitMQService.getQueue.mockResolvedValue({
        name: '_runmq_dlq_order_processor',
        messages: 0,
      });

      const result = await service.getDLQMessages('order_processor');

      expect(result).toEqual({ messages: [], totalInQueue: 0 });
      expect(mockRabbitMQService.getMessages).not.toHaveBeenCalled();
    });

    it('should clamp count to max 500', async () => {
      mockRabbitMQService.getQueue.mockResolvedValue({
        name: '_runmq_dlq_order_processor',
        messages: 1000,
      });
      mockRabbitMQService.getMessages.mockResolvedValue([]);

      await service.getDLQMessages('order_processor', 999);

      expect(mockRabbitMQService.getMessages).toHaveBeenCalledWith(
        '_runmq_dlq_order_processor',
        500,
      );
    });

    it('should clamp count to min 1', async () => {
      mockRabbitMQService.getQueue.mockResolvedValue({
        name: '_runmq_dlq_order_processor',
        messages: 5,
      });
      mockRabbitMQService.getMessages.mockResolvedValue([]);

      await service.getDLQMessages('order_processor', 0);

      expect(mockRabbitMQService.getMessages).toHaveBeenCalledWith(
        '_runmq_dlq_order_processor',
        1,
      );
    });
  });

});
