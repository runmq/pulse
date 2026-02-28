import { Test, TestingModule } from '@nestjs/testing';
import { MetadataService } from '../../src/queue-management/metadata.service';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';

describe('MetadataService', () => {
  let service: MetadataService;

  const mockRabbitMQService = {
    getGlobalParameter: jest.fn(),
    setGlobalParameter: jest.fn(),
    areRetriesEnabled: jest.fn(),
    isDLQEnabled: jest.fn(),
    getDelayForProcessor: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        { provide: RabbitMQService, useValue: mockRabbitMQService },
      ],
    }).compile();

    service = module.get<MetadataService>(MetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetadata', () => {
    it('should return metadata from global parameter', async () => {
      const metadata = {
        version: 1,
        maxRetries: 10,
        createdAt: '2026-02-27T00:00:00.000Z',
      };
      mockRabbitMQService.getGlobalParameter.mockResolvedValue(metadata);

      const result = await service.getMetadata('order_processor');

      expect(result).toEqual(metadata);
      expect(mockRabbitMQService.getGlobalParameter).toHaveBeenCalledWith(
        '_runmq_metadata_order_processor',
      );
    });

    it('should return null when no parameter exists', async () => {
      mockRabbitMQService.getGlobalParameter.mockResolvedValue(null);

      const result = await service.getMetadata('order_processor');

      expect(result).toBeNull();
    });
  });

  describe('getTopology', () => {
    it('should return full topology with retries and DLQ', async () => {
      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(true);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(true);
      mockRabbitMQService.getDelayForProcessor.mockResolvedValue(5000);
      mockRabbitMQService.getGlobalParameter.mockResolvedValue({
        version: 1,
        maxRetries: 10,
        createdAt: '',
      });

      const result = await service.getTopology('order_processor');

      expect(result).toEqual({
        retriesEnabled: true,
        dlqEnabled: true,
        retryDelay: 5000,
        maxRetries: 10,
        description: '10 retries with 5000ms delay, then to DLQ',
      });
    });

    it('should describe retries enabled without details', async () => {
      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(true);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(false);
      mockRabbitMQService.getDelayForProcessor.mockResolvedValue(null);
      mockRabbitMQService.getGlobalParameter.mockResolvedValue(null);

      const result = await service.getTopology('order_processor');

      expect(result.description).toBe('Retries enabled, no DLQ');
      expect(result.retriesEnabled).toBe(true);
      expect(result.dlqEnabled).toBe(false);
    });

    it('should describe no retries with DLQ', async () => {
      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(false);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(true);
      mockRabbitMQService.getDelayForProcessor.mockResolvedValue(null);
      mockRabbitMQService.getGlobalParameter.mockResolvedValue(null);

      const result = await service.getTopology('order_processor');

      expect(result.description).toBe('No retries, then to DLQ');
    });

    it('should describe no retries and no DLQ', async () => {
      mockRabbitMQService.areRetriesEnabled.mockResolvedValue(false);
      mockRabbitMQService.isDLQEnabled.mockResolvedValue(false);
      mockRabbitMQService.getDelayForProcessor.mockResolvedValue(null);
      mockRabbitMQService.getGlobalParameter.mockResolvedValue(null);

      const result = await service.getTopology('order_processor');

      expect(result.description).toBe('No retries, no DLQ');
    });
  });

  describe('extractProcessorName', () => {
    it('should return queue name as-is for main queues', () => {
      expect(service.extractProcessorName('order_processor')).toBe(
        'order_processor',
      );
    });

    it('should strip _runmq_retry_delay_ prefix', () => {
      expect(
        service.extractProcessorName('_runmq_retry_delay_order_processor'),
      ).toBe('order_processor');
    });

    it('should strip _runmq_dlq_ prefix', () => {
      expect(service.extractProcessorName('_runmq_dlq_order_processor')).toBe(
        'order_processor',
      );
    });
  });
});
