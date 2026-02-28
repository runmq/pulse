import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMQManagementClient } from '../src/rabbitmq/rabbitmq-management.client';

describe('App (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  const mockManagementClient = {
    getQueues: jest.fn(),
    getQueue: jest.fn(),
    getQueueBindings: jest.fn(),
    createBinding: jest.fn(),
    deleteBinding: jest.fn(),
    getPolicies: jest.fn(),
    getPolicy: jest.fn(),
    putPolicy: jest.fn(),
    deletePolicy: jest.fn(),
    getExchanges: jest.fn(),
    getAllBindings: jest.fn(),
    createShovel: jest.fn(),
    deleteShovel: jest.fn(),
    getShovels: jest.fn(),
    getShovel: jest.fn(),
    getGlobalParameter: jest.fn(),
    setGlobalParameter: jest.fn(),
    healthCheck: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQManagementClient)
      .useValue(mockManagementClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Get JWT token via login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    jwtToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Auth Endpoints ──────────────────────────────────────────────

  describe('Auth', () => {
    describe('POST /auth/login', () => {
      it('should return JWT token for valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'admin', password: 'admin123' })
          .expect(200);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.user.username).toBe('admin');
        expect(response.body.user.role).toBe('admin');
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'admin', password: 'wrongpassword' })
          .expect(401);
      });

      it('should return 400 for missing fields', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'admin' })
          .expect(400);
      });
    });

    describe('GET /auth/me', () => {
      it('should return current user with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.username).toBe('admin');
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer()).get('/auth/me').expect(401);
      });
    });

    describe('POST /auth/reload-users', () => {
      it('should reload users with valid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/reload-users')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('Users reloaded successfully');
      });
    });
  });

  // ─── Queue Management Endpoints ──────────────────────────────────

  describe('Queue Management', () => {
    describe('GET /queues', () => {
      it('should return list of RunMQ queues', async () => {
        mockManagementClient.getQueues.mockResolvedValue([
          {
            name: 'order_processor',
            messages: 10,
            messages_ready: 8,
            messages_unacknowledged: 2,
            consumers: 3,
            state: 'running',
            arguments: {
              'x-dead-letter-exchange': '_runmq_dead_letter_router',
            },
          },
        ]);
        mockManagementClient.getQueueBindings.mockResolvedValue([
          {
            source: '_runmq_dead_letter_router',
            routing_key: 'order_processor',
          },
        ]);
        mockManagementClient.getPolicy.mockResolvedValue(null);

        const response = await request(app.getHttpServer())
          .get('/queues')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0].name).toBe('order_processor');
        expect(response.body[0].isRunMQManaged).toBe(true);
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer()).get('/queues').expect(401);
      });
    });

    describe('GET /queues/:processorName', () => {
      it('should return queue details', async () => {
        mockManagementClient.getQueue.mockResolvedValue({
          name: 'order_processor',
          messages: 10,
          messages_ready: 8,
          messages_unacknowledged: 2,
          consumers: 3,
          state: 'running',
        });
        mockManagementClient.getQueueBindings.mockResolvedValue([
          {
            source: '_runmq_dead_letter_router',
            routing_key: 'order_processor',
          },
        ]);
        mockManagementClient.getPolicy.mockResolvedValue({
          definition: { 'message-ttl': 5000 },
        });

        const response = await request(app.getHttpServer())
          .get('/queues/order_processor')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.name).toBe('order_processor');
        expect(response.body.topology).toBeDefined();
      });

      it('should return 404 for nonexistent queue', async () => {
        mockManagementClient.getQueue.mockResolvedValue(null);

        await request(app.getHttpServer())
          .get('/queues/nonexistent')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(404);
      });
    });

    describe('POST /queues/:processorName/retries/enable', () => {
      it('should enable retries', async () => {
        mockManagementClient.createBinding.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/queues/order_processor/retries/enable')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('Retries enabled');
        expect(response.body.processorName).toBe('order_processor');
        expect(mockManagementClient.createBinding).toHaveBeenCalled();
      });
    });

    describe('POST /queues/:processorName/retries/disable', () => {
      it('should disable retries', async () => {
        mockManagementClient.getQueueBindings.mockResolvedValue([
          {
            source: '_runmq_dead_letter_router',
            routing_key: 'order_processor',
            properties_key: 'order_processor',
          },
        ]);
        mockManagementClient.deleteBinding.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/queues/order_processor/retries/disable')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('Retries disabled');
      });
    });

    describe('POST /queues/:processorName/dlq/enable', () => {
      it('should enable DLQ', async () => {
        mockManagementClient.createBinding.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/queues/order_processor/dlq/enable')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('DLQ enabled');
      });
    });

    describe('POST /queues/:processorName/dlq/disable', () => {
      it('should disable DLQ', async () => {
        mockManagementClient.getQueueBindings.mockResolvedValue([
          {
            source: '_runmq_dead_letter_router',
            routing_key: 'dlq_order_processor',
            properties_key: 'dlq_order_processor',
          },
        ]);
        mockManagementClient.deleteBinding.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/queues/order_processor/dlq/disable')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('DLQ disabled');
      });
    });

    describe('PUT /queues/:processorName/delay', () => {
      it('should update retry delay', async () => {
        mockManagementClient.putPolicy.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .put('/queues/order_processor/delay')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({ delayMs: 10000 })
          .expect(200);

        expect(response.body.message).toBe('Delay updated');
        expect(response.body.delayMs).toBe(10000);
      });

      it('should return 400 for invalid delay value', async () => {
        await request(app.getHttpServer())
          .put('/queues/order_processor/delay')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({ delayMs: -1 })
          .expect(400);
      });

      it('should return 400 for missing delayMs', async () => {
        await request(app.getHttpServer())
          .put('/queues/order_processor/delay')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({})
          .expect(400);
      });
    });

    describe('POST /queues/:processorName/reprocess', () => {
      it('should start DLQ reprocessing', async () => {
        mockManagementClient.createShovel.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/queues/order_processor/reprocess')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('DLQ reprocessing started');
        expect(response.body.shovelName).toBeDefined();
      });
    });
  });

  // ─── Schedule Endpoints ──────────────────────────────────────────

  describe('Schedules', () => {
    describe('POST /queues/schedules', () => {
      it('should create a schedule', async () => {
        const response = await request(app.getHttpServer())
          .post('/queues/schedules')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            processorName: 'order_processor',
            cronExpression: '0 0 * * *',
          })
          .expect(201);

        expect(response.body.message).toBe('Schedule created');
        expect(response.body.scheduleId).toBeDefined();
      });

      it('should return 400 for missing fields', async () => {
        await request(app.getHttpServer())
          .post('/queues/schedules')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({ processorName: 'order_processor' })
          .expect(400);
      });
    });

    describe('GET /queues/schedules/list', () => {
      it('should return all schedules', async () => {
        const response = await request(app.getHttpServer())
          .get('/queues/schedules/list')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('PUT /queues/schedules/:id/toggle', () => {
      it('should toggle a schedule', async () => {
        // First create a schedule
        const createResponse = await request(app.getHttpServer())
          .post('/queues/schedules')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            processorName: 'toggle_test',
            cronExpression: '0 0 * * *',
          });

        const scheduleId = createResponse.body.scheduleId;

        const response = await request(app.getHttpServer())
          .put(`/queues/schedules/${scheduleId}/toggle`)
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({ enabled: false })
          .expect(200);

        expect(response.body.message).toBe('Schedule updated');
      });
    });

    describe('DELETE /queues/schedules/:id', () => {
      it('should delete a schedule', async () => {
        // First create a schedule
        const createResponse = await request(app.getHttpServer())
          .post('/queues/schedules')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send({
            processorName: 'delete_test',
            cronExpression: '0 0 * * *',
          });

        const scheduleId = createResponse.body.scheduleId;

        const response = await request(app.getHttpServer())
          .delete(`/queues/schedules/${scheduleId}`)
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body.message).toBe('Schedule deleted');
      });
    });
  });
});
