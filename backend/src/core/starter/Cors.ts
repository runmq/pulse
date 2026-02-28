import { INestApplication } from '@nestjs/common';

const configureCors = (app: INestApplication) => {
  app.enableCors({
    origin: '*',
    allowedHeaders: 'Authorization, Content-Type, Accept',
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  });
};

export default configureCors;
