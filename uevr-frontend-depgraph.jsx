// uevr-frontend-depgraph.jsx — dependency graph for the UEVR Frontend project.

const { useMemo, useState } = React;

function DepGraph({ data }) {
  const W = 1380;
  const H = 520;

  const layers = [
    {
      x: 40, title: "Injection Core",
      nodes: ["dll-injection", "wmi-trace", "auto-inject", "plugin-nullifier", "runtime-select"],
    },
    {
      x: 310, title: "System Tray",
      nodes: ["notify-icon", "status-icons", "minimize-tray", "tray-context-menu"],
    },
    {
      x: 580, title: "Auto-Updates",
      nodes: ["nightly-updates", "update-cache", "version-picker", "periodic-check"],
    },
    {
      x: 840, title: "Launcher Integration",
      nodes: ["unelevated-launch", "steam-epic-startup", "start-with-windows"],
    },
    {
      x: 1080, title: "App Management",
      nodes: ["single-instance", "game-config", "profile-cleanup", "cli-support", "focus-on-inject"],
    },
  ];

  const nodes = useMemo(() => {
    const m = new Map();
    const labelLookup = {};
    data.cards.forEach((c)     => (labelLookup[c.id] = { label: c.title,  status: c.status,  group: c.group }));
    data.symptoms.forEach((s)  => (labelLookup[s.id] = { label: s.title,  status: "open",    group: s.kind === "feature" ? "Backlog" : "Bug" }));
    data.sideTasks.forEach((s) => (labelLookup[s.id] = { label: s.title,  status: "side",    group: "Side-task" }));

    layers.forEach((layer) => {
      const ySpan = H - 90;
      const step  = ySpan / Math.max(layer.nodes.length, 1);
      layer.nodes.forEach((id, i) => {
        const info = labelLookup[id] || { label: id, status: "open", group: "?" };
        m.set(id, {
          id,
          x:      layer.x,
          y:      70 + step * i + step / 2,
          label:  info.label,
          status: info.status,
          group:  info.group,
        });
      });
    });
    return m;
  }, [data]);

  const [hover, setHover] = useState(null);

  const edges = data.edges.map((e, i) => {
    const a = nodes.get(e.from);
    const b = nodes.get(e.to);
    if (!a || !b) return null;
    const cx   = (a.x + 140 + b.x) / 2;
    const path = `M ${a.x + 140} ${a.y} C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
    const hl   = hover === e.from || hover === e.to;
    return <path key={i} className={"depedge" + (hl ? " hl" : "")} d={path} />;
  });

  const headers = layers.map((l, i) => (
    <text
      key={i}
      x={l.x + 70}
      y={34}
      textAnchor="middle"
      fill="var(--muted)"
      fontFamily="var(--font-mono)"
      fontSize="9.5"
      letterSpacing="1.1"
      style={{ textTransform: "uppercase" }}
    >
      {l.title}
    </text>
  ));

  const seps = layers.slice(0, -1).map((l, i) => {
    const nx  = layers[i + 1].x;
    const mid = (l.x + 140 + nx) / 2;
    return <line key={i} x1={mid} x2={mid} y1={48} y2={H - 16} stroke="var(--line)" strokeDasharray="2 4" />;
  });

  const nodeEls = [...nodes.values()].map((n) => {
    const cls =
      n.status === "shipped"     ? "shipped"
      : n.status === "in-progress" ? "inprog"
      : n.status === "side"        ? "side"
      : "open";
    const dim = hover && hover !== n.id && !data.edges.some(
      (e) => (e.from === hover && e.to === n.id) || (e.to === hover && e.from === n.id)
    );
    return (
      <g
        key={n.id}
        className={"depnode " + cls}
        transform={`translate(${n.x}, ${n.y - 14})`}
        opacity={dim ? 0.22 : 1}
        style={{ cursor: "pointer", transition: "opacity .15s" }}
        onMouseEnter={() => setHover(n.id)}
        onMouseLeave={() => setHover(null)}
      >
        <rect width="140" height="28" rx="3" />
        <text x="10" y="11" className="badge" style={{ textTransform: "uppercase" }}>{n.group}</text>
        <text x="10" y="22" fontSize="10.5" fontWeight="500">{truncate(n.label, 20)}</text>
      </g>
    );
  });

  return (
    <div className="depgraph-wrap">
      <div className="panel-head">
        <span>Dependency map · {data.edges.length} edges · {nodes.size} nodes</span>
        <span style={{ color: "var(--text-2)", textTransform: "none", letterSpacing: 0 }}>
          {hover
            ? <strong style={{ color: "var(--accent)" }}>{nodes.get(hover)?.label || hover}</strong>
            : "Hover a node to trace dependencies"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {seps}
        {headers}
        {edges}
        {nodeEls}
      </svg>
    </div>
  );
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

window.DepGraph = DepGraph;
