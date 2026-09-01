import type { ReactNode } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ExportStage,
  ExportValidationMessage,
} from "@/utils/export-validation";

export type StageState = "done" | "active" | "warn" | "blocked" | "todo";

/**
 * How each state marks itself inside the 14px ring.
 *
 * `done`, `warn` and `blocked` are real glyphs. `active` and `todo` are not:
 * lucide's Dot centres its circle at (12.1, 12.1) in a 24-unit box rather than
 * (12, 12), and needs stroke-width 8 to register at this size — which renders a
 * blob that is both off-centre and wider than the ring containing it. A CSS
 * disc is exactly centred by the grid and costs nothing. `todo` draws nothing:
 * the ring is already the empty state, and an inner circle just doubled it.
 */
const MARK: Record<
  StageState,
  { icon: typeof Check | null; className: string }
> = {
  done: { icon: Check, className: "text-ok border-ok" },
  active: { icon: null, className: "text-brand border-brand bg-brand-soft" },
  warn: { icon: AlertTriangle, className: "text-warn border-warn" },
  blocked: {
    icon: AlertTriangle,
    className: "text-destructive border-destructive",
  },
  todo: { icon: null, className: "text-faint-foreground border-stroke" },
};

/**
 * One step of the export pipeline.
 *
 * A status map, not a wizard: every stage stays reachable, because the workflow
 * is loopy — people re-record after seeing the atlas, then come straight back.
 *
 * The layout is two columns and stays two columns. Letting content span into
 * the marker column buys about twenty pixels and breaks the connector, so the
 * one stage with a problem becomes the one that looks detached from the run.
 */
export function Stage({
  index,
  title,
  hint,
  state,
  last = false,
  children,
}: {
  index: number;
  title: string;
  hint?: ReactNode;
  state: StageState;
  last?: boolean;
  children?: ReactNode;
}) {
  const mark = MARK[state];
  const Icon = mark.icon;

  return (
    <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-x-1.5">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "grid size-3.5 shrink-0 place-items-center rounded-full border",
            mark.className,
          )}
        >
          {Icon ? (
            <Icon size={9} strokeWidth={3} />
          ) : state === "active" ? (
            <span className="size-1.5 rounded-full bg-current" />
          ) : null}
        </span>
        {/* Runs the full height of the stage, content included. */}
        {!last && <span className="mt-[3px] w-px flex-1 bg-border" />}
      </div>

      <div className={cn("min-w-0", last ? "pb-0" : "pb-3.5")}>
        <div className="flex h-4 items-baseline gap-1.5">
          <span className="font-mono text-[9px] text-faint-foreground tabular-nums">
            {index}
          </span>
          <span className="text-[11px] font-semibold">{title}</span>
          {hint ? (
            <span
              className={cn(
                "ml-auto truncate font-mono text-[10px] tabular-nums",
                state === "warn" && "text-warn",
                state === "blocked" && "text-destructive",
                state !== "warn" &&
                  state !== "blocked" &&
                  "text-faint-foreground",
              )}
            >
              {hint}
            </span>
          ) : null}
        </div>
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * A problem, given a surface of its own.
 *
 * Loose coloured prose in a panel reads as a sentence somebody left behind.
 * A bordered, tinted block reads as a state to resolve — which is what it is.
 * The headline is whatever the validator said, verbatim; only the depth of
 * detail varies between here and the export dialog.
 */
export function ValidationNote({
  message,
  showDetail = false,
  onFix,
  className,
}: {
  message: ExportValidationMessage;
  showDetail?: boolean;
  onFix?: () => void;
  className?: string;
}) {
  const isError = message.severity === "error";
  const isInfo = message.severity === "info";

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-[7px] gap-y-1.5 rounded-md border px-2 py-[7px]",
        isError && "border-destructive/30 bg-destructive/10",
        !isError && !isInfo && "border-warn-line bg-warn-soft",
        isInfo && "border-stroke bg-row-hover",
        className,
      )}
    >
      <AlertTriangle
        size={12}
        className={cn(
          "mt-px",
          isError && "text-destructive",
          !isError && !isInfo && "text-warn",
          isInfo && "text-faint-foreground",
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-[10px] font-semibold leading-snug",
            isError && "text-destructive",
            !isError && !isInfo && "text-warn",
            isInfo && "text-muted-foreground",
          )}
        >
          {message.message}
        </p>
        {showDetail && message.detail ? (
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {message.detail}
          </p>
        ) : null}
      </div>
      {message.fix && onFix ? (
        <button
          type="button"
          onClick={onFix}
          className={cn(
            "col-start-2 h-5 justify-self-start rounded-sm border px-2 text-[10px] transition-colors",
            isError
              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
              : "border-warn-line text-warn hover:bg-warn-soft",
          )}
        >
          {message.fix}
        </button>
      ) : null}
    </div>
  );
}

/** Pick the worst severity reported against a stage. */
export function stageStateFor(
  stage: ExportStage,
  messages: ExportValidationMessage[],
  fallback: StageState,
): StageState {
  const mine = messages.filter((message) => message.stage === stage);
  if (mine.some((message) => message.severity === "error")) return "blocked";
  if (mine.some((message) => message.severity === "warning")) return "warn";
  return fallback;
}
