// GitHub REST API v3 客户端封装
import type {
  GitHubCommitResult,
  GitHubContent,
  GitHubFile,
  GitHubRepo,
  GitHubUser,
} from "@/types";

const API_BASE = "https://api.github.com";

/** GitHub API 错误 */
export class GitHubError extends Error {
  status: number;
  docsUrl?: string;
  constructor(message: string, status: number, docsUrl?: string) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.docsUrl = docsUrl;
  }
}

function buildHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function parseError(res: Response): Promise<never> {
  let message = `请求失败 (${res.status})`;
  let docsUrl: string | undefined;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
    if (data?.documentation_url) docsUrl = data.documentation_url;
  } catch {
    // 非 JSON 响应
  }
  // 友好化常见错误
  if (res.status === 401) message = "Token 无效或已过期，请重新配置。";
  else if (res.status === 403 && message.includes("rate limit"))
    message = "GitHub API 速率限制，请稍后再试。";
  else if (res.status === 404) message = "未找到资源（仓库/路径/分支可能不存在）。";
  else if (res.status === 409) message = "冲突：可能是分支不存在或文件已变更。";
  throw new GitHubError(message, res.status, docsUrl);
}

/** 编码为 base64（支持 UTF-8） */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** 解码 base64（支持 UTF-8） */
export function decodeBase64(b64: string): string {
  const clean = b64.replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export type GitHubClient = {
  getUser: () => Promise<GitHubUser>;
  listRepos: () => Promise<GitHubRepo[]>;
  listContents: (params: {
    owner: string;
    repo: string;
    path: string;
    branch?: string;
  }) => Promise<GitHubContent[]>;
  getFile: (params: {
    owner: string;
    repo: string;
    path: string;
    branch?: string;
  }) => Promise<GitHubFile>;
  putFile: (params: {
    owner: string;
    repo: string;
    path: string;
    message: string;
    content: string;
    sha?: string;
    branch?: string;
  }) => Promise<GitHubCommitResult>;
  deleteFile: (params: {
    owner: string;
    repo: string;
    path: string;
    message: string;
    sha: string;
    branch?: string;
  }) => Promise<void>;
};

/** 创建 GitHub 客户端 */
export function createGitHubClient(token: string): GitHubClient {
  const headers = buildHeaders(token);

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      ...init,
      headers: { ...headers, ...(init?.headers || {}) },
    });
    if (!res.ok) await parseError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    async getUser() {
      return request<GitHubUser>("/user");
    },

    async listRepos() {
      const data = await request<GitHubRepo[]>(
        "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      );
      return data;
    },

    async listContents({ owner, repo, path, branch }) {
      const query = branch ? `?ref=${encodeURIComponent(branch)}` : "";
      const cleanPath = path.replace(/^\/+/, "");
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}${query}`;
      const data = await request<GitHubContent[] | GitHubFile>(url);
      // 单文件返回对象，统一为数组
      return Array.isArray(data) ? data : [data];
    },

    async getFile({ owner, repo, path, branch }) {
      const query = branch ? `?ref=${encodeURIComponent(branch)}` : "";
      const cleanPath = path.replace(/^\/+/, "");
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}${query}`;
      return request<GitHubFile>(url);
    },

    async putFile({ owner, repo, path, message, content, sha, branch }) {
      const cleanPath = path.replace(/^\/+/, "");
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}`;
      const body: Record<string, unknown> = {
        message,
        content: encodeBase64(content),
      };
      if (sha) body.sha = sha;
      if (branch) body.branch = branch;
      return request<GitHubCommitResult>(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    async deleteFile({ owner, repo, path, message, sha, branch }) {
      const cleanPath = path.replace(/^\/+/, "");
      const url = `/repos/${owner}/${repo}/contents/${cleanPath}`;
      const body: Record<string, unknown> = { message, sha };
      if (branch) body.branch = branch;
      await request<void>(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  };
}

/** 拼接路径，处理空段 */
export function joinPath(...segments: string[]): string {
  return segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

/** 规范化文件名，确保 .md 后缀 */
export function ensureMdExtension(filename: string): string {
  const trimmed = filename.trim();
  if (!trimmed) return "untitled.md";
  if (/\.md$/i.test(trimmed)) return trimmed;
  return `${trimmed}.md`;
}
