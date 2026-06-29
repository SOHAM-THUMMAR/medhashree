import { useEffect } from "react";

/**
 * Configurable Analytics loader.
 * Only loads scripts when corresponding env vars are set.
 * Never hardcodes IDs — everything via VITE_* environment variables.
 *
 * Supports:
 *   - Google Analytics 4 (VITE_GA_MEASUREMENT_ID)
 *   - Microsoft Clarity (VITE_CLARITY_ID)
 *
 * Usage: Add <Analytics /> once in main.jsx or App.jsx
 */
export default function Analytics() {
  useEffect(() => {
    // ── Google Analytics 4 ──
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && !document.querySelector(`script[src*="googletagmanager"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", gaId);
      };
    }

    // ── Microsoft Clarity ──
    const clarityId = import.meta.env.VITE_CLARITY_ID;
    if (clarityId && !document.querySelector(`script[data-clarity]`)) {
      const script = document.createElement("script");
      script.setAttribute("data-clarity", "true");
      script.textContent = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","${clarityId}");
      `;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
