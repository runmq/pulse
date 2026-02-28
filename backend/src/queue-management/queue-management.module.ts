import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueManagementController } from './queue-management.controller.js';
import { QueueManagementService } from './service/queue-management.service.js';
import { MetadataService } from './metadata.service.js';
import { ShovelSchedulerService } from './service/shovel-scheduler.service.js';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    ConfigModule,
    RabbitMQModule,
    AuthModule,
  ],
  controllers: [QueueManagementController],
  providers: [
    QueueManagementService,
    MetadataService,
    ShovelSchedulerService,
  ],
  exports: [QueueManagementService],
})
export class QueueManagementModule {}
