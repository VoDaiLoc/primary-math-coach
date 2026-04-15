/**
 * prisma/seed.ts
 * Run with: npx prisma db seed
 *
 * Seeds the database with all baseline data needed for the MVP.
 * Uses stable `id` values so the seed is safe to re-run (upsert pattern).
 */

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ── JSON helpers ───────────────────────────────────────────────────────────────
// Wraps a plain object as Prisma.JsonObject without unsafe casting.
// Use these instead of `as Prisma.InputJsonValue`.

function asJson(value: Record<string, unknown>): Prisma.JsonObject {
  return value as Prisma.JsonObject;
}

function asJsonArray(
  value: Array<Record<string, unknown>>,
): Prisma.JsonArray {
  return value as Prisma.JsonArray;
}

const prisma = new PrismaClient();

// ── Stable seed IDs ────────────────────────────────────────────────────────────
// Hard-coded so the seed is idempotent and foreign-key references stay consistent.

const ID = {
  subjects: {
    math: "subj-math",
  },
  grades: {
    g1: "grade-lv1",
    g2: "grade-lv2",
    g3: "grade-lv3",
    g4: "grade-lv4",
    g5: "grade-lv5",
  },
  topics: {
    addCarry:    "topic-add-carry-g2",
    subCarry:    "topic-sub-carry-g2",
    wordProb:    "topic-word-prob-g2",
    geometry:    "topic-geometry-g2",
    measurement: "topic-measurement-g2",
  },
  skills: {
    addCarrySingleStep:   "skill-add-carry-single",
    addCarryTwoDigit:     "skill-add-carry-two-digit",
    addCarryMissing:      "skill-add-carry-missing",
    subCarrySingleStep:   "skill-sub-carry-single",
    subCarryTwoDigit:     "skill-sub-carry-two-digit",
    wordProbAdd:          "skill-word-prob-add",
    wordProbSub:          "skill-word-prob-sub",
  },
  blueprints: {
    addCarryMcq:    "bp-add-carry-mcq",
    addCarryFillin: "bp-add-carry-fillin",
    subCarryMcq:    "bp-sub-carry-mcq",
    wordProbMcq:    "bp-word-prob-mcq",
    geometryMcq:    "bp-geometry-mcq",
  },
  validatorRules: {
    rangeCheck:             "vr-range-check",
    uniqueDistractors:      "vr-unique-distractors",
    noNegatives:            "vr-no-negatives",
    explanationConsistency: "vr-explanation-consistency",
    languageLength:         "vr-language-length",
  },
  promptTemplates: {
    genQuestion:     "pt-gen-question",
    explainError:    "pt-explain-error",
    friendlyFeedback:"pt-friendly-feedback",
  },
  users: {
    parent: "user-seed-parent",
  },
  students: {
    demo: "student-seed-demo",
  },
  exams: {
    demo: "exam-seed-demo",
  },
  submissions: {
    demo: "submission-seed-demo",
  },
  examItems: {
    q1: "item-seed-q1",
    q2: "item-seed-q2",
    q3: "item-seed-q3",
    q4: "item-seed-q4",
    q5: "item-seed-q5",
  },
} as const;

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  await seedSubject();
  await seedGrades();
  await seedGradeReleaseConfigs();
  await seedTopics();
  await seedSkills();
  await seedBlueprints();
  await seedValidatorRules();
  await seedPromptTemplates();
  await seedUserAndStudent();
  await seedSampleExam();
  await seedLearningProgress();

  console.log("\n✅ Seed complete.");
}

// ── 1. Subject ─────────────────────────────────────────────────────────────────

async function seedSubject() {
  await prisma.subject.upsert({
    where:  { id: ID.subjects.math },
    update: {},
    create: {
      id:   ID.subjects.math,
      code: "math",
      name: "Toán",
    },
  });
  console.log("  ✓ Subject: Toán");
}

// ── 2. Grades (Lớp 1–5) ────────────────────────────────────────────────────────

