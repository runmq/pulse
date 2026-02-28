import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';

const SecurityMiddlewares = (app: NestExpressApplication) => {
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // limit each IP to 1000 requests per window
    }),
  );
};

export default SecurityMiddlewares;
