import { Router } from 'express';
import templateCrudRouter from './templateCrud.js';
import questionsRouter from './questions.js';
import statisticsRouter from './statistics.js';

const router = Router();

router.use(templateCrudRouter);
router.use(questionsRouter);
router.use(statisticsRouter);

export default router;
