// ...existing code...
// Loads posts from posts.json and renders either article cards or visual blocks.
// Mobile behavior: text-first, media scales down without cropping, no fixed vh cap, description never truncated.
(function () {
  const postsEl = document.querySelector('.posts');

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
        .visual-post .vp-media-frame { width: 100% !important; height: auto !important; overflow: visible !important; }
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

  // --- Model viewer helpers (global scope) ---
  // helper: ensure model-viewer script is loaded once when needed
  function ensureModelViewerScript() {
    if (window._modelViewerScriptInjected) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    s.async = true;
    document.head.appendChild(s);
    window._modelViewerScriptInjected = true;
  }

  // Utility: detect mobile/iOS to avoid auto-instantiating heavy WebGL on phones
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  // Instantiate a model-viewer element inside the placeholder element
  function instantiateModelViewer(placeholderEl) {
    if (!placeholderEl) return;
    const src = placeholderEl.getAttribute('data-src');
    const title = placeholderEl.getAttribute('data-title') || '';
    const camOrbit = placeholderEl.getAttribute('data-camera-orbit') || '0deg 75deg 0.8m';
    const minFov = placeholderEl.getAttribute('data-min-fov') || '2deg';
    const maxFov = placeholderEl.getAttribute('data-max-fov') || '75deg';

    // load script then create element
    ensureModelViewerScript();

    const mv = document.createElement('model-viewer');
    mv.className = 'visual-media model-viewer-el';
    mv.setAttribute('src', src);
    mv.setAttribute('alt', title);
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('interaction-policy', 'allow');
    mv.setAttribute('min-field-of-view', minFov);
    mv.setAttribute('max-field-of-view', maxFov);
    mv.setAttribute('camera-orbit', camOrbit);
    // make it fill the frame
    mv.style.width = '100%';
    mv.style.height = '100%';

    // replace placeholder content
    placeholderEl.innerHTML = '';
    placeholderEl.appendChild(mv);
  }

  // Wire up one delegated click listener for model placeholders
  if (postsEl) {
    postsEl.addEventListener('click', function (e) {
      const btn = e.target.closest && e.target.closest('.model-load-btn');
      if (!btn) return;
      const placeholder = btn.closest('.model-placeholder');
      if (!placeholder) return;
      // instantiate model-viewer inside placeholder
      instantiateModelViewer(placeholder);
      // remove the button after loading
      try { btn.remove(); } catch (err) { }
    });
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

    // ...existing code...
  }

  function makeVisual(post) {
    const postsEl = document.querySelector('.posts');
    const layout = post.layout || 'center';
    const scale = post.mediaScale || 1;
    const height = post.height || 420;

    const shared = `class="visual-post ${layout === 'two' ? 'two' : (layout === 'left' || layout === 'right' ? 'side ' + layout : 'center')}" style="--post-height:${height}px; --media-scale:${scale}; --vbox-w:${px(post.mediaBoxW, '100%')}; --vbox-h:${px(post.mediaBoxH, 'auto')};"`;

    const shouldAutoplayVisual = (post.autoplay === undefined) ? true : Boolean(post.autoplay);

    // helper: ensure model-viewer script is loaded once when needed
    function ensureModelViewerScript() {
      if (window._modelViewerScriptInjected) return;
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      s.async = true;
      document.head.appendChild(s);
      window._modelViewerScriptInjected = true;
    }

    // Utility: detect mobile/iOS to avoid auto-instantiating heavy WebGL on phones
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    // Instantiate a model-viewer element inside the placeholder element
    function instantiateModelViewer(placeholderEl) {
      if (!placeholderEl) return;
      const src = placeholderEl.getAttribute('data-src');
      const title = placeholderEl.getAttribute('data-title') || '';
      const camOrbit = placeholderEl.getAttribute('data-camera-orbit') || '0deg 75deg 0.8m';
      const minFov = placeholderEl.getAttribute('data-min-fov') || '2deg';
      const maxFov = placeholderEl.getAttribute('data-max-fov') || '75deg';

      // load script then create element
      ensureModelViewerScript();

      const mv = document.createElement('model-viewer');
      mv.className = 'visual-media model-viewer-el';
      mv.setAttribute('src', src);
      mv.setAttribute('alt', title);
      mv.setAttribute('camera-controls', '');
      mv.setAttribute('auto-rotate', '');
      mv.setAttribute('exposure', '1');
      mv.setAttribute('interaction-policy', 'allow');
      mv.setAttribute('min-field-of-view', minFov);
      mv.setAttribute('max-field-of-view', maxFov);
      mv.setAttribute('camera-orbit', camOrbit);
      // make it fill the frame
      mv.style.width = '100%';
      mv.style.height = '100%';

      // replace placeholder content
      placeholderEl.innerHTML = '';
      placeholderEl.appendChild(mv);
    }

    const mediaTag = (src, type) => {
      const t = (type || '').toString().toLowerCase();
      const isModel = t === 'model' || (typeof src === 'string' && src.toLowerCase().endsWith('.glb'));
      if (isModel) {
        // On mobile devices (iPhone/iPad) we shouldn't auto-instantiate heavy WebGL
        // because it can cause crashes / automatic reloads. Instead render a lightweight
        // placeholder with a "Load 3D" button — the model-viewer is created only when
        // the user explicitly requests it.
        const camOrbit = post.cameraOrbit || post.camera_orbit || '0deg 75deg 0.8m';
        const minFov = post.minFov || post.minFov || '2deg';
        const maxFov = post.maxFov || post.maxFov || '75deg';
        if (isMobile) {
          const posterAttr = post.poster ? `data-poster="${post.poster}"` : '';
          return `<div class="model-placeholder" data-src="${src}" data-title="${(post.title || '')}" data-camera-orbit="${camOrbit}" data-min-fov="${minFov}" data-max-fov="${maxFov}">${post.poster ? `<img src="${post.poster}" alt="${post.title || ''}">` : '<div class="model-placeholder-cover">3D model</div>'}<button class="model-load-btn">Load 3D</button></div>`;
        }
        // Desktop: instantiate immediately
        ensureModelViewerScript();
        return `<model-viewer class="visual-media model-viewer-el" src="${src}" alt="${post.title || ''}" camera-controls auto-rotate exposure="1" interaction-policy="allow" min-field-of-view="2deg" max-field-of-view="75deg" camera-orbit="${camOrbit}"></model-viewer>`;
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
      if (post.mediaBoxW || post.mediaBoxH) {
        frameStyle = 'style="';
        frameStyle += `width: ${px(post.mediaBoxW, '100%')};`;
        if (post.mediaBoxW && post.mediaBoxH && typeof post.mediaBoxW === 'number' && typeof post.mediaBoxH === 'number') {
          frameStyle += ` aspect-ratio: ${post.mediaBoxW} / ${post.mediaBoxH};`;
        } else {
          frameStyle += ` height: ${px(post.mediaBoxH, 'auto')};`;
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
    const shared = `class="visual-post compare center" style="--post-height:${height}px; --vbox-w:${px(post.mediaBoxW, '100%')}; --vbox-h:${px(post.mediaBoxH, 'auto')};"`;

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
    let frameStyle = `style="width: ${px(post.mediaBoxW, '100%')};`;
    if (post.mediaBoxW && post.mediaBoxH && typeof post.mediaBoxW === 'number' && typeof post.mediaBoxH === 'number') {
      // aspect-ratio takes the form 'width / height' and allows the browser to
      // compute height when width is constrained (e.g., max-width:100%).
      frameStyle += ` aspect-ratio: ${post.mediaBoxW} / ${post.mediaBoxH};`;
    } else {
      // If exact height is provided but not both numbers, set height as a fallback
      frameStyle += ` height: ${px(post.mediaBoxH, 'auto')};`;
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