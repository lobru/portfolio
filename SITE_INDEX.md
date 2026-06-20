# Site Index
# Edit this file to update links, images, and key copy across the portfolio.
# Each entry has: PAGE, FIELD, CURRENT VALUE, and what to change.
#
# To swap an image: replace the file at the given path (same filename = no code change needed).
# To update a URL: edit the value in the DATA FILE listed, or the HTML directly.
# AI agents: read this file first when asked to update links or images.

## ────── GLOBAL LINKS ──────

| Field            | Data file      | Current value |
|------------------|---------------|---------------|
| Logan LinkedIn   | index.html    | https://linkedin.com/in/logan-brunet |
| Logan GitHub     | index.html    | https://github.com/lobotomy-x |
| Logan email      | index.html    | loganwbrunet@gmail.com |
| Portfolio URL    | AUTOMATION.md | https://lobru.github.io/portfolio/ |

## ────── IMGUI-IDE ──────

| Field          | Data file | Current value |
|----------------|-----------|---------------|
| Repo link      | data.js → repoUrl | https://github.com/lobotomy-x/ImGuiColorTextEdit/tree/lobotomy/main |
| Live demo      | data.js → liveDemo.url | imgui-ide-demo.html |
| Release download | data.js (see below) | https://github.com/lobru/ImGui-IDE/releases/tag/1.0 |
| Hero screenshot | data.js → heroShot.src | uploads/textEditor.png |

### Demo tabs (imgui-ide-demo.html)
| Tab | File |
|-----|------|
| Cloud editor (default) | imgui-ide-cloud.html |
| Standalone editor | imgui-ide-web.html |

To replace either build: drop a new single-file Emscripten HTML into the project root
with the same filename, or change the `src=` in `imgui-ide-demo.html`.

## ────── UEVR FRONTEND ──────

| Field       | Data file | Current value |
|-------------|-----------|---------------|
| Repo link   | uevr-frontend-data.js → repoUrl | https://github.com/lobotomy-x/uevr-frontend |
| Hero image  | uevr-frontend-data.js → heroShot.src | media/uevr-frontend/main-inject.png |

### Screenshots (all in media/uevr-frontend/)
| File | What it shows |
|------|---------------|
| main-inject.png | Main window — game selector + inject button |
| version-selector.png | Nightly version picker |
| app-settings.png | Application settings page |
| launcher-settings.png | Steam/Epic launcher settings |
| tray-icons.png | Tray icon states |
| tray-menu.png | Tray right-click menu |

To replace: drop a new file at the same path (same filename = no code change needed).

## ────── UEVR LUAVRLIB ──────

| Field       | Data file | Current value |
|-------------|-----------|---------------|
| Repo link   | uevr-luavrlib-data.js → repoUrl | https://github.com/lobotomy-x/UEVR/tree/luavrlib |
| Docs link   | uevr-luavrlib-data.js → docsUrl | uevr-lua-docs.html |
| Hero image  | uevr-luavrlib-data.js → heroShot.src | media/uevr-luavrlib/class-browser-function-caller.png |

## ────── PORTFOLIO LANDING (index.html) ──────

### Project cards
| Card | Dashboard link | Demo link | GitHub link |
|------|---------------|-----------|-------------|
| ImGui-IDE | imguicolortextedit.html | imgui-ide-demo.html | github.com/lobotomy-x/ImGuiColorTextEdit |
| UEVR Frontend | UEVR-Frontend-Dashboard.html | — | github.com/lobotomy-x/uevr-frontend |
| UEVR luavrlib | UEVR-Luavrlib-Dashboard.html | — | github.com/lobotomy-x/UEVR/tree/luavrlib |

### AI section — games demo
| Field | Current value |
|-------|---------------|
| Demo page link | https://lobotomy-x.github.io/imgui/ |
| GitHub source  | https://github.com/lobotomy-x/imgui/tree/claude/... |

## ────── RESUME ──────

| File | Notes |
|------|-------|
| resume.html | Source of truth — edit here, then print to PDF |
| Logan_Brunet_Resume.pdf | Download copy — regenerate from resume.html after edits |

References:
- Travis Clement (tclements@adacel.com)
- Sonia Mina (soniam@adacel.com)

## ────── DOCS READER (uevr-lua-docs.html) ──────

Docs are fetched live from GitHub (raw.githubusercontent.com) — no local copies.
Edit the source repo and the docs page reflects it automatically.

| Collection | Source repo |
|-----------|-------------|
| Lua Library guides | https://github.com/lobotomy-x/Unreal-Lua-Library |
| UEVR Lua API reference | https://github.com/lobotomy-x/uevr-docs |

To add a doc: edit Docs/manifest.json — add an entry to the relevant collection's
`docs` array with `{ id, title, group, file }` where `file` is relative to `base`.

## ────── FILES TO KNOW ──────

| File | Purpose |
|------|---------|
| data.js | ImGui-IDE dashboard data — edit to update kanban, vitals, features |
| uevr-frontend-data.js | UEVR Frontend dashboard data |
| uevr-luavrlib-data.js | UEVR luavrlib dashboard data |
| sync.config.json | CI auto-sync config — add projects here |
| AUTOMATION.md | How the auto-update pipeline works |
| scripts/sync-dashboard.mjs | The sync script that calls the Claude API |
| Docs/manifest.json | Doc collections index for the docs reader |
| recruiter.jsx | Shared overview/hero layout for all dashboards |
| dashboard.jsx | Dev dashboard shell (kanban, dep graph, etc.) |
