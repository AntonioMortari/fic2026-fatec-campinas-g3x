import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFound } from './middlewares/error-handler';
import { routes } from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