async function seedGrades() {
  const grades = [
    { id: ID.grades.g1, level: 1, displayName: "Lớp 1", isPublic: false },
    { id: ID.grades.g2, level: 2, displayName: "Lớp 2", isPublic: true  },
    { id: ID.grades.g3, level: 3, displayName: "Lớp 3", isPublic: false },
    { id: ID.grades.g4, level: 4, displayName: "Lớp 4", isPublic: false },
    { id: ID.grades.g5, level: 5, displayName: "Lớp 5", isPublic: false },
  ];

  for (const g of grades) {
    await prisma.grade.upsert({
      where:  { id: g.id },
      update: { displayName: g.displayName, isPublic: g.isPublic },
      create: g,
    });
  }
  console.log("  ✓ Grades: Lớp 1–5 (Lớp 2 public)");
}

// ── 3. Grade Release Configs ───────────────────────────────────────────────────

async function seedGradeReleaseConfigs() {
  console.log("  \u2713 GradeReleaseConfigs: skipped (model removed)");
}

// ── 4. Topics (Lớp 2) ──────────────────────────────────────────────────────────

async function seedTopics() {
  const topics = [
    {
      id:          ID.topics.addCarry,
      code:        "add_carry_g2",
      name:        "Cộng có nhớ",
      description: "Cộng hai số có nhớ trong phạm vi 100",
      status:      "ACTIVE"  as const,
      displayOrder:1,
      gradeId:     ID.grades.g2,
      subjectId:   ID.subjects.math,
    },
    {
      id:          ID.topics.subCarry,
      code:        "sub_carry_g2",
      name:        "Trừ có nhớ",
      description: "Trừ hai số có nhớ trong phạm vi 100",
      status:      "ACTIVE"  as const,
      displayOrder:2,
      gradeId:     ID.grades.g2,
      subjectId:   ID.subjects.math,
    },
    {
      id:          ID.topics.wordProb,
      code:        "word_prob_g2",
      name:        "Toán lời văn 1 bước",
      description: "Giải bài toán có lời văn một bước tính",
      status:      "ACTIVE"  as const,
      displayOrder:3,
      gradeId:     ID.grades.g2,
      subjectId:   ID.subjects.math,
    },
    {
      id:          ID.topics.geometry,
      code:        "geometry_g2",
      name:        "Hình học cơ bản",
      description: "Nhận biết hình vuông, tròn, chữ nhật",
      status:      "ACTIVE"  as const,
      displayOrder:4,
      gradeId:     ID.grades.g2,
      subjectId:   ID.subjects.math,
    },
    {
      id:          ID.topics.measurement,
      code:        "measurement_g2",
      name:        "Đo lường cơ bản",
      description: "Đo độ dài, khối lượng đơn giản",
      status:      "INACTIVE" as const,
      displayOrder:5,
      gradeId:     ID.grades.g2,
      subjectId:   ID.subjects.math,
    },
  ];

  for (const t of topics) {
    await prisma.curriculumTopic.upsert({
      where:  { id: t.id },
      update: { name: t.name, description: t.description, status: t.status },
      create: t,
    });
  }
  console.log("  ✓ Topics: 5 topics for Lớp 2");
}

// ── 5. Skills ──────────────────────────────────────────────────────────────────

async function seedSkills() {
  const skills = [
    // Cộng có nhớ
    {
      id: ID.skills.addCarrySingleStep,
      topicId: ID.topics.addCarry,
      code: "single_step",
      name: "Cộng có nhớ bước đơn",
      description: "Cộng trực tiếp hai số, kết quả vượt chục",
      displayOrder: 1,
    },
    {
      id: ID.skills.addCarryTwoDigit,
      topicId: ID.topics.addCarry,
      code: "two_digit",
      name: "Cộng có nhớ số 2 chữ số",
      description: "Cộng hai số hai chữ số có nhớ",
      displayOrder: 2,
    },
    {
      id: ID.skills.addCarryMissing,
      topicId: ID.topics.addCarry,
      code: "missing_number",
      name: "Tìm số còn thiếu (cộng)",
      description: "Dạng: ? + b = c hoặc a + ? = c",
      displayOrder: 3,
    },
    // Trừ có nhớ
    {
      id: ID.skills.subCarrySingleStep,
      topicId: ID.topics.subCarry,
      code: "single_step",
      name: "Trừ có nhớ bước đơn",
      description: "Trừ trực tiếp, phải mượn chục",
      displayOrder: 1,
    },
    {
      id: ID.skills.subCarryTwoDigit,
      topicId: ID.topics.subCarry,
      code: "two_digit",
      name: "Trừ có nhớ số 2 chữ số",
      description: "Trừ hai số hai chữ số có nhớ",
      displayOrder: 2,
    },
    // Toán lời văn
    {
      id: ID.skills.wordProbAdd,
      topicId: ID.topics.wordProb,
      code: "word_problem_add",
      name: "Lời văn phép cộng",
      description: "Bài toán có lời văn giải bằng phép cộng",
      displayOrder: 1,
    },
    {
      id: ID.skills.wordProbSub,
      topicId: ID.topics.wordProb,
      code: "word_problem_sub",
      name: "Lời văn phép trừ",
      description: "Bài toán có lời văn giải bằng phép trừ",
      displayOrder: 2,
    },
  ];

  for (const s of skills) {
    await prisma.skill.upsert({
      where:  { id: s.id },
      update: { name: s.name, description: s.description },
      create: s,
    });
  }
  console.log("  ✓ Skills: 7 skills across 3 topics");
}

