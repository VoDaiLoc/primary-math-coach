/**
 * GET   /api/admin/exam-papers/[id]          — detail with items
 * PATCH /api/admin/exam-papers/[id]           — update metadata
 * POST  /api/admin/exam-papers/[id]/items     — add question
 * DELETE /api/admin/exam-papers/[id]/items/[itemId] — remove question
 */
import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import {
  getExamPaperDetail,
  patchExamPaper,
  addExamPaperItem,
  removeExamPaperItem,
} from "@/lib/exam-paper-service";
import type { AddExamPaperItemBody } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const paper = await getExamPaperDetail(id);
    if (!paper) return notFound("Không tìm thấy đề.");
    return ok(paper);
  } catch (err) {
    console.error("[GET /api/admin/exam-papers/[id]]", err);
    return serverError("Không thể tải đề.");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as { title?: string; description?: string; status?: string } | null;
  if (!body) return badRequest("Invalid JSON body.");
  try {
    const paper = await patchExamPaper(id, body);
    if (!paper) return notFound("Không tìm thấy đề.");
    return ok(paper);
  } catch (err) {
    console.error("[PATCH /api/admin/exam-papers/[id]]", err);
    return serverError("Không thể cập nhật đề.");
  }
}
