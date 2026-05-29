# Dashboard Overview — Design Handoff
## How the project overview page should look and work

This doc captures every convention established in the ImGuiColorTextEdit dashboard's
Overview tab. Apply these exactly when building a new project dashboard.

---

## 1 · Hero structure

The Overview hero is a **full-width page header**, NOT a two-column layout.
It has three stacked zones:

```
┌─────────────────────────────────────────────────────────┐
│ TOPBAR — back link (left) + nav links (right)           │
├─────────────────────────────────────────────────────────┤
│ IDENTITY — project name BIG, author byline small, desc  │
│            ← left block        tech chips → right block │
├─────────────────────────────────────────────────────────┤
│ SPRINT STRIP — version | tagline | credits dropdown     │
└─────────────────────────────────────────────────────────┘
```

### Topbar
- Left: `← [Author Name] · Portfolio` link back to Portfolio.html
- Right: GitHub ↗ · LinkedIn ↗ · Dev dashboard ↗
- Font: `var(--font-mono)` 11px uppercase 0.1em tracking
- Back link color: `var(--muted)`, hover `var(--text)`

### Identity block
- **Project name** = `<h1>` at `clamp(36px, 4vw, 64px)` — this is the BIGGEST text on the page
- Below it: `"Contributed by [Author Name]"` in `var(--accent)`, 14px — small and subordinate
- Below that: `meta.description` — 1–2 sentence plain-English project description, 15px `var(--text-2)`
- Right column: "built with" label + tech stack chips (`meta.techStack[]`), right-aligned

### Sprint strip (3-column grid below identity)
- Col 1: `v{version}` + branch name
- Col 2: `meta.tagline` — one punchy sentence
- Col 3: `<details>` fork/credit history dropdown (`meta.credits[]`)

---

## 2 · data.js meta fields required

```javascript
meta: {
  // ── Core (always required) ──
  project:     "Repository / display name",      // → BIG h1 on overview
  version:     "1.0",
  branch:      "main",
  baseline:    "upstream-author/repo · year",
  repoPath:    "lobotomy-x/repo-name",
  lastUpdated: "2026-05-XX",
  docCount:    N,
  sessionId:   "sprint description",

  // ── Title parts for dev view header ──
  // Controls the colored split in the dev dashboard header
  // e.g. "UEVR " + "luavrlib" + "" → "UEVR luavrlib · progress"
  titlePrefix: "Text before accent",   // plain color
  titleAccent: "Accent word",          // var(--accent) color  
  titleSuffix: "",                     // plain color, can be ""

  // ── Overview (recruiter) view ──
  tagline:      "One punchy sentence — what this project does",
  description:  "1–2 sentence plain-English description. What is the project, what was it before, what changed. No jargon. Written for a non-technical recruiter.",

  // Author identity — shown SMALL as byline under the project name
  author:       "Logan Brunet",
  role:         "Job title / role descriptor",
  location:     "City, State",
  linkedIn:     "https://linkedin.com/in/...",
  github:       "https://github.com/lobotomy-x",
  repoUrl:      "https://github.com/lobotomy-x/portfolio",  // portfolio link

  // Fork / contributor history — shown in a <details> dropdown
  // Keep this SMALL and SUBORDINATE — it's project history, not primary credit
  credits: [
    { name: "Original Author",   handle: "handle",   role: "original author · year",      url: "https://github.com/..." },
    { name: "Fork Maintainer",   handle: "handle2",  role: "description of their work",   url: "https://github.com/..." },
    // Logan's changes don't go here — they're in the body of the overview
  ],

  // Impact numbers — 3 tiles below the hero
  impactNumbers: [
    { num: "22",   label: "What was measured",    sub: "brief context" },
    { num: "14",   label: "Second metric",        sub: "brief context" },
    { num: "3×",   label: "Third metric",         sub: "brief context" },
  ],

  // Features grid (§01 on overview) — plain English, non-technical
  // Each entry = one card. 8 is a good number (fills 3-col grid nicely).
  featuresAdded: [
    { name: "Feature name (plain English)",  desc: "One sentence. What does it DO for the user. Not how it works internally." },
    // ...
  ],

  // Highlight card IDs — which kanban cards to feature in §02
  // Pick 6 that show breadth: different groups, mix of large and small
  highlights: ["card-id-1", "card-id-2", "card-id-3", "card-id-4", "card-id-5", "card-id-6"],
  highlightCount: 6,    // optional, default 6 — total highlights shown on overview

  // Tech stack — shown as chips in the hero right column, right-aligned
  // Keep to 6–8 items. Real tech only, no buzzwords.
  techStack: ["C++17", "Sol2", "Lua", "Dear ImGui", "Unreal Engine", "Windows / Linux / macOS"],

  // Audience — 2–3 bullets in the About section
  audience: [
    "What platform / how it's used",
    "Who uses it",
    "How it integrates with other things",
  ],

  // Video clips — empty array = section hidden
  // Populate when you have screen recordings
  videos: [
    // { src: "media/video/demo.mp4", poster: "media/video/posters/demo.jpg", caption: "..." },
  ],
}
```

