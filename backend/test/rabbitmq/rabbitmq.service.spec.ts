import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';
import { RabbitMQManagementClient } from '../../src/rabbitmq/rabbitmq-management.client';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let managementClient: RabbitMQManagementClient;

  const mockManagementClient = {
    getQueues: jest.fn(),
    getQueue: jest.fn(),
    getQueueBindings: jest.fn(),
    createBinding: jest.fn(),
    deleteBinding: jest.fn(),
    getPolicies: jest.fn(),
    getPolicy: jest.fn(),
    putPolicy: jest.fn(),
    deletePolicy: jest.fn(),
    getOperatorPolicy: jest.fn(),
    putOperatorPolicy: jest.fn(),
    getExchanges: jest.fn(),
    getAllBindings: jest.fn(),
    createShovel: jest.fn(),
    deleteShovel: jest.fn(),
    getShovels: jest.fn(),
    getShovel: jest.fn(),
    getGlobalParameter: jest.fn(),
    setGlobalParameter: jest.fn(),
    healthCheck: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: RabbitMQManagementClient,
          useValue: mockManagementClient,
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    managementClient = module.get<RabbitMQManagementClient>(
      RabbitMQManagementClient,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRunMQQueues', () => {
    it('should return only queues with RunMQ dead letter exchange', async () => {
      mockManagementClient.getQueues.mockResolvedValue([
        {
          name: 'order_processor',
          arguments: {
            'x-dead-letter-exchange': '_runmq_dead_letter_router',
          },
        },
        {
          name: 'regular_queue',
          arguments: {},
        },
        {
          name: 'payment_processor',
          arguments: {
            'x-dead-letter-exchange': '_runmq_dead_letter_router',
          },
        },
      ]);

      const result = await service.getRunMQQueues();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('order_processor');
      expect(result[1].name).toBe('payment_processor');
    });

    it('should return empty array when no RunMQ queues exist', async () => {
      mockManagementClient.getQueues.mockResolvedValue([
        { name: 'regular_queue', arguments: {} },
      ]);

      const result = await service.getRunMQQueues();

      expect(result).toHaveLength(0);
    });
  });

  describe('areRetriesEnabled', () => {
    it('should return true when retry binding exists', async () => {
      mockManagementClient.getQueueBindings.mockResolvedValue([
        {
          source: '_runmq_dead_letter_router',
          routing_key: 'order_processor',
        },
      ]);

      const result = await service.areRetriesEnabled('order_processor');

      expect(result).toBe(true);
      expect(mockManagementClient.getQueueBindings).toHaveBeenCalledWith(
        '_runmq_retry_delay_order_processor',
      );
    });

    it('should return false when retry binding does not exist', async () => {
      mockManagementClient.getQueueBindings.mockResolvedValue([
        {
          source: 'other_exchange',
          routing_key: 'order_processor',
        },
      ]);

      const result = await service.areRetriesEnabled('order_processor');

      expect(result).toBe(false);
    });

    it('should return false when no bindings exist', async () => {
      mockManagementClient.getQueueBindings.mockResolvedValue([]);

      const result = await service.areRetriesEnabled('order_processor');

      expect(result).toBe(false);
    });
  });

  describe('isDLQEnabled', () => {
    it('should return true when DLQ binding exists', async () => {
      mockManagementClient.getQueueBindings.mockResolvedValue([
        {
          source: '_runmq_dead_letter_router',
          routing_key: '_runmq_dlq_order_processor',
        },
      ]);

      const result = await service.isDLQEnabled('order_processor');

      expect(result).toBe(true);
      expect(mockManagementClient.getQueueBindings).toHaveBeenCalledWith(
        '_runmq_dlq_order_processor',
      );
    });

    it('should return false when DLQ binding does not exist', async () => {
      mockManagementClient.getQueueBindings.mockResolvedValue([]);

      const result = await service.isDLQEnabled('order_processor');

      expect(result).toBe(false);
    });
  });

  describe('getDelayForProcessor', () => {
    it('should return TTL from policy', async () => {
      mockManagementClient.getOperatorPolicy.mockResolvedValue({
        name: '_runmq_message_ttl_operator_policy_runmq_retry_delay_order_processor',
        definition: { 'message-ttl': 5000 },
      });

      const result = await service.getDelayForProcessor('order_processor');

      expect(result).toBe(5000);
      expect(mockManagementClient.getOperatorPolicy).toHaveBeenCalledWith(
        '_runmq_message_ttl_operator_policy_runmq_retry_delay_order_processor',
      );
    });

    it('should return null when no policy exists', async () => {
      mockManagementClient.getOperatorPolicy.mockResolvedValue(null);

      const result = await service.getDelayForProcessor('order_processor');

      expect(result).toBeNull();
    });

    it('should return null when policy has no message-ttl', async () => {
      mockManagementClient.getOperatorPolicy.mockResolvedValue({
        name: '_runmq_message_ttl_operator_policy_runmq_retry_delay_order_processor',
        definition: {},
      });

      const result = await service.getDelayForProcessor('order_processor');

      expect(result).toBeNull();
    });
  });

  describe('forwarded methods', () => {
    it('should forward getQueue to management client', async () => {
      const mockQueue = { name: 'test' };
      mockManagementClient.getQueue.mockResolvedValue(mockQueue);

      const result = await service.getQueue('test');

      expect(result).toEqual(mockQueue);
      expect(mockManagementClient.getQueue).toHaveBeenCalledWith('test');
    });

    it('should forward createBinding to management client', async () => {
      mockManagementClient.createBinding.mockResolvedValue(undefined);

      await service.createBinding('ex', 'q', 'key', { arg: 1 });

      expect(mockManagementClient.createBinding).toHaveBeenCalledWith(
        'ex', 'q', 'key', { arg: 1 },
      );
    });

    it('should forward deleteBinding to management client', async () => {
      mockManagementClient.deleteBinding.mockResolvedValue(undefined);

      await service.deleteBinding('ex', 'q', 'props');

      expect(mockManagementClient.deleteBinding).toHaveBeenCalledWith(
        'ex', 'q', 'props',
      );
    });

    it('should forward putPolicy to management client', async () => {
      mockManagementClient.putPolicy.mockResolvedValue(undefined);

      await service.putPolicy('p', '^q$', { ttl: 1 }, 'queues', 5);

      expect(mockManagementClient.putPolicy).toHaveBeenCalledWith(
        'p', '^q$', { ttl: 1 }, 'queues', 5,
      );
    });

    it('should forward createShovel to management client', async () => {
      const config = { value: { 'src-uri': 'amqp://localhost', 'src-queue': 'q', 'dest-uri': 'amqp://localhost', 'ack-mode': 'on-confirm' as const } };
      mockManagementClient.createShovel.mockResolvedValue(undefined);

      await service.createShovel('shovel1', config);

      expect(mockManagementClient.createShovel).toHaveBeenCalledWith(
        'shovel1', config,
      );
    });

    it('should forward getGlobalParameter to management client', async () => {
      const metadata = { version: 1, maxRetries: 10 };
      mockManagementClient.getGlobalParameter.mockResolvedValue(metadata);

      const result = await service.getGlobalParameter('_runmq_metadata_test');

      expect(result).toEqual(metadata);
      expect(mockManagementClient.getGlobalParameter).toHaveBeenCalledWith(
        '_runmq_metadata_test',
      );
    });

    it('should forward setGlobalParameter to management client', async () => {
      mockManagementClient.setGlobalParameter.mockResolvedValue(undefined);

      await service.setGlobalParameter('_runmq_metadata_test', { version: 1 });

      expect(mockManagementClient.setGlobalParameter).toHaveBeenCalledWith(
        '_runmq_metadata_test',
        { version: 1 },
      );
    });

    it('should forward healthCheck to management client', async () => {
      mockManagementClient.healthCheck.mockResolvedValue(true);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });
  });
});
