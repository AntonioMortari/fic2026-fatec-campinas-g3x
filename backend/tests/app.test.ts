import request from 'supertest';
import { createApp } from '../src/app';
import { sequelize } from '../src/models';

const app = createApp();

afterEach(() => jest.restoreAllMocks());

describe('GET /api/health', () => {
  it('responds 200 when the database answers', async () => {
    jest.spyOn(sequelize, 'authenticate').mockResolvedValue();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('responds 503 when the database is down, without crashing the API', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValue(new Error('ECONNREFUSED'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.database).toBe('unavailable');
  });
});

describe('single error format', () => {
  it('unknown route responds 404 with { error: { code, message } }', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('not_found');
  });

  it('malformed JSON responds 400, not 500', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_json');
  });
});

describe('CORS (RNF-SEG-04)', () => {
  it('allows the front-end origin', async () => {
    const response = await request(app).get('/api/any').set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not allow an origin outside the list', async () => {
    const response = await request(app).get('/api/any').set('Origin', 'https://unknown.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('documentation (RNF-QUA-01)', () => {
  it('serves Swagger at /api-docs', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('does not expose Express in the headers', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
