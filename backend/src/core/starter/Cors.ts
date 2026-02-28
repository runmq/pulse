import { INestApplication } from '@nestjs/common';

const configureCors = (app: INestApplication) => {
  app.enableCors({
    origin: "*",
    credentials: true,
    allowedHeaders: 'Authorization, Content-Type, Accept',
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  });
};

export default configureCors;
