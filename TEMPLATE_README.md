# Portfolio Dashboard — Template README
## A self-maintaining Claude Code progress dashboard for your GitHub portfolio

This template turns Claude Code session output, roadmap docs, and source
files into a dense, public-facing project dashboard with three themes,
an AI tools drawer, and a recruiter-friendly overview page.

**Live example:** [lobotomy-x/portfolio](https://github.com/lobotomy-x/portfolio)

---

## What you get

| View | Audience | Contents |
|---|---|---|
| **Overview** | Recruiters, hiring managers | Project name big, your name as byline, plain-English feature list, impact numbers, timeline, tech chips, CTA |
| **Dev dashboard** | Engineers, technical reviewers | Kanban (shipped/in-progress/open), dependency graph, files heatmap, language support, side-tasks, fix plan |
| **Tools drawer** | You | AI sync-from-docs, status report generator, release notes, CMake build script, deploy checklist |

Three themes: **Console** (dark, green/cyan), **Daylight** (warm off-white),
**Phosphor** (green CRT).

---

## Quick start — new project

### 1 · Copy the template files

```bash
# Copy these files into your new project's dashboard folder:
data.js                    ← rename to yourproject-data.js, fill in
depgraph.jsx               ← rename to yourproject-depgraph.jsx, update layers[]
index.html                 ← rename to yourproject-dashboard.html, swap script tags
dashboard.jsx              ← shared, no changes needed
recruiter.jsx              ← shared, no changes needed
companion.jsx              ← shared, no changes needed
tools.jsx                  ← shared, no changes needed
tweaks-panel.jsx           ← shared, no changes needed
```

### 2 · Fill in yourproject-data.js

Open the file and update `meta` first — this drives both views:

```js
meta: {
  project:      "Your Project Name",
  version:      "1.0",
  branch:       "main",
  baseline:     "upstream-author/repo",
  repoPath:     "yourusername/your-repo",
  lastUpdated:  "2026-06-01",

  // Overview page
  tagline:      "One punchy sentence — what you built",
  description:  "2–3 sentences. Plain English. No jargon. For non-technical readers.",
  author:       "Your Name",
  role:         "Your Role",
  location:     "City, State",
  linkedIn:     "https://linkedin.com/in/you",
  github:       "https://github.com/you",
  repoUrl:      "https://github.com/you/portfolio",

  featuresAdded: [
    { name: "Plain English feature name", desc: "What it does for the user." },
  ],
  highlights:    ["card-id-1", "card-id-2"],   // 6 kanban card ids to feature
  impactNumbers: [
    { num: "22", label: "Features shipped", sub: "brief context" },
  ],
  techStack:    ["C++17", "Dear ImGui", ...],
  credits:      [{ name, handle, role, url }],  // upstream authors, small/collapsed
  videos:       [],                              // populate when you have recordings
}
```

Then fill in `cards[]`, `symptoms[]`, `plan[]`, `edges[]`, `files[]`,
`milestones[]`, `scripts{}`, `sideTasks[]`.

See `CONTENT_UPDATE_GUIDE.md` for the full schema and how to keep it current.

### 3 · Update yourproject-depgraph.jsx

Edit the `layers[]` array to match your project's dependency groups:

```js
const layers = [
  { x: 40,  title: "Core",         nodes: ["card-id-1", "card-id-2"] },
  { x: 310, title: "UI",           nodes: ["card-id-3"] },
  { x: 580, title: "Integration",  nodes: ["card-id-4", "card-id-5"] },
  { x: 840, title: "Open / Next",  nodes: ["open-bug-id"] },
];
```

Node ids must match card/symptom ids in your data file.

### 4 · Update yourproject-dashboard.html

In the `<head>`, update the title:
```html
<title>Your Project · Progress</title>
```

Swap the data and depgraph script tags at the bottom:
```html
<script src="yourproject-data.js"></script>
<script type="text/babel" src="yourproject-depgraph.jsx"></script>
```

### 5 · Add to Portfolio.html

Add a project card to the `<div class="projects">` grid:

```html
<div class="project-card">
  <div class="project-thumb">
    <img src="media/screenshots/yourproject.png" alt="..." />
    <span class="project-status-bar live">Shipped</span>
  </div>
  <div class="project-body">
    <div class="project-eyebrow">C++ · Your Stack</div>
    <div class="project-title">Your Project Name</div>
    <div class="project-blurb">One paragraph. Plain English. What you built and why it matters.</div>
    <div class="project-tags">
      <span class="project-tag">C++17</span>
    </div>
  </div>
  <div class="project-foot">
    <span class="project-date">Month Year</span>
    <a href="yourproject-dashboard.html" class="project-cta">View dashboard →</a>
  </div>
</div>
```

---

## Folder structure

```
portfolio-root/
├── Portfolio.html                        ← landing page
├── index.html                            ← ImGuiColorTextEdit dashboard
├── UEVR-Frontend-Dashboard.html          ← UEVR Frontend dashboard
│
├── data.js                               ← ImGuiColorTextEdit data
├── uevr-frontend-data.js                 ← UEVR Frontend data
│
├── depgraph.jsx                          ← ImGuiColorTextEdit dep graph
├── uevr-frontend-depgraph.jsx            ← UEVR Frontend dep graph
│
├── dashboard.jsx                         ← shared — main dashboard logic
├── recruiter.jsx                         ← shared — overview/portfolio view
├── companion.jsx                         ← shared — local Claude CLI bridge
├── tools.jsx                             ← shared — AI tools drawer
├── tweaks-panel.jsx                      ← shared — tweaks panel
│
├── media/
│   ├── screenshots/                      ← project screenshots for portfolio cards
│   └── video/                            ← screen recordings for overview page
│       └── posters/                      ← first-frame stills (poster= attr)
│
├── uploads/                              ← existing assets (docs, images)
│
├── .github/workflows/deploy.yml          ← GitHub Pages auto-deploy
│
├── CONTENT_UPDATE_GUIDE.md               ← how to update content with regular Claude
├── DASHBOARD_DESIGN_HANDOFF.md           ← design conventions for new dashboards
├── PORTFOLIO_SETUP.md                    ← GitHub Pages + submodule plan
└── TEMPLATE_README.md                    ← this file
```

---

## Keeping content current

**For small updates** (mark a card shipped, add a bug, update a date):
→ Edit `data.js` directly. The schema is self-documenting.

**For sprint updates** (new Claude Code session output):
→ See `CONTENT_UPDATE_GUIDE.md` — feed the doc + data.js to regular Claude.

**For visual changes** (new sections, layout, CSS):
→ Open in Claude Design and describe what you want.

**For a new project**:
→ Follow this README from Step 1.

---

## Using the companion server

The **Tools drawer** (bottom-left FAB in dev view) includes an AI assistant
that can generate status reports, release notes, and build scripts — and
lets you ask Claude questions about any specific feature card.

To enable the full Claude CLI integration:
1. Tools → "Companion server" → Download `companion.py`
2. `python companion.py --port 7373` from your repo root
3. The dashboard connects automatically — banner turns green

Requires: Python 3.9+, `claude` CLI in PATH.

---

## Publishing to GitHub Pages

### Option A — Instant (manual bundle)
1. Download `ImGuiColorTextEdit Dashboard.html` (standalone bundle)
2. Create repo `yourusername/portfolio`
3. Push all files to `main` branch root
4. Settings → Pages → Source: main, / (root)
5. Done — `https://yourusername.github.io/portfolio/`

### Option B — Auto-deploy on push
See `.github/workflows/deploy.yml` — pushes to `main` auto-deploy to Pages.

---

## Template philosophy

- **Data-driven**: all content lives in `data.js` — no HTML to edit for content changes
- **Zero build step**: plain HTML + Babel transforms JSX in-browser — open and edit directly
- **Three audiences**: recruiter overview, engineer dev view, and you (tools)
- **AI-native**: built with Claude Code, designed to be updated with Claude
- **No framework lock-in**: React via CDN, no npm, no bundler required for development
