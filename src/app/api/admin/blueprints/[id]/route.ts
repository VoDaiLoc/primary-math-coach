/**
 * PATCH /api/admin/blueprints/[id]
 * Updates isEnabled, version, and/or difficulty distribution.
 * If any of easyPercent / mediumPercent / hardPercent is supplied,
 * all three must be supplied and must sum to 100.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, notFound, ok, serverError } from "@/lib/api-response";
import { mapBlueprint } from "@/lib/db-mappers";
import type { PatchBlueprintBody } from "@/types/api";

export const dynamic = "force-dynamic";

const PERCENT_FIELDS = ["easyPercent", "mediumPercent", "hardPercent"] as const;

function validatePercents(
  b: Record<string, unknown>,
  data: PatchBlueprintBody,
): string | null {
  const provided = PERCENT_FIELDS.filter((f) => f in b);
  if (provided.length === 0) return null;
  if (provided.length !== 3) {
    return "Phải cung cấp đủ ba field: easyPercent, mediumPercent, hardPercent.";
  }
  for (const f of PERCENT_FIELDS) {
    const n = Number(b[f]);
    if (!Number.isInteger(n) || n < 0 || n > 100) return `${f} phải là số nguyên từ 0–100.`;
    data[f] = n;
  }
  const sum = (data.easyPercent ?? 0) + (data.mediumPercent ?? 0) + (data.hardPercent ?? 0);
  if (sum !== 100) return `Tổng phần trăm phải bằng 100 (hiện là ${sum}).`;
  return null;
}

function validate(body: unknown): { data: PatchBlueprintBody } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Body phải là object." };
  }
  const b = body as Record<string, unknown>;
  const data: PatchBlueprintBody = {};

  if ("isEnabled" in b) {
    if (typeof b.isEnabled !== "boolean") return { error: "isEnabled phải là boolean." };
    data.isEnabled = b.isEnabled;
  }

  if ("version" in b) {
    if (typeof b.version !== "string" || b.version.trim() === "") {
      return { error: "version phải là chuỗi không rỗng." };
    }
    data.version = b.version.trim();
  }

  const percentError = validatePercents(b, data);
  if (percentError) return { error: percentError };

  if (Object.keys(data).length === 0) {
    return { error: "Không có field hợp lệ nào được cập nhật." };
  }

  return { data };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = validate(await req.json().catch(() => null));
  if ("error" in result) return badRequest(result.error);

  try {
    const existing = await db.questionBlueprint.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy blueprint.");

    const updated = await db.questionBlueprint.update({
      where: { id },
      data: {
        ...(result.data.isEnabled   !== undefined && { isEnabled:    result.data.isEnabled }),
        ...(result.data.version     !== undefined && { version:      result.data.version }),
        ...(result.data.name        !== undefined && { name:         result.data.name }),
        ...(result.data.easyPercent !== undefined && {
          easyPercent:   result.data.easyPercent,
          mediumPercent: result.data.mediumPercent,
          hardPercent:   result.data.hardPercent,
        }),
      },
    });

    return ok(mapBlueprint(updated));
  } catch (err) {
    console.error("[PATCH /api/admin/blueprints/:id]", err);
    return serverError("Không thể cập nhật blueprint.");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const existing = await db.questionBlueprint.findUnique({ where: { id } });
    if (!existing) return notFound("Không tìm thấy blueprint.");
    await db.questionBlueprint.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/blueprints/:id]", err);
    return serverError("Không thể xoá blueprint.");
  }
}

