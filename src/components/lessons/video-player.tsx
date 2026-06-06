"use client";

import Image from "next/image";
import { youtubeThumbnail } from "@/lib/utils/youtube";

export function VideoPlayer({ youtubeId, title }: { youtubeId: string; title?: string }) {
  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
          title={title ?? "Video de lección"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-2">
        <Image src={youtubeThumbnail(youtubeId)} alt="" width={80} height={45} className="rounded object-cover" unoptimized />
        <p className="text-sm text-muted-foreground">Video alojado en YouTube — sin costo de almacenamiento</p>
      </div>
    </div>
  );
}
