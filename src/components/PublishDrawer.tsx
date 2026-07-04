// 发布抽屉：确认仓库/文件夹/commit message 后发布
import { useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Upload, GitBranch, FileText, FileCode, ChevronDown, ChevronUp, ImagePlus, Lock as LockIcon } from "lucide-react";
import Sheet from "@/components/Sheet";
import RepoPicker, { type PickerTarget } from "@/components/RepoPicker";
import Spinner from "@/components/Spinner";
import { useSettingsStore } from "@/store/settings";
import { useToastStore } from "@/store/toast";
import { type GitHubClient, ensureMdExtension, joinPath } from "@/lib/github";
import {
  parseFrontmatterTemplate,
  buildFrontmatterFromFields,
  type FrontmatterField,
} from "@/lib/frontmatter";
import { cn } from "@/lib/utils";

export type PublishParams = {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  message: string;
  filename: string;
  fullPath: string;
  frontmatterFields?: FrontmatterField[];
  frontmatterValues?: Record<string, string>;
  frontmatterEnabled?: Record<string, boolean>;
};

export default function PublishDrawer({
  open,
  onClose,
  title,
  content,
  existingSha,
  onPublish,
  client,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  existingSha?: string;
  onPublish: (params: PublishParams) => Promise<void>;
  client?: GitHubClient | null;
}) {
  const settings = useSettingsStore((s) => s.settings);
  const toast = useToastStore();

  const [target, setTarget] = useState<PickerTarget>({
    owner: settings.defaultOwner,
    repo: settings.defaultRepo,
    path: settings.defaultPath,
    branch: settings.defaultBranch,
  });
  const [message, setMessage] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showFrontmatterEdit, setShowFrontmatterEdit] = useState(true);
  const [showFrontmatterPreview, setShowFrontmatterPreview] = useState(false);
  const [fmValues, setFmValues] = useState<Record<string, string>>({});
  const [fmEnabled, setFmEnabled] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fmFields = useMemo<FrontmatterField[]>(
    () => (settings.frontmatterEnabled ? parseFrontmatterTemplate(settings.frontmatterTemplate) : []),
    [settings.frontmatterEnabled, settings.frontmatterTemplate],
  );

  const filename = useMemo(() => ensureMdExtension(title || "untitled"), [title]);
  const fullPath = useMemo(() => joinPath(target.path, filename), [target.path, filename]);

  const frontmatterPreview = useMemo(() => {
    if (!settings.frontmatterEnabled || fmFields.length === 0) return "";
    return buildFrontmatterFromFields(fmFields, fmValues, fmEnabled);
  }, [settings.frontmatterEnabled, fmFields, fmValues, fmEnabled]);

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
      if (settings.frontmatterEnabled && settings.frontmatterTemplate) {
        const fields = parseFrontmatterTemplate(settings.frontmatterTemplate);
        const initValues: Record<string, string> = {};
        const initEnabled: Record<string, boolean> = {};
        for (const field of fields) {
          if (field.hasVariable && field.variable) {
            initEnabled[field.key] = true;
            if (field.variable === "title") {
              initValues[field.variable] = title;
            } else if (field.variable === "date") {
              initValues[field.variable] = new Date().toISOString().slice(0, 10);
            } else if (field.variable === "description") {
              initValues[field.variable] = title;
            } else {
              initValues[field.variable] = "";
            }
          } else {
            initEnabled[field.key] = false;
            initValues[field.key] = field.staticValue ?? "";
          }
        }
        const titleField = fields.find((f) => f.key === "title");
        if (titleField) {
          initEnabled["title"] = true;
          if (titleField.variable) {
            initValues[titleField.variable] = title;
          }
        }
        setFmValues(initValues);
        setFmEnabled(initEnabled);
      }
      setShowFrontmatterEdit(true);
      setShowFrontmatterPreview(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && settings.frontmatterEnabled) {
      const titleField = fmFields.find((f) => f.key === "title");
      if (titleField?.variable) {
        setFmValues((prev) => ({ ...prev, [titleField.variable!]: title }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  function updateFmValue(key: string, value: string) {
    setFmValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFmEnabled(key: string) {
    if (key === "title") return;
    setFmEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(result);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        resolve(btoa(binary));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!client) {
      toast.error("未连接 GitHub，无法上传图片");
      return;
    }
    if (!target.owner || !target.repo) {
      toast.error("请先选择目标仓库");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const uploadPath = joinPath(settings.imagePath, file.name);
      await client.putRawFile({
        owner: target.owner,
        repo: target.repo,
        path: uploadPath,
        message: `upload image: ${file.name}`,
        content: base64,
        branch: target.branch,
      });
      const imageUrl = `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${target.branch || "main"}/${uploadPath}`;
      // Fill into image variable
      const imageField = fmFields.find((f) => f.key === "image" || f.variable === "image");
      const valueKey = imageField?.hasVariable && imageField.variable ? imageField.variable : "image";
      updateFmValue(valueKey, imageUrl);
      if (imageField && !fmEnabled[imageField.key]) {
        toggleFmEnabled(imageField.key);
      }
      toast.success("图片已上传");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "图片上传失败");
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
        frontmatterFields: settings.frontmatterEnabled ? fmFields : undefined,
        frontmatterValues: settings.frontmatterEnabled ? fmValues : undefined,
        frontmatterEnabled: settings.frontmatterEnabled ? fmEnabled : undefined,
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

          {/* Frontmatter 字段编辑 */}
          {settings.frontmatterEnabled && fmFields.length > 0 && (
            <div>
              <button
                onClick={() => setShowFrontmatterEdit((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl bg-ink-900/50 px-4 py-2.5 transition-colors hover:bg-ink-900"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-amber-300/70" />
                  <span className="font-mono text-xs text-paper-muted">文章前缀 (Frontmatter)</span>
                </div>
                {showFrontmatterEdit ? (
                  <ChevronUp className="h-4 w-4 text-paper-faint" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-paper-faint" />
                )}
              </button>

              {showFrontmatterEdit && (
                <div className="mt-2 space-y-2">
                  {fmFields.map((field) => {
                    const isTitle = field.key === "title";
                    const isEnabled = fmEnabled[field.key] ?? false;
                    const valueKey = field.hasVariable && field.variable ? field.variable : field.key;
                    const value = fmValues[valueKey] ?? "";

                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "rounded-xl border border-amber-300/8 bg-ink-950/40 p-3 transition-opacity",
                          !isEnabled && "opacity-40",
                        )}
                      >
                        {/* Label row with toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isTitle ? (
                              <LockIcon className="h-3.5 w-3.5 shrink-0 text-amber-300/60" />
                            ) : (
                              <button
                                onClick={() => toggleFmEnabled(field.key)}
                                className={cn(
                                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                                  isEnabled ? "bg-amber-300" : "bg-ink-700",
                                )}
                                aria-label={`切换 ${field.label}`}
                              >
                                <span
                                  className={cn(
                                    "absolute top-0.5 h-4 w-4 rounded-full bg-ink-950 transition-transform",
                                    isEnabled ? "translate-x-[17px]" : "translate-x-0.5",
                                  )}
                                />
                              </button>
                            )}
                            <span className="font-body text-sm text-paper-muted">
                              {field.label}
                            </span>
                            <span className="font-mono text-[10px] text-paper-faint">
                              ({field.key})
                            </span>
                          </div>
                        </div>

                        {/* Input field */}
                        <div className="mt-2">
                          {field.inputType === "textarea" ? (
                            <textarea
                              value={value}
                              onChange={(e) => updateFmValue(valueKey, e.target.value)}
                              disabled={publishing || !isEnabled}
                              rows={2}
                              placeholder={field.placeholder}
                              className="input-field font-mono text-sm"
                            />
                          ) : field.inputType === "date" ? (
                            <input
                              type="date"
                              value={value}
                              onChange={(e) => updateFmValue(valueKey, e.target.value)}
                              disabled={publishing || !isEnabled}
                              placeholder={field.placeholder}
                              className="input-field font-mono text-sm"
                            />
                          ) : (field.key === "image" || field.variable === "image") ? (
                            <div className="flex gap-2">
                              <input
                                value={value}
                                onChange={(e) => updateFmValue(valueKey, e.target.value)}
                                disabled={publishing || !isEnabled}
                                placeholder={field.placeholder}
                                className="input-field font-mono text-sm flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={publishing || !isEnabled || uploading || !client}
                                className="btn-ghost !px-2.5 !py-1.5 shrink-0 disabled:opacity-40"
                                title="上传预览图到 GitHub"
                              >
                                {uploading ? (
                                  <Spinner size={14} />
                                ) : (
                                  <ImagePlus className="h-4 w-4" />
                                )}
                              </button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </div>
                          ) : (
                            <input
                              value={value}
                              onChange={(e) => updateFmValue(valueKey, e.target.value)}
                              disabled={publishing || !isEnabled || isTitle}
                              placeholder={field.placeholder}
                              className={cn(
                                "input-field font-mono text-sm",
                                isTitle && "opacity-60",
                              )}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 预览折叠 */}
              <button
                onClick={() => setShowFrontmatterPreview((v) => !v)}
                className="mt-2 flex w-full items-center justify-between rounded-lg bg-ink-900/30 px-3 py-1.5 transition-colors hover:bg-ink-900/50"
              >
                <span className="font-mono text-[10px] text-paper-faint">预览渲染结果</span>
                {showFrontmatterPreview ? (
                  <ChevronUp className="h-3 w-3 text-paper-faint" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-paper-faint" />
                )}
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  showFrontmatterPreview ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <pre className="mt-1 overflow-x-auto rounded-lg bg-ink-950/60 p-2.5 font-mono text-[11px] leading-relaxed text-paper-dim">
                  {frontmatterPreview}
                </pre>
              </div>
            </div>
          )}

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