// ── 6. Question Blueprints ─────────────────────────────────────────────────────

// Separate type for constraints data kept as plain TS object.
type BlueprintConstraints = {
  numberRange: { min: number; max: number };
  resultRange: { min: number; max: number };
};

type BlueprintSeed = {
  id: string; topicId: string; skillId?: string;
  name: string; questionFormat: "MCQ" | "FILLIN";
  easyPercent: number; mediumPercent: number; hardPercent: number;
  version: string; isEnabled: boolean;
  constraints?: BlueprintConstraints;
};

async function seedBlueprints() {
  const blueprints: BlueprintSeed[] = [
    {
      id:             ID.blueprints.addCarryMcq,
      topicId:        ID.topics.addCarry,
      name:           "Cộng có nhớ – Trắc nghiệm",
      questionFormat: "MCQ",
      version:        "v1.0",
      isEnabled:      true,
      easyPercent:    30,
      mediumPercent:  50,
      hardPercent:    20,
      constraints: {
        numberRange: { min: 1, max: 99 },
        resultRange: { min: 2, max: 100 },
      },
    },
    {
      id:             ID.blueprints.addCarryFillin,
      topicId:        ID.topics.addCarry,
      name:           "Cộng có nhớ – Điền vào chỗ trống",
      questionFormat: "FILLIN",
      version:        "v1.0",
      isEnabled:      true,
      easyPercent:    40,
      mediumPercent:  40,
      hardPercent:    20,
      constraints: {
        numberRange: { min: 1, max: 99 },
        resultRange: { min: 2, max: 100 },
      },
    },
    {
      id:             ID.blueprints.subCarryMcq,
      topicId:        ID.topics.subCarry,
      name:           "Trừ có nhớ – Trắc nghiệm",
      questionFormat: "MCQ",
      version:        "v1.0",
      isEnabled:      true,
      easyPercent:    30,
      mediumPercent:  50,
      hardPercent:    20,
      constraints: {
        numberRange: { min: 2, max: 100 },
        resultRange: { min: 1, max: 99 },
      },
    },
    {
      id:             ID.blueprints.wordProbMcq,
      topicId:        ID.topics.wordProb,
      name:           "Toán lời văn 1 bước – Trắc nghiệm",
      questionFormat: "MCQ",
      version:        "v1.0",
      isEnabled:      true,
      easyPercent:    40,
      mediumPercent:  40,
      hardPercent:    20,
      constraints: {
        numberRange: { min: 1, max: 50 },
        resultRange: { min: 1, max: 99 },
      },
    },
    {
      id:             ID.blueprints.geometryMcq,
      topicId:        ID.topics.geometry,
      name:           "Hình học cơ bản – Trắc nghiệm",
      questionFormat: "MCQ",
      version:        "v1.0",
      isEnabled:      true,
      easyPercent:    50,
      mediumPercent:  40,
      hardPercent:    10,
    },
  ];

  for (const b of blueprints) {
    const { constraints, skillId, ...rest } = b;
    const constraintsJson = constraints ? asJson(constraints as Record<string, unknown>) : undefined;
    await prisma.questionBlueprint.upsert({
      where:  { id: b.id },
      update: {
        isEnabled:     b.isEnabled,
        version:       b.version,
        easyPercent:   b.easyPercent,
        mediumPercent: b.mediumPercent,
        hardPercent:   b.hardPercent,
        ...(constraintsJson ? { constraints: constraintsJson } : {}),
      },
      create: {
        ...rest,
        ...(skillId ? { skillId } : {}),
        ...(constraintsJson ? { constraints: constraintsJson } : {}),
      },
    });
  }
  console.log("  ✓ QuestionBlueprints: 5 blueprints");
}

