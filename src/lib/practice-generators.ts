/**
 * src/lib/practice-generators.ts
 *
 * Generates ExamItem data for a practice session without a real question bank.
 * Structured so the generator can be swapped for AI/blueprint engine later —
 * just implement the same `GeneratedItem` shape and replace the call in the route.
 */

import type { DifficultyLevel, QuestionFormat } from "@/types/enums";
import type { Prisma } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedItem {
  orderIndex:     number;
  questionText:   string;
  questionFormat: "MCQ" | "FILLIN";  // Prisma enum values
  difficulty:     "EASY" | "MEDIUM" | "HARD";
  correctAnswer:  string;
  hint?:          string;
  choices?:       Prisma.JsonArray; // [{ id, text, isCorrect }]
}

type ChoiceRow = { id: string; text: string; isCorrect: boolean };

// ── Helpers ───────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Converts DifficultyLevel (lowercase) to Prisma enum string. */
function toPrismaEnum(d: DifficultyLevel): "EASY" | "MEDIUM" | "HARD" {
  return d.toUpperCase() as "EASY" | "MEDIUM" | "HARD";
}

function toPrismaFormat(f: QuestionFormat): "MCQ" | "FILLIN" {
  return f.toUpperCase() as "MCQ" | "FILLIN";
}

/**
 * Shuffle an array in-place and return it.
 * Using Fisher-Yates for unbiased shuffling.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Build 4 MCQ choices from a correct answer and min/max bounds. */
function buildChoices(correct: number, min: number, max: number): Prisma.JsonArray {
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < 3 && attempts < 50) {
    const delta = randInt(1, 12) * (Math.random() > 0.5 ? 1 : -1);
    const w = correct + delta;
    if (w !== correct && w >= min && w <= max) wrongs.add(w);
    attempts++;
  }
  // Fallback if range is too tight
  while (wrongs.size < 3) {
    wrongs.add(correct + wrongs.size + 1);
  }

  const rows: ChoiceRow[] = shuffle([
    { text: String(correct), isCorrect: true },
    ...Array.from(wrongs).map((n) => ({ text: String(n), isCorrect: false })),
  ]).map((c, i) => ({ id: ["A", "B", "C", "D"][i], ...c }));

  return rows as unknown as Prisma.JsonArray;
}

// ── Generators per topic code ─────────────────────────────────────────────────

/** Cộng có nhớ — addition with carry (a%10 + b%10 >= 10) */
function generateAddition(
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  idx: number,
): Omit<GeneratedItem, "orderIndex" | "questionFormat" | "difficulty"> {
  const ranges = {
    easy:   { aMin: 11, aMax: 39, bMin: 2,  bMax: 9  },
    medium: { aMin: 20, aMax: 59, bMin: 10, bMax: 29 },
    hard:   { aMin: 30, aMax: 69, bMin: 20, bMax: 39 },
  }[difficulty];

  let a: number, b: number;
  let tries = 0;
  do {
    a = randInt(ranges.aMin, ranges.aMax);
    b = randInt(ranges.bMin, ranges.bMax);
    tries++;
  } while (((a % 10) + (b % 10) < 10 || a + b > 100) && tries < 40);

  const sum = a + b;
  const hint = `Cộng hàng đơn vị trước: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}, viết ${sum % 10} nhớ 1.`;

  if (format === "mcq") {
    return {
      questionText:  `${a} + ${b} = ?`,
      correctAnswer: String(sum),
      hint,
      choices: buildChoices(sum, 2, 120),
    };
  }
  // fillin — alternate between "a + b = ?" and "a + ___ = sum"
  if (idx % 2 === 0) {
    return {
      questionText:  `${a} + ___ = ${sum}`,
      correctAnswer: String(b),
      hint:          `Lấy ${sum} trừ ${a} để tìm số cần điền.`,
    };
  }
  return { questionText: `${a} + ${b} = ?`, correctAnswer: String(sum), hint };
}

/** Trừ có nhớ — subtraction with borrow (a%10 < b%10) */
function generateSubtraction(
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  idx: number,
): Omit<GeneratedItem, "orderIndex" | "questionFormat" | "difficulty"> {
  const ranges = {
    easy:   { aMin: 12, aMax: 50, bMin: 3,  bMax: 9  },
    medium: { aMin: 30, aMax: 80, bMin: 10, bMax: 29 },
    hard:   { aMin: 50, aMax: 99, bMin: 20, bMax: 49 },
  }[difficulty];

  let a: number, b: number;
  let tries = 0;
  do {
    a = randInt(ranges.aMin, ranges.aMax);
    b = randInt(ranges.bMin, ranges.bMax);
    tries++;
  } while ((a % 10 >= b % 10 || a < b) && tries < 40);

  const diff = a - b;
  const hint  = `${a % 10} < ${b % 10}, phải mượn chục: ${10 + (a % 10)} - ${b % 10} = ${(10 + (a % 10)) - (b % 10)}, nhớ giảm chục của ${a}.`;

  if (format === "mcq") {
    return {
      questionText:  `${a} - ${b} = ?`,
      correctAnswer: String(diff),
      hint,
      choices: buildChoices(diff, 1, 99),
    };
  }
  if (idx % 2 === 0) {
    return {
      questionText:  `${a} - ___ = ${diff}`,
      correctAnswer: String(b),
      hint:          `Lấy ${a} trừ ${diff} để tìm số cần điền.`,
    };
  }
  return { questionText: `${a} - ${b} = ?`, correctAnswer: String(diff), hint };
}

