import { Router } from 'express';
import { createRegistration, downloadEventCalendar, getEvent, listEvents } from '../controllers/events.controller';
import { eventParams, listEventsQuery, registrationBody } from '../validators/events.validator';
import { optionalAuthenticate } from '../middlewares/optional-authenticate';
import { validate } from '../middlewares/validate';

export const eventsRoutes = Router();

eventsRoutes.get('/', validate({ query: listEventsQuery }), listEvents);
eventsRoutes.get('/:id/calendar.ics', validate({ params: eventParams }), downloadEventCalendar);
eventsRoutes.get('/:id', validate({ params: eventParams }), getEvent);
eventsRoutes.post('/:id/registrations', optionalAuthenticate, validate({ params: eventParams, body: registrationBody }), createRegistration);
