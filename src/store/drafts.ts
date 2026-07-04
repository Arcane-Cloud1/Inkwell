// 草稿与最近文件 store
import { create } from "zustand";
import type { Draft, RecentFile } from "@/types";
import {
  addRecent,
  deleteDraft as dbDeleteDraft,
  getDraft,
  listDrafts,
  listRecent,
  saveDraft,
  uuid,
} from "@/lib/db";

type DraftsState = {
  drafts: Draft[];
  recent: RecentFile[];
  loaded: boolean;
  /** 加载草稿与最近文件列表 */
  loadAll: () => Promise<void>;
  /** 创建新草稿 */
  createDraft: (init?: Partial<Draft>) => Promise<Draft>;
  /** 更新草稿并持久化 */
  updateDraft: (id: string, patch: Partial<Draft>) => Promise<void>;
  /** 删除草稿 */
  removeDraft: (id: string) => Promise<void>;
  /** 读取单个草稿 */
  fetchDraft: (id: string) => Promise<Draft | undefined>;
  /** 记录一次成功发布 */
  recordRecent: (file: RecentFile) => Promise<void>;
};

export const useDraftsStore = create<DraftsState>((set, get) => ({
  drafts: [],
  recent: [],
  loaded: false,

  async loadAll() {
    const [drafts, recent] = await Promise.all([listDrafts(), listRecent()]);
    set({ drafts, recent, loaded: true });
  },

  async createDraft(init) {
    const now = Date.now();
    const draft: Draft = {
      id: uuid(),
      title: "",
      content: "",
      updatedAt: now,
      ...init,
    };
    await saveDraft(draft);
    set({ drafts: [draft, ...get().drafts] });
    return draft;
  },

  async updateDraft(id, patch) {
    const drafts = get().drafts;
    const idx = drafts.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const updated: Draft = { ...drafts[idx], ...patch, updatedAt: Date.now() };
    drafts[idx] = updated;
    set({ drafts: [...drafts] });
    await saveDraft(updated);
  },

  async removeDraft(id) {
    await dbDeleteDraft(id);
    set({ drafts: get().drafts.filter((d) => d.id !== id) });
  },

  async fetchDraft(id) {
    const cached = get().drafts.find((d) => d.id === id);
    if (cached) return cached;
    const draft = await getDraft(id);
    if (draft) {
      set({ drafts: [draft, ...get().drafts] });
    }
    return draft;
  },

  async recordRecent(file) {
    await addRecent(file);
    const recent = await listRecent();
    set({ recent });
  },
}));
