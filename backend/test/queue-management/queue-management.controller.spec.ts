import { Test, TestingModule } from '@nestjs/testing';
import { QueueManagementController } from '../../src/queue-management/queue-management.controller';
import { QueueManagementService } from '../../src/queue-management/service/queue-management.service';

describe('QueueManagementController', () => {
  let controller: QueueManagementController;

  const mockQueueService = {
    getRunMQQueues: jest.fn(),
    getQueueDetails: jest.fn(),
    enableRetries: jest.fn(),
    disableRetries: jest.fn(),
    enableDLQ: jest.fn(),
    disableDLQ: jest.fn(),
    updateRetryDelay: jest.fn(),
    reprocessDLQ: jest.fn(),
    clearDLQ: jest.fn(),
    getDLQMessages: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueManagementController],
      providers: [
        {
          provide: QueueManagementService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueManagementController>(
      QueueManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listQueues', () => {
    it('should return all RunMQ queues', async () => {
      const queues = [
        {
          name: 'order_processor',
          processorName: 'order_processor',
          messages: 10,
          retriesEnabled: true,
          dlqEnabled: true,
        },
      ];
      mockQueueService.getRunMQQueues.mockResolvedValue(queues);

      const result = await controller.listQueues();

      expect(result).toEqual(queues);
    });
  });

  describe('getQueueDetails', () => {
    it('should return queue details', async () => {
      const details = {
        name: 'order_processor',
        processorName: 'order_processor',
        topology: { description: '10 retries with 5000ms delay, then to DLQ' },
      };
      mockQueueService.getQueueDetails.mockResolvedValue(details);

      const result = await controller.getQueueDetails('order_processor');

      expect(result).toEqual(details);
      expect(mockQueueService.getQueueDetails).toHaveBeenCalledWith(
        'order_processor',
      );
    });
  });

  describe('enableRetries', () => {
    it('should enable retries and return confirmation', async () => {
      mockQueueService.enableRetries.mockResolvedValue(undefined);

      const result = await controller.enableRetries('order_processor');

      expect(result).toEqual({
        message: 'Retries enabled',
        processorName: 'order_processor',
      });
      expect(mockQueueService.enableRetries).toHaveBeenCalledWith(
        'order_processor',
      );
    });
  });

  describe('disableRetries', () => {
    it('should disable retries and return confirmation', async () => {
      mockQueueService.disableRetries.mockResolvedValue(undefined);

      const result = await controller.disableRetries('order_processor');

      expect(result).toEqual({
        message: 'Retries disabled',
        processorName: 'order_processor',
      });
    });
  });

  describe('enableDLQ', () => {
    it('should enable DLQ and return confirmation', async () => {
      mockQueueService.enableDLQ.mockResolvedValue(undefined);

      const result = await controller.enableDLQ('order_processor');

      expect(result).toEqual({
        message: 'DLQ enabled',
        processorName: 'order_processor',
      });
    });
  });

  describe('disableDLQ', () => {
    it('should disable DLQ and return confirmation', async () => {
      mockQueueService.disableDLQ.mockResolvedValue(undefined);

      const result = await controller.disableDLQ('order_processor');

      expect(result).toEqual({
        message: 'DLQ disabled',
        processorName: 'order_processor',
      });
    });
  });

  describe('updateDelay', () => {
    it('should update delay and return confirmation', async () => {
      mockQueueService.updateRetryDelay.mockResolvedValue(undefined);

      const result = await controller.updateDelay('order_processor', {
        delayMs: 10000,
      });

      expect(result).toEqual({
        message: 'Delay updated',
        processorName: 'order_processor',
        delayMs: 10000,
      });
      expect(mockQueueService.updateRetryDelay).toHaveBeenCalledWith(
        'order_processor',
        10000,
      );
    });
  });

  describe('reprocessDLQ', () => {
    it('should start reprocessing and return shovel name', async () => {
      mockQueueService.reprocessDLQ.mockResolvedValue(
        'runmq_reprocess_order_processor_123',
      );

      const result = await controller.reprocessDLQ('order_processor');

      expect(result).toEqual({
        message: 'DLQ reprocessing started',
        shovelName: 'runmq_reprocess_order_processor_123',
      });
    });
  });

  describe('clearDLQ', () => {
    it('should clear DLQ and return confirmation', async () => {
      mockQueueService.clearDLQ.mockResolvedValue(undefined);

      const result = await controller.clearDLQ('order_processor');

      expect(result).toEqual({
        message: 'DLQ cleared',
        processorName: 'order_processor',
      });
      expect(mockQueueService.clearDLQ).toHaveBeenCalledWith(
        'order_processor',
      );
    });
  });

  describe('getDLQMessages', () => {
    it('should return DLQ messages with default count', async () => {
      const mockResult = {
        messages: [
          {
            index: 0,
            payload: '{"key":"value"}',
            payloadEncoding: 'string',
            payloadBytes: 15,
            routingKey: 'test',
            exchange: '',
            redelivered: false,
            properties: { headers: {} },
          },
        ],
        totalInQueue: 1,
      };
      mockQueueService.getDLQMessages.mockResolvedValue(mockResult);

      const result = await controller.getDLQMessages('order_processor', 100);

      expect(result).toEqual({
        ...mockResult,
        processorName: 'order_processor',
      });
      expect(mockQueueService.getDLQMessages).toHaveBeenCalledWith(
        'order_processor',
        100,
      );
    });

    it('should parse count query parameter', async () => {
      mockQueueService.getDLQMessages.mockResolvedValue({
        messages: [],
        totalInQueue: 0,
      });

      await controller.getDLQMessages('order_processor', 50);

      expect(mockQueueService.getDLQMessages).toHaveBeenCalledWith(
        'order_processor',
        50,
      );
    });
  });

});
