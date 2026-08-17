import { useSyncExternalStore, useEffect } from "react";

/**
 * Arbitration for the bottom edge of the viewport.
 *
 * Three separate things want to live at `bottom-0`: the sticky enrol bar, the
 * exit nudge, and the floating WhatsApp button. They were each pinned there
 * independently, so on a phone the nudge landed directly on top of the bar and
 * the FAB sat over both — three tap targets stacked in the same 60 pixels,
 * right where the thumb rests.
 *
 * The rule is simply that the exit nudge outranks the sticky bar: it is
 * modal-ish, transient, and it is the thing the visitor was just shown. The
 * bar steps aside while it is up and comes back when it closes.
 */

type Occupant = "nudge" | null;

let occupant: Occupant = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): Occupant {
  return occupant;
}

/** Server render has no overlays. */
function getServerSnapshot(): Occupant {
  return null;
}

export function claimBottomOverlay(who: NonNullable<Occupant>): void {
  occupant = who;
  emit();
}

export function releaseBottomOverlay(who: NonNullable<Occupant>): void {
  if (occupant === who) {
    occupant = null;
    emit();
  }
}

/** Which overlay currently owns the bottom edge, if any. */
export function useBottomOverlayOccupant(): Occupant {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Claims the bottom edge for as long as `active` is true, releasing it on
 * unmount. For the component that wants to be on top.
 */
export function useClaimBottomOverlay(who: NonNullable<Occupant>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    claimBottomOverlay(who);
    return () => releaseBottomOverlay(who);
  }, [who, active]);
}
