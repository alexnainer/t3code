import { memo } from "react";
import { type PendingApproval } from "../../session-logic";
import { cn } from "~/lib/utils";

interface ComposerPendingApprovalPanelProps {
  approval: PendingApproval;
  pendingCount: number;
  className?: string;
}

export const ComposerPendingApprovalPanel = memo(function ComposerPendingApprovalPanel({
  approval,
  pendingCount,
  className,
}: ComposerPendingApprovalPanelProps) {
  const fallbackLabel =
    approval.requestKind === "mcp-elicitation"
      ? "App access approval"
      : approval.requestKind === "command"
        ? "Command approval"
        : approval.requestKind === "file-read"
          ? "File read approval"
          : "File change approval";
  const detailAriaLabel =
    approval.requestKind === "mcp-elicitation"
      ? "App access request"
      : approval.requestKind === "command"
        ? "Command"
        : approval.requestKind === "file-read"
          ? "File to read"
          : "File change";

  return (
    <div aria-label={fallbackLabel} className={cn("min-w-0 space-y-2", className)} role="group">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
          {fallbackLabel}
          {approval.appName ? ` · ${approval.appName}` : ""}
        </span>
        {pendingCount > 1 ? (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            1 of {pendingCount}
          </span>
        ) : null}
      </div>
      <code
        aria-label={detailAriaLabel}
        className="block max-h-[min(16rem,30dvh)] min-w-0 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/50 p-3 font-mono text-xs/5 text-foreground [overflow-wrap:anywhere] [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70"
        data-approval-detail="complete"
        tabIndex={0}
      >
        {approval.detail || fallbackLabel}
      </code>
    </div>
  );
});
