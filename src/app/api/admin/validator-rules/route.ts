/**
 * GET  /api/admin/validator-rules  — list rules (filter: enabled, scope)
 * POST /api/admin/validator-rules  — create a rule
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";
import { mapValidatorRule } from "@/lib/db-mappers";
import type { CreateValidatorRuleBody } from "@/types/api";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_SCOPES = ["global", "grade", "topic", "skill", "blueprint"] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const enabledParam = sp.get("enabled");
  const isActiveFilter =
    enabledParam === "true"  ? true  :
    enabledParam === "false" ? false :
    undefined;
  const scope = sp.get("scope") ?? undefined;

  try {
    const rows = await db.validatorRule.findMany({
      where: {
        ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
        ...(scope && { scope }),
      },
      orderBy: { name: "asc" },
    });
    return ok({ rules: rows.map(mapValidatorRule) });
  } catch (err) {
    console.error("[GET /api/admin/validator-rules]", err);
    return serverError("Không thể tải danh sách validator rules.");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as CreateValidatorRuleBody | null;
  if (!body?.name?.trim()) return badRequest("Tên rule là bắt buộc.");
  if (!body.description?.trim()) return badRequest("Mô tả rule là bắt buộc.");
  if (body.scope && !VALID_SCOPES.includes(body.scope as typeof VALID_SCOPES[number])) {
    return badRequest(`scope phải là một trong: ${VALID_SCOPES.join(", ")}.`);
  }

  try {
    const rule = await db.validatorRule.create({
      data: {
        name: body.name.trim(),
        description: body.description.trim(),
        scope: body.scope ?? "global",
        config: (body.config as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      },
    });
    return ok(mapValidatorRule(rule), 201);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return badRequest("Tên rule đã tồn tại.");
    console.error("[POST /api/admin/validator-rules]", err);
    return serverError("Không thể tạo validator rule.");
  }
}

