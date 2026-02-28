import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module.js';
import { QueueManagementModule } from './queue-management/queue-management.module.js';
import LoggingInterceptor from 'core/interceptors/logging.interceptor';
import { configurations, configsSchema } from './configs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurations],
      validationSchema: configsSchema,
    }),
    AuthModule,
    RabbitMQModule,
    QueueManagementModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.REQUEST,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
