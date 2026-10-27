# Teaching labs

Interactive lessons served at https://ariccheng.github.io/labs/.

| Path | What it is |
|---|---|
| `index.html` | The list page. It reads `labs.json`. |
| `labs.json` | One entry per lab: `slug` (folder name), `title`, `topic`, `description`, `lessons`, `updated`. |
| `_shared/fonts/` | Fonts and their licenses, inlined into each lab at build time. Folders that start with `_` are not published. |
| `lp-lab/` | Linear Programming Lab. Edit `lp-lab/src/`, then run `python3 build.py` inside `lp-lab/`. |

## Add a lab

1. Make a folder, for example `decision-trees/`, whose `index.html` is the finished page.
2. Add one entry to `labs.json`.
3. Commit and push the site repository. The lab appears at `https://ariccheng.github.io/labs/decision-trees/`.
