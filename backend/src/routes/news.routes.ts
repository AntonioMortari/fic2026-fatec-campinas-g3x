import { Router } from 'express';
import { getNews, getNewsImage, listNews } from '../controllers/news.controller';
import { validate } from '../middlewares/validate';
import { newsParams } from '../validators/news.validator';

export const newsRoutes = Router();

newsRoutes.get('/', listNews);
newsRoutes.get('/:id/image', validate({ params: newsParams }), getNewsImage);
newsRoutes.get('/:id', validate({ params: newsParams }), getNews);
