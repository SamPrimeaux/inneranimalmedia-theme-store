import { cn } from "../lib/utils";

interface EditorialMediaPlateProps {
  plateKey: string;
  alt?: string;
  caption?: string;
  variant?: "cover" | "diagram";
  className?: string;
}

const CHAPTER_MOTIFS: Record<
  string,
  { accent: string; accentSoft: string; badge: string; title: string }
> = {
  "ux-guide": {
    accent: "#8b6eff",
    accentSoft: "rgba(139,110,255,0.18)",
    badge: "00",
    title: "Working Guide",
  },
  "user-behavior-data": {
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.18)",
    badge: "01",
    title: "Behavior Data",
  },
  "future-of-ux-design": {
    accent: "#a78bfa",
    accentSoft: "rgba(167,139,250,0.18)",
    badge: "02",
    title: "Future of UX",
  },
  "user-testing": {
    accent: "#34d399",
    accentSoft: "rgba(52,211,153,0.18)",
    badge: "03",
    title: "User Testing",
  },
  "customer-journey-map": {
    accent: "#fbbf24",
    accentSoft: "rgba(251,191,36,0.18)",
    badge: "04",
    title: "Journey Mapping",
  },
  "user-personas": {
    accent: "#f472b6",
    accentSoft: "rgba(244,114,182,0.18)",
    badge: "05",
    title: "User Personas",
  },
  "product-roadmap": {
    accent: "#60a5fa",
    accentSoft: "rgba(96,165,250,0.18)",
    badge: "06",
    title: "Now · Next · Later",
  },
  "ux-task-analysis": {
    accent: "#818cf8",
    accentSoft: "rgba(129,140,248,0.18)",
    badge: "07",
    title: "Task Analysis",
  },
  "roadmap-to-becoming-uiux-designer": {
    accent: "#2dd4bf",
    accentSoft: "rgba(45,212,191,0.18)",
    badge: "08",
    title: "12-Month Path",
  },
  "interaction-designer": {
    accent: "#c084fc",
    accentSoft: "rgba(192,132,252,0.18)",
    badge: "09",
    title: "Interaction Design",
  },
  "product-designer": {
    accent: "#fb923c",
    accentSoft: "rgba(251,146,60,0.18)",
    badge: "10",
    title: "Product Designer",
  },
  "ux-books": {
    accent: "#94a3b8",
    accentSoft: "rgba(148,163,184,0.20)",
    badge: "11",
    title: "UX Reading List",
  },
  "ux-myths": {
    accent: "#f87171",
    accentSoft: "rgba(248,113,113,0.18)",
    badge: "12",
    title: "UX Myths",
  },
  "ux-disciplines": {
    accent: "#a3e635",
    accentSoft: "rgba(163,230,53,0.18)",
    badge: "13",
    title: "UX Disciplines",
  },
};

