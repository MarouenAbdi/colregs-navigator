"use client";

/**
 * CopyLinkButton (05-05) -- small affordance next to the /s/[shareId] banner
 * that copies the current page URL to the clipboard. Secondary/input-adjacent
 * styling (matches ControlPanel's `rounded border border-slate-200` inputs),
 * not the primary teal-600 CTA styling reserved for Save/Reset.
 */

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:border-teal-600"
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
