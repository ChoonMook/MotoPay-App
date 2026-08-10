// Tiptap 기반 HTML 리치텍스트 에디터 — 상품설명(AD-CTLG-05) 등 HTML 편집이 필요한 입력 필드에서 공용으로 사용
import { useEffect, useState } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import ResizableImageNodeView from "./ResizableImageNodeView";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { uploadContentImage } from "../api/uploads";
import { API_BASE_URL } from "../api/config";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const toolbarButtonClass =
  "rounded-md p-1.5 text-on-surface-variant transition-all hover:bg-surface-container-high data-[active=true]:bg-primary/10 data-[active=true]:text-primary disabled:cursor-not-allowed disabled:opacity-40";

const HEADING_OPTIONS = [
  { level: 0, label: "본문" },
  { level: 1, label: "제목 1" },
  { level: 2, label: "제목 2" },
  { level: 3, label: "제목 3" },
  { level: 4, label: "제목 4" },
] as const;

const HIGHLIGHT_COLORS = [
  { color: "#fef08a", label: "노랑" },
  { color: "#bbf7d0", label: "초록" },
  { color: "#bfdbfe", label: "파랑" },
  { color: "#fbcfe8", label: "분홍" },
  { color: "#fecaca", label: "빨강" },
];

// 기본 Image 확장에는 크기 조절 속성/UI가 없어, width 속성 + 커스텀 노드뷰(드래그로 크기 조절·위치 이동)를 추가해 확장
const ResizableImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes: { width?: string }) => ({
          style: `width: ${attributes.width ?? "100%"}; height: auto;`,
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_JPEG_QUALITY = 0.82;

// 폰 카메라 원본을 그대로 base64로 올리면 요청이 너무 커지므로, 캔버스로 긴 변 기준 축소 + JPEG 압축
function resizeImageToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리하지 못했습니다"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽지 못했습니다"));
    };
    img.src = objectUrl;
  });
}

// 본문에 삽입된 이미지는 다른 imagePath 필드들과 동일하게 "content-images/<uuid>.<ext>" 상대경로만
// 저장한다(호스트가 바뀌어도 저장된 HTML이 깨지지 않도록). 에디터 안에서 실제로 그림을 띄우려면 브라우저가
// 바로 요청할 수 있는 절대 URL이 필요하므로, 편집 중(라이브 DOM)에는 절대 URL을 쓰고 onChange로 값을
// 내보내기 직전(dehydrate)/외부 value를 불러올 때(hydrate) 경계에서만 서로 변환한다
const CONTENT_IMAGE_REL_PREFIX = "content-images/";
const CONTENT_IMAGE_ABS_PREFIX = `${API_BASE_URL}/uploads/${CONTENT_IMAGE_REL_PREFIX}`;

function hydrateContentImageSrcs(html: string): string {
  return html.replaceAll(`src="${CONTENT_IMAGE_REL_PREFIX}`, `src="${CONTENT_IMAGE_ABS_PREFIX}`);
}
function dehydrateContentImageSrcs(html: string): string {
  return html.replaceAll(`src="${CONTENT_IMAGE_ABS_PREFIX}`, `src="${CONTENT_IMAGE_REL_PREFIX}`);
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage,
    ],
    content: hydrateContentImageSrcs(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(dehydrateContentImageSrcs(editor.getHTML())),
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] px-3 py-2 text-xs leading-relaxed focus:outline-none [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-xs [&_h3]:font-bold [&_h4]:mt-2 [&_h4]:text-xs [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-outline-variant [&_blockquote]:pl-3 [&_blockquote]:text-on-surface-variant [&_a]:text-primary [&_a]:underline [&_mark]:rounded [&_mark]:px-0.5",
      },
    },
  });

  // 등록/수정 팝업이 다른 상품으로 재오픈되는 등 외부에서 value가 바뀌었을 때 에디터 내용을 동기화
  useEffect(() => {
    if (!editor) return;
    if (dehydrateContentImageSrcs(editor.getHTML()) === value) return;
    editor.commands.setContent(hydrateContentImageSrcs(value || ""), { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("링크 URL을 입력하세요");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      const { path } = await uploadContentImage(dataUri);
      editor.chain().focus().setImage({ src: `${API_BASE_URL}/uploads/${path}` }).run();
    } catch {
      window.alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[#ced4da] bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-outline-variant/60 bg-surface-container-low px-2 py-1.5">
        <select
          value={String(HEADING_OPTIONS.find((o) => o.level !== 0 && editor.isActive("heading", { level: o.level }))?.level ?? 0)}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run();
            }
          }}
          className="rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[11px] font-semibold text-on-surface-variant outline-none transition-all hover:bg-surface-container-high focus:border-primary"
        >
          {HEADING_OPTIONS.map((o) => (
            <option key={o.level} value={o.level}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="mx-1 h-4 w-px bg-outline-variant/60" />
        <button type="button" data-active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarButtonClass}>
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarButtonClass}>
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} className={toolbarButtonClass}>
          <Strikethrough className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolbarButtonClass}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            type="button"
            data-active={editor.isActive("highlight")}
            onClick={() => setShowHighlightMenu((v) => !v)}
            className={toolbarButtonClass}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </button>
          {showHighlightMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHighlightMenu(false)} />
              <div className="absolute top-full left-0 z-20 mt-1 flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-white p-1.5 shadow-lg">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: c.color }).run();
                      setShowHighlightMenu(false);
                    }}
                    className="h-5 w-5 rounded-full border border-outline-variant/40"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightMenu(false);
                  }}
                  className="ml-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-red-500"
                >
                  제거
                </button>
              </div>
            </>
          )}
        </div>
        <span className="mx-1 h-4 w-px bg-outline-variant/60" />
        <button type="button" data-active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarButtonClass}>
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarButtonClass}>
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolbarButtonClass}>
          <Quote className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-outline-variant/60" />
        <button type="button" data-active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} className={toolbarButtonClass}>
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} className={toolbarButtonClass}>
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} className={toolbarButtonClass}>
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" data-active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={toolbarButtonClass}>
          <AlignJustify className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-outline-variant/60" />
        <button type="button" data-active={editor.isActive("link")} onClick={toggleLink} className={toolbarButtonClass}>
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
        <label className={`cursor-pointer ${toolbarButtonClass}`}>
          <ImagePlus className="h-3.5 w-3.5" />
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImageFileSelected} disabled={uploadingImage} />
        </label>
        <span className="mx-1 h-4 w-px bg-outline-variant/60" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={toolbarButtonClass}>
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={toolbarButtonClass}>
          <Redo className="h-3.5 w-3.5" />
        </button>
        {uploadingImage && <span className="ml-1 text-[10px] font-semibold text-on-surface-variant">이미지 업로드 중...</span>}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
