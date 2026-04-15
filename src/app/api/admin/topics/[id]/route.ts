/**
 * PATCH /api/admin/topics/[id]  — partial update (status, displayOrder, name, description, code)
 * PUT   /api/admin/topics/[id]  — full update
 * DELETE /api/admin/topics/[id] — safe delete (archive if dependencies exist)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { toTopicStatus } from "@/lib/db-mappers";
import type { PatchTopicBody } from "@/types/api";
import type { CurriculumTopic } from "@/types/domain";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function mapTopic(t: {
  id: string; code: string; gradeId: string;
  grade: { level: number }; name: string; description: string | null;
  status: string; displayOrder: number; _count: { skills: number };
}): CurriculumTopic {
  return {
    id: t.id, code: t.code, gradeId: t.gradeId, gradeLevel: t.grade.level,
    name: t.name, description: t.description ?? "", status: toTopicStatus(t.status),
    skillCount: t._count.skills, questionCount: 0, displayOrder: t.displayOrder,
  };
}

const TOPIC_INCLUDE = {
  grade: { select: { level: true } },
  _count: { select: { skills: true } },
} as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as PatchTopicBody | null;
  if (!body || typeof body !== "object") return badRequest("Body phải là object.");

  const dbData: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!["active", "inactive"].includes(body.status)) return badRequest('status phải là "active" hoặc "inactive".');
    dbData.status = body.status.toUpperCase();
  }
  if (body.displayOrder !== undefined) {
    const n = Number(body.displayOrder);
    if (!Number.isInteger(n) || n < 0) return badRequest("displayOrder phải là số nguyên không âm.");
    dbData.displayOrder = n;
  }
  if (body.name !== undefined) {
    if (!body.name.trim()) return badRequest("Tên không được rỗng.");
    dbData.name = body.name.trim();
  }
  if (body.description !== undefined) dbData.description = body.description?.trim() || null;
  if (body.code !== undefined) {
    if (!body.code.trim()) return badRequest("Code không được rỗng.");
    dbData.code = body.code.trim();
  }

  if (Object.keys(dbData).length === 0) return badRequest("Không có field hợp lệ nào được cập nhật.");

  try {
    const existing = await db.curriculumTopic.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy chủ đề.");

    const updated = await db.curriculumTopic.update({
      where: { id }, data: dbData, include: TOPIC_INCLUDE,
    });
    return ok(mapTopic(updated));
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return badRequest("Code đã tồn tại trong lớp này.");
    console.error("[PATCH /api/admin/topics/:id]", err);
    return serverError("Không thể cập nhật chủ đề.");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await db.curriculumTopic.findUnique({
      where: { id },
      include: {
        _count: { select: { skills: true, bankItems: true, candidates: true, examPapers: true, exams: true } },
      },
    });
    if (!existing) return notFound("Không tìm thấy chủ đề.");

    const { skills, bankItems, candidates, examPapers, exams } = existing._count;
    const hasDependencies = skills + bankItems + candidates + examPapers + exams > 0;

    if (hasDependencies) {
      // Archive instead of hard delete
      const archived = await db.curriculumTopic.update({
        where: { id }, data: { status: "INACTIVE" }, include: TOPIC_INCLUDE,
      });
      return ok({ ...mapTopic(archived), archived: true, reason: "Đã vô hiệu hoá vì chủ đề có dữ liệu liên quan." });
    }

    await db.curriculumTopic.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/topics/:id]", err);
    return serverError("Không thể xoá chủ đề.");
  }
}
