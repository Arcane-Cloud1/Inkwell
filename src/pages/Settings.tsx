// 设置页：Token、默认仓库/文件夹、编辑器偏好
import { useState } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  FolderGit2,
  LogOut,
  ExternalLink,
  Type,
  Save,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import RepoPicker, { type PickerTarget } from "@/components/RepoPicker";
import Spinner from "@/components/Spinner";
import { useSettingsStore } from "@/store/settings";
import { useToastStore } from "@/store/toast";
import { GitHubError } from "@/lib/github";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { settings, user, connect, disconnect, update, connecting } = useSettingsStore();
  const toast = useToastStore();

  const [tokenInput, setTokenInput] = useState(settings.token);
  const [showToken, setShowToken] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleTest() {
    const token = tokenInput.trim();
    if (!token) {
      toast.error("请先输入 Token");
      return;
    }
    setTesting(true);
    try {
      const u = await connect(token);
      toast.success(`已连接：${u.login}`);
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "连接失败");
    } finally {
      setTesting(false);
    }
  }

  function handlePick(t: PickerTarget) {
    update({
      defaultOwner: t.owner,
      defaultRepo: t.repo,
      defaultPath: t.path,
      defaultBranch: t.branch || settings.defaultBranch,
    });
    toast.success("已更新默认仓库与文件夹");
  }

  function handleDisconnect() {
    disconnect();
    setTokenInput("");
    toast.info("已断开 GitHub 连接");
  }

  const connected = Boolean(user);

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-paper">设置</h1>
        <p className="mt-1 font-body text-sm text-paper-dim">
          配置 GitHub 授权与写作偏好
        </p>
      </header>

      {/* 用户卡片 */}
      {connected && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-moss/20 bg-moss/5 p-4">
          <img
            src={user!.avatar_url}
            alt={user!.login}
            className="h-11 w-11 rounded-full border border-amber-300/20"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base text-paper">
              {user!.name || user!.login}
            </p>
            <p className="truncate font-mono text-[11px] text-paper-dim">@{user!.login}</p>
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 rounded-full border border-clay/30 px-3 py-1.5 font-mono text-[11px] text-clay transition-colors hover:bg-clay/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            断开
          </button>
        </div>
      )}

      {/* Token 配置 */}
      <section className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-300" />
          <h2 className="font-display text-lg text-paper">GitHub Token</h2>
        </div>
        <div className="space-y-2.5">
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="input-field pr-12 font-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-amber-300"
              aria-label={showToken ? "隐藏" : "显示"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleTest}
            disabled={testing || connecting}
            className="btn-primary w-full"
          >
            {testing ? (
              <>
                <Spinner size={16} className="!text-ink-950" />
                验证中…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                {connected ? "重新验证并保存" : "验证并连接"}
              </>
            )}
          </button>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Inkwell%20Publisher"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 pt-1 font-mono text-[11px] text-paper-dim transition-colors hover:text-amber-300"
          >
            <ExternalLink className="h-3 w-3" />
            前往 GitHub 创建 Token（需 repo 权限）
          </a>
          <p className="flex items-start gap-1.5 rounded-lg bg-ink-900/50 px-3 py-2 font-mono text-[10px] leading-relaxed text-paper-faint">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/60" />
            Token 仅保存在本设备浏览器 LocalStorage，所有请求直连 GitHub，不经过任何第三方。
          </p>
        </div>
      </section>

      {/* 默认仓库与文件夹 */}
      <section className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <FolderGit2 className="h-4 w-4 text-amber-300" />
          <h2 className="font-display text-lg text-paper">默认仓库与文件夹</h2>
        </div>
        <button
          onClick={() => {
            if (!connected) {
              toast.error("请先验证 Token 连接");
              return;
            }
            setPickerOpen(true);
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-300/10 bg-ink-850/50 px-4 py-3.5 text-left transition-colors hover:border-amber-300/25 hover:bg-ink-850"
        >
          <FolderGit2 className="h-4.5 w-4.5 shrink-0 text-amber-300/80" />
          <div className="min-w-0 flex-1">
            <p className="label-text">当前目标</p>
            <p className="mt-0.5 truncate font-mono text-xs text-paper-muted">
              {settings.defaultOwner && settings.defaultRepo
                ? `${settings.defaultOwner}/${settings.defaultRepo}${settings.defaultPath ? `/${settings.defaultPath}` : ""}`
                : "未选择"}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[11px] text-amber-300/80">更改</span>
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          disabled={!connected}
          className="btn-ghost mt-2.5 w-full disabled:opacity-40"
        >
          <RefreshCw className="h-4 w-4" />
          浏览并选择文件夹
        </button>
      </section>

      {/* 编辑器偏好 */}
      <section className="mb-7">
        <div className="mb-3 flex items-center gap-2">
          <Type className="h-4 w-4 text-amber-300" />
          <h2 className="font-display text-lg text-paper">编辑器偏好</h2>
        </div>
        <div className="space-y-4 rounded-2xl border border-amber-300/10 bg-ink-850/40 p-4">
          {/* 字号 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-body text-sm text-paper-muted">编辑区字号</span>
              <span className="font-mono text-xs text-amber-300">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={22}
              step={1}
              value={settings.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="w-full accent-amber-300"
            />
          </div>

          {/* 自动保存 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Save className="h-4 w-4 text-amber-300/80" />
              <div>
                <p className="font-body text-sm text-paper-muted">自动保存草稿</p>
                <p className="font-mono text-[10px] text-paper-faint">
                  编辑时每 1.2 秒写入本地
                </p>
              </div>
            </div>
            <button
              onClick={() => update({ autoSave: !settings.autoSave })}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                settings.autoSave ? "bg-amber-300" : "bg-ink-700",
              )}
              aria-label="切换自动保存"
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-ink-950 transition-transform",
                  settings.autoSave ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          {/* commit 模板 */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-amber-300/80" />
              <span className="font-body text-sm text-paper-muted">
                默认 Commit Message 模板
              </span>
            </div>
            <input
              value={settings.commitTemplate}
              onChange={(e) => update({ commitTemplate: e.target.value })}
              placeholder="docs: update {filename}"
              className="input-field font-mono text-sm"
            />
            <p className="mt-1.5 font-mono text-[10px] text-paper-faint">
              <code className="text-amber-300/80">{"{filename}"}</code> 会被替换为实际文件名
            </p>
          </div>
        </div>
      </section>

      <RepoPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={{
          owner: settings.defaultOwner,
          repo: settings.defaultRepo,
          path: settings.defaultPath,
          branch: settings.defaultBranch,
        }}
        onConfirm={handlePick}
        title="选择默认仓库与文件夹"
        confirmText="设为默认"
      />
    </AppLayout>
  );
}
