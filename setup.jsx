// setup.jsx — two-track GUI setup wizard.
//   Track A: run a project dashboard locally (companion server) — for anyone.
//   Track B: wire the self-updating portfolio pipeline — for the repo owner.
// Reuses companion.jsx (useCompanion live-ping + generateCompanionPy).

const { useState, useEffect } = React;

// ── small shared bits ────────────────────────────────────────
function Copy({ text, label = "copy" }) {
  const [done, setDone] = useState(false);
  return (
    <button className="copy" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400); });
    }}>{done ? "copied ✓" : label}</button>
  );
}
function Code({ children }) {
  return (
    <div className="codeblock">
      <Copy text={children} />
      <pre>{children}</pre>
    </div>
  );
}
function Step({ n, title, done, children }) {
  return (
    <div className={"step" + (done ? " done" : "")}>
      <div className="step-num">{done ? "✓" : n}</div>
      <div>
        <div className="step-title">{title}</div>
        <div className="step-body">{children}</div>
      </div>
    </div>
  );
}
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Track A: companion (consumer) ────────────────────────────
function CompanionTrack({ projects }) {
  const companion = useCompanion();
  const { port, setPort, repoPath, setRepoPath, status, info } = companion;
  const connected = status === "connected";
  const [proj, setProj] = useState(projects[0]?.name || "");

  const active = projects.find((p) => p.name === proj);
  const folderHint = active ? active.repo.split("/").pop() : "your-repo";

  return (
    <div>
      <Step n="1" title="Pick the project and your repo folder" done={!!repoPath}>
        <p>The companion is a tiny Python server that runs from your cloned repo and lets the dashboard
          run builds and talk to the Claude CLI on your machine. Nothing leaves your computer.</p>
        {projects.length > 1 &&
          <div className="field">
            <label>Project</label>
            <select value={proj} onChange={(e) => setProj(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", background: "var(--panel)", color: "var(--text)",
                border: "1px solid var(--line-2)", borderRadius: "var(--radius-s)", fontFamily: "var(--mono)", fontSize: 13 }}>
              {projects.map((p) => <option key={p.name} value={p.name}>{p.name} — {p.repo}</option>)}
            </select>
          </div>
        }
        <div className="grid2">
          <div className="field">
            <label>Port</label>
            <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value) || 7373)} />
          </div>
          <div className="field">
            <label>Repo folder (absolute path)</label>
            <input type="text" value={repoPath} placeholder={"/path/to/" + folderHint}
              onChange={(e) => setRepoPath(e.target.value)} />
          </div>
        </div>
        {active && <div className="callout">Clone it first: <code>git clone https://github.com/{active.repo}.git</code>{active.ref && active.ref !== "main" ? <> &nbsp;·&nbsp; branch <code>{active.ref}</code></> : null}</div>}
      </Step>

      <Step n="2" title="Download the companion server" done={false}>
        <p>Zero dependencies — just Python 3.9+ (and the <code>claude</code> CLI on PATH if you want AI features).</p>
        <div className="btn-row">
          <button className="btn primary" onClick={() => download("companion.py", window.generateCompanionPy(port), "text/x-python")}>
            ↓ Download companion.py
          </button>
        </div>
      </Step>

      <Step n="3" title="Run it from your repo root" done={connected}>
        <Code>{`cd "${repoPath || "/path/to/repo"}"\npython companion.py --port ${port}`}</Code>
        <div className="callout">Windows, if the CLI isn't auto-found:
          <Code>{`$env:CLAUDE_CLI="C:\\path\\to\\claude.exe"\npython companion.py --port ${port}`}</Code>
        </div>
      </Step>

      <Step n="4" title="Confirm the connection" done={connected}>
        <p>This page is pinging <code>localhost:{port}</code> live:</p>
        <div className={"status " + (connected ? "on" : "off")}>
          <span className="dot"></span>
          {connected
            ? `Connected · ${info?.cwd ? "cwd: " + info.cwd : "ready"}`
            : `Waiting for companion on localhost:${port}…`}
        </div>
        {connected && <div className="callout" style={{ marginTop: 12 }}>
          You're set. Open any project dashboard and the <strong>Tools</strong> drawer — Run buttons and
          “Ask Claude” are now live, gated on this connection.</div>}
      </Step>
    </div>
  );
}

// ── Track B: self-updating pipeline (owner) ──────────────────
function notifyYml(repo, branch, portfolio) {
  return `# .github/workflows/notify-portfolio.yml — paste into ${repo}
name: Notify portfolio
on:
  push:
    branches: ["${branch}"]
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Dispatch to portfolio repo
        run: |
          curl -sS -X POST \\
            -H "Accept: application/vnd.github+json" \\
            -H "Authorization: Bearer \${{ secrets.PORTFOLIO_DISPATCH_TOKEN }}" \\
            https://api.github.com/repos/${portfolio}/dispatches \\
            -d '{"event_type":"source-updated","client_payload":{"repo":"\${{ github.repository }}","sha":"\${{ github.sha }}"}}'
`;
}

