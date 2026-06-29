/**
 * Loads MathJax on-demand and triggers typesetting.
 * MathJax is NOT loaded globally — this saves ~800KB on pages that don't need math rendering.
 */

let loadPromise = null;

function loadMathJaxScript() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // If already loaded (e.g. navigated back to a math page)
    if (window.MathJax && window.MathJax.typesetPromise) {
      resolve();
      return;
    }

    // Set MathJax configuration before loading the script
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      options: {
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
      },
      startup: {
        ready: () => {
          window.MathJax.startup.defaultReady();
          resolve();
        }
      }
    };

    const script = document.createElement('script');
    script.id = 'MathJax-script';
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load MathJax'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const triggerMathJax = async () => {
  try {
    await loadMathJaxScript();
    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise();
    }
  } catch (err) {
    console.log('MathJax dynamic typeset failed:', err);
  }
};
