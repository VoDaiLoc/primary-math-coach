// ── API Contract Types ─────────────────────────────────────────
// Request / response shapes for route handlers.
// These compose domain types into the payloads each API endpoint expects/returns.

import type {
  Student,
  StudentStats,
  Grade,
  CurriculumTopic,
  QuestionBlueprint,
  ValidatorRule,
  PromptTemplate,
  HistoryEntry,
  SkillProgress,
  WeeklyStats,
  Recommendation,
  InProgressSession,
  AnswerChoice,
  WrongAnswerDetail,
} from "./domain";
import type { DifficultyLevel, QuestionFormat, ExamMode } from "./enums";

// ── Home ───────────────────────────────────────────────────────

export interface HomeSummaryResponse {
  student: Student;
  stats: StudentStats;
  inProgress: InProgressSession | null;
  recentHistory: HistoryEntry[];
  recommendations: Recommendation[];
  weeklyStats: WeeklyStats[];
}

// ── Dashboard ──────────────────────────────────────────────────

/** Richer stats for the parent dashboard (superset of StudentStats). */
export interface DashboardStats {
  totalSubmissions: number;
  /** 0-100 */
  averageAccuracy: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  /** Topics that have at least one LearningProgress entry. */
  trackedTopicsCount: number;
  averageDurationSeconds: number;
}

/** History entry enriched with submission-level detail for the dashboard table. */
export interface DashboardHistoryEntry extends HistoryEntry {
  submissionId: string;
  /** 0-100 */
  accuracy: number;
  durationSeconds: number;
  /** ISO-8601 timestamp of submission. */
  submittedAt: string;
}

export interface DashboardSummaryResponse {
  student: Student;
  stats: DashboardStats;
  weeklyStats: WeeklyStats[];
  /** All tracked topics sorted by accuracy ascending (weakest first). */
  topicProgress: SkillProgress[];
  /** Topics with accuracy >= 80. */
  strongTopics: SkillProgress[];
  /** Topics with accuracy < 60. */
  weakTopics: SkillProgress[];
  /** Last 10 submitted exams. */
  recentHistory: DashboardHistoryEntry[];
  recommendations: Recommendation[];
}

// ── Practice config ────────────────────────────────────────────

export interface PracticeConfigResponse {
  grades: Grade[];
  topics: CurriculumTopic[];
}

// ── Create exam ────────────────────────────────────────────────

/** POST /api/exams */
export interface CreateExamRequest {
  studentId: string;
  topicId: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  format: QuestionFormat;
  mode: ExamMode;
  /** Required when mode = "timed_exam". Minutes. */
  timeLimitMinutes?: number;
}

export interface CreateExamResponse {
  examId: string;
  generatedBy: "ai" | "fallback" | "unavailable" | "bank";
  blueprintId: string | null;
  blueprintVersion: string | null;
}

// ── Exam session ───────────────────────────────────────────────

/** One item served to the client during practice. correctAnswer included for
 *  instant local feedback (MVP — kids' math app, no security concern). */
export interface ExamSessionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  questionFormat: QuestionFormat;
  choices?: AnswerChoice[];
  correctAnswer: string;
  hint?: string;
}

/** GET /api/exams/[id] */
export interface GetExamSessionResponse {
  examId: string;
  topicName: string;
  gradeName: string;
  questionCount: number;
  mode: ExamMode;
  /** Only present when mode = "timed_exam" */
  timeLimitMinutes?: number;
  items: ExamSessionItem[];
}

// ── Submit exam ────────────────────────────────────────────────

/** POST /api/submissions */
export interface SubmitExamRequest {
  examId: string;
  studentId: string;
  answers: { examItemId: string; givenAnswer: string }[];
  durationSeconds: number;
}

export interface SubmitExamResponse {
  submissionId: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
}

// ── Exam result ────────────────────────────────────────────────

/** GET /api/submissions/[id]/result
 *  Shape matches ExamResult domain type exactly so components can use it directly. */
export interface GetExamResultResponse {
  examId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  durationSeconds: number;
  wrongAnswers: WrongAnswerDetail[];
  /** Rule-based next-step recommendations computed from this submission’s topic + student progress. */
  nextRecommendations: Recommendation[];  /** AI-generated session-level encouragement (null when AI is off or failed). */
  encouragementMessage: string | null;}

// ── Student profile ────────────────────────────────────────────────

/** Full profile payload returned by GET /api/students/[id]/profile */
export interface StudentProfileResponse {
  studentId: string;
  name: string;
  gradeName: string;
  gradeId: string;
  schoolName: string;
  schoolYear: string;
  currentFocusTopicId: string | null;
  currentFocusTopicName: string | null;
  weeklyGoalSessions: number | null;
  /** "beginner" | "intermediate" | "advanced" */
  currentLevel: string | null;
  /** ISO-8601 of earliest submission, or null */
  startedAt: string | null;
  averageAccuracy: number;
  totalSubmissions: number;
  skillProgress: SkillProgress[];
  recentHistory: HistoryEntry[];
}

/** PATCH /api/students/[id]/profile — all fields optional */
export interface UpdateStudentProfileRequest {
  name?: string;
  schoolName?: string;
  schoolYear?: string;
  weeklyGoalSessions?: number | null;
  currentFocusTopicId?: string | null;
  currentLevel?: string | null;
}

/** Minimal success response for PATCH */
export interface UpdateStudentProfileResponse {
  studentId: string;
  updatedAt: string;
}

// ── Admin ──────────────────────────────────────────────────