// ── 7. Validator Rules ─────────────────────────────────────────────────────────

type ValidatorRuleSeed = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  config?: Record<string, unknown>;
};

async function seedValidatorRules() {
  const rules: ValidatorRuleSeed[] = [
    {
      id:          ID.validatorRules.rangeCheck,
      name:        "range_check",
      description: "Kết quả phải nằm trong phạm vi số của lớp",
      isActive:    true,
      config:      { maxResult: 100 },
    },
    {
      id:          ID.validatorRules.uniqueDistractors,
      name:        "unique_distractors",
      description: "Các lựa chọn sai phải khác nhau và khác đáp án",
      isActive:    true,
    },
    {
      id:          ID.validatorRules.noNegatives,
      name:        "no_negatives",
      description: "Không được có số âm trong đề dành cho lớp 1–2",
      isActive:    true,
      config:      { appliesTo: [1, 2] },
    },
    {
      id:          ID.validatorRules.explanationConsistency,
      name:        "explanation_consistency",
      description: "Gợi ý phải đúng với đáp án và logic toán học",
      isActive:    true,
    },
    {
      id:          ID.validatorRules.languageLength,
      name:        "language_length_limit",
      description: "Gợi ý không quá 2 câu, ngôn ngữ thân thiện tuổi 6–11",
      isActive:    true,
      config:      { maxSentences: 2, targetAgeRange: [6, 11] },
    },
  ];

  for (const r of rules) {
    const { config, ...rest } = r;
    const configJson = config ? asJson(config) : undefined;
    await prisma.validatorRule.upsert({
      where:  { name: r.name },
      update: {
        description: r.description,
        isActive:    r.isActive,
        ...(configJson ? { config: configJson } : {}),
      },
      create: { ...rest, ...(configJson ? { config: configJson } : {}) },
    });
  }
  console.log("  ✓ ValidatorRules: 5 rules");
}

// ── 8. Prompt Templates ────────────────────────────────────────────────────────

async function seedPromptTemplates() {
  const templates = [
    {
      id:          ID.promptTemplates.genQuestion,
      slug:        "gen_question",
      name:        "Sinh câu hỏi – Cộng/Trừ có nhớ",
      version:     "v3.2",
      modelTarget: "gpt-4o-mini",
      isActive:    true,
      template: [
        `Tạo {{count}} câu hỏi Toán lớp {{grade}} chủ đề "{{topic}}" độ khó {{difficulty}}.`,
        `Yêu cầu:`,
        `- Kết quả trong phạm vi {{range}}`,
        `- Định dạng JSON`,
        `- Mỗi câu gồm: text, choices (A–D), correctKey, hint_vi`,
      ].join("\n"),
    },
    {
      id:          ID.promptTemplates.explainError,
      slug:        "explain_error",
      name:        "Giải thích lỗi – Feedback học sinh",
      version:     "v2.1",
      modelTarget: "gpt-4o-mini",
      isActive:    true,
      template: [
        `Học sinh lớp {{grade}} trả lời sai câu:`,
        `Câu hỏi: {{question}}`,
        `Đáp án sai: {{wrong}}`,
        `Đáp án đúng: {{correct}}`,
        ``,
        `Viết gợi ý ngắn gọn (≤ 2 câu) bằng tiếng Việt, thân thiện với trẻ 7–8 tuổi.`,
      ].join("\n"),
    },
    {
      id:          ID.promptTemplates.friendlyFeedback,
      slug:        "friendly_feedback",
      name:        "Feedback thân thiện sau bài làm",
      version:     "v1.0",
      modelTarget: "gpt-4o-mini",
      isActive:    true,
      template: [
        `Học sinh lớp {{grade}} vừa hoàn thành bài luyện chủ đề "{{topic}}".`,
        `Kết quả: {{score}}/{{total}} câu đúng.`,
        `Điểm yếu: {{weakTopics}}.`,
        ``,
        `Viết 2–3 câu động viên và gợi ý bước tiếp theo bằng tiếng Việt, phù hợp trẻ 7–11 tuổi.`,
      ].join("\n"),
    },
  ];

  for (const t of templates) {
    await prisma.promptTemplate.upsert({
      where:  { slug: t.slug },
      update: { name: t.name, version: t.version, template: t.template, isActive: t.isActive },
      create: t,
    });
  }
  console.log("  ✓ PromptTemplates: 3 templates");
}

