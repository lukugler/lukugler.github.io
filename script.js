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
      .visual-post .vp-media-frame {
        display: grid; place-items: center;
        width: var(--vbox-w, 100%); height: var(--vbox-h, auto);
        max-width: 100%;
        overflow: hidden;
        margin-inline: auto;
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
          width: 100% !important;
          height: auto !important;
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

      /* ---- Compare slider ---- */
      .visual-post.compare .compare-wrap {
        position: relative;
        width: var(--vbox-w, 100%);
        height: var(--vbox-h, auto);
        max-width: 100%;
        margin: 0 auto;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        background: #0b0b0b;
      }

      .visual-post.compare .compare-img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: contain;
        max-height: var(--post-height, 420px);
      }

      .visual-post.compare .compare-top {
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 50%;
        overflow: hidden;
        pointer-events: none;
      }

      .visual-post.compare .compare-top .compare-img {
        height: 100%;
        width: auto;
        min-width: 100%;
      }

      .visual-post.compare .compare-handle {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 28px; height: 28px; border-radius: 999px;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        border: 2px solid rgba(0,0,0,0.5);
        left: 50%;
        cursor: ew-resize;
        z-index: 4;
      }

      .visual-post.compare .compare-handle:before {
        content: '';
        position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
        width: 2px; height: 14px; background: rgba(0,0,0,0.6);
      }

      .visual-post.compare .visual-caption { padding: 8px 12px; }

      .visual-post.compare .compare-wrap.dragging .compare-handle {
        transition: none;
      }

      @media (max-width: 1100px) {
        .visual-post.compare .compare-wrap,
        .visual-post.compare .compare-img,
        .visual-post.compare .compare-top { width: 100% !important; height: auto !important; }
        .visual-post.compare .compare-top { position: absolute; }
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

    const mediaTag = post.mediaType === 'video'
      ? `<video src="${post.media}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''} poster="${post.poster || ''}"></video>`
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
            ${post.poster ? `<a class="btn" href="${post.poster}" target="_blank" rel="noopener">Poster</a>` : ''}
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

    const shared = `class="visual-post ${layout === 'two' ? 'two' : (layout === 'left' || layout === 'right' ? 'side ' + layout : 'center')}" style="--post-height:${height}px; --media-scale:${scale}; --vbox-w:${px(post.mediaBoxW, '100%')}; --vbox-h:${px(post.mediaBoxH, 'auto')};"`;

    const mediaTag = (src, type) => type === 'video'
      ? `<video class="visual-media" src="${src}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''}></video>`
      : `<img class="visual-media" src="${src}" alt="">`;

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
      inner = `
        <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
        <div class="visual-caption">${post.caption || ''}</div>`;
    }

    const html = `<section ${shared}>${inner}</section>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);
  }

  // Make a compare (swipe) post: two images stacked, draggable handle to reveal left/right
  function makeCompare(post) {
    const postsEl = document.querySelector('.posts');
    const height = post.height || 420;
    const scale = post.mediaScale || 1;

    const wrapperStyle = `class="visual-post compare" style="--post-height:${height}px; --media-scale:${scale}; --vbox-w:${px(post.mediaBoxW, '100%')}; --vbox-h:${px(post.mediaBoxH, 'auto')};"`;

    const html = `
      <section ${wrapperStyle}>
        <div class="compare-wrap">
          <img class="compare-img base" src="${post.media}" alt="">
          <div class="compare-top">
            <img class="compare-img top" src="${post.media2}" alt="">
          </div>
          <div class="compare-handle" tabindex="0" role="slider" aria-label="Image compare slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>
        </div>
        <div class="visual-caption">${post.caption || ''}</div>
      </section>`;

    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);

    // after appended, init slider behavior
    const compareWrap = node.querySelector('.compare-wrap');
    const top = compareWrap.querySelector('.compare-top');
    const handle = compareWrap.querySelector('.compare-handle');

    // set initial width to 50%
    function setPos(percent) {
      percent = Math.max(0, Math.min(100, percent));
      top.style.width = percent + '%';
      handle.style.left = percent + '%';
      handle.setAttribute('aria-valuenow', Math.round(percent));
    }

    setPos(50);

    let dragging = false;

    function clientToPercent(clientX) {
      const rect = compareWrap.getBoundingClientRect();
      const x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function onDown(e) {
      dragging = true;
      compareWrap.classList.add('dragging');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(clientToPercent(clientX));
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(clientToPercent(clientX));
      e.preventDefault();
    }

    function onUp() {
      dragging = false;
      compareWrap.classList.remove('dragging');
    }

    handle.addEventListener('mousedown', onDown);
    handle.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // allow clicking on the compare area to move the handle
    compareWrap.addEventListener('click', (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      setPos(clientToPercent(clientX));
    });

    // keyboard controls when handle focused
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      const val = Number(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setPos(val - step);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setPos(val + step);
      if (e.key === 'Home') setPos(0);
      if (e.key === 'End') setPos(100);
    });
  }

  (async function run() {
    try {
      const res = await fetch('posts.json');
      const posts = await res.json();

      posts.forEach(post => {
        if (post.type === 'visual') {
          makeVisual(post);
        } else if (post.type === 'compare') {
          makeCompare(post);
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