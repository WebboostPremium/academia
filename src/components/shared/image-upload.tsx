"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploadProps {
  folder: "avatars" | "courses" | "logos" | "banners";
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ folder, value, onChange, label = "Subir imagen" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      onChange(data.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative h-32 w-full overflow-hidden rounded-xl border">
          <Image src={value} alt="Vista previa" fill className="object-cover" unoptimized />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? "Subiendo..." : label}
      </Button>
    </div>
  );
}
