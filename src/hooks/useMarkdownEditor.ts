// Markdown 编辑器 hook：管理 textarea ref 与工具栏插入操作
import { useCallback, useRef } from "react";
import { markdownActions, type MarkdownActionKey } from "@/lib/markdown";

export function useMarkdownEditor(
  content: string,
  onChange: (next: string) => void,
) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = useCallback(
    (key: MarkdownActionKey) => {
      const ta = ref.current;
      if (!ta) return;
      const action = markdownActions[key];
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const result = action.apply(content, start, end);
      onChange(result.text);
      // 在 React 更新后再恢复选区
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(result.selStart, result.selEnd);
      });
    },
    [content, onChange],
  );

  /** 在光标处插入文本 */
  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = ref.current;
      if (!ta) {
        onChange(content + text);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = content.slice(0, start) + text + content.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + text.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [content, onChange],
  );

  return { ref, apply, insertAtCursor };
}
