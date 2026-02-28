import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQManagementClient } from '../../src/rabbitmq/rabbitmq-management.client';

jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

import axios from 'axios';

describe('RabbitMQManagementClient', () => {
  let client: RabbitMQManagementClient;
  let mockAxiosInstance: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQManagementClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'rabbitmq.host': 'localhost',
                'rabbitmq.port': 15672,
                'rabbitmq.managementUser': 'guest',
                'rabbitmq.managementPassword': 'guest',
                'rabbitmq.vhost': '/',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    client = module.get<RabbitMQManagementClient>(RabbitMQManagementClient);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should initialize axios with correct config', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:15672/api',
      auth: { username: 'guest', password: 'guest' },
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    });
  });

  describe('getQueues', () => {
    it('should return all queues', async () => {
      const mockQueues = [{ name: 'test_queue', messages: 5 }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockQueues });

      const result = await client.getQueues();

      expect(result).toEqual(mockQueues);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/queues/%2F');
    });
  });

  describe('getQueue', () => {
    it('should return a specific queue', async () => {
      const mockQueue = { name: 'test_queue', messages: 5 };
      mockAxiosInstance.get.mockResolvedValue({ data: mockQueue });

      const result = await client.getQueue('test_queue');

      expect(result).toEqual(mockQueue);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/queues/%2F/test_queue',
      );
    });

    it('should encode special characters in queue name', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      await client.getQueue('my/queue');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/queues/%2F/my%2Fqueue',
      );
    });
  });

  describe('getQueueBindings', () => {
    it('should return bindings for a queue', async () => {
      const mockBindings = [
        { source: 'exchange', routing_key: 'key' },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockBindings });

      const result = await client.getQueueBindings('test_queue');

      expect(result).toEqual(mockBindings);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/queues/%2F/test_queue/bindings',
      );
    });
  });

  describe('createBinding', () => {
    it('should create a binding between exchange and queue', async () => {
      mockAxiosInstance.post.mockResolvedValue({});

      await client.createBinding('my_exchange', 'my_queue', 'routing_key');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/bindings/%2F/e/my_exchange/q/my_queue',
        { routing_key: 'routing_key', arguments: {} },
      );
    });

    it('should pass arguments when provided', async () => {
      mockAxiosInstance.post.mockResolvedValue({});

      await client.createBinding('ex', 'q', 'key', { custom: 'arg' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/bindings/%2F/e/ex/q/q',
        { routing_key: 'key', arguments: { custom: 'arg' } },
      );
    });
  });

  describe('deleteBinding', () => {
    it('should delete a binding', async () => {
      mockAxiosInstance.delete.mockResolvedValue({});

      await client.deleteBinding('my_exchange', 'my_queue', 'props_key');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/bindings/%2F/e/my_exchange/q/my_queue/props_key',
      );
    });
  });

  describe('getPolicies', () => {
    it('should return all policies', async () => {
      const mockPolicies = [{ name: 'policy1' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockPolicies });

      const result = await client.getPolicies();

      expect(result).toEqual(mockPolicies);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/policies/%2F');
    });
  });

  describe('getPolicy', () => {
    it('should return a specific policy', async () => {
      const mockPolicy = { name: 'policy1', definition: {} };
      mockAxiosInstance.get.mockResolvedValue({ data: mockPolicy });

      const result = await client.getPolicy('policy1');

      expect(result).toEqual(mockPolicy);
    });

    it('should return null for 404', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404 },
      });

      const result = await client.getPolicy('nonexistent');

      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
      });

      await expect(client.getPolicy('policy1')).rejects.toEqual({
        response: { status: 500 },
      });
    });
  });

  describe('putPolicy', () => {
    it('should create a policy with defaults', async () => {
      mockAxiosInstance.put.mockResolvedValue({});

      await client.putPolicy('policy1', '^test$', { 'message-ttl': 5000 });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/policies/%2F/policy1',
        {
          pattern: '^test$',
          definition: { 'message-ttl': 5000 },
          'apply-to': 'queues',
          priority: 0,
        },
      );
    });

    it('should create a policy with custom apply-to and priority', async () => {
      mockAxiosInstance.put.mockResolvedValue({});

      await client.putPolicy('p', '^q$', {}, 'exchanges', 10);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/policies/%2F/p',
        {
          pattern: '^q$',
          definition: {},
          'apply-to': 'exchanges',
          priority: 10,
        },
      );
    });
  });

  describe('deletePolicy', () => {
    it('should delete a policy', async () => {
      mockAxiosInstance.delete.mockResolvedValue({});

      await client.deletePolicy('policy1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/policies/%2F/policy1',
      );
    });
  });

  describe('getExchanges', () => {
    it('should return all exchanges', async () => {
      const mockExchanges = [{ name: 'amq.direct' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockExchanges });

      const result = await client.getExchanges();

      expect(result).toEqual(mockExchanges);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/exchanges/%2F');
    });
  });

  describe('getAllBindings', () => {
    it('should return all bindings', async () => {
      const mockBindings = [{ source: 'ex', destination: 'q' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockBindings });

      const result = await client.getAllBindings();

      expect(result).toEqual(mockBindings);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bindings/%2F');
    });
  });

  describe('createShovel', () => {
    it('should create a shovel', async () => {
      mockAxiosInstance.put.mockResolvedValue({});

      const config = {
        value: {
          'src-uri': 'amqp://localhost',
          'src-queue': 'dlq_test',
          'dest-uri': 'amqp://localhost',
          'dest-exchange': '_runmq_dead_letter_router',
          'ack-mode': 'on-confirm' as const,
        },
      };

      await client.createShovel('shovel1', config);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/parameters/shovel/%2F/shovel1',
        config,
      );
    });
  });

  describe('getShovel', () => {
    it('should return a specific shovel', async () => {
      const mockShovel = { name: 'shovel1', vhost: '/' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockShovel });

      const result = await client.getShovel('shovel1');

      expect(result).toEqual(mockShovel);
    });

    it('should return null for 404', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404 },
      });

      const result = await client.getShovel('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getGlobalParameter', () => {
    it('should return parameter value', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { value: { version: 1, maxRetries: 10 } },
      });

      const result = await client.getGlobalParameter('_runmq_metadata_test');

      expect(result).toEqual({ version: 1, maxRetries: 10 });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/global-parameters/_runmq_metadata_test',
      );
    });

    it('should return null for 404', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404 },
      });

      const result = await client.getGlobalParameter('nonexistent');

      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
      });

      await expect(
        client.getGlobalParameter('param'),
      ).rejects.toEqual({ response: { status: 500 } });
    });
  });

  describe('setGlobalParameter', () => {
    it('should set a global parameter', async () => {
      mockAxiosInstance.put.mockResolvedValue({});

      await client.setGlobalParameter('_runmq_metadata_test', {
        version: 1,
        maxRetries: 5,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/global-parameters/_runmq_metadata_test',
        { value: { version: 1, maxRetries: 5 } },
      );
    });
  });

  describe('purgeQueue', () => {
    it('should delete queue contents', async () => {
      mockAxiosInstance.delete.mockResolvedValue({});

      await client.purgeQueue('test_queue');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/queues/%2F/test_queue/contents',
      );
    });

    it('should encode special characters in queue name', async () => {
      mockAxiosInstance.delete.mockResolvedValue({});

      await client.purgeQueue('my/queue');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/queues/%2F/my%2Fqueue/contents',
      );
    });
  });

  describe('getMessages', () => {
    it('should fetch messages with peek mode', async () => {
      const mockMessages = [
        {
          payload: '{"key":"value"}',
          payload_encoding: 'string',
          payload_bytes: 15,
          properties: { headers: {} },
          routing_key: 'test',
          redelivered: false,
          exchange: '',
          message_count: 5,
        },
      ];
      mockAxiosInstance.post.mockResolvedValue({ data: mockMessages });

      const result = await client.getMessages('test_queue', 10);

      expect(result).toEqual(mockMessages);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/queues/%2F/test_queue/get',
        {
          count: 10,
          ackmode: 'ack_requeue_true',
          encoding: 'auto',
          truncate: 50000,
        },
      );
    });

    it('should use default count and truncate values', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: [] });

      await client.getMessages('test_queue');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/queues/%2F/test_queue/get',
        {
          count: 100,
          ackmode: 'ack_requeue_true',
          encoding: 'auto',
          truncate: 50000,
        },
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is reachable', async () => {
      mockAxiosInstance.get.mockResolvedValue({});

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/overview');
    });

    it('should return false when API is unreachable', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection refused'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });
});
