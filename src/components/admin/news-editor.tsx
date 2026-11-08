"use client";

import { useCallback, useRef, useState } from "react";
import {
  useEditor,
  EditorContent,
} from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  Undo2,
  Redo2,
  Loader2,
  Quote,
  Code,
  Minus,
} from "lucide-react";

type NewsEditorProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
        active
          ? "bg-[#17472D] text-white"
          : "text-[#526253] hover:bg-[#edf2eb]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export default function NewsEditor({
  value,
  onChange,
  disabled = false,
}: NewsEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-[#17472D] underline",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "my-5 max-h-[480px] w-full rounded-xl object-cover",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your agricultural news article...",
      }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[350px] px-5 py-5 !text-[#243328] focus:outline-none prose-headings:text-[#17472D] prose-a:text-[#17472D] prose-img:rounded-xl",
      },
    },
  });

  const addLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter the link URL:", previousUrl || "https://");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: parsedUrl.toString() })
        .run();
    } catch {
      window.alert("Please enter a valid HTTP or HTTPS URL.");
    }
  }, [editor]);

  const uploadImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file || !editor) return;

      setUploadError("");

      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Images must be 10 MB or smaller.");
        event.target.value = "";
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ];

      if (!allowedTypes.includes(file.type)) {
        setUploadError("Use a JPG, PNG, WebP or AVIF image.");
        event.target.value = "";
        return;
      }

      setUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/news/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.image?.url) {
          if (response.status === 401) {
            window.location.href = "/admin/login";
            return;
          }

          throw new Error(data.message || "Image upload failed.");
        }

        editor
          .chain()
          .focus()
          .setImage({ src: data.image.url, alt: file.name })
          .run();
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Unable to upload image."
        );
      } finally {
        setUploadingImage(false);

        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-xl border border-[#e5e9e1] bg-white">
        <span className="text-sm text-[#899487]">
          Loading editor...
        </span>
      </div>
    );
  }

  const toolbarGroups: {
    label: string;
    buttons: React.ReactNode[];
  }[] = [
    {
      label: "Text formatting",
      buttons: [
        <ToolbarButton
          key="bold"
          label="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </ToolbarButton>,
        <ToolbarButton
          key="italic"
          label="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </ToolbarButton>,
        <ToolbarButton
          key="underline"
          label="Underline"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={17} />
        </ToolbarButton>,
      ],
    },
    {
      label: "Headings",
      buttons: [
        <ToolbarButton
          key="h1"
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={18} />
        </ToolbarButton>,
        <ToolbarButton
          key="h2"
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </ToolbarButton>,
      ],
    },
    {
      label: "Lists",
      buttons: [
        <ToolbarButton
          key="bullet"
          label="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolbarButton>,
        <ToolbarButton
          key="ordered"
          label="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolbarButton>,
        <ToolbarButton
          key="quote"
          label="Blockquote"
          active={editor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={17} />
        </ToolbarButton>,
      ],
    },
    {
      label: "Insert",
      buttons: [
        <ToolbarButton
          key="link"
          label="Insert link"
          active={editor.isActive("link")}
          disabled={disabled}
          onClick={addLink}
        >
          <LinkIcon size={17} />
        </ToolbarButton>,
        <ToolbarButton
          key="image"
          label="Insert image"
          disabled={disabled || uploadingImage}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploadingImage ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <ImagePlus size={17} />
          )}
        </ToolbarButton>,
        <ToolbarButton
          key="code"
          label="Code block"
          active={editor.isActive("codeBlock")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={17} />
        </ToolbarButton>,
        <ToolbarButton
          key="divider"
          label="Horizontal divider"
          disabled={disabled}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={17} />
        </ToolbarButton>,
      ],
    },
    {
      label: "History",
      buttons: [
        <ToolbarButton
          key="undo"
          label="Undo"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </ToolbarButton>,
        <ToolbarButton
          key="redo"
          label="Redo"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </ToolbarButton>,
      ],
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe6dc] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e5e9e1] bg-[#fafbf9] p-2">
        {toolbarGroups.map((group, index) => (
          <div
            key={group.label}
            className={`flex flex-wrap items-center gap-1 ${
              index > 0 ? "border-l border-[#e5e9e1] pl-2" : ""
            }`}
          >
            {group.buttons}
          </div>
        ))}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={uploadImage}
      />

      {uploadError && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t border-[#e5e9e1] bg-[#fafbf9] px-4 py-3">
        <span className="text-xs text-[#899487]">
          {uploadingImage ? "Uploading image..." : "Rich text editor"}
        </span>

        <span className="text-xs text-[#899487]">
          {editor.storage.characterCount?.characters?.() ?? 
            editor.getText().length} characters
        </span>
      </div>
    </div>
  );
}