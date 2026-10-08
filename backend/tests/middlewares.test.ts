import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { authenticate } from '../src/middlewares/authenticate';
import { errorHandler } from '../src/middlewares/error-handler';
import { validate } from '../src/middlewares/validate';
import { signToken } from '../src/utils/token';

function testApp(mount: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  mount(app);
  app.use(errorHandler);
  return app;
}

describe('validate (RNF-SEG-03)', () => {
  const app = testApp((app) => {
    app.post('/echo', validate({ body: z.object({ name: z.string().min(1), age: z.number().int() }) }), (req, res) =>
      res.json(req.body),
    );
    app.get('/search', validate({ query: z.object({ page: z.coerce.number().int().min(1) }) }), (req, res) =>
      res.json(req.query),
    );
  });

  it('rejects an invalid body with 400 and lists the fields', async () => {
    const response = await request(app).post('/echo').send({ name: '', age: 'ten' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_data');
    const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'age']));
  });

  it('drops fields the schema does not know', async () => {
    const response = await request(app).post('/echo').send({ name: 'Ana', age: 30, isStaff: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'Ana', age: 30 });
  });

  it('hands the query already parsed by the schema', async () => {
    const response = await request(app).get('/search?page=2');

    expect(response.body).toEqual({ page: 2 });
  });
});

describe('authenticate (RNF-SEG-01)', () => {
  const app = testApp((app) => {
    app.get('/private', authenticate, (req, res) => res.json({ id: req.user?.id }));
  });

  it('responds 401 without a token', async () => {
    const response = await request(app).get('/private');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthenticated');
  });

  it('responds 401 with an invalid token', async () => {
    const response = await request(app).get('/private').set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
  });

  it('hands the user id to the controller with a valid token', async () => {
    const token = signToken({ sub: 'user-123' });

    const response = await request(app).get('/private').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'user-123' });
  });
});

describe('errorHandler (RNF-BE-03)', () => {
  const app = testApp((app) => {
    app.get('/explode', async () => {
      throw new Error('internal detail that must not leak');
    });
  });

  it('turns an unexpected async error into 500 without leaking the message', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get('/explode');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('internal_error');
    expect(JSON.stringify(response.body)).not.toContain('internal detail');
    spy.mockRestore();
  });
});
