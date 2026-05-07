import CleanupLog from "../models/CleanupLog.js";

import {
  isSafeToRemoveFailedTorrent
} from "../utils/downloadEligibility.js";

import {
  matchingIgnoredTags
} from "../utils/ignoredTags.js";

import {
  blocklistAndRemoveRadarr
} from "./radarrService.js";

import {
  blocklistAndRemoveSonarr
} from "./sonarrService.js";

function arrQueueData(queueItem) {
  return {
    queueId: queueItem.id,
    downloadId: queueItem.downloadId,
    title: queueItem.title,
    status: queueItem.status,
    trackedDownloadState:
      queueItem.trackedDownloadState,
    trackedDownloadStatus:
      queueItem.trackedDownloadStatus,
    downloadClient:
      queueItem.downloadClient,
    protocol: queueItem.protocol,
    indexer: queueItem.indexer,
    outputPath: queueItem.outputPath,
    size: queueItem.size,
    sizeleft: queueItem.sizeleft,
    timeleft: queueItem.timeleft,
    statusMessages:
      queueItem.statusMessages
  };
}

function blocklistData(
  startedAt,
  completedAt
) {
  return {
    requestedAt: startedAt,
    completedAt,
    lastAttemptAt: completedAt,
    removeFromClient: true,
    blocklist: true,
    skipRedownload: false
  };
}

async function blocklistAndRemove(torrent) {
  if (torrent.rrType === "radarr") {
    return blocklistAndRemoveRadarr(
      torrent.hash
    );
  }

  return blocklistAndRemoveSonarr(
    torrent.hash
  );
}

function allowUnhealthyRemoval() {
  return (
    process.env.ALLOW_UNHEALTHY_REMOVAL ===
    "true"
  );
}

async function writeCleanupLog({
  torrent,
  action,
  status,
  message,
  error,
  relatedData
}) {
  await CleanupLog.create({
    failedTorrent: torrent._id,
    hash: torrent.hash,
    name: torrent.name,
    rrType: torrent.rrType,
    action,
    status,
    message,
    error,
    relatedData
  });
}

async function safeWriteCleanupLog(log) {
  try {
    await writeCleanupLog(log);
  } catch (err) {
    console.log(err);
  }
}

export async function processFailedTorrent(
  torrent,
  action
) {
  const startedAt = new Date();
  const ignoredTagMatches =
    matchingIgnoredTags(torrent);

  if (
    !isSafeToRemoveFailedTorrent(torrent, {
      allowUnhealthyRemoval:
        allowUnhealthyRemoval()
    })
  ) {
    torrent.status = "SKIPPED";
    torrent.lastError =
      ignoredTagMatches.length > 0
        ? `Ignored because torrent has tag: ${ignoredTagMatches.join(", ")}`
        : "Protected from removal because only unsafe content is auto-removed by default";
    torrent.blocklist = {
      ...(torrent.blocklist ?? {}),
      skippedAt: startedAt,
      removeFromClient: false,
      blocklist: false
    };

    await torrent.save();

    await safeWriteCleanupLog({
      torrent,
      action,
      status: "SKIPPED",
      message:
        ignoredTagMatches.length > 0
          ? "Skipped removal because torrent has an ignored tag"
          : "Skipped removal because torrent is not unsafe content",
      relatedData: {
        qbit: torrent.qbit,
        content: torrent.content,
        ignoredTags:
          ignoredTagMatches,
        blocklist: torrent.blocklist
      }
    });

    return;
  }

  try {
    const queueItem =
      await blocklistAndRemove(torrent);

    const completedAt = new Date();
    const arr = arrQueueData(queueItem);
    const blocklist = blocklistData(
      startedAt,
      completedAt
    );

    torrent.arr = arr;
    torrent.blocklist = blocklist;
    torrent.status = "SUCCESS";
    torrent.notified = true;
    torrent.lastError = undefined;

    await torrent.save();

    await safeWriteCleanupLog({
      torrent,
      action,
      status: "SUCCESS",
      message:
        "Blocklisted and removed from download client through Arr",
      relatedData: {
        arr,
        content: torrent.content,
        blocklist
      }
    });
  } catch (err) {
    const failedAt = new Date();

    torrent.retries += 1;
    torrent.lastError = err.message;
    torrent.blocklist = {
      ...(torrent.blocklist ?? {}),
      requestedAt: startedAt,
      lastAttemptAt: failedAt,
      removeFromClient: true,
      blocklist: true,
      skipRedownload: false
    };

    await torrent.save();

    await safeWriteCleanupLog({
      torrent,
      action,
      status: "FAILED",
      error: err.message,
      relatedData: {
        content: torrent.content,
        blocklist: torrent.blocklist
      }
    });
  }
}
