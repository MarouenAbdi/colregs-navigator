"use client";

/**
 * Page-scoped signaling channel between Gallery's "Try on Sandbox" button
 * (Plan 17-02's TryOnSandboxButton) and Sandbox's loadScenario() (Phase 16).
 * Zero business logic lives here -- validation/classification stays inside
 * useSandboxState(); this Provider only carries a pending vessel pair across
 * the Server Component tree without prop-drilling and without Zustand (only
 * 2 low-frequency consumers, below this project's zustand-adoption trigger
 * per ARCHITECTURE.md Pattern 2 / Anti-Pattern 4).
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Vessel } from "../../../domain/vessel/vessel.js";

export type PendingScenario = { vesselA: Vessel; vesselB: Vessel; requestId: number };

const SandboxBridgeContext = createContext<{
  pendingScenario: PendingScenario | null;
  requestLoad: (vesselA: Vessel, vesselB: Vessel) => void;
} | null>(null);

export function SandboxBridgeProvider({ children }: { children: ReactNode }) {
  const [pendingScenario, setPendingScenario] = useState<PendingScenario | null>(null);

  const requestLoad = useCallback((vesselA: Vessel, vesselB: Vessel) => {
    // requestId is keyed off Date.now(), not vessel-pair object identity, so
    // re-selecting the same Gallery scenario twice in a row still re-triggers
    // SandboxContainer's consuming effect (Roadmap Phase 17 success criterion 4).
    setPendingScenario({ vesselA, vesselB, requestId: Date.now() });
  }, []);

  return (
    <SandboxBridgeContext.Provider value={{ pendingScenario, requestLoad }}>
      {children}
    </SandboxBridgeContext.Provider>
  );
}

export function useSandboxBridge() {
  const ctx = useContext(SandboxBridgeContext);
  if (!ctx) throw new Error("useSandboxBridge must be used within SandboxBridgeProvider");
  return ctx;
}
