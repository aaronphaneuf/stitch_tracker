import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { createLowlight } from "lowlight";
const lowlight = createLowlight();

function Btn({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      className={`btn btn-xs ${active ? "btn-primary" : "btn-ghost"}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export default function PatternEditor({
  value = "",
  onChange = () => {},
  placeholder = "Write your pattern here…",
  className = "",
}) {
  const editor = useEditor({
    content: value || "",
    extensions: [
      StarterKit.configure({ link: false, codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose max-w-none prose-sm dark:prose-invert focus:outline-none p-3 rounded-lg bg-base-100",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value != null && value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const isActive = (name, attrs = {}) => editor.isActive(name, attrs);
  const setLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const unsetLink = () => editor.chain().focus().unsetLink().run();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-1">
        <Btn active={isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">B</Btn>
        <Btn active={isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)"><i>I</i></Btn>
        <Btn active={isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">S</Btn>
        <span className="divider divider-horizontal mx-1" />
        <Btn active={isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">H2</Btn>
        <Btn active={isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">H3</Btn>
        <Btn active={isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list">• • •</Btn>
        <Btn active={isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</Btn>
        <Btn active={isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">“”</Btn>
        <Btn active={isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">{`</>`}</Btn>
        <span className="divider divider-horizontal mx-1" />
        <Btn active={isActive("link")} onClick={setLink} title="Set link">🔗</Btn>
        <Btn active={false} onClick={unsetLink} title="Remove link">❌</Btn>
        <span className="divider divider-horizontal mx-1" />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">↶</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">↷</Btn>
      </div>

      <div className="rounded-lg border border-base-300">
        <EditorContent editor={editor} />
      </div>

      <p className="text-xs opacity-60">
        Tip: You can paste from the web; use code blocks for chart-like text.
      </p>
    </div>
  );
}

