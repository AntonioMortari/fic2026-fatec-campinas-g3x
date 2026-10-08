import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { ambiente } from './config/env';
import { documentoOpenApi } from './docs/openapi';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros';
import { rotas } from './routes';

/**
 * Monta a aplicação sem abrir porta — é o que os testes importam.
 * Quem escuta a porta é `server.ts`.
 */
export function criarApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  // RNF-SEG-04: só as origens do front-end listadas em CORS_ORIGENS.
  app.use(cors({ origin: ambiente.CORS_ORIGENS }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(documentoOpenApi));
  app.use('/api', rotas);

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
