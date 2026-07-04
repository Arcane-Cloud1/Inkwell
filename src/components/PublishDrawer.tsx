// 发布抽屉：确认仓库/文件夹/commit message 后发布
import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Upload, GitBranch, FileText } from "lucide-react";
import Sheet from "@/components/Sheet";
import RepoPicker, { type PickerTarget } from "@/components/RepoPicker";
import Spinner from "@/components/Spinner";
import { useSettingsStore } from "@/store/settings";
import { ensureMdExtension, joinPath } from "@/lib/github";

export type PublishParams = {
  owner: string;
  repo: string;
  path: string; // 文件夹路径
  branch?: string;
  message: string;
  filename: string; // 含 .md
  fullPath: string; // folder/filename
};

export default function PublishDrawer({
  open,
  onClose,
  title,
  existingSha,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  existingSha?: string;
  onPublish: (params: PublishParams) => Promise<void>;
}) {
  const settings = useSettingsStore((s) => s.settings);

  const [target, setTarget] = useState<PickerTarget>({
    owner: settings.defaultOwner,
    repo: settings.defaultRepo,
    path: settings.defaultPath,
    branch: settings.defaultBranch,
  });
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const filename = useMemo(() => ensureMdExtension(title || "untitled"), [title]);
  const fullPath = useMemo(() => joinPath(target.path, filename), [target.path, filename]);

  // 打开时重置
  useEffect(() => {
    if (open) {
      setTarget({
        owner: settings.defaultOwner,
        repo: settings.defaultRepo,
        path: settings.defaultPath,
        branch: settings.defaultBranch,
      });
      setMessage(
        settings.commitTemplate
          ? settings.commitTemplate.replace("{filename}", filename)
          : `docs: ${existingSha ? "update" : "create"} ${filename}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canPublish =
    target.owner && target.repo && message.trim() && !publishing;

  async function handlePublish() {
    if (!canPublish) return;
    setPublishing(true);
    try {
      await onPublish({
        owner: target.owner,
        repo: target.repo,
        path: target.path,
        branch: target.branch,
        message: message.trim(),
        filename,
        fullPath,
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={publishing ? () => {} : onClose}
        title={existingSha ? "更新到 GitHub" : "发布到 GitHub"}
        footer={
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            className="btn-primary w-full"
          >
            {publishing ? (
              <>
                <Spinner size={16} className="!text-ink-950" />
                发布中…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {existingSha ? "更新文件" : "发布文件"}
              </>
            )}
          </button>
        }
      >
        <div className="space-y-4 pb-2">
          {/* 目标仓库/文件夹 */}
          <div>
            <p className="label-text mb-2">目标位置</p>
            <button
              onClick={() => setPickerOpen(true)}
              disabled={publishing}
              className="flex w-full items-center gap-3 rounded-xl border border-amber-300/10 bg-ink-900/70 px-4 py-3 text-left transition-colors hover:border-amber-300/30 disabled:opacity-60"
            >
              <FolderOpen className="h-4.5 w-4.5 shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-paper">
                  {target.owner && target.repo
                    ? `${target.owner}/${target.repo}`
                    : "未选择仓库"}
                </p>
                <p className="truncate font-mono text-[11px] text-paper-dim">
                  {target.path ? `/${target.path}` : "（仓库根目录）"}
                </p>
              </div>
              <span className="font-mono text-[11px] text-amber-300/80">更改</span>
            </button>
          </div>

          {/* 文件路径预览 */}
          <div>
            <p className="label-text mb-2">文件路径预览</p>
            <div className="flex items-center gap-2 rounded-xl bg-ink-950/60 px-4 py-3 font-mono text-xs">
              <FileText className="h-3.5 w-3.5 shrink-0 text-amber-300/70" />
              <span className="break-all text-paper-muted">{fullPath}</span>
            </div>
          </div>

          {/* 分支 */}
          <div>
            <p className="label-text mb-2">分支</p>
            <div className="flex items-center gap-2 rounded-xl bg-ink-900/70 px-4 py-3">
              <GitBranch className="h-3.5 w-3.5 text-amber-300/70" />
              <span className="font-mono text-sm text-paper-muted">
                {target.branch || "main"}
              </span>
            </div>
          </div>

          {/* commit message */}
          <div>
            <p className="label-text mb-2">Commit Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={publishing}
              rows={2}
              className="input-field font-mono text-sm"
              placeholder="docs: update article"
            />
          </div>

          {existingSha && (
            <p className="rounded-lg bg-amber-300/5 px-3 py-2 font-mono text-[11px] text-amber-300/80">
              该文件已存在于远端，将以更新方式提交（保留 SHA 校验）。
            </p>
          )}
        </div>
      </Sheet>

      <RepoPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={target}
        title="更改目标位置"
        onConfirm={(t) => setTarget(t)}
      />
    </>
  );
}
