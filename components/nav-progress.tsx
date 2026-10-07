"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Thin gold bar at the top of the page that starts the moment a link is clicked or a form navigates, and finishes when the new page has rendered. */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [p, setP] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (hide.current) clearTimeout(hide.current);
    if (timer.current) clearInterval(timer.current);
    setVisible(true);
    setP(8);
    timer.current = setInterval(() => setP((x) => (x < 90 ? x + (90 - x) * 0.08 : x)), 120);
  };
  const done = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setP(100);
    hide.current = setTimeout(() => { setVisible(false); setP(0); }, 300);
  };

  // finish when the route (path or query) actually changes
  useEffect(() => { if (timer.current) done(); }, [pathname, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if ((f.method || "get").toLowerCase() === "get" && !f.action.startsWith("javascript")) start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPop);
    // the app can trigger it for router.push() calls
    const onCustom = () => start();
    window.addEventListener("twt:navstart", onCustom);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("twt:navstart", onCustom);
    };
  }, []);

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="h-full bg-gradient-to-r from-teak via-teak-light to-teak shadow-[0_0_10px_rgba(196,132,29,.7)] transition-[width] duration-200 ease-out" style={{ width: `${p}%` }} />
    </div>
  );
}

export const navStart = () => window.dispatchEvent(new Event("twt:navstart"));
