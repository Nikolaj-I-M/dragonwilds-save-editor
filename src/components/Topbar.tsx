"use client";

import { LANGS, t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface Props {
  lang: Lang;
  loaded: boolean;
  dirty: boolean;
  charName: string;
  fileName: string;
  onOpen: () => void;
  onOpenSaveFolder: () => void;
  onSave: () => void;
  onDownloadBackup: () => void;
  onOpenVault: () => void;
  vaultCount: number;
  onLangChange: (lang: Lang) => void;
}

export default function Topbar({
  lang, loaded, dirty, charName, fileName, onOpen, onOpenSaveFolder, onSave, onDownloadBackup,
  onOpenVault, vaultCount, onLangChange,
}: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line-soft bg-gradient-to-b from-[#141a29ee] to-[#10141fdd] px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/theme/dragon_visage.png"
          alt=""
          className="h-11 w-11 object-contain"
          style={{ animation: "dragon-breathe 5s ease-in-out infinite" }}
        />
        <div>
          <h1 className="text-gold-gradient font-display text-[19px] font-bold tracking-[0.06em]">
            {t(lang, "app_title")}
          </h1>
          <span className="text-[11px] tracking-[0.32em] text-muted-2 uppercase">
            RuneScape: Dragonwilds
          </span>
        </div>
      </div>

      {loaded && (
        <div
          className="flex flex-col rounded-[10px] border border-line bg-panel px-4 py-1"
          style={{ animation: "fade-slide-in 0.45s ease both" }}
        >
          <span className="font-display font-bold text-gold-bright">{charName}</span>
          <span className="text-[11.5px] text-muted-2">{fileName}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2.5">
        <button className="btn hidden lg:inline-flex" onClick={onOpenSaveFolder}>
          📁 {t(lang, "open_save_folder")}
        </button>
        {loaded && dirty && <span className="dirty-dot" title={t(lang, "unsaved_changes")} />}
        <button
          className="btn relative !px-3"
          title={t(lang, "vault_open")}
          onClick={onOpenVault}
        >
          🗄️
          {vaultCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] rounded-full border border-gold-dim bg-panel px-1 text-[10px] leading-[16px] font-bold text-gold-bright">
              {vaultCount}
            </span>
          )}
        </button>
        {loaded && (
          <button
            className="btn !px-3"
            title={t(lang, "download_backup")}
            onClick={onDownloadBackup}
          >
            🛟
          </button>
        )}
        <button className="btn" onClick={onOpen}>
          📂 {t(lang, "open_save")}
        </button>
        <button className="btn btn-gold" disabled={!loaded} onClick={onSave}>
          💾 {t(lang, "write_save")}
        </button>
        <select
          className="field cursor-pointer"
          aria-label={t(lang, "language")}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {code === "pt-BR" ? "PT-BR" : "EN"}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
