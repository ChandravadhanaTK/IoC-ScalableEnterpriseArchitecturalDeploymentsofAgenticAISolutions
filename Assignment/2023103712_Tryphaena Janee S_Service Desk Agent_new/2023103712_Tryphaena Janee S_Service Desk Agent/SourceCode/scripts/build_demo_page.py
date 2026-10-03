"""Build a single self-contained HTML file of the backend-free demo.

    cd frontend && npm run build:demo && cd .. && python scripts/build_demo_page.py

Produces demo/service-desk-agent-demo.html, which can be opened locally,
hosted on any static host (GitHub Pages, Netlify, S3) or shared as a file.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "frontend" / "dist-demo"
OUT = ROOT / "demo" / "service-desk-agent-demo.html"


def main() -> None:
    index = (DIST / "index.html").read_text()
    css = "".join(p.read_text() for p in sorted((DIST / "assets").glob("*.css")))
    js = "".join(p.read_text() for p in sorted((DIST / "assets").glob("*.js")))
    js = js.replace("</script", "<\\/script")
    index = re.sub(r'<link rel="stylesheet"[^>]*>', "", index)
    index = re.sub(r'<script type="module"[^>]*></script>', "", index)
    index = index.replace("</head>", f"<style>{css}</style></head>")
    index = index.replace("</body>", f'<script type="module">{js}</script></body>')
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(index)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
