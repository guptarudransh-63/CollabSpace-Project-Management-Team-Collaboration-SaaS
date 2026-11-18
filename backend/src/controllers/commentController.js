import { TaskComment } from '../models/TaskComment.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { TaskAttachment } from '../models/TaskAttachment.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await TaskComment.find({ task: taskId })
      .populate('user', 'name email avatar title')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, 'Comments retrieved', comments);
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, mentions = [], parentComment = null, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return ApiResponse.error(res, 'Comment content cannot be empty', 400);
    }

    const task = await Task.findById(taskId).populate('assignee');
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const comment = await TaskComment.create({
      task: taskId,
      user: req.user._id,
      content,
      mentions: Array.isArray(mentions) ? mentions : [],
      parentComment,
      attachments
    });

    const populated = await TaskComment.findById(comment._id)
      .populate('user', 'name email avatar title')
      .populate('mentions', 'name email');

    // Notify mentioned users
    if (Array.isArray(mentions) && mentions.length > 0) {
      for (const mentionId of mentions) {
        if (mentionId.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: mentionId,
            sender: req.user._id,
            workspace: task.workspace,
            project: task.project,
            task: task._id,
            type: 'mention',
            title: `Mentioned in ${task.taskId}`,
            message: `${req.user.name} mentioned you in a comment on "${task.title}": "${content.slice(0, 60)}..."`,
            link: `/projects/${task.project}?task=${task._id}`
          });
        }
      }
    }

    // Notify task assignee if not the commenter and not already mentioned
    if (
      task.assignee &&
      task.assignee._id.toString() !== req.user._id.toString() &&
      !mentions.includes(task.assignee._id.toString())
    ) {
      await createNotification({
        recipient: task.assignee._id,
        sender: req.user._id,
        workspace: task.workspace,
        project: task.project,
        task: task._id,
        type: 'comment',
        title: `New Comment on ${task.taskId}`,
        message: `${req.user.name} commented on your task: "${task.title}"`,
        link: `/projects/${task.project}?task=${task._id}`
      });
    }

    // Activity log
    await logActivity({
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      actor: req.user._id,
      action: 'comment_added',
      entityType: 'comment',
      entityId: comment._id,
      entityTitle: `${task.taskId}: Comment by ${req.user.name}`,
      metadata: { commentSnippet: content.slice(0, 100) }
    });

    return ApiResponse.success(res, 'Comment posted successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return ApiResponse.error(res, 'Comment not found', 404);
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'You can only edit your own comments', 403);
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    const populated = await TaskComment.findById(comment._id)
      .populate('user', 'name email avatar title')
      .populate('mentions', 'name email');

    return ApiResponse.success(res, 'Comment updated', populated);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return ApiResponse.error(res, 'Comment not found', 404);
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'You can only delete your own comments', 403);
    }

    await TaskComment.findByIdAndDelete(commentId);

    return ApiResponse.success(res, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Task Attachments
export const addAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { name, url, fileType, fileSize } = req.body;

    if (!name || !url) {
      return ApiResponse.error(res, 'Attachment name and url are required', 400);
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const attachment = await TaskAttachment.create({
      task: taskId,
      workspace: task.workspace,
      uploader: req.user._id,
      name,
      url,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 0
    });

    const populated = await TaskAttachment.findById(attachment._id).populate('uploader', 'name email avatar');

    return ApiResponse.success(res, 'Attachment added', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;
    await TaskAttachment.findByIdAndDelete(attachmentId);
    return ApiResponse.success(res, 'Attachment deleted');
  } catch (error) {
    next(error);
  }
};
