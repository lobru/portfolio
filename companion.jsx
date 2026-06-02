// companion.jsx — bridges the dashboard to a local Python companion server.
// Enables: run build/deploy scripts, pipe feature comments to the Claude CLI.
//
// Generate the server via Tools → "Companion server", then:
//   python companion.py  (stdlib only + claude CLI in PATH)

const { useState: useCState, useEffect: useCEffect, useCallback } = React;

const COMPANION_LS_KEY = "imgui_companion_config";

const defaultConfig = () => {
  try { return JSON.parse(localStorage.getItem(COMPANION_LS_KEY)) || {}; } catch { return {}; }
};
function saveConfig(cfg) {
  try { localStorage.setItem(COMPANION_LS_KEY, JSON.stringify(cfg)); } catch {}
}

// ────────────────────────────────────────────────────────────
// useCompanion
// ────────────────────────────────────────────────────────────
function useCompanion() {
  const saved = defaultConfig();
  const [port,     setPortState] = useCState(saved.port || 7373);
  const [repoPath, setRepoState] = useCState(saved.repoPath || "");
  const [status,   setStatus]    = useCState("disconnected");
  const [info,     setInfo]      = useCState(null);

  const setPort     = (v) => { setPortState(v); saveConfig({ ...defaultConfig(), port: v }); };
  const setRepoPath = (v) => { setRepoState(v); saveConfig({ ...defaultConfig(), repoPath: v }); };

  const base = `http://localhost:${port}`;

  const ping = useCallback(async () => {
    try {
      const r = await fetch(`${base}/status`, {
        signal: AbortSignal.timeout(1500),
        headers: { "Accept": "application/json" },
      });
      if (r.ok) { setInfo(await r.json()); setStatus("connected"); }
      else setStatus("error");
    } catch { setStatus("disconnected"); }
  }, [base]);

  useCEffect(() => {
    ping();
    const id = setInterval(ping, 5000);
    return () => clearInterval(id);
  }, [ping]);

  const runScript = useCallback(async (script, type = "auto") => {
    try {
      const r = await fetch(`${base}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, type, repoPath }),
        signal: AbortSignal.timeout(180000),
      });
      return await r.json();
    } catch (e) { return { error: String(e.message || e) }; }
  }, [base, repoPath]);

  const askClaude = useCallback(async (prompt) => {
    try {
      const r = await fetch(`${base}/claude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(120000),
      });
      return await r.json();
    } catch (e) { return { error: String(e.message || e) }; }
  }, [base]);

  return { port, setPort, repoPath, setRepoPath, status, info, runScript, askClaude, ping };
}

// ────────────────────────────────────────────────────────────
// CompanionBanner
// ────────────────────────────────────────────────────────────
function CompanionBanner({ companion }) {
  const { status, info, port, ping } = companion;
  const label =
    status === "connected"
      ? `● Connected · localhost:${port} · cwd: ${info?.cwd || "?"}`
      : `○ Companion not running · localhost:${port}`;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", marginBottom: 12,
      background: "var(--bg)", border: "1px solid var(--line)",
      borderRadius: "var(--radius-s)",
      fontFamily: "var(--font-mono)", fontSize: 11,
    }}>
      <span style={{ color: status === "connected" ? "var(--shipped)" : "var(--muted)" }}>{label}</span>
      <button onClick={ping} style={{
        fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "var(--muted)",
        border: "1px solid var(--line)", borderRadius: 3, padding: "4px 8px", cursor: "pointer",
      }}>retry</button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// AskClaudeBar — mounts inside an expanded Card
