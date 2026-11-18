import express from 'express';
import { getSavedViews, createSavedView, deleteSavedView } from '../controllers/savedViewController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireWorkspaceMember, getSavedViews);
router.post('/', requireWorkspaceMember, createSavedView);
router.delete('/:id', deleteSavedView);

export default router;
