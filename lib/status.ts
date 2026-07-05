import type { Center, Penalty, Post } from "./types";

/** 招生貼文的時效窗：超過這個天數就不再標示「招生中」 */
export const RECRUITING_WINDOW_DAYS = 60;

export interface CenterStatus {
  recruiting: boolean;
  latestRecruitingPost?: Post;
  hasPenalty: boolean;
  /** 該中心的裁罰紀錄，新到舊 */
  penalties: Penalty[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCenterStatus(
  center: Center,
  penalties: Penalty[],
  posts: Post[],
  now: Date,
): CenterStatus {
  const cutoff = now.getTime() - RECRUITING_WINDOW_DAYS * DAY_MS;
  const recruitingPosts = posts
    .filter(
      (p) =>
        p.centerId === center.id &&
        p.isRecruiting &&
        new Date(p.date).getTime() >= cutoff,
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const centerPenalties = penalties
    .filter((p) => p.centerId === center.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    recruiting: recruitingPosts.length > 0,
    latestRecruitingPost: recruitingPosts[0],
    hasPenalty: centerPenalties.length > 0,
    penalties: centerPenalties,
  };
}
