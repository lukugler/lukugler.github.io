// ...existing code...
// Loads posts from posts.json and renders either article cards or visual blocks.
// Mobile behavior: text-first, media scales down without cropping, no fixed vh cap, description never truncated.
(function () {
  const postsEl = document.querySelector('.posts');

  // --- Reload watchdog (diagnostic) -------------------------------------------------
  // Track recent page load timestamps in sessionStorage. If the page reloads
  // rapidly (e.g., >6 times within 10s) we mark the session and show a small
  // overlay to help debug on-device. This also allows us to avoid injecting
  // external scripts that might be triggering loops while the user inspects.
  (function reloadWatchdog() {
    try {
      const KEY = '__md_reload_times_v1';
      const PROTECT = '__md_reload_protect_v1';
      const now = Date.now();
      const raw = sessionStorage.getItem(KEY) || '[]';
      const arr = JSON.parse(raw);
      arr.push(now);
      // keep only last 10s of timestamps
      while (arr.length && now - arr[0] > 10000) arr.shift();
      sessionStorage.setItem(KEY, JSON.stringify(arr));
      if (arr.length > 6) {
        sessionStorage.setItem(PROTECT, '1');
        console.warn('Reload watchdog: detected rapid reloads, pausing risky injections.', arr.length);
      }

      if (sessionStorage.getItem(PROTECT)) {
        // show unobtrusive overlay so user knows something's up
        const id = 'md-reload-watchdog-overlay';
        if (!document.getElementById(id)) {
          const ov = document.createElement('div');
          ov.id = id;
          ov.style.cssText = 'position:fixed;left:8px;right:8px;bottom:12px;padding:10px 12px;background:rgba(220,38,38,0.92);color:#fff;font-weight:600;border-radius:8px;z-index:99999;font-size:13px;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,0.45);';
          ov.innerHTML = 'Reload watchdog: rapid reloads detected — external viewer scripts are paused. Reloads in last 10s: ' + arr.length + '. Refresh to clear.';
          document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(ov); });
          // also append immediately if body already exists
          if (document.body) document.body.appendChild(ov);
        }
      }
    } catch (e) {
      /* ignore watchdog errors */
    }
  })();

  // --- Diagnostics: log navigation type, errors, and intercept reload calls ---
  (function diagnostics() {
    try {
      const DKEY = '__md_diag_v1';
      const push = (obj) => {
        try {
          const raw = sessionStorage.getItem(DKEY) || '[]';
          const arr = JSON.parse(raw);
          arr.push(obj);
          // keep small
          while (arr.length > 200) arr.shift();
          sessionStorage.setItem(DKEY, JSON.stringify(arr));
        } catch (e) { /* ignore */ }
      };

      // record navigation type
      try {
        const navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation') && performance.getEntriesByType('navigation')[0]) || null;
        const navType = navEntry ? (navEntry.type || 'unknown') : (performance.navigation && performance.navigation.type) || 'unknown';
        push({ t: Date.now(), event: 'page-load', navType });
      } catch (e) { push({ t: Date.now(), event: 'page-load', err: String(e) }); }

      // monkeypatch location.reload to log stack traces
      try {
        if (!window._md_orig_reload) {
          window._md_orig_reload = window.location.reload.bind(window.location);
          window.location.reload = function () {
            push({ t: Date.now(), event: 'location.reload', stack: (new Error()).stack });
            return window._md_orig_reload();
          };
        }
      } catch (e) { push({ t: Date.now(), event: 'reload-patch-failed', err: String(e) }); }

      window.addEventListener('error', function (ev) {
        push({ t: Date.now(), event: 'error', message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno });
      });
      window.addEventListener('unhandledrejection', function (ev) {
        try { push({ t: Date.now(), event: 'unhandledrejection', reason: String(ev.reason) }); } catch (e) { }
      });

      // beforeunload usually indicates a navigation or hard reload
      window.addEventListener('beforeunload', function () { push({ t: Date.now(), event: 'beforeunload' }); });
    } catch (e) { /* silent */ }
  })();

  // --- Global helper: allow manual injection of model-viewer scripts from the console/UI ---
  window._md_injectModelViewerScripts = function () {
    try {
      if (window._modelViewerScriptInjected) return true;
      const mod = document.createElement('script');
      mod.type = 'module';
      mod.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      mod.async = true;
      document.head.appendChild(mod);

      const legacy = document.createElement('script');
      legacy.setAttribute('nomodule', '');
      legacy.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js';
      legacy.async = true;
      document.head.appendChild(legacy);

      window._modelViewerScriptInjected = true;
      console.log('model-viewer scripts injected (manual)');
      return true;
    } catch (e) {
      console.error('injectModelViewerScripts failed', e);
      return false;
    }
  };

  // --- Debug panel for watchdog/diagnostics (visible when protection active or ?md-debug) ---
  (function debugPanel() {
    try {
      const PROTECT = '__md_reload_protect_v1';
      const KEY = '__md_reload_times_v1';
      const DKEY = '__md_diag_v1';
      const showAlways = location.search.indexOf('md-debug') !== -1 || location.search.indexOf('md-debug=1') !== -1;
      const isProtected = (() => { try { return !!sessionStorage.getItem(PROTECT); } catch (e) { return false; } })();
      if (!showAlways && !isProtected) return;

      function render() {
        const times = (() => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { return []; } })();
        const diags = (() => { try { return JSON.parse(sessionStorage.getItem(DKEY) || '[]'); } catch (e) { return []; } })();
        return { times, diags, protected: isProtected };
      }

      function createPanel() {
        const root = document.createElement('div');
        root.id = 'md-debug-panel';
        root.style.cssText = 'position:fixed;left:10px;bottom:10px;width:320px;max-width:calc(100% - 20px);background:rgba(17,24,39,0.96);color:#fff;padding:12px;border-radius:10px;z-index:999999;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,0.5);';
        const title = document.createElement('div');
        title.textContent = 'Debug: reload watchdog';
        title.style.cssText = 'font-weight:700;margin-bottom:8px;';
        root.appendChild(title);

        const content = document.createElement('pre');
        const data = render();
        content.textContent = JSON.stringify(data, null, 2);
        content.style.cssText = 'max-height:240px;overflow:auto;background:rgba(255,255,255,0.02);padding:8px;border-radius:6px;margin-bottom:8px;';
        root.appendChild(content);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;justify-content:space-between';

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear protection';
        clearBtn.style.cssText = 'flex:1;background:#10b981;border:0;padding:8px;border-radius:6px;color:#042';
        clearBtn.onclick = function () {
          try { sessionStorage.removeItem(PROTECT); sessionStorage.removeItem(KEY); sessionStorage.removeItem(DKEY); } catch (e) { }
          location.reload();
        };
        btnRow.appendChild(clearBtn);

        const injectBtn = document.createElement('button');
        injectBtn.textContent = 'Force inject';
        injectBtn.style.cssText = 'flex:1;background:#3b82f6;border:0;padding:8px;border-radius:6px;color:#fff;';
        injectBtn.onclick = function () {
          try { sessionStorage.removeItem(PROTECT); } catch (e) { }
          const ok = window._md_injectModelViewerScripts();
          injectBtn.textContent = ok ? 'Injected' : 'Failed';
        };
        btnRow.appendChild(injectBtn);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = 'flex:1;background:#374151;border:0;padding:8px;border-radius:6px;color:#fff;';
        closeBtn.onclick = function () { root.remove(); };
        btnRow.appendChild(closeBtn);

        root.appendChild(btnRow);

        return root;
      }

      function attach() {
        const panel = createPanel();
        if (document.body) document.body.appendChild(panel); else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));
      }

      attach();
    } catch (e) { /* ignore debug panel errors */ }
  })();

  // Determine background color from the posts container (preferred) or body
  const getBG = () => {
    const srcEl = postsEl || document.body;
    const bg = getComputedStyle(srcEl).backgroundColor || getComputedStyle(document.body).backgroundColor || '#1a1a1a';
    document.documentElement.style.setProperty('--bg-color', bg);
  };
  getBG();
  window.addEventListener('resize', getBG);

  // Inject minimal CSS needed for frames + responsive columns
  (function injectStyles() {
    if (document.getElementById('md-enhance-styles')) return;
    const css = `
      /* ---- Background match on ALL layers (container + frame + media) ---- */
      .card .media,
      .card .media-frame,
      .card .media-frame > img,
      .card .media-frame > video,
      .visual-post .vp-media-wrap,
      .visual-post .vp-media-frame,
      .visual-post .vp-media-frame > img,
      .visual-post .vp-media-frame > video {
        background-color: var(--bg-color, transparent);
      }

      /* ---- Card base ---- */
      .card { position: relative; display: block; min-height: var(--post-height, auto); }
      .card .media { display: flex; align-items: center; justify-content: center; }
      .card .media-frame {
        display: grid; place-items: center;
        width: var(--media-w, 100%); height: var(--media-h, auto);
        max-width: 100%;
        overflow: hidden;
      }
      .card .media-frame > img,
      .card .media-frame > video {
        max-width: 100%; max-height: 100%;
        width: 100%; height: auto;
        object-fit: contain;
        display: block;
      }

      /* ---- Two-column card when layout === media-left ---- */
      .card.media-left {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
      }
      .card.media-left .content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
      }

      /* ---- Visual posts ---- */
      .visual-post { position: relative; }
      .visual-post .vp-media-wrap { display: flex; align-items: center; justify-content: center; }
        .visual-post .vp-media-frame { width: var(--vbox-w, 100%) !important; max-width: 100% !important; height: var(--vbox-h, auto) !important; overflow: visible !important; }
        .visual-post .vp-media-frame > img,
        .visual-post .vp-media-frame > video {
          width: 100%; height: auto; object-fit: contain; display: block;
        }
      .visual-post .vp-media-frame > img,
      .visual-post .vp-media-frame > video {
        width: 100%; height: auto; object-fit: contain; display: block;
      }

      /* ---- Existing layout variants ---- */
      .visual-post.center { text-align: center; }
      .visual-post.side { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; }
      .visual-post.side.left .visual-caption { order: 2; }
      .visual-post.side.right .visual-caption { order: 1; }
      .visual-post.two .two-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

      /* ---- MOBILE: text-first, NO cropping, NO fixed caps, NO description truncation ---- */
  @media (max-width: 900px) {
        /* Text before media */
        .card.media-left { grid-template-columns: 1fr; align-items: flex-start; }
        .card.media-left .content { order: 0; justify-content: flex-start; }
        .card.media-left .media { order: 1; margin-top: 12px; }

        /* Let the card grow naturally */
        .card { min-height: auto; }

        /* Media is fluid, no cropping */
        .card .media-frame,
        .visual-post .vp-media-frame {
          /* On mobile, always use full width but allow explicit height via --vbox-h */
          width: 100% !important;
          height: var(--vbox-h, auto) !important;
          overflow: visible !important;
        }
        .card .media-frame > img,
        .card .media-frame > video,
        .visual-post .vp-media-frame > img,
        .visual-post .vp-media-frame > video {
            width: var(--vbox-w, 100%) !important;
            height: var(--vbox-h, auto) !important;
            max-width: 100% !important;
            max-height: none !important;  /* remove vh cap */
            object-fit: contain !important;
          }

        /* Absolutely no truncation on the description */
        .card .excerpt {
          display: block !important;
          -webkit-line-clamp: unset !important;
          -webkit-box-orient: unset !important;
          overflow: visible !important;
          max-height: none !important;
          white-space: normal !important;
        }

        /* Responsive headline + buttons */
        .card .content h3 { font-size: clamp(20px, 5.2vw, 32px); line-height: 1.2; }
        .card .actions { display: flex; flex-wrap: wrap; gap: 8px; }
      }

      /* Also apply non-cropping behavior earlier for narrow desktop windows */
      @media (max-width: 1100px) {
        .card { min-height: auto; }
        .card .media-frame,
        .visual-post .vp-media-frame {
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        .card .media-frame > img,
        .card .media-frame > video,
        .visual-post .vp-media-frame > img,
        .visual-post .vp-media-frame > video {
          width: 100% !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: none !important;
          object-fit: contain !important;
        }

        .card .excerpt {
          display: block !important;
          -webkit-line-clamp: unset !important;
          -webkit-box-orient: unset !important;
          overflow: visible !important;
          max-height: none !important;
          white-space: normal !important;
        }
      }

      @media (max-width: 380px) {
        .card .content h3 { font-size: clamp(18px, 6vw, 26px); }
        .card .actions a.btn { padding: 6px 10px; font-size: 14px; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'md-enhance-styles';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  function revealOnIntersect(el) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && e.target.classList.add('revealed'));
    }, { threshold: 0.12 });
    io.observe(el);
  }

  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function px(val, fallback) {
    if (val === undefined || val === null || val === '') return fallback;
    return (typeof val === 'number') ? `${val}px` : String(val).match(/px|%|vh|vw$/) ? String(val) : `${val}px`;
  }

  function makeArticleCard(post) {
    const postsEl = document.querySelector('.posts');
    const aHref = (post.href && post.href.endsWith('.md'))
      ? `articles/article.html?src=${encodeURIComponent(post.href)}&title=${encodeURIComponent(post.title || '')}&date=${encodeURIComponent(post.date || '')}`
      : (post.href || '#');

    const shouldAutoplay = (post.autoplay === undefined) ? true : Boolean(post.autoplay);
    const mediaTag = post.mediaType === 'video'
      ? `<video src="${post.media}" ${shouldAutoplay ? 'autoplay muted loop playsinline' : ''} poster="${post.poster || ''}"></video>`
      : `<img src="${post.media}" alt="">`;

    const badge = post.badge ? `<div class="badge">${post.badge}</div>` : '';

    const classes = ['card'];
    if (post.layout === 'media-left') classes.push('media-left');

    // Media frame sizing variables (centered box)
    const mediaStyles = [
      `--media-w:${px(post.mediaBoxW, '100%')}`,
      `--media-h:${px(post.mediaBoxH, 'auto')}`
    ].join(';');

    const heightVar = `--post-height:${post.height ? px(post.height, 'auto') : 'auto'}`;

    const html = `
      <article class="${classes.join(' ')}" style="${heightVar}">
        <div class="content">
          <h3><a href="${aHref}">${post.title || ''}</a></h3>
          <div class="meta">${post.date ? fmtDate(post.date) : ''}</div>
          <div class="excerpt">${post.excerpt || ''}</div>
          <div class="actions">
            ${post.viewer ? `<a class="btn" href="${post.viewer}" target="_blank" rel="noopener">Viewer</a>` : ''}
            ${post.projectReport ? `<a class="btn" href="${post.projectReport}" target="_blank" rel="noopener">Project Report</a>` : ''}
            ${post.presentation ? `<a class="btn" href="${post.presentation}" target="_blank" rel="noopener">Presentation</a>` : ''}
            ${post.poster ? `<a class="btn" href="${post.poster}" target="_blank" rel="noopener">Poster</a>` : ''}
            ${post.conferenceAbstract ? `<a class="btn" href="${post.conferenceAbstract}" target="_blank" rel="noopener">Conference Abstract</a>` : ''}
            ${aHref && aHref !== '#' ? `<a class="btn" href="${aHref}">Read</a>` : ''}
          </div>
        </div>
        <div class="media">
          <div class="media-frame" style="${mediaStyles}">
            ${badge}${mediaTag}
          </div>
        </div>
      </article>`;

    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);
  }

  function makeVisual(post) {
    const postsEl = document.querySelector('.posts');
    const layout = post.layout || 'center';
    const scale = post.mediaScale || 1;
    const height = post.height || 420;

    // detect mobile / phone-like contexts. Use touch or narrow viewport as heuristic.
    const isTouchDevice = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    const isNarrow = (typeof window !== 'undefined') && window.innerWidth <= 900;
    const isMobile = isTouchDevice || isNarrow;

    // helper to select mobile override if present, with multiple accepted field names
    function pickBox(fieldBase) {
      // possible names: e.g. mediaBoxWMobile, mediaBoxW_mobile
      const mobileCandidates = [fieldBase + 'Mobile', fieldBase + '_mobile'];
      const desktopCandidates = [fieldBase];
      if (isMobile) {
        for (const k of mobileCandidates) if (post[k] !== undefined) return post[k];
        for (const k of desktopCandidates) if (post[k] !== undefined) return post[k];
      } else {
        for (const k of desktopCandidates) if (post[k] !== undefined) return post[k];
        for (const k of mobileCandidates) if (post[k] !== undefined) return post[k];
      }
      return undefined;
    }

    const vboxWVal = pickBox('mediaBoxW');
    const vboxHVal = pickBox('mediaBoxH');

    const shared = `class="visual-post ${layout === 'two' ? 'two' : (layout === 'left' || layout === 'right' ? 'side ' + layout : 'center')}" style="--post-height:${height}px; --media-scale:${scale}; --vbox-w:${px(vboxWVal, '100%')}; --vbox-h:${px(vboxHVal, 'auto')};"`;

    const shouldAutoplayVisual = (post.autoplay === undefined) ? true : Boolean(post.autoplay);

    // helper: ensure model-viewer script is loaded once when needed
    function ensureModelViewerScript() {
      // If reload watchdog flagged rapid reloads, avoid injecting external
      // scripts which could be triggering navigation loops.
      try {
        if (sessionStorage.getItem('__md_reload_protect_v1')) {
          console.warn('ensureModelViewerScript: aborted due to reload watchdog protection');
          return;
        }
      } catch (e) { /* ignore */ }

      // Inject both module and legacy (nomodule) builds so older mobile
      // browsers that don't support ES modules can still use model-viewer.
      // If custom element already defined, skip injection.
      if (window._modelViewerScriptInjected || (window.customElements && window.customElements.get && window.customElements.get('model-viewer'))) {
        window._modelViewerScriptInjected = true;
        return;
      }

      // Modern (module) build
      const mod = document.createElement('script');
      mod.type = 'module';
      mod.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      mod.async = true;
      document.head.appendChild(mod);

      // Legacy (nomodule) build - fallback for older browsers (iOS Safari < 12.2 / older Android)
      const legacy = document.createElement('script');
      legacy.setAttribute('nomodule', '');
      legacy.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js';
      legacy.async = true;
      document.head.appendChild(legacy);

      window._modelViewerScriptInjected = true;
    }

    const mediaTag = (src, type) => {
      const t = (type || '').toString().toLowerCase();
      const isModel = t === 'model' || (typeof src === 'string' && src.toLowerCase().endsWith('.glb'));
      if (isModel) {
        ensureModelViewerScript();
        // Allow stronger zoom by decreasing the minimum field-of-view (smaller fov == closer zoom)
        // and set a reasonable maximum to avoid extreme fisheye.
        // Lowered min-field-of-view to 2deg for an even closer zoom.
        // Default camera-orbit is set closer (smaller radius) so the model appears zoomed-in.
        // You can override per-post by setting `cameraOrbit` or `camera_orbit` in posts.json
        // Choose a starting camera orbit. On touch devices / small viewports we
        // prefer a near top-down starting view so the model is visible immediately.
        // Allow per-post overrides: cameraOrbit / camera_orbit (desktop),
        // cameraOrbitMobile / camera_orbit_mobile (mobile), and cameraTarget / camera_target.
        const isTouchDevice = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        // near-top-side: azimuth 0deg, elevation close to 90deg (top-down), radius 1.0m
        const mobileDefaultOrbit = '200deg 50deg 1.0m';
        const desktopDefaultOrbit = '200deg 50deg 1.0m';
        const camOrbit = post.cameraOrbit || post.camera_orbit || (isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 900) ? (post.cameraOrbitMobile || post.camera_orbit_mobile || mobileDefaultOrbit) : desktopDefaultOrbit);
        const camTarget = (post.cameraTarget || post.camera_target) || '0m 0m 0m';
        // Add iOS Quick Look source if available (explicit or inferred from .glb)
        const iosSrc = post.iosSrc || post.ios_src || (typeof src === 'string' && src.toLowerCase().endsWith('.glb') ? src.replace(/\.glb$/i, '.usdz') : undefined);
        // Add a small min-height to ensure the element doesn't collapse when the
        // containing frame has no explicit height (common on responsive/mobile layouts).
        // Styling and breakpoints are also handled in CSS.
        return `<model-viewer class="visual-media model-viewer-el" src="${src}"${iosSrc ? ` ios-src="${iosSrc}"` : ''} alt="${post.title || ''}" camera-controls auto-rotate exposure="1" interaction-policy="allow" min-field-of-view="2deg" max-field-of-view="75deg" camera-orbit="${camOrbit}" camera-target="${camTarget}" ar ar-modes="webxr scene-viewer quick-look" style="min-height:240px; width:100%; height:100%;"></model-viewer>`;
      }
      if (t === 'video') return `<video class="visual-media" src="${src}" ${shouldAutoplayVisual ? 'autoplay muted loop playsinline' : ''}></video>`;
      return `<img class="visual-media" src="${src}" alt="">`;
    };

    let inner = '';
    if (layout === 'two') {
      inner = `
        <div class="two-grid">
          <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
          <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media2, post.media2Type)}</div></div>
        </div>
        <div class="visual-caption">${post.caption || ''}</div>`;
    } else if (layout === 'left' || layout === 'right') {
      inner = `
        <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
        <div class="visual-caption">${post.caption || ''}</div>`;
    } else {
      // center layout: allow per-post explicit sizing similar to compare posts
      let frameStyle = '';
      // use mobile-aware vbox values selected earlier (vboxWVal / vboxHVal)
      if (vboxWVal || vboxHVal) {
        frameStyle = 'style="';
        if (isMobile) {
          // On mobile, always let the frame span full width and honor explicit height
          frameStyle += `width: 100%;`;
          if (vboxHVal !== undefined) frameStyle += ` height: ${px(vboxHVal, 'auto')};`;
        } else {
          frameStyle += `width: ${px(vboxWVal, '100%')};`;
          if (vboxWVal && vboxHVal && typeof vboxWVal === 'number' && typeof vboxHVal === 'number') {
            // Desktop: when both numeric, use aspect-ratio for proportional scaling
            frameStyle += ` aspect-ratio: ${vboxWVal} / ${vboxHVal};`;
          } else {
            frameStyle += ` height: ${px(vboxHVal, 'auto')};`;
          }
        }
        frameStyle += '"';
      }

      inner = `
        <div class="vp-media-wrap"><div class="vp-media-frame" ${frameStyle}>${mediaTag(post.media, post.mediaType)}</div></div>
        <div class="visual-caption">${post.caption || ''}</div>`;
    }

    const html = `<section ${shared}>${inner}</section>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);
  }

  // Create a compare (before/after) post
  function makeCompare(post) {
    const postsEl = document.querySelector('.posts');
    const height = post.height || 420;
    // mobile-aware mediaBox selection (support mediaBoxWMobile / mediaBoxW_mobile)
    const isTouchDevice = (typeof window !== 'undefined') && (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    const isNarrow = (typeof window !== 'undefined') && window.innerWidth <= 900;
    const isMobile = isTouchDevice || isNarrow;
    function pickBox(fieldBase) {
      const mobileCandidates = [fieldBase + 'Mobile', fieldBase + '_mobile'];
      const desktopCandidates = [fieldBase];
      if (isMobile) {
        for (const k of mobileCandidates) if (post[k] !== undefined) return post[k];
        for (const k of desktopCandidates) if (post[k] !== undefined) return post[k];
      } else {
        for (const k of desktopCandidates) if (post[k] !== undefined) return post[k];
        for (const k of mobileCandidates) if (post[k] !== undefined) return post[k];
      }
      return undefined;
    }
    const vboxWVal = pickBox('mediaBoxW');
    const vboxHVal = pickBox('mediaBoxH');
    const shared = `class="visual-post compare center" style="--post-height:${height}px; --vbox-w:${px(vboxWVal, '100%')}; --vbox-h:${px(vboxHVal, 'auto')};"`;

    // Create img tags; we'll also set an inline style on the vp-media-frame to
    // ensure the compare wrapper measures at the intended pixel dimensions
    // (important when source images are very large).
    const beforeTag = `<img class="content-image" src="${post.media}" draggable="false" alt="before">`;
    const afterTag = `<img class="content-image" src="${post.media2}" draggable="false" alt="after">`;

    // Inline style for explicit frame sizing so the compare area matches the
    // post-specified media box. px() already appends 'px' when numeric.
    // If both width and height are numeric we also emit an aspect-ratio so
    // the element can scale proportionally when the viewport is narrower than
    // the requested pixel width (important for phone usage).
    let frameStyle = `style="width: ${px(vboxWVal, '100%')};`;
    if (vboxWVal && vboxHVal && typeof vboxWVal === 'number' && typeof vboxHVal === 'number') {
      // aspect-ratio takes the form 'width / height' and allows the browser to
      // compute height when width is constrained (e.g., max-width:100%).
      frameStyle += ` aspect-ratio: ${vboxWVal} / ${vboxHVal};`;
    } else {
      // If exact height is provided but not both numbers, set height as a fallback
      frameStyle += ` height: ${px(vboxHVal, 'auto')};`;
    }
    frameStyle += '"';

    const inner = `
      <div class="vp-media-wrap">
        <div class="vp-media-frame" ${frameStyle}>
          <div class="compare-wrapper">
            <div class="before">${beforeTag}</div>
            <div class="after">${afterTag}</div>
            <div class="scroller" role="slider" aria-label="Compare slider" aria-valuemin="0" aria-valuemax="100">
              <svg class="scroller__thumb" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="0 50 37 68 37 32 0 50" style="fill:#fff"/><polygon points="100 50 64 32 64 68 100 50" style="fill:#fff"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div class="visual-caption">${post.caption || ''}</div>`;

    const html = `<section ${shared}>${inner}</section>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);

    // Initialize interactive behaviour for this compare instance
    initCompare(node);
  }

  // Initialize a compare slider for a visual-post.compare node
  function initCompare(sectionEl) {
    const wrapper = sectionEl.querySelector('.compare-wrapper');
    if (!wrapper) return;
    const scroller = wrapper.querySelector('.scroller');
    const after = wrapper.querySelector('.after');
    let active = false;
    // store fractional position to preserve on resize
    let frac = 0.25;

    function setPosFromPixel(x) {
      const rect = wrapper.getBoundingClientRect();
      let rel = x - rect.left;
      let w = wrapper.offsetWidth || rect.width || 1;
      let transform = Math.max(0, Math.min(rel, w));
      frac = transform / w;
      after.style.width = transform + 'px';
      scroller.style.left = (transform - (scroller.offsetWidth / 2)) + 'px';
      // lock image pixel sizes to avoid layout/reflow when moving the scroller
      const imgs = wrapper.querySelectorAll('.content-image');
      imgs.forEach(img => {
        img.style.width = w + 'px';
        img.style.height = wrapper.offsetHeight + 'px';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center center';
      });
      // update ARIA value
      const ariaVal = Math.round((frac * 100));
      scroller.setAttribute('aria-valuenow', ariaVal);
    }

    function scrollIt(x) { setPosFromPixel(x); }

    // mouse
    scroller.addEventListener('mousedown', function (e) {
      active = true;
      scroller.classList.add('scrolling');
      e.preventDefault();
    });
    document.body.addEventListener('mouseup', function () {
      active = false;
      scroller.classList.remove('scrolling');
    });
    document.body.addEventListener('mouseleave', function () {
      active = false;
      scroller.classList.remove('scrolling');
    });
    document.body.addEventListener('mousemove', function (e) {
      if (!active) return;
      scrollIt(e.pageX);
    });

    // touch
    scroller.addEventListener('touchstart', function (e) {
      active = true;
      scroller.classList.add('scrolling');
      e.preventDefault();
    }, { passive: false });
    document.body.addEventListener('touchend', function () {
      active = false;
      scroller.classList.remove('scrolling');
    });
    document.body.addEventListener('touchcancel', function () {
      active = false;
      scroller.classList.remove('scrolling');
    });
    document.body.addEventListener('touchmove', function (e) {
      if (!active) return;
      const t = e.touches[0];
      scrollIt(t.pageX);
    }, { passive: false });

    // allow dragging by clicking on wrapper to jump
    wrapper.addEventListener('click', function (e) {
      setPosFromPixel(e.pageX);
    });

    // preserve fraction on resize
    function onResize() {
      const w = wrapper.offsetWidth || wrapper.getBoundingClientRect().width || 1;
      const px = Math.round(frac * w);
      after.style.width = px + 'px';
      scroller.style.left = (px - (scroller.offsetWidth / 2)) + 'px';
      // update locked image pixel dimensions on resize
      const imgs = wrapper.querySelectorAll('.content-image');
      imgs.forEach(img => {
        img.style.width = w + 'px';
        img.style.height = wrapper.offsetHeight + 'px';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center center';
      });
    }
    window.addEventListener('resize', onResize);

    // initial state: ensure images are sized once loaded and open a bit so both are visible
    const imgs = wrapper.querySelectorAll('.content-image');
    let loaded = 0;
    function oneLoaded() {
      loaded += 1;
      if (loaded >= imgs.length) {
        // size images to wrapper and set initial position
        const w = wrapper.offsetWidth || wrapper.getBoundingClientRect().width || 1;
        imgs.forEach(img => {
          img.style.width = w + 'px';
          img.style.height = wrapper.offsetHeight + 'px';
          img.style.objectFit = 'contain';
          img.style.objectPosition = 'center center';
        });
        const initPx = Math.min(150, Math.round(wrapper.offsetWidth * 0.25));
        setPosFromPixel(wrapper.getBoundingClientRect().left + initPx);
      }
    }
    imgs.forEach(img => {
      if (img.complete) oneLoaded(); else img.addEventListener('load', oneLoaded);
    });
  }

  (async function run() {
    try {
      const res = await fetch('posts.json');
      const posts = await res.json();

      posts.forEach(post => {
        if (post.type === 'visual') {
          // support a compare subtype inside visual posts
          if (post.subtype === 'compare' || post.compare === true) {
            makeCompare(post);
          } else {
            makeVisual(post);
          }
        } else {
          makeArticleCard(post);
        }
      });
    } catch (err) {
      console.error(err);
      const postsEl = document.querySelector('.posts');
      if (postsEl) postsEl.innerHTML = '<p style="color:#fca5a5;">Could not load posts.json</p>';
    }
  })();

  // Header video: ensure playsinline on iOS and safe autoplay
  document.addEventListener('DOMContentLoaded', () => {
    const vid = document.querySelector('.hero-video');
    if (vid) {
      vid.setAttribute('playsinline', '');
      const play = () => vid.play().catch(() => { });
      if (vid.readyState >= 2) play(); else vid.addEventListener('loadeddata', play);
    }
  });
})();