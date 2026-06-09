"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAlbums, createAlbum, getGalleryImages, createGalleryImage, deleteGalleryImage, deleteAlbum,
} from "@/lib/services/gallery";
import type { GalleryAlbum, GalleryImage } from "@/types/gallery";

export default function AdminGaleriaPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albumForm, setAlbumForm] = useState({ title: "", description: "" });
  const [imageForm, setImageForm] = useState({ albumId: "", title: "", description: "", imageUrl: "" });
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [a, i] = await Promise.all([getAlbums(), getGalleryImages()]);
    setAlbums(a);
    setImages(i);
    if (a.length && !imageForm.albumId) setImageForm((f) => ({ ...f, albumId: a[0].id }));
  }

  useEffect(() => { load(); }, []);

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAlbum({ title: albumForm.title, description: albumForm.description, order: albums.length, status: "active" });
      setAlbumForm({ title: "", description: "" });
      toast.success("Álbum creado");
      await load();
    } catch { toast.error("Error al crear álbum"); }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !imageForm.albumId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "gallery");
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await createGalleryImage({
        albumId: imageForm.albumId,
        title: imageForm.title || file.name,
        description: imageForm.description,
        imageUrl: data.url,
        order: images.filter((i) => i.albumId === imageForm.albumId).length,
        status: "active",
      });
      setImageForm((f) => ({ ...f, title: "", description: "" }));
      toast.success("Imagen subida");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Galería" description="Administra álbumes e imágenes públicas" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nuevo álbum</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlbum} className="space-y-3">
              <div><Label>Título</Label><Input value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} required /></div>
              <div><Label>Descripción</Label><Textarea value={albumForm.description} onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} /></div>
              <Button type="submit">Crear álbum</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subir imagen</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Álbum</Label>
              <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={imageForm.albumId} onChange={(e) => setImageForm({ ...imageForm, albumId: e.target.value })}>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div><Label>Título</Label><Input value={imageForm.title} onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={imageForm.description} onChange={(e) => setImageForm({ ...imageForm, description: e.target.value })} /></div>
            <Input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading || !imageForm.albumId} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((img) => (
          <Card key={img.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt={img.title} className="h-40 w-full object-cover" />
            <CardContent className="space-y-2 p-3">
              <p className="text-sm font-medium">{img.title}</p>
              <Button size="sm" variant="destructive" onClick={() => deleteGalleryImage(img.id).then(load)}>Eliminar</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {albums.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Álbumes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {albums.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded border p-2">
                <span>{a.title}</span>
                <Button size="sm" variant="outline" onClick={() => deleteAlbum(a.id).then(load)}>Eliminar</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
