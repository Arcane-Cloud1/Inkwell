// 设置 store：GitHub Token、默认仓库/文件夹、编辑器偏好、已登录用户
import { create } from "zustand";
import { DEFAULT_SETTINGS, type GitHubUser, type Settings } from "@/types";
import { createGitHubClient, GitHubError, type GitHubClient } from "@/lib/github";

const STORAGE_KEY = "inkwell-settings";

type SettingsState = {
  settings: Settings;
  user: GitHubUser | null;
  client: GitHubClient | null;
  connecting: boolean;
  /** 从 LocalStorage 加载已存设置 */
  load: () => void;
  /** 更新部分设置并持久化 */
  update: (patch: Partial<Settings>) => void;
  /** 测试 Token 连接并获取用户信息 */
  connect: (token?: string) => Promise<GitHubUser>;
  /** 退出（清除 token 与用户） */
  disconnect: () => void;
  /** 是否已完成基础配置（token + 仓库） */
  isConfigured: () => boolean;
};

function loadFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveToStorage(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const initialSettings = loadFromStorage();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: initialSettings,
  user: null,
  client: initialSettings.token ? createGitHubClient(initialSettings.token) : null,
  connecting: false,

  load() {
    const settings = loadFromStorage();
    set({
      settings,
      client: settings.token ? createGitHubClient(settings.token) : null,
    });
  },

  update(patch) {
    const next = { ...get().settings, ...patch };
    saveToStorage(next);
    set({
      settings: next,
      client: next.token ? createGitHubClient(next.token) : null,
    });
  },

  async connect(token) {
    const useToken = token ?? get().settings.token;
    if (!useToken) throw new GitHubError("请先输入 Token", 0);
    set({ connecting: true });
    try {
      const client = createGitHubClient(useToken);
      const user = await client.getUser();
      const next = { ...get().settings, token: useToken };
      saveToStorage(next);
      set({ settings: next, client, user, connecting: false });
      return user;
    } catch (e) {
      set({ connecting: false });
      throw e;
    }
  },

  disconnect() {
    const next = { ...get().settings, token: "" };
    saveToStorage(next);
    set({ settings: next, client: null, user: null });
  },

  isConfigured() {
    const s = get().settings;
    return Boolean(s.token && s.defaultOwner && s.defaultRepo);
  },
}));
