import { create } from "zustand";
import { DEFAULT_SETTINGS, type GitHubUser, type Settings } from "@/types";
import { createGitHubClient, GitHubError, type GitHubClient } from "@/lib/github";
import { decrypt, encrypt, maskToken } from "@/lib/encryption";

const STORAGE_KEY = "inkwell-settings";

type SettingsState = {
  settings: Settings;
  user: GitHubUser | null;
  client: GitHubClient | null;
  connecting: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  connect: (token?: string) => Promise<GitHubUser>;
  disconnect: () => Promise<void>;
  isConfigured: () => boolean;
  getMaskedToken: () => string;
};

async function loadFromStorage(): Promise<Settings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    if (merged.token) {
      merged.token = await decrypt(merged.token);
    }
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveToStorage(settings: Settings) {
  const toSave = { ...settings };
  if (toSave.token) {
    toSave.token = await encrypt(toSave.token);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Debounced save: avoids encrypting + writing localStorage on every keystroke
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(settings: Settings) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void saveToStorage(settings);
  }, 400);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  user: null,
  client: null,
  connecting: false,

  async load() {
    const settings = await loadFromStorage();
    set({
      settings,
      client: settings.token ? createGitHubClient(settings.token) : null,
    });
  },

  update(patch) {
    const prev = get().settings;
    const next = { ...prev, ...patch };
    // Only recreate client when token actually changes
    const tokenChanged = patch.token !== undefined && patch.token !== prev.token;
    set({
      settings: next,
      ...(tokenChanged
        ? { client: next.token ? createGitHubClient(next.token) : null }
        : {}),
    });
    // Persist in background (debounced) — don't block the UI
    scheduleSave(next);
  },

  async connect(token) {
    const useToken = token ?? get().settings.token;
    if (!useToken) throw new GitHubError("请先输入 Token", 0);
    set({ connecting: true });
    try {
      const client = createGitHubClient(useToken);
      const user = await client.getUser();
      const next = { ...get().settings, token: useToken };
      await saveToStorage(next);
      set({ settings: next, client, user, connecting: false });
      return user;
    } catch (e) {
      set({ connecting: false });
      throw e;
    }
  },

  async disconnect() {
    const next = { ...get().settings, token: "" };
    await saveToStorage(next);
    set({ settings: next, client: null, user: null });
  },

  isConfigured() {
    const s = get().settings;
    return Boolean(s.token && s.defaultOwner && s.defaultRepo);
  },

  getMaskedToken() {
    return maskToken(get().settings.token);
  },
}));
