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

type RenderVideoResult =
  | { success: true; videoUrl: string }
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
 * 웹훅에 그대로 넘긴다. Kling(비디오)·ElevenLabs(TTS)·Creatomate(조립)를
 * n8n이 전부 오케스트레이션해서 최종 MP4 하나만 반환하는 원패스 구조라,
 * Next.js는 RenderScript를 직접 조립하지 않는다(예전엔 lib/creatomate.ts가
 * 이 역할을 했지만 Audio-First 원패스 재설계로 폐기됨, 2026-08-16).
 *
 * 씬마다 Kling 영상 생성 + TTS까지 서버에서 순서대로 처리하기 때문에
 * 예전 renderFinalVideo()보다 훨씬 오래 걸릴 수 있어서 타임아웃을
 * 넉넉하게 잡는다 — 그래도 부족하면 n8n 쪽에서 비동기/폴링 구조로
 * 다시 설계해야 할 수 있음(app/create/layout.tsx의 maxDuration도 같이 고려).
 */
export async function renderFinalVideo(
  scenes: RenderScenePayload[],
  duration: number
): Promise<RenderVideoResult> {
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
      signal: AbortSignal.timeout(570000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `최종 렌더링에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : "";

    if (!videoUrl) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return { success: true, videoUrl };
  } catch {
    return {
      success: false,
      error:
        "최종 렌더링 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}
