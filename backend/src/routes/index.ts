import { Router } from 'express';
import { rotasDeSaude } from './saude.routes';

/** Todas as rotas da API, montadas sob `/api` em `app.ts`. */
export const rotas = Router();

rotas.use('/saude', rotasDeSaude);
