// companion.jsx — bridges the dashboard to a local Python companion server.
// Enables: run build/deploy scripts, pipe feature comments to the Claude CLI.
//
// Generate the server via Tools → "Companion server", then:
//   python companion.py  (stdlib only + claude CLI in PATH)

const { useState: useCState, useEffect: useCEffect, useCallback } = React;

const COMPANION_LS_KEY = "imgui_companion_config";
const COMPANION_VERSION = 2;            // bump only on a breaking server change
const LIVE_KEY = "imgui_companion_live"; // cross-page connection snapshot

const defaultConfig = () => {
  try { return JSON.parse(localStorage.getItem(COMPANION_LS_KEY)) || {}; } catch { return {}; }
};
function saveConfig(cfg) {
  try { localStorage.setItem(COMPANION_LS_KEY, JSON.stringify(cfg)); } catch {}
}
// Remember the last good connection so navigating between dashboard pages
// doesn't flash "disconnected" before the first ping returns.
function readLive() {
  try { return JSON.parse(localStorage.getItem(LIVE_KEY)) || null; } catch { return null; }
}
function writeLive(v) {
  try { v ? localStorage.setItem(LIVE_KEY, JSON.stringify(v)) : localStorage.removeItem(LIVE_KEY); } catch {}
}

// ────────────────────────────────────────────────────────────
// useCompanion
// ────────────────────────────────────────────────────────────
function useCompanion() {
  const saved = defaultConfig();
  const live  = readLive();
  const freshLive = live && (Date.now() - live.at < 12000) && live.port === (saved.port || 7373);
  const [port,     setPortState] = useCState(saved.port || 7373);
  const [repoPath, setRepoState] = useCState(saved.repoPath || "");
  // Optimistically resume the last-known-good connection across page loads.
  const [status,   setStatus]    = useCState(freshLive ? "connected" : "disconnected");
  const [info,     setInfo]      = useCState(freshLive ? live.info : null);

  const setPort     = (v) => { setPortState(v); saveConfig({ ...defaultConfig(), port: v }); };
  const setRepoPath = (v) => { setRepoState(v); saveConfig({ ...defaultConfig(), repoPath: v }); };

  const base = `http://localhost:${port}`;

  const ping = useCallback(async () => {
    try {
      const r = await fetch(`${base}/status`, {
        signal: AbortSignal.timeout(1500),
        headers: { "Accept": "application/json" },
      });
      if (r.ok) {
        const data = await r.json();
        setInfo(data); setStatus("connected");
        writeLive({ at: Date.now(), port, info: data });
      } else { setStatus("error"); }
    } catch { setStatus("disconnected"); writeLive(null); }
  }, [base, port]);

  useCEffect(() => {
    ping();
    const id = setInterval(ping, 4000);
    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
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

  return { port, setPort, repoPath, setRepoPath, status, info,
           outdated: !!(info && info.companionVersion && info.companionVersion < COMPANION_VERSION),
           expectedVersion: COMPANION_VERSION, runScript, askClaude, ping };
}

// ────────────────────────────────────────────────────────────
// CompanionBanner
// ────────────────────────────────────────────────────────────
function CompanionBanner({ companion }) {
  const { status, info, port, ping, outdated } = companion;
  const label =
    status === "connected"
      ? `● Connected · localhost:${port} · cwd: ${info?.cwd || "?"}`
      : `○ Companion not running · localhost:${port}`;
  return (
    <div>
    {outdated && status === "connected" && (
      <div style={{
        padding: "8px 14px", marginBottom: 8, borderRadius: 3,
        background: "color-mix(in oklab, var(--inprog) 12%, var(--bg))",
        border: "1px solid color-mix(in oklab, var(--inprog) 40%, var(--line))",
        fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--inprog)",
      }}>
        ⚠ Your companion.py is an older version — re-download from “Companion server” for the latest fixes.
      </div>
    )}
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
"""companion.py — Dashboard companion server (v2).
Bridges the dashboard to your local machine.

  POST /run     — execute a build/deploy script
  POST /claude  — run the Claude CLI in print mode and return its output
  GET  /status  — health-check

Usage: python companion.py [--port ${port}] [--claude-cli claude]
Requirements: Python 3.9+, Claude CLI on PATH (or pass --claude-cli / set CLAUDE_CLI)
"""
import http.server, socketserver, json, os, shutil, subprocess, sys, tempfile, argparse

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=${port})
    p.add_argument("--claude-cli", default=os.environ.get("CLAUDE_CLI", "claude"))
    return p.parse_args()

ARGS = parse_args()
IS_WIN = sys.platform == "win32"

def resolve_cli(name):
    """Find the Claude CLI even when it's a .cmd/.ps1 shim (common on Windows)."""
    if os.path.sep in name and os.path.exists(name):
        return name
    found = shutil.which(name)
    if found:
        return found
    if IS_WIN:
        for ext in (".cmd", ".exe", ".bat", ".ps1"):
            f = shutil.which(name + ext)
            if f:
                return f
    return name  # let subprocess raise if it's truly missing

CLAUDE = resolve_cli(ARGS.claude_cli)

class Handler(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
    def _send(self, obj, code=200):
        data = json.dumps(obj).encode()
        self.send_response(code); self.cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers()
        self.wfile.write(data)
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_GET(self):
        self._send({"connected": True, "port": ARGS.port, "cwd": os.getcwd(),
                    "platform": sys.platform, "claudeCli": CLAUDE,
                    "companionVersion": 2,
                    "claudeFound": bool(shutil.which(CLAUDE) or os.path.exists(CLAUDE))})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(n)) if n else {}
        except Exception as e:
            return self._send({"error": "bad JSON: " + str(e)}, 400)
        if self.path == "/run":
            self._send(self._run_script(body))
        elif self.path == "/claude":
            self._send(self._run_claude(body))
        else:
            self._send({"error": "unknown path " + self.path}, 404)
    def _run_script(self, body):
        script = body.get("script", ""); cwd = body.get("repoPath", "") or os.getcwd()
        ext = ".ps1" if IS_WIN else ".sh"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False, mode="w") as f:
            f.write(script); fname = f.name
        try:
            cmd = (["powershell", "-ExecutionPolicy", "Bypass", "-File", fname]
                   if IS_WIN else ["bash", fname])
            if not IS_WIN: os.chmod(fname, 0o755)
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300, cwd=cwd)
            return {"stdout": r.stdout, "stderr": r.stderr, "returncode": r.returncode}
        except Exception as e:
            return {"error": str(e)}
        finally:
            try: os.unlink(fname)
            except: pass
    def _run_claude(self, body):
        prompt = body.get("prompt", "")
        if not prompt:
            return {"error": "empty prompt"}
        # Print mode, plain-text output. shell=True on Windows so .cmd/.ps1 shims resolve.
        try:
            if IS_WIN:
                r = subprocess.run(
                    '"' + CLAUDE + '" -p --output-format text',
                    input=prompt, capture_output=True, text=True, timeout=180, shell=True)
            else:
                r = subprocess.run(
                    [CLAUDE, "-p", "--output-format", "text"],
                    input=prompt, capture_output=True, text=True, timeout=180)
        except FileNotFoundError:
            return {"error": "Claude CLI not found ('" + str(CLAUDE) + "'). "
                             "Install it or run with --claude-cli /full/path."}
        except subprocess.TimeoutExpired:
            return {"error": "Claude CLI timed out after 180s."}
        except Exception as e:
            return {"error": str(e)}
        out = (r.stdout or "").strip()
        if out:
            return {"output": out, "returncode": r.returncode}
        # No stdout — surface stderr + code so the cause is visible in the UI.
        return {"error": "Claude CLI produced no output (exit " + str(r.returncode) + "). "
                         + ((r.stderr or "").strip()[:800] or "Is the CLI authenticated? Try 'claude -p hello' in a terminal.")}
    def log_message(self, fmt, *args):
        sys.stderr.write("[companion] " + (fmt % args) + "\\n")

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == "__main__":
    srv = Server(("127.0.0.1", ARGS.port), Handler)
    print("[companion] http://localhost:" + str(ARGS.port) + "  ·  cli: " + str(CLAUDE))
    if not (shutil.which(CLAUDE) or os.path.exists(CLAUDE)):
        print("[companion] WARNING: Claude CLI not found on PATH — /claude will error until fixed.")
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
`;
}

Object.assign(window, { useCompanion, CompanionBanner, AskClaudeBar, generateCompanionPy });
