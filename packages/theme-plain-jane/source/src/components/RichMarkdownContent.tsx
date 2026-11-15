import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import type { MarkdownBlock } from "../lib/uxMarkdownParser";
import { MermaidDiagram } from "./MermaidDiagram";
import { EditorialMediaPlate } from "./EditorialMediaPlate";

function CopyableCodeBlock({
  language,
  label,
  content,
}: {
  language: string;
  label?: string;
  content: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--iapj-border)] px-5 py-3 text-xs text-[var(--iapj-text-muted)]">
        <span className="font-mono tracking-tight">
          {label ? `${label} · ${language}` : language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto bg-transparent p-5 text-[13px] leading-relaxed font-mono text-[var(--iapj-text-primary)]">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function renderInlineTokens(text: string): React.ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const splitIdx = part.indexOf("](");
      const label = part.slice(1, splitIdx);
      const href = part.slice(splitIdx + 2, -1);
      if (href.startsWith("/")) {
        return (
          <Link
            key={idx}
            to={href}
            className="font-medium text-[var(--iapj-accent)] underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--iapj-accent)] underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          {label}
        </a>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-[var(--iapj-text-primary)]">
          {renderInlineTokens(part.slice(2, -2))}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded bg-[var(--iapj-surface-subtle)] border border-[var(--iapj-border)] px-1.5 py-0.5 text-[0.875em] font-mono text-[var(--iapj-text-primary)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <Fragment key={idx}>{part}</Fragment>;
  });
}

export function RichMarkdownContent({ blocks }: { blocks: MarkdownBlock[] }) {
  return (
    <>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading":
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  id={block.id}
                  className="text-3xl mt-16 mb-6 font-semibold tracking-tight text-[var(--iapj-text-primary)]"
                >
                  {block.text}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                id={block.id}
                className="text-2xl mt-10 mb-4 font-semibold tracking-tight text-[var(--iapj-text-primary)]"
              >
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p key={idx} className="leading-relaxed text-[var(--iapj-text-body)]">
                {renderInlineTokens(block.text)}
              </p>
            );

          case "list":
            if (block.ordered) {
              return (
                <ol key={idx} className="my-6 space-y-3 list-decimal pl-6">
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="leading-relaxed text-[var(--iapj-text-body)]">
                      {renderInlineTokens(item)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={idx} className="my-6 space-y-3 list-disc pl-6">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed text-[var(--iapj-text-body)]">
                    {renderInlineTokens(item)}
                  </li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div
                key={idx}
                className="not-prose my-10 overflow-x-auto rounded-2xl border border-[var(--iapj-border)]"
              >
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)]">
                      {block.headers.map((header, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-4 py-3 font-semibold tracking-wide text-[var(--iapj-text-primary)]"
                        >
                          {header || "Dimension"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--iapj-border)]">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-4 py-3 align-top text-[var(--iapj-text-body)] tabular-nums"
                          >
                            {renderInlineTokens(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "code":
            return (
              <div key={idx} className="not-prose">
                <CopyableCodeBlock
                  language={block.language}
                  label={block.label}
                  content={block.content}
                />
              </div>
            );

          case "mermaid":
            return (
              <div key={idx} className="not-prose">
                <MermaidDiagram chart={block.chart} />
              </div>
            );

          case "blockquote":
            return (
              <div
                key={idx}
                className="not-prose my-10 rounded-2xl iapj-clay-card p-6 sm:p-8 space-y-2"
              >
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx} className="text-base leading-relaxed text-[var(--iapj-text-primary)]">
                    {renderInlineTokens(line)}
                  </p>
                ))}
              </div>
            );

          case "media":
            return (
              <div key={idx} className="not-prose">
                <EditorialMediaPlate
                  plateKey={block.mediaKey}
                  alt={block.alt}
                  caption={block.caption}
                  variant="diagram"
                />
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
