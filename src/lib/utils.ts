import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format accuracy as "76%" */
export function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`;
}

/** Format score as "8/10" */
export function formatScore(correct: number, total: number): string {
  return `${correct}/${total}`;
}

/** Map accuracy to skill status */
export function getSkillStatus(accuracy: number): "strong" | "needs_practice" | "weak" {
  if (accuracy >= 80) return "strong";
  if (accuracy >= 55) return "needs_practice";
  return "weak";
}

/** Map score status from score string like "8/10" */
export function getScoreStatus(score: string): "success" | "warning" | "danger" {
  const parts = score.split("/");
  if (parts.length !== 2) return "warning";
  const pct = (parseInt(parts[0]) / parseInt(parts[1])) * 100;
  if (pct >= 80) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}
