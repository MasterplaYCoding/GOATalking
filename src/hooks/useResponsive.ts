import { useEffect, useState } from "react";

type ResponsiveState = {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
};

function getResponsiveState(): ResponsiveState {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;

  return {
    width,
    isMobile: width <= 768,
    isTablet: width <= 1100,
  };
}

export function useResponsive() {
  const [state, setState] = useState<ResponsiveState>(() => getResponsiveState());

  useEffect(() => {
    const handleResize = () => setState(getResponsiveState());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}
