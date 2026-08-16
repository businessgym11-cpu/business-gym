// Step 3 최종 렌더링(renderFinalVideo)이 n8n에서 Kling 영상 생성 + TTS +
// Creatomate 조립을 전부 끝낸 뒤 응답하는 원패스 구조라 몇 분씩 걸릴 수
// 있어서, 이 라우트에서 호출되는 Server Action들의 Vercel 함수 제한
// 시간을 넉넉히 늘려둔다. Vercel 플랜(Hobby/Pro)에 따라 실제로 허용되는
// 최대값이 다를 수 있으니, 렌더링이 이 시간 안에 끝나지 않으면 플랜
// 업그레이드나 n8n 쪽 비동기/폴링 구조 재설계를 검토할 것.
export const maxDuration = 600;

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
