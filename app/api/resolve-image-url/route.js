// ImgBB's default "share" link (ibb.co/xxxxx) is a viewer webpage, not an
// actual image file — pasting it as an <img> source shows nothing. The
// real direct image link (i.ibb.co/...) is embedded in that page's
// metadata. This resolves it server-side so users never need to know the
// difference between the two kinds of ImgBB links.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  if (!/^https?:\/\/ibb\.co\//i.test(url)) {
    return Response.json({ url });
  }

  try {
    const pageResponse = await fetch(url);
    const html = await pageResponse.text();
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (match && match[1]) {
      return Response.json({ url: match[1] });
    }
    return Response.json({ url });
  } catch (e) {
    console.error("Failed to resolve ImgBB link:", e.message);
    return Response.json({ url });
  }
}
