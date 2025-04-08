import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
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

  afterEach(async () => {
    await app.close();
  });

  describe('/hello (GET)', () => {
    it('should return hello message with number', () => {
      return request(app.getHttpServer())
        .get('/hello')
        .expect(200)
        .expect('Hello World! Number: 1');
    });
  });

  describe('/debug-sentry (GET)', () => {
    it('should return 500 error with specific message', () => {
      return request(app.getHttpServer())
        .get('/debug-sentry')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toBe('My first Sentry error!');
        });
    });
  });
});
