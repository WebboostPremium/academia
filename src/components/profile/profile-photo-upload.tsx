"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/lib/services/users";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploadProps {
  uid: string;
  displayName: string;
  photoURL?: string;
  onUpdated?: (url: string) => void;
}

export function ProfilePhotoUpload({ uid, displayName, photoURL, onUpdated }: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(photoURL);

  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      await updateUser(uid, { photoURL: data.url });
      setCurrentUrl(data.url);
      onUpdated?.(data.url);
      toast.success("Foto actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir foto");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {currentUrl ? (
          <Image src={currentUrl} alt={displayName} width={96} height={96} className="h-24 w-24 rounded-full object-cover" unoptimized />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Subiendo..." : "Cambiar foto"}
      </Button>
    </div>
  );
}
