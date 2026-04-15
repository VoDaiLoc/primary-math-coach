/**
 * POST /api/admin/exam-papers/[id]/items — add question from bank
 */
import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { addExamPaperItem } from "@/lib/exam-paper-service";
import type { AddExamPaperItemBody } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as AddExamPaperItemBody | null;
  if (!body?.questionBankItemId) {
    return badRequest("questionBankItemId bắt buộc.");
  }
  try {
    const item = await addExamPaperItem(id, body);
    return ok(item, 201);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("not found") || msg.includes("Only approved")) return badRequest(msg);
    console.error("[POST /api/admin/exam-papers/[id]/items]", err);
    return serverError("Không thể thêm câu vào đề.");
  }
}
