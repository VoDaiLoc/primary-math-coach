/**
 * POST /api/auth/register
 *
 * Called after Supabase signUp() succeeds — creates the User record in our DB.
 * Maps Supabase authId → DB User (role defaults to PARENT).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { authId?: string; email?: string; name?: string } | null;
  if (!body?.authId || !body?.email || !body?.name?.trim()) {
    return badRequest("authId, email và name là bắt buộc.");
  }

  try {
    // Upsert — safe to call again if email-confirm triggers a retry
    const user = await db.user.upsert({
      where:  { authId: body.authId },
      update: {},                              // don't overwrite role on re-calls
      create: {
        authId: body.authId,
        email:  body.email,
        name:   body.name.trim(),
        role:   "PARENT",                      // new accounts are always PARENT
      },
    });
    return ok({ id: user.id, role: user.role });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      // email already exists → just look up the existing user
      const existing = await db.user.findUnique({ where: { email: body.email } });
      if (existing) {
        // Link the authId if it's missing
        if (!existing.authId) {
          await db.user.update({ where: { id: existing.id }, data: { authId: body.authId } });
        }
        return ok({ id: existing.id, role: existing.role });
      }
    }
    console.error("[POST /api/auth/register]", err);
    return serverError("Không thể tạo tài khoản.");
  }
}
