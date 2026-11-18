import express from 'express';
import { getWorkspaceDashboardMetrics, getProjectAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/workspace/:workspaceId', requireWorkspaceMember, getWorkspaceDashboardMetrics);
router.get('/project/:projectId', getProjectAnalytics);

export default router;
