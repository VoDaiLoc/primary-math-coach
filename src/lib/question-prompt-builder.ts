/**
 * src/lib/question-prompt-builder.ts
 *
 * Resolves runtime variables for the "question-generation/gen-question" prompt.
 * Pure functions — no I/O. Template loading + rendering live in the caller.
 *
 * To build a prompt:
 *   const vars     = resolveQuestionPromptVariables(input);
 *   const template = await loadPromptTemplate("question-generation/gen-question");
 *   const prompt   = renderPrompt(template, vars);
 */

import type { DifficultyLevel, QuestionFormat } from "@/types/enums";
import type { PromptVariables } from "./prompt-renderer";

// ── Input shape ──────────────────────────────────────────────────────────────

export interface BlueprintConstraints {
  numberRange?: { min: number; max: number };
  resultRange?: { min: number; max: number };
}

export interface PromptBuilderInput {
  gradeLevel: number;
  topicName: string;
  topicCode: string;
  skillName?: string;
  difficulty: DifficultyLevel;
  format: QuestionFormat;
  count: number;
  blueprintVersion: string;
  constraints: BlueprintConstraints;
}

// ── Difficulty descriptions ───────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  easy:   "dễ (1 bước tính đơn giản)",
  medium: "vừa (có nhớ hoặc mượn, kết quả lớn hơn)",
  hard:   "khó (kết quả ở phạm vi cao, cần nhiều bước hơn)",
};

// ── JSON schema examples (injected into {{outputSchema}}) ─────────────────────

const MCQ_OUTPUT_SCHEMA = `[
  {
    "questionText": "Câu hỏi ngắn gọn bằng tiếng Việt",
    "correctAnswer": "đáp án đúng dạng số hoặc chuỗi ngắn",
    "hint": "gợi ý 1 câu thân thiện, tối đa 15 từ",
    "choices": [
      { "id": "A", "text": "...", "isCorrect": true },
      { "id": "B", "text": "...", "isCorrect": false },
      { "id": "C", "text": "...", "isCorrect": false },
      { "id": "D", "text": "...", "isCorrect": false }
    ]
  }
]`;

const FILLIN_OUTPUT_SCHEMA = `[
  {
    "questionText": "Câu hỏi có ___ hoặc ? để điền vào",
    "correctAnswer": "đáp án đúng dạng số",
    "hint": "gợi ý 1 câu thân thiện, tối đa 15 từ"
  }
]`;

// ── MCQ-specific rules (injected into {{formatRules}}) ────────────────────────

const MCQ_FORMAT_RULES = `Quy tắc cho trắc nghiệm (MCQ):
- Đúng 4 lựa chọn (A, B, C, D), chỉ 1 đúng.
- Ba lựa chọn sai phải:
  - Là số khác nhau và khác đáp án đúng.
  - Gần với đáp án đúng (sai lệch ±1 đến ±15).
  - Không âm, không vượt 120.
- correctAnswer phải khớp đúng text của choice isCorrect: true.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageRangeLabel(gradeLevel: number): string {
  if (gradeLevel === 1) return "6";
  if (gradeLevel === 2) return "7–8";
  return "8–9";
}

function buildConstraintBlock(c: BlueprintConstraints, gradeLevel: number): string {
  const lines: string[] = [];

  if (c.numberRange) {
    lines.push(`- Các số sử dụng PHẢI nằm trong phạm vi [${c.numberRange.min}, ${c.numberRange.max}].`);
  }
  if (c.resultRange) {
    lines.push(`- Kết quả/đáp án PHẢI nằm trong phạm vi [${c.resultRange.min}, ${c.resultRange.max}].`);
  }
  if (gradeLevel <= 2) {
    lines.push(
      "- KHÔNG dùng số âm.",
      "- KHÔNG có phép chia.",
      "- Kết quả không vượt quá 100.",
    );
  }

  return lines.length > 0 ? lines.join("\n") : "- Giữ phạm vi số phù hợp lớp học.";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve all template variables for the "question-generation/gen-question" prompt.
 * Pure function — no I/O.
 *
 * Usage:
 *   const vars     = resolveQuestionPromptVariables(input);
 *   const template = await loadPromptTemplate("question-generation/gen-question");
 *   const prompt   = renderPrompt(template, vars);
 */
export function resolveQuestionPromptVariables(input: PromptBuilderInput): PromptVariables {
  const isMCQ = input.format === "mcq";

  return {
    gradeLevel:       input.gradeLevel,
    ageRange:         ageRangeLabel(input.gradeLevel),
    count:            input.count,
    topicName:        input.topicName,
    topicCode:        input.topicCode,
    // Empty string when no skill — template appends nothing after {{topicCode}} line
    skillLine:        input.skillName ? `\nKỹ năng: ${input.skillName}` : "",
    difficultyLabel:  DIFFICULTY_LABEL[input.difficulty],
    formatLabel:      isMCQ ? "Trắc nghiệm 4 lựa chọn (MCQ)" : "Điền vào chỗ trống (FILLIN)",
    blueprintVersion: input.blueprintVersion,
    constraintBlock:  buildConstraintBlock(input.constraints, input.gradeLevel),
    // Empty string for FILLIN — {{formatRules}} line in template becomes blank (harmless for LLM)
    formatRules:      isMCQ ? MCQ_FORMAT_RULES : "",
    outputSchema:     isMCQ ? MCQ_OUTPUT_SCHEMA : FILLIN_OUTPUT_SCHEMA,
  };
}

