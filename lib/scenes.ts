export type Scene = {
  id: number;
  label: string;
  text: string;
};

const SCENE_LABELS = ["3초 훅", "훅", "전개", "공감", "CTA"];

/**
 * Step1에서 생성된 대본([3초 훅]/[전개]/[공감]/[CTA] 마커 구조)을
 * 씬 단위로 쪼갠다. 마커를 못 찾으면 문단 단위로 대체 분할한다.
 */
export function parseScenes(script: string): Scene[] {
  const markerRegex = /\*\*\[(.*?)\]\*\*/g;
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
    const cleanText = rawText
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
