function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

export function toEmbedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) {
    return `https://www.youtube.com/embed/${yt}`;
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo}`;
  }
  return null;
}
