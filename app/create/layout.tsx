// Step 3는 비동기/폴링 구조(startRenderJob + checkRenderStatus)라 이
// 라우트의 Server Action은 더 이상 n8n의 전체 렌더링(몇 분)을 기다리지
// 않는다 — jobId를 즉시 받아오거나 Supabase 행을 조회할 뿐이라 기본값이면
// 충분하지만, Step 2의 generateSceneImage(fal.ai 동기 호출)는 다르다 —
// 30초 제한 때문에 fal.ai가 30초 넘게 걸리면(관찰상 80초~5분까지 걸림)
// 실제로는 이미지가 만들어지는데도 함수가 먼저 죽어서 "연결할 수 없어요"
// 에러로 보였다(2026-08-30 확인). 여유를 넉넉히 둔다.
export const maxDuration = 180;

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
