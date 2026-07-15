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

  return trimmed;
}

export function isYoutubeUrl(url) {
  if (!url) return false;
  return /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|shorts\/))/i.test(url);
}

// Guarantees images and inline YouTube links always sit on their own line
// in the saved markdown. Without this, an image or video link typed
// mid-paragraph can end up glued directly to the next word with no line
// break, which looks fine in the editor's internal model but can render
// oddly once re-parsed by the student page's separate markdown renderer.
export function normalizeMediaSpacing(markdown) {
  let result = markdown;

  result = result.replace(/([^\n])\n?(!\[[^\]]*\]\([^)]+\))/g, (m, before, img) => `${before}\n\n${img}`);
  result = result.replace(/(!\[[^\]]*\]\([^)]+\))\n?([^\n])/g, (m, img, after) => `${img}\n\n${after}`);

  result = result.replace(/([^\n])\n?(\[[^\]]*\]\([^)]+\))/g, (m, before, link) => {
    const urlMatch = link.match(/\(([^)]+)\)/);
    if (urlMatch && isYoutubeUrl(urlMatch[1])) return `${before}\n\n${link}`;
    return m;
  });
  result = result.replace(/(\[[^\]]*\]\([^)]+\))\n?([^\n])/g, (m, link, after) => {
    const urlMatch = link.match(/\(([^)]+)\)/);
    if (urlMatch && isYoutubeUrl(urlMatch[1])) return `${link}\n\n${after}`;
    return m;
  });

  return result;
}
