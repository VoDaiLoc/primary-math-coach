/**
 * GET  /api/admin/blueprints  — list blueprints (filter: topicId, skillId, format, isEnabled)
 * POST /api/admin/blueprints  — create a blueprint
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";
import { mapBlueprint } from "@/lib/db-mappers";
import type { CreateBlueprintBody } from "@/types/api";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const topicId   = sp.get("topicId") ?? undefined;
  const skillId   = sp.get("skillId") ?? undefined;
  const format    = sp.get("format")?.toUpperCase() as "MCQ" | "FILLIN" | undefined;
  const isEnabled = sp.has("isEnabled") ? sp.get("isEnabled") === "true" : undefined;

  try {
    const rows = await db.questionBlueprint.findMany({
      where: {
        ...(topicId && { topicId }),
        ...(skillId && { skillId }),
        ...(format && { questionFormat: format }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
      orderBy: { topic: { displayOrder: "asc" } },
    });
    return ok({ blueprints: rows.map(mapBlueprint) });
  } catch (err) {
    console.error("[GET /api/admin/blueprints]", err);
    return serverError("Không thể tải danh sách blueprint.");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as CreateBlueprintBody | null;
  if (!body?.name?.trim()) return badRequest("Tên blueprint là bắt buộc.");
  if (!body.topicId?.trim()) return badRequest("Chủ đề là bắt buộc.");
  if (!["mcq", "fillin", "MCQ", "FILLIN"].includes(body.questionFormat ?? "")) {
    return badRequest("questionFormat phải là mcq hoặc fillin.");
  }
  const easy = body.easyPercent ?? 0;
  const med  = body.mediumPercent ?? 0;
  const hard = body.hardPercent ?? 0;
  if (easy + med + hard !== 100) return badRequest("Tổng phần trăm easy + medium + hard phải bằng 100.");

  try {
    const topic = await db.curriculumTopic.findUnique({ where: { id: body.topicId } });
    if (!topic) return badRequest("Chủ đề không tồn tại.");

    const blueprint = await db.questionBlueprint.create({
      data: {
        name: body.name.trim(),
        topicId: body.topicId,
        skillId: body.skillId ?? null,
        questionFormat: body.questionFormat.toUpperCase() as "MCQ" | "FILLIN",
        version: body.version ?? "v1.0",
        easyPercent: easy, mediumPercent: med, hardPercent: hard,
        constraints: (body.constraints as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      },
    });
    return ok(mapBlueprint(blueprint), 201);
  } catch (err) {
    console.error("[POST /api/admin/blueprints]", err);
    return serverError("Không thể tạo blueprint.");
  }
}

