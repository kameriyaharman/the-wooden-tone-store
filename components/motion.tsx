"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const REVEAL_SELECTOR = [
  "main .card",
  "main h1",
  "main h2",
  "main [data-reveal]",
].join(",");

/** Fades/slides elements in as they scroll into view. Elements stay visible if JS is off. */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px 20% 0px", threshold: 0 },
    );
    const scan = () => {
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.revealed) return;
        el.dataset.revealed = "1";
        // anything already on screen is shown immediately (no flash on first paint)
        if (el.getBoundingClientRect().top < vh * 1.1) {
          el.classList.add("reveal", "in");
          return;
        }
        el.classList.add("reveal");
        // stagger siblings in grids
        const parent = el.parentElement;
        if (parent) {
          const idx = Array.from(parent.children).indexOf(el);
          el.style.transitionDelay = `${Math.min(idx, 4) * 40}ms`;
        }
        io.observe(el);
      });
    };
    scan();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const limit = window.innerHeight * 1.05;
        document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
          if (el.getBoundingClientRect().top < limit) el.classList.add("in");
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const mo = new MutationObserver(() => scan());
    const main = document.querySelector("main");
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [pathname]);
  return null;
}

/** Modern two-part cursor: a precise dot plus a soft trailing ring that grows over links and shows "View" over product images. Desktop pointers only. */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"default" | "link" | "view" | "text">("default");
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      setHidden(false);
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      if (t.closest("[data-cursor='view']")) setMode("view");
      else if (t.closest("a, button, [role='button'], label, select, summary, input[type='checkbox'], input[type='radio']")) setMode("link");
      else if (t.closest("input, textarea, [contenteditable='true']")) setMode("text");
      else setMode("default");
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => setHidden(true);
    const pd = () => setDown(true), pu = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("pointerup", pu);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointerup", pu);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} aria-hidden className={`cursor-ring ${hidden ? "opacity-0" : ""}`} data-mode={mode} data-down={down || undefined}>
        <span>View</span>
      </div>
      <div ref={dot} aria-hidden className={`cursor-dot ${hidden || mode === "view" || mode === "text" ? "opacity-0" : ""}`} />
    </>
  );
}
