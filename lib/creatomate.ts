export type SubtitleStyle = "basic" | "neon" | "handwriting";

const SUBTITLE_PRESETS: Record<
  SubtitleStyle,
  { font_family: string; fill_color: string; background_color: string }
> = {
  basic: {
    font_family: "Noto Sans KR",
    fill_color: "#ffffff",
    background_color: "rgba(0,0,0,0.55)",
  },
  neon: {
    font_family: "Noto Sans KR",
    fill_color: "#39ff88",
    background_color: "rgba(10,0,20,0.6)",
  },
  handwriting: {
    font_family: "Gaegu",
    fill_color: "#ffe066",
    background_color: "rgba(0,0,0,0.45)",
  },
};

export type RenderScene = {
  imageUrl: string;
  caption: string;
};

const SCENE_DURATION_SECONDS = 4;

/**
 * 씬 이미지 + 자막을 Creatomate RenderScript(JSON)로 조립한다.
 * 배경음악은 아직 실제 음원 소스가 없어서 붙이지 않는다.
 */
export function buildRenderScript(
  scenes: RenderScene[],
  subtitleStyle: SubtitleStyle
) {
  const preset = SUBTITLE_PRESETS[subtitleStyle];

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    elements: [
      {
        type: "composition",
        track: 1,
        elements: scenes.map((scene) => ({
          type: "composition",
          duration: SCENE_DURATION_SECONDS,
          elements: [
            {
              type: "image",
              track: 1,
              source: scene.imageUrl,
              fit: "cover",
            },
            {
              type: "text",
              track: 2,
              text: scene.caption,
              y: "82%",
              width: "90%",
              x_alignment: "50%",
              y_alignment: "50%",
              fill_color: preset.fill_color,
              font_family: preset.font_family,
              font_weight: "800",
              font_size: "6.5 vmin",
              background_color: preset.background_color,
              background_x_padding: "8%",
              background_y_padding: "4%",
            },
          ],
        })),
      },
    ],
  };
}
