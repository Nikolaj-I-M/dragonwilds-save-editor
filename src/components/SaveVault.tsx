"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n";
import type { VaultEntry } from "@/lib/storage";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  entries: VaultEntry[];
  onClose: () => void;
  onRestore: (entry: VaultEntry) => void;
  onDownload: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
  onClear: () => void;
}

function timeAgo(lang: Lang, timestamp: number): string {
  return new Date(timestamp).toLocaleString(lang, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function SaveVault({
  lang, entries, onClose, onRestore, onDownload, onDelete, onClear,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      style={{ animation: "fade-slide-in 0.2s ease both" }}
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-[640px]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fade-slide-in 0.3s ease both" }}
      >
        <div className="mb-1 flex items-center gap-3">
          <h2 className="font-display text-[18px] font-bold tracking-[0.06em] text-gold-bright">
            🗄️ {t(lang, "vault_title")}
          </h2>
          <span className="text-[12px] text-muted-2">
            {t(lang, "vault_count", { n: entries.length })}
          </span>
          <button className="btn !ml-auto !px-3 !py-1.5 text-[13px]" onClick={onClose}>
            ✕ {t(lang, "close")}
          </button>
        </div>
        <p className="mb-3 text-[13px] text-muted">{t(lang, "vault_subtitle")}</p>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-line-soft bg-[#0d111c88] px-4 py-8 text-center text-[13.5px] text-muted-2">
            {t(lang, "vault_empty")}
          </p>
        ) : (
          <>
            <ul className="m-0 flex max-h-[52vh] list-none flex-col gap-2 overflow-y-auto p-0.5">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-line-soft bg-[#0d111c88] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="truncate font-display text-[14.5px] text-gold-bright">
                        {entry.charName}
                      </strong>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] tracking-wide uppercase ${
                          entry.origin === "saved"
                            ? "border-stamina/40 text-stamina"
                            : "border-line text-muted-2"
                        }`}
                      >
                        {t(lang, `vault_origin_${entry.origin}`)}
                      </span>
                    </div>
                    <div className="truncate text-[12px] text-muted-2">
                      {entry.fileName} • {timeAgo(lang, entry.savedAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      className="btn btn-gold !px-3 !py-1.5 text-[12.5px]"
                      onClick={() => onRestore(entry)}
                    >
                      ↺ {t(lang, "vault_restore")}
                    </button>
                    <button
                      className="btn !px-2.5 !py-1.5 text-[12.5px]"
                      title={t(lang, "vault_download")}
                      onClick={() => onDownload(entry)}
                    >
                      ⬇
                    </button>
                    <button
                      className="btn btn-danger !px-2.5 !py-1.5 text-[12.5px]"
                      title={t(lang, "vault_delete")}
                      onClick={() => onDelete(entry)}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="btn btn-danger mt-3 w-full"
              onClick={() => confirm(t(lang, "vault_clear_confirm")) && onClear()}
            >
              🧹 {t(lang, "vault_clear")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
