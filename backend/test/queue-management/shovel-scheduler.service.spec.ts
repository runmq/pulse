import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ShovelSchedulerService } from '../../src/queue-management/service/shovel-scheduler.service';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';

describe('ShovelSchedulerService', () => {
  let service: ShovelSchedulerService;

  const mockRabbitMQService = {
    createShovel: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'rabbitmq.vhost': '/',
        'rabbitmq.managementUser': 'guest',
        'rabbitmq.managementPassword': 'guest',
        'rabbitmq.host': 'localhost',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShovelSchedulerService,
        { provide: RabbitMQService, useValue: mockRabbitMQService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ShovelSchedulerService>(ShovelSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOneTimeShovel', () => {
    it('should create a shovel with correct config', async () => {
      mockRabbitMQService.createShovel.mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1709078400000);

      const result = await service.createOneTimeShovel('order_processor');

      expect(result).toBe('_runmq_reprocess_order_processor_1709078400000');
      expect(mockRabbitMQService.createShovel).toHaveBeenCalledWith(
        '_runmq_reprocess_order_processor_1709078400000',
        {
          value: {
            'src-uri': 'amqp://guest:guest@localhost/%2F',
            'src-queue': '_runmq_dlq_order_processor',
            'dest-uri': 'amqp://guest:guest@localhost/%2F',
            'dest-queue': 'order_processor',
            'ack-mode': 'on-confirm',
            'delete-after': 'queue-length',
            'dest-add-timestamp-header': true,
          },
        },
      );

      jest.restoreAllMocks();
    });
  });
});
