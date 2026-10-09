import { Router } from 'express';
import { downloadEventCalendar, eventParams, listEvents, listEventsQuery } from '../controllers/events.controller';
import { validate } from '../middlewares/validate';

export const eventsRoutes = Router();

eventsRoutes.get('/', validate({ query: listEventsQuery }), listEvents);
eventsRoutes.get('/:id/calendar.ics', validate({ params: eventParams }), downloadEventCalendar);