export interface AdminGradesResponse {
  grades: Grade[];
}

export interface AdminTopicsResponse {
  topics: CurriculumTopic[];
}

export interface AdminSkillsResponse {
  skills: AdminSkillRow[];
}

export interface AdminBlueprintsResponse {
  blueprints: QuestionBlueprint[];
}

export interface AdminValidatorRulesResponse {
  rules: ValidatorRule[];
}

export interface AdminPromptTemplatesResponse {
  templates: PromptTemplate[];
}

// ── Admin PATCH/POST request/response types ───────────────────────────────────

export interface PatchTopicBody {
  name?: string;
  code?: string;
  description?: string;
  status?: "active" | "inactive";
  displayOrder?: number;
}

export interface CreateTopicBody {
  name: string;
  code?: string;
  gradeId: string;
  description?: string;
  displayOrder?: number;
}

export interface AdminSkillRow {
  id: string;
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  topicId: string;
  topicName: string;
  gradeLevel: number;
}

export interface PatchSkillBody {
  name?: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  topicId?: string;
}

export interface CreateBlueprintBody {
  name: string;
  topicId: string;
  skillId?: string;
  questionFormat: QuestionFormat;
  version?: string;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  constraints?: Record<string, unknown>;
}

/** Blueprint percent fields must sum to 100 if all three are supplied. */
export interface PatchBlueprintBody {
  name?: string;
  isEnabled?: boolean;
  version?: string;
  easyPercent?: number;
  mediumPercent?: number;
  hardPercent?: number;
  constraints?: Record<string, unknown>;
}

export interface CreateValidatorRuleBody {
  name: string;
  description: string;
  scope?: string;
  config?: Record<string, unknown>;
}

export interface PatchValidatorRuleBody {
  description?: string;
  isActive?: boolean;
  scope?: string;
  config?: Record<string, unknown>;
}

// ── Question Bank ─────────────────────────────────────────────────────────────

import type {
  QuestionSource,
  ReviewStatus,
  CandidateStatus,
  AnswerChoice as BankChoice,
} from "./domain";

export interface QuestionBankItemRow {
  id: string;
  topicId: string;
  topicName: string;
  gradeId: string;
  gradeLevel: number;
  skillId:  string | null;
  skillName: string | null;
  questionText: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  correctAnswer: string;
  hint: string | null;
  choices: BankChoice[] | null;
  source: QuestionSource;
  reviewStatus: ReviewStatus;
  isActive: boolean;
  modelUsed: string | null;
  blueprintId: string | null;
  promptTemplateVersion: string | null;
  validatorSummary: { passed: boolean; errors: string[] } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminQuestionBankResponse {
  items: QuestionBankItemRow[];
  total: number;
}

export interface CreateQuestionBankItemBody {
  topicId: string;
  skillId?: string;
  questionText: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  correctAnswer: string;
  hint?: string;
  choices?: BankChoice[];
  source?: QuestionSource;
  reviewStatus?: ReviewStatus;
}

export interface PatchQuestionBankItemBody {
  questionText?: string;
  difficulty?: DifficultyLevel;
  correctAnswer?: string;
  hint?: string;
  choices?: BankChoice[];
  reviewStatus?: ReviewStatus;
  isActive?: boolean;
}

// ── CSV Import ────────────────────────────────────────────────────────────────

export interface ImportRowResult {
  row: number;
  status: "ok" | "error";
  error?: string;
}

export interface CsvImportResponse {
  successCount: number;
  errorCount: number;
  rows: ImportRowResult[];
}

// ── Question Candidates ───────────────────────────────────────────────────────

export interface QuestionCandidateRow {
  id: string;
  topicId: string;
  topicName: string;
  gradeId: string;
  gradeLevel: number;
  skillId: string | null;
  skillName: string | null;
  questionText: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  correctAnswer: string;
  hint: string | null;
  choices: BankChoice[] | null;
  modelUsed: string | null;
  blueprintId: string | null;
  blueprintVersion: string | null;
  promptTemplateSlug: string | null;
  validatorPassed: boolean;
  validatorErrors: string[];
  candidateStatus: CandidateStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  bankItemId: string | null;
  createdAt: string;
}

export interface AdminCandidatesResponse {
  candidates: QuestionCandidateRow[];
  total: number;
}

export interface ReviewCandidateBody {
  action: "approve" | "reject" | "approve_with_edits";
  reviewedBy?: string;
  // Fields allowed only for approve_with_edits
  questionText?: string;
  correctAnswer?: string;
  hint?: string;
  choices?: BankChoice[];
}

// ── Exam Papers ───────────────────────────────────────────────────────────────

export interface ExamPaperRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  gradeId: string;
  gradeLevel: number;
  topicId: string | null;
  topicName: string | null;
  createdBy: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperDetail extends ExamPaperRow {
  items: ExamPaperDetailItem[];
}

export interface ExamPaperDetailItem {
  id: string;
  orderIndex: number;
  scoreWeight: number;
  questionBankItemId: string;
  questionText: string;
  format: QuestionFormat;
  difficulty: DifficultyLevel;
  correctAnswer: string;
  hint: string | null;
  choices: BankChoice[] | null;
}

export interface AdminExamPapersResponse {
  papers: ExamPaperRow[];
}

export interface CreateExamPaperBody {
  title: string;
  description?: string;
  gradeId: string;
  topicId?: string;
  createdBy?: string;
}

export interface AddExamPaperItemBody {
  questionBankItemId: string;
  orderIndex?: number;
  scoreWeight?: number;
}
