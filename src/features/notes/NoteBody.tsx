/**
 * Renders note body with simple list support:
 * - lines starting with "- " or "* " → bullets
 * - lines starting with "1. " / "2. " etc. → numbered list
 */
export function NoteBody({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: { type: "p" | "ul" | "ol"; items: string[] }[] = [];

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]!);
      else blocks.push({ type: "ul", items: [bullet[1]!] });
    } else if (numbered) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") last.items.push(numbered[1]!);
      else blocks.push({ type: "ol", items: [numbered[1]!] });
    } else if (line.trim() === "") {
      blocks.push({ type: "p", items: [""] });
    } else {
      blocks.push({ type: "p", items: [line] });
    }
  }

  return (
    <div className={className ?? "space-y-3 text-base leading-relaxed text-foreground"}>
      {blocks.map((b, i) => {
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {b.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ol>
          );
        }
        if (b.items[0] === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="whitespace-pre-wrap">
            {b.items[0]}
          </p>
        );
      })}
    </div>
  );
}
