"use client";

/**
 * Gallery's sole interactive CTA (D-01/GAL-05): a hover/focus-reveal overlay
 * button on top of a card's mini-chart preview that loads that card's exact
 * vessel pair into the homepage Sandbox via the SandboxBridgeProvider
 * (Plan 17-01) and scrolls there -- no navigation, matching PITFALLS.md
 * Pitfall 2's specific failure mode ("Try on Sandbox" secretly falling back
 * to router.push) by construction, since this component never imports
 * next/link or next/navigation.
 */

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandboxBridge } from "../../sandbox/bridge/SandboxBridgeProvider.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";

export function TryOnSandboxButton({
  vesselA,
  vesselB,
  title,
}: {
  vesselA: Vessel;
  vesselB: Vessel;
  title: string;
}) {
  const { requestLoad } = useSandboxBridge();

  function handleClick(): void {
    requestLoad(vesselA, vesselB);
    // D-08: scroll fires synchronously alongside requestLoad, in the same
    // handler -- the #sandbox anchor's position doesn't depend on which
    // scenario is loaded, so there's no need to wait for the re-render.
    // D-07: no explicit scroll option override here -- relies on
    // app/globals.css's global prefers-reduced-motion-gated smooth scroll;
    // never hardcode a "smooth" scroll option literal in this file.
    document.getElementById("sandbox")?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="
      absolute inset-0 flex items-center justify-center rounded-md
    ">
      <div
        aria-hidden="true"
        className="
          absolute inset-0 rounded-md bg-background/70 opacity-0
          transition-opacity duration-200
          group-focus-within:opacity-100
          group-hover:opacity-100
          [@media(hover:none)]:opacity-40
        "
      />
      <Button
        type="button"
        variant="default"
        onClick={handleClick}
        aria-label={`Try ${title} on Sandbox`}
        className="
          relative z-1 opacity-0 transition-opacity duration-200
          group-focus-within:opacity-100
          group-hover:opacity-100
          [@media(hover:none)]:opacity-40
        "
      >
        <PlayCircle aria-hidden="true" />
        Try on Sandbox
      </Button>
    </div>
  );
}
