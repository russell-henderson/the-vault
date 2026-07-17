export async function copyMarkdown(markdown: string): Promise<void> {
  if (!markdown.trim()) throw new Error("There is no Markdown content to copy.");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown);
    return;
  }

  if (typeof document === "undefined") throw new Error("Clipboard access is unavailable in this environment.");
  const textarea = document.createElement("textarea");
  textarea.value = markdown;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) throw new Error("The browser rejected the copy request.");
  } finally {
    textarea.remove();
  }
}
