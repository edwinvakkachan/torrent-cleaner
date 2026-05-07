import Torrent from "../models/Torrent.js";
import FailedTorrent from "../models/FailedTorrent.js";

import {
  getTorrentFiles,
  getTorrents
} from "./qbService.js";

import {
  processFailedTorrent
} from "./failedTorrentHandler.js";

import healthScore from "../utils/healthScore.js";

import {
  isUnhealthyDownload
} from "../utils/downloadEligibility.js";

import {
  classifyTorrentContent
} from "../utils/mediaContent.js";

import {
  matchingIgnoredTags
} from "../utils/ignoredTags.js";

function unixDate(value) {
  return value
    ? new Date(value * 1000)
    : undefined;
}

function rrTypeFor(torrent) {
  const category = (
    torrent.category ?? ""
  ).toLowerCase();

  if (
    category.includes("tv") ||
    category.includes("sonarr")
  ) {
    return "sonarr";
  }

  return "radarr";
}

async function getFiles(hash) {
  try {
    return await getTorrentFiles(hash);
  } catch (err) {
    console.log(err);
    return [];
  }
}

function qbitData(
  torrent,
  content
) {
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
    availability: torrent.availability,
    content
  };
}

export default async function monitor() {
  const torrents =
    await getTorrents();

  for (const torrent of torrents) {
    const score =
      healthScore(torrent);

    const ignoredTagMatches =
      matchingIgnoredTags(torrent);

    const content =
      ignoredTagMatches.length > 0
        ? {
            isInvalid: false,
            reason: "Ignored by tag",
            ignoredTags:
              ignoredTagMatches,
            blockedFiles: [],
            videoFiles: [],
            files: [],
            scannedAt: new Date()
          }
        : classifyTorrentContent(
            await getFiles(torrent.hash)
          );

    const qbit =
      qbitData(torrent, content);

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

    if (ignoredTagMatches.length > 0) {
      const exists =
        await FailedTorrent.findOne({
          hash: torrent.hash
        });

      if (
        exists &&
        exists.status !== "SUCCESS"
      ) {
        exists.status = "SKIPPED";
        exists.reason = "Ignored torrent tag";
        exists.lastError =
          `Ignored because torrent has tag: ${ignoredTagMatches.join(", ")}`;
        exists.qbit = qbit;
        exists.content = content;

        await exists.save();
      }

      continue;
    }

    const unsafeContent =
      content.isInvalid;

    const unhealthyDownload =
      isUnhealthyDownload(
        torrent,
        Number(process.env.MIN_SPEED ?? 200000)
      );

    if (
      unsafeContent ||
      unhealthyDownload
    ) {
      const exists =
        await FailedTorrent.findOne({
          hash: torrent.hash
        });

      const reason =
        unsafeContent
          ? "Unsafe torrent content"
          : "Unhealthy torrent";

      let failedTorrent;

      if (exists) {
        const wasUnsafe =
          exists.content?.isInvalid ===
          true;

        exists.state = torrent.state;
        exists.reason = reason;
        exists.rrType =
          rrTypeFor(torrent);
        exists.qbit = qbit;
        exists.content = content;

        if (
          unsafeContent &&
          !wasUnsafe &&
          exists.status !== "SUCCESS"
        ) {
          exists.status = "PENDING";
          exists.notified = false;
          exists.retries = 0;
          exists.lastError = undefined;
        }

        await exists.save();
        failedTorrent = exists;
      } else {
        failedTorrent =
          await FailedTorrent.create({
            hash: torrent.hash,

            name: torrent.name,

            state: torrent.state,

            reason:
              reason,

            rrType:
              rrTypeFor(torrent),

            qbit,

            content
          });
      }

      if (
        unsafeContent &&
        failedTorrent.status === "PENDING" &&
        failedTorrent.notified === false &&
        failedTorrent.retries === 0
      ) {
        await processFailedTorrent(
          failedTorrent,
          "content-scan"
        );
      }
    }
  }
}
