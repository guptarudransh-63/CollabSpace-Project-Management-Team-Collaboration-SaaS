import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireWorkspaceMember, globalSearch);

export default router;
