/**
 * GET  /api/admin/question-candidates  — list with filters
 */
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api-response";
import { listCandidates } from "@/lib/candidate-service";
import type { CandidateFilters } from "@/lib/candidate-service";
import type { CandidateStatus } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: CandidateFilters = {
    topicId:         sp.get("topicId")         ?? undefined,
    gradeId:         sp.get("gradeId")         ?? undefined,
    candidateStatus: (sp.get("candidateStatus") ?? undefined) as CandidateStatus | undefined,
    modelUsed:       sp.get("modelUsed")        ?? undefined,
    page:            sp.has("page")     ? Number(sp.get("page"))     : 1,
    pageSize:        sp.has("pageSize") ? Number(sp.get("pageSize")) : 30,
  };

  try {
    const result = await listCandidates(filters);
    return ok(result);
  } catch (err) {
    console.error("[GET /api/admin/question-candidates]", err);
    return serverError("Không thể tải danh sách candidate.");
  }
}
