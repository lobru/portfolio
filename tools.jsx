// tools.jsx — AI-powered + scaffold tools for ImGuiColorTextEdit dashboard.

const { useState: useToolState } = React;

const TOOL_DEFS = [
  { id: "companion",   name: "Companion server",        kind: "local",    blurb: "Generate the local Python companion server. Enables Run buttons and Ask Claude CLI on every card." },
  { id: "sync",        name: "Sync from docs",           kind: "ai",       blurb: "Paste new Claude Code markdown. Claude extracts shipped features, open issues, and plan items → data.js patch." },
  { id: "report",      name: "Generate status report",   kind: "ai",       blurb: "One-paragraph human-readable summary of where the project stands. Good for stand-ups or pinging stakeholders." },
  { id: "release",     name: "Draft release notes",      kind: "ai",       blurb: "Markdown release notes for shipped features, grouped by area, ready to paste into a GitHub release." },
  { id: "buildscript", name: "Build script (CMake)",     kind: "scaffold", blurb: "CMake build script for Windows (PowerShell) or Linux (bash). Hit Run if companion is running." },
  { id: "deploy",      name: "Deploy checklist",         kind: "scaffold", blurb: "Pre-deploy checklist derived from open issues + the fix plan. Download or run via companion." },
  { id: "snapshot",    name: "Snapshot data.js",         kind: "export",   blurb: "Download current data.js verbatim — archive this point-in-time view or feed it into another tool." },
];

function ToolsFAB({ onOpen }) {
  return (
    <button className="tools-fab" onClick={onOpen} title="Open tools drawer">
      <span className="fab-dot"></span>Tools
    </button>
  );
}

