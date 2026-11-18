import { Notification } from '../models/Notification.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { isRead, limit = 50, page = 1 } = req.query;

    const query = { recipient: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    const notifications = await Notification.find(query)
      .populate('sender', 'name email avatar')
      .populate('project', 'name key color')
      .populate('task', 'taskId title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return ApiResponse.success(res, 'Marked as read', { notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return ApiResponse.success(res, 'All notifications marked as read', { unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return ApiResponse.success(res, 'Notification deleted', { unreadCount });
  } catch (error) {
    next(error);
  }
};
