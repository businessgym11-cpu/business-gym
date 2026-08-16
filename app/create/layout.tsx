// Step 3는 비동기/폴링 구조(startRenderJob + checkRenderStatus)라 이
// 라우트의 Server Action은 더 이상 n8n의 전체 렌더링(몇 분)을 기다리지
// 않는다 — jobId를 즉시 받아오거나 Supabase 행을 조회할 뿐이라 기본값이면
// 충분하지만, n8n 웹훅 응답이 느려질 가능성을 감안해 약간 여유를 둔다.
export const maxDuration = 30;

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
