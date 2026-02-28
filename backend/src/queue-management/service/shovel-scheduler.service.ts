import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service.js';
import { ConfigService } from '@nestjs/config';
import { Constants } from '../../constants.js';
import { AppConfig } from '../../configs/index.js';

@Injectable()
export class ShovelSchedulerService {
  private readonly logger = new Logger(ShovelSchedulerService.name);

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async createOneTimeShovel(processorName: string): Promise<string> {
    const shovelName = `${Constants.REPROCESS_SHOVEL_PREFIX}${processorName}_${Date.now()}`;
    const dlqName = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;
    const vhost = this.configService.get('rabbitmq.vhost', { infer: true })!;
    const user = this.configService.get('rabbitmq.managementUser', {
      infer: true,
    })!;
    const password = this.configService.get('rabbitmq.managementPassword', {
      infer: true,
    })!;
    const host = this.configService.get('rabbitmq.host', { infer: true })!;

    const encodedVhost = encodeURIComponent(vhost);
    const amqpUri = `amqp://${user}:${password}@${host}/${encodedVhost}`;

    const shovelConfig = {
      value: {
        'src-uri': amqpUri,
        'src-queue': dlqName,
        'dest-uri': amqpUri,
        'dest-queue': processorName,
        'ack-mode': 'on-confirm' as const,
        'delete-after': 'queue-length' as const,
        'dest-add-timestamp-header': true,
      },
    };

    await this.rabbitmqService.createShovel(shovelName, shovelConfig);

    this.logger.log(`Created one-time shovel: ${shovelName}`);

    return shovelName;
  }
}
