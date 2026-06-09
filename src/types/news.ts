export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  author: string;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}
