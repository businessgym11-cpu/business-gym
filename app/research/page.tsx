"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, Search as SearchIcon, Users, FolderOpen } from "lucide-react";
import ChannelTab from "./ChannelTab";
import VideoSearchTab from "./VideoSearchTab";
import ChannelSearchTab from "./ChannelSearchTab";

type Tab = "channel" | "videoSearch" | "channelSearch";

const TABS: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: "channel", label: "채널 분석", icon: Film },
  { id: "videoSearch", label: "영상 찾기", icon: SearchIcon },
  { id: "channelSearch", label: "채널 찾기", icon: Users },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<Tab>("channel");
  const [autoRegisterInput, setAutoRegisterInput] = useState<{
    value: string;
    nonce: number;
  } | null>(null);

  const handleRegisterFromSearch = (channelUrl: string) => {
    setAutoRegisterInput({ value: channelUrl, nonce: Date.now() });
    setActiveTab("channel");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            채널 리서치
          </h1>
          <p className="mt-2 text-slate-500">
            채널을 등록해 영상 성과를 추적하거나, 키워드로 영상·채널을 찾아
            어떤 콘텐츠가 왜 잘 됐는지 살펴보세요.
          </p>
        </div>
        <Link
          href="/research/saved"
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          <FolderOpen className="h-4 w-4" />
          수집한 영상
        </Link>
      </div>

      <div className="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition-colors duration-200 ${
              activeTab === tab.id
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "channel" && (
          <ChannelTab autoRegisterInput={autoRegisterInput} />
        )}
        {activeTab === "videoSearch" && <VideoSearchTab />}
        {activeTab === "channelSearch" && (
          <ChannelSearchTab onRegister={handleRegisterFromSearch} />
        )}
      </div>
    </div>
  );
}
