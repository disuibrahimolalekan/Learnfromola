// Allowlist of domains that can be fetched server-side
const ALLOWED_DOMAINS = ['ibb.co', 'i.ibb.co'];
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1024 * 1024;

function isAllowedUrl(input) {
  try {
    const parsed = new URL(input);
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Must be in allowlist
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  // SSRF prevention: only allow URLs from trusted domains
  if (!isAllowedUrl(url)) {
    return Response.json({ error: "URL domain not allowed" }, { status: 403 });
  }

  try {
    // A plain server-side fetch can get blocked or served a different page
    // than a real browser would see. Sending real browser-like headers
    // avoids that.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const pageResponse = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);

    if (!pageResponse.ok) {
      return Response.json({ url, resolved: false });
    }

    const contentLength = Number(pageResponse.headers.get("content-length"));
    if (contentLength > MAX_RESPONSE_BYTES) {
      return Response.json({ url, resolved: false });
    }

    const reader = pageResponse.body?.getReader();
    if (!reader) return Response.json({ url, resolved: false });

    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return Response.json({ url, resolved: false });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const html = new TextDecoder().decode(bytes);
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (match && match[1]) {
      return Response.json({ url: match[1], resolved: true });
    }
    return Response.json({ url, resolved: false });
  } catch (e) {
    console.error("Failed to resolve ImgBB link:", e.message);
    return Response.json({ url, resolved: false });
  }
}
