/**
 * GET  /api/admin/topics  — list topics (filter: gradeId, search, status)
 * POST /api/admin/topics  — create a new topic
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";
import { toTopicStatus } from "@/lib/db-mappers";
import type { CurriculumTopic } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const gradeId = sp.get("gradeId") ?? undefined;
  const search  = sp.get("search")?.trim() ?? undefined;
  const status  = sp.get("status") ?? undefined; // "active" | "inactive"

  try {
    const rows = await db.curriculumTopic.findMany({
      where: {
        ...(gradeId && { gradeId }),
        ...(status && { status: status.toUpperCase() as "ACTIVE" | "INACTIVE" }),
        ...(search && { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ]}),
      },
      orderBy: [{ grade: { level: "asc" } }, { displayOrder: "asc" }],
      include: { grade: { select: { level: true } }, _count: { select: { skills: true } } },
    });
    const topics: CurriculumTopic[] = rows.map((t) => ({
      id: t.id, code: t.code, gradeId: t.gradeId, gradeLevel: t.grade.level,
      name: t.name, description: t.description ?? "", status: toTopicStatus(t.status),
      skillCount: t._count.skills, questionCount: 0, displayOrder: t.displayOrder,
    }));
    return ok({ topics });
  } catch (err) {
    console.error("[GET /api/admin/topics]", err);
    return serverError("Không thể tải danh sách chủ đề.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; gradeId?: string; description?: string; code?: string; displayOrder?: number; };
    if (!body.name?.trim()) return badRequest("Tên chủ đề là bắt buộc.");
    if (!body.gradeId?.trim()) return badRequest("Lớp là bắt buộc.");

    const subject = await db.subject.findFirst({ where: { code: "math" } });
    if (!subject) return serverError("Không tìm thấy môn học Toán.");

    const agg = await db.curriculumTopic.aggregate({ where: { gradeId: body.gradeId }, _max: { displayOrder: true } });
    const nextOrder = (agg._max.displayOrder ?? 0) + 1;

    // Auto-generate code if not provided
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

    const topic = await db.curriculumTopic.create({
      data: {
        code: rawCode, name: body.name.trim(),
        description: body.description?.trim() ?? null,
        gradeId: body.gradeId, subjectId: subject.id,
        displayOrder: body.displayOrder ?? nextOrder,
      },
      include: { grade: { select: { level: true } }, _count: { select: { skills: true } } },
    });

    const result: CurriculumTopic = {
      id: topic.id, code: topic.code, gradeId: topic.gradeId,
      gradeLevel: topic.grade.level, name: topic.name,
      description: topic.description ?? "", status: "active",
      skillCount: 0, questionCount: 0, displayOrder: topic.displayOrder,
    };
    return ok(result, 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return badRequest("Code đã tồn tại trong lớp này.");
    console.error("[POST /api/admin/topics]", err);
    return serverError("Không thể tạo chủ đề.");
  }
}


