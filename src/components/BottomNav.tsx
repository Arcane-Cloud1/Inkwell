// 底部主导航
import { NavLink } from "react-router-dom";
import { PenLine, FolderOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "写作台", icon: PenLine, end: true },
  { to: "/files", label: "文件", icon: FolderOpen, end: false },
  { to: "/settings", label: "设置", icon: Settings, end: false },
];

export default function BottomNav() {
  return (
    <nav
      className="shrink-0 border-t border-amber-300/10 bg-ink-900/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group relative flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
                isActive ? "text-amber-300" : "text-paper-dim hover:text-paper-muted",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "absolute top-0 h-[2px] w-8 rounded-full bg-amber-300 transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className="h-5 w-5 transition-transform group-active:scale-90"
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
