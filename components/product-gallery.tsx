"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { resolveVideo } from "@/lib/video";

type Item = { kind: "img" | "video"; src: string };

/** Product media gallery: swipeable slides, thumbnail rail, hover zoom and a full-screen viewer. */
export function Gallery({ images, video, name }: { images: string[]; video?: string | null; name: string }) {
  const imgs = images.filter(Boolean);
  const items: Item[] = imgs.map((src) => ({ kind: "img", src }));
  // Video sits right after the main photo so shoppers notice it.
  if (video) items.splice(Math.min(1, items.length), 0, { kind: "video", src: video });
  const poster = imgs[0] || "";
  const n = items.length;

  const [i, setI] = useState(0);
  const [viewer, setViewer] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);

  // Keep slide position, thumbnail rail and index in sync.
  const go = useCallback((k: number, smooth = true) => {
    const next = (k + n) % n;
    setI(next);
    const el = track.current;
    if (el) { el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" }); }
  }, [n]);

  useEffect(() => {
    const t = thumbs.current?.children[i] as HTMLElement | undefined;
    t?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [i]);

  // Swipe on the track updates the index once a slide settles.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => { const k = Math.round(el.scrollLeft / el.clientWidth); setI((x) => (x === k ? x : k)); }, 60);
    };
    const onResize = () => el.scrollTo({ left: i * el.clientWidth });
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, [i]);

  if (!n) return <div className="aspect-square w-full rounded-2xl bg-cream" />;

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-3 md:block">
      {/* Main stage */}
      <div className={`min-w-0 ${n > 1 ? "md:ml-[100px]" : ""}`}>
      <div className="group relative">
        <div
          ref={track}
          className="no-scrollbar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-white"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={`${name} photos`}
          onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}
        >
          {items.map((it, k) => (
            <div key={k} className="relative h-full w-full shrink-0 snap-center" aria-hidden={k !== i}>
              {it.kind === "video"
                ? <VideoSlide src={it.src} poster={poster} name={name} active={k === i} />
                : <ZoomImage src={it.src} alt={k === 0 ? name : `${name} — photo ${k + 1}`} eager={k === 0} onOpen={() => setViewer(true)} />}
            </div>
          ))}
        </div>

        {n > 1 && (
          <>
            <NavBtn side="left" onClick={() => go(i - 1)} />
            <NavBtn side="right" onClick={() => go(i + 1)} />
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur">{i + 1} / {n}</span>
          </>
        )}
        {items[i]?.kind === "img" && (
          <button onClick={() => setViewer(true)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:scale-105" aria-label="View full screen">
            <Expand className="h-4 w-4" />
          </button>
        )}
        {video && i === 0 && (
          <button onClick={() => go(1)} className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-ink shadow-card transition hover:scale-[1.03]">
            <Play className="h-3.5 w-3.5 fill-current text-teak-dark" /> Watch video
          </button>
        )}
      </div>
        {n > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
            {items.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-walnut" : "w-1.5 bg-line"}`} />)}
          </div>
        )}
      </div>

      {/* Thumbnails: row on mobile, column on desktop */}
      {n > 1 && (
        <div ref={thumbs} className="no-scrollbar flex gap-2 overflow-x-auto md:absolute md:inset-y-0 md:left-0 md:w-[84px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {items.map((it, k) => (
            <button
              key={k}
              onClick={() => go(k)}
              aria-label={it.kind === "video" ? "Product video" : `Photo ${k + 1}`}
              aria-current={k === i}
              className={`relative aspect-square w-[64px] shrink-0 overflow-hidden rounded-xl border-2 bg-white transition md:w-full ${k === i ? "border-teak" : "border-line opacity-70 hover:border-teak/50 hover:opacity-100"}`}
            >
              <img src={it.kind === "video" ? poster : it.src} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
              {it.kind === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-walnut/45">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {viewer && <Viewer items={items} poster={poster} name={name} index={i} onIndex={(k) => go(k, false)} onClose={() => setViewer(false)} />}
    </div>
  );
}

function NavBtn({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:bg-white md:grid md:opacity-0 md:group-hover:opacity-100 ${side === "left" ? "left-3" : "right-3"}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

/** Image that magnifies under the cursor on desktop; tap/click opens the full-screen viewer. */
function ZoomImage({ src, alt, eager, onOpen }: { src: string; alt: string; eager?: boolean; onOpen: () => void }) {
  const [z, setZ] = useState<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true); }, [src]);
  const fine = typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  return (
    <div
      className="relative h-full w-full cursor-zoom-in overflow-hidden"
      onClick={onOpen}
      onMouseMove={(e) => {
        if (!fine) return;
        const r = e.currentTarget.getBoundingClientRect();
        setZ({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setZ(null)}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-cream" />}
      <img
        ref={ref}
        src={src}
        alt={alt}
        onError={() => setLoaded(true)}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        onLoad={() => setLoaded(true)}
        style={z ? { transformOrigin: `${z.x}% ${z.y}%`, transform: "scale(2)" } : undefined}
        className={`h-full w-full select-none object-contain transition-[transform,opacity] duration-200 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function VideoSlide({ src, poster, name, active }: { src: string; poster: string; name: string; active: boolean }) {
  const v = resolveVideo(src);
  const [err, setErr] = useState(false);
  if (!active || !v) {
    return (
      <div className="relative grid h-full w-full place-items-center bg-walnut">
        {poster && <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain opacity-40" />}
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/95 text-ink shadow-card"><Play className="ml-1 h-6 w-6 fill-current" /></span>
      </div>
    );
  }
  return (
    <div className="grid h-full w-full place-items-center bg-black">
      {v.kind === "embed" ? (
        <iframe src={v.provider === "youtube" ? `${v.src}&autoplay=1&mute=1` : v.src} title={`${name} video`} className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : err ? (
        <div className="px-6 text-center text-sm text-white/80">
          <p>This video can&apos;t be played here.</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-xs font-bold text-ink">Open video</a>
        </div>
      ) : (
        <video src={v.src} controls autoPlay muted playsInline loop preload="metadata" poster={poster || undefined} onError={() => setErr(true)} className="h-full w-full object-contain" />
      )}
    </div>
  );
}

/** Full-screen viewer: arrows, keyboard, swipe, tap-to-zoom and a thumbnail strip. */
function Viewer({ items, poster, name, index, onIndex, onClose }: { items: Item[]; poster: string; name: string; index: number; onIndex: (k: number) => void; onClose: () => void }) {
  const n = items.length;
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const tx = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const move = useCallback((d: number) => { setZoomed(false); onIndex((index + d + n) % n); }, [index, n, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [move, onClose]);

  useEffect(() => { (strip.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }, [index]);

  const cur = items[index];
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#0f0b08] text-white" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm tabular-nums text-white/70">{index + 1} / {n}</span>
        <div className="flex items-center gap-2">
          {cur.kind === "img" && (
            <button onClick={() => setZoomed((z) => !z)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={zoomed ? "Zoom out" : "Zoom in"}>
              {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
          )}
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 md:px-20"
        onTouchStart={(e) => { if (!zoomed && e.touches.length === 1) tx.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (tx.current === null) return;
          const d = e.changedTouches[0].clientX - tx.current;
          tx.current = null;
          if (Math.abs(d) > 50) move(d < 0 ? 1 : -1);
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {cur.kind === "img" ? (
          <img
            key={cur.src}
            src={cur.src}
            alt={name}
            draggable={false}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              setZoomed((z) => !z);
            }}
            onMouseMove={(e) => {
              if (!zoomed) return;
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
            style={{ transformOrigin: origin, transform: zoomed ? "scale(2.2)" : "none" }}
            className={`h-full w-full select-none object-contain transition-transform duration-200 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"} animate-[page-in_.25s_ease]`}
          />
        ) : (
          <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-lg"><VideoSlide src={cur.src} poster={poster} name={name} active /></div>
        )}
        {n > 1 && (
          <>
            <button onClick={() => move(-1)} className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 md:grid" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => move(1)} className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 md:grid" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
      </div>

      {n > 1 && (
        <div ref={strip} className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-4 py-3 md:justify-center">
          {items.map((it, k) => (
            <button key={k} onClick={() => { setZoomed(false); onIndex(k); }} aria-label={it.kind === "video" ? "Video" : `Photo ${k + 1}`}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${k === index ? "border-teak" : "border-transparent opacity-50 hover:opacity-90"}`}>
              <img src={it.kind === "video" ? poster : it.src} alt="" className="h-full w-full object-contain" />
              {it.kind === "video" && <span className="absolute inset-0 grid place-items-center bg-black/45"><Play className="h-4 w-4 fill-white text-white" /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
