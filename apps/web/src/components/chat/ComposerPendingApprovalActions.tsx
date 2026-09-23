import {
  type ApprovalRequestId,
  type ProviderApprovalDecision,
  type ProviderApprovalOption,
} from "@t3tools/contracts";
import { memo } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

interface ComposerPendingApprovalActionsProps {
  requestId: ApprovalRequestId;
  isResponding: boolean;
  options?: ReadonlyArray<ProviderApprovalOption> | undefined;
  onRespondToApproval: (
    requestId: ApprovalRequestId,
    decision: ProviderApprovalDecision,
  ) => Promise<unknown>;
}

const APPROVAL_ACTION_CLASS_NAME = "h-auto min-h-8 max-w-full py-1.5 font-medium";
const DEFAULT_APPROVAL_OPTIONS = [
  { decision: "cancel", label: "Cancel" },
  { decision: "decline", label: "Decline" },
  { decision: "acceptForSession", label: "Always allow this session" },
  { decision: "accept", label: "Approve" },
] satisfies ReadonlyArray<ProviderApprovalOption>;

export const ComposerPendingApprovalActions = memo(function ComposerPendingApprovalActions({
  requestId,
  isResponding,
  options = DEFAULT_APPROVAL_OPTIONS,
  onRespondToApproval,
}: ComposerPendingApprovalActionsProps) {
  return (
    <>
      {options.map((option) => {
        const button = (
          <Button
            key={option.decision}
            size="sm"
            variant={option.decision === "accept" ? "default" : "outline"}
            className={`${APPROVAL_ACTION_CLASS_NAME}${
              option.decision === "decline"
                ? " text-destructive-foreground [:hover,[data-pressed]]:text-destructive-foreground"
                : option.warning
                  ? " text-warning"
                  : ""
            }`}
            disabled={isResponding}
            aria-description={option.warning}
            onClick={() => void onRespondToApproval(requestId, option.decision)}
          >
            {option.warning ? <TriangleAlertIcon className="size-3 shrink-0" /> : null}
            <span className="min-w-0 whitespace-normal text-left [overflow-wrap:anywhere]">
              {option.label}
            </span>
          </Button>
        );
        // A provider caution, such as a prompt injection warning on "allow
        // always", remains available on hover and keyboard focus.
        return option.warning ? (
          <Tooltip key={option.decision}>
            <TooltipTrigger render={button} />
            <TooltipPopup side="top" className="max-w-72 text-xs leading-snug">
              {option.warning}
            </TooltipPopup>
          </Tooltip>
        ) : (
          button
        );
      })}
    </>
  );
});
