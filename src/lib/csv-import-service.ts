/**
 * src/lib/csv-import-service.ts
 *
 * Parses and validates CSV files for bulk import of topics, skills, and questions.
 * Does NOT depend on formidable or multer — reads the raw string from the caller.
 *
 * All imports run in a single transaction per object type.
 * Returns per-row results for the admin to review.
 *
 * ── CSV formats ──────────────────────────────────────────────────────────────
 *
 * Topics:
 *   code,name,description,grade_level,subject_code,display_order
 *
 * Skills:
 *   topic_code,code,name,description,display_order
 *
 * Questions:
 *   grade_level,topic_code,skill_code,question_text,question_format,
 *   difficulty,correct_answer,hint,choice_a,choice_b,choice_c,choice_d,
 *   correct_choice_id,source
 */

import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { ImportRowResult, CsvImportResponse } from "@/types/api";

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCsv(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function colIdx(headers: string[], name: string): number {
  return headers.indexOf(name);
}

function col(row: string[], headers: string[], name: string): string {
  const i = colIdx(headers, name);
  return i >= 0 ? (row[i] ?? "").trim() : "";
}

// ── Topic import ──────────────────────────────────────────────────────────────

export async function importTopicsCsv(raw: string): Promise<CsvImportResponse> {
  const lines  = parseCsv(raw).filter((r) => r.some(Boolean));
  if (lines.length < 2) return { successCount: 0, errorCount: 0, rows: [] };

  const headers = lines[0].map((h) => h.toLowerCase());
  const rows: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount   = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNum = i + 1;

    const code         = col(line, headers, "code");
    const name         = col(line, headers, "name");
    const description  = col(line, headers, "description");
    const gradeLevel   = Number(col(line, headers, "grade_level"));
    const subjectCode  = col(line, headers, "subject_code") || "math";
    const displayOrder = Number(col(line, headers, "display_order") || "0");

    if (!code) { rows.push({ row: rowNum, status: "error", error: "code bắt buộc." }); errorCount++; continue; }
    if (!name) { rows.push({ row: rowNum, status: "error", error: "name bắt buộc." }); errorCount++; continue; }
    if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 5) {
      rows.push({ row: rowNum, status: "error", error: `grade_level phải là số 1–5, nhận được "${col(line, headers, "grade_level")}".` });
      errorCount++; continue;
    }

    try {
      const grade   = await db.grade.findFirst({ where: { level: gradeLevel } });
      if (!grade) { rows.push({ row: rowNum, status: "error", error: `Không tìm thấy lớp ${gradeLevel}.` }); errorCount++; continue; }

      const subject = await db.subject.findFirst({ where: { code: subjectCode } });
      if (!subject) { rows.push({ row: rowNum, status: "error", error: `Không tìm thấy môn "${subjectCode}".` }); errorCount++; continue; }

      await db.curriculumTopic.upsert({
        where: { gradeId_code: { gradeId: grade.id, code } },
        update: { name, description: description || null, displayOrder },
        create: { code, name, description: description || null, displayOrder, gradeId: grade.id, subjectId: subject.id },
      });

      rows.push({ row: rowNum, status: "ok" });
      successCount++;
    } catch (err) {
      rows.push({ row: rowNum, status: "error", error: (err as Error).message.slice(0, 120) });
      errorCount++;
    }
  }

  return { successCount, errorCount, rows };
}

// ── Skill import ──────────────────────────────────────────────────────────────

export async function importSkillsCsv(raw: string): Promise<CsvImportResponse> {
  const lines  = parseCsv(raw).filter((r) => r.some(Boolean));
  if (lines.length < 2) return { successCount: 0, errorCount: 0, rows: [] };

  const headers = lines[0].map((h) => h.toLowerCase());
  const rows: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount   = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNum = i + 1;

    const topicCode    = col(line, headers, "topic_code");
    const code         = col(line, headers, "code");
    const name         = col(line, headers, "name");
    const description  = col(line, headers, "description");
    const displayOrder = Number(col(line, headers, "display_order") || "0");

    if (!topicCode) { rows.push({ row: rowNum, status: "error", error: "topic_code bắt buộc." }); errorCount++; continue; }
    if (!code)      { rows.push({ row: rowNum, status: "error", error: "code bắt buộc." });        errorCount++; continue; }
    if (!name)      { rows.push({ row: rowNum, status: "error", error: "name bắt buộc." });        errorCount++; continue; }

    try {
      const topic = await db.curriculumTopic.findFirst({ where: { code: topicCode } });
      if (!topic) { rows.push({ row: rowNum, status: "error", error: `Không tìm thấy topic "${topicCode}".` }); errorCount++; continue; }

      await db.skill.upsert({
        where: { topicId_code: { topicId: topic.id, code } },
        update: { name, description: description || null, displayOrder },
        create: { topicId: topic.id, code, name, description: description || null, displayOrder },
      });

      rows.push({ row: rowNum, status: "ok" });
      successCount++;
    } catch (err) {
      rows.push({ row: rowNum, status: "error", error: (err as Error).message.slice(0, 120) });
      errorCount++;
    }
  }

  return { successCount, errorCount, rows };
}

