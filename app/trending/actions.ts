"use server";

import { createClient } from "@/lib/supabase/server";

export type TrendResult = {
  id: string;
  keyword: string;
  title: string;
  description: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  videoUrl: string;
  publishedAt: string | null;
};

type GetTrendResultsResult =
  | { success: true; results: TrendResult[]; snapshotDate: string | null }
  | { success: false; error: string };

type AnalyzeBenchmarkResult =
  | { success: true; analysis: string }
  | { success: false; error: string };

type SearchTrendLiveResult =
  | { success: true; results: TrendResult[] }
  | { success: false; error: string };

export type SurgeVideo = {
  id: string;
  keyword: string | null;
  title: string;
  description: string | null;
  channelTitle: string | null;
  subscriberCount: number | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  videoUrl: string;
  publishedAt: string | null;
  rank: number | null;
};

type GetSurgeVideosResult =
  | { success: true; results: SurgeVideo[]; snapshotDate: string | null }
  | { success: false; error: string };

/**
 * n8n이 매일 아침 채워 넣는 trend_snapshots에서 가장 최근 스냅샷 날짜의
 * 행만 읽는다(하루치 데이터만 보여줌 — 여러 날짜가 섞이면 순위가 무의미해짐).
 */
export async function getTrendResults(
  query?: string
): Promise<GetTrendResultsResult> {
  const supabase = await createClient();

  const { data: latest, error: latestError } = await supabase
    .from("trend_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return { success: false, error: "트렌드 데이터를 불러오지 못했어요." };
  }

  if (!latest) {
    return { success: true, results: [], snapshotDate: null };
  }

  let queryBuilder = supabase
    .from("trend_snapshots")
    .select(
      "id, keyword, title, description, channel_title, thumbnail_url, view_count, video_url, published_at"
    )
    .eq("snapshot_date", latest.snapshot_date)
    .order("view_count", { ascending: false });

  const trimmed = query?.trim();
  if (trimmed) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${trimmed}%,keyword.ilike.%${trimmed}%`
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return { success: false, error: "트렌드 데이터를 불러오지 못했어요." };
  }

  return {
    success: true,
    snapshotDate: latest.snapshot_date,
    results: (data ?? []).map((row) => ({
      id: row.id,
      keyword: row.keyword,
      title: row.title,
      description: row.description,
      channelTitle: row.channel_title,
      thumbnailUrl: row.thumbnail_url,
      viewCount: row.view_count,
      videoUrl: row.video_url,
      publishedAt: row.published_at,
    })),
  };
}

/**
 * 트렌드 영상 하나를 Gemini로 분석해서 후킹 포인트/구조/바이럴 요인/벤치마킹
 * 포인트를 받아온다. n8n "Business Gym - Trend Benchmark Analysis" 워크플로우
 * (제목+설명+썸네일 이미지를 Gemini에 넘겨 분석)를 호출.
 */
export async function analyzeBenchmark(video: {
  title: string;
  description: string | null;
  channelTitle: string | null;
  viewCount: number | null;
  thumbnailUrl: string | null;
}): Promise<AnalyzeBenchmarkResult> {
  const webhookUrl = process.env.N8N_BENCHMARK_ANALYSIS_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error:
        "벤치마킹 분석 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({
        title: video.title,
        description: video.description,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount,
        thumbnailUrl: video.thumbnailUrl,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `벤치마킹 분석에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const analysis = typeof data.analysis === "string" ? data.analysis : "";

    if (!analysis) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return { success: true, analysis };
  } catch {
    return {
      success: false,
      error:
        "벤치마킹 분석 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

/**
 * 큐레이션된 배치 데이터(trend_snapshots)와 무관하게, 임의의 키워드로
 * 유튜브를 실시간 검색한다. n8n "Business Gym - Trend Live Search"
 * 워크플로우(YouTube Data API 직접 호출)를 호출.
 */
export async function searchTrendLive(
  keyword: string
): Promise<SearchTrendLiveResult> {
  const webhookUrl = process.env.N8N_TREND_LIVE_SEARCH_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error: "실시간 검색 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ keyword }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `실시간 검색에 실패했어요. (status ${res.status})`,
      };
    }

    const data = await res.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const results: TrendResult[] = rawResults.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      keyword: String(row.keyword ?? keyword),
      title: String(row.title ?? ""),
      description: (row.description as string | null) ?? null,
      channelTitle: (row.channelTitle as string | null) ?? null,
      thumbnailUrl: (row.thumbnailUrl as string | null) ?? null,
      viewCount: (row.viewCount as number | null) ?? null,
      videoUrl: String(row.videoUrl ?? ""),
      publishedAt: (row.publishedAt as string | null) ?? null,
    }));

    return { success: true, results };
  } catch {
    return {
      success: false,
      error:
        "실시간 검색 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

/**
 * 장르 무관 급상승 쇼츠 top10을 읽는다. n8n "Business Gym - Surge Videos
 * Collector" 워크플로우가 매일 아침 surge_videos에 채워 넣은 결과를
 * Supabase에서 바로 읽기만 한다(별도 웹훅 호출 불필요 — trend_snapshots와
 * 동일한 패턴).
 */
export async function getSurgeVideos(): Promise<GetSurgeVideosResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("surge_videos")
    .select(
      "id, keyword, title, description, channel_title, subscriber_count, thumbnail_url, view_count, video_url, published_at, rank, snapshot_date"
    )
    .order("rank", { ascending: true });

  if (error) {
    return { success: false, error: "급상승 영상 데이터를 불러오지 못했어요." };
  }

  return {
    success: true,
    snapshotDate: data && data.length > 0 ? data[0].snapshot_date : null,
    results: (data ?? []).map((row) => ({
      id: row.id,
      keyword: row.keyword,
      title: row.title,
      description: row.description,
      channelTitle: row.channel_title,
      subscriberCount: row.subscriber_count,
      thumbnailUrl: row.thumbnail_url,
      viewCount: row.view_count,
      videoUrl: row.video_url,
      publishedAt: row.published_at,
      rank: row.rank,
    })),
  };
}
