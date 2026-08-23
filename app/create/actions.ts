"use server";

import sharp from "sharp";
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

export type CharacterInfo = {
  frontImageUrl: string;
  sideImageUrl: string | null;
  backImageUrl: string | null;
};

type GetCharacterResult =
  | { success: true; character: CharacterInfo | null }
  | { success: false; error: string };

type SaveCharacterResult =
  | { success: true; character: CharacterInfo }
  | { success: false; error: string };

type StartImageToVideoJobResult =
  | { success: true; jobId: string }
  | { success: false; error: string };

type CheckImageToVideoStatusResult =
  | { success: true; status: "pending" | "done" | "error"; videoUrl?: string; error?: string }
  | { success: false; error: string };

export async function generateScript(
  keyword: string,
  durationSeconds: number,
  benchmarkAnalysis?: string
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
      body: JSON.stringify({
        keyword,
        duration: durationSeconds,
        benchmarkAnalysis,
      }),
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
  sceneDirection?: string,
  characterImageUrl?: string
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
      body: JSON.stringify({ prompt, sceneDirection, characterImageUrl }),
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
 * 로그인한 사용자가 등록해둔 캐릭터(앞/옆/뒤 참조 이미지)를 조회한다.
 * 아직 등록 안 했으면 character: null을 반환한다(에러 아님).
 */
export async function getCharacter(): Promise<GetCharacterResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("characters")
    .select("front_image_url, side_image_url, back_image_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { success: false, error: "캐릭터 정보를 불러오지 못했어요." };
  }

  if (!data) {
    return { success: true, character: null };
  }

  return {
    success: true,
    character: {
      frontImageUrl: data.front_image_url,
      sideImageUrl: data.side_image_url,
      backImageUrl: data.back_image_url,
    },
  };
}

/**
 * 캐릭터 이미지(앞/옆/뒤)를 업로드하고 사용자당 1개인 characters 행에
 * upsert한다. 옆/뒤는 선택이라 새로 안 올리면 기존 값을 그대로 유지한다
 * (앞모습만 새로 올려서 "교체"하는 경우를 지원하기 위함).
 */
export async function uploadCharacter(
  formData: FormData
): Promise<SaveCharacterResult> {
  const front = formData.get("front");
  const side = formData.get("side");
  const back = formData.get("back");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data: existing } = await supabase
    .from("characters")
    .select("front_image_url, side_image_url, back_image_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const uploadOne = async (file: File, label: string) => {
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${label}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("character-uploads")
      .upload(path, file);

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("character-uploads").getPublicUrl(path);

    return publicUrl;
  };

  try {
    const frontImageUrl =
      front instanceof File && front.size > 0
        ? await uploadOne(front, "front")
        : existing?.front_image_url;

    if (!frontImageUrl) {
      return { success: false, error: "정면 이미지는 필수예요." };
    }

    const sideImageUrl =
      side instanceof File && side.size > 0
        ? await uploadOne(side, "side")
        : existing?.side_image_url ?? null;

    const backImageUrl =
      back instanceof File && back.size > 0
        ? await uploadOne(back, "back")
        : existing?.back_image_url ?? null;

    const { error: upsertError } = await supabase.from("characters").upsert(
      {
        user_id: user.id,
        front_image_url: frontImageUrl,
        side_image_url: sideImageUrl,
        back_image_url: backImageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return { success: false, error: "캐릭터 저장에 실패했어요." };
    }

    return {
      success: true,
      character: { frontImageUrl, sideImageUrl, backImageUrl },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "이미지 업로드에 실패했어요.",
    };
  }
}

/**
 * 앞/옆/뒤가 한 장에 나란히 배치된 캐릭터 레퍼런스 시트 하나를 업로드하면
 * n8n "Business Gym - Detect Character Panels" 워크플로우(Gemini Vision)가
 * 뷰 개수(1~3)를 인식하고, 그 개수만큼 동일 너비로 잘라 각각 앞/옆/뒤로
 * 저장한다. 인식에 실패하면 1장짜리 이미지로 간주하고 그대로 진행한다.
 */
