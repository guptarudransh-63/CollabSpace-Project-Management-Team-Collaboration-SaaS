import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { createNotification } from '../services/notificationService.js';

export const startDeadlineReminderJob = () => {
  // Run once every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find tasks due within 24 hours that are not completed
      const upcomingTasks = await Task.find({
        isCompleted: false,
        dueDate: { $gte: now, $lte: in24Hours },
        assignee: { $ne: null }
      }).populate('assignee project');

      for (const task of upcomingTasks) {
        if (task.assignee) {
          await createNotification({
            recipient: task.assignee._id,
            workspace: task.workspace,
            project: task.project._id,
            task: task._id,
            type: 'deadline_approaching',
            title: `Deadline Approaching: ${task.taskId}`,
            message: `Task "${task.title}" is due soon (${new Date(task.dueDate).toLocaleDateString()}).`,
            link: `/workspaces/${task.workspace}/projects/${task.project._id}/tasks/${task._id}`
          });
        }
      }

      // Find overdue tasks
      const overdueTasks = await Task.find({
        isCompleted: false,
        dueDate: { $lt: now },
        assignee: { $ne: null }
      }).populate('assignee project');

      for (const task of overdueTasks) {
        if (task.assignee) {
          await createNotification({
            recipient: task.assignee._id,
            workspace: task.workspace,
            project: task.project._id,
            task: task._id,
            type: 'deadline_overdue',
            title: `Task Overdue: ${task.taskId}`,
            message: `Task "${task.title}" passed its deadline on ${new Date(task.dueDate).toLocaleDateString()}.`,
            link: `/workspaces/${task.workspace}/projects/${task.project._id}/tasks/${task._id}`
          });
        }
      }
    } catch (error) {
      console.error('Deadline reminder job error:', error.message);
    }
  });

  console.log('Deadline reminder cron job initialized.');
};
