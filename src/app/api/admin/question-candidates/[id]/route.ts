/**
 * PATCH /api/admin/question-candidates/[id]
 * Body: { action: "approve" | "reject" | "approve_with_edits", ...edits }
 */
import { NextRequest } from "next/server";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { reviewCandidate } from "@/lib/candidate-service";
import type { ReviewCandidateBody } from "@/types/api";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = new Set(["approve", "reject", "approve_with_edits"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null) as ReviewCandidateBody | null;

  if (!body?.action || !VALID_ACTIONS.has(body.action)) {
    return badRequest(`action phải là: ${[...VALID_ACTIONS].join(", ")}.`);
  }

  try {
    const candidate = await reviewCandidate(id, body);
    if (!candidate) return notFound("Không tìm thấy candidate.");
    return ok(candidate);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.startsWith("Candidate already")) return badRequest(msg);
    console.error("[PATCH /api/admin/question-candidates/[id]]", err);
    return serverError("Không thể cập nhật candidate.");
  }
}
