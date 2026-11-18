import { ActivityLog } from '../models/ActivityLog.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getActivities = async (req, res, next) => {
  try {
    const {
      workspaceId,
      projectId,
      taskId,
      actorId,
      action,
      entityType,
      page = 1,
      limit = 30
    } = req.query;

    const query = {};

    if (workspaceId) query.workspace = workspaceId;
    if (projectId) query.project = projectId;
    if (taskId) query.task = taskId;
    if (actorId) query.actor = actorId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(query);

    const activities = await ActivityLog.find(query)
      .populate('actor', 'name email avatar')
      .populate('project', 'name key color')
      .populate('task', 'taskId title status priority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(res, 'Activities retrieved', activities, {
      page: Number(page),
      limit: Number(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};
