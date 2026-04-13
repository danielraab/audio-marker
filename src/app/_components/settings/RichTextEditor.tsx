"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@heroui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({
  content,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none border border-default-200 rounded-lg",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 border border-default-200 rounded-lg p-2 bg-default-50">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("underline") ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={18} />
        </Button>

        <div className="w-px h-8 bg-default-300 mx-1" />

        <Button
          size="sm"
          variant={editor.isActive("heading", { level: 1 }) ? "flat" : "light"}
          isIconOnly
          onPress={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "flat" : "light"}
          isIconOnly
          onPress={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </Button>

        <div className="w-px h-8 bg-default-300 mx-1" />

        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("orderedList") ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </Button>

        <div className="w-px h-8 bg-default-300 mx-1" />

        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "left" }) ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "center" }) ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={18} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "right" }) ? "flat" : "light"}
          isIconOnly
          onPress={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={18} />
        </Button>

        <div className="w-px h-8 bg-default-300 mx-1" />

        <Button
          size="sm"
          variant={editor.isActive("link") ? "flat" : "light"}
          isIconOnly
          onPress={setLink}
        >
          <Link2 size={18} />
        </Button>

        <div className="w-px h-8 bg-default-300 mx-1" />

        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={() => editor.chain().focus().undo().run()}
          isDisabled={!editor.can().undo()}
        >
          <Undo size={18} />
        </Button>
        <Button
          size="sm"
          variant="light"
          isIconOnly
          onPress={() => editor.chain().focus().redo().run()}
          isDisabled={!editor.can().redo()}
        >
          <Redo size={18} />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
