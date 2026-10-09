/** Returns a YouTube embed URL for any common YouTube link, or null if it isn't one. */
export function youtubeEmbed(url: string | null | undefined) {
  if (!url) return null;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1` : null;
}
