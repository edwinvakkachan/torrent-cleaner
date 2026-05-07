import axios from "axios";

function createHeaders(apiKey) {
  return {
    "X-Api-Key": apiKey
  };
}

function sameDownloadId(record, downloadId) {
  return (
    record.downloadId &&
    record.downloadId.toLowerCase() ===
      downloadId.toLowerCase()
  );
}

export async function getQueueItemByDownloadId(
  baseUrl,
  apiKey,
  downloadId
) {
  const res = await axios.get(
    `${baseUrl}/api/v3/queue`,
    {
      headers: createHeaders(apiKey),
      params: {
        page: 1,
        pageSize: 1000,
        includeUnknownMovieItems: true
      }
    }
  );

  const records = res.data.records ?? [];

  return records.find((record) =>
    sameDownloadId(record, downloadId)
  );
}

export async function blocklistAndRemoveQueueItem(
  baseUrl,
  apiKey,
  queueId
) {
  await axios.delete(
    `${baseUrl}/api/v3/queue/${queueId}`,
    {
      headers: createHeaders(apiKey),
      params: {
        removeFromClient: true,
        blocklist: true,
        skipRedownload: false
      }
    }
  );
}

export async function blocklistAndRemoveDownload(
  baseUrl,
  apiKey,
  downloadId
) {
  const queueItem =
    await getQueueItemByDownloadId(
      baseUrl,
      apiKey,
      downloadId
    );

  if (!queueItem) {
    throw new Error(
      `No queue item found for downloadId ${downloadId}`
    );
  }

  await blocklistAndRemoveQueueItem(
    baseUrl,
    apiKey,
    queueItem.id
  );

  return queueItem;
}
