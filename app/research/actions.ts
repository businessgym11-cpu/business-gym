"use server";

import { createClient } from "@/lib/supabase/server";

export type ResearchedChannel = {
  id: string;
  youtubeChannelId: string;
  title: string;
  handle: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  totalVideoCount: number | null;
  channelCreatedAt: string | null;
  cumulativeViews: number | null;
  avgLikes: number | null;
  avgViews: number | null;
  lastRefreshedAt: string | null;
};

export type ResearchedVideo = {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  isShorts: boolean;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  contributionTier: string | null;
  performanceTier: string | null;
};

type RegisterChannelResult =
  | { success: true; channel: ResearchedChannel; videos: ResearchedVideo[] }
  | { success: false; error: string };

type ListChannelsResult =
  | { success: true; channels: ResearchedChannel[] }
  | { success: false; error: string };

type GetVideosResult =
  | { success: true; videos: ResearchedVideo[] }
  | { success: false; error: string };

function mapChannelRow(row: {
  id: string;
  youtube_channel_id: string;
  title: string;
  handle: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  total_video_count: number | null;
  channel_created_at: string | null;
  cumulative_views: number | null;
  avg_likes: number | null;
  avg_views: number | null;
  last_refreshed_at: string | null;
}): ResearchedChannel {
  return {
    id: row.id,
    youtubeChannelId: row.youtube_channel_id,
    title: row.title,
    handle: row.handle,
    thumbnailUrl: row.thumbnail_url,
    subscriberCount: row.subscriber_count,
    totalVideoCount: row.total_video_count,
    channelCreatedAt: row.channel_created_at,
    cumulativeViews: row.cumulative_views,
    avgLikes: row.avg_likes,
    avgViews: row.avg_views,
    lastRefreshedAt: row.last_refreshed_at,
  };
}

function mapVideoRow(row: {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_shorts: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  contribution_tier: string | null;
  performance_tier: string | null;
}): ResearchedVideo {
  return {
    id: row.id,
    youtubeVideoId: row.youtube_video_id,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    isShorts: row.is_shorts,
    viewCount: row.view_count,
    likeCount: row.like_count,
    publishedAt: row.published_at,
    contributionTier: row.contribution_tier,
    performanceTier: row.performance_tier,
  };
}

/**
 * 채널을 등록(또는 이미 등록된 채널이면 최신화)하고, 완료되면 최신
 * 채널 요약 + 영상 목록을 바로 읽어서 반환한다. n8n이 유튜브 데이터를
 * 긁어 Supabase에 쓰고 나면, 그 결과를 이 액션이 곧바로 다시 조회하는
 * 구조라 프론트는 한 번의 호출로 완성된 데이터를 받는다.
 */
export async function registerAndFetchChannel(
  channelInput: string
): Promise<RegisterChannelResult> {
  const webhookUrl = process.env.N8N_CHANNEL_RESEARCH_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error: "채널 리서치 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  let webhookResult: { channelRowId?: string; error?: string };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ channelInput, userId: user.id }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `채널 정보를 가져오지 못했어요. (status ${res.status})`,
      };
    }

    webhookResult = await res.json();
  } catch {
    return {
      success: false,
      error: "채널 리서치 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }

  if (webhookResult.error || !webhookResult.channelRowId) {
    return {
      success: false,
      error: webhookResult.error ?? "채널을 찾지 못했어요. URL이나 핸들을 다시 확인해주세요.",
    };
  }

  const { data: channelRow, error: channelError } = await supabase
    .from("researched_channels")
    .select(
      "id, youtube_channel_id, title, handle, thumbnail_url, subscriber_count, total_video_count, channel_created_at, cumulative_views, avg_likes, avg_views, last_refreshed_at"
    )
    .eq("id", webhookResult.channelRowId)
    .single();

  if (channelError || !channelRow) {
    return { success: false, error: "채널 정보를 불러오지 못했어요." };
  }

  const { data: videoRows, error: videosError } = await supabase
    .from("researched_channel_videos")
    .select(
      "id, youtube_video_id, title, description, thumbnail_url, duration_seconds, is_shorts, view_count, like_count, published_at, contribution_tier, performance_tier"
    )
    .eq("channel_row_id", channelRow.id)
    .order("view_count", { ascending: false });

  if (videosError) {
    return { success: false, error: "영상 목록을 불러오지 못했어요." };
  }

  return {
    success: true,
    channel: mapChannelRow(channelRow),
    videos: (videoRows ?? []).map(mapVideoRow),
  };
}

export async function listResearchedChannels(): Promise<ListChannelsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("researched_channels")
    .select(
      "id, youtube_channel_id, title, handle, thumbnail_url, subscriber_count, total_video_count, channel_created_at, cumulative_views, avg_likes, avg_views, last_refreshed_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "등록된 채널을 불러오지 못했어요." };
  }

  return { success: true, channels: (data ?? []).map(mapChannelRow) };
}

