"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Top-of-window loading bar. Next's App Router gives no navigation-start hook,
 * so we listen for link clicks and retire the bar when the pathname settles.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey
      )
        return;
      try {
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname) return;
      } catch {
        return;
      }
      setActive(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  React.useEffect(() => {
    setActive(false);
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-progress"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "62%", "82%", "92%"] }}
            transition={{ duration: 4, times: [0, 0.25, 0.6, 1], ease: "easeOut" }}
            className="h-full rounded-r-full"
            style={{
              background:
                "linear-gradient(90deg,rgb(91 139 108/0.4),#5c9bff 60%,#ffffff)",
              boxShadow: "0 0 18px 1px rgb(91 139 108 / 0.9)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
