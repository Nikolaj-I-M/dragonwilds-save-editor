"""Entry point: ``python -m dragonwilds_editor [--port N] [--no-browser]``."""

from __future__ import annotations

import argparse
import webbrowser

from . import __version__, config
from .server import create_server


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="dragonwilds_editor",
        description="Editor de save — RuneScape: Dragonwilds",
    )
    parser.add_argument("--port", type=int, default=config.DEFAULT_PORT)
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="não abrir o navegador automaticamente",
    )
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    server = create_server(args.port)
    url = f"http://127.0.0.1:{args.port}"
    print(f"🐉 Dragonwilds Save Editor v{__version__} — {url}")
    print("   Pressione Ctrl+C para encerrar.")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nAté logo!")


if __name__ == "__main__":
    main()
