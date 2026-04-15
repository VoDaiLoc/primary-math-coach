/**
 * GET /api/me/student
 *
 * Returns the first Student linked to the currently logged-in User.
 * Used by the practice config form to get the student ID from the session.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where:   { authId: user.id },
    include: { students: { take: 1, orderBy: { createdAt: "asc" } } },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  }

  const student = dbUser.students[0];
  if (!student) {
    return NextResponse.json({ error: "Tài khoản chưa có học sinh. Vui lòng thêm học sinh trước." }, { status: 404 });
  }

  return NextResponse.json({ studentId: student.id, name: student.name });
}
