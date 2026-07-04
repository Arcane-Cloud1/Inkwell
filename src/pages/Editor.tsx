// 编辑器页
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Eye,
  Pencil,
  Check,
  Cloud,
  Loader2,
} from "lucide-react";
import EditorToolbar from "@/components/EditorToolbar";
import MarkdownPreview from "@/components/MarkdownPreview";
import PublishDrawer, { type PublishParams } from "@/components/PublishDrawer";
import Spinner from "@/components/Spinner";
import { useSettingsStore } from "@/store/settings";
import { useDraftsStore } from "@/store/drafts";
import { useToastStore } from "@/store/toast";
import { useMarkdownEditor } from "@/hooks/useMarkdownEditor";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import { GitHubError } from "@/lib/github";
import { cn } from "@/lib/utils";

type View = "edit" | "preview";

export default function Editor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileId = params.get("file");

  const { client, settings } = useSettingsStore();
  const { fetchDraft, updateDraft, recordRecent, createDraft } = useDraftsStore();
  const toast = useToastStore();

  const [draftId, setDraftId] = useState<string | null>(fileId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [view, setView] = useState<View>("edit");
  const [publishOpen, setPublishOpen] = useState(false);
  const [existingSha, setExistingSha] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(fileId));
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  // 加载草稿
  useEffect(() => {
    let active = true;
    async function load() {
      if (!fileId) {
        setLoading(false);
        return;
      }
      const draft = await fetchDraft(fileId);
      if (!active) return;
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setExistingSha(draft.remoteSha);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [fileId, fetchDraft]);

  const persist = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    try {
      if (!draftId) {
        const draft = await createDraft({ title, content });
        setDraftId(draft.id);
      } else {
        await updateDraft(draftId, { title, content });
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, title, content, updateDraft, createDraft]);

  // 自动保存（标题/内容变化后 1.2s）
  useDebouncedSave(settings.autoSave, 1200, persist, [title, content]);

  const { ref, apply } = useMarkdownEditor(content, (next) => {
    setContent(next);
    setSaved(false);
  });

  function handleTitleChange(v: string) {
    setTitle(v);
    setSaved(false);
  }

  // 发布
  async function handlePublish(p: PublishParams) {
    if (!client) {
      toast.error("未连接 GitHub，请先在设置中配置 Token");
      return;
    }
    try {
      // 先尝试获取现有文件 sha（支持更新）
      let sha: string | undefined = existingSha;
      try {
        const existing = await client.getFile({
          owner: p.owner,
          repo: p.repo,
          path: p.fullPath,
          branch: p.branch,
        });
        sha = existing.sha;
      } catch (e) {
        // 404 表示新文件，忽略
        if (e instanceof GitHubError && e.status !== 404) throw e;
        sha = undefined;
      }

      const result = await client.putFile({
        owner: p.owner,
        repo: p.repo,
        path: p.fullPath,
        message: p.message,
        content,
        sha,
        branch: p.branch,
      });

      const newSha = result.content?.sha ?? "";
      if (draftId) {
        await updateDraft(draftId, {
          title: p.filename,
          remotePath: p.fullPath,
          remoteSha: newSha,
          owner: p.owner,
          repo: p.repo,
          branch: p.branch,
        });
      }
      setExistingSha(newSha);

      await recordRecent({
        path: p.fullPath,
        sha: newSha,
        owner: p.owner,
        repo: p.repo,
        branch: p.branch || "main",
        title: p.filename,
        updatedAt: Date.now(),
      });

      toast.success(existingSha || sha ? "文件已更新到 GitHub" : "文件已发布到 GitHub");
      setPublishOpen(false);
      navigate("/");
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "发布失败，请重试");
    }
  }

  function handleBack() {
    if (draftId && !saved) {
      void persist().then(() => navigate(-1));
    } else {
      navigate(-1);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* 顶部琥珀分隔线 */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

      {/* 标题栏 */}
      <header
        className="shrink-0 border-b border-amber-300/10 bg-ink-900/60 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5">
          <button
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-amber-300/10 hover:text-paper"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="文章标题…"
            className="min-w-0 flex-1 bg-transparent font-display text-base text-paper placeholder:text-paper-faint focus:outline-none"
          />

          {/* 保存状态 */}
          <span className="hidden shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-paper-faint sm:flex">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                保存中
              </>
            ) : saved ? (
              <>
                <Check className="h-3 w-3 text-moss" />
                已保存
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                未保存
              </>
            )}
          </span>

          <button
            onClick={() => setPublishOpen(true)}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            发布
          </button>
        </div>

        {/* 编辑/预览切换（仅移动端） */}
        <div className="mx-auto max-w-3xl px-3 pb-2 md:hidden">
          <div className="flex rounded-full border border-amber-300/10 bg-ink-900/60 p-0.5">
            {(["edit", "preview"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all",
                  view === v
                    ? "bg-amber-300 text-ink-950"
                    : "text-paper-dim hover:text-paper",
                )}
              >
                {v === "edit" ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    预览
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 编辑区 / 预览区 */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto grid h-full max-w-3xl grid-cols-1 md:grid-cols-2">
          {/* 编辑 */}
          <section
            className={cn(
              "flex h-full min-h-0 flex-col border-amber-300/10",
              view !== "edit" && "hidden md:flex md:border-r",
            )}
          >
            <div className="shrink-0 border-b border-amber-300/8 bg-ink-900/30">
              <EditorToolbar onAction={apply} />
            </div>
            <textarea
              ref={ref}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaved(false);
              }}
              placeholder="# 开始写作…&#10;&#10;支持完整 Markdown 语法与 GFM。"
              spellCheck={false}
              className="flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-relaxed text-paper placeholder:text-paper-faint focus:outline-none"
              style={{ fontSize: `${settings.fontSize}px` }}
            />
          </section>

          {/* 预览 */}
          <section
            className={cn(
              "h-full min-h-0 overflow-y-auto bg-ink-950/30 px-4 py-4",
              view !== "preview" && "hidden md:block",
            )}
          >
            <MarkdownPreview content={content} />
          </section>
        </div>
      </main>

      <PublishDrawer
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={title}
        existingSha={existingSha}
        onPublish={handlePublish}
      />
    </div>
  );
}
