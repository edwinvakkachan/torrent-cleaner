import FailedTorrent from "../models/FailedTorrent.js";

import {
  processFailedTorrent
} from "./failedTorrentHandler.js";

export default async function cleanup() {
  const failed =
    await FailedTorrent.find({
      status: "PENDING",
      retries: {
        $eq: 0
      }
    });

  for (const torrent of failed) {
    await processFailedTorrent(
      torrent,
      "cleanup"
    );
  }
}
