// ── Domain Types ───────────────────────────────────────────────
// Core business entities. These map directly to DB tables/collections.
// No UI-only fields here.

import type {
  DifficultyLevel,
  QuestionFormat,
  TopicStatus,
  MasteryStatus,
  QuestionSource,
  ReviewStatus,
  CandidateStatus,
} from "./enums";

export type { QuestionSource, ReviewStatus, CandidateStatus };

// ── Grade ──────────────────────────────────────────────────────

/** A school grade level (1–5). Single source of truth for grade config. */
export interface Grade {
  id: string;
  /** Numeric level: 1–5 */
  level: number;
  /** Display label: "Lớp 1" … "Lớp 5" */
  displayName: string;
  /** Whether this grade is publicly available in the current MVP rollout */
  isPublic: boolean;
  /** Number of curriculum topics under this grade */
  topicCount: number;
}

// ── Student ────────────────────────────────────────────────────

/** Core student identity — maps to a users/students DB table row. */
export interface Student {
  id: string;
  name: string;
  /** Numeric grade level (1–5) */
  gradeLevel: number;
  /** Display label derived from gradeLevel — "Lớp 2" */
  gradeName: string;
  email: string;
  schoolName: string;
  /** Academic year label: "2025–2026" */
  schoolYear: string;
}

/** Aggregated learning stats for a student — computed from submissions. */
export interface StudentStats {
  studentId: string;
  totalExams: number;
  /** 0–100 */
  averageAccuracy: number;
}

// ── Curriculum ─────────────────────────────────────────────────

/** A curriculum topic (e.g. "Cộng có nhớ") under a specific grade. */
export interface CurriculumTopic {
  id: string;
  code: string;
  gradeId: string;
  gradeLevel: number;
  name: string;
  description: string;
  status: TopicStatus;
  skillCount: number;
  questionCount: number;
  displayOrder: number;
}

/** A fine-grained skill within a topic. */
export interface Skill {
  id: string;
  code: string;
  topicId: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

// ── Questions ──────────────────────────────────────────────────

/** One choice in an MCQ question. */
export interface AnswerChoice {
  /** Choice key: "A" | "B" | "C" | "D" */
  id: string;
  text: string;
  isCorrect: boolean;
}

/** A single question entity — maps to the questions DB table. */
export interface Question {
  id: string;
  topicId: string;
  skillId?: string;
  text: string;
  /** Display/interaction format */
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  /** Only present when format === "mcq" */
  choices?: AnswerChoice[];
  /** The canonical correct answer (text value) */
  correctAnswer: string;
  hint?: string;
}

// ── AI / Admin config ──────────────────────────────────────────

/** Blueprint used by the AI question generator to produce a question set. */
export interface QuestionBlueprint {
  id: string;
  topicId: string;
  skillId: string | null;
  name: string;
  questionFormat: QuestionFormat;
  version: string;
  isEnabled: boolean;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  constraints: Record<string, unknown> | null;
}

/** A validation rule applied to AI-generated questions before storage. */
export interface ValidatorRule {
  id: string;
  /** Machine-readable rule name, e.g. "range_check" */
  name: string;
  description: string;
  isActive: boolean;
  /** Scope: global | grade | topic | skill | blueprint */
  scope: string;
  config: Record<string, unknown> | null;
}

/** A prompt template used to generate questions or feedback via LLM. */
export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  modelTarget: string;
  template: string;
}

/** Feature flag scoped to specific grade levels. */
export interface ReleaseConfig {
  id: string;
  featureName: string;
  /** Grade levels this feature is active for: [1, 2] */
  targetGradeLevels: number[];
  version: string;
  isEnabled: boolean;
}

// ── Practice / Exam flow ───────────────────────────────────────

/**
 * User-provided configuration when starting a new practice session.
 * Sent to the API which creates an Exam from it.
 */
export interface ExamConfig {
  topicId: string;
  difficulty: DifficultyLevel;
  format: QuestionFormat;
  questionCount: number;
}

/**
 * An exam as stored in the DB — a snapshot of config + questions.
 * Created when the student starts a session.
 */
export interface Exam {
  id: string;
  topicId: string;
  topicName: string;
  gradeLevel: number;
  questions: Question[];
  createdAt: string;
}

/**
 * A thin active-session view: what the session UI needs while in progress.
 * In the real app this would be partially hydrated from an Exam.
 */
export interface ActiveSession {
  topicName: string;
  questions: Question[];
}

/** A student's answer to a single question within a submission. */
export interface SubmissionAnswer {
  questionId: string;
  givenAnswer: string;
  isCorrect: boolean;
}

/** A wrong answer with full context for the result/review screen. */
export interface WrongAnswerDetail {
  questionId: string;
  questionText: string;
  givenAnswer: string;
  correctAnswer: string;
  hint?: string;
  /** AI-generated explanation (null when AI is off or failed). */
  aiExplanation?: string | null;
  /** AI-generated friendly hint nudge (null when AI is off or failed). */
  aiFriendlyHint?: string | null;
}

/** Computed result after a submission is graded. */
export interface ExamResult {
  examId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  /** 0–100, derived from score/totalQuestions */
  accuracy: number;
  durationSeconds: number;
  wrongAnswers: WrongAnswerDetail[];
}

// ── Learning history & progress ────────────────────────────────

/** One completed session entry shown in history lists. */
export interface HistoryEntry {
  id: string;
  topicId: string;
  topicName: string;
  /** Formatted display date: "12/04" */
  date: string;
  score: number;
  questionCount: number;
}

/** Aggregated progress for a student on one topic, for dashboard/profile. */
export interface SkillProgress {
  topicId: string;
  topicName: string;
  /** 0–100 */
  accuracy: number;
  sessionCount: number;
  totalQuestions: number;
  /** Stored mastery level from LearningProgress — optional (computed from accuracy if absent). */
  mastery?: MasteryStatus;
}

/** Aggregated stats for one day-of-week label in the dashboard chart. */
export interface WeeklyStats {
  /** Day label: "T2" … "CN" */
  label: string;
  sessionCount: number;
  /** 0–100 */
  accuracy: number;
}

/** An AI-recommended practice item shown on the home screen. */
export interface Recommendation {
  id: string;
  topicId: string;
  /** Display title: "Cộng có nhớ — 10 câu" */
  title: string;
  /** Reason/subtitle shown to the student */
  description: string;
  difficulty: DifficultyLevel;
  format: QuestionFormat;
  questionCount: number;
  /** Machine-readable rule that produced this rec — useful for debugging. */
  reasonCode?: string;
}

/** State of an in-progress (unfinished) exam, persisted to allow resume. */
export interface InProgressSession {
  examId?: string;
  topicName: string;
  gradeName: string;
  answeredCount: number;
  totalCount: number;
}
