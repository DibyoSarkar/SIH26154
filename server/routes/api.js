import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import * as ctrl from '../controllers/transformationController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.get('/config', ctrl.getConfigOptions);

router.get('/transformations', ctrl.listAll);
router.post('/transformations', upload.single('file'), ctrl.createAndRun);
router.get('/transformations/:id', ctrl.getOne);

router.patch('/outputs/:outputId', ctrl.updateOutput);
router.post('/outputs/:outputId/reset', ctrl.resetOutput);
router.post('/outputs/:outputId/regenerate', ctrl.regenerateOutput);
router.get('/outputs/:outputId/export', ctrl.exportOutputHandler);

export default router;
