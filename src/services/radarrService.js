import axios from "axios";

import {
  blocklistAndRemoveDownload
} from "./arrQueueService.js";

export async function notifyRadarr(
  hash
) {
  await axios.post(
    `${process.env.RADARR_URL}/api/v3/command`,
    {
      name:
        "FailedDownloadHandler",

      downloadId: hash
    },
    {
      headers: {
        "X-Api-Key":
          process.env.RADARR_API_KEY
      }
    }
  );
}

export async function blocklistAndRemoveRadarr(
  hash
) {
  return blocklistAndRemoveDownload(
    process.env.RADARR_URL,
    process.env.RADARR_API_KEY,
    hash
  );
}
