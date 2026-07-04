import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 相对时间格式化（中文） */
export function relativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "刚刚";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} 个月前`;
  const year = Math.floor(day / 365);
  return `${year} 年前`;
}

/** 根据时间返回问候语 */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "夜深了";
  if (h < 11) return "早安";
  if (h < 14) return "午安";
  if (h < 18) return "下午好";
  if (h < 23) return "晚上好";
  return "夜深了";
}

/** 截断文本 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

/** 从 Markdown 内容提取摘要（首段非标题文本） */
export function excerpt(markdown: string, max = 80): string {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) continue;
    // 去除 markdown 语法
    const plain = trimmed
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[*_`~>]/g, "")
      .trim();
    if (plain) return truncate(plain, max);
  }
  return "暂无内容";
}

/** 文件大小格式化 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 从路径提取文件名 */
export function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

/** 从路径提取目录 */
export function dirname(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

/** 去除 .md 后缀 */
export function stripMdExt(name: string): string {
  return name.replace(/\.md$/i, "");
}

/** 判断是否为 Markdown 文件 */
export function isMarkdown(name: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(name);
}
