import { promises as fs } from "node:fs";
import path from "node:path";

const saveDirectory = path.join(
  process.env.LOCALAPPDATA ?? "",
  "RSDragonwilds",
  "Saved",
  "SaveCharacters",
);

function safeName(value: unknown): string | null {
  if (typeof value !== "string" || !value.endsWith(".json")) return null;
  return path.basename(value) === value ? value : null;
}

function backupName(name: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${name}.backup-${stamp}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const name = safeName(url.searchParams.get("name"));
    if (!name) {
      const entries = await fs.readdir(saveDirectory, { withFileTypes: true });
      const saves = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
      return Response.json({ saves });
    }

    const text = await fs.readFile(path.join(saveDirectory, name), "utf8");
    return Response.json({ name, text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") throw new Error("Invalid request body.");
    const { name, text } = body as { name?: unknown; text?: unknown };
    const fileName = safeName(name);
    if (!fileName || typeof text !== "string") throw new Error("Invalid save data.");

    const target = path.join(saveDirectory, fileName);
    await fs.access(target);
    const backup = path.join(saveDirectory, backupName(fileName));
    await fs.copyFile(target, backup);
    await fs.writeFile(target, text, "utf8");
    return Response.json({ ok: true, backup: path.basename(backup) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
