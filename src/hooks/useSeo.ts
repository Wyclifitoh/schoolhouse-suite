import { useEffect } from "react";

/**
 * Lightweight SEO hook — sets document title and meta description per page.
 * Call once at the top of each page component.
 */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} · CHUO` : "CHUO — School Management System for Kenya";
    document.title = fullTitle;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description.slice(0, 160));
    }
  }, [title, description]);
}
