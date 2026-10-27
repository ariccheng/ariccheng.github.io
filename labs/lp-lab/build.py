"""Inline src/ into one self-contained index.html.

    python3 build.py
"""
import base64
import re
from pathlib import Path

SRC = Path(__file__).parent / "src"
FONTS = Path(__file__).parent.parent / "_shared" / "fonts"   # shared by every lab
JS = ["solver.js", "graph.js", "app.js", "hero.js", "engine.js", "lessons.js", "boot.js"]
FOOT = """/* Linear Programming Lab · Aric Cheng, W. P. Carey School of Business, Arizona State University.
   Ridgeline Boards is a teaching example. */\n"""

html = (SRC / "template.html").read_text()
css = (SRC / "style.css").read_text()
# fonts: url(FONT:name) -> base64 data URI of ../_shared/fonts/name.woff2 (SIL Open Font License)
css = re.sub(r"url\(FONT:([\w-]+)\)", lambda m: "url(data:font/woff2;base64," +
             base64.b64encode((FONTS / (m.group(1) + ".woff2")).read_bytes()).decode() + ")", css)
js = FOOT + "\n".join((SRC / f).read_text() for f in JS)
assert "</script" not in js.lower(), "a literal </script> would end the inline script"
html = html.replace("/*{{CSS}}*/", css).replace("/*{{JS}}*/", js)
out = Path(__file__).parent / "index.html"
out.write_text(html)
print(f"index.html  {out.stat().st_size / 1024:.1f} KB")
