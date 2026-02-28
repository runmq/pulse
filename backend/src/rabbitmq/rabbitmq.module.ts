import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service.js';
import { RabbitMQManagementClient } from './rabbitmq-management.client.js';

@Module({
  imports: [ConfigModule],
  providers: [RabbitMQManagementClient, RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