export async function uploadCharacterSheet(
  formData: FormData
): Promise<SaveCharacterResult> {
  const sheet = formData.get("sheet");

  if (!(sheet instanceof File) || sheet.size === 0) {
    return { success: false, error: "캐릭터 시트 이미지를 선택해주세요." };
  }

  const webhookUrl = process.env.N8N_DETECT_CHARACTER_PANELS_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const buffer = Buffer.from(await sheet.arrayBuffer());

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return {
      success: false,
      error: "이미지를 읽지 못했어요. 다른 파일로 시도해주세요.",
    };
  }

  // 1. 원본 시트를 임시 업로드해서 n8n(Gemini Vision)이 URL로 볼 수 있게 함
  const ext = sheet.name.split(".").pop() || "png";
  const tempPath = `${user.id}/sheet-${Date.now()}.${ext}`;
  const { error: tempUploadError } = await supabase.storage
    .from("character-uploads")
    .upload(tempPath, buffer, { contentType: sheet.type || undefined });

  if (tempUploadError) {
    return { success: false, error: tempUploadError.message };
  }

  const {
    data: { publicUrl: tempUrl },
  } = supabase.storage.from("character-uploads").getPublicUrl(tempPath);

  // 2. 뷰 개수 인식 (실패하면 1장으로 간주)
  let panelCount = 1;
  if (webhookUrl && secret) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": secret,
        },
        body: JSON.stringify({ imageUrl: tempUrl }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        if (
          typeof data.panelCount === "number" &&
          data.panelCount >= 1 &&
          data.panelCount <= 3
        ) {
          panelCount = data.panelCount;
        }
      }
    } catch {
      // 인식 서비스 연결 실패 — 1장짜리 이미지로 간주하고 계속 진행
    }
  }

  // 3. panelCount 등분으로 잘라서 각각 업로드
  const panelWidth = Math.floor(width / panelCount);
  const labels = ["front", "side", "back"] as const;

  const uploadPanel = async (left: number, panelW: number, label: string) => {
    const cropped = await sharp(buffer)
      .extract({ left, top: 0, width: panelW, height })
      .jpeg({ quality: 90 })
      .toBuffer();

    const path = `${user.id}/${label}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("character-uploads")
      .upload(path, cropped, { contentType: "image/jpeg" });

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("character-uploads").getPublicUrl(path);

    return publicUrl;
  };

  try {
    const urls: (string | null)[] = [null, null, null];
    for (let i = 0; i < panelCount; i++) {
      const left = i * panelWidth;
      const w = i === panelCount - 1 ? width - left : panelWidth;
      urls[i] = await uploadPanel(left, w, labels[i]);
    }

    const frontImageUrl = urls[0];
    if (!frontImageUrl) {
      return { success: false, error: "정면 이미지를 추출하지 못했어요." };
    }

    const { error: upsertError } = await supabase.from("characters").upsert(
      {
        user_id: user.id,
        front_image_url: frontImageUrl,
        side_image_url: urls[1],
        back_image_url: urls[2],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return { success: false, error: "캐릭터 저장에 실패했어요." };
    }

    return {
      success: true,
      character: {
        frontImageUrl,
        sideImageUrl: urls[1],
        backImageUrl: urls[2],
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "이미지 처리에 실패했어요.",
    };
  } finally {
    await supabase.storage.from("character-uploads").remove([tempPath]);
  }
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

/**
 * 이미지 1장 + 모션 프롬프트로 짧은 영상 클립을 만든다. n8n
 * "Business Gym - Image To Video" 워크플로우는 image_to_video_jobs에
 * pending 행을 만들고 jobId를 즉시 응답한 뒤, 백그라운드에서 Fal.ai
 * LTX-Video(image-to-video)를 호출해 완료 시 해당 행을 done/error로
 * 업데이트한다 — startRenderJob과 동일한 비동기/폴링 패턴.
 */
export async function startImageToVideoJob(
  imageUrl: string,
  prompt: string,
  durationSeconds: number
): Promise<StartImageToVideoJobResult> {
  const webhookUrl = process.env.N8N_IMAGE_TO_VIDEO_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "이미지→영상 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  if (!imageUrl) {
    return { success: false, error: "이미지가 필요해요." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ imageUrl, prompt, duration: durationSeconds }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `영상 생성 시작에 실패했어요. (status ${res.status})`,
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
        "이미지→영상 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

/**
 * image_to_video_jobs 행을 직접 조회한다. checkRenderStatus와 동일하게
 * 익명 키 + public-read RLS로 폴링한다.
 */
export async function checkImageToVideoStatus(
  jobId: string
): Promise<CheckImageToVideoStatusResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("image_to_video_jobs")
    .select("status, video_url, error_message")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    return { success: false, error: "영상 생성 작업을 찾을 수 없어요." };
  }

  return {
    success: true,
    status: data.status as "pending" | "done" | "error",
    videoUrl: data.video_url ?? undefined,
    error: data.error_message ?? undefined,
  };
}