export async function getChannelVideos(
  channelRowId: string
): Promise<GetVideosResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("researched_channel_videos")
    .select(
      "id, youtube_video_id, title, description, thumbnail_url, duration_seconds, is_shorts, view_count, like_count, published_at, contribution_tier, performance_tier"
    )
    .eq("channel_row_id", channelRowId)
    .order("view_count", { ascending: false });

  if (error) {
    return { success: false, error: "영상 목록을 불러오지 못했어요." };
  }

  return { success: true, videos: (data ?? []).map(mapVideoRow) };
}

export type ResearchFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export type SavedVideo = {
  id: string;
  folderId: string | null;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  viewCount: number | null;
  publishedAt: string | null;
  contributionTier: string | null;
  performanceTier: string | null;
};

type ListFoldersResult =
  | { success: true; folders: ResearchFolder[] }
  | { success: false; error: string };

type CreateFolderResult =
  | { success: true; folder: ResearchFolder }
  | { success: false; error: string };

type ListSavedVideosResult =
  | { success: true; videos: SavedVideo[] }
  | { success: false; error: string };

type SimpleResult = { success: true } | { success: false; error: string };

function mapFolderRow(row: { id: string; name: string; created_at: string }): ResearchFolder {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function mapSavedVideoRow(row: {
  id: string;
  folder_id: string | null;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  view_count: number | null;
  published_at: string | null;
  contribution_tier: string | null;
  performance_tier: string | null;
}): SavedVideo {
  return {
    id: row.id,
    folderId: row.folder_id,
    youtubeVideoId: row.youtube_video_id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    channelTitle: row.channel_title,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    contributionTier: row.contribution_tier,
    performanceTier: row.performance_tier,
  };
}

export async function listFolders(): Promise<ListFoldersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("research_folders")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: "폴더 목록을 불러오지 못했어요." };
  }

  return { success: true, folders: (data ?? []).map(mapFolderRow) };
}

export async function createFolder(name: string): Promise<CreateFolderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  if (!name.trim()) {
    return { success: false, error: "폴더 이름을 입력해주세요." };
  }

  const { data, error } = await supabase
    .from("research_folders")
    .insert({ user_id: user.id, name: name.trim() })
    .select("id, name, created_at")
    .single();

  if (error || !data) {
    return { success: false, error: "폴더를 만들지 못했어요." };
  }

  return { success: true, folder: mapFolderRow(data) };
}

export async function deleteFolder(folderId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("research_folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "폴더를 삭제하지 못했어요." };
  }

  return { success: true };
}

/**
 * 영상을 저장한다. 이미 저장된 영상이면(같은 youtube_video_id) 폴더만
 * 갱신한다 — 다른 폴더로 다시 저장하면 이동한 것처럼 동작하게 하기 위함.
 */
export async function saveVideo(
  video: {
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string | null;
    channelTitle: string | null;
    viewCount: number | null;
    publishedAt: string | null;
    contributionTier: string | null;
    performanceTier: string | null;
  },
  folderId: string | null
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase.from("saved_videos").upsert(
    {
      user_id: user.id,
      folder_id: folderId,
      youtube_video_id: video.youtubeVideoId,
      title: video.title,
      thumbnail_url: video.thumbnailUrl,
      channel_title: video.channelTitle,
      view_count: video.viewCount,
      published_at: video.publishedAt,
      contribution_tier: video.contributionTier,
      performance_tier: video.performanceTier,
    },
    { onConflict: "user_id,youtube_video_id" }
  );

  if (error) {
    return { success: false, error: "영상을 저장하지 못했어요." };
  }

  return { success: true };
}

export async function unsaveVideo(youtubeVideoId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("saved_videos")
    .delete()
    .eq("user_id", user.id)
    .eq("youtube_video_id", youtubeVideoId);

  if (error) {
    return { success: false, error: "저장을 취소하지 못했어요." };
  }

  return { success: true };
}

export async function moveVideoToFolder(
  youtubeVideoId: string,
  folderId: string | null
): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("saved_videos")
    .update({ folder_id: folderId })
    .eq("user_id", user.id)
    .eq("youtube_video_id", youtubeVideoId);

  if (error) {
    return { success: false, error: "폴더를 옮기지 못했어요." };
  }

  return { success: true };
}

