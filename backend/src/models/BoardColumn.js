import mongoose from 'mongoose';

const boardColumnSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    order: {
      type: Number,
      required: true,
      default: 0
    },
    color: {
      type: String,
      default: '#64748b' // Slate
    },
    limit: {
      type: Number,
      default: 0 // 0 means no WIP limit
    }
  },
  {
    timestamps: true
  }
);

boardColumnSchema.index({ board: 1, order: 1 });

export const BoardColumn = mongoose.model('BoardColumn', boardColumnSchema);