// ── Questions import ───────────────────────────────────────────────────────────

const VALID_FORMATS    = new Set(["mcq", "fillin"]);
const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);

// ── Question-row helpers ───────────────────────────────────────────────────────

function validateQuestionFields(
  line: string[], headers: string[],
): { error: string } | {
  topicCode: string; skillCode: string; questionText: string; format: string; difficulty: string;
  correctAnswer: string; hint: string; choiceA: string; choiceB: string; choiceC: string; choiceD: string;
  correctChoiceId: string; source: string;
} {
  const topicCode      = col(line, headers, "topic_code");
  const skillCode      = col(line, headers, "skill_code");
  const questionText   = col(line, headers, "question_text");
  const format         = col(line, headers, "question_format").toLowerCase();
  const difficulty     = col(line, headers, "difficulty").toLowerCase();
  const correctAnswer  = col(line, headers, "correct_answer");
  const hint           = col(line, headers, "hint");
  const choiceA        = col(line, headers, "choice_a");
  const choiceB        = col(line, headers, "choice_b");
  const choiceC        = col(line, headers, "choice_c");
  const choiceD        = col(line, headers, "choice_d");
  const correctChoiceId = col(line, headers, "correct_choice_id").toUpperCase();
  const source         = col(line, headers, "source") || "imported";

  if (!topicCode)    return { error: "topic_code bắt buộc." };
  if (!questionText) return { error: "question_text bắt buộc." };
  if (!VALID_FORMATS.has(format))     return { error: "question_format phải là mcq hoặc fillin." };
  if (!VALID_DIFFICULTY.has(difficulty)) return { error: "difficulty phải là easy/medium/hard." };
  if (!correctAnswer) return { error: "correct_answer bắt buộc." };
  if (format === "mcq") {
    if (!choiceA || !choiceB || !choiceC || !choiceD)
      return { error: "MCQ cần đủ choice_a, choice_b, choice_c, choice_d." };
    if (!["A", "B", "C", "D"].includes(correctChoiceId))
      return { error: "correct_choice_id phải là A, B, C hoặc D." };
  }
  return { topicCode, skillCode, questionText, format, difficulty, correctAnswer,
           hint, choiceA, choiceB, choiceC, choiceD, correctChoiceId, source };
}

async function insertQuestionRow(
  fields: Exclude<ReturnType<typeof validateQuestionFields>, { error: string }>,
  rowNum: number,
): Promise<ImportRowResult> {
  const { topicCode, skillCode, questionText, format, difficulty, correctAnswer,
          hint, choiceA, choiceB, choiceC, choiceD, correctChoiceId, source } = fields;
  try {
    const topic = await db.curriculumTopic.findFirst({ where: { code: topicCode } });
    if (!topic) return { row: rowNum, status: "error", error: `Không tìm thấy topic "${topicCode}".` };

    let skillId: string | null = null;
    if (skillCode) {
      const skill = await db.skill.findFirst({ where: { topicId: topic.id, code: skillCode } });
      if (!skill) return { row: rowNum, status: "error", error: `Không tìm thấy skill "${skillCode}" trong topic "${topicCode}".` };
      skillId = skill.id;
    }

    const choices: Prisma.InputJsonValue | typeof Prisma.DbNull =
      format === "mcq"
        ? [
            { id: "A", text: choiceA, isCorrect: correctChoiceId === "A" },
            { id: "B", text: choiceB, isCorrect: correctChoiceId === "B" },
            { id: "C", text: choiceC, isCorrect: correctChoiceId === "C" },
            { id: "D", text: choiceD, isCorrect: correctChoiceId === "D" },
          ]
        : Prisma.DbNull;

    const dbSource = source === "manual" ? "MANUAL" : "IMPORTED";

    await db.questionBankItem.create({
      data: {
        topicId:      topic.id,
        gradeId:      topic.gradeId,
        skillId,
        questionText,
        format:       format.toUpperCase() as never,
        difficulty:   difficulty.toUpperCase() as never,
        correctAnswer,
        hint:         hint || null,
        choices,
        source:       dbSource,
        reviewStatus: "APPROVED",
        isActive:     true,
      },
    });
    return { row: rowNum, status: "ok" };
  } catch (err) {
    return { row: rowNum, status: "error", error: (err as Error).message.slice(0, 120) };
  }
}

export async function importQuestionsCsv(raw: string): Promise<CsvImportResponse> {
  const lines  = parseCsv(raw).filter((r) => r.some(Boolean));
  if (lines.length < 2) return { successCount: 0, errorCount: 0, rows: [] };

  const headers = lines[0].map((h) => h.toLowerCase());
  const rows: ImportRowResult[] = [];
  let successCount = 0;
  let errorCount   = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const validated = validateQuestionFields(lines[i], headers);
    if ("error" in validated) {
      rows.push({ row: rowNum, status: "error", error: validated.error });
      errorCount++;
      continue;
    }
    const result = await insertQuestionRow(validated, rowNum);
    rows.push(result);
    if (result.status === "ok") successCount++; else errorCount++;
  }

  return { successCount, errorCount, rows };
}