export async function listSavedVideos(): Promise<ListSavedVideosResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("saved_videos")
    .select(
      "id, folder_id, youtube_video_id, title, thumbnail_url, channel_title, view_count, published_at, contribution_tier, performance_tier"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "저장한 영상을 불러오지 못했어요." };
  }

  return { success: true, videos: (data ?? []).map(mapSavedVideoRow) };
}

export type SearchedVideo = {
  id: string;
  title: string;
  description: string | null;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  videoUrl: string;
  durationSeconds: number;
  isShorts: boolean;
  isCC: boolean;
  subscriberCount: number | null;
  contributionTier: string;
  performanceTier: string | null;
};

export type SearchedChannel = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  handle: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  createdAt: string | null;
  daysSinceCreated: number;
  channelUrl: string;
  viewToSubTier: string;
  dailySubTier: string;
};

type SearchVideosResult =
  | { success: true; results: SearchedVideo[] }
  | { success: false; error: string };

type SearchChannelsResult =
  | { success: true; results: SearchedChannel[] }
  | { success: false; error: string };

/**
 * 키워드로 유튜브 전체를 검색해 영상별 조회수/좋아요/구독자수와 주목도·
 * 효율도(구 기여도/성과도) 근사 등급을 받아온다. n8n "Business Gym - Video Search" 워크플로우
 * (search.list + videos.list + channels.list 조합) 호출.
 */