// ────────────────────────────────────────────────────────────
function AskClaudeBar({ card, companion }) {
  const [open,   setOpen]   = useCState(false);
  const [text,   setText]   = useCState("");
  const [status, setStatus] = useCState("idle");
  const [reply,  setReply]  = useCState("");
  const connected = companion?.status === "connected";

  const buildPrompt = () => [
    `You are reviewing a code change in the ImGuiColorTextEdit project.`,
    "",
    `Feature: ${card.title}`,
    `Group: ${card.group}`,
    `Status: ${card.status}`,
    `Description: ${card.blurb}`,
    ...(card.detail ? ["", "Detail:", card.detail] : []),
    ...(card.files?.length ? ["", "Files: " + card.files.join(", ")] : []),
    ...(card.surface?.length ? ["", "API surface:", ...card.surface.map((s) => "  • " + s)] : []),
    "", "Developer comment:", text,
  ].join("\n");

  const onSend = async () => {
    if (!text.trim()) return;
    if (connected) {
      setStatus("working"); setReply("");
      const res = await companion.askClaude(buildPrompt());
      if (res.error) { setReply(res.error); setStatus("err"); }
      else { setReply(res.output); setStatus("ok"); }
    } else {
      // Fallback: use window.claude if available
      if (window.claude?.complete) {
        setStatus("working"); setReply("");
        try {
          const out = await window.claude.complete(buildPrompt());
          setReply(out); setStatus("ok");
        } catch (e) { setReply(String(e)); setStatus("err"); }
      } else {
        await navigator.clipboard.writeText(buildPrompt()).catch(() => {});
        setReply("Prompt copied to clipboard — paste into your Claude session.");
        setStatus("ok");
      }
    }
  };

  return (
    <div className="card-section" style={{ marginTop: 12 }}>
      {!open ? (
        <button
          className="tool-btn"
          style={{ width: "100%", justifyContent: "center", display: "flex", gap: 8, alignItems: "center" }}
          onClick={() => setOpen(true)}
        >
          <span style={{ color: connected ? "var(--shipped)" : "var(--muted)" }}>
            {connected ? "●" : "◌"}
          </span>
          Ask Claude about this feature
        </button>
      ) : (
        <div style={{
          border: "1px solid var(--line)", borderRadius: "var(--radius-s)",
          background: "var(--bg)", padding: 12,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {connected ? `→ Claude CLI · localhost:${companion.port}` : "→ claude (built-in)"}
          </div>
          <textarea style={{
            width: "100%", minHeight: 80,
            background: "var(--panel)", color: "var(--text)",
            border: "1px solid var(--line)", borderRadius: 3,
            padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 12,
            lineHeight: 1.4, resize: "vertical",
          }}
            placeholder="e.g. 'What edge cases should I test? Any thread-safety risks?'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend(); }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="tool-btn primary" onClick={onSend} disabled={!text.trim() || status === "working"}>
              {status === "working" ? "Asking…" : "→ Ask Claude"}
            </button>
            <button className="tool-btn" onClick={() => { setOpen(false); setText(""); setReply(""); setStatus("idle"); }}>Cancel</button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>⌘↵ to send</span>
          </div>
          {reply && (
            <div style={{
              background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 3,
              padding: 10, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.5,
              color: status === "err" ? "var(--open)" : "var(--text)",
              maxHeight: 260, overflowY: "auto", whiteSpace: "pre-wrap",
            }}>{reply}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Python companion server source generator
// ────────────────────────────────────────────────────────────
function generateCompanionPy(port = 7373) {
  return `#!/usr/bin/env python3
"""companion.py — ImGuiColorTextEdit Dashboard companion server.
Bridges the dashboard to your local machine.

  POST /run     — execute a build/deploy script
  POST /claude  — run \`claude -p "prompt"\` and return output
  GET  /status  — health-check

Usage: python companion.py [--port ${port}]
Requirements: Python 3.9+, Claude CLI in PATH
"""
import http.server, json, os, subprocess, sys, tempfile, argparse

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=${port})
    p.add_argument("--claude-cli", default=os.environ.get("CLAUDE_CLI", "claude"))
    return p.parse_args()

ARGS = parse_args()

class Handler(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_GET(self):
        self.send_response(200); self.cors()
        self.send_header("Content-Type", "application/json"); self.end_headers()
        self.wfile.write(json.dumps({"connected": True, "port": ARGS.port,
            "cwd": os.getcwd(), "platform": sys.platform}).encode())
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n)) if n else {}
        result = self._run_script(body) if self.path == "/run" else \
                 self._run_claude(body) if self.path == "/claude" else {"error": "unknown"}
        data = json.dumps(result).encode()
        self.send_response(200); self.cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers()
        self.wfile.write(data)
    def _run_script(self, body):
        script = body.get("script", ""); cwd = body.get("repoPath", "") or os.getcwd()
        ext = ".ps1" if sys.platform == "win32" else ".sh"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False, mode="w") as f:
            f.write(script); fname = f.name
        try:
            cmd = ["powershell", "-ExecutionPolicy", "Bypass", "-File", fname] \
                  if sys.platform == "win32" else ["bash", fname]
            if sys.platform != "win32": os.chmod(fname, 0o755)
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300, cwd=cwd)
            return {"stdout": r.stdout, "stderr": r.stderr, "returncode": r.returncode}
        except Exception as e: return {"error": str(e)}
        finally:
            try: os.unlink(fname)
            except: pass
    def _run_claude(self, body):
        try:
            r = subprocess.run([ARGS.claude_cli, "-p", body.get("prompt","")],
                capture_output=True, text=True, timeout=120)
            return {"output": r.stdout or r.stderr, "returncode": r.returncode}
        except FileNotFoundError:
            return {"error": f"Claude CLI not found at '{ARGS.claude_cli}'."}
        except Exception as e: return {"error": str(e)}
    def log_message(self, fmt, *args): print(f"[companion] {fmt % args}")

if __name__ == "__main__":
    srv = http.server.HTTPServer(("localhost", ARGS.port), Handler)
    print(f"[companion] http://localhost:{ARGS.port}")
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
`;
}

Object.assign(window, { useCompanion, CompanionBanner, AskClaudeBar, generateCompanionPy });
