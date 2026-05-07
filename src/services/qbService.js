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
}

export async function getTorrents() {
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

export async function getTorrentFiles(hash) {
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

export async function deleteTorrent(hash) {
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
