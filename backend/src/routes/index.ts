import { Router } from 'express';
import { adminEventsRoutes } from './admin-events.routes';
import { authRoutes } from './auth.routes';
import { eventsRoutes } from './events.routes';
import { healthRoutes } from './health.routes';
import { meRoutes } from './me.routes';
import { registrationsRoutes } from './registrations.routes';

export const routes = Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/events', eventsRoutes);
routes.use('/admin/events', adminEventsRoutes);
routes.use('/me', meRoutes);
routes.use('/registrations', registrationsRoutes);
