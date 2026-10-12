/** Returns a YouTube embed URL for any common YouTube link, or null if it isn't one. */
export function youtubeEmbed(url: string | null | undefined) {
  if (!url) return null;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1` : null;
}

export type VideoSource =
  | { kind: "embed"; src: string; provider: "youtube" | "drive" | "vimeo" | "instagram" | "facebook" }
  | { kind: "file"; src: string };

/**
 * Turns whatever the admin pasted into something the browser can actually play.
 * Share-page links (Google Drive, Vimeo, Instagram, Facebook) can't go in a <video> tag —
 * they're web pages, not video files — so they get the provider's embed player instead.
 */
export function resolveVideo(raw: string | null | undefined): VideoSource | null {
  const url = (raw || "").trim();
  if (!url) return null;

  const yt = youtubeEmbed(url);
  if (yt) return { kind: "embed", provider: "youtube", src: yt };

  // Google Drive: /file/d/<id>/view, /open?id=<id>, /uc?id=<id>
  const drive = /drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/.exec(url);
  if (drive) return { kind: "embed", provider: "drive", src: `https://drive.google.com/file/d/${drive[1]}/preview` };

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return { kind: "embed", provider: "vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  const ig = /instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/.exec(url);
  if (ig) return { kind: "embed", provider: "instagram", src: `https://www.instagram.com/${ig[1] === "reels" ? "reel" : ig[1]}/${ig[2]}/embed` };

  if (/(?:facebook\.com|fb\.watch)\//.test(url))
    return { kind: "embed", provider: "facebook", src: `https://www.facebook.com/plugins/video.php?show_text=false&href=${encodeURIComponent(url)}` };

  // Dropbox share links serve an HTML page unless asked for the raw file.
  if (/dropbox\.com\//.test(url)) {
    try {
      const u = new URL(url);
      u.searchParams.delete("dl");
      u.searchParams.set("raw", "1");
      return { kind: "file", src: u.toString() };
    } catch { /* fall through */ }
  }

  return { kind: "file", src: url };
}
