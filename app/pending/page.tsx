import Link from "next/link";
import { Clock3 } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-md shadow-purple-500/30">
          <Clock3 className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-xl font-extrabold text-slate-900">
          결제 심사 진행 중입니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          결제 확인 및 파트너 승인이 완료되면 대시보드를 이용하실 수 있어요.
          영업일 기준 1~2일 이내에 안내드릴게요.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-200"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
