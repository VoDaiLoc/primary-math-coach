/**
 * GET /api/dashboard/summary
 *
 * Returns the full parent dashboard payload for the demo student.
 * Auth: uses DEMO_STUDENT_ID (replace caller with session lookup when auth lands).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api-response";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import { buildDashboardSummary } from "@/lib/dashboard-summary-service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const studentId = DEMO_STUDENT_ID;

  const exists = await db.student.findUnique({
    where:  { id: studentId },
    select: { id: true },
  });
  if (!exists) return notFound("Không tìm thấy học sinh.");

  try {
    const summary = await buildDashboardSummary(studentId);
    return ok(summary);
  } catch (err) {
    console.error("[GET /api/dashboard/summary]", err);
    return serverError("Không thể tải dữ liệu dashboard.");
  }
}
