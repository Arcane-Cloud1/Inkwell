// 防抖自动保存草稿
import { useEffect, useRef } from "react";

export function useDebouncedSave(
  enabled: boolean,
  delay: number,
  saver: () => Promise<void> | void,
  // 触发保存的依赖（内容/标题变化）
  deps: unknown[],
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saver();
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
