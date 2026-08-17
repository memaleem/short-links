export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type PixelConfig = {
  fb?: string; // Facebook/Meta Pixel ID
  gtag?: string; // Google Ads / GA4 measurement or tag ID
};

export type LinkRow = {
  id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  platform: string | null;
  utm: Utm | null;
  pixel: PixelConfig | null;
  archived: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
};

export type HubLinkRow = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  position: number;
  starred: boolean;
  created_at: string;
  updated_at: string;
};

/** פרמטרי המעקב שהגיעו ב-query string של הקישור המקוצר. */
export type ClickParams = Record<string, string>;

export type ClickRow = {
  id: string;
  link_id: string;
  created_at: string;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  params: ClickParams | null;
};

/**
 * שורת לחיצה חדשה. params אופציונלי כדי שאפשר יהיה להכניס לחיצה גם בלעדיו,
 * למקרה שמיגרציית העמודה עוד לא הורצה על המסד.
 */
export type ClickInsert = Omit<ClickRow, "id" | "created_at" | "params"> & {
  params?: ClickParams | null;
};
