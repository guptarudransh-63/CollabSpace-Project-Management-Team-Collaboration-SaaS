import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

export const initSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'collabspace_super_secret_jwt_key_2026_xyz987');
      const user = await User.findById(decoded.id).select('name email avatar');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track online presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user:${userId}`);

    // Broadcast user online to their active workspaces
    io.emit('presence:online', {
      userId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        avatar: socket.user.avatar
      }
    });

    // Provide current online user IDs
    socket.emit('presence:sync', Array.from(onlineUsers.keys()));

    // Join workspace room
    socket.on('workspace:join', async (workspaceId) => {
      if (!workspaceId) return;
      const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: socket.user._id
      });
      if (membership) {
        socket.join(`workspace:${workspaceId}`);
      }
    });

    socket.on('workspace:leave', (workspaceId) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join project room
    socket.on('project:join', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Real-time Kanban task moved event
    socket.on('kanban:task_moved', ({ projectId, taskId, fromColumnId, toColumnId, newOrder, task }) => {
      socket.to(`project:${projectId}`).emit('kanban:task_moved', {
        taskId,
        fromColumnId,
        toColumnId,
        newOrder,
        task,
        movedBy: {
          _id: socket.user._id,
          name: socket.user.name
        }
      });
    });

    // Typing indicators for comments
    socket.on('comment:typing', ({ taskId, isTyping }) => {
      socket.broadcast.emit('comment:typing', {
        taskId,
        user: { _id: socket.user._id, name: socket.user.name },
        isTyping
      });
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('presence:offline', { userId });
        }
      }
    });
  });

  return io;
};
