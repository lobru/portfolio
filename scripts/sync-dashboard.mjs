#!/usr/bin/env node
// scripts/sync-dashboard.mjs
// ─────────────────────────────────────────────────────────────────────────
// Keeps each project's data.js in sync with the real state of its source repo.
//
// For every project in sync.config.json it:
//   1. shallow-clones the target repo at the configured ref
//   2. figures out what commits are new since the last sync (.sync-state.json)
//   3. gathers commit log + changed-file stats + the listed doc files
//   4. asks the Claude API to rewrite that project's data.js from the evidence
//   5. writes the file back and records the new HEAD sha
//
// Designed to run in CI (see .github/workflows/sync-content.yml) but also
// works locally:  ANTHROPIC_API_KEY=sk-... node scripts/sync-dashboard.mjs
//
// Flags:
//   --project <name>   only sync one project (matches "name" in the config)
//   --since-all        ignore the saved marker, look at the last 60 commits
//   --dry-run          do everything except write data files / state
// ─────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT        = process.cwd();
const CONFIG      = JSON.parse(readFileSync(join(ROOT, "sync.config.json"), "utf8"));
const STATE_PATH  = join(ROOT, ".sync-state.json");
const API_KEY     = process.env.ANTHROPIC_API_KEY;
const MODEL       = process.env.ANTHROPIC_MODEL || CONFIG.model || "claude-sonnet-4-5";
const GH_TOKEN    = process.env.GH_PAT || process.env.GITHUB_TOKEN || "";

const args        = process.argv.slice(2);
const onlyProject = flagValue("--project");
const sinceAll    = args.includes("--since-all");
const dryRun      = args.includes("--dry-run");

const MAX_DOC_BYTES   = 18_000;   // per doc file, to keep the prompt bounded
const MAX_DIFF_BYTES  = 24_000;   // total diffstat + log budget
const LOOKBACK        = 60;       // commits to inspect when there is no marker

function flagValue(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
function sh(cmd, cmdArgs, cwd) {
  return execFileSync(cmd, cmdArgs, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}
function loadState() {
  return existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, "utf8")) : {};
}
function gatherDocs(repoDir, docPaths) {
  const out = [];
  for (const rel of docPaths) {
    const abs = join(repoDir, rel);
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    const files = st.isDirectory()
      ? readdirSync(abs).filter((f) => /\.(md|txt)$/i.test(f)).map((f) => join(rel, f))
      : [rel];
    for (const f of files) {
      const p = join(repoDir, f);
      if (!existsSync(p) || statSync(p).isDirectory()) continue;
      let text = readFileSync(p, "utf8");
      if (text.length > MAX_DOC_BYTES) text = text.slice(0, MAX_DOC_BYTES) + "\n…[truncated]";
      out.push(`===== FILE: ${f} =====\n${text}`);
    }
  }
  return out.join("\n\n");
}

function buildPrompt({ proj, currentData, log, diffstat, docs }) {
  return `You maintain the data file behind a public portfolio dashboard for a software project.

Your job: rewrite the COMPLETE data file so it accurately reflects the current state of
the source repository, using the evidence below. This is a factual sync, not a redesign.

STRICT RULES
- Output the ENTIRE file, ready to save verbatim. Keep \`window.PROGRESS_DATA = { ... };\`.
- Preserve the exact schema, field names, key order, and code style of the current file.
- Only add/modify/mark content that the evidence supports (new commits, doc changes).
  When in doubt, keep the existing content unchanged.
- Move finished work to status:"shipped"; keep accurate counts in \`vitals\`.
- Card blurbs ≤ 18 words, plain English, kebab-case ids, never duplicate an id.
- Add new \`milestones\` entries for meaningful shipped batches; keep "→ next" items honest.
- Do NOT touch the recruiter/overview marketing copy (tagline, description, bio, role,
  skills, links, credits, impactNumbers) unless a doc explicitly changes the facts.
- Return ONLY the file inside a single \`\`\`js code block. No commentary.

PROJECT: ${proj.name}  (repo ${proj.repo} @ ${proj.ref})

=== NEW COMMITS SINCE LAST SYNC ===
${log || "(no new commits — return the file unchanged)"}

=== CHANGED-FILE STATS ===
${diffstat || "(none)"}

=== CURRENT DOC FILES ===
${docs || "(none provided)"}

=== CURRENT DATA FILE (${proj.dataFile}) ===
${currentData}`;
}

