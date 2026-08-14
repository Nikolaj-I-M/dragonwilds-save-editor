"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tooltip global desacoplado do estado do React: os elementos disparam
 * CustomEvents e só o componente TooltipLayer re-renderiza. O movimento do
 * mouse atualiza a posição direto no DOM (sem re-render nenhum).
 */

const SHOW = "dw-tip-show";
const MOVE = "dw-tip-move";
const HIDE = "dw-tip-hide";

interface TipDetail {
  x: number;
  y: number;
  title?: string;
  sub?: string;
}

/** Handlers de mouse para anexar em qualquer elemento com tooltip. */
export function tipHandlers(title: string, sub?: string) {
  return {
    onMouseEnter: (e: React.MouseEvent) =>
      window.dispatchEvent(
        new CustomEvent<TipDetail>(SHOW, { detail: { x: e.clientX, y: e.clientY, title, sub } }),
      ),
    onMouseMove: (e: React.MouseEvent) =>
      window.dispatchEvent(
        new CustomEvent<TipDetail>(MOVE, { detail: { x: e.clientX, y: e.clientY } }),
      ),
    onMouseLeave: () => window.dispatchEvent(new CustomEvent(HIDE)),
  };
}

export default function TooltipLayer() {
  const [content, setContent] = useState<{ title: string; sub?: string } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const place = (x: number, y: number) => {
      const box = boxRef.current;
      if (!box) return;
      box.style.left = `${Math.min(x + 14, window.innerWidth - 270)}px`;
      box.style.top = `${y + 14}px`;
    };
    const onShow = (e: Event) => {
      const { x, y, title, sub } = (e as CustomEvent<TipDetail>).detail;
      setContent({ title: title ?? "", sub });
      requestAnimationFrame(() => place(x, y));
    };
    const onMove = (e: Event) => {
      const { x, y } = (e as CustomEvent<TipDetail>).detail;
      place(x, y);
    };
    const onHide = () => setContent(null);

    window.addEventListener(SHOW, onShow);
    window.addEventListener(MOVE, onMove);
    window.addEventListener(HIDE, onHide);
    return () => {
      window.removeEventListener(SHOW, onShow);
      window.removeEventListener(MOVE, onMove);
      window.removeEventListener(HIDE, onHide);
    };
  }, []);

  if (!content) return null;
  return (
    <div ref={boxRef} className="tooltip-box" style={{ left: -9999, top: -9999 }}>
      <div className="font-bold text-gold-bright">{content.title}</div>
      {content.sub && <div className="text-[11.5px] text-muted-2">{content.sub}</div>}
    </div>
  );
}
