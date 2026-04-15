/**
 * GET /api/practice/config
 *
 * Returns all public grades and their active topics for the practice config form.
 * No auth required — student picks what to practise.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapGradeWithCount, mapTopicFull } from "@/lib/db-mappers";
import type { PracticeConfigResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [grades, topics] = await Promise.all([
      db.grade.findMany({ where: { isPublic: true }, orderBy: { level: "asc" } }),
      db.curriculumTopic.findMany({
        where: { status: "ACTIVE" },
        include: {
          grade: true,
          _count: { select: { skills: true } },
        },
        orderBy: [{ grade: { level: "asc" } }, { displayOrder: "asc" }],
      }),
    ]);

    const body: PracticeConfigResponse = {
      grades: grades.map((g) => mapGradeWithCount(g, topics.filter((t) => t.gradeId === g.id).length)),
      topics: topics.map((t) =>
        mapTopicFull(t, t.grade.level, t._count.skills, 0),
      ),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/practice/config]", err);
    return NextResponse.json({ error: "Không thể tải cấu hình luyện tập." }, { status: 500 });
  }
}
