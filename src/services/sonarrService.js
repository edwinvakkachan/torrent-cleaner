import axios from "axios";

import {
  blocklistAndRemoveDownload
} from "./arrQueueService.js";

export async function notifySonarr(
  hash
) {
  await axios.post(
    `${process.env.SONARR_URL}/api/v3/command`,
    {
      name:
        "FailedDownloadHandler",

      downloadId: hash
    },
    {
      headers: {
        "X-Api-Key":
          process.env.SONARR_API_KEY
      }
    }
  );
}

export async function blocklistAndRemoveSonarr(
  hash
) {
  return blocklistAndRemoveDownload(
    process.env.SONARR_URL,
    process.env.SONARR_API_KEY,
    hash
  );
}
