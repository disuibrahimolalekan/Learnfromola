// Normalizes any YouTube URL shape (watch link, share link, shorts,
// already-embed) into the /embed/ format iframes actually need to play.
// A plain "watch?v=" link silently shows a blank/broken player otherwise.
export function toYoutubeEmbedUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();

  if (/youtube\.com\/embed\//.test(trimmed)) return trimmed;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }

  // Not a recognizable YouTube shape — return as-is (e.g. a non-YouTube host).
  return trimmed;
}