// ── 9. User + Student (demo) ───────────────────────────────────────────────────

async function seedUserAndStudent() {
  await prisma.user.upsert({
    where:  { id: ID.users.parent },
    update: { name: "Nguyễn Văn Phụ Huynh" },
    create: {
      id:    ID.users.parent,
      email: "phu_huynh@gmail.com",
      name:  "Nguyễn Văn Phụ Huynh",
      role:  "PARENT",
    },
  });

  await prisma.student.upsert({
    where:  { id: ID.students.demo },
    update: { name: "Nguyễn Minh Anh", schoolName: "Trường TH Lê Văn Tám" },
    create: {
      id:         ID.students.demo,
      name:       "Nguyễn Minh Anh",
      schoolName: "Trường TH Lê Văn Tám",
      schoolYear: "2025–2026",
      userId:     ID.users.parent,
      gradeId:    ID.grades.g2,
    },
  });

  console.log("  ✓ User: Nguyễn Văn Phụ Huynh");
  console.log("  ✓ Student: Nguyễn Minh Anh (Lớp 2)");
}

// ── 10. Sample Exam + Submission ───────────────────────────────────────────────

async function seedSampleExam() {
  // Create exam
  await prisma.exam.upsert({
    where:  { id: ID.exams.demo },
    update: {},
    create: {
      id:            ID.exams.demo,
      questionCount: 5,
      difficulty:    "MEDIUM",
      format:        "MCQ",
      studentId:     ID.students.demo,
      topicId:       ID.topics.addCarry,
      gradeId:       ID.grades.g2,
    },
  });

  // Exam items — snapshots of questions
  type ChoiceData = { id: string; text: string; isCorrect: boolean };
  type ItemSeed = {
    id: string; examId: string; orderIndex: number;
    questionText: string; questionFormat: "MCQ" | "FILLIN";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    correctAnswer: string; hint?: string;
    choices?: ChoiceData[];
  };

  const items: ItemSeed[] = [
    {
      id: ID.examItems.q1, examId: ID.exams.demo, orderIndex: 1,
      questionText: "34 + 18 = ?",
      questionFormat: "MCQ", difficulty: "EASY", correctAnswer: "52",
      hint: "Cộng hàng đơn vị trước: 4 + 8 = 12, viết 2 nhớ 1.",
      choices: [
        { id: "A", text: "42", isCorrect: false },
        { id: "B", text: "52", isCorrect: true  },
        { id: "C", text: "53", isCorrect: false },
        { id: "D", text: "62", isCorrect: false },
      ],
    },
    {
      id: ID.examItems.q2, examId: ID.exams.demo, orderIndex: 2,
      questionText: "45 + ___ = 72",
      questionFormat: "FILLIN", difficulty: "MEDIUM", correctAnswer: "27",
      hint: "Lấy 72 trừ 45 để tìm số cần điền.",
    },
    {
      id: ID.examItems.q3, examId: ID.exams.demo, orderIndex: 3,
      questionText: "27 + 35 = ?",
      questionFormat: "MCQ", difficulty: "MEDIUM", correctAnswer: "62",
      choices: [
        { id: "A", text: "52", isCorrect: false },
        { id: "B", text: "61", isCorrect: false },
        { id: "C", text: "62", isCorrect: true  },
        { id: "D", text: "72", isCorrect: false },
      ],
    },
    {
      id: ID.examItems.q4, examId: ID.exams.demo, orderIndex: 4,
      questionText: "56 + 37 = ?",
      questionFormat: "FILLIN", difficulty: "MEDIUM", correctAnswer: "93",
      hint: "6 + 7 = 13, viết 3 nhớ 1; 5 + 3 + 1 = 9.",
    },
    {
      id: ID.examItems.q5, examId: ID.exams.demo, orderIndex: 5,
      questionText: "48 + 46 = ?",
      questionFormat: "MCQ", difficulty: "HARD", correctAnswer: "94",
      choices: [
        { id: "A", text: "84", isCorrect: false },
        { id: "B", text: "92", isCorrect: false },
        { id: "C", text: "94", isCorrect: true  },
        { id: "D", text: "96", isCorrect: false },
      ],
    },
  ];

  for (const item of items) {
    const { choices, ...rest } = item;
    const choicesJson = choices ? asJsonArray(choices) : undefined;
    await prisma.examItem.upsert({
      where:  { id: item.id },
      update: {},
      create: {
        ...rest,
        ...(choicesJson ? { choices: choicesJson } : {}),
      },
    });
  }

  // Submission (graded, student got q1 q2 q4 q5 right, q3 wrong)
  await prisma.submission.upsert({
    where:  { id: ID.submissions.demo },
    update: {},
    create: {
      id:              ID.submissions.demo,
      status:          "GRADED",
      score:           4,
      totalQuestions:  5,
      accuracy:        80,
      durationSeconds: 486,
      submittedAt:     new Date("2026-04-12T10:00:00Z"),
      examId:          ID.exams.demo,
      studentId:       ID.students.demo,
    },
  });

  // Submission answers
  const answers = [
    { examItemId: ID.examItems.q1, givenAnswer: "52", isCorrect: true  },
    { examItemId: ID.examItems.q2, givenAnswer: "27", isCorrect: true  },
    { examItemId: ID.examItems.q3, givenAnswer: "61", isCorrect: false }, // wrong
    { examItemId: ID.examItems.q4, givenAnswer: "93", isCorrect: true  },
    { examItemId: ID.examItems.q5, givenAnswer: "94", isCorrect: true  },
  ];

  for (const ans of answers) {
    // SubmissionAnswer has no unique constraint — safe to skip if already seeded
    const existing = await prisma.submissionAnswer.findFirst({
      where: { submissionId: ID.submissions.demo, examItemId: ans.examItemId },
    });
    if (!existing) {
      await prisma.submissionAnswer.create({
        data: { submissionId: ID.submissions.demo, ...ans },
      });
    }
  }

  console.log("  ✓ Sample Exam with 5 items and 1 graded submission");
}

