// src/services/qbService.js

import axios from "axios";

let cookie = "";

export async function loginQB() {

  const res = await axios.post(
    `${process.env.QB_URL}/api/v2/auth/login`,
    `username=${process.env.QB_USER}&password=${process.env.QB_PASS}`,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      }
    }
  );

  cookie = res.headers["set-cookie"];

  console.log(
    "qBittorrent login successful"
  );
}

async function requestWithRetry(fn) {

  try {

    return await fn();

  } catch (err) {

    // qBittorrent session expired
    if (
      err.response?.status === 403
    ) {

      console.log(
        "qBittorrent session expired. Re-logging..."
      );

      await loginQB();

      return await fn();
    }

    throw err;
  }
}

export async function getTorrents() {

  return requestWithRetry(
    async () => {

      const res = await axios.get(
        `${process.env.QB_URL}/api/v2/torrents/info`,
        {
          headers: {
            Cookie: cookie
          }
        }
      );

      return res.data;
    }
  );
}

export async function getTorrentFiles(hash) {

  return requestWithRetry(
    async () => {

      const res = await axios.get(
        `${process.env.QB_URL}/api/v2/torrents/files`,
        {
          headers: {
            Cookie: cookie
          },
          params: {
            hash
          }
        }
      );

      return res.data;
    }
  );
}

export async function deleteTorrent(hash) {

  return requestWithRetry(
    async () => {

      await axios.post(
        `${process.env.QB_URL}/api/v2/torrents/delete`,
        `hashes=${hash}&deleteFiles=false`,
        {
          headers: {
            Cookie: cookie,
            "Content-Type":
              "application/x-www-form-urlencoded"
          }
        }
      );
    }
  );
}