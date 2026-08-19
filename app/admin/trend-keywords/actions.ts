"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { success: true } | { success: false; error: string };

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !getAdminEmails().includes((user.email ?? "").toLowerCase())) {
    return { success: false, error: "권한이 없어요." };
  }

  return { success: true };
}

export async function addTrendKeyword(keyword: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const trimmed = keyword.trim();
  if (!trimmed) {
    return { success: false, error: "키워드를 입력해주세요." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("trend_keywords")
    .insert({ keyword: trimmed });

  if (error) {
    const isDuplicate = error.message.toLowerCase().includes("duplicate");
    return {
      success: false,
      error: isDuplicate ? "이미 등록된 키워드예요." : error.message,
    };
  }

  revalidatePath("/admin/trend-keywords");
  return { success: true };
}

export async function toggleTrendKeyword(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("trend_keywords")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/trend-keywords");
  return { success: true };
}

export async function deleteTrendKeyword(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.success) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("trend_keywords").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/trend-keywords");
  return { success: true };
}
