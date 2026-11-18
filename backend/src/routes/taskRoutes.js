import express from 'express';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  duplicateTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  bulkUpdateTasks,
  bulkDeleteTasks
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireWorkspaceMember, getTasks);
router.post('/', requireWorkspaceMember, createTask);
router.post('/bulk-update', requireWorkspaceMember, bulkUpdateTasks);
router.post('/bulk-delete', requireWorkspaceMember, bulkDeleteTasks);

router.get('/:id', getTaskById);
router.put('/:id', requireWorkspaceMember, updateTask);
router.put('/:id/move', requireWorkspaceMember, moveTask);
router.post('/:id/duplicate', requireWorkspaceMember, duplicateTask);
router.delete('/:id', requireWorkspaceMember, deleteTask);

// Subtasks
router.post('/:id/subtasks', requireWorkspaceMember, addSubtask);
router.put('/subtasks/:subtaskId/toggle', requireWorkspaceMember, toggleSubtask);
router.delete('/subtasks/:subtaskId', requireWorkspaceMember, deleteSubtask);

export default router;