function ToolsDrawer({ data, companion, onClose }) {
  const [active, setActive] = useToolState(null);
  return (
    <>
      <div className="tools-overlay" onClick={onClose}></div>
      <aside className="tools-drawer">
        <div className="tools-drawer-head">
          <span className="tools-drawer-title">Tools</span>
          <button className="tools-drawer-close" onClick={onClose}>esc · close</button>
        </div>
        <div className="tools-drawer-body">
          <CompanionBanner companion={companion} />
          {TOOL_DEFS.map((t) => (
            <div key={t.id}>
              <div className={"tool-card " + (active === t.id ? "active" : "")}
                onClick={() => setActive(active === t.id ? null : t.id)}>
                <div className="tool-card-head">
                  <span className="tool-card-name">{t.name}</span>
                  <span className={"tool-card-kind " + t.kind}>{t.kind}</span>
                </div>
                <div className="tool-card-blurb">{t.blurb}</div>
              </div>
              {active === t.id && <ToolBody id={t.id} data={data} companion={companion} />}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function ToolBody({ id, data, companion }) {
  switch (id) {
    case "companion":   return <CompanionTool companion={companion} />;
    case "sync":        return <SyncTool data={data} companion={companion} />;
    case "report":      return <ReportTool data={data} companion={companion} />;
    case "release":     return <ReleaseTool data={data} companion={companion} />;
    case "buildscript": return <BuildScriptTool data={data} companion={companion} />;
    case "deploy":      return <DeployTool data={data} companion={companion} />;
    case "snapshot":    return <SnapshotTool data={data} />;
    default:            return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────

function useClaudeRun(companion) {
  const [status, setStatus] = useToolState("idle");
  const [output, setOutput] = useToolState("");
  const [err, setErr]       = useToolState("");
  const run = async (prompt) => {
    setStatus("working"); setOutput(""); setErr("");
    try {
      // 1) Prefer the local companion's Claude CLI when it's connected.
      if (companion && companion.status === "connected") {
        const res = await companion.askClaude(prompt);
        if (res && res.error) { setErr(res.error); setStatus("err"); return; }
        setOutput((res && res.output) || ""); setStatus("ok");
        return;
      }
      // 2) Fall back to the in-artifact runtime model if present.
      if (window.claude?.complete) {
        const text = await window.claude.complete(prompt);
        setOutput(text); setStatus("ok");
        return;
      }
      // 3) Static host, no companion: hand the user the prompt to run themselves.
      await navigator.clipboard?.writeText?.(prompt).catch(() => {});
      setOutput(
        "No AI runner available. Connect the local companion (it routes to the Claude CLI), " +
        "or open this inside the live Claude artifact.\n\n" +
        "→ The generated prompt has been copied to your clipboard — paste it into " +
        "Claude (or any LLM) to get the result.\n\n———— PROMPT ————\n\n" + prompt
      );
      setStatus("info");
    } catch (e) { setErr(String(e?.message || e)); setStatus("err"); }
  };
  return { status, output, err, run };
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
}

function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatusLine({ status, err, okText = "ready" }) {
  if (status === "idle") return null;
  const cls = status === "working" ? "working" : status === "err" ? "err" : status === "info" ? "info" : "ok";
  return (
    <div className={"tool-status " + cls}>
      {status === "working" && "▮ Running…"}
      {status === "ok"      && `✓ ${okText}`}
      {status === "info"    && "→ prompt copied — paste into Claude to run"}
      {status === "err"     && `✗ ${err}`}
    </div>
  );
}

function OutputBlock({ text, downloadName, downloadMime = "text/markdown" }) {
  if (!text) return null;
  return (
    <>
      <pre className="tool-output">{text}</pre>
      <div className="tool-actions">
        <button className="tool-btn" onClick={() => copyToClipboard(text)}>Copy</button>
        {downloadName && (
          <button className="tool-btn" onClick={() => downloadText(downloadName, text, downloadMime)}>
            Download {downloadName}
          </button>
        )}
      </div>
    </>
  );
}

// ── Companion config ─────────────────────────────────────────

function CompanionTool({ companion }) {
  const { port, setPort, repoPath, setRepoPath, status } = companion;
  const [downloaded, setDownloaded] = useToolState(false);
  const connected = status === "connected";

  const download = () => {
    const blob = new Blob([window.generateCompanionPy(port)], { type: "text/x-python" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "companion.py" });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url); setDownloaded(true);
  };

  return (
    <div className="tool-body">
      <div className="tool-card-blurb" style={{ marginBottom: 8 }}>
        Zero-dependency Python 3 server. Run from your repo root — bridges the dashboard to your local machine.
      </div>
      <div className="card-section-label">Configuration</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Port", value: port, setter: (v) => setPort(Number(v)), type: "number", placeholder: "" },
          { label: "Repo root", value: repoPath, setter: setRepoPath, type: "text", placeholder: "/path/to/ImGuiColorTextEdit" },
        ].map(({ label, value, setter, type, placeholder }) => (
          <div key={label}>
            <div className="tool-status" style={{ marginBottom: 4 }}>{label}</div>
            <input type={type} value={value} placeholder={placeholder} onChange={(e) => setter(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", background: "var(--panel)", color: "var(--text)",
                border: "1px solid var(--line)", borderRadius: 3, fontFamily: "var(--font-mono)", fontSize: 12 }} />
          </div>
        ))}
      </div>
      <div className="tool-actions" style={{ marginTop: 6 }}>
        <button className="tool-btn primary" onClick={download}>
          {downloaded ? "Re-download companion.py (v2)" : "Download companion.py (v2)"}
        </button>
      </div>
      {downloaded && (
        <pre className="tool-output" style={{ marginTop: 8, fontSize: 11 }}>
{`python companion.py --port ${port}
# Windows: $env:CLAUDE_CLI="C:\\path\\to\\claude.exe"; python companion.py`}
        </pre>
      )}
      {connected && <div className="tool-status ok" style={{ marginTop: 6 }}>✓ Companion connected · Ask Claude + Run buttons active.</div>}
    </div>
  );
}

// ── Sync from docs ───────────────────────────────────────────

function SyncTool({ data, companion }) {
  const [pasted, setPasted] = useToolState("");
  const { status, output, err, run } = useClaudeRun(companion);

  const onRun = () => {
    if (!pasted.trim()) return;
    const prompt = `You are updating the data model behind a progress dashboard for ImGuiColorTextEdit.

CURRENT card ids (don't duplicate): ${data.cards.map((c) => c.id).join(", ")}.

Card shape: { id, title, status: "shipped"|"in-progress"|"open", group, tags[], blurb, detail?, files?[] }
Symptom shape: { id, title, detail, severity: "high"|"medium"|"low" }
Plan shape: { step, title, detail, checks?[], state }
Milestone shape: { date, label, kind: "ship"|"in-progress"|"audit"|"next" }

The user pasted new Claude Code progress notes. Extract NEW shipped features, in-progress fixes, open issues, plan items, milestones, or file changes. Output a JSON object:

{ "newCards": [...], "newSymptoms": [...], "newPlanItems": [...], "newMilestones": [...], "vitalsDelta": {...}, "notes": "..." }

Omit empty arrays. Use kebab-case ids. Blurbs ≤ 18 words. Return ONLY the JSON, no preamble.

PASTED NOTES:
---
${pasted}
---`;
    run(prompt);
  };

  return (
    <div className="tool-body">
      <textarea placeholder="Paste new Claude Code output — shipped features, open issues, plan items…"
        value={pasted} onChange={(e) => setPasted(e.target.value)} />
      <div className="tool-actions">
        <button className="tool-btn primary" onClick={onRun} disabled={!pasted.trim() || status === "working"}>Extract patch</button>
        <button className="tool-btn" onClick={() => setPasted("")} disabled={!pasted}>Clear</button>
      </div>
      <StatusLine status={status} err={err} okText="JSON patch ready" />
      <OutputBlock text={output} downloadName="data-patch.json" downloadMime="application/json" />
    </div>
  );
}

// ── Status report ────────────────────────────────────────────

function ReportTool({ data, companion }) {
  const { status, output, err, run } = useClaudeRun(companion);
  const onRun = () => {
    const shipped  = data.cards.filter((c) => c.status === "shipped").length;
    const inprog   = data.cards.filter((c) => c.status === "in-progress").length;
    const recent   = data.milestones.filter((m) => m.kind === "ship" || m.kind === "in-progress").slice(-5);
    const prompt = `Write a 4-sentence status report for ImGuiColorTextEdit (v${data.meta.version}), suitable for posting in a team channel or GitHub discussion.

Numbers: ${shipped} shipped, ${inprog} in progress, ${data.symptoms.length} open issues.
Recent milestones:\n${recent.map((m) => "- " + m.date + " · " + m.label).join("\n")}
Open issues:\n${data.symptoms.map((s) => "- " + s.title + " (" + s.severity + ")").join("\n")}

Tone: confident, plain English, no jargon. End with the single biggest unblocker. Prose only.`;
    run(prompt);
  };
  return (
    <div className="tool-body">
      <div className="tool-actions">
        <button className="tool-btn primary" onClick={onRun} disabled={status === "working"}>Generate report</button>
      </div>
      <StatusLine status={status} err={err} okText="report drafted" />
      <OutputBlock text={output} downloadName="status-report.md" />
    </div>
  );
}

// ── Release notes ────────────────────────────────────────────

function ReleaseTool({ data, companion }) {
  const { status, output, err, run } = useClaudeRun(companion);
  const onRun = () => {
    const shipped  = data.cards.filter((c) => c.status === "shipped");
    const byGroup  = {};
    shipped.forEach((c) => (byGroup[c.group] = byGroup[c.group] || []).push(c));
    const groupsText = Object.entries(byGroup)
      .map(([g, cs]) => `### ${g}\n` + cs.map((c) => `- ${c.title} — ${c.blurb}`).join("\n"))
      .join("\n\n");
    const prompt = `Draft Markdown release notes for ImGuiColorTextEdit v${data.meta.version}, suitable for a GitHub release.

Shipped features, grouped:\n\n${groupsText}

Format:
- ## tagline (punchy, ≤ 14 words)
- Short intro paragraph (2 sentences)
- Sections: "New features", "Bug fixes", "Build & integration" — consolidate intelligently
- Footer: "Known issues" listing open symptoms briefly

Return only the markdown.`;
    run(prompt);
  };
  return (
    <div className="tool-body">
      <div className="tool-actions">
        <button className="tool-btn primary" onClick={onRun} disabled={status === "working"}>Draft release notes</button>
      </div>
      <StatusLine status={status} err={err} okText="release notes drafted" />
      <OutputBlock text={output} downloadName={`RELEASE-v${data.meta.version}.md`} />
    </div>
  );
}

// ── Build script ─────────────────────────────────────────────

function BuildScriptTool({ data, companion }) {
  const [os, setOs]         = useToolState("windows");
  const [config, setConfig] = useToolState("RelWithDebInfo");
  const [runStatus, setRunStatus] = useToolState("idle");
  const [runOutput, setRunOutput] = useToolState("");
  const connected = companion?.status === "connected";
  const text = renderBuildScript(os, config, data);

  const onRun = async () => {
    setRunStatus("working"); setRunOutput("");
    const res = await companion.runScript(text, os === "windows" ? "ps1" : "sh");
    if (res.error) { setRunOutput(res.error); setRunStatus("err"); }
    else { setRunOutput((res.stdout || "") + (res.stderr ? "\n[stderr]\n" + res.stderr : "")); setRunStatus(res.returncode === 0 ? "ok" : "err"); }
  };

  return (
    <div className="tool-body">
      <div className="tool-actions">
        {["windows", "linux"].map((p) => (
          <button key={p} className={"tool-btn" + (os === p ? " primary" : "")} onClick={() => setOs(p)}>
            {p === "windows" ? "Windows · PowerShell" : "Linux · bash"}
          </button>
        ))}
      </div>
      <div className="tool-actions">
        {["Debug", "RelWithDebInfo", "Release"].map((c) => (
          <button key={c} className={"tool-btn" + (config === c ? " primary" : "")} onClick={() => setConfig(c)}>{c}</button>
        ))}
      </div>
      <OutputBlock text={text} downloadName={os === "windows" ? "build.ps1" : "build.sh"}
        downloadMime={os === "windows" ? "application/x-powershell" : "application/x-sh"} />
      <div className="tool-actions">
        {connected
          ? <button className="tool-btn primary" onClick={onRun} disabled={runStatus === "working"}>
              {runStatus === "working" ? "▮ Building…" : "▶ Run via companion"}
            </button>
          : <div className="tool-status">○ Start companion.py to enable Run</div>}
      </div>
      {runOutput && <pre className="tool-output" style={{ color: runStatus === "err" ? "var(--open)" : "var(--text)" }}>{runOutput}</pre>}
      <StatusLine status={runStatus} err={runOutput} okText="build exited 0" />
    </div>
  );
}

function renderBuildScript(os, config, data) {
  const project = data.meta.project;
  const version = data.meta.version;
  // The companion runs scripts FROM the repo folder (cwd = repoPath), so the
  // root is just "." — never hardcode the repo path or it doubles up.
  if (os === "windows") return `# build.ps1 — ${project} v${version}
# Generated by Progress Dashboard · ${data.meta.lastUpdated}
# Run from the repo root (the companion sets that automatically).
$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }
$BuildDir = Join-Path $RepoRoot "build"
$Config   = "${config}"

Push-Location $RepoRoot
try {
  Write-Host "[1/4] Configuring CMake · $Config"
  if (-not (Test-Path $BuildDir)) { New-Item -ItemType Directory $BuildDir | Out-Null }
  cmake -S . -B $BuildDir -A x64

  Write-Host "[2/4] Building example (static)"
  cmake --build $BuildDir --config $Config -- /m

  Write-Host "[3/4] Building shared lib (DLL)"
  cmake -S . -B "$BuildDir-shared" -A x64 -DTEXTEDITOR_BUILD_SHARED=ON
  cmake --build "$BuildDir-shared" --config $Config -- /m

  Write-Host "[4/4] Done · $BuildDir\\bin\\$Config"
} finally { Pop-Location }
`;
  return `#!/usr/bin/env bash
# build.sh — ${project} v${version}
# Generated by Progress Dashboard · ${data.meta.lastUpdated}
# Run from the repo root (the companion sets that automatically).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"
BUILD_DIR="$REPO_ROOT/build"
CONFIG="${config}"

cd "$REPO_ROOT"
echo "[1/4] Configuring CMake · $CONFIG"
mkdir -p "$BUILD_DIR"
cmake -S . -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE="$CONFIG"

echo "[2/4] Building example (static)"
cmake --build "$BUILD_DIR" --config "$CONFIG" -- -j"\$(nproc)"

echo "[3/4] Building shared lib"
cmake -S . -B "$BUILD_DIR-shared" -DCMAKE_BUILD_TYPE="$CONFIG" -DTEXTEDITOR_BUILD_SHARED=ON
cmake --build "$BUILD_DIR-shared" --config "$CONFIG" -- -j"\$(nproc)"

echo "[4/4] Done · $BUILD_DIR"
`;
}

// ── Deploy checklist ─────────────────────────────────────────

function DeployTool({ data, companion }) {
  const [runStatus, setRunStatus] = useToolState("idle");
  const [runOutput, setRunOutput] = useToolState("");
  const connected = companion?.status === "connected";
  const text = renderDeployChecklist(data);

  const onRun = async () => {
    setRunStatus("working"); setRunOutput("");
    // Companion picks the interpreter by OS (PowerShell on Windows), so avoid
    // bash-only syntax like '||'. These commands are valid in both shells.
    const script =
      `echo "=== Deploy checklist · ${data.meta.project} v${data.meta.version} ==="\n` +
      `echo "Companion reachable. Checking build tools…"\n` +
      `cmake --version\n` +
      `git --version`;
    const res = await companion.runScript(script);
    if (res.error) { setRunOutput(res.error); setRunStatus("err"); }
    else { setRunOutput((res.stdout || "") + (res.stderr || "")); setRunStatus("ok"); }
  };

  return (
    <div className="tool-body">
      <OutputBlock text={text} downloadName="DEPLOY.md" />
      <div className="tool-actions">
        {connected
          ? <button className="tool-btn primary" onClick={onRun} disabled={runStatus === "working"}>
              {runStatus === "working" ? "▮ Running…" : "▶ Verify environment via companion"}
            </button>
          : <div className="tool-status">○ Start companion.py to verify environment</div>}
      </div>
      {runOutput && <pre className="tool-output">{runOutput}</pre>}
    </div>
  );
}

function renderDeployChecklist(data) {
  const lines = [
    `# Deploy checklist · ${data.meta.project} v${data.meta.version}`,
    `_Generated ${data.meta.lastUpdated}_`,
    "",
    "## Blockers — resolve before release",
  ];
  if (!data.symptoms.length) lines.push("- _none_");
  data.symptoms.forEach((s) => {
    lines.push(`- [ ] **(${s.severity})** ${s.title}`);
    lines.push(`      ↳ ${s.detail.slice(0, 120)}…`);
  });
  lines.push("", "## Fix-plan acceptance");
  data.plan.forEach((p) => {
    lines.push(`- [ ] **§${p.step} — ${p.title}**`);
    (p.checks || []).forEach((c) => lines.push(`  - [ ] ${c}`));
  });
  lines.push("", "## Build verification");
  lines.push("- [ ] `cmake -S . -B build && cmake --build build` on macOS, Linux, Windows");
  lines.push("- [ ] `cmake -S . -B build-shared -DTEXTEDITOR_BUILD_SHARED=ON && cmake --build build-shared`");
  lines.push("- [ ] Run example app on all 3 platforms — editor renders and accepts input");
  lines.push("- [ ] Verify all 6 runtime .lang files load and highlight correctly");
  lines.push("- [ ] Test script runner F5 on .py / .lua / .sh");
  lines.push("- [ ] Fold engine: fold all (Ctrl+K 0), unfold all (Ctrl+K J), Python indent fold");
  lines.push("- [ ] Header/source toggle (Alt+O) for .h ↔ .cpp");
  lines.push("- [ ] File dialog shows drives + favourites sidebar");
  lines.push("", "## Shipping");
  lines.push("- [ ] Tag `git tag -a v" + data.meta.version + " -m 'release notes'`");
  lines.push("- [ ] Draft release notes via Tools → 'Draft release notes'");
  lines.push("- [ ] Push tag and publish GitHub release");
  lines.push("- [ ] Sync changes back to ObjectTalk master (side-task 01)");
  return lines.join("\n");
}

// ── Snapshot ─────────────────────────────────────────────────

function SnapshotTool({ data }) {
  const text = "// data.js · snapshot " + data.meta.lastUpdated + "\n" +
    "window.PROGRESS_DATA = " + JSON.stringify(data, null, 2) + ";";
  return (
    <div className="tool-body">
      <div className="tool-status">Downloads the current dataset verbatim for archiving or diffing.</div>
      <OutputBlock
        text={text.slice(0, 1400) + (text.length > 1400 ? "\n…(" + (text.length - 1400) + " more chars in download)" : "")}
        downloadName={`data-${data.meta.lastUpdated}.js`}
        downloadMime="application/javascript"
      />
    </div>
  );
}

Object.assign(window, { ToolsFAB, ToolsDrawer });