function getSlugFromKey(plateKey: string): string {
  const clean = plateKey.replace(/^ux-guide\//, "");
  if (clean.startsWith("hub-")) return "ux-guide";
  return clean.replace(/-(cover|hero|guide-card)$/, "");
}

function renderGraphicGeometry(key: string, accent: string, accentSoft: string) {
  const clean = key.replace(/^ux-guide\//, "");

  if (clean === "hub-trust-states") {
    const states = [
      { label: "In Progress", sub: "Streaming 3 tool steps", color: "#60a5fa" },
      { label: "Awaiting Approval", sub: "Scoped write check", color: "#fbbf24" },
      { label: "Denied", sub: "Safe fallback active", color: "#f87171" },
      { label: "Completed", sub: "Receipt & undo saved", color: "#34d399" },
    ];
    return (
      <g>
        {states.map((s, idx) => {
          const x = 55 + idx * 175;
          return (
            <g key={s.label}>
              <rect x={x} y="105" width="155" height="150" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
              <line x1={x + 18} y1="138" x2={x + 56} y2="138" stroke={s.color} strokeWidth="3" strokeLinecap="round" />
              <text x={x + 18} y="172" fill="#ffffff" fontSize="14" fontWeight="600">{s.label}</text>
              <text x={x + 18} y="196" fill="rgba(255,255,255,0.62)" fontSize="11">{s.sub}</text>
              <rect x={x + 18} y="218" width="119" height="18" rx="5" fill="rgba(255,255,255,0.06)" />
            </g>
          );
        })}
      </g>
    );
  }

  if (clean === "hub-process-loop") {
    const stages = ["Strategy", "Definition", "Analysis", "Research", "Design", "Validation", "Measure"];
    return (
      <g>
        <circle cx="400" cy="180" r="118" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="400" cy="180" r="46" fill={accentSoft} stroke={accent} strokeWidth="1.5" />
        <text x="400" y="185" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">Double Loop</text>
        {stages.map((label, idx) => {
          const angle = (idx / stages.length) * Math.PI * 2 - Math.PI / 2;
          const x = 400 + Math.cos(angle) * 145;
          const y = 180 + Math.sin(angle) * 118;
          return (
            <g key={label}>
              <rect x={x - 52} y={y - 17} width="104" height="34" rx="8" fill="#10121a" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
              <text x={x} y={y + 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
                {`${idx + 1}. ${label}`}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  if (clean === "hub-flow-example") {
    const lanes = [
      { name: "User Lane", y: 78, box: "Asks for change -> Reviews result", x: 170, w: 460 },
      { name: "Agent Lane", y: 158, box: "Drafts plan -> Executes safe steps", x: 210, w: 390 },
      { name: "Policy Gate", y: 238, box: "Risky tool check -> Approve or Deny", x: 260, w: 330 },
    ];
    return (
      <g>
        {lanes.map((lane) => (
          <g key={lane.name}>
            <line x1="40" y1={lane.y + 38} x2="760" y2={lane.y + 38} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x="52" y={lane.y + 5} fill="rgba(255,255,255,0.68)" fontSize="11" fontWeight="600">{lane.name}</text>
            <rect x={lane.x} y={lane.y - 18} width={lane.w} height="38" rx="8" fill={accentSoft} stroke={accent} strokeWidth="1.2" />
            <text x={lane.x + lane.w / 2} y={lane.y + 5} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="500">{lane.box}</text>
          </g>
        ))}
      </g>
    );
  }

  if (clean.includes("user-behavior-data")) {
    return (
      <g>
        {/* Funnel */}
        <rect x="65" y="96" width="195" height="30" rx="6" fill={accent} fillOpacity="0.85" />
        <rect x="85" y="136" width="155" height="30" rx="6" fill={accent} fillOpacity="0.58" />
        <rect x="112" y="176" width="100" height="30" rx="6" fill={accent} fillOpacity="0.38" />
        <rect x="132" y="216" width="60" height="30" rx="6" fill={accent} fillOpacity="0.24" />
        <text x="162" y="276" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="11">Funnel Drop-off</text>
        {/* Retention Curve */}
        <path d="M 315 110 C 350 185, 405 212, 505 218" fill="none" stroke={accent} strokeWidth="2.5" />
        <line x1="315" y1="242" x2="505" y2="242" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
        <line x1="315" y1="98" x2="315" y2="242" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
        <text x="410" y="276" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="11">Cohort Retention</text>
        {/* Session Timeline */}
        {[115, 155, 195, 232].map((yPos, idx) => (
          <g key={yPos}>
            <line x1="575" y1="100" x2="575" y2="245" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
            <circle cx="575" cy={yPos} r="5" fill={idx === 2 ? "#f87171" : accent} />
            <rect x="595" y={yPos - 10} width="135" height="20" rx="5" fill="rgba(255,255,255,0.06)" />
          </g>
        ))}
        <text x="640" y="276" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="11">Session Timeline</text>
      </g>
    );
  }

  if (clean.includes("future-of-ux-design")) {
    return (
      <g>
        <circle cx="400" cy="180" r="128" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="6 4" />
        <circle cx="400" cy="180" r="88" fill={accentSoft} stroke={accent} strokeWidth="1.5" />
        <circle cx="400" cy="180" r="46" fill="rgba(255,255,255,0.1)" stroke="#ffffff" strokeWidth="1.5" />
        <text x="400" y="184" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">Durable</text>
        <text x="400" y="114" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500">Shifting</text>
        <text x="400" y="72" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="11">Fashionable</text>
      </g>
    );
  }

  if (clean.includes("customer-journey-map")) {
    return (
      <g>
        {["Discover", "Evaluate", "Set up", "Use", "Publish"].map((stage, idx) => (
          <g key={stage}>
            <rect x={68 + idx * 136} y="82" width="120" height="32" rx="6" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.16)" />
            <text x={128 + idx * 136} y="102" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">{stage}</text>
            <rect x={68 + idx * 136} y="232" width="120" height="32" rx="6" fill={accentSoft} stroke={accent} strokeOpacity="0.6" />
          </g>
        ))}
        <path d="M 128 168 Q 196 142, 264 172 T 400 202 T 536 154 T 672 138" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        {[
          [128, 168],
          [264, 172],
          [400, 202],
          [536, 154],
          [672, 138],
        ].map(([cx, cy], idx) => (
          <circle key={idx} cx={cx} cy={cy} r="6" fill="#090b10" stroke={accent} strokeWidth="2.5" />
        ))}
      </g>
    );
  }

  if (clean.includes("product-roadmap")) {
    const cols = [
      { label: "Now", sub: "High Confidence", items: 2 },
      { label: "Next", sub: "Medium Confidence", items: 3 },
      { label: "Later", sub: "Direction", items: 3 },
    ];
    return (
      <g>
        {cols.map((col, idx) => {
          const x = 95 + idx * 215;
          return (
            <g key={col.label}>
              <rect x={x} y="76" width="185" height="214" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x={x + 18} y="106" fill="#ffffff" fontSize="14" fontWeight="700">{col.label}</text>
              <text x={x + 18} y="124" fill="rgba(255,255,255,0.55)" fontSize="10">{col.sub}</text>
              {Array.from({ length: col.items }).map((_, cardIdx) => (
                <rect
                  key={cardIdx}
                  x={x + 16}
                  y={142 + cardIdx * 44}
                  width="153"
                  height="32"
                  rx="7"
                  fill={idx === 0 ? accentSoft : "rgba(255,255,255,0.06)"}
                  stroke={idx === 0 ? accent : "rgba(255,255,255,0.12)"}
                />
              ))}
            </g>
          );
        })}
      </g>
    );
  }

  if (clean.includes("ux-task-analysis")) {
    return (
      <g>
        <rect x="310" y="70" width="180" height="40" rx="8" fill={accentSoft} stroke={accent} strokeWidth="1.5" />
        <text x="400" y="95" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">0. Publish First Site</text>
        {[160, 400, 640].map((cx, idx) => (
          <g key={cx}>
            <line x1="400" y1="110" x2={cx} y2="165" stroke="rgba(255,255,255,0.24)" strokeWidth="1.4" />
            <rect x={cx - 72} y="165" width="144" height="36" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
            <text x={cx} y="187" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              {`${idx + 1}. Subgoal`}
            </text>
            <line x1={cx} y1="201" x2={cx - 35} y2="242" stroke="rgba(255,255,255,0.18)" />
            <line x1={cx} y1="201" x2={cx + 35} y2="242" stroke="rgba(255,255,255,0.18)" />
            <rect x={cx - 65} y="242" width="58" height="24" rx="5" fill="rgba(255,255,255,0.05)" />
            <rect x={cx + 7} y="242" width="58" height="24" rx="5" fill="rgba(255,255,255,0.05)" />
          </g>
        ))}
      </g>
    );
  }

  if (clean.includes("interaction-designer")) {
    const states = ["Default", "Hover", "Pressed", "Loading", "Success"];
    return (
      <g>
        {states.map((st, idx) => {
          const x = 68 + idx * 138;
          return (
            <g key={st}>
              <rect
                x={x}
                y="138"
                width="114"
                height="52"
                rx="10"
                fill={idx === 4 ? accentSoft : "rgba(255,255,255,0.06)"}
                stroke={idx === 2 || idx === 4 ? accent : "rgba(255,255,255,0.22)"}
                strokeWidth="1.4"
              />
              <text x={x + 57} y="169" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">{st}</text>
              {idx < states.length - 1 && (
                <line x1={x + 114} y1="164" x2={x + 138} y2="164" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
              )}
            </g>
          );
        })}
      </g>
    );
  }

  if (clean.includes("product-designer")) {
    return (
      <g>
        <circle cx="345" cy="155" r="76" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        <circle cx="455" cy="155" r="76" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        <circle cx="400" cy="222" r="76" fill={accentSoft} stroke={accent} strokeWidth="1.5" />
        <text x="315" y="130" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="12" fontWeight="600">Product</text>
        <text x="485" y="130" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="12" fontWeight="600">Engineering</text>
        <text x="400" y="256" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">Design</text>
        <text x="400" y="182" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">Outcome</text>
      </g>
    );
  }

  if (clean.includes("ux-myths")) {
    return (
      <g>
        {Array.from({ length: 12 }).map((_, idx) => {
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          const x = 110 + col * 148;
          const y = 78 + row * 72;
          return (
            <g key={idx}>
              <rect x={x} y={y} width="132" height="56" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.16)" />
              <line x1={x + 14} y1={y + 20} x2={x + 74} y2={y + 20} stroke="rgba(248,113,113,0.75)" strokeWidth="2" />
              <line x1={x + 14} y1={y + 38} x2={x + 104} y2={y + 38} stroke="#34d399" strokeWidth="2.5" />
            </g>
          );
        })}
      </g>
    );
  }

  if (clean.includes("ux-disciplines")) {
    const lanes = ["Research", "IA", "Interaction", "Content", "UI", "A11y", "Systems", "Code Eng"];
    return (
      <g>
        {lanes.map((lane, idx) => {
          const x = 68 + idx * 84;
          const h = 110 + ((idx % 3) * 28);
          return (
            <g key={lane}>
              <rect x={x} y={240 - h} width="66" height={h} rx="8" fill={idx % 2 === 0 ? accentSoft : "rgba(255,255,255,0.06)"} stroke={idx % 2 === 0 ? accent : "rgba(255,255,255,0.2)"} />
              <text x={x + 33} y="266" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="10" fontWeight="600">{lane}</text>
            </g>
          );
        })}
      </g>
    );
  }

  // Generic modular architectural composition for remaining chapters (personas, testing, books, roadmap, hub)
  return (
    <g>
      <rect x="88" y="78" width="290" height="204" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
      <rect x="114" y="106" width="120" height="14" rx="4" fill={accent} fillOpacity="0.85" />
      <rect x="114" y="136" width="234" height="10" rx="3" fill="rgba(255,255,255,0.18)" />
      <rect x="114" y="158" width="196" height="10" rx="3" fill="rgba(255,255,255,0.12)" />
      <rect x="114" y="196" width="106" height="58" rx="8" fill={accentSoft} stroke={accent} />
      <rect x="234" y="196" width="114" height="58" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.14)" />

      <rect x="412" y="78" width="300" height="94" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.16)" />
      <circle cx="456" cy="125" r="22" fill={accentSoft} stroke={accent} strokeWidth="1.5" />
      <rect x="494" y="112" width="180" height="10" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="494" y="132" width="132" height="8" rx="3" fill="rgba(255,255,255,0.12)" />

      <rect x="412" y="188" width="300" height="94" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.14)" />
      <path d="M 440 250 L 505 224 L 575 236 L 675 208" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

export function EditorialMediaPlate({
  plateKey,
  alt,
  caption,
  variant = "cover",
  className,
}: EditorialMediaPlateProps) {
  const slug = getSlugFromKey(plateKey);
  const motif = CHAPTER_MOTIFS[slug] || CHAPTER_MOTIFS["ux-guide"];

  const safeId = plateKey.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (variant === "diagram") {
    return (
      <figure className={cn("my-12", className)}>
        <div className="overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[#0b0d14] shadow-sm">
          <svg
            viewBox="0 0 800 360"
            className="block w-full h-auto"
            role="img"
            aria-label={alt || caption || motif.title}
          >
            <defs>
              <pattern id={`grid-${safeId}`} width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="360" fill="#0b0d14" />
            <rect width="800" height="360" fill={`url(#grid-${safeId})`} />
            <circle cx="680" cy="60" r="220" fill={motif.accentSoft} opacity="0.55" />
            {renderGraphicGeometry(plateKey, motif.accent, motif.accentSoft)}
          </svg>
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-[var(--iapj-text-muted)] font-serif italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#0a0c12]", className)}>
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={alt || motif.title}
      >
        <defs>
          <radialGradient id={`glow-${slug}`} cx="78%" cy="22%" r="72%">
            <stop offset="0%" stopColor={motif.accent} stopOpacity="0.34" />
            <stop offset="100%" stopColor="#0a0c12" stopOpacity="0" />
          </radialGradient>
          <pattern id={`cover-grid-${slug}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="500" fill="#0a0c12" />
        <rect width="800" height="500" fill={`url(#cover-grid-${slug})`} />
        <rect width="800" height="500" fill={`url(#glow-${slug})`} />
        <g transform="translate(0, 70)">{renderGraphicGeometry(plateKey, motif.accent, motif.accentSoft)}</g>
        <text
          x="44"
          y="54"
          fill="rgba(255,255,255,0.78)"
          fontSize="14"
          fontWeight="600"
          letterSpacing="2"
        >
          {`CHAPTER ${motif.badge} · ${motif.title.toUpperCase()}`}
        </text>
      </svg>
    </div>
  );
}
