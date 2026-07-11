// Chapters use «guillemets» to mark important standalone quotes, but that's
// just punctuation to Markdown — it renders as plain text. This detects any
// paragraph that is ENTIRELY a «...» quote and converts it into a real
// Markdown blockquote (a line starting with ">") so it picks up the same
// blue-line styling used elsewhere. Quotes that sit inline inside a normal
// sentence are left untouched — only whole-paragraph quotes get the box.
export function formatQuotes(content) {
  const paragraphs = content.split(/\n\n+/);

  const formatted = paragraphs.map((paragraph) => {
    const trimmed = paragraph.trim();
    const isWholeParagraphQuote =
      trimmed.startsWith("«") && trimmed.endsWith("»");

    if (!isWholeParagraphQuote) {
      return paragraph;
    }

    return trimmed
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  });

  return formatted.join("\n\n");
}
