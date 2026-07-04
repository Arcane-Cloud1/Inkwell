// 应用全局类型定义

/** 应用设置（持久化到 LocalStorage） */
export type Settings = {
  token: string;
  defaultOwner: string;
  defaultRepo: string;
  defaultPath: string;
  defaultBranch: string;
  fontSize: number;
  autoSave: boolean;
  commitTemplate: string;
};

/** 草稿（持久化到 IndexedDB） */
export type Draft = {
  id: string;
  title: string;
  content: string;
  remotePath?: string;
  remoteSha?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  updatedAt: number;
};

/** 最近发布的文件（持久化到 IndexedDB） */
export type RecentFile = {
  path: string;
  sha: string;
  owner: string;
  repo: string;
  branch: string;
  title: string;
  updatedAt: number;
};

/** GitHub 用户信息 */
export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

/** GitHub 仓库 */
export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
};

/** GitHub 目录内容项 */
export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  sha: string;
  size: number;
};

/** GitHub 文件（含内容） */
export type GitHubFile = GitHubContent & {
  content: string;
  encoding: string;
};

/** PUT 文件结果 */
export type GitHubCommitResult = {
  content: {
    path: string;
    sha: string;
    name: string;
  } | null;
  commit: {
    sha: string;
    html_url: string;
    message: string;
  };
};

/** 发布目标参数 */
export type PublishTarget = {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  message: string;
};

/** 默认设置 */
export const DEFAULT_SETTINGS: Settings = {
  token: "",
  defaultOwner: "",
  defaultRepo: "",
  defaultPath: "",
  defaultBranch: "main",
  fontSize: 16,
  autoSave: true,
  commitTemplate: "docs: update {filename}",
};