function PipelineTrack({ config }) {
  const presets = (config.projects || []).map((p) => ({ repo: p.repo, branch: p.ref || "main" }));
  const [portfolio, setPortfolio] = useState(() => localStorage.getItem("setup_portfolio") || config.portfolioRepo || "owner/portfolio");
  const [repos, setRepos] = useState(presets.length ? presets : [{ repo: "owner/repo", branch: "main" }]);
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("setup_checks") || "{}"); } catch { return {}; }
  });
  useEffect(() => localStorage.setItem("setup_portfolio", portfolio), [portfolio]);
  useEffect(() => localStorage.setItem("setup_checks", JSON.stringify(checks)), [checks]);
  const toggle = (k) => setChecks((c) => ({ ...c, [k]: !c[k] }));
  const pagesUrl = "https://" + portfolio.replace("/", ".github.io/") + "/";

  const setRepo = (i, field, v) => setRepos((rs) => rs.map((r, j) => j === i ? { ...r, [field]: v } : r));

  return (
    <div>
      <div className="callout">This wires the loop: <strong>push code → CI regenerates that project's
        <code>data.js</code> with the Claude API → GitHub Pages redeploys.</strong> One-time, ~15 min.
        Everything below is also written to <code>AUTOMATION.md</code> in the repo.</div>

      <Step n="1" title="Name your portfolio repo" done={!!portfolio}>
        <div className="field">
          <label>owner/repo (the repo hosting this site)</label>
          <input type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
        </div>
        <p>Live site will be <a href={pagesUrl} target="_blank" rel="noopener">{pagesUrl}</a></p>
      </Step>

      <Step n="2" title="Turn on GitHub Pages" done={!!checks.pages}>
        <p>In the portfolio repo: <strong>Settings → Pages → Source: GitHub Actions</strong>.
          The included <code>deploy-pages.yml</code> publishes the repo root on every push to <code>main</code>.</p>
        <label className="check"><input type="checkbox" checked={!!checks.pages} onChange={() => toggle("pages")} /> Pages enabled</label>
      </Step>

      <Step n="3" title="Add the Anthropic key secret" done={!!checks.key}>
        <p>In the portfolio repo: <strong>Settings → Secrets and variables → Actions → New repository secret</strong>.</p>
        <ul>
          <li><span className="secret-pill">ANTHROPIC_API_KEY</span> — from console.anthropic.com (always required)</li>
          <li><span className="secret-pill">GH_PAT</span> — only if a source repo is <em>private</em>: fine-grained PAT, <strong>Contents: read</strong> on it</li>
        </ul>
        <label className="check"><input type="checkbox" checked={!!checks.key} onChange={() => toggle("key")} /> Secret(s) added</label>
      </Step>

      <Step n="4" title="Wire each source repo to ping the portfolio" done={!!checks.notify}>
        <p>For each project: add a <span className="secret-pill">PORTFOLIO_DISPATCH_TOKEN</span> secret
          (PAT with <strong>Contents: write</strong> on {portfolio || "the portfolio"}), then commit this workflow
          to <code>.github/workflows/notify-portfolio.yml</code> in that repo:</p>
        {repos.map((r, i) => (
          <div key={i} style={{ margin: "14px 0", padding: "12px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6 }}>
            <div className="grid2">
              <div className="field" style={{ margin: 0 }}>
                <label>source repo</label>
                <input type="text" value={r.repo} onChange={(e) => setRepo(i, "repo", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>branch</label>
                <input type="text" value={r.branch} onChange={(e) => setRepo(i, "branch", e.target.value)} />
              </div>
            </div>
            <div className="btn-row" style={{ marginBottom: 0 }}>
              <Copy text={notifyYml(r.repo, r.branch, portfolio)} label="copy workflow" />
              <button className="btn" onClick={() => download("notify-portfolio.yml", notifyYml(r.repo, r.branch, portfolio), "text/yaml")}>↓ .yml</button>
            </div>
          </div>
        ))}
        <label className="check"><input type="checkbox" checked={!!checks.notify} onChange={() => toggle("notify")} /> All source repos wired</label>
      </Step>

      <Step n="5" title="Done — test it" done={false}>
        <p>Push a commit to any source repo (or in the portfolio repo run
          <strong> Actions → “Sync dashboard content” → Run workflow</strong>). Within a minute the matching
          dashboard reflects it and the site redeploys. A nightly cron is the safety net.</p>
        <div className="callout warn">Guardrail: the sync script refuses to write any output missing
          <code>window.PROGRESS_DATA</code>, and the model is told to change only what commits/docs support —
          so a bad response can't blank a file. Every change is a normal commit you can review or revert.</div>
      </Step>
    </div>
  );
}

// ── App shell ────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState(() => location.hash === "#pipeline" ? "pipeline" : "companion");
  const [config, setConfig] = useState(null);
  useEffect(() => { location.hash = tab; }, [tab]);
  useEffect(() => {
    fetch("sync.config.json")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(r.status)))
      .then(setConfig)
      .catch(() => setConfig({ portfolioRepo: "owner/portfolio", projects: [] }));
  }, []);

  const projects = (config && config.projects && config.projects.length)
    ? config.projects
    : [{ name: "project", repo: "owner/repo", ref: "main" }];

  return (
    <>
      <div className="topbar">
        <a href="index.html" className="back-link">← Logan Brunet · Portfolio</a>
        <span className="top-title">Setup</span>
        <a href="AUTOMATION.md" className="back-link">Docs ↗</a>
      </div>
      <div className="wrap">
        <div className="hero">
          <h1>Setup</h1>
          <p>Two paths. Run a project dashboard against your own machine, or wire the pipeline that keeps
            this portfolio updating itself from your commits.</p>
        </div>
        <div className="tabs">
          <button className={"tab" + (tab === "companion" ? " active" : "")} onClick={() => setTab("companion")}>Run a dashboard locally</button>
          <button className={"tab" + (tab === "pipeline" ? " active" : "")} onClick={() => setTab("pipeline")}>Auto-update my portfolio</button>
        </div>
        {!config
          ? <div style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>Loading config…</div>
          : tab === "companion" ? <CompanionTrack projects={projects} /> : <PipelineTrack config={config} />}
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
