# Linear Programming Lab

An interactive, step-by-step guide to linear programming, built around one example (Ridgeline Boards). One self-contained file: `index.html`. It makes no network requests, so it runs from GitHub Pages, from Canvas, or offline.

## Files

| Path | What it is |
|---|---|
| `index.html` | The built page. This is the only file to publish. |
| `src/` | Sources: `style.css`, `solver.js` (2-variable LP + sensitivity), `graph.js` (SVG graph), `app.js` (model, report, components), `hero.js` (scroll-driven 3D opening), `engine.js` (lesson sections, blocks, progress), `lessons.js` (lesson content), `boot.js` (self-check, start-up), `template.html`. Fonts come from `../_shared/fonts/`. |
| `build.py` | Inlines `src/` into `index.html`. Run after any edit: `python3 build.py`. |
| `verify.py` | Recomputes every number in the lessons with plain Python; output in `verify-output.json`. |

## URL options

- `#lesson-7` opens a lesson directly.
- `?present` opens classroom mode (16:9 frame, large type, one step at a time; arrow keys move, Esc exits). The Present button in the top-left corner does the same and goes full screen.

## Publish

This folder lives in the `ariccheng.github.io` repository under `labs/lp-lab/`, so the page is served at https://ariccheng.github.io/labs/lp-lab/. After editing `src/`, run `python3 build.py`, then commit and push the site repository.

## Status (2026-10-26)

Built: Lessons 2, 3, 5, 6 and 7 (3D scroll opening, one lesson per view, draggable constraint lines and probe point, key-term pop-ups, classroom mode). Lessons 1, 4, 8, 9, 10 and the Playground show as "In preparation".

## Fonts

Inter Tight and Instrument Serif are embedded in `index.html`. The font files and their SIL Open Font License 1.1 texts are in `../_shared/fonts/`.
