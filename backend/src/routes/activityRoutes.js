import express from 'express';
import { getActivities } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireWorkspaceMember, getActivities);

export default router;
