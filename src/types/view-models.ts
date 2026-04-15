// ── View Model Types ───────────────────────────────────────────
// UI-specific shapes used in components.
// Only create a view model when a component needs derived/computed fields
// that don't belong in a domain entity.

import type { MasteryStatus } from "./enums";

/**
 * Derived per-skill row for skill progress displays.
 * Adds a computed mastery badge on top of raw accuracy.
 */
export interface SkillProgressVM {
  topicId: string;
  topicName: string;
  /** 0–100 */
  accuracy: number;
  mastery: MasteryStatus;
}

// ── Helpers ────────────────────────────────────────────────────

/** Derive a MasteryStatus from a raw accuracy value. */
export function toMasteryStatus(accuracy: number): MasteryStatus {
  if (accuracy >= 80) return "strong";
  if (accuracy >= 60) return "developing";
  return "weak";
}
