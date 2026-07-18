import type { ReactNode } from "react";

function inline(value: string): ReactNode[] {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code className="markdown-inline-code" key={index}>{part.slice(1, -1)}</code>;
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownPreview({ markdown, emptyMessage = "No document content yet.", showCursor = false }: { markdown: string; emptyMessage?: string; showCursor?: boolean }) {
  if (!markdown.trim()) return <div className="markdown-empty">{emptyMessage}{showCursor && <span className="stream-cursor" aria-hidden="true" />}</div>;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;
  let code: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(<p key={`paragraph-${blocks.length}`}>{inline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      const items = list;
      blocks.push(ordered
        ? <ol key={`list-${blocks.length}`}>{items.map((item, index) => <li key={`${item}-${index}`}>{inline(item)}</li>)}</ol>
        : <ul key={`list-${blocks.length}`}>{items.map((item, index) => <li key={`${item}-${index}`}>{inline(item)}</li>)}</ul>);
      list = [];
    }
  };
  const flushCode = () => {
    blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
    code = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCode) flushCode();
      else { flushParagraph(); flushList(); }
      inCode = !inCode;
      return;
    }
    if (inCode) { code.push(line); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const Heading = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push(<Heading key={`heading-${index}`}>{inline(heading[2])}</Heading>);
    } else if (unordered || numbered) {
      flushParagraph();
      const nextOrdered = Boolean(numbered);
      if (list.length > 0 && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      list.push((unordered ?? numbered)![1]);
    } else if (!line.trim()) {
      flushParagraph(); flushList();
    } else {
      paragraph.push(line.trim());
    }
  });
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return <article className="markdown-preview">{blocks}{showCursor && <span className="stream-cursor" aria-hidden="true" />}</article>;
}
