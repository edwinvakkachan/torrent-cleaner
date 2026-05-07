const DOWNLOAD_STATES = new Set([
  "downloading",
  "stalledDL",
  "queuedDL",
  "metaDL",
  "checkingDL",
  "forcedDL"
]);

function numberValue(value, fallback = 0) {
  return Number.isFinite(value)
    ? value
    : fallback;
}

export function isIncompleteDownload(torrent) {
  const state = torrent.state;
  const progress = numberValue(
    torrent.progress,
    0
  );
  const amountLeft = numberValue(
    torrent.amount_left,
    torrent.amountLeft
  );
  const size = numberValue(torrent.size);
  const completed = numberValue(
    torrent.completed
  );

  if (!DOWNLOAD_STATES.has(state)) {
    return false;
  }

  if (progress >= 1) {
    return false;
  }

  if (size > 0 && completed >= size) {
    return false;
  }

  if (amountLeft === 0 && size > 0) {
    return false;
  }

  return true;
}

export function isUnhealthyDownload(
  torrent,
  minSpeed
) {
  if (!isIncompleteDownload(torrent)) {
    return false;
  }

  return (
    torrent.state === "stalledDL" ||
    torrent.num_seeds === 0 ||
    torrent.dlspeed < minSpeed
  );
}

export function isSafeToRemoveFailedTorrent(
  failedTorrent,
  {
    allowUnhealthyRemoval = false
  } = {}
) {
  if (
    failedTorrent.content?.isInvalid ===
      true ||
    failedTorrent.qbit?.content
      ?.isInvalid === true
  ) {
    return true;
  }

  if (!allowUnhealthyRemoval) {
    return false;
  }

  if (!failedTorrent.qbit) {
    return false;
  }

  const hasProgressData =
    Number.isFinite(
      failedTorrent.qbit.progress
    ) ||
    Number.isFinite(
      failedTorrent.qbit.amountLeft
    ) ||
    (Number.isFinite(
      failedTorrent.qbit.size
    ) &&
      Number.isFinite(
        failedTorrent.qbit.completed
      ));

  if (!hasProgressData) {
    return false;
  }

  return isIncompleteDownload({
    state: failedTorrent.state,
    progress: failedTorrent.qbit?.progress,
    amountLeft: failedTorrent.qbit?.amountLeft,
    size: failedTorrent.qbit?.size,
    completed: failedTorrent.qbit?.completed
  });
}
