import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const saveDirectory = path.join(
  process.env.LOCALAPPDATA ?? "",
  "RSDragonwilds",
  "Saved",
  "SaveCharacters",
);

export async function POST() {
  try {
    await fs.access(saveDirectory);
    execFile("explorer.exe", [saveDirectory], (error) => {
      if (error) console.error("Could not open Dragonwilds save folder:", error);
    });
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
