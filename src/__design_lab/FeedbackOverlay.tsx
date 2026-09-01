import { useCallback, useEffect, useRef, useState } from "react";

type Comment = {
  id: string;
  variant: string;
  selector: string;
  elementLabel: string;
  text: string;
};

/** Best-effort stable selector for an arbitrary element in the lab. */
function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const testId = el.getAttribute("data-testid");
  if (testId) return `[data-testid='${testId}']`;
  const label = el.getAttribute("data-label");
  if (label) return `[data-label='${label}']`;

  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth < 4 && node.tagName !== "BODY") {
    let part = node.tagName.toLowerCase();
    const cls = (node.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter((c) => c && !c.includes("[") && !c.includes(":"))
      .slice(0, 2)
      .join(".");
    if (cls) part += `.${cls}`;
    parts.unshift(part);
    node = node.parentElement;
    depth += 1;
  }
  return parts.join(" > ");
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 42);
  return text ? `${tag} with "${text}"` : tag;
}

function findVariant(el: Element): string {
  const host = el.closest("[data-variant]");
  return host?.getAttribute("data-variant") ?? "?";
}

export function FeedbackOverlay({ targetName }: { targetName: string }) {
  const [picking, setPicking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState<Omit<Comment, "text"> | null>(null);
  const [draftText, setDraftText] = useState("");
  const [direction, setDirection] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const highlight = useRef<HTMLDivElement | null>(null);

  // Follow the pointer with a highlight box while picking.
  useEffect(() => {
    if (!picking) return;

    const onMove = (event: MouseEvent) => {
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const box = highlight.current;
      if (!el || !box) return;
      if (el.closest("[data-feedback-ui]")) {
        box.style.display = "none";
        return;
      }
      const rect = el.getBoundingClientRect();
      box.style.display = "block";
      box.style.top = `${rect.top}px`;
      box.style.left = `${rect.left}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    };

    const onClick = (event: MouseEvent) => {
      const el = document.elementFromPoint(event.clientX, event.clientY);
      if (!el || el.closest("[data-feedback-ui]")) return;
      event.preventDefault();
      event.stopPropagation();
      setDraft({
        id: `${Date.now()}`,
        variant: findVariant(el),
        selector: buildSelector(el),
        elementLabel: describeElement(el),
      });
      setDraftText("");
      setPicking(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPicking(false);
    };

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      if (highlight.current) highlight.current.style.display = "none";
    };
  }, [picking]);

  const saveDraft = () => {
    if (!draft || !draftText.trim()) return;
    setComments((prev) => [...prev, { ...draft, text: draftText.trim() }]);
    setDraft(null);
    setDraftText("");
  };

  const format = useCallback(() => {
    const byVariant = new Map<string, Comment[]>();
    for (const comment of comments) {
      const list = byVariant.get(comment.variant) ?? [];
      list.push(comment);
      byVariant.set(comment.variant, list);
    }

    const lines = [
      "## Design Lab Feedback",
      "",
      `**Target:** ${targetName}`,
      `**Comments:** ${comments.length}`,
      "",
    ];

    for (const [variant, list] of [...byVariant.entries()].sort()) {
      lines.push(`### Variant ${variant}`);
      list.forEach((comment, index) => {
        lines.push(
          `${index + 1}. **${comment.elementLabel}** (\`${comment.selector}\`)`,
        );
        lines.push(`   "${comment.text}"`);
      });
      lines.push("");
    }

    lines.push("### Overall Direction");
    lines.push(direction.trim() || "(not provided)");
    return lines.join("\n");
  }, [comments, direction, targetName]);

  const submit = async () => {
    const text = format();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt("Copy this feedback and paste it to Claude:", text);
    }
  };

  return (
    <div data-feedback-ui>
      {picking && (
        <div
          ref={highlight}
          style={{
            position: "fixed",
            display: "none",
            pointerEvents: "none",
            border: "2px solid #3b82f6",
            background: "rgba(59,130,246,0.14)",
            borderRadius: 2,
            zIndex: 2147483000,
          }}
        />
      )}

      {/* Draft comment popover */}
      {draft && (
        <div style={panelStyle({ bottom: 88, right: 24, width: 320 })}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
            Variant {draft.variant} · {draft.elementLabel}
          </div>
          <textarea
            autoFocus
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                saveDraft();
              }
            }}
            placeholder="What about this element?"
            style={{
              width: "100%",
              minHeight: 72,
              resize: "vertical",
              background: "#111",
              color: "#eee",
              border: "1px solid #333",
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={saveDraft} style={btnStyle(true)}>
              Save
            </button>
            <button onClick={() => setDraft(null)} style={btnStyle(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collected feedback panel */}
      {panelOpen && (
        <div
          style={panelStyle({
            bottom: 88,
            right: 24,
            width: 360,
            maxHeight: "62vh",
          })}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            {comments.length} comment{comments.length === 1 ? "" : "s"}
          </div>
          <div style={{ overflowY: "auto", maxHeight: "28vh", marginBottom: 10 }}>
            {comments.length === 0 && (
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Click “Add feedback”, then click any element in a variant.
              </div>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  borderTop: "1px solid #2a2a2a",
                  padding: "8px 0",
                  fontSize: 12,
                }}
              >
                <div style={{ opacity: 0.65, fontSize: 11 }}>
                  {comment.variant} · {comment.elementLabel}
                </div>
                <div>{comment.text}</div>
                <button
                  onClick={() =>
                    setComments((prev) =>
                      prev.filter((entry) => entry.id !== comment.id),
                    )
                  }
                  style={{
                    ...btnStyle(false),
                    padding: "1px 6px",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
            Overall direction (required)
          </div>
          <textarea
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            placeholder="e.g. Variant A's surface language with C's viewport treatment"
            style={{
              width: "100%",
              minHeight: 60,
              resize: "vertical",
              background: "#111",
              color: "#eee",
              border: "1px solid #333",
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={submit}
            style={{ ...btnStyle(true), width: "100%", marginTop: 8 }}
          >
            {copied ? "Copied — paste it to Claude" : "Submit all feedback"}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          gap: 8,
          zIndex: 2147483001,
        }}
      >
        <button
          onClick={() => {
            setPicking((value) => !value);
            setPanelOpen(false);
          }}
          style={btnStyle(picking)}
        >
          {picking ? "Picking… (Esc)" : "Add feedback"}
        </button>
        <button onClick={() => setPanelOpen((value) => !value)} style={btnStyle(false)}>
          Review ({comments.length})
        </button>
      </div>
    </div>
  );
}

function panelStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    position: "fixed",
    background: "#1b1b1b",
    color: "#eaeaea",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    zIndex: 2147483001,
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    ...extra,
  };
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "#3b82f6" : "#2a2a2a",
    color: active ? "#fff" : "#ddd",
    border: "1px solid " + (active ? "#3b82f6" : "#3a3a3a"),
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  };
}
