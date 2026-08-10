// RichTextEditor 본문 이미지 노드뷰 — 우측 하단 핸들을 마우스로 드래그해 크기 조절, 이미지 자체를 드래그해
// 문서 내 위치를 이동할 수 있게 한다(@tiptap/extension-image 기본 노드뷰 대신 사용)
import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

const MIN_WIDTH_PX = 60;

export default function ResizableImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const width = (node.attrs as { width?: string }).width ?? "100%";

  // NodeViewWrapper가 임의 style prop을 항상 DOM에 그대로 반영한다는 보장이 없어, 폭은 ref를 통해 직접 커밋한다
  useEffect(() => {
    if (wrapperRef.current) wrapperRef.current.style.width = width;
  }, [width]);

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = wrapperRef.current;
    const container = wrapper?.parentElement;
    if (!wrapper || !container) return;

    const startX = e.clientX;
    const startWidthPx = wrapper.getBoundingClientRect().width;
    const containerWidthPx = container.getBoundingClientRect().width;
    setResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidthPx = Math.min(containerWidthPx, Math.max(MIN_WIDTH_PX, startWidthPx + (moveEvent.clientX - startX)));
      const pct = Math.round((newWidthPx / containerWidthPx) * 1000) / 10;
      updateAttributes({ width: `${pct}%` });
    };
    const onMouseUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={wrapperRef}
      draggable
      data-drag-handle
      className="relative my-2 inline-block cursor-move align-top"
      style={{ width }}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        className={`block h-auto w-full rounded-lg ${selected ? "outline outline-2 outline-primary" : ""}`}
      />
      {selected && (
        <span
          onMouseDown={onResizeStart}
          className={`absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow ${resizing ? "scale-125" : ""}`}
        />
      )}
    </NodeViewWrapper>
  );
}
