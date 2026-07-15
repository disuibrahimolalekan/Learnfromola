export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  if (!/^https?:\/\/ibb\.co\//i.test(url)) {
    return Response.json({ url, resolved: true });
  }

  try {
    // A plain server-side fetch can get blocked or served a different page
    // than a real browser would see. Sending real browser-like headers
    // avoids that.
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    const html = await pageResponse.text();
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
