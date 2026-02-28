import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';

const SecurityMiddlewares = (app: NestExpressApplication) => {
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 5 minutes
      max: 1000, // limit each IP to 100 requests per windowMs
    }),
  );
};

export default SecurityMiddlewares;
