import { Notification } from '../models/Notification.js';

let ioInstance = null;

export const setNotificationSocket = (io) => {
  ioInstance = io;
};

export const createNotification = async ({
  recipient,
  sender = null,
  workspace,
  project = null,
  task = null,
  type,
  title,
  message,
  link = ''
}) => {
  try {
    // Avoid sending notification to oneself
    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      workspace,
      project,
      task,
      type,
      title,
      message,
      link
    });

    const populated = await Notification.findById(notification._id)
      .populate('sender', 'name email avatar')
      .populate('project', 'name key color')
      .populate('task', 'taskId title');

    if (ioInstance) {
      ioInstance.to(`user:${recipient.toString()}`).emit('notification:new', populated);
    }

    return populated;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};
