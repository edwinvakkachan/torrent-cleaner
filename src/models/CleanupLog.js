import mongoose from "mongoose";

const cleanupLogSchema =
  new mongoose.Schema({
    failedTorrent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FailedTorrent"
    },

    hash: String,

    name: String,

    rrType: String,

    action: String,

    status: String,

    message: String,

    error: String,

    relatedData:
      mongoose.Schema.Types.Mixed,

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

cleanupLogSchema.index({
  hash: 1,
  createdAt: -1
});

export default mongoose.model(
  "CleanupLog",
  cleanupLogSchema
);
