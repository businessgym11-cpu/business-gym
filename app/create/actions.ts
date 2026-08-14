"use server";

type GenerateScriptResult =
  | { success: true; script: string }
  | { success: false; error: string };

export async function generateScript(
  keyword: string
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
      body: JSON.stringify({ keyword }),
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
