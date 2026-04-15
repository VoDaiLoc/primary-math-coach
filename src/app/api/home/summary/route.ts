/**
 * GET /api/home/summary
 *
 * Returns the full home screen payload for the demo student.
 * Shape: HomeSummaryResponse
 * Auth: uses DEMO_STUDENT_ID (no auth yet).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api-response";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import { buildHomeSummary } from "@/lib/home-summary-service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const studentId = DEMO_STUDENT_ID;

  // Verify student exists before doing heavy queries
  const exists = await db.student.findUnique({
    where:  { id: studentId },
    select: { id: true },
  });
  if (!exists) return notFound("Không tìm thấy học sinh.");

  try {
    const summary = await buildHomeSummary(studentId);
    return ok(summary);
  } catch (err) {
    console.error("[GET /api/home/summary]", err);
    return serverError("Không thể tải dữ liệu trang chủ.");
  }
}
