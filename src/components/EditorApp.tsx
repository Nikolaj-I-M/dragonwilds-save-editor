"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CharacterPanel from "@/components/CharacterPanel";
import Embers from "@/components/Embers";
import Hero from "@/components/Hero";
import InventoryPanel from "@/components/InventoryPanel";
import ItemBrowser from "@/components/ItemBrowser";
import ItemDetail from "@/components/ItemDetail";
import SaveVault from "@/components/SaveVault";
import SkillsPanel from "@/components/SkillsPanel";
import Toasts, { useToasts } from "@/components/Toasts";
import TooltipLayer from "@/components/Tooltip";
import Topbar from "@/components/Topbar";
import { detectLang, itemName, t } from "@/lib/i18n";
import {
  clearSlot as clearSlotIn,
  getCharName,
  getEndurance,
  getHealth,
  getHydration,
  getInventoryEntries,
  getSkillXp,
  getStamina,
  getSustenance,
  InvalidSaveError,
  parseSave,
  serializeSave,
  setCharName,
  setHealth,
  setHydration,
  setSlot,
  setSkillXp,
  setStamina,
  setSustenance,
  setEndurance,
} from "@/lib/save";
import { downloadText, pickSaveFile, writeToHandle } from "@/lib/files";
import {
  clearSession,
  clearVault,
  deleteVaultEntry,
  loadLang,
  loadRecents,
  loadVault,
  pushVaultEntry,
  rememberRecent,
  saveLang,
  type RecentSave,
  type VaultEntry,
  type VaultOrigin,
} from "@/lib/storage";
import type { CatalogItem, Lang, SaveData } from "@/lib/types";

