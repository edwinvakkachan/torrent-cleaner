import path from "path";

const VIDEO_EXTENSIONS = new Set([
  ".3gp",
  ".avi",
  ".divx",
  ".flv",
  ".m2ts",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ts",
  ".vob",
  ".webm",
  ".wmv"
]);

const BLOCKED_EXTENSIONS = new Set([
  ".apk",
  ".app",
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".iso",
  ".js",
  ".lnk",
  ".msi",
  ".ps1",
  ".scr",
  ".sh",
  ".url",
  ".vbs"
]);

function extensionFor(file) {
  return path
    .extname(file.name ?? "")
    .toLowerCase();
}

function fileData(file) {
  return {
    name: file.name,
    extension: extensionFor(file),
    size: file.size,
    progress: file.progress,
    priority: file.priority,
    isSeed: file.is_seed,
    availability: file.availability
  };
}

export function classifyTorrentContent(
  files = []
) {
  const normalizedFiles =
    files.map(fileData);

  const videoFiles =
    normalizedFiles.filter((file) =>
      VIDEO_EXTENSIONS.has(
        file.extension
      )
    );

  const blockedFiles =
    normalizedFiles.filter((file) =>
      BLOCKED_EXTENSIONS.has(
        file.extension
      )
    );

  if (blockedFiles.length > 0) {
    return {
      isInvalid: true,
      reason:
        "Blocked file extension found",
      blockedFiles,
      videoFiles,
      files: normalizedFiles,
      scannedAt: new Date()
    };
  }

  if (
    normalizedFiles.length > 0 &&
    videoFiles.length === 0
  ) {
    return {
      isInvalid: true,
      reason: "No video files found",
      blockedFiles,
      videoFiles,
      files: normalizedFiles,
      scannedAt: new Date()
    };
  }

  return {
    isInvalid: false,
    reason:
      normalizedFiles.length === 0
        ? "No files available"
        : "Video content found",
    blockedFiles,
    videoFiles,
    files: normalizedFiles,
    scannedAt: new Date()
  };
}
