# Content Update Guide
## How to update dashboard content using regular Claude (no Claude Design needed)

This guide lets you keep the dashboard in sync with your repos using
claude.ai (free/Pro) or Claude Code — no Claude Design credits required.

---

## When to use this guide vs. Claude Design

| Task | Use |
|---|---|
| Update shipped features, fix plan, milestones | Regular Claude + this guide |
| Add/remove kanban cards | Regular Claude + this guide |
| Update language support table | Regular Claude + this guide |
| Fix copy, descriptions, taglines | Regular Claude + this guide |
| Change visual layout, CSS, new sections | Claude Design |
| Add a whole new project dashboard | Claude Design (first time), then regular Claude for content |

---

## Method 1 — Feed repo + prompt to Claude Code (best)

Run this from your repo root. Claude Code will read your source files
and generate an updated `data.js` patch.

### Step 1 — Open Claude Code in your repo

```bash
cd /path/to/ImGuiColorTextEdit
claude
```

### Step 2 — Paste this prompt

```
I need to update my progress dashboard data file (data.js) to reflect
the current state of this codebase.

Please:
1. Read the files listed below and identify any new features, bug fixes,
   or changes since the last snapshot
2. Compare against the existing cards in data.js (I'll paste it below)
3. Generate a JSON patch object with:
   - newCards: [] — any new shipped/in-progress features
   - updatedCards: [] — cards whose status or description changed
   - newSymptoms: [] — new open bugs or backlog items
   - resolvedSymptoms: [] — symptoms that are now fixed (move to shipped)
   - newMilestones: [] — new timeline entries
   - vitalsDelta: {} — updated counts

Files to read:
- TextEditor.cpp (or relevant source files)
- TextEditor.h
- CHANGELOG.md or roadmap.md if present
- Any recent commit messages you can see

Current data.js cards section:
[PASTE YOUR CURRENT data.js cards[] ARRAY HERE]

Card shape: { id, title, status: "shipped"|"in-progress"|"open", group, tags[], blurb, detail?, files?[] }
Blurbs must be ≤ 18 words. Use kebab-case ids. Don't duplicate existing ids.

Output only the JSON patch, no preamble.
```

### Step 3 — Apply the patch

Copy the JSON output. Then in Claude Code:

```
Apply this patch to data.js:
[PASTE JSON PATCH]

Rules:
- Merge newCards into the cards[] array
- Update any updatedCards by matching on id
- Add newSymptoms to symptoms[]
- Remove resolvedSymptoms from symptoms[] and add a shipped card for each
- Add newMilestones to milestones[]
- Update vitals counts to match vitalsDelta
```

---

## Method 2 — Feed this doc + data.js to claude.ai chat

If you're not using Claude Code, you can update content via the regular
claude.ai chat interface.

### What to paste into claude.ai

1. This file (`CONTENT_UPDATE_GUIDE.md`) — so Claude knows the schema
2. Your current `data.js` — the full file
3. The relevant source files or a description of what changed
4. Your instructions (e.g. "Mark `fold-preview` as shipped, add a new card for ...")

### Example prompt for claude.ai

```
I have a progress dashboard with a data.js file that tracks features
in a C++ project. Here's my current data.js:

[PASTE data.js]

Here's what changed since the last update:
- [describe what you shipped, fixed, or added]
- [paste relevant commit messages or source file excerpts]

Please generate the updated data.js with these changes applied.
Keep all existing content intact and only modify what I described.
Output the full updated file.
```

---

## Method 3 — Edit data.js directly (for small changes)

For quick edits, just open `data.js` in any editor. The schema is
straightforward — see the annotations in the file itself.

### Most common edits

**Mark a card as shipped:**
```js
// Change:
status: "in-progress",
// To:
status: "shipped",
```

**Add a new shipped card:**
```js
// Add to the cards[] array, in the right group:
{
  id: "my-feature",          // kebab-case, unique
  title: "Short feature name",
  status: "shipped",
  group: "Fold Engine",      // match an existing group name
  tags: ["feature", "ux"],
  blurb: "One sentence, max 18 words, plain English.",
  detail: "Optional longer explanation shown when card is expanded.",
  files: ["TextEditor.cpp"],
},
```

**Update vitals counts:**
```js
vitals: {
  shipped: 23,    // ← increment when you ship something
  inProgress: 0,
  openBugs: 1,
  // ...
},
```

**Add a milestone:**
```js
// Add to milestones[] array:
{ date: "2026-06-01", label: "GetWordAt + jump-to-definition shipped", kind: "ship" },
```

**Close an open symptom:**
```js
// 1. Remove from symptoms[] array
// 2. Add a shipped card to cards[]
// 3. Decrement vitals.openBugs, increment vitals.shipped
```

---

## data.js schema reference

### Card
```js
{
  id:      "kebab-case-unique-id",
  title:   "Short feature name (≤ 8 words)",
  status:  "shipped" | "in-progress" | "open",
  group:   "Fold Engine" | "Navigation" | "Integration" | "Bug Fixes" | "Backlog",
  tags:    ["bug-fix", "feature", "ux", "platform", "keyboard", "ide", ...],
  blurb:   "One sentence ≤ 18 words shown on collapsed card.",
  detail:  "Optional. Shown when card is expanded. Full explanation.",
  surface: ["optional", "list of", "API / UI items"],
  checks:  ["optional", "acceptance", "criteria"],
  files:   ["TextEditor.cpp", "TextEditor.h"],
}
```

### Symptom (open bug or backlog feature)
```js
{
  id:       "kebab-case-id",
  title:    "Short description",
  detail:   "Full description of the issue and what a fix looks like.",
  severity: "high" | "medium" | "low",
  kind:     undefined,     // omit for bugs
  // kind: "feature",      // set for backlog items
}
```

### Plan step
```js
{
  step:    1,
  title:   "What this step does",
  detail:  "How to do it.",
  checks:  ["acceptance criterion 1", "criterion 2"],
  state:   "pending" | "in-progress" | "done",
}
```

### Milestone
```js
{ date: "2026-05-11", label: "What shipped",   kind: "ship" }
{ date: "→ next",     label: "What's planned", kind: "next" }
{ date: "Q1 2025",    label: "Upstream work",  kind: "audit" }
{ date: "→ active",   label: "In progress",    kind: "in-progress" }
```

### Edge (dependency graph)
```js
{ from: "card-id-a", to: "card-id-b" }
// a must exist before b can work
```

---

## Rebuilding the standalone bundle after edits

After editing `data.js` (or any .jsx file), the live dashboard at
`index.html` updates immediately on reload — no build step needed.

To rebuild the offline standalone bundle:
1. Open `index.html` in Claude Design
2. Use "Save as standalone HTML" → downloads `ImGuiColorTextEdit Dashboard.html`
3. Commit and push to GitHub Pages

Or, once the GitHub Actions workflow is set up (see `.github/workflows/deploy.yml`),
just push your changes — the bundle rebuilds automatically.
