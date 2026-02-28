import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

const SetGlobalPipes = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    }),
  );
};

export default SetGlobalPipes;
