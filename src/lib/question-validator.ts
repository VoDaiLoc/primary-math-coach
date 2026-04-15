/**
 * src/lib/question-validator.ts
 *
 * Validates AI-generated question items before they are written to the DB.
 * All rules are cheap synchronous checks — no DB or AI calls.
 *
 * Design:
 *  - validate() returns a ValidationReport with per-item results.
 *  - Items that pass are safe to persist; failed items are discarded with reasons.
 *  - Never throws — callers decide what to do with partial or zero valid items.
 */

import type { QuestionFormat } from "@/types/enums";
import type { BlueprintConstraints } from "./question-prompt-builder";

// ── Raw AI output shape (before validation) ───────────────────────────────────

export interface RawChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface RawGeneratedItem {
  questionText:  string;
  correctAnswer: string;
  hint?:         string;
  choices?:      RawChoice[];
  // AI might add extra fields — we ignore them
  [key: string]: unknown;
}

// ── Validated output shape (safe to write to DB) ──────────────────────────────

export interface ValidatedItem {
  questionText:  string;
  correctAnswer: string;
  hint:          string | null;
  choices:       RawChoice[] | null; // null for FILLIN
}

// ── Validation report ─────────────────────────────────────────────────────────

export interface ItemValidationResult {
  index:  number;
  valid:  boolean;
  errors: string[];
  item:   ValidatedItem | null;
}

export interface ValidationReport {
  totalInput:   number;
  validCount:   number;
  failedCount:  number;
  results:      ItemValidationResult[];
  /** Items that passed all checks — ready to use */
  validItems:   ValidatedItem[];
}

// ── Rule context passed to each check ─────────────────────────────────────────

interface RuleContext {
  format:      QuestionFormat;
  constraints: BlueprintConstraints;
  gradeLevel:  number;
}

// ── Individual rule checkers ──────────────────────────────────────────────────

function checkRequiredFields(item: RawGeneratedItem, errors: string[]): boolean {
  if (typeof item.questionText !== "string" || item.questionText.trim().length === 0) {
    errors.push("questionText is missing or empty.");
    return false;
  }
  if (typeof item.correctAnswer !== "string" || item.correctAnswer.trim().length === 0) {
    errors.push("correctAnswer is missing or empty.");
    return false;
  }
  return true;
}

function checkTextLength(item: RawGeneratedItem, errors: string[]): void {
  if (item.questionText.length > 300) {
    errors.push(`questionText too long (${item.questionText.length} chars, max 300).`);
  }
  if (item.hint && item.hint.length > 200) {
    errors.push(`hint too long (${item.hint.length} chars, max 200).`);
  }
}

function checkMCQChoices(item: RawGeneratedItem, errors: string[]): boolean {
  const choices = item.choices;
  if (!Array.isArray(choices) || choices.length !== 4) {
    errors.push(`MCQ must have exactly 4 choices (got ${Array.isArray(choices) ? choices.length : "none"}).`);
    return false;
  }

  const correctChoices = choices.filter((c) => c.isCorrect === true);
  if (correctChoices.length !== 1) {
    errors.push(`MCQ must have exactly 1 correct choice (got ${correctChoices.length}).`);
    return false;
  }

  // correctAnswer must match the correct choice text
  const correctChoiceText = correctChoices[0].text?.trim();
  if (correctChoiceText !== item.correctAnswer.trim()) {
    errors.push(
      `correctAnswer "${item.correctAnswer}" does not match correct choice text "${correctChoiceText}".`
    );
    return false;
  }

  // All choice texts must be unique
  const texts = choices.map((c) => c.text?.trim() ?? "");
  const uniqueTexts = new Set(texts);
  if (uniqueTexts.size !== 4) {
    errors.push("MCQ choices must all have unique text values.");
    return false;
  }

  // No empty choice texts
  if (texts.some((t) => t.length === 0)) {
    errors.push("MCQ choices must not have empty text.");
    return false;
  }

  // IDs must be A/B/C/D
  const ids = new Set(choices.map((c) => c.id));
  if (!["A", "B", "C", "D"].every((id) => ids.has(id))) {
    errors.push("MCQ choices must have ids A, B, C, D.");
    return false;
  }

  return true;
}

