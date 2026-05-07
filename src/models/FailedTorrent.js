import mongoose from "mongoose";

const failedTorrentSchema =
  new mongoose.Schema({
    hash: String,

    name: String,

    state: String,

    reason: String,

    rrType: String,

    qbit:
      mongoose.Schema.Types.Mixed,

    arr:
      mongoose.Schema.Types.Mixed,

    blocklist:
      mongoose.Schema.Types.Mixed,

    content:
      mongoose.Schema.Types.Mixed,

    notified: {
      type: Boolean,
      default: false
    },

    retries: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      default: "PENDING"
    },

    lastError: String,

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

export default mongoose.model(
  "FailedTorrent",
  failedTorrentSchema
);
