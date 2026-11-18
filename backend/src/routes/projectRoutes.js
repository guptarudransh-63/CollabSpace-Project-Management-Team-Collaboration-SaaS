import express from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireWorkspaceMember, getProjects);
router.post('/', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), createProject);

router.get('/:id', getProjectById);
router.put('/:id', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), updateProject);
router.delete('/:id', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), deleteProject);

router.post('/:id/members', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), addProjectMember);
router.delete('/:id/members/:memberId', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin', 'project_manager']), removeProjectMember);

export default router;
