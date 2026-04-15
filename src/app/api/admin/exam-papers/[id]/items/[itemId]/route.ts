/**
 * DELETE /api/admin/exam-papers/[id]/items/[itemId]
 */
import { NextRequest } from "next/server";
import { notFound, ok, serverError } from "@/lib/api-response";
import { removeExamPaperItem } from "@/lib/exam-paper-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  try {
    const removed = await removeExamPaperItem(id, itemId);
    if (!removed) return notFound("Không tìm thấy câu trong đề.");
    return ok({ removed: true });
  } catch (err) {
    console.error("[DELETE /api/admin/exam-papers/[id]/items/[itemId]]", err);
    return serverError("Không thể xoá câu khỏi đề.");
  }
}
