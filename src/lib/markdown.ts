// Markdown 工具栏插入操作
// 所有操作基于 textarea 的 selectionStart/selectionEnd，返回新文本与新选区

export type InsertAction = {
  /** 在光标处包裹或插入文本 */
  apply: (text: string, start: number, end: number) => {
    text: string;
    selStart: number;
    selEnd: number;
  };
};

function wrap(prefix: string, suffix: string = prefix): InsertAction {
  return {
    apply(text, start, end) {
      const selected = text.slice(start, end);
      const replacement = `${prefix}${selected || "文本"}${suffix}`;
      const newText = text.slice(0, start) + replacement + text.slice(end);
      return {
        text: newText,
        selStart: start + prefix.length,
        selEnd: start + prefix.length + (selected || "文本").length,
      };
    },
  };
}

function linePrefix(prefix: string): InsertAction {
  return {
    apply(text, start, end) {
      // 扩展到整行
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineEndIdx = text.indexOf("\n", end);
      const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
      const block = text.slice(lineStart, lineEnd);
      const lines = block.split("\n").map((l) => `${prefix}${l}`);
      const replacement = lines.join("\n");
      const newText = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
      return {
        text: newText,
        selStart: lineStart,
        selEnd: lineStart + replacement.length,
      };
    },
  };
}

function insertBlock(block: string, newlines = 2): InsertAction {
  return {
    apply(text, start, _end) {
      const before = text.slice(0, start);
      const after = text.slice(start);
      const needLead = before.length > 0 && !before.endsWith("\n");
      const lead = needLead ? "\n".repeat(newlines) : "";
      const replacement = `${lead}${block}`;
      const newText = before + replacement + after;
      const cursor = (before + replacement).length;
      return { text: newText, selStart: cursor, selEnd: cursor };
    },
  };
}

export const markdownActions = {
  h1: linePrefix("# "),
  h2: linePrefix("## "),
  h3: linePrefix("### "),
  bold: wrap("**"),
  italic: wrap("*"),
  strike: wrap("~~"),
  code: wrap("`"),
  codeBlock: insertBlock("```\n\n```", 2),
  quote: linePrefix("> "),
  ul: linePrefix("- "),
  ol: linePrefix("1. "),
  link: {
    apply(text, start, end) {
      const selected = text.slice(start, end);
      const label = selected || "链接文本";
      const replacement = `[${label}](https://)`;
      const newText = text.slice(0, start) + replacement + text.slice(end);
      const urlStart = start + label.length + 3; // [label](
      return { text: newText, selStart: urlStart, selEnd: urlStart + 8 };
    },
  },
  image: {
    apply(text, start, end) {
      const selected = text.slice(start, end);
      const label = selected || "图片";
      const replacement = `![${label}](https://)`;
      const newText = text.slice(0, start) + replacement + text.slice(end);
      const urlStart = start + label.length + 4;
      return { text: newText, selStart: urlStart, selEnd: urlStart + 8 };
    },
  },
  hr: insertBlock("\n---\n", 1),
  table: insertBlock(
    "\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n",
    2,
  ),
  task: linePrefix("- [ ] "),
} satisfies Record<string, InsertAction>;

export type MarkdownActionKey = keyof typeof markdownActions;
