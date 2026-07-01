"use client";

import { useEffect, useState } from "react";

interface Breakpoint {
  isMobile: boolean;   // < 768px
  isTablet: boolean;   // 768px – 1023px
  isDesktop: boolean;  // ≥ 1024px
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setBp({
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024,
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}
