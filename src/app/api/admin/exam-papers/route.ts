/**
 * GET  /api/admin/exam-papers  — list all papers
 * POST /api/admin/exam-papers  — create new paper
 */
import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { listExamPapers, createExamPaper } from "@/lib/exam-paper-service";
import type { CreateExamPaperBody } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const papers = await listExamPapers({
      gradeId: sp.get("gradeId") ?? undefined,
      topicId: sp.get("topicId") ?? undefined,
    });
    return ok({ papers });
  } catch (err) {
    console.error("[GET /api/admin/exam-papers]", err);
    return serverError("Không thể tải danh sách đề.");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as CreateExamPaperBody | null;
  if (!body?.title || !body.gradeId) {
    return badRequest("Thiếu title hoặc gradeId.");
  }
  try {
    const paper = await createExamPaper(body);
    return ok(paper, 201);
  } catch (err) {
    console.error("[POST /api/admin/exam-papers]", err);
    return serverError("Không thể tạo đề.");
  }
}
