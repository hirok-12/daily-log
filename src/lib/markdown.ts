/** AIレビュー用の最小Markdownレンダラー（見出し・太字・箇条書きのみ） */

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—ー-]?\s*(.*)$/);
    const bullet = line.match(/^[-・*]\s+(.*)$/);

    if (heading) {
      closeList();
      out.push(`<h3>${inline(heading[1])}</h3>`);
    } else if (numbered) {
      closeList();
      out.push(`<h3>${inline(numbered[1])}</h3>`);
      if (numbered[2]) out.push(`<p>${inline(numbered[2])}</p>`);
    } else if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}
