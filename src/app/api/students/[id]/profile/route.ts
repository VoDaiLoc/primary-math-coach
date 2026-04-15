/**
 * GET  /api/students/[id]/profile  — fetch full profile
 * PATCH /api/students/[id]/profile — update editable fields
 *
 * Auth: no real auth yet. The demo student ID is resolved in the caller
 * (DEMO_STUDENT_ID from demo-session.ts). The `[id]` param is validated
 * against the DB on every request.
 */

import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import {
  getStudentProfile,
  updateStudentProfile,
  validateUpdateBody,
  ValidationError,
} from "@/lib/student-profile-service";

export const dynamic = "force-dynamic";

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const profile = await getStudentProfile(id);
    return ok(profile);
  } catch (err) {
    if (isNotFound(err)) return notFound("Không tìm thấy học sinh.");
    console.error(`[GET /api/students/${id}/profile]`, err);
    return serverError("Không thể tải hồ sơ học sinh.");
  }
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequest("Request body không hợp lệ JSON.");
  }

  let body;
  try {
    body = validateUpdateBody(raw);
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message);
    return badRequest("Dữ liệu không hợp lệ.");
  }

  try {
    const { updatedAt } = await updateStudentProfile(id, body);
    return ok({ studentId: id, updatedAt: updatedAt.toISOString() });
  } catch (err) {
    if (isNotFound(err)) return notFound("Không tìm thấy học sinh.");
    if (err instanceof ValidationError) return badRequest(err.message);
    console.error(`[PATCH /api/students/${id}/profile]`, err);
    return serverError("Không thể cập nhật hồ sơ.");
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}
