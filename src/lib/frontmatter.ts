// Frontmatter 模板解析与合并工具

/** 内置变量的默认值与标签 */
const BUILTIN_VARS: Record<string, { label: string; default: string | (() => string); placeholder: string }> = {
  title: { label: "标题", default: "", placeholder: "文章标题" },
  date: { label: "日期", default: () => new Date().toISOString().slice(0, 10), placeholder: "YYYY-MM-DD" },
  description: { label: "简介", default: "", placeholder: "文章简介描述" },
  image: { label: "预览图", default: "", placeholder: "图片 URL 或路径" },
  author: { label: "作者", default: "", placeholder: "作者名" },
  tags: { label: "标签", default: "", placeholder: "标签1, 标签2" },
};

function getVarDefault(key: string): string {
  const v = BUILTIN_VARS[key];
  if (!v) return "";
  return typeof v.default === "function" ? v.default() : v.default;
}

function getVarLabel(key: string): string {
  return BUILTIN_VARS[key]?.label ?? key;
}

function getVarPlaceholder(key: string): string {
  return BUILTIN_VARS[key]?.placeholder ?? `输入 ${key}`;
}

/** 从模板中提取所有 {variable} 变量名（去重，保持顺序） */
export function extractTemplateVars(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g);
  if (!matches) return [];
  const seen = new Set<string>();
  return matches.map((m) => m.slice(1, -1)).filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

/** 获取变量的显示信息 */
export function getVarInfo(key: string): { label: string; placeholder: string } {
  return { label: getVarLabel(key), placeholder: getVarPlaceholder(key) };
}

/** 为模板中的变量生成初始值（title 自动填充） */
export function buildInitialVars(template: string, title: string): Record<string, string> {
  const vars = extractTemplateVars(template);
  const result: Record<string, string> = {};
  for (const v of vars) {
    if (v === "title") {
      result[v] = title;
    } else {
      result[v] = getVarDefault(v);
    }
  }
  return result;
}

/**
 * 渲染 frontmatter 模板，替换所有 {variable} 变量
 */
export function renderFrontmatter(
  template: string,
  vars: Record<string, string>,
): string {
  const allVars: Record<string, string> = { ...vars };
  // date 默认取今天
  if (extractTemplateVars(template).includes("date") && !allVars.date) {
    allVars.date = new Date().toISOString().slice(0, 10);
  }
  // description 默认从 title 提取
  if (extractTemplateVars(template).includes("description") && !allVars.description) {
    allVars.description = allVars.title || "";
  }

  let result = template;
  for (const [key, value] of Object.entries(allVars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), escapeYaml(value));
  }
  return result;
}

/**
 * 将 frontmatter 与正文内容合并
 */
export function mergeFrontmatter(
  content: string,
  frontmatter: string,
): string {
  const stripped = stripExistingFrontmatter(content);
  return `${frontmatter}\n\n${stripped}`;
}

/**
 * 移除已有的 frontmatter（防止重复添加）
 */
export function stripExistingFrontmatter(content: string): string {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return content;
  const idx = trimmed.indexOf("\n---", 3);
  if (idx === -1) return content;
  const end = trimmed.indexOf("\n", idx + 4);
  return end === -1 ? "" : trimmed.slice(end + 1);
}

/**
 * 从正文提取第一段作为描述
 */
