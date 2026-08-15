"use server";

import { createClient } from "@/lib/supabase/server";
import { buildRenderScript, type RenderScene } from "@/lib/creatomate";

type GenerateScriptResult =
  | { success: true; script: string }
  | { success: false; error: string };

type GenerateImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

type UploadImageResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string };

type GenerateVideoResult =
  | { success: true; videoUrl: string }
  | { success: false; error: string };

type RenderVideoResult =
  | { success: true; videoUrl: string }
  | { success: false; error: string };

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
  prompt: string
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
      body: JSON.stringify({ prompt }),
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

export async function generateSceneVideo(
  imageUrl: string,
  motionPrompt: string,
  targetDurationSeconds: number
): Promise<GenerateVideoResult> {
  const webhookUrl = process.env.N8N_GENERATE_VIDEO_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "AI 비디오 변환 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ imageUrl, motionPrompt, targetDurationSeconds }),
      signal: AbortSignal.timeout(280000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `비디오 변환에 실패했어요. (status ${res.status})`,
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
        "AI 비디오 변환 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
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

export async function renderFinalVideo(
  scenes: RenderScene[],
  totalDurationSeconds: number
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

  const renderScript = buildRenderScript(scenes, totalDurationSeconds);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify(renderScript),
      signal: AbortSignal.timeout(180000),
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
