# LinkedIn Content — Logan Brunet

Ready-to-post LinkedIn material generated from the portfolio work.
Copy/paste and tweak as you like. Swap the links for your live GitHub Pages URLs once deployed.

---

## ABOUT / HEADLINE OPTIONS

### Headline (the line under your name — 220 char max)
Pick one:

1. `Senior C++ Engineer · Game Engine Tooling, Real-Time Rendering & VR · Dear ImGui · Unreal Engine · Open to work`
2. `C++ / Engine Tools Engineer — shipped 66 features across 3 projects this quarter · Dear ImGui · UEVR · Agentic dev with Claude Code`
3. `Game Tools & Immersive Tech Engineer · C++ · Unreal Engine · Dear ImGui · WPF · building developer tools that ship`

---

### About section — long version

```
I build the tools other engineers build games with.

Senior C++ engineer with 23 years in the language and a focus on game engine
tooling, real-time rendering, and immersive/VR tech. I'm comfortable owning a
full stack — from engine internals and graphics hooks through UI, deployment,
and the developer tooling around it.

A snapshot of recent work:

• ImGuiColorTextEdit — took a capable Dear ImGui text widget and shipped 22
  features that turn it into a real IDE: a from-scratch code-folding engine,
  VS Code-style chord shortcuts, runtime-loadable language definitions, an F5
  script runner, and header/source navigation. Cross-platform across Windows,
  macOS, and Linux.

• UEVR Frontend — a C#/WPF desktop app that automatically injects VR support
  into any Unreal Engine game. Custom WinAPI system tray built from scratch,
  WMI-based early process injection, a full nightly-build update manager, and
  unelevated launcher handling to keep anticheat happy.

• UEVR Lua API — brought an injected Dear ImGui renderer forward ~5 years of
  upstream versions, landing full docking and multi-viewport (pop-out windows)
  in an injected DLL — something normally only possible in native engine plugins.

I also work agentically with Claude Code as a force multiplier: scoping,
boilerplate, documentation, and verification loops on top of human architecture
and design decisions. One example — a Lua game fully translated to C++ and
compiled to WebAssembly, running live in the browser.

Open to senior engine/tools roles. Portfolio + interactive project dashboards: [LINK]
```

### About section — short version

```
Senior C++ engineer (23 yrs) focused on game engine tooling, real-time
rendering, and VR. Recent: 22-feature IDE sprint on a Dear ImGui editor, a
C#/WPF VR injector for Unreal Engine games, and a multi-year Dear ImGui
renderer upgrade landing docking + multi-viewport inside an injected DLL.
I pair deep systems work with agentic AI workflows (Claude Code).
Open to senior engine/tools roles. Portfolio: [LINK]
```

---

## POST 1 — Portfolio launch / "open to work"

```
After a heads-down quarter, I'm putting my work out in the open and looking for
my next senior engine/tools role.

Three projects, ~66 features shipped:

→ ImGuiColorTextEdit: turned a Dear ImGui text widget into a real IDE — code
  folding engine, VS Code chord shortcuts, runtime language loading, script
  runner. Windows/macOS/Linux.

→ UEVR Frontend: a C#/WPF app that auto-injects VR into Unreal Engine games.
  Custom WinAPI tray, WMI early injection, full nightly update manager.

→ UEVR Lua API: pushed an injected Dear ImGui renderer ~5 years forward —
  docking + multi-viewport in an injected DLL, which normally isn't possible.

I built interactive dashboards for each (kanban, dependency graphs, file
heatmaps) instead of a static PDF. Take a look: [LINK]

Open to senior C++ / engine tooling / graphics roles. Reach out.

#cpp #gamedev #gameengine #unrealengine #graphics #VR #hiring
```

---

## POST 2 — Technical deep-dive: the fold engine

```
Small feature, surprisingly deep problem: code folding in a text editor.

On ImGuiColorTextEdit I rewrote the fold engine from scratch. The fun part
wasn't collapsing braces — it was getting *every* language to feel right:

• Python folds on indentation, not delimiters — so the engine tracks indent
  transitions, not just { }.
• Each fold type gets its own preview marker — " {...}" for braces,
  " #if..." for preprocessor, " /*..*/" for comment runs.
• A coordinate bug where clicking a collapsed region scrolled to EOF, because
  the hidden end-line's visual index resolved to "total visible lines."

Folding touches rendering, hit-testing, and the cursor coordinate system all at
once. Worth doing carefully.

Write-up + interactive dashboard: [LINK]

#cpp #gamedev #dearimgui #programming
```

---

## POST 3 — UEVR Frontend / systems programming

```
I wrote a Windows system tray icon from scratch this quarter. Raw Shell_NotifyIcon,
a message-only HWND, manual WndProc routing — no wrapper library.

It's part of UEVR Frontend, a C#/WPF app that automatically injects VR support
into Unreal Engine games. The interesting systems bits:

• WMI process-start tracing to inject *before* a game window even exists.
• Unelevated Steam/Epic launching so an elevated injector doesn't trip anticheat
  process-tree checks.
• A full update manager over the GitHub Releases API — browse every nightly by
  date, one-click install any version, or enable auto-updates.

Sometimes "make it feel native" means going all the way down to the Win32 layer.

Dashboard + screenshots: [LINK]

#csharp #winapi #systemsprogramming #VR #unrealengine
```

---

## POST 4 — Agentic development / Claude Code

```
A take on AI-assisted development from someone who ships C++ for a living:

The skill isn't "the AI writes my code." It's knowing how to scope a task,
prompt precisely, and — most importantly — verify every line with the same
scrutiny you'd give any PR. The architecture and design stay human. The speed
multiplier is real.

Concrete example from this quarter: an agentic, end-to-end translation of a Lua
game into native C++ against the Dear ImGui editor, then compiled to WebAssembly
so it runs live in the browser. No install.

I also built Claude-powered tools directly into my project dashboards — status
report generators, release-note drafters, and a local companion server that
bridges a browser UI to the Claude CLI for in-context code review.

Play the live demo / see the tooling: [LINK]

#ai #claudecode #cpp #softwareengineering #webassembly
```

---

## POST 5 — Short "what I do" hook

```
I build the tools other engineers build games with.

This quarter: a from-scratch code-folding engine, a custom Win32 system tray,
and a Dear ImGui renderer upgrade that landed multi-viewport inside an injected
DLL.

23 years of C++. Open to senior engine/tools roles. [LINK]

#cpp #gamedev #hiring
```

---

## TIPS

- Replace every `[LINK]` with your live GitHub Pages URL once deployed
  (e.g. `https://lobotomy-x.github.io/portfolio/Portfolio.html`).
- LinkedIn truncates posts after ~3 lines — front-load the hook.
- Post the technical deep-dives (2 & 3) on different days; they perform best
  with engineering audiences.
- Add 1–2 screenshots or a short screen recording to each post — image posts
  get materially more reach than text-only.
- For the "About" section, the long version is best if your headline is short;
  use the short version if your headline already carries detail.
