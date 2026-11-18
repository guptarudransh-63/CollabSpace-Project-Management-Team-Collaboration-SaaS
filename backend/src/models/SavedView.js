import mongoose from 'mongoose';

const savedViewSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['kanban', 'list', 'calendar'],
      default: 'kanban'
    },
    filters: {
      status: [String],
      priority: [String],
      assignee: [String],
      labels: [String],
      search: String,
      overdueOnly: Boolean,
      dueSoonOnly: Boolean
    },
    sortBy: {
      type: String,
      default: 'order'
    },
    sortDirection: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    },
    isShared: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const SavedView = mongoose.model('SavedView', savedViewSchema);
