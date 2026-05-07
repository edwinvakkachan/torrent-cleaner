import Torrent from "../models/Torrent.js";
import FailedTorrent from "../models/FailedTorrent.js";

import {
  getTorrents
} from "./qbService.js";

import healthScore from "../utils/healthScore.js";

import {
  isUnhealthyDownload
} from "../utils/downloadEligibility.js";

function unixDate(value) {
  return value
    ? new Date(value * 1000)
    : undefined;
}

function qbitData(torrent) {
  return {
    savePath: torrent.save_path,
    contentPath: torrent.content_path,
    state: torrent.state,
    progress: torrent.progress,
    amountLeft: torrent.amount_left,
    size: torrent.size,
    completed: torrent.completed,
    tracker: torrent.tracker,
    tags: torrent.tags,
    addedOn: unixDate(torrent.added_on),
    completedOn:
      unixDate(torrent.completion_on),
    ratio: torrent.ratio,
    availability: torrent.availability
  };
}

export default async function monitor() {
  const torrents =
    await getTorrents();

  for (const torrent of torrents) {
    const score =
      healthScore(torrent);

    const qbit =
      qbitData(torrent);

    await Torrent.findOneAndUpdate(
      {
        hash: torrent.hash
      },
      {
        hash: torrent.hash,

        name: torrent.name,

        state: torrent.state,

        progress: torrent.progress,

        downloadSpeed:
          torrent.dlspeed,

        eta: torrent.eta,

        seeds: torrent.num_seeds,

        category:
          torrent.category,

        healthScore: score,

        qbit,

        lastSeen: new Date()
      },
      {
        upsert: true
      }
    );

    if (
      isUnhealthyDownload(
        torrent,
        Number(process.env.MIN_SPEED ?? 200000)
      )
    ) {
      const exists =
        await FailedTorrent.findOne({
          hash: torrent.hash
        });

      if (!exists) {
        await FailedTorrent.create({
          hash: torrent.hash,

          name: torrent.name,

          state: torrent.state,

          reason:
            "Unhealthy torrent",

          rrType:
            torrent.category ===
            "tv"
              ? "sonarr"
              : "radarr",

          qbit
        });
      }
    }
  }
}
