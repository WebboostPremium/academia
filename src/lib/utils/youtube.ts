/** Extrae el ID de un enlace o ID de YouTube (videos ocultos/unlisted incluidos). */
export function parseYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const embed = url.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed) return embed[1];
      const shorts = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbnail(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
