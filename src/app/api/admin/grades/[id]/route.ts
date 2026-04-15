/**
 * PATCH /api/admin/grades/[id]
 * Toggle isPublic flag for a grade and persist to DB.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";
import type { Grade } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json() as { isPublic?: boolean };
    if (typeof body.isPublic !== "boolean") {
      return badRequest("isPublic phải là boolean.");
    }

    const grade = await db.grade.update({
      where: { id },
      data:  { isPublic: body.isPublic },
      include: { _count: { select: { topics: true } } },
    });

    const result: Grade = {
      id:          grade.id,
      level:       grade.level,
      displayName: grade.displayName,
      isPublic:    grade.isPublic,
      topicCount:  grade._count.topics,
    };

    return ok(result);
  } catch (err) {
    console.error("[PATCH /api/admin/grades/[id]]", err);
    return serverError("Không thể cập nhật lớp.");
  }
}
