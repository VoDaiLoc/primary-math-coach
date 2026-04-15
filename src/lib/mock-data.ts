import type {
  Student,
  StudentStats,
  Grade,
  CurriculumTopic,
  QuestionBlueprint,
  ValidatorRule,
  PromptTemplate,
  ReleaseConfig,
  HistoryEntry,
  SkillProgress,
  WeeklyStats,
  Recommendation,
  InProgressSession,
  ExamResult,
  ActiveSession,
} from "@/types";

// ── Student ───────────────────────────────────────────────────

export const mockStudent: Student = {
  id: "student-1",
  name: "Nguyễn Minh Anh",
  gradeLevel: 2,
  gradeName: "Lớp 2",
  email: "phu_huynh@gmail.com",
  schoolName: "Trường TH Lê Văn Tám",
  schoolYear: "2025–2026",
};

export const mockStudentStats: StudentStats = {
  studentId: "student-1",
  totalExams: 23,
  averageAccuracy: 74,
};

// ── In-progress session ───────────────────────────────────────

export const mockInProgress: InProgressSession = {
  topicName: "Cộng có nhớ",
  answeredCount: 5,
  totalCount: 10,
  gradeName: "Lớp 2",
};

// ── Recent history ────────────────────────────────────────────

export const mockRecentHistory: HistoryEntry[] = [
  { id: "h1", topicId: "t1", topicName: "Cộng có nhớ",           date: "12/04", score: 8, questionCount: 10 },
  { id: "h2", topicId: "t2", topicName: "Trừ có nhớ",             date: "11/04", score: 6, questionCount: 10 },
  { id: "h3", topicId: "t3", topicName: "Toán có lời văn 1 bước", date: "10/04", score: 4, questionCount: 10 },
];

// ── Today recommendations ─────────────────────────────────────

export const mockRecommendations: Recommendation[] = [
  {
    id: "r1",
    topicId: "t1",
    title: "Cộng có nhớ — 10 câu",
    description: "Dựa trên lỗi gần nhất · Được AI đề xuất",
    difficulty: "medium",
    format: "mcq",
    questionCount: 10,
  },
  {
    id: "r2",
    topicId: "t3",
    title: "Toán lời văn 1 bước — 5 câu",
    description: "Chủ đề yếu · Ôn luyện thêm",
    difficulty: "easy",
    format: "mcq",
    questionCount: 5,
  },
];

// ── Weekly stats ──────────────────────────────────────────────

export const mockWeeklyStats: WeeklyStats[] = [
  { label: "T2", sessionCount: 1, accuracy: 60 },
  { label: "T3", sessionCount: 2, accuracy: 75 },
  { label: "T4", sessionCount: 0, accuracy: 0  },
  { label: "T5", sessionCount: 1, accuracy: 80 },
  { label: "T6", sessionCount: 1, accuracy: 90 },
  { label: "T7", sessionCount: 0, accuracy: 0  },
  { label: "CN", sessionCount: 0, accuracy: 0  },
];

// ── Skill progress ────────────────────────────────────────────

export const mockSkillProgress: SkillProgress[] = [
  { topicId: "t4", topicName: "So sánh số",          accuracy: 91, sessionCount: 5, totalQuestions: 50 },
  { topicId: "t1", topicName: "Cộng có nhớ",         accuracy: 52, sessionCount: 8, totalQuestions: 80 },
  { topicId: "t2", topicName: "Trừ có nhớ",          accuracy: 68, sessionCount: 4, totalQuestions: 40 },
  { topicId: "t3", topicName: "Toán lời văn 1 bước", accuracy: 45, sessionCount: 3, totalQuestions: 30 },
];

// ── Dashboard history ─────────────────────────────────────────

export const mockDashboardHistory: HistoryEntry[] = [
  { id: "dh1", topicId: "t1", topicName: "Cộng có nhớ",           date: "12/04", score: 8,  questionCount: 10 },
  { id: "dh2", topicId: "t2", topicName: "Trừ có nhớ",             date: "11/04", score: 6,  questionCount: 10 },
  { id: "dh3", topicId: "t3", topicName: "Toán lời văn 1 bước",   date: "10/04", score: 4,  questionCount: 10 },
  { id: "dh4", topicId: "t4", topicName: "So sánh số",             date: "09/04", score: 9,  questionCount: 10 },
  { id: "dh5", topicId: "t5", topicName: "Hình học cơ bản",        date: "08/04", score: 7,  questionCount: 10 },
];

