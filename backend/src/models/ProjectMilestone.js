import mongoose from 'mongoose';

const projectMilestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      required: true
    },
    isReached: {
      type: Boolean,
      default: false
    },
    reachedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const ProjectMilestone = mongoose.model('ProjectMilestone', projectMilestoneSchema);
