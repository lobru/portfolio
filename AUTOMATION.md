# Automation — hands-off portfolio updates

This wires the whole loop so you never hand-edit dashboard content or redeploy
by hand: **commit code → the live site updates itself.**

```
You push to a code repo
        │  (.github/workflows/notify-portfolio.yml)
        ▼
repository_dispatch ──►  portfolio repo: sync-content.yml
        │                  • clones the repo, reads new commits + docs
        │                  • Claude API rewrites that project's data.js
        │                  • commits the change
        ▼
push to portfolio main ──►  deploy-pages.yml ──►  GitHub Pages (live site)
```

Everything here runs on GitHub Actions + the Anthropic API. No Claude Design
credits are involved in routine updates.

---

## Files in this repo

| File | Role |
|---|---|
| `sync.config.json` | Maps each source repo → its `data.js` and the doc files to read |
| `scripts/sync-dashboard.mjs` | The sync engine (clone → diff → Claude → rewrite) |
| `.github/workflows/sync-content.yml` | Runs the sync, commits changes |
| `.github/workflows/deploy-pages.yml` | Deploys the site on every push to `main` |
| `automation/notify-portfolio.yml` | **Template** to copy into each code repo |
| `.sync-state.json` | Auto-managed; remembers the last-synced commit per repo |

---

## One-time setup (≈ 15 min)

### 1. Put this repo on GitHub Pages
Push these files to `lobru/portfolio`, then:
**Settings → Pages → Source: GitHub Actions.**
(Or "Deploy from a branch → main / root" and delete `deploy-pages.yml`.)
Live URL: `https://lobru.github.io/portfolio/`

### 2. Add secrets to the portfolio repo
**Settings → Secrets and variables → Actions:**
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `GH_PAT` — *only if any source repo is private.* Fine-grained PAT, **Contents: read** on those repos. Public repos need nothing.

### 3. Wire each code repo to ping the portfolio
Copy `automation/notify-portfolio.yml` to `.github/workflows/notify-portfolio.yml`
in each of: `ImGuiColorTextEdit`, `uevr-frontend`, `Unreal-Lua-Library`.
In each one, set the `branches:` line to that repo's branch, and add a secret:
- `PORTFOLIO_DISPATCH_TOKEN` — PAT with **Contents: write** on `lobru/portfolio`

That's it. From now on, pushing code updates the live dashboard automatically.

---

## Day-to-day

**Nothing.** Push code as usual. Within a minute the matching dashboard reflects it.

You also get two manual levers:
- **Portfolio repo → Actions → "Sync dashboard content" → Run workflow** — force a sync now (optionally one project).
- **Nightly cron** in `sync-content.yml` catches anything that slipped through.

### Run it locally (no Actions)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run sync          # all projects
npm run sync:dry      # preview, write nothing
npm run sync:imgui    # just one project
git add -A && git commit -m "sync" && git push   # deploys
```

---

## Adding a new project to the pipeline

1. Create its dashboard once in Claude Design (new `*-data.js` + `*-Dashboard.html`).
2. Add an entry to `sync.config.json`:
   ```json
   { "name": "my-tool", "repo": "lobotomy-x/my-tool", "ref": "main",
     "dataFile": "my-tool-data.js", "docs": ["README.md", "CHANGELOG.md"] }
   ```
3. Drop `notify-portfolio.yml` into that repo with its dispatch secret.
Done — it's now part of the auto-sync.

---

## Guardrails (why this won't trash your data)

- The model is told to **only change what the commits/docs support** and to leave
  marketing copy (tagline, bio, skills, credits, impact numbers) alone.
- The script **refuses to write** any output that doesn't contain
  `window.PROGRESS_DATA`, so a bad API response can't blank a file.
- Every change lands as a **normal commit** — review the diff, and `git revert`
  if you ever disagree with the model.
- `--dry-run` lets you preview before anything is written.
- Pin a specific model via the `ANTHROPIC_MODEL` env var if you want reproducibility.

---

## What still needs a human

- **Code commits themselves** are your dev work (Claude Code in each repo). This
  pipeline reflects them — it doesn't write your features.
- **Visual/layout changes** (CSS, new sections, new card fields) → Claude Design.
- **Screenshots & videos** → drop files in `media/…` and add them to `meta.gallery`
  / `meta.videos`; see `CONTENT_UPDATE_GUIDE.md` for the schema.
