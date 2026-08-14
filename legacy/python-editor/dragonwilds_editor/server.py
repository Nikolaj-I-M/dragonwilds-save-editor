"""Local HTTP server: serves the web UI and a small JSON API.

Standard library only — no external dependencies. The server binds to
127.0.0.1 and is meant for a single local user.
"""

from __future__ import annotations

import json
import subprocess
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import config
from .core import Catalog, SaveManager
from .core.save_manager import InvalidSaveError

_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Recent files
# ---------------------------------------------------------------------------

def load_recents() -> list[str]:
    try:
        paths = json.loads(config.RECENTS_FILE.read_text(encoding="utf-8"))
        return [p for p in paths if Path(p).exists()]
    except (OSError, json.JSONDecodeError):
        return []


def remember_recent(path: Path) -> None:
    recents = [str(path)] + [p for p in load_recents() if p != str(path)]
    config.USER_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    config.RECENTS_FILE.write_text(
        json.dumps(recents[: config.MAX_RECENTS], indent=1), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Native file dialog (run in a subprocess so tkinter gets its own main thread)
# ---------------------------------------------------------------------------

_DIALOG_SNIPPET = """
import tkinter as tk
from tkinter import filedialog
root = tk.Tk()
root.withdraw()
root.call("wm", "attributes", ".", "-topmost", "1")
print(filedialog.askopenfilename(
    title="Abrir save de personagem",
    filetypes=[("Save JSON", "*.json"), ("Todos os arquivos", "*.*")],
))
"""


def ask_open_filename() -> str:
    result = subprocess.run(
        [sys.executable, "-c", _DIALOG_SNIPPET],
        capture_output=True,
        text=True,
        timeout=300,
    )
    return result.stdout.strip()


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status


class EditorRequestHandler(SimpleHTTPRequestHandler):
    """Static files from ``web/`` plus the ``/api/*`` JSON endpoints."""

    catalog: Catalog
    save: SaveManager

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, directory=str(config.WEB_DIR), **kwargs)

    def log_message(self, fmt: str, *args) -> None:  # quieter default log
        if "/api/" in (args[0] if args else ""):
            super().log_message(fmt, *args)

    # ---- Routing -------------------------------------------------------------

    def do_GET(self) -> None:
        route = self.path.split("?", 1)[0]
        if not route.startswith("/api/"):
            super().do_GET()
            return
        try:
            payload = self._handle_get(route)
        except ApiError as err:
            self._send_json({"error": str(err)}, err.status)
        else:
            self._send_json(payload)

    def do_POST(self) -> None:
        route = self.path.split("?", 1)[0]
        try:
            with _lock:
                payload = self._handle_post(route, self._read_body())
        except ApiError as err:
            self._send_json({"error": str(err)}, err.status)
        except Exception as err:  # surface unexpected errors to the UI
            self._send_json({"error": f"{type(err).__name__}: {err}"}, 500)
        else:
            self._send_json(payload)

    # ---- GET endpoints ----------------------------------------------------------

    def _handle_get(self, route: str) -> dict:
        if route == "/api/catalog":
            payload = self.catalog.as_payload()
            payload["sections"] = [
                {"key": key, "start": start, "end": end, "columns": columns}
                for key, start, end, columns in config.SECTIONS
            ]
            return payload
        if route == "/api/state":
            return self.save.state()
        if route == "/api/recents":
            return {"recents": load_recents()}
        raise ApiError(404, f"Rota desconhecida: {route}")

    # ---- POST endpoints -----------------------------------------------------------

    def _handle_post(self, route: str, body: dict) -> dict:
        if route == "/api/browse":
            path = ask_open_filename()
            if not path:
                return {"cancelled": True}
            return self._open(Path(path))

        if route == "/api/open":
            return self._open(Path(str(body.get("path", ""))).expanduser())

        if route == "/api/slot":
            self._require_loaded()
            item = self.catalog.by_id.get(str(body.get("item_id")))
            if item is None:
                raise ApiError(400, "Item desconhecido.")
            slot = self._slot_number(body)
            self.save.set_slot(slot, item, int(body.get("count", 1)))
            return self.save.state()

        if route == "/api/clear":
            self._require_loaded()
            self.save.clear_slot(self._slot_number(body))
            return self.save.state()

        if route == "/api/attributes":
            self._require_loaded()
            if "health" in body:
                self.save.set_health(float(body["health"]))
            if "stamina" in body:
                self.save.set_stamina(float(body["stamina"]))
            return self.save.state()

        if route == "/api/write":
            self._require_loaded()
            try:
                backup = self.save.write()
            except OSError as err:
                raise ApiError(500, f"Erro ao salvar: {err}") from err
            state = self.save.state()
            state["backup"] = backup.name
            return state

        raise ApiError(404, f"Rota desconhecida: {route}")

    # ---- Helpers ---------------------------------------------------------------

    def _open(self, path: Path) -> dict:
        try:
            self.save.open(path)
        except FileNotFoundError as err:
            raise ApiError(404, "Arquivo não encontrado.") from err
        except (json.JSONDecodeError, InvalidSaveError, OSError) as err:
            raise ApiError(400, f"Não foi possível abrir o save: {err}") from err
        remember_recent(path)
        return self.save.state()

    def _require_loaded(self) -> None:
        if not self.save.loaded:
            raise ApiError(409, "Nenhum save aberto.")

    @staticmethod
    def _slot_number(body: dict) -> int:
        try:
            slot = int(body["slot"])
        except (KeyError, TypeError, ValueError) as err:
            raise ApiError(400, "Slot inválido.") from err
        last_slot = config.SECTIONS[-1][2]
        if not 0 <= slot <= last_slot:
            raise ApiError(400, f"Slot fora do intervalo 0–{last_slot}.")
        return slot

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError as err:
            raise ApiError(400, "JSON inválido no corpo da requisição.") from err

    def _send_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def create_server(port: int = config.DEFAULT_PORT) -> ThreadingHTTPServer:
    handler = type(
        "BoundHandler",
        (EditorRequestHandler,),
        {"catalog": Catalog(), "save": SaveManager()},
    )
    return ThreadingHTTPServer(("127.0.0.1", port), handler)
