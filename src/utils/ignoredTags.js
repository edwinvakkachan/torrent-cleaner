const DEFAULT_IGNORED_TAGS = [
  "predvd",
  "malayalam",
];

export function ignoredTags() {
  return (
    process.env.IGNORED_TAGS ??
    DEFAULT_IGNORED_TAGS.join(",")
  )
    .split(",")
    .map((tag) =>
      tag.trim().toLowerCase()
    )
    .filter(Boolean);
}

export function parseTorrentTags(tags) {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags !== "string") {
    return [];
  }

  return tags.split(",");
}

export function matchingIgnoredTags(source) {
  const torrentTags =
    parseTorrentTags(
      source.tags ?? source.qbit?.tags
    ).map((tag) =>
      tag.trim().toLowerCase()
    );

  const ignored =
    new Set(ignoredTags());

  return torrentTags.filter((tag) =>
    ignored.has(tag)
  );
}

export function hasIgnoredTag(source) {
  return (
    matchingIgnoredTags(source).length > 0
  );
}
