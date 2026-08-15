export type RenderScene = {
  imageUrl: string;
};

const DEFAULT_TOTAL_DURATION_SECONDS = 20;

/**
 * 씬 소스 URL이 .mp4로 끝나면 video, 아니면 image 엘리먼트로 렌더링한다.
 * fal.ai Image-to-Video 파이프라인이 붙으면 imageUrl 자리에 mp4 URL이
 * 그대로 들어올 수 있어서, 확장자만 보고 타입을 자동으로 분기한다.
 */
function resolveElementType(url: string): "video" | "image" {
  return url.toLowerCase().endsWith(".mp4") ? "video" : "image";
}

/**
 * 씬 이미지(또는 향후 영상)를 Creatomate RenderScript(JSON)로 조립한다.
 * TTS 음성이 없는 상태라 자막(Text) 오버레이는 당분간 뺐다 — 통편집 없이
 * 대본 전체가 화면에 그대로 덮이면 결과물이 지저분해서, 지금은 씬
 * 슬라이드의 연속으로만 렌더링한다.
 *
 * 씬마다 명시적으로 time(시작 시각)을 지정한다 — 안 넣으면 씬들이
 * 전부 0초에서 겹쳐서 렌더링되어 마지막 씬만 화면에 보이는 버그가 있었다.
 *
 * 루트/컴포지션/엘리먼트 전 구간에 width/height: "100%"를 명시해야
 * fit: "cover"가 실제로 프레임을 꽉 채운다 — 크기를 안 주면 엘리먼트가
 * 원본 비율대로 작게 배치되어 검은 레터박스가 생기는 문제가 있었다.
 */
export function buildRenderScript(
  scenes: RenderScene[],
  totalDurationSeconds: number = DEFAULT_TOTAL_DURATION_SECONDS
) {
  const perSceneDuration = totalDurationSeconds / scenes.length;

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    elements: [
      {
        type: "composition",
        track: 1,
        width: "100%",
        height: "100%",
        elements: scenes.map((scene, i) => ({
          type: "composition",
          time: i * perSceneDuration,
          duration: perSceneDuration,
          width: "100%",
          height: "100%",
          elements: [
            {
              type: resolveElementType(scene.imageUrl),
              track: 1,
              source: scene.imageUrl,
              width: "100%",
              height: "100%",
              fit: "cover",
            },
          ],
        })),
      },
    ],
  };
}
