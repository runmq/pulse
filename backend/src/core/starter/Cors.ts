import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../configs/index.js';

const configureCors = (app: INestApplication) => {
  const configService = app.get(ConfigService<AppConfig>);
  const corsOrigin = configService.get('corsOrigin', { infer: true });

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: 'Authorization, Content-Type, Accept',
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  });
};

export default configureCors;
