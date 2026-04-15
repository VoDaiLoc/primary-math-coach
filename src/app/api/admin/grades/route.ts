/**
 * GET /api/admin/grades
 * Returns all grades with their topic count.
 * Query params: none
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api-response";
import type { Grade } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const rows = await db.grade.findMany({
      orderBy: { level: "asc" },
      include: { _count: { select: { topics: true } } },
    });

    const grades: Grade[] = rows.map((g) => ({
      id:          g.id,
      level:       g.level,
      displayName: g.displayName,
      isPublic:    g.isPublic,
      topicCount:  g._count.topics,
    }));

    return ok({ grades });
  } catch (err) {
    console.error("[GET /api/admin/grades]", err);
    return serverError("Không thể tải danh sách lớp.");
  }
}