/** Toán lời văn 1 bước — simple word problems using addition or subtraction. */
function generateWordProblem(
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  idx: number,
): Omit<GeneratedItem, "orderIndex" | "questionFormat" | "difficulty"> {
  const addTemplates = [
    (a: number, b: number) => ({
      text: `Bạn Nam có ${a} quyển sách. Bạn được tặng thêm ${b} quyển. Hỏi bạn Nam có tất cả bao nhiêu quyển sách?`,
      answer: a + b,
      hint: `Có thêm → cộng: ${a} + ${b} = ${a + b}.`,
    }),
    (a: number, b: number) => ({
      text: `Trong vườn có ${a} bông hoa. Mẹ trồng thêm ${b} bông. Hỏi trong vườn có tất cả bao nhiêu bông hoa?`,
      answer: a + b,
      hint: `Trồng thêm → cộng: ${a} + ${b} = ${a + b}.`,
    }),
  ];
  const subTemplates = [
    (a: number, b: number) => ({
      text: `Lớp có ${a} học sinh. Hôm nay có ${b} bạn nghỉ học. Hỏi hôm nay lớp có bao nhiêu học sinh đi học?`,
      answer: a - b,
      hint: `Bạn nghỉ → trừ: ${a} - ${b} = ${a - b}.`,
    }),
    (a: number, b: number) => ({
      text: `Cửa hàng có ${a} quyển vở. Đã bán đi ${b} quyển. Hỏi cửa hàng còn lại bao nhiêu quyển vở?`,
      answer: a - b,
      hint: `Bán đi → trừ: ${a} - ${b} = ${a - b}.`,
    }),
  ];

  const useAdd = idx % 2 === 0;
  const a = difficulty === "easy" ? randInt(10, 30) : difficulty === "medium" ? randInt(20, 50) : randInt(40, 70);
  const b = difficulty === "easy" ? randInt(2, 10)  : difficulty === "medium" ? randInt(5, 20)  : randInt(10, 30);

  let text: string, answer: number, hint: string;
  if (useAdd) {
    const t = addTemplates[idx % addTemplates.length](a, b);
    ({ text, answer, hint } = t);
  } else {
    const safeA = a + b; // ensure a > b for subtraction
    const t = subTemplates[idx % subTemplates.length](safeA, b);
    ({ text, answer, hint } = t);
  }

  if (format === "mcq") {
    return {
      questionText:  text,
      correctAnswer: String(answer),
      hint,
      choices: buildChoices(answer, 1, 120),
    };
  }
  return { questionText: text, correctAnswer: String(answer), hint };
}

/** Generic fallback for topics without specific generators. */
function generateFallback(
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  idx: number,
): Omit<GeneratedItem, "orderIndex" | "questionFormat" | "difficulty"> {
  return generateAddition(difficulty, format, idx);
}

// ── Topic dispatch ─────────────────────────────────────────────────────────────

type GeneratorFn = (
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  idx: number,
) => Omit<GeneratedItem, "orderIndex" | "questionFormat" | "difficulty">;

const GENERATORS: Record<string, GeneratorFn> = {
  add_carry_g2: generateAddition,
  sub_carry_g2: generateSubtraction,
  word_prob_g2: generateWordProblem,
};

/**
 * Public entry point.
 * Generates `count` ExamItem seeds for a given topic code + config.
 * The topicCode must match the `code` column in `curriculum_topics`.
 */
export function generateExamItems(params: {
  topicCode: string;
  difficulty: DifficultyLevel;
  format: QuestionFormat;
  count: number;
}): GeneratedItem[] {
  const { topicCode, difficulty, format, count } = params;
  const generator = GENERATORS[topicCode] ?? generateFallback;
  const prismaFormat = toPrismaFormat(format);
  const prismaDiff   = toPrismaEnum(difficulty);

  return Array.from({ length: count }, (_, i) => {
    const raw = generator(difficulty, format, i);
    return {
      orderIndex:     i + 1,
      questionFormat: prismaFormat,
      difficulty:     prismaDiff,
      ...raw,
    } satisfies GeneratedItem;
  });
}
