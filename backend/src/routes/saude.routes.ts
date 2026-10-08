import { Router } from 'express';
import { consultarSaude } from '../controllers/saude.controller';

export const rotasDeSaude = Router();

rotasDeSaude.get('/', consultarSaude);
