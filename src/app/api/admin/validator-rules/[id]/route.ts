/**
 * PATCH  /api/admin/validator-rules/[id]  — update rule
 * DELETE /api/admin/validator-rules/[id]  — delete rule
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { mapValidatorRule } from "@/lib/db-mappers";
import type { PatchValidatorRuleBody } from "@/types/api";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const VALID_SCOPES = ["global", "grade", "topic", "skill", "blueprint"] as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as PatchValidatorRuleBody | null;
  if (!body || typeof body !== "object") return badRequest("Body phải là object.");

  const dbData: Record<string, unknown> = {};
  if (body.description !== undefined) {
    if (!body.description.trim()) return badRequest("Mô tả không được rỗng.");
    dbData.description = body.description.trim();
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return badRequest("isActive phải là boolean.");
    dbData.isActive = body.isActive;
  }
  if (body.scope !== undefined) {
    if (!VALID_SCOPES.includes(body.scope as typeof VALID_SCOPES[number])) {
      return badRequest(`scope phải là một trong: ${VALID_SCOPES.join(", ")}.`);
    }
    dbData.scope = body.scope;
  }
  if (body.config !== undefined) {
    dbData.config = body.config as Prisma.InputJsonValue;
  }

  if (Object.keys(dbData).length === 0) return badRequest("Không có field hợp lệ nào được cập nhật.");

  try {
    const existing = await db.validatorRule.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy validator rule.");

    const updated = await db.validatorRule.update({ where: { id }, data: dbData });
    return ok(mapValidatorRule(updated));
  } catch (err) {
    console.error("[PATCH /api/admin/validator-rules/:id]", err);
    return serverError("Không thể cập nhật validator rule.");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await db.validatorRule.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy validator rule.");
    await db.validatorRule.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/validator-rules/:id]", err);
    return serverError("Không thể xoá validator rule.");
  }
}
