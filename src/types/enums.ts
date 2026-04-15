// ── Enums & Union Types ────────────────────────────────────────
// Shared across domain, API, and UI layers.

/** Difficulty of a question or practice session. */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Display/interaction format for a question.
 * - "mcq"    → multiple choice (A–D)
 * - "fillin" → fill-in-the-blank
 */
export type QuestionFormat = "mcq" | "fillin";

/** Student's mastery level on a given topic skill. */
export type MasteryStatus = "strong" | "developing" | "weak";

/** Whether a curriculum topic is available for practice. */
export type TopicStatus = "active" | "inactive";

/** Lifecycle status of a practice session. */
export type SessionStatus = "in_progress" | "completed" | "abandoned";

/**
 * Mode of an exam.
 * - "practice"    → no time limit, student reviews at will
 * - "timed_exam"  → countdown; auto-submits when time is up
 */
export type ExamMode = "practice" | "timed_exam";

// ── Question Bank enums ────────────────────────────────────────

/** Origin of a question bank item. */
export type QuestionSource = "manual" | "imported" | "ai_generated";

/** Admin review lifecycle for a question bank item. */
export type ReviewStatus = "draft" | "pending_review" | "approved" | "rejected" | "archived";

/** Lifecycle of an AI-generated candidate awaiting review. */
export type CandidateStatus = "pending_review" | "approved" | "rejected";