---

## 3 · Tone rules for overview copy

| Field | Rule |
|---|---|
| `tagline` | ≤ 12 words. Action verb first. "Built X that does Y." |
| `description` | Non-technical. No class names, no API names. What does the project DO. |
| `featuresAdded[].name` | User-facing feature name, not internal name. "Code folding" not "Folder::rebuildFoldRanges" |
| `featuresAdded[].desc` | One sentence. What the user experiences. No implementation details. |
| `card.blurb` | Technical description for the kanban view. OK to mention class names, API names, file paths. |
| `card.highlightBlurb` | **Optional override.** When this card appears in `meta.highlights`, the overview uses this instead of `blurb`. Plain English, recruiter-friendly. |
| `impactNumbers` | Real numbers only. No made-up stats. |
| `credits` | De-emphasize. They go in a collapsed `<details>` element. |
| Logan's name | Always subordinate to the project name. Small byline. "Contributed by Logan Brunet" |

---

## 3.5 · Selected highlights — manual + auto-fill

The "Selected highlights" section uses a hybrid manual/auto approach:

1. **Explicit list** — `meta.highlights[]` is the ordered list of card ids you want featured.
2. **Auto-supplement** — if `meta.highlights` has fewer than `meta.highlightCount` (default 6) entries, the recruiter view fills the remaining slots by picking shipped cards from the kanban. It prefers:
   - Cards that have a curated `highlightBlurb` field set
   - Cards from groups not already represented in the highlights
3. **Cap** — total displayed is `meta.highlightCount` (default 6).

**Each card may carry an optional `highlightBlurb`:**

```js
{
  id: "auto-inject",
  status: "shipped",
  group: "Injection Engine",
  // Technical — shown in the kanban (dev view)
  blurb: "Polls UnrealWindow class — every UE game creates one...",
  // Plain English — shown when card appears in Selected highlights on the overview
  highlightBlurb: "Detects every Unreal Engine game the moment it launches and turns it into a VR game. Runs entirely in user mode — no admin rights needed.",
}
```

If a card is in `meta.highlights` but has no `highlightBlurb`, the recruiter view falls back to its regular `blurb` — so technical cards still render, they just sound less polished. **Recommendation:** any card you put in `meta.highlights` should have a `highlightBlurb` written for it.

---

## 4 · CSS classes (already in index.html / shared)

All these classes exist in `index.html`. Copy the full CSS block marked
`RECRUITER / OVERVIEW VIEW` when setting up a new dashboard.

Key classes:
- `.rec` — page wrapper, max-width 1180px
- `.rec-hero-v2` — flex column container for the three hero zones
- `.rec-topbar` — back link + nav links row
- `.rec-back-link` — styled "← Name · Portfolio" link
- `.rec-identity` — project name + byline + desc zone
- `.rec-identity-main` — two-column: text left, tech chips right
- `.rec-name` — the BIG project title h1
- `.rec-role-line` — "Contributed by X" byline in accent color
- `.rec-bio` — description paragraph
- `.rec-sprint-panel` — 3-column horizontal strip below identity
- `.rec-tech-chips` — right-aligned "built with" chip cluster
- `.rec-features-grid` — 3-column grid for featuresAdded cards
- `.rec-feature-card` — individual feature card with accent left border
- `.rec-highlights` — 2-column grid for highlight cards
- `.rec-timeline` — milestone list
- `.rec-credits-details` — `<details>` fork history dropdown
- `.rec-cta` — bottom CTA to switch to dev view

---

## 5 · Section order on overview page

```
§ (none) — Hero (topbar + identity + sprint strip)
§ (none) — Impact numbers (3 tiles)
§ (none) — About / description + audience bullets
§ 01     — "What was added" (featuresAdded grid)
§ 02     — Selected highlights (6 kanban cards)
§ 03     — In action (video grid — hidden if meta.videos is empty)
§ 03/04  — Activity timeline (milestones)
§ 04/05  — Tech stack chips
(CTA)    — "Open developer view" button
```

---

## 6 · What NOT to put on the overview

- Internal class/function/API names
- Build flags or CMake options  
- File paths
- Anything that requires knowing the codebase to understand
- The phrase "fork" or "forked from" in the main body (credits dropdown only)
- Logan's bio / personal skills (those belong on Portfolio.html, not project pages)

---

## 7 · File checklist for a new project dashboard

```
[project]-data.js          ← all data, including meta fields above
[project]-depgraph.jsx     ← copy depgraph.jsx, update layers[] and nodes
[project]-dashboard.html   ← copy index.html, swap data.js + depgraph.jsx script tags,
                              update <title>
recruiter.jsx              ← shared — no changes needed per-project
dashboard.jsx              ← shared — no changes needed per-project
tweaks-panel.jsx           ← shared — no changes needed
companion.jsx              ← shared — no changes needed
tools.jsx                  ← shared — update tool prompts if project context differs
Portfolio.html             ← add a new project card linking to [project]-dashboard.html
```

The only files you create per-project are `[project]-data.js`, `[project]-depgraph.jsx`,
and `[project]-dashboard.html`. Everything else is shared.
