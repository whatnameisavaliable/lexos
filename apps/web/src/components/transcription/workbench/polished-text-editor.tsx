"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export interface PolishedTextEditorProps {
  readonly value: string;
  readonly onChange: (html: string) => void;
  readonly disabled?: boolean;
}

/** 编辑模式富文本（仅绑定 `polished_text` · TipTap + Tailwind）。 */
export function PolishedTextEditor({
  value,
  onChange,
  disabled = false,
}: PolishedTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-md border border-border bg-background px-3 py-2 text-sm leading-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring prose prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}
