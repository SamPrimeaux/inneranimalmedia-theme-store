interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const isAgentRiskFlow = chart.includes("Risk level") && chart.includes("Goal stated");
  const isApprovalLanesFlow =
    chart.includes("User asks for a change") && chart.includes("Needs a risky tool?");

  if (isAgentRiskFlow) {
    return (
      <figure className="my-10 overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] p-5 sm:p-8">
        <svg
          viewBox="0 0 780 330"
          className="w-full h-auto"
          role="img"
          aria-label="Agentic approval and execution flowchart"
        >
          <defs>
            <marker
              id="mermaid-arrow-td"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" className="text-[var(--iapj-text-muted)]" />
            </marker>
          </defs>

          {/* Edges */}
          <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--iapj-text-muted)]">
            <line x1="150" y1="54" x2="215" y2="54" markerEnd="url(#mermaid-arrow-td)" />
            <line x1="355" y1="54" x2="420" y2="54" markerEnd="url(#mermaid-arrow-td)" />
            {/* low -> Run + log */}
            <path d="M 495 88 L 495 148 L 285 148 L 285 180" markerEnd="url(#mermaid-arrow-td)" />
            {/* high -> Ask for approval */}
            <path d="M 565 54 L 660 54 L 660 112" markerEnd="url(#mermaid-arrow-td)" />
            {/* approve yes -> Run + log */}
            <path d="M 595 148 L 460 148 L 460 198 L 365 198" markerEnd="url(#mermaid-arrow-td)" />
            {/* approve no -> Explain */}
            <line x1="660" y1="176" x2="660" y2="236" markerEnd="url(#mermaid-arrow-td)" />
            {/* Run + log -> Report + undo */}
            <line x1="285" y1="238" x2="285" y2="272" markerEnd="url(#mermaid-arrow-td)" />
          </g>

          {/* Edge Labels */}
          <g className="fill-[var(--iapj-text-muted)] font-mono text-[11px]">
            <text x="392" y="138" textAnchor="middle">low risk</text>
            <text x="615" y="45" textAnchor="middle">high risk</text>
            <text x="530" y="138" textAnchor="middle">yes</text>
            <text x="674" y="210">no</text>
          </g>

          {/* Nodes */}
          <g>
            <rect x="20" y="28" width="130" height="52" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="85" y="59" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[13px] font-semibold">Goal stated</text>

            <rect x="220" y="28" width="135" height="52" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="287" y="59" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[13px] font-semibold">Plan shown</text>

            {/* Diamond Risk Level */}
            <polygon points="495,16 565,54 495,92 425,54" className="fill-[var(--iapj-accent-soft)] stroke-[var(--iapj-accent)]" strokeWidth="1.4" />
            <text x="495" y="58" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">Risk level</text>

            <rect x="575" y="118" width="170" height="56" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-accent)]" strokeWidth="1.4" />
            <text x="660" y="150" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[13px] font-semibold">Ask for approval</text>

            <rect x="205" y="185" width="160" height="52" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="285" y="216" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[13px] font-semibold">Run + log</text>

            <rect x="550" y="242" width="210" height="54" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border)]" strokeWidth="1.2" />
            <text x="655" y="274" textAnchor="middle" className="fill-[var(--iapj-text-body)] text-[12px] font-medium">Explain + offer options</text>

            <rect x="175" y="274" width="220" height="46" rx="10" className="fill-[var(--iapj-surface-contrast)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="285" y="302" textAnchor="middle" className="fill-[var(--iapj-surface-contrast-ink)] text-[13px] font-semibold">Report + undo available</text>
          </g>
        </svg>
        <figcaption className="mt-3 text-center text-xs text-[var(--iapj-text-muted)]">
          Risk-proportional approval flow for agentic interfaces
        </figcaption>
      </figure>
    );
  }

  if (isApprovalLanesFlow) {
    return (
      <figure className="my-10 overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] p-5 sm:p-8">
        <svg
          viewBox="0 0 820 290"
          className="w-full h-auto"
          role="img"
          aria-label="Tool approval workflow from user request to review and undo"
        >
          <defs>
            <marker
              id="mermaid-arrow-lr"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" className="text-[var(--iapj-text-muted)]" />
            </marker>
          </defs>

          <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--iapj-text-muted)]">
            <line x1="165" y1="62" x2="215" y2="62" markerEnd="url(#mermaid-arrow-lr)" />
            <line x1="355" y1="62" x2="405" y2="62" markerEnd="url(#mermaid-arrow-lr)" />
            {/* no -> runs */}
            <line x1="565" y1="62" x2="625" y2="62" markerEnd="url(#mermaid-arrow-lr)" />
            {/* yes -> approval */}
            <line x1="485" y1="104" x2="485" y2="152" markerEnd="url(#mermaid-arrow-lr)" />
            {/* approve -> runs */}
            <path d="M 555 182 L 700 182 L 700 94" markerEnd="url(#mermaid-arrow-lr)" />
            {/* deny -> explain */}
            <line x1="415" y1="182" x2="345" y2="182" markerEnd="url(#mermaid-arrow-lr)" />
            {/* runs -> review */}
            <path d="M 760 62 L 790 62 L 790 250 L 535 250" markerEnd="url(#mermaid-arrow-lr)" />
            {/* undo -> start */}
            <path d="M 355 250 L 90 250 L 90 92" markerEnd="url(#mermaid-arrow-lr)" />
          </g>

          <g className="fill-[var(--iapj-text-muted)] font-mono text-[11px]">
            <text x="595" y="52" textAnchor="middle">no</text>
            <text x="498" y="132">yes</text>
            <text x="628" y="172" textAnchor="middle">approve</text>
            <text x="380" y="172" textAnchor="middle">deny</text>
            <text x="220" y="240" textAnchor="middle">undo</text>
          </g>

          <g>
            <rect x="20" y="34" width="145" height="56" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="92" y="58" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">User asks for</text>
            <text x="92" y="75" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">a change</text>

            <rect x="220" y="34" width="135" height="56" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="287" y="58" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">Agent drafts</text>
            <text x="287" y="75" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">plan</text>

            <polygon points="485,20 565,62 485,104 405,62" className="fill-[var(--iapj-accent-soft)] stroke-[var(--iapj-accent)]" strokeWidth="1.4" />
            <text x="485" y="59" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[11px] font-semibold">Needs a</text>
            <text x="485" y="74" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[11px] font-semibold">risky tool?</text>

            <rect x="630" y="34" width="130" height="56" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="695" y="58" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">Agent runs</text>
            <text x="695" y="75" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">and reports</text>

            <rect x="418" y="156" width="134" height="52" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-accent)]" strokeWidth="1.4" />
            <text x="485" y="186" textAnchor="middle" className="fill-[var(--iapj-text-primary)] text-[12px] font-semibold">Approval prompt</text>

            <rect x="145" y="156" width="195" height="52" rx="10" className="fill-[var(--iapj-surface-elevated)] stroke-[var(--iapj-border)]" strokeWidth="1.2" />
            <text x="242" y="178" textAnchor="middle" className="fill-[var(--iapj-text-body)] text-[12px] font-medium">Agent explains &amp;</text>
            <text x="242" y="195" textAnchor="middle" className="fill-[var(--iapj-text-body)] text-[12px] font-medium">offers alternatives</text>

            <rect x="360" y="226" width="170" height="46" rx="10" className="fill-[var(--iapj-surface-contrast)] stroke-[var(--iapj-border-strong)]" strokeWidth="1.2" />
            <text x="445" y="254" textAnchor="middle" className="fill-[var(--iapj-surface-contrast-ink)] text-[12px] font-semibold">User reviews result</text>
          </g>
        </svg>
        <figcaption className="mt-3 text-center text-xs text-[var(--iapj-text-muted)]">
          Tool-approval decision path with explicit deny and undo branches
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] p-5">
      <pre className="m-0 overflow-x-auto text-xs font-mono leading-relaxed text-[var(--iapj-text-primary)]">
        <code>{chart}</code>
      </pre>
    </div>
  );
}
