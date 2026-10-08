import request from 'supertest';
import { criarApp } from '../src/app';
import { sequelize } from '../src/models';

const app = criarApp();

describe('GET /api/saude', () => {
  it('responde 200 quando o banco responde', async () => {
    jest.spyOn(sequelize, 'authenticate').mockResolvedValue();

    const resposta = await request(app).get('/api/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ status: 'ok', banco: 'ok' });
  });

  it('responde 503 quando o banco está fora do ar, sem derrubar a API', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValue(new Error('ECONNREFUSED'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const resposta = await request(app).get('/api/saude');

    expect(resposta.status).toBe(503);
    expect(resposta.body.banco).toBe('indisponivel');
  });
});

afterEach(() => jest.restoreAllMocks());

describe('erros no formato único', () => {
  it('rota inexistente responde 404 com { erro: { codigo, mensagem } }', async () => {
    const resposta = await request(app).get('/api/rota-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('nao_encontrado');
  });

  it('JSON malformado responde 400, não 500', async () => {
    const resposta = await request(app)
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send('{"quebrado":');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('json_invalido');
  });
});

describe('CORS (RNF-SEG-04)', () => {
  it('libera a origem do front-end', async () => {
    const resposta = await request(app).get('/api/rota-qualquer').set('Origin', 'http://localhost:5173');

    expect(resposta.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('não libera uma origem que não está na lista', async () => {
    const resposta = await request(app).get('/api/rota-qualquer').set('Origin', 'https://site-estranho.example');

    expect(resposta.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('documentação (RNF-QUA-01)', () => {
  it('serve o Swagger em /api-docs', async () => {
    const resposta = await request(app).get('/api-docs/');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('swagger-ui');
  });

  it('não expõe o Express no cabeçalho', async () => {
    const resposta = await request(app).get('/api/saude');

    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });
});
