import { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/index.js';

const SetGlobalFilters = (app: INestApplication) => {
  app.useGlobalFilters(new HttpExceptionFilter());
};

export default SetGlobalFilters;
