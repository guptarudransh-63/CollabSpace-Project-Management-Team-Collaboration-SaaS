import mongoose from 'mongoose';

const taskLabelSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#6366f1'
    }
  },
  {
    timestamps: true
  }
);

taskLabelSchema.index({ workspace: 1, name: 1 }, { unique: true });

export const TaskLabel = mongoose.model('TaskLabel', taskLabelSchema);
