"use client";

import { useEffect, useState } from "react";

export const DEFAULT_DEBOUNCE_MS = 500;

/**
 * 将 `value` 防抖为 `debouncedValue`（Monaco → iframe 预览等场景）。
 */
export function useDebouncedValue<T>(value: T, delayMs = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * 调度防抖更新（供单测 fake timers 使用）。
 */
export function scheduleDebouncedUpdate<T>(
  value: T,
  delayMs: number,
  onUpdate: (next: T) => void,
): () => void {
  const timer = setTimeout(() => onUpdate(value), delayMs);
  return () => clearTimeout(timer);
}
