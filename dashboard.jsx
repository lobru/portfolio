// dashboard.jsx — ImGuiColorTextEdit progress dashboard
// Overview (recruiter) + Dev views · scrollable roadmap · AskClaudeBar · Tools drawer

const { useEffect, useMemo, useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "console",
  "density": "comfortable",
  "viewMode": "overview",
  "showRoadmap": true,
  "showKanban": true,
  "showDeps": true,
  "showIssues": true,
  "showFiles": true,
  "showLanguages": true,
  "showSideTasks": true,
  "showGallery": false
}/*EDITMODE-END*/;

// ═══════════════════════════════════════════════
// Primitives
// ═══════════════════════════════════════════════

function Pill({ kind = "tag", children }) {
  return (
    <span className={"pill " + kind}>
      {kind !== "tag" && <span className="dot"></span>}
      {children}
    </span>
  );
}

function SectionHead({ num, title, aside }) {
  return (
    <div className="section-head">
      <span className="section-num">§ {num}</span>
      <h2 className="section-title">{title}</h2>
      <div className="section-rule"></div>
      {aside && <span className="section-aside">{aside}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Header
// ═══════════════════════════════════════════════

function HeaderStrip({ meta }) {
  return (
    <header className="header">
      <div className="sigil">
        <div className="sigil-mark">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M9 6 L4 13 L9 20" stroke="var(--shipped)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M17 6 L22 13 L17 20" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <line x1="13" y1="5" x2="13" y2="21" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
          </svg>
        </div>
        <div className="sigil-text">
          <span className="crumbs">
            <span className="live"></span>
            {meta.project} · v{meta.version} · <strong style={{ color: "var(--accent)" }}>{meta.repoPath}</strong>
          </span>
          <h1 className="title">
            {meta.titlePrefix || meta.project}
            {meta.titleAccent && <em>{meta.titleAccent}</em>}
            {meta.titleSuffix || ""}
            {" · progress"}
          </h1>
        </div>
      </div>
      <div></div>
      <div className="header-meta">
        <span>last sprint</span>
        <span className="stamp">{meta.lastUpdated}</span>
        <span>baseline · {meta.baseline}</span>
        <span>{meta.docCount} docs · {meta.sessionId}</span>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════
// Vitals
// ═══════════════════════════════════════════════

function Vitals({ vitals }) {
  const tiles = [
    { num: vitals.shipped,                          label: "shipped",       sub: "features + fixes landed",               cls: "shipped" },
    { num: vitals.inProgress,                       label: "in progress",   sub: "active investigation",                  cls: "inprog"  },
    { num: vitals.openBugs + vitals.openFeatures,   label: "open items",    sub: `${vitals.openBugs} bugs · ${vitals.openFeatures} features`, cls: "open" },
    { num: vitals.languages,                        label: "languages",     sub: "8 built-in · 6 runtime",                cls: "" },
    { num: vitals.filesChanged,                     label: "files changed", sub: "across " + vitals.roundsCompleted + " rounds", cls: "" },
    { num: vitals.roundsCompleted,                  label: "rounds landed", sub: "fold · nav · integration · fixes",     cls: "" },
  ];
  return (
    <div className="vitals">
      {tiles.map((t) => (
        <div key={t.label} className={"vital " + t.cls}>
          {t.cls && <span className="vital-dot"></span>}
          <span className="vital-num">{t.num}</span>
          <span className="vital-label">{t.label}</span>
          <span className="vital-sub">{t.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Roadmap — scrollable, alternating above/below
// ═══════════════════════════════════════════════

function Roadmap({ milestones }) {
  const N = milestones.length;
  return (
    <div className="roadmap-frame">
      <div className="panel-head">
        <span>Milestones · Dec 2024 → next · {N} entries</span>
        <span style={{ color: "var(--text-2)" }}>
          <Pill kind="shipped">shipped</Pill>{" "}
          <Pill kind="inprog">in progress</Pill>{" "}
          <Pill kind="open">next</Pill>
        </span>
      </div>
      <div className="roadmap-scroller">
        <div className="roadmap-axis">
          <div className="roadmap-track"></div>
          {milestones.map((m, i) => {
            const cls = m.kind === "ship" ? "shipped"
              : m.kind === "in-progress" ? "inprog"
              : m.kind === "audit" ? "audit" : "next";
            const side = i % 2 === 0 ? "above" : "below";
            return (
              <div key={i} className={`roadmap-tick ${cls} ${side}`}>
                <span className="date">{m.date}</span>
                <span className="stem"></span>
                <span className="mark"></span>
                <span className="label">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Kanban
// ═══════════════════════════════════════════════

function Kanban({ cards, symptoms, plan, companion }) {
  const [expanded, setExpanded] = useState(null);
  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  const shipped   = cards.filter((c) => c.status === "shipped");
  const inprog    = cards.filter((c) => c.status === "in-progress");
  const openCards = [
    ...symptoms.map((s) => ({
      id: s.id, title: s.title, status: "open",
      group: s.kind === "feature" ? "Backlog" : "Open bug",
      tags: [s.severity, s.kind || "bug"],
      blurb: s.detail,
    })),
    ...plan.map((p) => ({
      id: "plan-" + p.step, title: `Plan §${p.step}: ${p.title}`, status: "open",
      group: "Fix plan", tags: ["next"],
      blurb: p.detail, checks: p.checks,
    })),
  ];

  return (
    <div className="kanban">
      <KanbanCol title="Shipped" status="shipped" count={shipped.length}>
        {shipped.map((c) => (
          <Card key={c.id} card={c} expanded={expanded === c.id}
            onToggle={() => toggle(c.id)} companion={companion} />
        ))}
      </KanbanCol>
      <KanbanCol title="In Progress" status="inprog" count={inprog.length}>
        {inprog.map((c) => (
          <Card key={c.id} card={c} expanded={expanded === c.id}
            onToggle={() => toggle(c.id)} companion={companion} />
        ))}
      </KanbanCol>
      <KanbanCol title="Open / Next" status="open" count={openCards.length}>
        {openCards.map((c) => (
          <Card key={c.id} card={c} expanded={expanded === c.id}
            onToggle={() => toggle(c.id)} companion={companion} />
        ))}
      </KanbanCol>
    </div>
  );
}

function KanbanCol({ title, status, count, children }) {
  return (
    <div className={"col " + status}>
      <div className="col-head">
        <span className="col-title"><span className="swatch"></span>{title}</span>
        <span className="col-count">{count}</span>
      </div>
      <div className="col-body">{children}</div>
    </div>
  );
}

function Card({ card, expanded, onToggle, companion }) {
  return (
    <div className={"card " + (expanded ? "expanded" : "")} onClick={onToggle}>
      <div className="card-top">
        <span className="card-group">{card.group}</span>
        <div className="card-tags">
          {(card.tags || []).slice(0, 2).map((t) => <Pill key={t} kind="tag">{t}</Pill>)}
        </div>
      </div>
      <div className="card-title">{card.title}</div>
      <div className="card-blurb">{card.blurb}</div>

      {expanded && (
        <div className="card-detail" onClick={(e) => e.stopPropagation()}>
          {card.detail && <p>{card.detail}</p>}

          {card.image && (
            <div className="card-section">
              <div className="card-shot">
                <img src={card.image.src} alt={card.image.caption || card.title} loading="lazy" />
                {card.image.caption && <div className="card-shot-cap">{card.image.caption}</div>}
              </div>
            </div>
          )}

          {card.surface && (
            <div className="card-section">
              <div className="card-section-label">Surface — {card.surface.length} items</div>
              <ul className="card-list">
                {card.surface.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {card.checks && (
            <div className="card-section">
              <div className="card-section-label">Acceptance checks</div>
              <ul className="plan-checks">
                {card.checks.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {card.files && (
            <div className="card-section">
              <div className="card-section-label">Files</div>
              <div className="card-files">
                {card.files.map((f) => <span key={f} className="file">{f}</span>)}
              </div>
            </div>
          )}

          <AskClaudeBar card={card} companion={companion} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Issues
// ═══════════════════════════════════════════════

function Issues({ symptoms, plan }) {
  const bugs     = symptoms.filter((s) => !s.kind);
  const features = symptoms.filter((s) => s.kind === "feature");
  return (
    <div className="issues-grid">
      <div className="panel">
        <div className="panel-head">
          <span>Open items · {bugs.length} bugs · {features.length} backlog</span>
          <span style={{ color: "var(--open)" }}>{symptoms.length} active</span>
        </div>
        <div className="panel-body" style={{ paddingTop: 6 }}>
          {symptoms.map((s) => (
            <div key={s.id} className={
              "symptom " +
              (s.kind === "feature" ? "feature-item " : "") +
              (s.severity === "medium" || s.severity === "low" ? "medium" : "")
            }>
              <div className="symptom-title">
                <span className={"symptom-sev" + (s.kind === "feature" ? " feature-sev" : "")}>
                  {s.kind === "feature" ? "backlog" : s.severity}
                </span>
                {s.title}
              </div>
              <div className="symptom-body">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <span>Fix plan · next steps</span>
          <span style={{ color: "var(--accent)" }}>{plan.length} steps</span>
        </div>
        <div>
          {plan.map((p) => (
            <div key={p.step} className="plan-step">
              <span className="plan-num">{String(p.step).padStart(2, "0")}</span>
              <div>
                <div className="plan-title">{p.title}<Pill kind="open">{p.state}</Pill></div>
                <div className="plan-detail">{p.detail}</div>
                {p.checks && (
                  <ul className="plan-checks">
                    {p.checks.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Files heatmap
// ═══════════════════════════════════════════════

function FilesHeatmap({ files }) {
  const [openPath, setOpenPath] = useState(null);
  const sorted = [...files].sort((a, b) => b.changeCount - a.changeCount);
  const max    = Math.max(...sorted.map((f) => f.changeCount));
  return (
    <div className="panel">
      <div className="panel-head">
        <span>{files.length} files · {files.reduce((s, f) => s + f.changeCount, 0)} discrete changes</span>
        <span style={{ color: "var(--muted)" }}>click to expand</span>
      </div>
      <div className="files-grid">
        {sorted.map((f) => (
          <React.Fragment key={f.path}>
            <div className={"file-row" + (openPath === f.path ? " open" : "")}
              onClick={() => setOpenPath(openPath === f.path ? null : f.path)}
              style={{ cursor: "pointer" }}>
              <span className={"file-domain " + f.domain}>{f.domain}</span>
              <span className="file-path">{f.path}</span>
              <span className="file-bar">
                {Array.from({ length: max }).map((_, i) => (
                  <span key={i} className="seg" style={{ opacity: i < f.changeCount ? 1 : 0.12 }}></span>
                ))}
              </span>
              <span className="file-count">{f.changeCount} change{f.changeCount !== 1 ? "s" : ""}</span>
            </div>
            {openPath === f.path && (
              <div className="file-changes">
                <ul>{f.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Language support
// ═══════════════════════════════════════════════

function LanguageSupport({ scripts, labels }) {
  const head = labels?.head ?? `Language support · ${scripts.summary.builtin} built-in · ${scripts.summary.runtime} runtime`;
  const headAside = labels?.headAside ?? `${scripts.rows.length} total`;
  const tableHeader = labels?.tableHeader ?? ["language", "type", "status", "features"];
  // Summary tiles: prefer scripts.summaryTiles (data-driven). Falls back to legacy { builtin, runtime, custom }.
  const tiles = scripts.summaryTiles || [
    { num: scripts.summary.builtin, label: "built-in · compiled rules",   cls: "pass" },
    { num: scripts.summary.runtime, label: "runtime · .lang files",        cls: "rewritten" },
    { num: scripts.summary.custom,  label: "custom · Language::FromFile",  cls: "new" },
  ];
  return (
    <div className="panel">
      <div className="panel-head">
        <span>{head}</span>
        <span style={{ color: "var(--muted)" }}>{headAside}</span>
      </div>
      <div className="panel-body">
        <div className="scripts-summary">
          {tiles.map((t, i) => (
            <div key={i} className={"item " + (t.cls || "")}>
              <div className="num">{t.num}</div>
              <div className="label">{t.label}</div>
            </div>
          ))}
        </div>
        <table className="scripts-table">
          <thead><tr>{tableHeader.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {scripts.rows.map((r) => (
              <tr key={r.file}>
                <td className="file">{r.file}</td>
                <td className="date">{r.date}</td>
                <td><Pill kind={r.status === "pass" ? "shipped" : r.status === "rewritten" ? "inprog" : "info"}>{r.status}</Pill></td>
                <td className="notes">{r.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Side-tasks
// ═══════════════════════════════════════════════

function SideTasks({ tasks, cards }) {
  const [open, setOpen] = useState(null);
  const cardLookup = useMemo(() => {
    const m = new Map();
    cards.forEach((c) => m.set(c.id, c.title));
    return m;
  }, [cards]);

  return (
    <div className="sidetasks">
      {tasks.map((t) => (
        <div key={t.id} className="sidetask">
          <span className="sidetask-num">{t.num}</span>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Pill kind={t.kind === "sync" ? "inprog" : t.kind === "update" ? "shipped" : "info"}>{t.kind}</Pill>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{t.upstream}</span>
            </div>
            <div className="sidetask-title">{t.title}</div>
            <div className="sidetask-path">{t.repoPath}</div>
            <div className="sidetask-summary">{t.summary}</div>
            <div className="sidetask-deps">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--faint)", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "center", marginRight: 4 }}>depends</span>
              {t.dependsOn.map((id) => <Pill key={id} kind="tag">{cardLookup.get(id) || id}</Pill>)}
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)" }}>{t.status}</span>
              <button onClick={() => setOpen(open === t.id ? null : t.id)} style={{
                fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--accent)",
                textTransform: "uppercase", letterSpacing: "0.1em",
                border: "1px solid var(--line)", padding: "5px 10px", borderRadius: 3,
              }}>{open === t.id ? "− collapse" : "+ open"}</button>
            </div>
            {open === t.id && <SideTaskDetail task={t} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function SideTaskDetail({ task }) {
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)", display: "flex", flexDirection: "column", gap: 14 }}>
      {task.verdict && (
        <div>
          <div className="card-section-label" style={{ marginBottom: 6 }}>Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {[["keep","--shipped"],["rewrite","--inprog"],["obsolete","--open"],["audit","--info"]].map(([k,col]) => task.verdict[k] !== undefined && (
              <div key={k} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 3, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: `var(${col})`, fontWeight: 500, lineHeight: 1 }}>{task.verdict[k]}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {task.patternsToLift && (
        <div>
          <div className="card-section-label" style={{ marginBottom: 6 }}>Patterns to document</div>
          <ul className="card-list">{task.patternsToLift.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {task.actions && (
        <div>
          <div className="card-section-label" style={{ marginBottom: 6 }}>Work order</div>
          <ul className="plan-checks" style={{ gap: 6 }}>
            {task.actions.map((a, i) => <li key={i} className={a.status === "done" ? "done" : ""}>{a.label}</li>)}
          </ul>
        </div>
      )}
      {task.acceptance && (
        <div>
          <div className="card-section-label" style={{ marginBottom: 6 }}>Acceptance criteria</div>
          <ul className="card-list">{task.acceptance.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Gallery
// ═══════════════════════════════════════════════

function Gallery({ meta }) {
  // Data-driven only: render the gallery when a project explicitly supplies meta.gallery[].
  const images = (meta && meta.gallery && meta.gallery.length) ? meta.gallery : [];
  if (!images.length) return null;
  return (
    <div className="gallery-grid">
      {images.map((img) => (
        <div key={img.src} className={"gallery-item" + (img.contain ? " contain" : "")}>
          <img src={img.src} alt={img.caption} loading="lazy" />
          <div className="gallery-caption">{img.caption}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════

function Footer({ meta }) {
  return (
    <footer className="footer">
      <span>ImGuiColorTextEdit · v{meta.version} · {meta.repoPath}</span>
      <span>Claude Code · {meta.docCount} docs · {meta.lastUpdated}</span>
    </footer>
  );
}

// ═══════════════════════════════════════════════
// View toggle (fixed pill)
// ═══════════════════════════════════════════════

function ViewToggle({ mode, onChange }) {
  return (
    <div className="view-toggle">
      <button className={mode === "overview" ? "active" : ""} onClick={() => onChange("overview")}>Overview</button>
      <button className={mode === "dev" ? "active" : ""} onClick={() => onChange("dev")}>Dev dashboard</button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Dev dashboard (full detail view)
// ═══════════════════════════════════════════════

function DevDashboard({ data, t, setTweak, companion }) {
  return (
    <div className="app">
      <HeaderStrip meta={data.meta} />
      {companion && companion.status !== "connected" && (
        <a href="setup.html" className="setup-banner">
          <span className="setup-banner-dot"></span>
          <span><strong>Run this dashboard against your machine.</strong> Connect the local companion to enable build/run tools and Ask&nbsp;Claude.</span>
          <span className="setup-banner-cta">Set up →</span>
        </a>
      )}
      <Vitals vitals={data.vitals} />

      {t.showRoadmap && (
        <section className="section">
          <SectionHead num="01" title="Roadmap" aside="Dec 2024 → next" />
          <Roadmap milestones={data.milestones} />
        </section>
      )}

      {t.showKanban && (
        <section className="section">
          <SectionHead num="02" title="Kanban · feature board" aside="click any card to expand" />
          <Kanban cards={data.cards} symptoms={data.symptoms} plan={data.plan} companion={companion} />
        </section>
      )}

      {t.showDeps && (
        <section className="section">
          <SectionHead num="03" title="Dependency map" aside="hover to trace" />
          <DepGraph data={data} />
        </section>
      )}

      {t.showIssues && (
        <section className="section">
          <SectionHead num="04" title="Open items + fix plan" aside={`${data.symptoms.length} open · ${data.plan.length} steps`} />
          <Issues symptoms={data.symptoms} plan={data.plan} />
        </section>
      )}

      {t.showFiles && (
        <section className="section">
          <SectionHead num="05" title="Files touched" aside={`${data.files.length} files · ${data.files.reduce((s,f)=>s+f.changeCount,0)} changes`} />
          <FilesHeatmap files={data.files} />
        </section>
      )}

      {t.showLanguages && (
        <section className="section">
          <SectionHead
            num={data.meta.scriptsSection?.num ?? "06"}
            title={data.meta.scriptsSection?.title ?? "Language support"}
            aside={data.meta.scriptsSection?.aside ?? `${data.scripts.rows.length} languages`}
          />
          <LanguageSupport scripts={data.scripts} labels={data.meta.scriptsSection} />
        </section>
      )}

      {t.showSideTasks && (
        <section className="section">
          <SectionHead num="07" title="Side-tasks · follow-up work" aside="3 repos" />
          <SideTasks tasks={data.sideTasks} cards={data.cards} />
        </section>
      )}

      {t.showGallery && data.meta.gallery && data.meta.gallery.length > 0 && (
        <section className="section">
          <SectionHead num={data.meta.gallerySection?.num ?? "08"} title={data.meta.gallerySection?.title ?? "Feature gallery"} aside={data.meta.gallerySection?.aside ?? "screenshots"} />
          <Gallery meta={data.meta} />
        </section>
      )}

      <Footer meta={data.meta} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// App root
// ═══════════════════════════════════════════════

function Dashboard() {
  const data      = window.PROGRESS_DATA;
  // Per-project default: show the gallery automatically when the project supplies gallery data.
  const tweakDefaults = { ...TWEAK_DEFAULTS, showGallery: TWEAK_DEFAULTS.showGallery || !!(data.meta.gallery && data.meta.gallery.length) };
  const [t, setTweak]       = useTweaks(tweakDefaults);
  const [toolsOpen, setToolsOpen] = useState(false);
  const companion = useCompanion();

  useEffect(() => {
    document.body.setAttribute("data-theme",   t.theme);
    document.body.setAttribute("data-density", t.density);
  }, [t.theme, t.density]);

  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setToolsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen]);

  const mode    = t.viewMode || "overview";
  const setMode = (v) => setTweak("viewMode", v);

  return (
    <>
      <ViewToggle mode={mode} onChange={setMode} />

      {mode === "overview"
        ? <RecruiterView data={data} onSwitchToDev={() => setMode("dev")} />
        : <DevDashboard  data={data} t={t} setTweak={setTweak} companion={companion} />
      }

      {mode === "dev" && toolsOpen && (
        <ToolsDrawer data={data} companion={companion} onClose={() => setToolsOpen(false)} />
      )}
      {mode === "dev" && !toolsOpen && (
        <ToolsFAB onOpen={() => setToolsOpen(true)} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout" />
        <TweakRadio
          label="View"
          value={mode}
          options={["overview", "dev"]}
          onChange={setMode}
        />
        <TweakSection label="Theme" />
        <TweakRadio
          label="Aesthetic"
          value={t.theme}
          options={["console", "daylight", "phosphor"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "comfortable"]}
          onChange={(v) => setTweak("density", v)}
        />
        {mode === "dev" && (
          <>
            <TweakSection label="Dev sections" />
            <TweakToggle label="Roadmap"        value={t.showRoadmap}    onChange={(v) => setTweak("showRoadmap",    v)} />
            <TweakToggle label="Kanban"         value={t.showKanban}     onChange={(v) => setTweak("showKanban",     v)} />
            <TweakToggle label="Dependency map" value={t.showDeps}       onChange={(v) => setTweak("showDeps",       v)} />
            <TweakToggle label="Issues + plan"  value={t.showIssues}     onChange={(v) => setTweak("showIssues",     v)} />
            <TweakToggle label="Files"          value={t.showFiles}      onChange={(v) => setTweak("showFiles",      v)} />
            <TweakToggle label="Languages"      value={t.showLanguages}  onChange={(v) => setTweak("showLanguages",  v)} />
            <TweakToggle label="Side-tasks"     value={t.showSideTasks}  onChange={(v) => setTweak("showSideTasks",  v)} />
            {data.meta.gallery && data.meta.gallery.length > 0 && (
              <TweakToggle label="Gallery"        value={t.showGallery}    onChange={(v) => setTweak("showGallery",    v)} />
            )}
          </>
        )}
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Dashboard />);
