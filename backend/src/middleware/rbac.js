import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Workspace } from '../models/Workspace.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  project_manager: 2,
  member: 1
};

export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId =
      req.params.workspaceId ||
      req.body.workspace ||
      req.query.workspaceId ||
      req.headers['x-workspace-id'];

    if (!workspaceId) {
      return ApiResponse.error(res, 'Workspace ID is required.', 400);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return ApiResponse.error(res, 'Workspace not found.', 404);
    }

    const membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user._id
    });

    if (!membership) {
      return ApiResponse.error(res, 'You do not have access to this workspace.', 403);
    }

    req.workspace = workspace;
    req.workspaceMember = membership;
    next();
  } catch (error) {
    return ApiResponse.error(res, `Authorization check failed: ${error.message}`, 500);
  }
};

export const requireWorkspaceRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.workspaceMember) {
      return ApiResponse.error(res, 'Workspace membership not verified.', 403);
    }

    // Owner always has access
    if (req.workspaceMember.role === 'owner') {
      return next();
    }

    if (!allowedRoles.includes(req.workspaceMember.role)) {
      return ApiResponse.error(
        res,
        `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};

export const hasMinimumRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.workspaceMember) {
      return ApiResponse.error(res, 'Workspace membership not verified.', 403);
    }

    const userLevel = ROLE_HIERARCHY[req.workspaceMember.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return ApiResponse.error(res, `Permission denied. Minimum role required: ${requiredRole}`, 403);
    }

    next();
  };
};
