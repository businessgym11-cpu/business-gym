export type RenderScene = {
  imageUrl: string;
};

const DEFAULT_TOTAL_DURATION_SECONDS = 20;

/**
 * 씬 이미지를 Creatomate RenderScript(JSON)로 조립한다.
 * TTS 음성이 없는 상태라 자막(Text) 오버레이는 당분간 뺐다 — 통편집 없이
 * 대본 전체가 화면에 그대로 덮이면 결과물이 지저분해서, 지금은 이미지
 * 슬라이드의 연속으로만 렌더링한다.
 *
 * 씬마다 명시적으로 time(시작 시각)을 지정한다 — 안 넣으면 씬들이
 * 전부 0초에서 겹쳐서 렌더링되어 마지막 씬만 화면에 보이는 버그가 있었다.
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
        elements: scenes.map((scene, i) => ({
          type: "composition",
          time: i * perSceneDuration,
          duration: perSceneDuration,
          elements: [
            {
              type: "image",
              track: 1,
              source: scene.imageUrl,
              fit: "cover",
            },
          ],
        })),
      },
    ],
  };
}
