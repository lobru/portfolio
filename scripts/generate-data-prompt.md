# Claude Prompt — Regenerate data.js from repo
#
# Feed this file + your current data.js + relevant source files to
# claude.ai or Claude Code to get an updated data.js.
#
# Usage:
#   claude.ai chat: paste this prompt, then paste data.js, then describe changes
#   Claude Code:    cat scripts/generate-data-prompt.md | claude
#   With repo:      claude --add-files TextEditor.cpp TextEditor.h roadmap.md

You are maintaining a progress dashboard data file for a software project.
The dashboard tracks shipped features, in-progress work, open bugs, and a fix plan.

## Your task

Read the source files / change descriptions provided and update the data file
to reflect the current state of the project. Output the complete updated data.js.

## Rules

1. **Never remove existing shipped cards** — only add to them or update status
2. **Match existing style** — blurbs ≤ 18 words, kebab-case ids, title case group names
3. **Status transitions**:
   - `"in-progress"` → `"shipped"` when the feature lands
   - Remove from `symptoms[]` when a bug is fixed, add a shipped card
   - Update `vitals.shipped` count to match actual shipped card count
4. **New cards** go in the right group — scan existing groups first
5. **Edges** — if a new card depends on an existing one, add an edge
6. **Milestones** — add a milestone entry for significant shipping events
7. **Keep `meta` fields intact** — don't modify author, tagline, description etc.
   unless specifically asked to

## Data schema

```js
// Card
{
  id:      "kebab-case-unique",
  title:   "Short name ≤ 8 words",
  status:  "shipped" | "in-progress" | "open",
  group:   "existing group name",
  tags:    ["feature"|"bug-fix"|"ux"|"platform"|"keyboard"|"ide"|"perf"|"compat"],
  blurb:   "≤ 18 words. What it does. Plain English.",
  detail:  "Optional. Shown expanded. Can be longer.",
  files:   ["FileName.cpp"],
}

// Symptom (open bug or backlog)
{
  id:       "kebab-case",
  title:    "Short description",
  detail:   "Full description + what a fix looks like.",
  severity: "high" | "medium" | "low",
  kind:     "feature",  // only if backlog, omit for bugs
}

// Plan step
{
  step:    N,
  title:   "Step name",
  detail:  "How to do it.",
  checks:  ["acceptance criterion"],
  state:   "pending" | "in-progress" | "done",
}

// Milestone
{ date: "2026-MM-DD", label: "What happened", kind: "ship"|"in-progress"|"audit"|"next" }

// Edge
{ from: "card-id", to: "card-id" }  // from must exist before to can work

// File entry
{
  path:        "Filename.cpp",
  domain:      "core"|"ui"|"build"|"example"|"config"|"utils",
  changeCount: N,
  changes:     ["what changed"],
}
```

## Output format

Output the complete updated `data.js` file starting with:
```
window.PROGRESS_DATA = {
```

Do not add explanatory text before or after the file content.

---

## Current data.js

[PASTE YOUR data.js HERE]

---

## Changes to apply

[DESCRIBE WHAT CHANGED, OR PASTE SOURCE FILE EXCERPTS / COMMIT MESSAGES]