export async function searchVideos(keyword: string): Promise<SearchVideosResult> {
  const webhookUrl = process.env.N8N_VIDEO_SEARCH_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error: "영상 찾기 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({ keyword }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return { success: false, error: `영상 검색에 실패했어요. (status ${res.status})` };
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return { success: true, results };
  } catch {
    return {
      success: false,
      error: "영상 찾기 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

/**
 * 주제어로 채널을 찾아 구독자수·영상수와 조회수대비구독전환/일평균구독전환
 * 근사 등급을 받아온다. n8n "Business Gym - Channel Search" 워크플로우
 * (search.list type=channel + channels.list) 호출.
 */
export async function searchChannels(keyword: string): Promise<SearchChannelsResult> {
  const webhookUrl = process.env.N8N_CHANNEL_SEARCH_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error: "채널 찾기 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify({ keyword }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return { success: false, error: `채널 검색에 실패했어요. (status ${res.status})` };
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return { success: true, results };
  } catch {
    return {
      success: false,
      error: "채널 찾기 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}

export type SurgeVideo = {
  id: string;
  keyword: string | null;
  title: string;
  description: string | null;
  channelId: string | null;
  channelTitle: string | null;
  subscriberCount: number | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  videoUrl: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  rank: number | null;
};

type GetSurgeVideosResult =
  | {
      success: true;
      shorts: SurgeVideo[];
      longform: SurgeVideo[];
      snapshotDate: string | null;
    }
  | { success: false; error: string };

/**
 * 장르 무관 급상승 영상 TOP10(숏츠/롱폼 각각)을 읽는다. n8n "Business Gym -
 * Surge Videos Collector" 워크플로우가 매일 아침 26개 시드 키워드로 유튜브를
 * 훑어 구독자 대비 조회수가 가장 튄 영상들을 surge_videos에 채워 넣은 결과를
 * Supabase에서 바로 읽기만 한다(별도 웹훅 호출 불필요).
 * /research 영상 찾기 탭의 빈 상태(검색 전)에서 "요즘 뜨는 영상" 추천으로 사용.
 */
export async function getSurgeVideos(): Promise<GetSurgeVideosResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("surge_videos")
    .select(
      "video_id, keyword, title, description, channel_id, channel_title, subscriber_count, thumbnail_url, view_count, video_url, published_at, duration_seconds, is_shorts, rank, snapshot_date"
    )
    .order("is_shorts", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    return { success: false, error: "급상승 영상 데이터를 불러오지 못했어요." };
  }

  const toVideo = (row: (typeof data)[number]): SurgeVideo => ({
    id: row.video_id,
    keyword: row.keyword,
    title: row.title,
    description: row.description,
    channelId: row.channel_id,
    channelTitle: row.channel_title,
    subscriberCount: row.subscriber_count,
    thumbnailUrl: row.thumbnail_url,
    viewCount: row.view_count,
    videoUrl: row.video_url,
    publishedAt: row.published_at,
    durationSeconds: row.duration_seconds,
    rank: row.rank,
  });

  return {
    success: true,
    snapshotDate: data && data.length > 0 ? data[0].snapshot_date : null,
    shorts: (data ?? []).filter((row) => row.is_shorts).map(toVideo),
    longform: (data ?? []).filter((row) => !row.is_shorts).map(toVideo),
  };
}

export type TrendingNowVideo = {
  id: string;
  title: string;
  description: string | null;
  channelId: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  videoUrl: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  rank: number | null;
};

type GetTrendingNowResult =
  | {
      success: true;
      shorts: TrendingNowVideo[];
      longform: TrendingNowVideo[];
      snapshotDate: string | null;
    }
  | { success: false; error: string };

/**
 * 지역(대한민국) 기준 유튜브 전체 인기 급상승 영상을 숏츠/롱폼으로 나눠 읽는다.
 * n8n "Business Gym - Trending Now Collector" 워크플로우가 매일 아침
 * YouTube chart=mostPopular(검색어 없는 절대적 인기 순위)로 채워 넣은 결과를
 * Supabase에서 바로 읽기만 한다. surge_videos(구독자 대비 상대적 급상승)와는
 * 별개 신호 — 대형 채널 위주로 나올 수 있고, 지역 인기 특성상 숏츠가
 * 아예 없는 날도 있을 수 있다.
 */
export async function getTrendingNow(): Promise<GetTrendingNowResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trending_now")
    .select(
      "video_id, title, description, channel_id, channel_title, thumbnail_url, view_count, video_url, published_at, duration_seconds, is_shorts, rank, snapshot_date"
    )
    .order("is_shorts", { ascending: false })
    .order("rank", { ascending: true });

  if (error) {
    return { success: false, error: "인기 영상 데이터를 불러오지 못했어요." };
  }

  const toVideo = (row: (typeof data)[number]): TrendingNowVideo => ({
    id: row.video_id,
    title: row.title,
    description: row.description,
    channelId: row.channel_id,
    channelTitle: row.channel_title,
    thumbnailUrl: row.thumbnail_url,
    viewCount: row.view_count,
    videoUrl: row.video_url,
    publishedAt: row.published_at,
    durationSeconds: row.duration_seconds,
    rank: row.rank,
  });

  return {
    success: true,
    snapshotDate: data && data.length > 0 ? data[0].snapshot_date : null,
    shorts: (data ?? []).filter((row) => row.is_shorts).map(toVideo),
    longform: (data ?? []).filter((row) => !row.is_shorts).map(toVideo),
  };
}

type AnalyzeBenchmarkResult =
  | { success: true; analysis: string }
  | { success: false; error: string };

/**
 * 영상 하나를 Gemini로 분석해서 후킹 포인트/구조/바이럴 요인/벤치마킹 포인트를
 * 받아온다. n8n "Business Gym - Trend Benchmark Analysis" 워크플로우
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

export type ChannelAnalysis = {
  channel: {
    title: string;
    thumbnailUrl: string | null;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
  };
  metrics: {
    avgViews: number;
    maxVideo: { title: string; viewCount: number } | null;
    minVideo: { title: string; viewCount: number } | null;
    avgUploadIntervalDays: number | null;
    avgEngagementRate: number;
    shortsRatio: number;
    analyzedVideoCount: number;
  };
  analysis: string;
};

type AnalyzeChannelResult =
  | { success: true; data: ChannelAnalysis }
  | { success: false; error: string };

/**
 * 유튜브 채널 URL/핸들을 받아 공개 데이터(구독자·조회수·업로드 주기·참여율)를
 * 분석하고 Gemini로 조회수/매출 향상 팁을 생성한다. n8n
 * "Business Gym - Channel Analysis" 워크플로우 호출 — 로그인/OAuth 불필요,
 * 공개 데이터만 사용.
 */
export async function analyzeChannel(
  channelUrl: string
): Promise<AnalyzeChannelResult> {
  const webhookUrl = process.env.N8N_ANALYZE_CHANNEL_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return {
      success: false,
      error: "채널 분석 서비스가 아직 연결되지 않았어요. n8n 웹훅 설정을 확인해주세요.",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({ channelUrl }),
      signal: AbortSignal.timeout(45000),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: `채널 분석에 실패했어요. (status ${res.status})`,
      };
    }

    if (typeof data.error === "string") {
      return { success: false, error: data.error };
    }

    if (!data.channel || typeof data.analysis !== "string" || !data.analysis) {
      return {
        success: false,
        error: "AI가 빈 응답을 반환했어요. 다시 시도해주세요.",
      };
    }

    return {
      success: true,
      data: {
        channel: data.channel,
        metrics: data.metrics,
        analysis: data.analysis,
      },
    };
  } catch {
    return {
      success: false,
      error:
        "채널 분석 서비스에 연결할 수 없어요. n8n 워크플로우가 켜져 있는지 확인해주세요.",
    };
  }
}
