export type ArticleStatus = 'Draft' | 'Published' | 0 | 1;

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  slug: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface HeaderLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  siteTitle: string;
  headerLinks: HeaderLink[];
  updatedAt: string;
}
