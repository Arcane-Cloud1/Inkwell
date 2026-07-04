// 首页（写作台）
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, FileText, FolderGit2, ChevronRight, Plus, Sparkles } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import { useSettingsStore } from "@/store/settings";
import { useDraftsStore } from "@/store/drafts";
import { excerpt, relativeTime, stripMdExt, greeting, cn } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const { settings, user, connect } = useSettingsStore();
  const { drafts, recent, loadAll, createDraft } = useDraftsStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 若有 token 但未获取用户信息，静默尝试
  useEffect(() => {
    if (settings.token && !user) {
      connect().catch(() => {
        /* 静默失败，由设置页处理 */
      });
    }
  }, [settings.token, user, connect]);

  const connected = Boolean(settings.token && user);
  const configured = Boolean(settings.defaultOwner && settings.defaultRepo);

  async function startNewArticle() {
    const draft = await createDraft({ content: "# 新文章\n\n" });
    navigate(`/editor?file=${draft.id}`);
  }

  return (
    <AppLayout>
      {/* 顶部品牌区 */}
      <header className="mb-7 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <PenLine className="h-5 w-5 text-amber-300" strokeWidth={2} />
            <span className="font-display text-xl font-semibold tracking-tight text-paper">
              Inkwell
            </span>
          </div>
          <p className="mt-1.5 font-body text-sm text-paper-dim">
            {greeting()}，让灵感随时落地。
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
            connected
              ? "border-moss/40 bg-moss/10 text-moss"
              : "border-paper-faint/30 bg-ink-850/60 text-paper-dim",
          )}
          title={connected ? `已连接：${user?.login}` : "未连接 GitHub"}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connected ? "bg-moss animate-amber-pulse" : "bg-paper-faint",
            )}
          />
          {connected ? user?.login : "未连接"}
        </div>
      </header>

      {/* 快捷写作卡 */}
      <button
        onClick={startNewArticle}
        className="group relative mb-7 block w-full overflow-hidden rounded-3xl border border-amber-300/20 p-[1px] text-left transition-transform active:scale-[0.98]"
      >
        <div className="relative overflow-hidden rounded-3xl bg-ink-850/80 px-6 py-7 backdrop-blur-xl">
          {/* 暖光背景 */}
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl transition-opacity group-hover:bg-amber-300/25" />
          <div className="absolute inset-0 bg-paper-grain opacity-40" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="label-text !text-amber-300/80">开始写作</span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-paper">
                新建一篇文章
              </h2>
              <p className="font-body text-sm text-paper-dim">
                Markdown 编辑 · 实时预览 · 一键发布到 GitHub
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-300 text-ink-950 shadow-glow transition-transform group-active:scale-90">
              <Plus className="h-6 w-6" strokeWidth={2.4} />
            </div>
          </div>
        </div>
      </button>

      {/* 仓库状态条 */}
      <button
        onClick={() => navigate("/settings")}
        className="mb-7 flex w-full items-center gap-3 rounded-2xl border border-amber-300/10 bg-ink-850/50 px-4 py-3 text-left transition-colors hover:border-amber-300/25 hover:bg-ink-850"
      >
        <FolderGit2 className="h-4.5 w-4.5 shrink-0 text-amber-300/80" />
        <div className="min-w-0 flex-1">
          <p className="label-text">默认仓库</p>
          <p className="mt-0.5 truncate font-mono text-xs text-paper-muted">
            {configured
              ? `${settings.defaultOwner}/${settings.defaultRepo}${settings.defaultPath ? `/${settings.defaultPath}` : ""}`
              : "尚未配置，点击前往设置"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-paper-faint" />
      </button>

      {/* 最近文件 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg text-paper">最近文章</h3>
          {drafts.length > 0 && (
            <span className="font-mono text-[11px] text-paper-dim">
              {drafts.length} 篇草稿
            </span>
          )}
        </div>

        {drafts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="还没有文章"
            description="点击上方的「新建一篇文章」开始你的第一篇 Markdown 写作。"
            action={
              <button onClick={startNewArticle} className="btn-ghost mt-1">
                <Plus className="h-4 w-4" />
                新建文章
              </button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {drafts.slice(0, 8).map((draft) => (
              <li key={draft.id}>
                <button
                  onClick={() => navigate(`/editor?file=${draft.id}`)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-amber-300/10 bg-ink-850/50 px-4 py-3.5 text-left transition-all hover:border-amber-300/25 hover:bg-ink-850"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      draft.remoteSha
                        ? "border-moss/30 bg-moss/10 text-moss"
                        : "border-amber-300/15 bg-ink-900/60 text-amber-300/70",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[15px] text-paper">
                      {draft.title ? stripMdExt(draft.title) : "无标题"}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-paper-dim">
                      {excerpt(draft.content, 50)} · {relativeTime(draft.updatedAt)}
                    </p>
                  </div>
                  {draft.remoteSha ? (
                    <span className="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-moss">
                      已发布
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-300/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-300/80">
                      草稿
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 已发布文件快捷区（如有） */}
      {recent.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 font-display text-lg text-paper">最近发布</h3>
          <ul className="space-y-2">
            {recent.slice(0, 4).map((f) => (
              <li key={f.path + f.sha}>
                <button
                  onClick={() => navigate(`/files`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-amber-300/8 bg-ink-850/30 px-3.5 py-2.5 text-left transition-colors hover:bg-ink-850/60"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-moss" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-paper-muted">
                    {f.owner}/{f.repo}/{f.path}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-paper-faint">
                    {relativeTime(f.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppLayout>
  );
}
