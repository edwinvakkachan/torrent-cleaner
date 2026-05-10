import {
  isIncompleteDownload
} from "./downloadEligibility.js";

export default function healthScore(
  torrent,
  stats = {}
) {
  if (!isIncompleteDownload(torrent)) {
    return 100;
  }

  let score = 100;

  if (torrent.num_seeds === 0)
    score -= 40;

  if (torrent.dlspeed < 200000)
    score -= 15;

  if (torrent.state === "stalledDL")
    score -= 30;

  if (stats.slowCount >= 3)
    score -= 10;

  if (stats.stalledCount >= 3)
    score -= 15;

  if (stats.zeroSeedCount >= 6)
    score -= 20;

  if (
    Number.isFinite(torrent.availability) &&
    torrent.availability < 1
  ) {
    score -= 10;
  }

  return Math.max(score, 0);
}