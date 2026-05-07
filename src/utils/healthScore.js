import {
  isIncompleteDownload
} from "./downloadEligibility.js";

export default function healthScore(
  torrent
) {
  if (!isIncompleteDownload(torrent)) {
    return 100;
  }

  let score = 100;

  if (torrent.num_seeds === 0)
    score -= 50;

  if (torrent.dlspeed < 200000)
    score -= 20;

  if (torrent.state === "stalledDL")
    score -= 40;

  return score;
}
