"use server";

import { createClient } from "@/lib/supabase/server";

export type TrendResult = {
  id: string;
  keyword: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  videoUrl: string;
  publishedAt: string | null;
};

type GetTrendResultsResult =
  | { success: true; results: TrendResult[]; snapshotDate: string | null }
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
      "id, keyword, title, channel_title, thumbnail_url, view_count, video_url, published_at"
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
      channelTitle: row.channel_title,
      thumbnailUrl: row.thumbnail_url,
      viewCount: row.view_count,
      videoUrl: row.video_url,
      publishedAt: row.published_at,
    })),
  };
}
