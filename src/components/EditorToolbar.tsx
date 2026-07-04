// Markdown 工具栏（横向滚动快捷按钮）
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Table,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarkdownActionKey } from "@/lib/markdown";
import { cn } from "@/lib/utils";

type Tool = {
  key: MarkdownActionKey;
  icon: LucideIcon;
  label: string;
};

const tools: Tool[] = [
  { key: "h1", icon: Heading1, label: "H1" },
  { key: "h2", icon: Heading2, label: "H2" },
  { key: "h3", icon: Heading3, label: "H3" },
  { key: "bold", icon: Bold, label: "粗" },
  { key: "italic", icon: Italic, label: "斜" },
  { key: "strike", icon: Strikethrough, label: "删" },
  { key: "code", icon: Code, label: "码" },
  { key: "codeBlock", icon: Code2, label: "块" },
  { key: "quote", icon: Quote, label: "引" },
  { key: "ul", icon: List, label: "列" },
  { key: "ol", icon: ListOrdered, label: "序" },
  { key: "task", icon: ListChecks, label: "任" },
  { key: "link", icon: LinkIcon, label: "链" },
  { key: "image", icon: ImageIcon, label: "图" },
  { key: "table", icon: Table, label: "表" },
  { key: "hr", icon: Minus, label: "线" },
];

export default function EditorToolbar({
  onAction,
}: {
  onAction: (key: MarkdownActionKey) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-1 py-2">
      {tools.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onAction(key)}
          className={cn(
            "group flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-0.5",
            "rounded-xl border border-amber-300/10 bg-ink-850/60",
            "text-paper-dim transition-all duration-150",
            "active:scale-90 hover:border-amber-300/30 hover:text-amber-300",
          )}
          aria-label={label}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
