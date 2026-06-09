import { addDoc, deleteDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { GalleryAlbum, GalleryImage } from "@/types/gallery";

export async function getAlbums(activeOnly = false): Promise<GalleryAlbum[]> {
  const snap = await getDocs(query(fsCollection("gallery_albums"), orderBy("order", "asc")));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        order: data.order ?? 0,
        status: data.status ?? "active",
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as GalleryAlbum;
    })
    .filter((a) => !activeOnly || a.status === "active");
}

export async function createAlbum(data: Omit<GalleryAlbum, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("gallery_albums"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateAlbum(id: string, data: Partial<GalleryAlbum>): Promise<void> {
  await updateDoc(fsDoc("gallery_albums", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAlbum(id: string): Promise<void> {
  await deleteDoc(fsDoc("gallery_albums", id));
}

export async function getGalleryImages(albumId?: string, activeOnly = false): Promise<GalleryImage[]> {
  let q = query(fsCollection("gallery_images"), orderBy("order", "asc"));
  if (albumId) q = query(fsCollection("gallery_images"), where("albumId", "==", albumId), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        albumId: data.albumId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        order: data.order ?? 0,
        status: data.status ?? "active",
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as GalleryImage;
    })
    .filter((i) => !activeOnly || i.status === "active");
}

export async function createGalleryImage(data: Omit<GalleryImage, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("gallery_images"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateGalleryImage(id: string, data: Partial<GalleryImage>): Promise<void> {
  await updateDoc(fsDoc("gallery_images", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await deleteDoc(fsDoc("gallery_images", id));
}
