"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { success: true } | { success: false; error: string };

export async function approveSignupRequest(
  requestId: string
): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    const { data: request, error: fetchError } = await admin
      .from("signup_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, error: "신청 정보를 찾을 수 없습니다." };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(request.email, {
        redirectTo: `${siteUrl}/auth/set-password`,
        data: {
          full_name: request.full_name,
          phone: request.phone,
          username: request.username,
        },
      });

    if (inviteError || !invited.user) {
      const isDuplicate = inviteError?.message
        ?.toLowerCase()
        .includes("already been registered");
      return {
        success: false,
        error: isDuplicate
          ? "이미 가입된 이메일이에요. 신청서를 거절 처리해주세요."
          : (inviteError?.message ?? "초대 이메일 발송에 실패했습니다."),
      };
    }

    await admin
      .from("profiles")
      .update({
        full_name: request.full_name,
        phone: request.phone,
        username: request.username,
        approval_status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", invited.user.id);

    await admin
      .from("signup_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", requestId);

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "승인에 실패했습니다.",
    };
  }
}

export async function rejectSignupRequest(
  requestId: string
): Promise<ActionResult> {
  try {
    const admin = createAdminClient();

    await admin
      .from("signup_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", requestId);

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "거절에 실패했습니다.",
    };
  }
}
