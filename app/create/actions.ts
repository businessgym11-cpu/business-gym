"use server";

import { createClient } from "@/lib/supabase/server";

type GenerateScriptResult =
  | { success: true; script: string }
  | { success: false; error: string };

type GenerateImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

type UploadImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

type StartRenderJobResult =
  | { success: true; jobId: string }
  | { success: false; error: string };

type CheckRenderStatusResult =
  | { success: true; status: "pending" | "done" | "error"; videoUrl?: string; error?: string }
  | { success: false; error: string };

type RenderScenePayload = {
  imageUrl: string;
  text: string;
};

export async function generateScript(
  keyword: string,
  durationSeconds: number
): Promise<GenerateScriptResult> {
  const webhookUrl = process.env.N8N_GENERATE_SCRIPT_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "AI 대본 생성 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ keyword, duration: durationSeconds }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `대본 생성에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const script = typeof data.script === "string" ? data.script : "";

    if (!script) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return { success: true, script };
  } catch {
    return {
      success: false,
      error:
        "AI 대본 생성 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

export async function generateSceneImage(
  prompt: string,
  sceneDirection?: string
): Promise<GenerateImageResult> {
  const webhookUrl = process.env.N8N_GENERATE_IMAGE_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "AI 이미지 생성 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ prompt, sceneDirection }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `이미지 생성에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";

    if (!imageUrl) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return { success: true, imageUrl };
  } catch {
    return {
      success: false,
      error:
        "AI 이미지 생성 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

export async function uploadSceneImage(
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "파일을 찾을 수 없어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("scene-uploads")
    .upload(path, file);

  if (error) {
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("scene-uploads").getPublicUrl(path);

  return { success: true, imageUrl: publicUrl };
}

/**
 * 확정된 스토리보드(씬별 정지 이미지 + 텍스트 대본)를 n8n 최종 렌더링
 * 웹훅에 넘긴다. n8n은 render_jobs 테이블에 pending 행을 만들고 jobId를
 * 즉시 응답한 뒤(Respond to Webhook), 같은 실행 안에서 Kling(비디오)·
 * ElevenLabs(TTS)·Creatomate(조립)를 계속 처리해 완료 시 해당 행을
 * done/error로 업데이트한다 — 비동기/폴링 구조(Vercel의 504 게이트웨이
 * 타임아웃이 n8n의 실제 렌더링 시간보다 훨씬 짧아서, 응답을 기다리는
 * 단일 요청/응답 구조로는 못 버틴다는 게 밝혀져 2026-08-16에 재설계됨).
 * Next.js는 RenderScript를 직접 조립하지 않는다(예전엔 lib/creatomate.ts가
 * 이 역할을 했지만 Audio-First 원패스 재설계로 폐기됨).
 */
export async function startRenderJob(
  scenes: RenderScenePayload[],
  duration: number
): Promise<StartRenderJobResult> {
  const webhookUrl = process.env.N8N_RENDER_VIDEO_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "최종 렌더링 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  if (scenes.some((s) => !s.imageUrl)) {
    return {
      success: false,
      error: "모든 씬에 이미지가 있어야 렌더링할 수 있어요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ scenes, duration }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `렌더링 시작에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const jobId = typeof data.jobId === "string" ? data.jobId : "";

    if (!jobId) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return { success: true, jobId };
  } catch {
    return {
      success: false,
      error:
        "최종 렌더링 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

/**
 * render_jobs 행을 직접 조회한다. jobId(UUID)는 추측 불가능해서 사실상
 * 폴링용 토큰 역할을 하므로, service_role 대신 익명 키 클라이언트 +
 * public-read RLS 정책으로 최소 권한 원칙을 지킨다.
 */
export async function checkRenderStatus(
  jobId: string
): Promise<CheckRenderStatusResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("render_jobs")
    .select("status, video_url, error_message")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    return { success: false, error: "렌더링 작업을 찾을 수 없어요." };
  }

  return {
    success: true,
    status: data.status as "pending" | "done" | "error",
    videoUrl: data.video_url ?? undefined,
    error: data.error_message ?? undefined,
  };
}
