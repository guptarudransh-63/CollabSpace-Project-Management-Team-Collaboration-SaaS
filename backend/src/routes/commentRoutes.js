import express from 'express';
import {
  getTaskComments,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  deleteAttachment
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/task/:taskId', getTaskComments);
router.post('/task/:taskId', requireWorkspaceMember, addComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

router.post('/task/:taskId/attachments', requireWorkspaceMember, addAttachment);
router.delete('/attachments/:attachmentId', deleteAttachment);

export default router;
