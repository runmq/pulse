import * as Joi from 'joi';

const configsSchema = Joi.object({
  PORT: Joi.number().default(3001),
  CORS_ORIGIN: Joi.string().default('http://localhost:3002'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  RABBITMQ_HOST: Joi.string().default('localhost'),
  RABBITMQ_PORT: Joi.number().default(15672),
  RABBITMQ_MANAGEMENT_USER: Joi.string().default('guest'),
  RABBITMQ_MANAGEMENT_PASSWORD: Joi.string().default('guest'),
  RABBITMQ_VHOST: Joi.string().default('/'),
  USERS_CONFIG_PATH: Joi.string().optional(),
});

export default configsSchema;
