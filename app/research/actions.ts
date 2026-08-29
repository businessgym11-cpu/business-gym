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
      "id, youtube_video_id, title, thumbnail_url, duration_seconds, is_shorts, view_count, like_count, published_at, contribution_tier, performance_tier"
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
      "id, youtube_video_id, title, thumbnail_url, duration_seconds, is_shorts, view_count, like_count, published_at, contribution_tier, performance_tier"
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
 * 키워드로 유튜브 전체를 검색해 영상별 조회수/좋아요/구독자수와 기여도·
 * 성과도 근사 등급을 받아온다. n8n "Business Gym - Video Search" 워크플로우
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
