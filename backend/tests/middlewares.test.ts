import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { autenticar } from '../src/middlewares/autenticar';
import { tratarErros } from '../src/middlewares/tratarErros';
import { validar } from '../src/middlewares/validar';
import { assinarToken } from '../src/utils/token';

function appDeTeste(montar: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  montar(app);
  app.use(tratarErros);
  return app;
}

describe('validar (RNF-SEG-03)', () => {
  const app = appDeTeste((app) => {
    app.post(
      '/eco',
      validar({ body: z.object({ nome: z.string().min(1), idade: z.number().int() }) }),
      (req, res) => res.json(req.body),
    );
    app.get('/busca', validar({ query: z.object({ pagina: z.coerce.number().int().min(1) }) }), (req, res) =>
      res.json(req.query),
    );
  });

  it('recusa corpo inválido com 400 e lista os campos', async () => {
    const resposta = await request(app).post('/eco').send({ nome: '', idade: 'dez' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('dados_invalidos');
    const campos = resposta.body.erro.detalhes.map((d: { campo: string }) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['nome', 'idade']));
  });

  it('descarta campos que o esquema não conhece', async () => {
    const resposta = await request(app).post('/eco').send({ nome: 'Ana', idade: 30, ehEquipe: true });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ nome: 'Ana', idade: 30 });
  });

  it('entrega a query já convertida pelo esquema', async () => {
    const resposta = await request(app).get('/busca?pagina=2');

    expect(resposta.body).toEqual({ pagina: 2 });
  });
});

describe('autenticar (RNF-SEG-01)', () => {
  const app = appDeTeste((app) => {
    app.get('/privado', autenticar, (req, res) => res.json({ id: req.usuario?.id }));
  });

  it('sem token responde 401', async () => {
    const resposta = await request(app).get('/privado');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro.codigo).toBe('nao_autenticado');
  });

  it('com token inválido responde 401', async () => {
    const resposta = await request(app).get('/privado').set('Authorization', 'Bearer nao-e-um-jwt');

    expect(resposta.status).toBe(401);
  });

  it('com token válido entrega o id ao controller', async () => {
    const token = assinarToken({ sub: 'usuario-123' });

    const resposta = await request(app).get('/privado').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ id: 'usuario-123' });
  });
});

describe('tratarErros (RNF-BE-03)', () => {
  const app = appDeTeste((app) => {
    app.get('/explode', async () => {
      throw new Error('detalhe interno que não pode vazar');
    });
  });

  it('erro inesperado num handler async vira 500 sem vazar a mensagem', async () => {
    const espiao = jest.spyOn(console, 'error').mockImplementation(() => {});

    const resposta = await request(app).get('/explode');

    expect(resposta.status).toBe(500);
    expect(resposta.body.erro.codigo).toBe('erro_interno');
    expect(JSON.stringify(resposta.body)).not.toContain('detalhe interno');
    espiao.mockRestore();
  });
});
