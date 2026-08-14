"use client";

import { useCallback, useRef, useState } from "react";

export interface Toast {
  id: number;
  message: string;
  type?: "success" | "error";
  sub?: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, type?: Toast["type"], sub?: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, type, sub }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4500);
  }, []);

  return { toasts, push };
}

export default function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type ?? ""}`}>
          {toast.message}
          {toast.sub && <small className="mt-0.5 block text-muted-2">{toast.sub}</small>}
        </div>
      ))}
    </div>
  );
}
