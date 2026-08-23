import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// 파트 2~4: 대시보드, 트렌드 분석, AI 컨텐츠 생성 마법사, 발행은
// 로그인 + 결제 심사 승인(approval_status === "approved")이 끝난 회원만 접근 가능
const PROTECTED_PATHS = ["/dashboard", "/trending", "/create", "/publish", "/images"];

export async function middleware(request: NextRequest) {
  const { response, user, approvalStatus } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (approvalStatus !== "approved") {
    const url = request.nextUrl.clone();
    url.pathname = "/pending";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trending/:path*",
    "/create/:path*",
    "/publish/:path*",
    "/images/:path*",
  ],
};
