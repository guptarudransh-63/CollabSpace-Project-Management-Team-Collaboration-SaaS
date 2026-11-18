import { SavedView } from '../models/SavedView.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getSavedViews = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.query;

    const query = {
      workspace: workspaceId,
      $or: [{ user: req.user._id }, { isShared: true }]
    };

    if (projectId) {
      query.project = projectId;
    }

    const views = await SavedView.find(query).sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Saved views retrieved', views);
  } catch (error) {
    next(error);
  }
};

export const createSavedView = async (req, res, next) => {
  try {
    const { workspaceId, projectId, name, type, filters, sortBy, sortDirection, isShared } = req.body;

    if (!workspaceId || !name) {
      return ApiResponse.error(res, 'Workspace and name are required', 400);
    }

    const view = await SavedView.create({
      workspace: workspaceId,
      project: projectId || null,
      user: req.user._id,
      name,
      type: type || 'kanban',
      filters: filters || {},
      sortBy: sortBy || 'order',
      sortDirection: sortDirection || 'asc',
      isShared: Boolean(isShared)
    });

    return ApiResponse.success(res, 'Saved view created', view, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteSavedView = async (req, res, next) => {
  try {
    const { id } = req.params;

    const view = await SavedView.findOne({ _id: id, user: req.user._id });
    if (!view) {
      return ApiResponse.error(res, 'Saved view not found or not authorized', 404);
    }

    await SavedView.findByIdAndDelete(id);

    return ApiResponse.success(res, 'Saved view deleted');
  } catch (error) {
    next(error);
  }
};
