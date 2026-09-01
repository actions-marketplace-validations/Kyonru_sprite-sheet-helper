import * as React from "react";
import { cn } from "@/lib/utils";

type ScrubFieldProps = {
  value: number;
  onValueChange: (value: number) => void;
  /**
   * Rendered inside the field, on the left. Omit when the field already sits in
   * a labelled row — two labels for one control reads as a bug.
   */
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  /** Value change per pixel dragged, and the arrow-key increment. */
  step?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

const isPartialNumber = (draft: string) =>
  draft === "" || draft === "-" || draft === "." || draft === "-." || draft.endsWith(".");

const clamp = (value: number, min?: number, max?: number) => {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
};

/** Trim float drift from repeated addition without forcing a fixed precision. */
const round = (value: number, step: number) => {
  const decimals = Math.min(6, (String(step).split(".")[1] ?? "").length);
  return Number(value.toFixed(decimals));
};

/**
 * A numeric field you can drag.
 *
 * Horizontal drag scrubs the value; a click without a drag focuses it for
 * typing, so the control never costs you the ability to enter an exact number.
 *
 * When the field has a bounded range, a 2px bar on the bottom edge reports the
 * value's position in it — the control describes itself without a separate
 * slider beside it. The bar sits on the edge rather than filling the field: a
 * full-height fill cuts through the label mid-word at low values and reads as a
 * rendering fault, and on the edge it doubles as the focus underline.
 */
export function ScrubField({
  value,
  onValueChange,
  label,
  unit,
  min,
  max,
  step = 0.01,
  disabled,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: ScrubFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const drag = React.useRef<{ x: number; from: number; moved: boolean } | null>(null);
  const [draft, setDraft] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);
  const [scrubbing, setScrubbing] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [focused, value]);

  const commit = (next: number) => {
    if (!Number.isFinite(next)) return;
    onValueChange(clamp(round(next, step), min, max));
  };

  const bounded = typeof min === "number" && typeof max === "number" && max > min;
  const fill = bounded ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;

  const onPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    if (disabled || event.button !== 0 || focused) return;
    // Hold focus off until we know this is a click and not a drag.
    event.preventDefault();
    drag.current = { x: event.clientX, from: value, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLInputElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    if (!state.moved) {
      if (Math.abs(dx) < 3) return;
      state.moved = true;
      setScrubbing(true);
    }
    // Shift scrubs finer, the convention in every DCC tool.
    const increment = event.shiftKey ? step / 10 : step;
    commit(state.from + dx * increment);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLInputElement>) => {
    const state = drag.current;
    drag.current = null;
    setScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state && !state.moved) inputRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const increment = (event.shiftKey ? step * 10 : step) * (event.key === "ArrowUp" ? 1 : -1);
    commit(value + increment);
  };

  return (
    <div
      className={cn(
        "group relative flex h-6 items-center gap-2 overflow-hidden rounded-md border border-stroke bg-surface-sunken px-2 pb-0.5",
        "transition-colors hover:border-stroke-strong focus-within:border-brand-line",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {bounded && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-brand transition-[width] duration-100"
          style={{ width: `${fill * 100}%` }}
        />
      )}
      {label ? (
        <span className="pointer-events-none relative shrink-0 text-[10px] text-muted-foreground">
          {label}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        data-testid={testId}
        role="spinbutton"
        aria-label={ariaLabel ?? label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        disabled={disabled}
        value={draft}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setDraft(String(value));
        }}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (isPartialNumber(next)) return;
          const parsed = Number(next);
          if (Number.isFinite(parsed)) onValueChange(clamp(parsed, min, max));
        }}
        className={cn(
          "relative min-w-0 flex-1 bg-transparent text-right font-mono text-[11px] tabular-nums outline-none",
          label ? "text-foreground" : "text-center",
          scrubbing ? "cursor-ew-resize" : "cursor-ew-resize focus:cursor-text",
        )}
      />
      {unit ? (
        <span className="pointer-events-none relative shrink-0 text-[9px] text-faint-foreground">
          {unit}
        </span>
      ) : null}
    </div>
  );
}
