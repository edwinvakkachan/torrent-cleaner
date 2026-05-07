import FailedTorrent from "../models/FailedTorrent.js";

import {
  processFailedTorrent
} from "./failedTorrentHandler.js";

function maxRetries() {
  return Number(
    process.env.MAX_RETRIES ?? 5
  );
}

export default async function retry() {
  const pending =
    await FailedTorrent.find({
      status: "PENDING",
      notified: false,
      retries: {
        $gte: 1,
        $lt: maxRetries()
      }
    });

  for (const torrent of pending) {
    await processFailedTorrent(
      torrent,
      "retry"
    );
  }
}
