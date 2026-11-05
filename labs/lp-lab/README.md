# Linear Programming Lab

An interactive, step-by-step guide to linear programming, built around one example (Ridgeline Boards). One self-contained file: `index.html`. It makes no network requests, so it runs from GitHub Pages, from Canvas, or offline.

## Files

| Path | What it is |
|---|---|
| `index.html` | The built page. This is the only file to publish. |
| `src/` | Sources: `style.css`, `solver.js` (2-variable LP + sensitivity), `graph.js` (SVG graph, including the whole-number point grid), `app.js` (model, report, components), `hero.js` (scroll-driven 3D opening), `engine.js` (lesson sections, blocks, progress), `lessons.js` (lesson content), `boot.js` (self-check, start-up), `template.html`. Fonts come from `../_shared/fonts/`. |
| `build.py` | Inlines `src/` into `index.html`. Run after any edit: `python3 build.py`. |
| `verify.py` | Recomputes every number in the lessons with plain Python; output in `verify-output.json`. |

## URL options

- `#lesson-7` opens a lesson directly.
- `?present` opens classroom mode (16:9 frame, large type, one step at a time; arrow keys move, Esc exits). The Present button in the top-left corner does the same and goes full screen.

## Publish

This folder lives in the `ariccheng.github.io` repository under `labs/lp-lab/`, so the page is served at https://ariccheng.github.io/labs/lp-lab/. After editing `src/`, run `python3 build.py`, then commit and push the site repository.

## Lessons

All seven are built; nothing on the page is a placeholder.

| # | Lesson | Question it answers |
|---|---|---|
| 1 | Draw what is possible | What can we decide, and what is the best plan? |
| 2 | Find the best plan | " |
| 3 | The report: products | What if the numbers change? |
| 4 | The report: resources | " |
| 5 | Use the report | " |
| 6 | Whole boards only | What if the answers must be whole numbers? |
| 7 | Yes or no decisions | " |

Lessons 6 and 7 are the integer part: the four roundings of (5.25, 10.5), the 48
whole-number plans, the optimum at (3, 12) worth $930, the relaxation as a $945
upper bound, and a binary rent-or-not decision on a second finishing bench
(+8 hours, break-even rent $360).

## Fonts

Inter Tight and Instrument Serif are embedded in `index.html`. The font files and their SIL Open Font License 1.1 texts are in `../_shared/fonts/`.