// ── 11. Learning Progress ──────────────────────────────────────────────────────

async function seedLearningProgress() {
  const progressRows = [
    {
      studentId:      ID.students.demo,
      topicId:        ID.topics.addCarry,
      sessionCount:   8,
      totalQuestions: 80,
      correctCount:   42,
      accuracy:       52,
      mastery:        "WEAK"      as const,
      lastPracticedAt:new Date("2026-04-12T10:00:00Z"),
    },
    {
      studentId:      ID.students.demo,
      topicId:        ID.topics.subCarry,
      sessionCount:   4,
      totalQuestions: 40,
      correctCount:   27,
      accuracy:       68,
      mastery:        "DEVELOPING" as const,
      lastPracticedAt:new Date("2026-04-11T10:00:00Z"),
    },
    {
      studentId:      ID.students.demo,
      topicId:        ID.topics.wordProb,
      sessionCount:   3,
      totalQuestions: 30,
      correctCount:   14,
      accuracy:       45,
      mastery:        "WEAK"      as const,
      lastPracticedAt:new Date("2026-04-10T10:00:00Z"),
    },
    {
      studentId:      ID.students.demo,
      topicId:        ID.topics.geometry,
      sessionCount:   5,
      totalQuestions: 50,
      correctCount:   46,
      accuracy:       91,
      mastery:        "STRONG"    as const,
      lastPracticedAt:new Date("2026-04-09T10:00:00Z"),
    },
  ];

  for (const p of progressRows) {
    await prisma.learningProgress.upsert({
      where:  { studentId_topicId: { studentId: p.studentId, topicId: p.topicId } },
      update: {
        sessionCount: p.sessionCount, totalQuestions: p.totalQuestions,
        correctCount: p.correctCount, accuracy: p.accuracy,
        mastery: p.mastery, lastPracticedAt: p.lastPracticedAt,
      },
      create: p,
    });
  }
  console.log("  ✓ LearningProgress: 4 topic records for demo student");
}

// ── Run ─────────────────────────────────────────────────────────────────────────

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
