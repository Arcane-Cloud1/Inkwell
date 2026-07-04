// Markdown 预览组件
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

export default function MarkdownPreview({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) {
    return (
      <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-center text-paper-faint">
        <div className="font-display text-5xl text-amber-300/20">¶</div>
        <p className="font-body text-sm italic">还没有内容，开始写点什么吧。</p>
      </div>
    );
  }
  return (
    <div className={cn("prose-ink", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
