export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: "active" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

export interface GalleryImage {
  id: string;
  albumId: string;
  title: string;
  description?: string;
  imageUrl: string;
  order: number;
  status: "active" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}
