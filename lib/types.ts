export interface LatLng {
  lat: number;
  lng: number;
}

export type CenterType = "私立" | "公設民營" | "職場互助" | "社區公共托育家園" | "其他";

export interface CenterLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
}

export interface Center {
  id: string;
  name: string;
  type: CenterType;
  county: "新竹市" | "新竹縣";
  district: string;
  address: string;
  phone?: string;
  /** 核定收托人數 */
  capacity?: number;
  /** 是否加入準公共化 */
  quasiPublic?: boolean;
  /** 評鑑，例如 { year: 2023, grade: "甲" } */
  accreditation?: { year: number; grade: string };
  lat?: number;
  lng?: number;
  links?: CenterLinks;
}

export interface Penalty {
  /** 掛回 centers.json 的 id；名稱比對不到時為 null */
  centerId: string | null;
  /** 公告上的機構名稱原文 */
  centerName: string;
  /** ISO 日期 (裁罰或公告日) */
  date: string;
  /** 違規事由摘要 */
  violation: string;
  /** 法條 */
  law?: string;
  /** 罰鍰金額 (新台幣)，無罰鍰處分則省略 */
  fine?: number;
  sourceUrl: string;
}

export type PostPlatform = "facebook" | "instagram" | "web";

export interface Post {
  centerId: string;
  platform: PostPlatform;
  postUrl: string;
  /** ISO 日期 */
  date: string;
  excerpt: string;
  isRecruiting: boolean;
  fetchedAt: string;
}

export interface DatasetMeta {
  updatedAt?: string;
  /** true 表示還是示範資料，尚未接上真實來源 */
  mock?: boolean;
}

export interface Meta {
  centers?: DatasetMeta;
  penalties?: DatasetMeta;
  posts?: DatasetMeta;
}
