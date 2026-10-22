// -------------------------------------------------------------------
// ScrollToTop — resets the scroll position on every route change and
// jumps to the section named in the URL hash (e.g. /services#relay).
// -------------------------------------------------------------------

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // The section may not be painted yet, so try again on the next
      // frames before giving up.
      const target = hash.replace(/^#/, "");
      let tries = 0;
      const jump = () => {
        const el = document.getElementById(target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        tries += 1;
        if (tries < 20) requestAnimationFrame(jump);
      };
      jump();
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