function checkAnswerResultRange(answer: number, constraints: BlueprintConstraints, errors: string[]): void {
  if (!constraints.resultRange) return;
  const { min, max } = constraints.resultRange;
  if (answer < min || answer > max) {
    errors.push(`Answer ${answer} outside resultRange [${min}, ${max}].`);
  }
}

function checkConstraints(
  item: RawGeneratedItem,
  constraints: BlueprintConstraints,
  gradeLevel: number,
  errors: string[],
): void {
  const answer = Number(item.correctAnswer);
  if (Number.isNaN(answer)) return; // non-numeric answer (word problem etc.) — skip range check

  if (gradeLevel <= 2 && answer < 0) {
    errors.push(`Negative answer ${answer} not allowed for grade ${gradeLevel}.`);
  }

  checkAnswerResultRange(answer, constraints, errors);

  // Check distractor values for MCQ
  if (Array.isArray(item.choices)) {
    item.choices.forEach((choice) => checkDistractor(choice.text, constraints, gradeLevel, errors));
  }
}

function checkDistractor(
  text: string,
  constraints: BlueprintConstraints,
  gradeLevel: number,
  errors: string[],
): void {
  const v = Number(text);
  if (Number.isNaN(v)) return;
  if (gradeLevel <= 2 && v < 0) {
    errors.push(`Negative distractor "${text}" not allowed.`);
  }
  if (!constraints.numberRange) return;
  const { min, max } = constraints.numberRange;
  if (v < min - 20 || v > max + 20) {
    errors.push(`Distractor "${text}" is far outside numberRange.`);
  }
}

function checkNoNegativesInQuestion(item: RawGeneratedItem, gradeLevel: number, errors: string[]): void {
  if (gradeLevel > 2) return;
  // Simple heuristic: look for "- " preceded by space or start (negative number indicator)
  if (/(?:^|\s)-\d/.test(item.questionText)) {
    errors.push("questionText appears to contain a negative number.");
  }
}

// ── Main validator ─────────────────────────────────────────────────────────────

/**
 * Validate an array of raw AI-generated items.
 * @param rawItems  Parsed (but untrusted) output from the AI.
 * @param format    Expected question format requested for this exam.
 * @param constraints  Blueprint constraints (number/result ranges).
 * @param gradeLevel   Student grade level (used for grade-specific rules).
 */
export function validateGeneratedItems(
  rawItems: unknown[],
  format: QuestionFormat,
  constraints: BlueprintConstraints,
  gradeLevel: number,
): ValidationReport {
  const ctx: RuleContext = { format, constraints, gradeLevel };
  const results: ItemValidationResult[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i];
    const errors: string[] = [];

    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      results.push({ index: i, valid: false, errors: ["Item is not an object."], item: null });
      continue;
    }

    const item = raw as RawGeneratedItem;

    // Required fields
    if (!checkRequiredFields(item, errors)) {
      results.push({ index: i, valid: false, errors, item: null });
      continue;
    }

    // Text length
    checkTextLength(item, errors);

    // Format-specific checks
    if (ctx.format === "mcq") {
      checkMCQChoices(item, errors);
    }

    // Constraint checks
    checkConstraints(item, ctx.constraints, ctx.gradeLevel, errors);
    checkNoNegativesInQuestion(item, ctx.gradeLevel, errors);

    const valid = errors.length === 0;
    const validatedItem: ValidatedItem | null = valid
      ? {
          questionText:  item.questionText.trim(),
          correctAnswer: item.correctAnswer.trim(),
          hint:          item.hint?.trim() ?? null,
          choices:       ctx.format === "mcq" && Array.isArray(item.choices)
            ? item.choices.map((c) => ({ id: c.id, text: c.text?.trim(), isCorrect: c.isCorrect }))
            : null,
        }
      : null;

    results.push({ index: i, valid, errors, item: validatedItem });
  }

  const validItems = results
    .filter((r): r is typeof r & { item: ValidatedItem } => r.valid && r.item !== null)
    .map((r) => r.item);

  return {
    totalInput:  rawItems.length,
    validCount:  validItems.length,
    failedCount: rawItems.length - validItems.length,
    results,
    validItems,
  };
}
