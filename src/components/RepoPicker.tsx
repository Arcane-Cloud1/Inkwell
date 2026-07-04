// 仓库 + 文件夹浏览选择器（底部抽屉）
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  ArrowLeft,
  Check,
  RefreshCw,
  Search,
} from "lucide-react";
import Sheet from "@/components/Sheet";
import Spinner from "@/components/Spinner";
import { useSettingsStore } from "@/store/settings";
import { useToastStore } from "@/store/toast";
import { GitHubError } from "@/lib/github";
import type { GitHubContent, GitHubRepo } from "@/types";
import { cn, basename } from "@/lib/utils";

export type PickerTarget = {
  owner: string;
  repo: string;
  branch?: string;
  path: string;
};

type Step = "repo" | "folder";

export default function RepoPicker({
  open,
  onClose,
  onConfirm,
  initial,
  title = "选择仓库与文件夹",
  confirmText = "选择此处",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (target: PickerTarget) => void;
  initial?: PickerTarget;
  title?: string;
  confirmText?: string;
}) {
  const client = useSettingsStore((s) => s.client);
  const toast = useToastStore();

  const [step, setStep] = useState<Step>("repo");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoQuery, setRepoQuery] = useState("");

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [path, setPath] = useState("");
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);

  const loadRepos = useCallback(async () => {
    if (!client) return;
    setLoadingRepos(true);
    try {
      const list = await client.listRepos();
      setRepos(list);
    } catch (e) {
      toast.error(e instanceof GitHubError ? e.message : "加载仓库列表失败");
    } finally {
      setLoadingRepos(false);
    }
  }, [client, toast]);

  const loadContents = useCallback(
    async (repo: GitHubRepo, p: string) => {
      if (!client) return;
      setLoadingContents(true);
      try {
        const list = await client.listContents({
          owner: repo.owner.login,
          repo: repo.name,
          path: p,
          branch: repo.default_branch,
        });
        // 只显示目录，便于挑选文件夹
        setContents(list.filter((c) => c.type === "dir"));
      } catch (e) {
        toast.error(e instanceof GitHubError ? e.message : "加载目录失败");
        setContents([]);
      } finally {
        setLoadingContents(false);
      }
    },
    [client, toast],
  );

  // 打开时初始化
  useEffect(() => {
    if (!open) return;
    setRepoQuery("");
    if (initial?.owner && initial?.repo) {
      const matched = repos.find(
        (r) => r.owner.login === initial.owner && r.name === initial.repo,
      );
      if (matched) {
        setSelectedRepo(matched);
        setPath(initial.path || "");
        setStep("folder");
        loadContents(matched, initial.path || "");
        return;
      }
    }
    setStep("repo");
    setSelectedRepo(null);
    setPath("");
    setContents([]);
    if (repos.length === 0) loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setPath("");
    setStep("folder");
    loadContents(repo, "");
  }

  function enterDir(dir: GitHubContent) {
    const nextPath = dir.path;
    setPath(nextPath);
    if (selectedRepo) loadContents(selectedRepo, nextPath);
  }

  function goUp() {
    if (!selectedRepo) return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    const next = parts.join("/");
    setPath(next);
    loadContents(selectedRepo, next);
  }

  function confirm() {
    if (!selectedRepo) return;
    onConfirm({
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      branch: selectedRepo.default_branch,
      path,
    });
    onClose();
  }

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(repoQuery.toLowerCase()),
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        step === "folder" && selectedRepo ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-ink-900/70 px-3 py-2 font-mono text-xs text-amber-300">
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {selectedRepo.owner.login}/{selectedRepo.name}
                {path ? `/${path}` : ""}
              </span>
            </div>
            <button onClick={confirm} className="btn-primary w-full">
              <Check className="h-4 w-4" />
              {confirmText}
            </button>
          </div>
        ) : undefined
      }
    >
      {step === "repo" && (
        <div className="space-y-3 pb-2">
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/10 bg-ink-900/70 px-3 py-2.5">
            <Search className="h-4 w-4 text-paper-dim" />
            <input
              value={repoQuery}
              onChange={(e) => setRepoQuery(e.target.value)}
              placeholder="搜索仓库…"
              className="w-full bg-transparent text-sm text-paper placeholder:text-paper-faint focus:outline-none"
            />
            <button
              onClick={loadRepos}
              className="text-paper-dim transition-colors hover:text-amber-300"
              aria-label="刷新"
            >
              <RefreshCw className={cn("h-4 w-4", loadingRepos && "animate-spin")} />
            </button>
          </div>
          {loadingRepos ? (
            <div className="py-10">
              <Spinner size={24} className="mx-auto block" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <p className="py-8 text-center text-sm text-paper-dim">
              {repos.length === 0 ? "暂无可用仓库" : "无匹配仓库"}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filteredRepos.map((repo) => (
                <li key={repo.id}>
                  <button
                    onClick={() => pickRepo(repo)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-ink-850/50 px-3 py-3 text-left transition-all hover:border-amber-300/25 hover:bg-ink-850"
                  >
                    <Folder className="h-4.5 w-4.5 shrink-0 text-amber-300/70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-paper">
                        {repo.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-paper-dim">
                        {repo.owner.login} · {repo.default_branch}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-paper-faint transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === "folder" && selectedRepo && (
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("repo")}
              className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-xs text-paper-dim transition-colors hover:text-amber-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              换仓库
            </button>
            {path && (
              <button
                onClick={goUp}
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-xs text-paper-dim transition-colors hover:text-amber-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                上级
              </button>
            )}
          </div>

          {/* 面包屑 */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-ink-900/50 px-3 py-2 font-mono text-[11px]">
            <button
              onClick={() => {
                setPath("");
                loadContents(selectedRepo, "");
              }}
              className="text-amber-300/80 hover:text-amber-300"
            >
              根目录
            </button>
            {path.split("/").filter(Boolean).map((seg, i, arr) => {
              const subPath = arr.slice(0, i + 1).join("/");
              return (
                <span key={subPath} className="flex items-center gap-1">
                  <span className="text-paper-faint">/</span>
                  <button
                    onClick={() => {
                      setPath(subPath);
                      loadContents(selectedRepo, subPath);
                    }}
                    className="text-paper-dim hover:text-amber-300"
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>

          {loadingContents ? (
            <div className="py-10">
              <Spinner size={24} className="mx-auto block" />
            </div>
          ) : contents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-300/15 px-4 py-8 text-center">
              <p className="font-body text-sm text-paper-muted">此处没有子文件夹</p>
              <p className="mt-1 font-mono text-[11px] text-paper-faint">
                可以直接将当前路径作为目标
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {contents.map((c) => (
                <li key={c.sha}>
                  <button
                    onClick={() => enterDir(c)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-ink-850/50 px-3 py-2.5 text-left transition-all hover:border-amber-300/25 hover:bg-ink-850"
                  >
                    <Folder className="h-4 w-4 shrink-0 text-amber-300/70" />
                    <span className="min-w-0 flex-1 truncate font-body text-sm text-paper">
                      {basename(c.path)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-paper-faint transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  );
}