function extractFirstParagraph(title: string, content: string): string {
  if (content.trim()) {
    const lines = content.split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (t && !t.startsWith("#") && !t.startsWith("---")) {
        return t.replace(/[*_`~>!\[\]]/g, "").slice(0, 120);
      }
    }
  }
  return title;
}

/**
 * 转义 YAML 字符串值（单引号转义）
 */
export function escapeYaml(str: string): string {
  return str.replace(/'/g, "''");
}

/** Parsed frontmatter field */
export type FrontmatterField = {
  /** YAML key name (e.g. "title", "pubDate") */
  key: string;
  /** Friendly label/description in Chinese */
  label: string;
  /** The full original line from the template */
  templateLine: string;
  /** Whether this line contains a {variable} placeholder */
  hasVariable: boolean;
  /** The variable name if hasVariable is true */
  variable?: string;
  /** The static value if hasVariable is false */
  staticValue?: string;
  /** Input type hint */
  inputType: "text" | "textarea" | "date" | "tags";
  /** Placeholder text */
  placeholder: string;
};

/** Map of YAML key to friendly Chinese label and input type */
const FIELD_META: Record<string, { label: string; inputType: "text" | "textarea" | "date" | "tags"; placeholder: string }> = {
  title: { label: "文章标题", inputType: "text", placeholder: "输入文章标题" },
  description: { label: "文章简介", inputType: "textarea", placeholder: "简短描述文章内容" },
  pubDate: { label: "发布日期", inputType: "date", placeholder: "YYYY-MM-DD" },
  image: { label: "预览图", inputType: "text", placeholder: "图片 URL 或路径" },
  tags: { label: "标签", inputType: "tags", placeholder: "标签1, 标签2" },
  author: { label: "作者", inputType: "text", placeholder: "作者名" },
  draft: { label: "草稿", inputType: "text", placeholder: "true / false" },
  hero: { label: "封面图", inputType: "text", placeholder: "封面图 URL" },
};

/** Parse a frontmatter template into individual fields */
export function parseFrontmatterTemplate(template: string): FrontmatterField[] {
  // Extract the content between --- markers
  const trimmed = template.trim();
  let yamlContent: string;
  if (trimmed.startsWith("---")) {
    const endIdx = trimmed.indexOf("---", 3);
    yamlContent = endIdx === -1 ? trimmed.slice(3) : trimmed.slice(3, endIdx);
  } else {
    yamlContent = trimmed;
  }

  const lines = yamlContent.split("\n").map(l => l.trim()).filter(Boolean);

  return lines.map(line => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      // No colon - treat as comment/separator
      return {
        key: line,
        label: line,
        templateLine: line,
        hasVariable: false,
        staticValue: "",
        inputType: "text" as const,
        placeholder: "",
      };
    }

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    const meta = FIELD_META[key] ?? { label: key, inputType: "text" as const, placeholder: `输入 ${key}` };

    // Check for {variable} placeholder
    const varMatch = value.match(/\{(\w+)\}/);
    if (varMatch) {
      return {
        key,
        label: meta.label,
        templateLine: line,
        hasVariable: true,
        variable: varMatch[1],
        inputType: meta.inputType,
        placeholder: meta.placeholder,
      };
    }

    return {
      key,
      label: meta.label,
      templateLine: line,
      hasVariable: false,
      staticValue: value,
      inputType: meta.inputType,
      placeholder: meta.placeholder,
    };
  });
}

/** Build frontmatter from fields and user values, skipping disabled fields */
export function buildFrontmatterFromFields(
  fields: FrontmatterField[],
  values: Record<string, string>,
  enabled: Record<string, boolean>,
): string {
  const lines: string[] = ["---"];

  for (const field of fields) {
    if (!enabled[field.key]) continue; // Skip disabled fields

    if (field.hasVariable && field.variable) {
      const value = values[field.variable] ?? "";
      // Determine the YAML value format from the template line
      const templateValue = field.templateLine.slice(field.templateLine.indexOf(":") + 1).trim();
      if (templateValue.startsWith("'") && templateValue.endsWith("'")) {
        lines.push(`${field.key}: '${escapeYaml(value)}'`);
      } else {
        lines.push(`${field.key}: ${value || field.staticValue || ""}`);
      }
    } else if (field.hasVariable) {
      lines.push(field.templateLine);
    } else {
      // Static line - if user has provided a value, use it; otherwise use original
      const userValue = values[field.key];
      if (userValue !== undefined && userValue !== field.staticValue) {
        // Determine formatting
        if (field.staticValue?.startsWith("'")) {
          lines.push(`${field.key}: '${escapeYaml(userValue)}'`);
        } else {
          lines.push(`${field.key}: ${userValue}`);
        }
      } else {
        lines.push(field.templateLine);
      }
    }
  }

  lines.push("---");
  return lines.join("\n");
}

/**
 * 从文章内容中解析已有的 frontmatter，返回各字段值
 * 返回的 key 是 YAML 键名，值是字符串形式
 */
export function parseExistingFrontmatter(
  content: string,
): Record<string, string> | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return null;
  const idx = trimmed.indexOf("\n---", 3);
  if (idx === -1) return null;

  const yamlBlock = trimmed.slice(3, idx).trim();
  const result: Record<string, string> = {};
  const lines = yamlBlock.split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 从文章内容中提取标题：
 * 1. 优先从 frontmatter 的 title 字段取
 * 2. 其次从正文第一个 # 标题取
 * 3. 否则返回空字符串
 */
export function extractTitle(content: string): string {
  const fm = parseExistingFrontmatter(content);
  if (fm?.title && fm.title.trim()) {
    return fm.title.trim();
  }
  const stripped = stripExistingFrontmatter(content);
  const lines = stripped.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("# ")) {
      return t.slice(2).trim();
    }
    if (t && !t.startsWith("---")) break;
  }
  return "";
}
