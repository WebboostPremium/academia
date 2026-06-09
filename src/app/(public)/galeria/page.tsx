"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { getAlbums, getGalleryImages } from "@/lib/services/gallery";
import type { GalleryAlbum, GalleryImage } from "@/types/gallery";

export default function GaleriaPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string>("all");
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

  useEffect(() => {
    Promise.all([getAlbums(true), getGalleryImages(undefined, true)]).then(([a, i]) => {
      setAlbums(a);
      setImages(i);
    });
  }, []);

  const filtered = activeAlbum === "all" ? images : images.filter((i) => i.albumId === activeAlbum);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-bold">Galería</h1>
        <p className="mt-2 text-muted-foreground">Momentos de nuestra comunidad de fe</p>

        <div className="mt-8 flex flex-wrap gap-2">
          <button onClick={() => setActiveAlbum("all")} className={`rounded-full px-4 py-1.5 text-sm ${activeAlbum === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Todas</button>
          {albums.map((a) => (
            <button key={a.id} onClick={() => setActiveAlbum(a.id)} className={`rounded-full px-4 py-1.5 text-sm ${activeAlbum === a.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{a.title}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((img) => (
            <button key={img.id} type="button" onClick={() => setLightbox(img)} className="group overflow-hidden rounded-xl ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.title} className="aspect-square w-full object-cover transition group-hover:scale-105" />
              <p className="p-2 text-left text-sm font-medium">{img.title}</p>
            </button>
          ))}
        </div>
      </main>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 text-white" onClick={() => setLightbox(null)}><X /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.imageUrl} alt={lightbox.title} className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      <PublicFooter />
    </>
  );
}
