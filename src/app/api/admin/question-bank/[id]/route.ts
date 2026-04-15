/**
 * PATCH  /api/admin/question-bank/[id]  — update fields
 * DELETE /api/admin/question-bank/[id]  — archive (soft delete)
 */
import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { patchBankItem, archiveBankItem } from "@/lib/question-bank-service";
import type { PatchQuestionBankItemBody } from "@/types/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as PatchQuestionBankItemBody | null;
  if (!body) return badRequest("Invalid JSON body.");

  try {
    const item = await patchBankItem(id, body);
    if (!item) return notFound("Không tìm thấy câu hỏi.");
    return ok(item);
  } catch (err) {
    console.error("[PATCH /api/admin/question-bank/[id]]", err);
    return serverError("Không thể cập nhật câu hỏi.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const found = await archiveBankItem(id);
    if (!found) return notFound("Không tìm thấy câu hỏi.");
    return ok({ archived: true });
  } catch (err) {
    console.error("[DELETE /api/admin/question-bank/[id]]", err);
    return serverError("Không thể xoá câu hỏi.");
  }
}
