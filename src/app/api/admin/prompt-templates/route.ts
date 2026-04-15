/**
 * GET /api/admin/prompt-templates
 * Returns all prompt templates.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, serverError } from "@/lib/api-response";
import { mapPromptTemplate } from "@/lib/db-mappers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const rows = await db.promptTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return ok({ templates: rows.map(mapPromptTemplate) });
  } catch (err) {
    console.error("[GET /api/admin/prompt-templates]", err);
    return serverError("Không thể tải danh sách prompt templates.");
  }
}