// ── Practice session ──────────────────────────────────────────

export const mockActiveSession: ActiveSession = {
  topicName: "Cộng có nhớ",
  questions: [
    {
      id: "q1",
      topicId: "t1",
      text: "34 + 18 = ?",
      format: "mcq",
      difficulty: "easy",
      choices: [
        { id: "A", text: "42", isCorrect: false },
        { id: "B", text: "52", isCorrect: true  },
        { id: "C", text: "53", isCorrect: false },
        { id: "D", text: "62", isCorrect: false },
      ],
      correctAnswer: "52",
      hint: "Cộng hàng đơn vị trước: 4 + 8 = 12, viết 2 nhớ 1.",
    },
    {
      id: "q2",
      topicId: "t1",
      text: "45 + ___ = 72",
      format: "fillin",
      difficulty: "medium",
      correctAnswer: "27",
      hint: "Lấy 72 trừ 45 để tìm số cần điền.",
    },
    {
      id: "q3",
      topicId: "t1",
      text: "27 + 35 = ?",
      format: "mcq",
      difficulty: "medium",
      choices: [
        { id: "A", text: "52", isCorrect: false },
        { id: "B", text: "61", isCorrect: false },
        { id: "C", text: "62", isCorrect: true  },
        { id: "D", text: "72", isCorrect: false },
      ],
      correctAnswer: "62",
    },
    {
      id: "q4",
      topicId: "t1",
      text: "56 + 37 = ?",
      format: "fillin",
      difficulty: "medium",
      correctAnswer: "93",
      hint: "6 + 7 = 13, viết 3 nhớ 1; 5 + 3 + 1 = 9.",
    },
    {
      id: "q5",
      topicId: "t1",
      text: "48 + 46 = ?",
      format: "mcq",
      difficulty: "hard",
      choices: [
        { id: "A", text: "84", isCorrect: false },
        { id: "B", text: "92", isCorrect: false },
        { id: "C", text: "94", isCorrect: true  },
        { id: "D", text: "96", isCorrect: false },
      ],
      correctAnswer: "94",
    },
  ],
};

// ── Exam result ───────────────────────────────────────────────

export const mockExamResult: ExamResult = {
  examId: "exam-demo-1",
  topicName: "Cộng có nhớ",
  score: 8,
  totalQuestions: 10,
  accuracy: 80,
  durationSeconds: 486,
  wrongAnswers: [
    {
      questionId: "q3",
      questionText: "27 + 35 = ?",
      givenAnswer: "61",
      correctAnswer: "62",
      hint: "Con thử cộng hàng đơn vị trước: 7 + 5 = 12, viết 2 nhớ 1.",
    },
    {
      questionId: "q7",
      questionText: "64 + 29 = ?",
      givenAnswer: "83",
      correctAnswer: "93",
      hint: "4 + 9 = 13, viết 3 nhớ 1; 6 + 2 + 1 = 9.",
    },
  ],
};

// ── Admin: Grade configs ──────────────────────────────────────

export const mockGradeConfigs: Grade[] = [
  { id: "g1", level: 1, displayName: "Lớp 1", topicCount: 4, isPublic: false },
  { id: "g2", level: 2, displayName: "Lớp 2", topicCount: 5, isPublic: true  },
  { id: "g3", level: 3, displayName: "Lớp 3", topicCount: 0, isPublic: false },
  { id: "g4", level: 4, displayName: "Lớp 4", topicCount: 0, isPublic: false },
  { id: "g5", level: 5, displayName: "Lớp 5", topicCount: 0, isPublic: false },
];

// ── Admin: Topics ─────────────────────────────────────────────

export const mockTopics: CurriculumTopic[] = [
  {
    id: "t1", code: "cong_co_nho", gradeId: "g2", gradeLevel: 2, name: "Cộng có nhớ",
    description: "Cộng hai số có nhớ trong phạm vi 100",
    status: "active", skillCount: 3, questionCount: 80, displayOrder: 1,
  },
  {
    id: "t2", code: "tru_co_nho", gradeId: "g2", gradeLevel: 2, name: "Trừ có nhớ",
    description: "Trừ hai số có nhớ trong phạm vi 100",
    status: "active", skillCount: 2, questionCount: 60, displayOrder: 2,
  },
  {
    id: "t3", code: "toan_loi_van_1", gradeId: "g2", gradeLevel: 2, name: "Toán lời văn 1 bước",
    description: "Giải bài toán có lời văn một bước tính",
    status: "active", skillCount: 2, questionCount: 40, displayOrder: 3,
  },
  {
    id: "t4", code: "hinh_hoc_co_ban", gradeId: "g2", gradeLevel: 2, name: "Hình học cơ bản",
    description: "Nhận biết hình vuông, tròn, chữ nhật",
    status: "active", skillCount: 1, questionCount: 30, displayOrder: 4,
  },
  {
    id: "t5", code: "do_luong_co_ban", gradeId: "g2", gradeLevel: 2, name: "Đo lường cơ bản",
    description: "Đo độ dài, khối lượng đơn giản",
    status: "inactive", skillCount: 2, questionCount: 0, displayOrder: 5,
  },
];

