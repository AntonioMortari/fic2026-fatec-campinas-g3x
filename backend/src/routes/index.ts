import { Router } from 'express';
import { eventsRoutes } from './events.routes';
import { healthRoutes } from './health.routes';

export const routes = Router();

routes.use('/health', healthRoutes);
routes.use('/events', eventsRoutes);
