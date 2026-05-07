import mongoose from "mongoose";

const torrentSchema = new mongoose.Schema({
  hash: String,

  name: String,

  state: String,

  progress: Number,

  downloadSpeed: Number,

  eta: Number,

  seeds: Number,

  category: String,

  healthScore: Number,

  qbit:
    mongoose.Schema.Types.Mixed,

  slowCount: {
    type: Number,
    default: 0
  },

  stalledCount: {
    type: Number,
    default: 0
  },

  lastSeen: Date
});

export default mongoose.model(
  "Torrent",
  torrentSchema
);
