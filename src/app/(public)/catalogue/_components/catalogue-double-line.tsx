"use client";

import { useEffect, useRef } from "react";

/**
 * Double vertical separator line for the catalogue page.
 * Starts at the very top of the viewport (z-[60], above header z-50)
 * and stops dynamically at the footer's top edge (with small crossing effect).
 * Uses requestAnimationFrame for smooth, stable updates during scroll.
 */
export function CatalogueDoubleLine() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    let rafId = 0;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!ref.current) return;
        const footerTop = footer.getBoundingClientRect().top;
        // +12px : traverse les 2 lignes horizontales du footer (2+4+2=8px) avec marge
        ref.current.style.height = `${Math.max(0, footerTop + 12)}px`;
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="hidden md:flex fixed top-0 left-[210px] z-[60] pointer-events-none gap-[3px] overflow-hidden"
      style={{ height: "100vh" }}
    >
      <div className="h-full w-[2px] bg-black" />
      <div className="h-full w-[2px] bg-black" />
    </div>
  );
}
