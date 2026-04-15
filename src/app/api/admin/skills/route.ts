// GET  /api/admin/skills  — list skills (filter: topicId, gradeId, search, isActive)
// POST /api/admin/skills  — create a new skill
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";
import type { AdminSkillRow } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const topicId  = sp.get("topicId") ?? undefined;
  const gradeId  = sp.get("gradeId") ?? undefined;
  const search   = sp.get("search")?.trim() ?? undefined;
  const isActive = sp.has("isActive") ? sp.get("isActive") === "true" : undefined;

  try {
    const rows = await db.skill.findMany({
      where: {
        ...(topicId && { topicId }),
        ...(gradeId && { topic: { gradeId } }),
        ...(isActive !== undefined && { isActive }),
        ...(search && { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ]}),
      },
      orderBy: [{ topic: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      include: { topic: { select: { name: true, grade: { select: { level: true } } } } },
    });
    const skills: AdminSkillRow[] = rows.map((s) => ({
      id: s.id, code: s.code, name: s.name, description: s.description ?? "",
      displayOrder: s.displayOrder, isActive: s.isActive,
      topicId: s.topicId, topicName: s.topic.name, gradeLevel: s.topic.grade.level,
    }));
    return ok({ skills });
  } catch (err) {
    console.error("[GET /api/admin/skills]", err);
    return serverError("Khong the tai danh sach ky nang.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; topicId?: string; code?: string; description?: string; displayOrder?: number; };
    if (!body.name?.trim()) return badRequest("Ten ky nang la bat buoc.");
    if (!body.topicId?.trim()) return badRequest("Chu de la bat buoc.");

    const topic = await db.curriculumTopic.findUnique({ where: { id: body.topicId } });
    if (!topic) return badRequest("Chu de khong ton tai.");

    const agg = await db.skill.aggregate({ where: { topicId: body.topicId }, _max: { displayOrder: true } });
    const nextOrder = (agg._max.displayOrder ?? 0) + 1;

    const rawCode = body.code?.trim() || body.name.trim().toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 40);

    const skill = await db.skill.create({
      data: {
        code: rawCode, name: body.name.trim(),
        description: body.description?.trim() ?? null,
        topicId: body.topicId, displayOrder: body.displayOrder ?? nextOrder,
      },
      include: { topic: { select: { name: true, grade: { select: { level: true } } } } },
    });

    const result: AdminSkillRow = {
      id: skill.id, code: skill.code, name: skill.name,
      description: skill.description ?? "", displayOrder: skill.displayOrder,
      isActive: skill.isActive, topicId: skill.topicId,
      topicName: skill.topic.name, gradeLevel: skill.topic.grade.level,
    };
    return ok(result, 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return badRequest("Code da ton tai trong chu de nay.");
    console.error("[POST /api/admin/skills]", err);
    return serverError("Khong the tao ky nang.");
  }
}
