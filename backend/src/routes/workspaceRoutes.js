import express from 'express';
import {
  getMyWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  getWorkspaceMembers,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
  getPendingInvitations
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);
router.post('/accept-invite', acceptInvitation);

router.get('/:id', requireWorkspaceMember, getWorkspaceById);
router.put('/:id', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), updateWorkspace);

router.get('/:id/members', requireWorkspaceMember, getWorkspaceMembers);
router.post('/:id/members/invite', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), inviteMember);
router.put('/:id/members/:memberId/role', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), updateMemberRole);
router.delete('/:id/members/:memberId', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), removeMember);
router.get('/:id/invitations', requireWorkspaceMember, requireWorkspaceRole(['owner', 'admin']), getPendingInvitations);

export default router;
