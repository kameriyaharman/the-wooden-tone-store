"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        setP(max > 0 ? scrollY / max : 0);
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  const show = p > 0.08;
  const C = 2 * Math.PI * 22;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed bottom-[9.5rem] right-[1.375rem] z-30 grid h-12 w-12 place-items-center rounded-full bg-white text-walnut shadow-lg ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:bg-walnut hover:text-white lg:bottom-[6.5rem] lg:right-[2.375rem] ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="none" stroke="#C4841D" strokeWidth="2" strokeDasharray={C} strokeDashoffset={C * (1 - p)} strokeLinecap="round" />
      </svg>
      <ArrowUp className="relative h-5 w-5" />
    </button>
  );
}
