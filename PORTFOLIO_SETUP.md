# Portfolio Dashboard — Setup & Automation Plan

> **Context for Logan:** This file captures the full plan for turning this dashboard
> into a self-maintaining GitHub Pages site. Do these steps in order — each one
> unlocks the next. Also intended as a handoff note for contributing the template
> improvements back to the base template project.

---

## 0 · What exists right now

```
ImGuiColorTextEdit/          ← this repo (dashboard source)
├── index.html               ← main dashboard (dev view + overview)
├── dashboard.jsx
├── data.js                  ← single source of truth — edit this to update content
├── recruiter.jsx            ← public-facing overview (Logan's portfolio piece)
├── companion.jsx            ← local Claude CLI bridge
├── tools.jsx                ← AI tools drawer
├── depgraph.jsx
├── tweaks-panel.jsx
├── uploads/                 ← screenshots, docs, resume (already here)
└── ImGuiColorTextEdit Dashboard.html   ← bundled standalone export
```

---

## 1 · GitHub Pages — immediate deploy

### Option A: Deploy the standalone bundle (simplest)

1. Create repo `lobotomy-x/imgui-colortextedit-dashboard` (or add to existing portfolio repo as a subfolder)
2. Push `ImGuiColorTextEdit Dashboard.html` renamed to `index.html`
3. Settings → Pages → Source: `main` branch, `/ (root)`
4. Done. URL: `https://lobotomy-x.github.io/imgui-colortextedit-dashboard/`

**Downside:** You have to manually rebuild the bundle every time you update content.

### Option B: Deploy the source + build with Actions (recommended)

See §3 for the full GitHub Actions workflow.

---

## 2 · Media folder structure

Adopt this convention so videos and images auto-populate into the dashboard:

```
media/
├── screenshots/
│   ├── textEditor.png
│   ├── autocomplete.png
│   ├── contextMenus.png
│   └── ...
└── video/
    ├── fold-engine-demo.mp4      ← fold all/unfold, fold arrow, click-to-select
    ├── ide-navigation.mp4        ← header toggle, go-to-include, chord shortcuts
    ├── runtime-languages.mp4     ← loading .lang files, live highlighting
    └── posters/                  ← first-frame stills used as video poster= attrs
        ├── fold-engine-demo.jpg
        └── ...
```

Then in `data.js`, populate `meta.videos`:

```javascript
videos: [
  {
    src:     "media/video/fold-engine-demo.mp4",
    poster:  "media/video/posters/fold-engine-demo.jpg",
    caption: "Fold engine — per-type previews, chord shortcuts, click-to-select",
  },
  {
    src:     "media/video/ide-navigation.mp4",
    poster:  "media/video/posters/ide-navigation.jpg",
    caption: "IDE navigation — header/source toggle, #include go-to-file",
  },
  // ...
],
```

The recruiter view reads `m.videos` and renders a responsive video grid automatically.
Videos with `poster=` load fast — only the first frame is fetched until the user hits play.

---

## 3 · GitHub Actions — auto-rebuild on push

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy Dashboard

on:
  push:
    branches: [main]
    paths:
      - "**.js"
      - "**.jsx"
      - "**.html"
      - "media/**"
      - "uploads/**"

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true          # pulls in the target codebase submodule

      - name: Install Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # Optional: run a script that reads the submodule's source and
      # regenerates data.js from the actual codebase state
      - name: Regenerate data.js from codebase
        run: node scripts/generate-data.js
        if: hashFiles('scripts/generate-data.js') != ''

      - name: Bundle dashboard
        run: npx @claude-bundler/cli bundle index.html -o dist/index.html
        # (replace with actual bundler CLI once available — for now use the
        #  Claude Code "Save as standalone" flow and commit the output)

      - name: Copy media assets to dist
        run: |
          cp -r media dist/media
          cp -r uploads dist/uploads

      - name: Deploy to Pages
        uses: actions/deploy-pages@v4
```

**Note:** The Claude-powered `super_inline_html` bundler is currently a design-tool
feature. Until a CLI is available, the interim workflow is:
1. Edit `data.js` / JSX files
2. Open in Claude project → "Save as standalone HTML"
3. Commit `ImGuiColorTextEdit Dashboard.html` as `docs/index.html`
4. GitHub Pages serves from `docs/`

---

## 4 · Target codebase as a submodule

```bash
# From repo root
git submodule add https://github.com/goossens/ImGuiColorTextEdit src/codebase

# On clone/pull:
git submodule update --init --recursive

# Update submodule to latest upstream:
cd src/codebase && git pull origin master && cd ../..
git add src/codebase && git commit -m "bump codebase submodule"
```

Then write `scripts/generate-data.js` to parse the submodule and keep `data.js`
in sync with the actual source:

- Read `src/codebase/` to auto-count files touched
- Parse comments / commit messages to update milestones
- Check for new `.lang` files in `example/languages/`

---

## 5 · Template contribution notes

> Pass this file to the base template project (project `8e1745d8`) as context.

**New features added in this fork that should go back:**

| Feature | Files | Notes |
|---|---|---|
| Recruiter/portfolio view (`rec-hero-v2`) | `recruiter.jsx`, `index.html` | New identity-block hero; reads `meta.author/bio/skills/linkedIn/github` |
| Credits dropdown | `recruiter.jsx` | `<details>` fork history; reads `meta.credits[]` |
| Video grid section | `recruiter.jsx`, `index.html` | Reads `meta.videos[]`; renders `<video>` with poster |
| `meta.skills` chip row | `recruiter.jsx` | Skill chips below role line |
| `meta.open-to-work` badge | `recruiter.jsx` | Pulsing green dot + "open to work · location" |
| `rec-sprint-panel` card | `recruiter.jsx` | Sprint context in a bordered card, replaces right column of old hero |

**New `meta` fields:**

```javascript
meta: {
  // existing: project, version, branch, lastUpdated, docCount, sessionId
  // existing: tagline, description, author, role, repoUrl, highlights, impactNumbers, techStack, audience

  // NEW:
  bio:       "one-liner for the identity block",
  location:  "City, State",
  skills:    ["C++17", "Dear ImGui", ...],   // rendered as chips
  linkedIn:  "https://linkedin.com/in/...",
  github:    "https://github.com/...",
  credits: [                                  // fork/contributor history dropdown
    { name, handle, role, url },
  ],
  videos: [                                   // optional — empty array = section hidden
    { src, poster?, caption? },
  ],
}
```

---

## 6 · Immediate next actions (manual)

- [ ] Record 2–3 short screen captures (OBS or QuickTime, 1080p, MP4/H.264)
  - Fold engine: open a .cpp file, fold all, show previews, click to unfold
  - IDE nav: Alt+O header toggle, Ctrl+K chord, #include right-click
  - Runtime langs: drop a .lang file, see it pick up on next launch
- [ ] Add to `data.js` `meta.videos[]`
- [ ] Push to a new GitHub repo `lobotomy-x/imgui-editor-sprint`
- [ ] Enable Pages → serve `docs/` → add URL to resume / LinkedIn
- [ ] Link from portfolio landing page (`lobotomy-x/portfolio`)
