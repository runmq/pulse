import * as path from 'path';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rabbitmq: {
    host: string;
    port: number;
    managementUser: string;
    managementPassword: string;
    vhost: string;
  };
  usersConfigPath: string;
}

// Joi schema validates env vars before this runs,
// so required fields like JWT_SECRET are guaranteed to exist.
export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST ?? 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT ?? '15672', 10),
    managementUser: process.env.RABBITMQ_MANAGEMENT_USER ?? 'guest',
    managementPassword: process.env.RABBITMQ_MANAGEMENT_PASSWORD ?? 'guest',
    vhost: process.env.RABBITMQ_VHOST ?? '/',
  },
  usersConfigPath:
    process.env.USERS_CONFIG_PATH ??
    path.join(process.cwd(), 'config', 'users.json'),
});
