"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { approveSignupRequest, rejectSignupRequest } from "./actions";

type SignupRequest = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  username: string;
  created_at: string;
};

export default function AdminList({
  requests,
}: {
  requests: SignupRequest[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleApprove = (id: string) => {
    setActiveId(id);
    setErrorMessage("");
    startTransition(async () => {
      const result = await approveSignupRequest(id);
      if (!result.success) setErrorMessage(result.error);
    });
  };

  const handleReject = (id: string) => {
    setActiveId(id);
    setErrorMessage("");
    startTransition(async () => {
      const result = await rejectSignupRequest(id);
      if (!result.success) setErrorMessage(result.error);
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">
        대기 중인 가입 신청이 없어요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-bold text-slate-900">{req.full_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {req.email} · {req.phone} · @{req.username}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(req.created_at).toLocaleString("ko-KR")} 신청
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleReject(req.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && activeId === req.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              거절
            </button>
            <button
              type="button"
              onClick={() => handleApprove(req.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && activeId === req.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              확인
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
