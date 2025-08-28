import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('API Endpoints', () => {
    it('/api (GET) - should return API info', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('Tontine Endpoints', () => {
    const testTontine = {
      name: 'Test Tontine E2E',
      description: 'Test Description E2E',
      amount: 1000,
      frequency: 'monthly',
    };

    let createdTontineId: number;

    it('/api/tontine (POST) - should create a new tontine', () => {
      return request(app.getHttpServer())
        .post('/api/tontine')
        .send(testTontine)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(testTontine.name);
          expect(res.body.description).toBe(testTontine.description);
          expect(res.body.amount).toBe(testTontine.amount);
          createdTontineId = res.body.id;
        });
    });

    it('/api/tontine/:id (GET) - should return a tontine by id', () => {
      return request(app.getHttpServer())
        .get(`/api/tontine/${createdTontineId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(createdTontineId);
          expect(res.body.name).toBe(testTontine.name);
        });
    });

    it('/api/tontine/:id (PATCH) - should update a tontine', () => {
      const updateData = {
        name: 'Updated Tontine E2E',
        description: 'Updated Description E2E',
      };

      return request(app.getHttpServer())
        .patch(`/api/tontine/${createdTontineId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(createdTontineId);
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.description).toBe(updateData.description);
        });
    });

    it('/api/tontine/:id (DELETE) - should delete a tontine', () => {
      return request(app.getHttpServer())
        .delete(`/api/tontine/${createdTontineId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Authentication Endpoints', () => {
    it('/api/auth/login (POST) - should handle login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'invaliduser',
          password: 'invalidpassword',
        })
        .expect(401);
    });

    it('/api/auth/register (POST) - should handle registration with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: '',
          password: '',
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should handle invalid JSON', () => {
      return request(app.getHttpServer())
        .post('/api/tontine')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', () => {
      return request(app.getHttpServer())
        .options('/api/tontine')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
        });
    });
  });
});
