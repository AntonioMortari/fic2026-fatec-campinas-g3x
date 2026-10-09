import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { eventsRoutes } from './events.routes';
import { healthRoutes } from './health.routes';

export const routes = Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/events', eventsRoutes);
