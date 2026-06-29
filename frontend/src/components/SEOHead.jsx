import { useEffect } from "react";

/**
 * SEOHead — Sets document title and meta tags dynamically.
 * Lightweight alternative to react-helmet (no extra dependency).
 *
 * Usage: <SEOHead title="Dashboard" description="Your quiz dashboard" />
 */
export default function SEOHead({ title, description }) {
  useEffect(() => {
    // Set page title
    const fullTitle = title
      ? `${title} | Medhashree`
      : "Medhashree — Competitive Quiz Platform";
    document.title = fullTitle;

    // Set meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }

    // Set OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    // Set OG description
    if (description) {
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      }
    }

    // Set Twitter title
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) {
      twTitle.setAttribute("content", fullTitle);
    }

    // Set Twitter description
    if (description) {
      let twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) {
        twDesc.setAttribute("content", description);
      }
    }
  }, [title, description]);

  return null;
}
