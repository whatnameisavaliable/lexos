"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** 进行中的 TUS 上传状态（供路由 Guard · `ui_design.md` §6.3.4.2）。 */
export interface ActiveUploadState {
  readonly taskId: string | null;
  readonly fileName: string;
  readonly startedAt: number;
}

export interface ActiveUploadContextValue {
  readonly activeUpload: ActiveUploadState | null;
  /** 是否存在未完成的上传（含 init 后、complete 前）。 */
  readonly hasActiveUpload: boolean;
  /** 注册/更新进行中上传；M4-J 布局层挂载 Provider 后生效。 */
  registerUpload: (partial: Pick<ActiveUploadState, "taskId" | "fileName">) => void;
  /** 上传结束或用户取消后清除。 */
  clearUpload: () => void;
}

const ActiveUploadContext = createContext<ActiveUploadContextValue | null>(
  null,
);

const noopActiveUpload: ActiveUploadContextValue = {
  activeUpload: null,
  hasActiveUpload: false,
  registerUpload: () => undefined,
  clearUpload: () => undefined,
};

/**
 * 全局进行中上传状态 Provider（M4-J 挂载于 AppShell / `(app)/layout`）。
 */
export function ActiveUploadProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [activeUpload, setActiveUpload] = useState<ActiveUploadState | null>(
    null,
  );

  const registerUpload = useCallback(
    (partial: Pick<ActiveUploadState, "taskId" | "fileName">) => {
      setActiveUpload({
        taskId: partial.taskId,
        fileName: partial.fileName,
        startedAt: Date.now(),
      });
    },
    [],
  );

  const clearUpload = useCallback(() => {
    setActiveUpload(null);
  }, []);

  const value = useMemo(
    (): ActiveUploadContextValue => ({
      activeUpload,
      hasActiveUpload: activeUpload !== null,
      registerUpload,
      clearUpload,
    }),
    [activeUpload, registerUpload, clearUpload],
  );

  return (
    <ActiveUploadContext.Provider value={value}>
      {children}
    </ActiveUploadContext.Provider>
  );
}

/**
 * 读取进行中上传上下文；Provider 未挂载时返回 no-op（便于 M4-I Hook 单测与渐进集成）。
 */
export function useActiveUpload(): ActiveUploadContextValue {
  return useContext(ActiveUploadContext) ?? noopActiveUpload;
}