export default function EditorApp() {
  const [lang, setLang] = useState<Lang>("pt-BR");
  const [data, setData] = useState<SaveData | null>(null);
  const [fileName, setFileName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [flashSlot, setFlashSlot] = useState<number | null>(null);
  const [recents, setRecents] = useState<RecentSave[]>([]);
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [localSaveName, setLocalSaveName] = useState<string | null>(null);

  const handleRef = useRef<FileSystemFileHandle | null>(null);
  const { toasts, push } = useToasts();

  const inventoryEntries = useMemo(
    () => (data ? getInventoryEntries(data) : {}),
    [data],
  );

  // ---- Boot: restaura idioma, recentes e backups do localStorage -----------

  useEffect(() => {
    // Explicit choice wins; otherwise follow the browser's language.
    const activeLang = loadLang() ?? detectLang();
    setLang(activeLang);
    document.documentElement.lang = activeLang;
    setRecents(loadRecents());
    setVault(loadVault());
    // A cached save can be older than the game file and overwrite earned XP.
    // Keep recents/backups, but always require loading the live save explicitly.
    clearSession();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Aviso ao fechar com alterações não salvas ---------------------------------

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (data && dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [data, dirty]);

  // ---- Abertura ---------------------------------------------------------------

  const confirmDiscard = useCallback(
    () => !data || !dirty || confirm(t(lang, "confirm_discard")),
    [data, dirty, lang],
  );

  const snapshot = useCallback(
    (name: string, charName: string, text: string, origin: VaultOrigin) => {
      if (pushVaultEntry({ fileName: name, charName, text, savedAt: Date.now(), origin })) {
        setVault(loadVault());
      }
    },
    [],
  );

  const openText = useCallback(
    (name: string, text: string, handle: FileSystemFileHandle | null) => {
      let parsed: SaveData;
      try {
        parsed = parseSave(text);
      } catch (err) {
        push(
          err instanceof InvalidSaveError ? t(lang, "toast_invalid_file") : String(err),
          "error",
        );
        return;
      }
      handleRef.current = handle;
      setData(parsed);
      setFileName(name);
      setOriginalText(text);
      setDirty(false);
      setSelectedSlot(null);
      const charName = getCharName(parsed);
      rememberRecent({ fileName: name, charName, text, savedAt: Date.now() });
      setRecents(loadRecents());
      snapshot(name, charName, text, "opened");
      push(t(lang, "toast_opened", { name: charName }), "success");
    },
    [lang, push, snapshot],
  );

  const handleOpen = useCallback(async () => {
    if (!confirmDiscard()) return;
    try {
      const listResponse = await fetch("/api/local-save");
      const list = (await listResponse.json()) as { saves?: string[]; error?: string };
      if (!listResponse.ok) throw new Error(list.error ?? "Could not access local character saves.");
      if (!list.saves?.length) throw new Error("No Dragonwilds character JSON files were found. Enter a world, exit cleanly, then try again.");
      const selected = list.saves.length === 1
        ? list.saves[0]
        : window.prompt(`Choose a character save:\n\n${list.saves.join("\n")}`, list.saves[0]);
      if (!selected || !list.saves.includes(selected)) return;
      const saveResponse = await fetch(`/api/local-save?name=${encodeURIComponent(selected)}`);
      const save = (await saveResponse.json()) as { name?: string; text?: string; error?: string };
      if (!saveResponse.ok || !save.name || typeof save.text !== "string") throw new Error(save.error ?? "Could not read character save.");
      openText(save.name, save.text, null);
      setLocalSaveName(save.name);
    } catch (err) {
      push(String(err), "error");
    }
  }, [confirmDiscard, openText, push]);

  const handleDropFile = useCallback(
    async (file: File) => {
      if (!confirmDiscard()) return;
      openText(file.name, await file.text(), null);
      setLocalSaveName(null);
    },
    [confirmDiscard, openText],
  );

  const handleLoadSample = useCallback(async () => {
    if (!confirmDiscard()) return;
    const response = await fetch("/examples/sample_character.json");
    openText("sample_character.json", await response.text(), null);
    setLocalSaveName(null);
  }, [confirmDiscard, openText]);

  const handleOpenRecent = useCallback(
    (recent: RecentSave) => {
      if (!confirmDiscard()) return;
      openText(recent.fileName, recent.text, null);
      setLocalSaveName(null);
    },
    [confirmDiscard, openText],
  );

  // ---- Gravação ------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!data) return;
    const text = serializeSave(data);
    if (localSaveName) {
      try {
        const response = await fetch("/api/local-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: localSaveName, text }),
        });
        const result = (await response.json()) as { ok?: boolean; backup?: string; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error ?? "Could not save character.");
        setDirty(false);
        setOriginalText(text);
        const charName = getCharName(data);
        rememberRecent({ fileName, charName, text, savedAt: Date.now() });
        setRecents(loadRecents());
        snapshot(fileName, charName, text, "saved");
        push(`Saved directly to Dragonwilds. Backup: ${result.backup}`, "success");
        return;
      } catch (err) {
        push(String(err), "error");
        return;
      }
    }
    let wroteInPlace = false;
    if (handleRef.current) {
      try {
        wroteInPlace = await writeToHandle(handleRef.current, text);
      } catch {
        wroteInPlace = false;
      }
    }
    if (!wroteInPlace) downloadText(fileName || "character.json", text);
    setDirty(false);
    const charName = getCharName(data);
    rememberRecent({ fileName, charName, text, savedAt: Date.now() });
    setRecents(loadRecents());
    snapshot(fileName, charName, text, "saved");
    push(
      t(lang, wroteInPlace ? "toast_saved_file" : "toast_saved_download"),
      "success",
    );
  }, [data, fileName, lang, localSaveName, push, snapshot]);

  const handleDownloadBackup = useCallback(() => {
    if (!originalText) return;
    downloadText(`${fileName || "character.json"}.bak`, originalText);
    push(t(lang, "toast_backup"));
  }, [originalText, fileName, lang, push]);

  // ---- Edições ----------------------------------------------------------------------

  const mutate = useCallback((next: SaveData) => {
    setData(next);
    setDirty(true);
  }, []);

  const handleAddItem = useCallback(
    (item: CatalogItem, count: number) => {
      if (!data || selectedSlot === null) return;
      mutate(setSlot(data, selectedSlot, item, count));
      setFlashSlot(selectedSlot);
      setTimeout(() => setFlashSlot(null), 550);
      push(
        t(lang, "toast_item_added", {
          item: itemName(lang, item),
          count,
          slot: selectedSlot,
        }),
        "success",
      );
    },
    [data, selectedSlot, mutate, lang, push],
  );

  const handleCtrlAddToBackpack = useCallback((item: CatalogItem) => {
    if (!data) return;
    const emptySlot = Array.from({ length: 24 }, (_, index) => index + 8)
      .find((slot) => !inventoryEntries[String(slot)]);
    if (emptySlot === undefined) {
      push(t(lang, "toast_backpack_full"), "error");
      return;
    }
    mutate(setSlot(data, emptySlot, item, item.max_stack));
    setSelectedSlot(emptySlot);
    setFlashSlot(emptySlot);
    setTimeout(() => setFlashSlot(null), 550);
    push(t(lang, "toast_item_added", {
      item: itemName(lang, item), count: item.max_stack, slot: emptySlot,
    }), "success");
  }, [data, inventoryEntries, lang, mutate, push]);

  const handleCtrlClearBackpackSlot = useCallback((slot: number) => {
    if (!data) return;
    mutate(clearSlotIn(data, slot));
    if (selectedSlot === slot) setSelectedSlot(null);
    push(t(lang, "toast_slot_cleared", { slot }));
  }, [data, lang, mutate, push, selectedSlot]);

  const handleClearSlot = useCallback(() => {
    if (!data || selectedSlot === null) return;
    mutate(clearSlotIn(data, selectedSlot));
    push(t(lang, "toast_slot_cleared", { slot: selectedSlot }));
  }, [data, selectedSlot, mutate, lang, push]);

  const handleApplyCharacter = useCallback(
    (changes: { name: string; health: number; stamina: number; sustenance: number; hydration: number; endurance: number }) => {
      if (!data) return;
      const renamed = changes.name !== getCharName(data);
      let next = setCharName(data, changes.name);
      next = setHealth(next, changes.health);
      next = setStamina(next, changes.stamina);
      next = setSustenance(next, changes.sustenance);
      next = setHydration(next, changes.hydration);
      next = setEndurance(next, changes.endurance);
      mutate(next);
      push(
        renamed
          ? t(lang, "toast_name_changed", { name: changes.name })
          : t(lang, "toast_attributes"),
        "success",
      );
    },
    [data, mutate, lang, push],
  );

  const handleApplySkills = useCallback((values: Record<string, number>) => {
    if (!data) return;
    if (Object.keys(values).length === 0) return;
    mutate(setSkillXp(data, values));
    push(t(lang, "toast_skills"), "success");
  }, [data, lang, mutate, push]);

  const handleFetchSection = useCallback(async (section: "inventory" | "character" | "skills") => {
    const sourceName = localSaveName ?? (fileName.endsWith(".json") ? fileName : null);
    if (!data || !sourceName) {
      push(t(lang, "toast_fetch_requires_local"), "error");
      return;
    }
    try {
      const response = await fetch(`/api/local-save?name=${encodeURIComponent(sourceName)}`);
      const result = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || typeof result.text !== "string") throw new Error(result.error ?? "Could not read character save.");
      const live = parseSave(result.text);
      const next = structuredClone(data);
      if (section === "inventory") {
        next.GameProgress.Inventory = structuredClone(live.GameProgress.Inventory);
      } else if (section === "character") {
        next.meta_data = structuredClone(live.meta_data);
        next.GameProgress.Character = structuredClone(live.GameProgress.Character);
      } else {
        next.GameProgress.Skills = structuredClone(live.GameProgress.Skills);
      }
      setData(next);
      setOriginalText(result.text);
      snapshot(fileName, getCharName(live), result.text, "opened");
      push(t(lang, "toast_fetched"), "success");
    } catch (error) {
      push(String(error), "error");
    }
  }, [data, fileName, lang, localSaveName, push, snapshot]);

  const handleLangChange = useCallback((next: Lang) => {
    setLang(next);
    saveLang(next);
    document.documentElement.lang = next;
  }, []);

  // ---- Backup vault -----------------------------------------------------------

  const handleRestore = useCallback(
    (entry: VaultEntry) => {
      if (!confirmDiscard()) return;
      let parsed: SaveData;
      try {
        parsed = parseSave(entry.text);
      } catch {
        push(t(lang, "toast_invalid_file"), "error");
        return;
      }
      handleRef.current = null;
      setLocalSaveName(null);
      setData(parsed);
      setFileName(entry.fileName);
      setOriginalText(entry.text);
      setDirty(true);
      setSelectedSlot(null);
      setVaultOpen(false);
      push(t(lang, "toast_restored", { name: getCharName(parsed) }), "success");
    },
    [confirmDiscard, lang, push],
  );

  const handleVaultDownload = useCallback((entry: VaultEntry) => {
    downloadText(entry.fileName || "character.json", entry.text);
  }, []);

  const handleVaultDelete = useCallback((entry: VaultEntry) => {
    deleteVaultEntry(entry.id);
    setVault(loadVault());
  }, []);

  const handleVaultClear = useCallback(() => {
    clearVault();
    setVault([]);
    push(t(lang, "toast_vault_cleared"));
  }, [lang, push]);

  // ---- Render -----------------------------------------------------------------------

  const loaded = data !== null;

  return (
    <>
      <Embers />
      <Topbar
        lang={lang}
        loaded={loaded}
        dirty={dirty}
        charName={loaded ? getCharName(data) : ""}
        fileName={fileName}
        onOpen={handleOpen}
        onSave={handleSave}
        onDownloadBackup={handleDownloadBackup}
        onOpenVault={() => setVaultOpen(true)}
        vaultCount={vault.length}
        onLangChange={handleLangChange}
      />

      {!loaded && hydrated && (
        <Hero
          lang={lang}
          recents={recents}
          onOpen={handleOpen}
          onLoadSample={handleLoadSample}
          onOpenRecent={handleOpenRecent}
          onDropFile={handleDropFile}
        />
      )}

      {loaded && (
        <main
          className="relative z-[2] mx-auto grid max-w-[1280px] grid-cols-1 gap-4 px-5 pt-4 pb-16 lg:grid-cols-[minmax(0,1fr)_360px]"
          style={{ animation: "fade-slide-in 0.5s ease both" }}
        >
          <InventoryPanel
            lang={lang}
            entries={inventoryEntries}
            selectedSlot={selectedSlot}
            flashSlot={flashSlot}
            onSelectSlot={setSelectedSlot}
            onCtrlClickBackpackSlot={handleCtrlClearBackpackSlot}
            onFetch={() => handleFetchSection("inventory")}
          />
          <aside className="flex min-w-0 flex-col gap-3.5">
            <ItemBrowser
              lang={lang}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onCtrlClickItem={handleCtrlAddToBackpack}
            />
            <ItemDetail
              lang={lang}
              item={selectedItem}
              selectedSlot={selectedSlot}
              canEdit={loaded}
              onAdd={handleAddItem}
              onClear={handleClearSlot}
            />
            <CharacterPanel
              lang={lang}
              charName={getCharName(data)}
              health={getHealth(data)}
              stamina={getStamina(data)}
              sustenance={getSustenance(data)}
              hydration={getHydration(data)}
              endurance={getEndurance(data)}
              onApply={handleApplyCharacter}
              onFetch={() => handleFetchSection("character")}
            />
            <SkillsPanel
              lang={lang}
              values={getSkillXp(data)}
              onApply={handleApplySkills}
              onFetch={() => handleFetchSection("skills")}
            />
          </aside>
        </main>
      )}

      {vaultOpen && (
        <SaveVault
          lang={lang}
          entries={vault}
          onClose={() => setVaultOpen(false)}
          onRestore={handleRestore}
          onDownload={handleVaultDownload}
          onDelete={handleVaultDelete}
          onClear={handleVaultClear}
        />
      )}

      <TooltipLayer />
      <Toasts toasts={toasts} />
    </>
  );
}