async function callClaude(prompt) {
  if (!API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 32000,
      system: "You are a meticulous release-notes engineer. You output complete, valid files only.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text = (json.content || []).map((b) => b.text || "").join("");
  const m = text.match(/```(?:js|javascript)?\s*([\s\S]*?)```/);
  const file = (m ? m[1] : text).trim();
  if (!file.includes("window.PROGRESS_DATA")) {
    throw new Error("Model output did not contain window.PROGRESS_DATA — refusing to write");
  }
  return file + "\n";
}

async function syncProject(proj, state) {
  console.log(`\n▶ ${proj.name}  (${proj.repo} @ ${proj.ref})`);
  const dataPath = join(ROOT, proj.dataFile);
  if (!existsSync(dataPath)) { console.log(`  ✗ ${proj.dataFile} not found, skipping`); return false; }

  const cloneUrl = GH_TOKEN
    ? `https://x-access-token:${GH_TOKEN}@github.com/${proj.repo}.git`
    : `https://github.com/${proj.repo}.git`;
  const dir = mkdtempSync(join(tmpdir(), "sync-"));
  try {
    sh("git", ["clone", "--depth", String(LOOKBACK), "--branch", proj.ref, cloneUrl, dir]);
    const head = sh("git", ["rev-parse", "HEAD"], dir);
    const last = !sinceAll && state[proj.repo]?.sha;

    let log, diffstat;
    if (last && last !== head) {
      log      = sh("git", ["log", "--no-merges", "--pretty=format:- %s", `${last}..HEAD`], dir);
      diffstat = sh("git", ["diff", "--stat", `${last}..HEAD`], dir);
    } else if (last === head) {
      console.log("  • already up to date");
      return false;
    } else {
      log      = sh("git", ["log", "--no-merges", "--pretty=format:- %s", `-${LOOKBACK}`], dir);
      diffstat = sh("git", ["diff", "--stat", "HEAD~1..HEAD"], dir);
    }
    if (diffstat.length > MAX_DIFF_BYTES) diffstat = diffstat.slice(0, MAX_DIFF_BYTES) + "\n…[truncated]";

    if (!log) { console.log("  • no new non-merge commits"); state[proj.repo] = { sha: head, at: new Date().toISOString() }; return false; }

    const docs        = gatherDocs(dir, proj.docs || []);
    const currentData = readFileSync(dataPath, "utf8");
    const prompt      = buildPrompt({ proj, currentData, log, diffstat, docs });

    console.log(`  • ${log.split("\n").length} new commit(s) → asking ${MODEL}…`);
    const newData = await callClaude(prompt);

    if (newData.trim() === currentData.trim()) {
      console.log("  • model returned no changes");
    } else if (dryRun) {
      console.log(`  • [dry-run] would rewrite ${proj.dataFile} (${newData.length} bytes)`);
    } else {
      writeFileSync(dataPath, newData);
      console.log(`  ✓ updated ${proj.dataFile}`);
    }
    state[proj.repo] = { sha: head, at: new Date().toISOString() };
    return !dryRun && newData.trim() !== currentData.trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

(async () => {
  const state = loadState();
  let changed = false;
  const projects = CONFIG.projects.filter((p) => !onlyProject || p.name === onlyProject);
  if (!projects.length) { console.error(`No project matched --project ${onlyProject}`); process.exit(1); }

  for (const proj of projects) {
    try { changed = (await syncProject(proj, state)) || changed; }
    catch (e) { console.error(`  ✗ ${proj.name}: ${e.message}`); process.exitCode = 1; }
  }

  if (!dryRun) writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
  console.log(`\n${changed ? "✓ changes written" : "• nothing to commit"}`);
  // Signal the workflow whether to commit
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: "a" });
  }
})();
