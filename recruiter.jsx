// recruiter.jsx — portfolio overview for Logan Brunet.
// Identity block (name huge) + sprint context + credits dropdown.

function RecruiterView({ data, onSwitchToDev }) {
  const m = data.meta;

  const highlightCards = (m.highlights || []).
  map((id) => data.cards.find((c) => c.id === id)).
  filter(Boolean);

  const shippedMilestones = data.milestones.filter(
    (x) => x.kind === "ship" || x.kind === "in-progress"
  );

  return (
    <div className="rec">

      {/* ══════════════ HERO ══════════════ */}
      <header className="rec-hero-v2">

        {/* Top bar: back link + byline */}
        <div className="rec-topbar">
          <a href="Portfolio.html" className="rec-back-link">← Logan Brunet · Portfolio</a>
          <nav className="rec-hero-links">
            {m.repoUrl &&
              <a href={m.repoUrl} target="_blank" rel="noopener noreferrer" className="rec-hero-link primary">GitHub ↗</a>
            }
            {m.linkedIn &&
              <a href={m.linkedIn} target="_blank" rel="noopener noreferrer" className="rec-hero-link">LinkedIn ↗</a>
            }
            <a href="#dev" className="rec-hero-link"
              onClick={(e) => { e.preventDefault(); onSwitchToDev(); }}>
              Dev dashboard ↗
            </a>
          </nav>
        </div>

        {/* Main: project identity */}
        <div className="rec-identity">
          <div className="rec-identity-main">
            <div>
              <div className="rec-open-badge">
                <span className="rec-open-dot"></span>
                {m.role} · {m.location}
              </div>
              <h1 className="rec-name">{m.project}</h1>
              <div className="rec-role-line">Contributed by {m.author}</div>
              {m.description && <p className="rec-bio">{m.description}</p>}
            </div>
            {m.techStack &&
              <div className="rec-tech-chips">
                <div className="rec-tech-chips-label">built with</div>
                <div className="rec-skill-chips">
                  {m.techStack.map((s) => <span key={s} className="rec-skill-chip">{s}</span>)}
                </div>
              </div>
            }
          </div>
        </div>

        {/* Sprint panel */}
        <div className="rec-sprint-panel">
          <div className="rec-sprint-eyebrow">
            <span className="live"></span>
            engine tooling sprint · {m.lastUpdated}
          </div>
          <div className="rec-sprint-project">
            v{m.version}
            <span className="rec-sprint-version" style={{ color: "var(--muted)" }}>{m.branch}</span>
          </div>
          <div>
            <p className="rec-sprint-tagline" style={{ margin: 0 }}>{m.tagline}</p>
            {m.credits && m.credits.length > 0 &&
              <details className="rec-credits-details">
                <summary>Project history</summary>
                <ul className="rec-credits-list">
                  {m.credits.map((c, i) =>
                    <li key={i} className="rec-credits-item">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="rec-credits-name">{c.name}</a>
                      <span className="rec-credits-handle">@{c.handle}</span>
                      <span className="rec-credits-role">{c.role}</span>
                    </li>
                  )}
                </ul>
              </details>
            }
          </div>
        </div>

      </header>

      {/* ══════════════ IMPACT NUMBERS ══════════════ */}
      <div className="rec-impact">
        {(m.impactNumbers || []).map((n, i) =>
        <div key={i} className="rec-impact-tile">
            <div className="rec-impact-num">{n.num}</div>
            <div className="rec-impact-label">{n.label}</div>
            <div className="rec-impact-sub">{n.sub}</div>
          </div>
        )}
      </div>

      {/* ══════════════ ABOUT ══════════════ */}
      <section className="rec-about">
        <h3>About this project</h3>
        <div>
          <p>{m.description}</p>
          {m.audience &&
          <ul>{m.audience.map((a, i) => <li key={i}>{a}</li>)}</ul>
          }
        </div>
      </section>

      {/* ══════════════ FEATURES ADDED ══════════════ */}
      {m.featuresAdded && m.featuresAdded.length > 0 &&
      <section style={{ marginBottom: 64 }}>
          <div className="rec-section-head">
            <span className="rec-section-num">§ 01</span>
            <h2 className="rec-section-title">What was added</h2>
            <div className="rec-section-rule"></div>
            <span className="rec-section-aside">{m.featuresAdded.length} features</span>
          </div>
          <div className="rec-features-grid">
            {m.featuresAdded.map((f, i) =>
          <div key={i} className="rec-feature-card">
                <div className="rec-feature-name">{f.name}</div>
                <div className="rec-feature-desc">{f.desc}</div>
              </div>
          )}
          </div>
        </section>
      }

      {/* ══════════════ HIGHLIGHTS ══════════════ */}
      <section>
        <div className="rec-section-head">
          <span className="rec-section-num">§ 02</span>
          <h2 className="rec-section-title">Selected highlights</h2>
          <div className="rec-section-rule"></div>
          <span className="rec-section-aside">
            {highlightCards.length} of {data.cards.filter((c) => c.status === "shipped").length} shipped
          </span>
        </div>
        <div className="rec-highlights">
          {highlightCards.map((c) =>
          <div key={c.id} className="rec-highlight">
              <div className="rec-highlight-tag">{c.group}</div>
              <h3 className="rec-highlight-title">{c.title}</h3>
              <p className="rec-highlight-blurb">{c.blurb}</p>
              <div className="rec-highlight-foot">
                {(c.tags || []).slice(0, 3).map((t) => <Pill key={t} kind="tag">{t}</Pill>)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ MEDIA / VIDEO ══════════════ */}
      {m.videos && m.videos.length > 0 &&
      <section>
          <div className="rec-section-head">
            <span className="rec-section-num">§ 03</span>
            <h2 className="rec-section-title">In action</h2>
            <div className="rec-section-rule"></div>
            <span className="rec-section-aside">{m.videos.length} clips</span>
          </div>
          <div className="rec-video-grid">
            {m.videos.map((v, i) =>
          <div key={i} className="rec-video-card">
                <video src={v.src} poster={v.poster} controls preload="metadata"
            className="rec-video-el" />
                {v.caption && <div className="rec-video-caption">{v.caption}</div>}
              </div>
          )}
          </div>
        </section>
      }

      {/* ══════════════ TIMELINE ══════════════ */}
      <section>
        <div className="rec-section-head">
          <span className="rec-section-num">{m.videos?.length ? "§ 04" : "§ 03"}</span>
          <h2 className="rec-section-title">Activity timeline</h2>
          <div className="rec-section-rule"></div>
          <span className="rec-section-aside">{shippedMilestones.length} milestones</span>
        </div>
        <div className="rec-timeline">
          <ul className="rec-timeline-list">
            {shippedMilestones.map((mi, i) =>
            <li key={i} className={"rec-timeline-item " + (mi.kind === "in-progress" ? "inprog" : "")}>
                <span className="rec-timeline-date">{mi.date}</span>
                <span className="rec-timeline-dot"></span>
                <span className="rec-timeline-label">{mi.label}</span>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* ══════════════ TECH STACK ══════════════ */}
      <section>
        <div className="rec-section-head">
          <span className="rec-section-num">{m.videos?.length ? "§ 05" : "§ 04"}</span>
          <h2 className="rec-section-title">Tech stack</h2>
          <div className="rec-section-rule"></div>
          <span className="rec-section-aside">{(m.techStack || []).length} technologies</span>
        </div>
        <div className="rec-tech">
          {(m.techStack || []).map((t) =>
          <span key={t} className="rec-tech-tag">{t}</span>
          )}
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <div className="rec-cta">
        <div>
          <div className="rec-cta-lead">
            Want the full technical picture — every card, dependency graph, files heatmap, and fix plan?
          </div>
          <div className="rec-cta-sub">
            {data.cards.filter((c) => c.status === "shipped").length} shipped features ·{" "}
            {data.files.length} files touched · {data.scripts.rows.length} languages ·{" "}
            3 follow-up repos
          </div>
        </div>
        <button className="rec-cta-btn" onClick={onSwitchToDev}>
          Open developer view →
        </button>
      </div>

      <footer className="footer" style={{ marginTop: 56 }}>
        <span>{m.author} · {m.project} contribution · {m.lastUpdated}</span>
        <span>Built with Claude Code</span>
      </footer>
    </div>);

}

window.RecruiterView = RecruiterView;