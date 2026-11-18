import { ActivityLog } from '../models/ActivityLog.js';

let ioInstance = null;

export const setActivitySocket = (io) => {
  ioInstance = io;
};

export const logActivity = async ({
  workspace,
  project = null,
  task = null,
  actor,
  action,
  entityType,
  entityId = null,
  entityTitle = '',
  metadata = {}
}) => {
  try {
    const activity = await ActivityLog.create({
      workspace,
      project,
      task,
      actor,
      action,
      entityType,
      entityId,
      entityTitle,
      metadata
    });

    const populated = await ActivityLog.findById(activity._id)
      .populate('actor', 'name email avatar')
      .populate('project', 'name key color')
      .populate('task', 'taskId title status priority');

    if (ioInstance) {
      // Broadcast to workspace room
      ioInstance.to(`workspace:${workspace.toString()}`).emit('activity:created', populated);
      if (project) {
        ioInstance.to(`project:${project.toString()}`).emit('activity:created', populated);
      }
    }

    return populated;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    return null;
  }
};
