/**
 * POST /api/admin/import/topics   — upload CSV, import topics
 * POST /api/admin/import/skills   — upload CSV, import skills
 * POST /api/admin/import/questions — upload CSV, import question bank items
 *
 * Accepts multipart/form-data with a "file" field containing the CSV.
 * Falls back to raw text/plain body for easy curl testing.
 */
import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { importTopicsCsv, importSkillsCsv, importQuestionsCsv } from "@/lib/csv-import-service";

export const dynamic = "force-dynamic";

type ImportType = "topics" | "skills" | "questions";

async function readCsvText(req: NextRequest): Promise<string | null> {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    const file = form.get("file");
    if (!file || typeof file === "string") return null;
    return await (file as Blob).text();
  }

  // Plain text / application/octet-stream fallback
  return await req.text().catch(() => null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!["topics", "skills", "questions"].includes(type)) {
    return badRequest(`type phải là topics, skills hoặc questions.`);
  }

  const csv = await readCsvText(req);
  if (!csv || csv.trim().length === 0) {
    return badRequest("Không đọc được nội dung CSV từ request.");
  }

  try {
    let result;
    if (type === "topics")    result = await importTopicsCsv(csv);
    else if (type === "skills")    result = await importSkillsCsv(csv);
    else                           result = await importQuestionsCsv(csv);
    return ok(result);
  } catch (err) {
    console.error(`[POST /api/admin/import/${type}]`, err);
    return serverError("Lỗi khi xử lý file CSV.");
  }
}
