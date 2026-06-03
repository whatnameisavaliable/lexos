"use client";

import dynamic from "next/dynamic";

export interface SopMonacoHtmlEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly readOnly?: boolean;
}

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <textarea
        className="min-h-[320px] w-full font-mono text-sm"
        readOnly
        aria-label="Monaco loading"
      />
    ),
  },
);

/** HTML 源码 Monaco 编辑器（客户端动态加载）。 */
export function SopMonacoHtmlEditor({
  value,
  onChange,
  readOnly = false,
}: SopMonacoHtmlEditorProps) {
  return (
    <MonacoEditor
      height="400px"
      language="html"
      value={value}
      options={{
        readOnly,
        minimap: { enabled: false },
        wordWrap: "on",
      }}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}