// ── Admin: Question blueprints ────────────────────────────────

export const mockBlueprints: QuestionBlueprint[] = [
  { id: "bp1", topicId: "t1", skillId: null, name: "Cộng có nhớ – Trắc nghiệm", questionFormat: "mcq",    version: "v1", isEnabled: true, easyPercent: 30, mediumPercent: 50, hardPercent: 20, constraints: null },
  { id: "bp2", topicId: "t1", skillId: null, name: "Cộng có nhớ – Điền vào",    questionFormat: "fillin", version: "v1", isEnabled: true, easyPercent: 40, mediumPercent: 40, hardPercent: 20, constraints: null },
  { id: "bp3", topicId: "t2", skillId: null, name: "Trừ có nhớ – Trắc nghiệm",  questionFormat: "mcq",    version: "v1", isEnabled: true, easyPercent: 30, mediumPercent: 50, hardPercent: 20, constraints: null },
];

// ── Admin: Validator rules ─────────────────────────────────────

export const mockValidatorRules: ValidatorRule[] = [
  { id: "vr1", name: "range_check",        description: "Kết quả phải nằm trong phạm vi số của lớp",      isActive: true,  scope: "global", config: null },
  { id: "vr2", name: "unique_distractors", description: "Các lựa chọn sai phải khác nhau và khác đáp án", isActive: true,  scope: "global", config: null },
  { id: "vr3", name: "no_negatives",       description: "Không được có số âm trong đề dành cho lớp 1−2",   isActive: true,  scope: "global", config: null },
  { id: "vr4", name: "difficulty_cap",     description: "Câu Dễ không được có kết quả > 50",               isActive: false, scope: "global", config: null },
];

// ── Admin: Prompt templates ────────────────────────────────────

export const mockPromptTemplates: PromptTemplate[] = [
  {
    id: "pt1",
    name: "Sinh câu hỏi – Cộng/Trừ có nhớ",
    version: "v3.2",
    modelTarget: "gpt-4o-mini",
    template: [
      `Tạo {{count}} câu hỏi Toán lớp {{grade}} chủ đề "{{topic}}" độ khó {{difficulty}}.`,
      `Yêu cầu:`,
      `- Kết quả trong phạm vi {{range}}`,
      `- Định dạng JSON`,
      `- Mỗi câu gồm: text, choices (A–D), correctKey, hint_vi`,
    ].join("\n"),
  },
  {
    id: "pt2",
    name: "Giải thích lỗi – Feedback học sinh",
    version: "v2.1",
    modelTarget: "gpt-4o-mini",
    template: [
      `Học sinh lớp {{grade}} trả lời sai câu:`,
      `Câu hỏi: {{question}}`,
      `Đáp án sai: {{wrong}}`,
      `Đáp án đúng: {{correct}}`,
      ``,
      `Viết gợi ý ngắn gọn (≤ 2 câu) bằng tiếng Việt, thân thiện với trẻ 7–8 tuổi.`,
    ].join("\n"),
  },
];

// ── Admin: Release configs ─────────────────────────────────────

export const mockReleaseConfigs: ReleaseConfig[] = [
  { id: "rc1", featureName: "AI sinh câu hỏi",           targetGradeLevels: [2],    version: "v1.0.0", isEnabled: true  },
  { id: "rc2", featureName: "Gợi ý tự động",             targetGradeLevels: [2],    version: "v0.9.0", isEnabled: true  },
  { id: "rc3", featureName: "Dashboard phụ huynh",       targetGradeLevels: [1, 2], version: "v1.2.0", isEnabled: true  },
  { id: "rc4", featureName: "Bài kiểm tra có thời gian", targetGradeLevels: [],     version: "v0.1.0", isEnabled: false },
];

