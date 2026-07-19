"use client";

/**
 * CopyLinkButton -- small affordance next to the /s/[shareId] banner that
 * copies the current page URL to the clipboard. Restyled to an icon-only
 * outline button matching the rest of Phase 8's dark palette; clipboard
 * logic is unchanged.
 */

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Permission-denied / insecure-context rejection -- leave the button
      // in its normal (uncopied) state rather than an unhandled rejection.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      aria-label={copied ? "Link copied" : "Copy link"}
    >
      {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
    </Button>
  );
}
