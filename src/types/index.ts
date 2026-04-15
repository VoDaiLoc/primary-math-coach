// ── ToánAI Primary Math Coach — Type System ───────────────────
// Single entry point. Import from "@/types" in all app code.

export * from "./enums";
export * from "./domain";
export * from "./api";
export * from "./view-models";

// ── Backward-compat aliases ────────────────────────────────────
// These keep old import names working while the codebase migrates.
// Remove once all consumers use the new names.

/** @deprecated Use `Grade` instead */
export type { Grade as GradeConfig } from "./domain";

/** @deprecated Use `InProgressSession` instead */
export type { InProgressSession as InProgressExam } from "./domain";

/** @deprecated Use `WrongAnswerDetail` instead */
export type { WrongAnswerDetail as WrongAnswer } from "./domain";

/**
 * @deprecated Use `QuestionFormat` instead.
 * "word_problem" was removed — it is a topic category, not a question format.
 */
export type { QuestionFormat as QuestionType } from "./enums";
