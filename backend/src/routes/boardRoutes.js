import express from 'express';
import {
  getProjectBoard,
  createColumn,
  updateColumn,
  reorderColumns,
  deleteColumn
} from '../controllers/boardController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getProjectBoard);
router.post('/column/:boardId', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), createColumn);
router.put('/column/:columnId', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), updateColumn);
router.put('/columns/reorder', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), reorderColumns);
router.delete('/column/:columnId', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), deleteColumn);

export default router;
