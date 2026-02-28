import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import SetGlobalFilters from 'core/starter/SetGlobalFilter';
import SetGlobalPipes from 'core/starter/SetGlobalPipes';
import SecurityMiddlewares from 'core/starter/SecurityMiddlewares';
import Cors from 'core/starter/Cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  SecurityMiddlewares(app);
  SetGlobalFilters(app);
  SetGlobalPipes(app);
  Cors(app);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on http://localhost:${port}`);
}
bootstrap();
