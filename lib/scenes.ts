export type Scene = {
  id: number;
  label: string;
  text: string;
};

const SCENE_LABELS = ["3초 훅", "훅", "전개", "공감", "CTA"];

/**
 * Step1에서 생성된 대본([3초 훅]/[전개]/[공감]/[CTA] 마커 구조)을
 * 씬 단위로 쪼갠다. 마커를 못 찾으면 문단 단위로 대체 분할한다.
 *
 * Gemini 출력 형식이 "**[3초 훅]**" 또는 "**[3초 훅] (0~3초)**"처럼
 * 대괄호 뒤에 부가 설명이 붙는 두 가지 모두 매칭하도록 [^*]* 로 처리.
 */
export function parseScenes(script: string): Scene[] {
  const markerRegex = /\*\*\[(.*?)\][^*]*\*\*/g;
  const matches = [...script.matchAll(markerRegex)];
  const scenes: Scene[] = [];

  matches.forEach((match, i) => {
    const label = match[1].trim();
    if (!SCENE_LABELS.some((l) => label.includes(l))) return;

    const start = match.index! + match[0].length;
    const nextMarkerIndex =
      i + 1 < matches.length ? matches[i + 1].index! : undefined;
    const separatorIndex = script.indexOf("\n---", start);
    const end = [nextMarkerIndex, separatorIndex]
      .filter((n) => n !== undefined && n !== -1)
      .sort((a, b) => (a as number) - (b as number))[0] as number | undefined;

    const rawText = script.slice(start, end);

    // "화면:"(연출 지시)과 "내레이션:"(실제 대사)이 나뉜 형식이면,
    // 자막·이미지 프롬프트로는 실제 대사(따옴표 안 내용)만 뽑아 쓴다.
    const narrationMatch = rawText.match(/내레이션[:：]?\s*\*{0,2}\s*"([^"]+)"/);

    const cleanText = narrationMatch
      ? narrationMatch[1].trim()
      : rawText
          .replace(/#{1,6}\s*/g, "")
          .replace(/\*\(.*?\)\*/g, "")
          .replace(/^\(.*?\)\s*/gm, "")
          .replace(/^[>*\s-]+/gm, "")
          .replace(/\*\*/g, "")
          .replace(/\n{2,}/g, "\n")
          .trim();

    if (cleanText) {
      scenes.push({ id: scenes.length + 1, label, text: cleanText });
    }
  });

  if (scenes.length > 0) return scenes;

  return script
    .split(/\n{2,}/)
    .map((p) => p.replace(/\*\*/g, "").trim())
    .filter((p) => p.length > 5)
    .slice(0, 4)
    .map((text, i) => ({ id: i + 1, label: `씬 ${i + 1}`, text }));
}
