"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** 进行中 TUS 上传种类（转写卷宗 vs SOP 卷宗）。 */
export type ActiveUploadKind = "transcription" | "sop";

/** 进行中的 TUS 上传状态（供路由 Guard · `ui_design.md` §6.3.4.2）。 */
export interface ActiveUploadState {
  readonly kind: ActiveUploadKind;
  readonly taskId: string | null;
  readonly fileName: string;
  readonly startedAt: number;
  readonly pipelineId?: string;
}

export type RegisterActiveUploadPartial = Pick<
  ActiveUploadState,
  "taskId" | "fileName" | "kind" | "pipelineId"
>;

/** 是否存在未完成上传（含 `kind=sop` 与转写）。 */
export function deriveHasActiveUpload(
  activeUpload: ActiveUploadState | null,
): boolean {
  return activeUpload !== null;
}

export interface ActiveUploadContextValue {
  readonly activeUpload: ActiveUploadState | null;
  /** 是否存在未完成的上传（含 init 后、complete 前）。 */
  readonly hasActiveUpload: boolean;
  /** 注册/更新进行中上传；M4-J 布局层挂载 Provider 后生效。 */
  registerUpload: (partial: RegisterActiveUploadPartial) => void;
  /** 由 `useTusUpload` 注册 TUS `abort` 回调（§6.3.4.3）。 */
  registerAbortHandler: (handler: (() => void) | null) => void;
  /** 用户确认离开页面时中止上传。 */
  abortActiveUpload: () => void;
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
  registerAbortHandler: () => undefined,
  abortActiveUpload: () => undefined,
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
  const abortHandlerRef = useRef<(() => void) | null>(null);

  const registerUpload = useCallback((partial: RegisterActiveUploadPartial) => {
    setActiveUpload({
      kind: partial.kind ?? "transcription",
      taskId: partial.taskId,
      fileName: partial.fileName,
      pipelineId: partial.pipelineId,
      startedAt: Date.now(),
    });
  }, []);

  const registerAbortHandler = useCallback((handler: (() => void) | null) => {
    abortHandlerRef.current = handler;
  }, []);

  const clearUpload = useCallback(() => {
    abortHandlerRef.current = null;
    setActiveUpload(null);
  }, []);

  const abortActiveUpload = useCallback(() => {
    abortHandlerRef.current?.();
    abortHandlerRef.current = null;
    setActiveUpload(null);
  }, []);

  const value = useMemo(
    (): ActiveUploadContextValue => ({
      activeUpload,
      hasActiveUpload: deriveHasActiveUpload(activeUpload),
      registerUpload,
      registerAbortHandler,
      abortActiveUpload,
      clearUpload,
    }),
    [
      activeUpload,
      registerUpload,
      registerAbortHandler,
      abortActiveUpload,
      clearUpload,
    ],
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
