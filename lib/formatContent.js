// Chapters use «guillemets» to mark important standalone quotes, but that's
// just punctuation to Markdown — it renders as plain text. This detects any
// paragraph that is ENTIRELY a «...» quote, strips the guillemet characters,
// and converts it into a real Markdown blockquote (a line starting with ">")
// so it picks up the blue-line styling instead of showing the raw symbols.
// Quotes that sit inline inside a normal sentence are left untouched — only
// whole-paragraph quotes get the box.
export function formatQuotes(content) {
  const paragraphs = content.split(/\n\n+/);

  const formatted = paragraphs.map((paragraph) => {
    const trimmed = paragraph.trim();
    const isWholeParagraphQuote =
      trimmed.startsWith("«") && trimmed.endsWith("»");

    if (!isWholeParagraphQuote) {
      return paragraph;
    }

    // Strip the outer « and » before turning it into a blockquote
    const withoutGuillemets = trimmed.slice(1, -1).trim();

    return withoutGuillemets
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  });

  return formatted.join("\n\n");
}
