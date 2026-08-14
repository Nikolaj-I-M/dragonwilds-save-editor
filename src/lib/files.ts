/**
 * Abertura e gravação de arquivos no navegador.
 *
 * Quando o navegador suporta a File System Access API (Chrome/Edge), o save
 * é gravado direto no arquivo original. Caso contrário, cai no download.
 */

export interface OpenedFile {
  name: string;
  text: string;
  handle: FileSystemFileHandle | null;
}

interface PickerWindow extends Window {
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>;
}

export function supportsFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

/** Abre via File System Access API (com handle) ou <input type=file> (sem). */
export async function pickSaveFile(): Promise<OpenedFile | null> {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await (window as PickerWindow).showOpenFilePicker!({
        types: [{ description: "Save JSON", accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      return { name: file.name, text: await file.text(), handle };
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return null;
      throw err;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? { name: file.name, text: await file.text(), handle: null } : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Grava no arquivo original; retorna false se só o download for possível. */
export async function writeToHandle(
  handle: FileSystemFileHandle,
  text: string,
): Promise<boolean> {
  const permission = await (
    handle as FileSystemFileHandle & {
      requestPermission?: (options: { mode: string }) => Promise<PermissionState>;
    }
  ).requestPermission?.({ mode: "readwrite" });
  if (permission && permission !== "granted") return false;
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return true;
}

export function downloadText(fileName: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
