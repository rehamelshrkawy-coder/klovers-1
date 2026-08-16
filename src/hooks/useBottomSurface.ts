import { useEffect, useSyncExternalStore } from "react";

/**
 * Traffic control for the bottom of the viewport.
 *
 * Five surfaces compete for the strip where a phone user's thumb lives: the
 * WhatsApp FAB, the sticky enrol bar, the exit nudge, toasts and the cookie
 * banner. Each was individually well built — sensible cooldowns, dwell-time
 * gates, eligibility checks — but nobody owned the bottom 120px, so four could
 * be on screen at once and the exit nudge (z-50) landed directly on top of the
 * sticky bar (z-40) it shares an anchor with.
 *
 * This is the missing owner. Surfaces declare that they *want* to show; only
 * the highest-priority claimant is granted. Module-level state, no provider —
 * these components are mounted in several different trees.
 */

/** Higher wins. Legal notices outrank marketing; marketing outranks the FAB. */
export const BOTTOM_SURFACE_PRIORITY = {
  cookieBanner: 40,
  exitNudge: 30,
  stickyBar: 20,
  whatsappFab: 10,
} as const;

export type BottomSurfaceId = keyof typeof BOTTOM_SURFACE_PRIORITY;

const claims = new Map<BottomSurfaceId, number>();
const listeners = new Set<() => void>();

/** The id currently allowed to render, or null when the strip is free. */
let grantedId: BottomSurfaceId | null = null;

function recompute() {
  let winner: BottomSurfaceId | null = null;
  let best = -Infinity;
  for (const [id, priority] of claims) {
    if (priority > best) { best = priority; winner = id; }
  }
  if (winner === grantedId) return;
  grantedId = winner;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return grantedId;
}

/**
 * Claim the bottom strip while `wants` is true.
 *
 * @returns true when this surface is the one that may render.
 */
export function useBottomSurface(id: BottomSurfaceId, wants: boolean): boolean {
  const granted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!wants) {
      if (claims.delete(id)) recompute();
      return;
    }
    claims.set(id, BOTTOM_SURFACE_PRIORITY[id]);
    recompute();
    return () => {
      claims.delete(id);
      recompute();
    };
  }, [id, wants]);

  return wants && granted === id;
}

/**
 * A surface that must sit *above* whatever else is anchored to the bottom —
 * used by the FAB, which is a small round button rather than a full-width bar
 * and so can coexist as long as it is lifted clear.
 */
export function useBottomStripOccupied(): boolean {
  const granted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return granted !== null && granted !== "whatsappFab";
}

/** Convenience for surfaces that want to know the winner directly. */
export function useGrantedBottomSurface(): BottomSurfaceId | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Exposed for tests. */
export function __resetBottomSurfaces() {
  claims.clear();
  grantedId = null;
  listeners.forEach((l) => l());
}
