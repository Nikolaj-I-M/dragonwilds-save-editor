"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { RecentSave } from "@/lib/storage";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  recents: RecentSave[];
  onOpen: () => void;
  onLoadSample: () => void;
  onOpenRecent: (recent: RecentSave) => void;
  onDropFile: (file: File) => void;
}

export default function Hero({ lang, recents, onOpen, onLoadSample, onOpenRecent, onDropFile }: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <section
      className={`panel relative z-[2] mx-auto mt-[8vh] max-w-[540px] px-8 py-10 text-center transition-shadow ${dragOver ? "dropzone-over" : ""}`}
      style={{ animation: "fade-slide-in 0.6s ease both" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onDropFile(file);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/theme/dragon_visage.png"
        alt=""
        className="mx-auto h-[150px] w-[150px] object-contain"
        style={{
          animation:
            "dragon-breathe 4s ease-in-out infinite, icon-float 5s ease-in-out infinite",
        }}
      />
      <h2 className="text-gold-gradient mt-4 mb-2 font-display text-[26px] font-black tracking-[0.05em]">
        {t(lang, "no_save_title")}
      </h2>
      <p className="mb-5 leading-relaxed text-muted">{t(lang, "no_save_subtitle")}</p>

      <button className="btn btn-gold px-6 py-3 text-base" onClick={onOpen}>
        📂 {t(lang, "open_save")}
      </button>
      <p className="mt-3 text-[13px] text-muted-2">{t(lang, "drop_hint")}</p>

      <button className="chip mx-auto mt-4 block" onClick={onLoadSample}>
        🧪 {t(lang, "load_sample")}
      </button>

      {recents.length > 0 && (
        <div className="mt-8 text-left">
          <h3 className="border-b border-line-soft pb-1.5 font-display text-[13px] tracking-[0.12em] text-muted">
            {t(lang, "recent_files")}
          </h3>
          <ul className="m-0 list-none p-0">
            {recents.map((recent) => (
              <li key={recent.fileName}>
                <button
                  className="mt-1 w-full cursor-pointer overflow-hidden rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] text-ellipsis whitespace-nowrap text-muted transition-colors hover:border-line hover:bg-panel hover:text-ink"
                  title={recent.fileName}
                  onClick={() => onOpenRecent(recent)}
                >
                  <strong className="mr-2 font-semibold text-gold-bright">
                    {recent.charName}
                  </strong>
                  {recent.fileName} •{" "}
                  {new Date(recent.savedAt).toLocaleDateString(lang)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-7 text-[11.5px] tracking-[0.06em] text-muted-2">
        🔒 {t(lang, "privacy_note")}
      </p>
    </section>
  );
}
