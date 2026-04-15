/**
 * GET  /api/admin/question-bank  — list with filters
 * POST /api/admin/question-bank  — create item
 */
import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api-response";
import { listBankItems, createBankItem } from "@/lib/question-bank-service";
import type { BankListFilters } from "@/lib/question-bank-service";
import type { QuestionFormat, DifficultyLevel, QuestionSource, ReviewStatus } from "@/types/enums";
import type { CreateQuestionBankItemBody } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: BankListFilters = {
    gradeId:      sp.get("gradeId")      ?? undefined,
    topicId:      sp.get("topicId")      ?? undefined,
    skillId:      sp.get("skillId")      ?? undefined,
    difficulty:   (sp.get("difficulty")  ?? undefined) as DifficultyLevel | undefined,
    format:       (sp.get("format")      ?? undefined) as QuestionFormat  | undefined,
    source:       (sp.get("source")      ?? undefined) as QuestionSource  | undefined,
    reviewStatus: (sp.get("reviewStatus")?? undefined) as ReviewStatus    | undefined,
    isActive:     sp.has("isActive") ? sp.get("isActive") === "true" : undefined,
    page:         sp.has("page")     ? Number(sp.get("page"))     : 1,
    pageSize:     sp.has("pageSize") ? Number(sp.get("pageSize")) : 30,
  };

  try {
    const result = await listBankItems(filters);
    return ok(result);
  } catch (err) {
    console.error("[GET /api/admin/question-bank]", err);
    return serverError("Không thể tải ngân hàng câu hỏi.");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as CreateQuestionBankItemBody | null;
  if (!body?.topicId || !body.questionText || !body.format || !body.difficulty || !body.correctAnswer) {
    return badRequest("Thiếu thông tin bắt buộc: topicId, questionText, format, difficulty, correctAnswer.");
  }

  try {
    const item = await createBankItem(body);
    return ok(item, 201);
  } catch (err) {
    console.error("[POST /api/admin/question-bank]", err);
    return serverError("Không thể tạo câu hỏi.");
  }
}
