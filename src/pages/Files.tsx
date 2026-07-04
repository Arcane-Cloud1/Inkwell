// 文件浏览页：浏览默认仓库的 Markdown 文件
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  FileText,
  FolderOpen,
  Plus,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Pencil,
  RefreshCw,
  FolderGit2,
  ChevronRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSettingsStore } from "@/store/settings";
import { useDraftsStore } from "@/store/drafts";
import { useToastStore } from "@/store/toast";
import { GitHubError, decodeBase64 } from "@/lib/github";
import type { GitHubContent } from "@/types";
import { cn, formatSize, isMarkdown, stripMdExt } from "@/lib/utils";
import { extractTitle } from "@/lib/frontmatter";

export default function Files() {
  const navigate = useNavigate();
  const { client, settings } = useSettingsStore();
  const { createDraft } = useDraftsStore();
  const toast = useToastStore();

  const [path, setPath] = useState(settings.defaultPath || "");
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GitHubContent | null>(null);

  const configured = Boolean(settings.defaultOwner && settings.defaultRepo);

  const load = useCallback(async () => {
    if (!client || !configured) return;
    setLoading(true);
    try {
      const list = await client.listContents({
        owner: settings.defaultOwner,
        repo: settings.defaultRepo,
        path,
        branch: settings.defaultBranch,
      });
      // 目录优先，文件按名称排序
      const sorted = [...list].sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setContents(sorted);
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "加载失败");
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [client, configured, settings.defaultOwner, settings.defaultRepo, settings.defaultBranch, path, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // 关闭菜单
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  function enterDir(dir: GitHubContent) {
    setPath(dir.path);
  }

  function goUp() {
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    setPath(parts.join("/"));
  }

  async function openFile(file: GitHubContent) {
    if (!client) return;
    toast.info("正在打开文件…");
    try {
      const remote = await client.getFile({
        owner: settings.defaultOwner,
        repo: settings.defaultRepo,
        path: file.path,
        branch: settings.defaultBranch,
      });
      const text = decodeBase64(remote.content);
      const extractedTitle = extractTitle(text) || stripMdExt(file.name);
      const draft = await createDraft({
        title: extractedTitle,
        content: text,
        remotePath: file.path,
        remoteSha: remote.sha,
        owner: settings.defaultOwner,
        repo: settings.defaultRepo,
        branch: settings.defaultBranch,
      });
      navigate(`/editor?file=${draft.id}`);
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "打开文件失败");
    }
  }

  async function newFileHere() {
    const draft = await createDraft({
      content: "# 新文章\n\n",
      owner: settings.defaultOwner || undefined,
      repo: settings.defaultRepo || undefined,
      branch: settings.defaultBranch || undefined,
    });
    navigate(`/editor?file=${draft.id}`);
  }

  async function confirmDeleteFile() {
    if (!confirmDelete || !client) return;
    try {
      await client.deleteFile({
        owner: settings.defaultOwner,
        repo: settings.defaultRepo,
        path: confirmDelete.path,
        message: `docs: delete ${confirmDelete.name}`,
        sha: confirmDelete.sha,
        branch: settings.defaultBranch,
      });
      toast.success(`已删除 ${confirmDelete.name}`);
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "删除失败");
    }
  }

  const breadcrumb = path.split("/").filter(Boolean);

  return (
    <AppLayout>
      {/* 顶部 */}
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-paper">文件</h1>
            <p className="mt-1 font-mono text-[11px] text-paper-dim">
              {configured
                ? `${settings.defaultOwner}/${settings.defaultRepo}`
                : "未配置默认仓库"}
            </p>
          </div>
          <button
            onClick={load}
            disabled={!configured || loading}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/10 text-paper-dim transition-colors hover:border-amber-300/30 hover:text-amber-300 disabled:opacity-40"
            aria-label="刷新"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      {!configured ? (
        <EmptyState
          icon={FolderGit2}
          title="尚未配置默认仓库"
          description="请先在设置页配置 GitHub Token 并选择默认仓库与文件夹。"
          action={
            <button onClick={() => navigate("/settings")} className="btn-primary mt-1">
              前往设置
            </button>
          }
        />
      ) : (
        <>
          {/* 面包屑 */}
          <nav className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-amber-300/10 bg-ink-850/50 px-3 py-2.5 font-mono text-[11px]">
            {path && (
              <button
                onClick={() => setPath("")}
                className="flex items-center gap-1 text-amber-300/80 hover:text-amber-300"
              >
                <ArrowLeft className="h-3 w-3" />
                返回根
              </button>
            )}
            {path && <span className="px-1 text-paper-faint">·</span>}
            <button
              onClick={() => setPath("")}
              className={cn(path ? "text-paper-dim" : "text-amber-300", "hover:text-amber-300")}
            >
              根目录
            </button>
            {breadcrumb.map((seg, i) => {
              const subPath = breadcrumb.slice(0, i + 1).join("/");
              const isLast = i === breadcrumb.length - 1;
              return (
                <span key={subPath} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-paper-faint" />
                  <button
                    onClick={() => setPath(subPath)}
                    className={cn(
                      isLast ? "text-amber-300" : "text-paper-dim hover:text-amber-300",
                      "truncate max-w-[120px]",
                    )}
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
            {path && (
              <button
                onClick={goUp}
                className="ml-auto flex items-center gap-1 text-paper-dim hover:text-amber-300"
              >
                <ArrowLeft className="h-3 w-3" />
                上级
              </button>
            )}
          </nav>

          {/* 文件列表 */}
          {loading ? (
            <div className="py-12">
              <Spinner size={26} className="mx-auto block" />
            </div>
          ) : contents.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="此文件夹为空"
              description="这里还没有文件，点击右下角按钮新建一篇 Markdown 文章。"
            />
          ) : (
            <ul className="space-y-1.5">
              {contents.map((item) => {
                const isDir = item.type === "dir";
                const md = isMarkdown(item.name);
                return (
                  <li key={item.sha} className="relative">
                    <button
                      onClick={() => (isDir ? enterDir(item) : md ? openFile(item) : null)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-amber-300/8 bg-ink-850/40 px-3.5 py-3 text-left transition-all hover:border-amber-300/25 hover:bg-ink-850/80"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                          isDir
                            ? "border-amber-300/20 bg-amber-300/5 text-amber-300/80"
                            : "border-amber-300/12 bg-ink-900/60 text-amber-300/70",
                        )}
                      >
                        {isDir ? (
                          <Folder className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate font-body text-sm",
                            isDir ? "text-paper" : "text-paper-muted",
                          )}
                        >
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-paper-faint">
                          {isDir ? "文件夹" : formatSize(item.size)}
                        </p>
                      </div>
                      {isDir ? (
                        <ChevronRight className="h-4 w-4 shrink-0 text-paper-faint transition-transform group-hover:translate-x-0.5" />
                      ) : md ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === item.sha ? null : item.sha);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-amber-300/10 hover:text-amber-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono text-[9px] text-paper-faint">
                          非MD
                        </span>
                      )}
                    </button>

                    {/* 操作菜单 */}
                    {menuOpen === item.sha && (
                      <div
                        className="absolute right-2 top-12 z-20 w-36 overflow-hidden rounded-xl border border-amber-300/15 bg-ink-850/95 shadow-card backdrop-blur-xl animate-fade-up"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            openFile(item);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-body text-sm text-paper transition-colors hover:bg-amber-300/10"
                        >
                          <Pencil className="h-3.5 w-3.5 text-amber-300" />
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            setConfirmDelete(item);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-body text-sm text-clay transition-colors hover:bg-clay/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* FAB 新建 */}
          <button
            onClick={newFileHere}
            className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amber-300 text-ink-950 shadow-glow transition-transform active:scale-90 hover:bg-amber-200"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
            aria-label="新建文章"
          >
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </button>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="删除文件？"
        message={`确定要从 GitHub 删除「${confirmDelete?.name}」吗？此操作不可撤销，将产生一个删除提交。`}
        confirmText="删除"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteFile}
      />
    </AppLayout>
  );
}
