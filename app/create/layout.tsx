// Step 2.5 비디오 변환/Step 3 최종 렌더링 액션이 몇 분씩 걸릴 수 있어서,
// 이 라우트에서 호출되는 Server Action들의 Vercel 함수 제한 시간을 늘려둔다.
export const maxDuration = 300;

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
