/**
 * PATCH  /api/admin/skills/[id]  — partial update
 * DELETE /api/admin/skills/[id]  — safe delete (archive if dependencies exist)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import type { PatchSkillBody, AdminSkillRow } from "@/types/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function mapSkill(s: {
  id: string; code: string; name: string; description: string | null;
  displayOrder: number; isActive: boolean; topicId: string;
  topic: { name: string; grade: { level: number } };
}): AdminSkillRow {
  return {
    id: s.id, code: s.code, name: s.name, description: s.description ?? "",
    displayOrder: s.displayOrder, isActive: s.isActive,
    topicId: s.topicId, topicName: s.topic.name, gradeLevel: s.topic.grade.level,
  };
}

const SKILL_INCLUDE = {
  topic: { select: { name: true, grade: { select: { level: true } } } },
} as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as PatchSkillBody | null;
  if (!body || typeof body !== "object") return badRequest("Body phải là object.");

  const dbData: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return badRequest("Tên không được rỗng.");
    dbData.name = body.name.trim();
  }
  if (body.code !== undefined) {
    if (!body.code.trim()) return badRequest("Code không được rỗng.");
    dbData.code = body.code.trim();
  }
  if (body.description !== undefined) dbData.description = body.description?.trim() || null;
  if (body.displayOrder !== undefined) {
    const n = Number(body.displayOrder);
    if (!Number.isInteger(n) || n < 0) return badRequest("displayOrder phải là số nguyên không âm.");
    dbData.displayOrder = n;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return badRequest("isActive phải là boolean.");
    dbData.isActive = body.isActive;
  }
  if (body.topicId !== undefined) {
    if (!body.topicId.trim()) return badRequest("topicId không được rỗng.");
    dbData.topicId = body.topicId.trim();
  }

  if (Object.keys(dbData).length === 0) return badRequest("Không có field hợp lệ nào được cập nhật.");

  try {
    const existing = await db.skill.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy kỹ năng.");

    const updated = await db.skill.update({
      where: { id }, data: dbData, include: SKILL_INCLUDE,
    });
    return ok(mapSkill(updated));
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return badRequest("Code đã tồn tại trong chủ đề này.");
    console.error("[PATCH /api/admin/skills/:id]", err);
    return serverError("Không thể cập nhật kỹ năng.");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await db.skill.findUnique({
      where: { id },
      include: { _count: { select: { bankItems: true, candidates: true } } },
    });
    if (!existing) return notFound("Không tìm thấy kỹ năng.");

    const hasDependencies = existing._count.bankItems + existing._count.candidates > 0;

    if (hasDependencies) {
      const archived = await db.skill.update({
        where: { id }, data: { isActive: false }, include: SKILL_INCLUDE,
      });
      return ok({ ...mapSkill(archived), archived: true, reason: "Đã vô hiệu hoá vì kỹ năng có dữ liệu liên quan." });
    }

    await db.skill.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/skills/:id]", err);
    return serverError("Không thể xoá kỹ năng.");
  }
}
