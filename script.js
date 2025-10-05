// Loads posts from posts.json and renders either article cards or visual blocks.
// Media frames auto-match the page background.
// Per-post media frames via mediaBoxW/mediaBoxH. Two-column cards via layout: "media-left".
(function() {
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
  (function injectStyles(){
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

      /* ---- Card base + reveal effect hook (reuses your existing classes) ---- */
      .card { position: relative; display: block; min-height: var(--post-height, auto); }
      .card .media { display: flex; align-items: center; justify-content: center; }
      .card .media-frame {
        display: grid; place-items: center;
        width: var(--media-w, 100%); height: var(--media-h, auto);
        max-width: 100%;
        overflow: hidden; /* create the visible frame */
      }
      .card .media-frame > img,
      .card .media-frame > video {
        max-width: 100%; max-height: 100%;
        width: 100%; height: 100%;
        object-fit: contain; /* keep full image visible inside frame */
        display: block;
      }

      /* ---- Two-column card when layout === media-left ---- */
      .card.media-left {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: start;
      }
      .card.media-left .media { padding: 0; }
      .card.media-left .content { display: flex; flex-direction: column; gap: 8px; }

      /* ---- Visual posts: frame-controlled media size ---- */
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
        width: 100%; height: 100%; object-fit: contain; display: block;
      }

      /* ---- Existing layout variants still honored ---- */
      .visual-post.center { text-align: center; }
      .visual-post.side { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; }
      .visual-post.side.left .visual-caption { order: 2; }
      .visual-post.side.right .visual-caption { order: 1; }
      .visual-post.two .two-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

      /* ---- Responsive: columns become rows on small screens ---- */
      @media (max-width: 800px) {
        .card.media-left { grid-template-columns: 1fr; }
        .visual-post.side { grid-template-columns: 1fr; }
        .visual-post.two .two-grid { grid-template-columns: 1fr; }
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
      return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
    } catch(e) {
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
      ? `articles/article.html?src=${encodeURIComponent(post.href)}&title=${encodeURIComponent(post.title||'')}&date=${encodeURIComponent(post.date||'')}`
      : (post.href || '#');

    const mediaTag = post.mediaType === 'video'
      ? `<video src="${post.media}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''} poster="${post.poster||''}"></video>`
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
        <div class="media">
          <div class="media-frame" style="${mediaStyles}">
            ${badge}${mediaTag}
          </div>
        </div>
        <div class="content">
          <h3><a href="${aHref}">${post.title||''}</a></h3>
          <div class="meta">${post.date ? fmtDate(post.date) : ''}</div>
          <div class="excerpt">${post.excerpt||''}</div>
          <div class="actions">
            ${post.viewer ? `<a class="btn" href="${post.viewer}" target="_blank" rel="noopener">Viewer</a>` : ''}
            ${post.projectReport ? `<a class="btn" href="${post.projectReport}" target="_blank" rel="noopener">Project Report</a>` : ''}
            ${post.poster ? `<a class="btn" href="${post.poster}" target="_blank" rel="noopener">Poster</a>` : ''}
            ${aHref && aHref!=='#' ? `<a class="btn" href="${aHref}">Read</a>` : ''}
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

    const shared = `class="visual-post ${layout==='two' ? 'two' : (layout==='left'||layout==='right' ? 'side '+layout : 'center')}" style="--post-height:${height}px; --media-scale:${scale}; --vbox-w:${px(post.mediaBoxW, '100%')}; --vbox-h:${px(post.mediaBoxH, 'auto')};"`;

    const mediaTag = (src, type) => type==='video' 
      ? `<video class="visual-media" src="${src}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''}></video>`
      : `<img class="visual-media" src="${src}" alt="">`;

    let inner = '';
    if (layout === 'two') {
      inner = `
        <div class="two-grid">
          <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
          <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media2, post.media2Type)}</div></div>
        </div>
        <div class="visual-caption">${post.caption||''}</div>`;
    } else if (layout === 'left' || layout === 'right') {
      inner = `
        <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
        <div class="visual-caption">${post.caption||''}</div>`;
    } else {
      inner = `
        <div class="vp-media-wrap"><div class="vp-media-frame">${mediaTag(post.media, post.mediaType)}</div></div>
        <div class="visual-caption">${post.caption||''}</div>`;
    }

    const html = `<section ${shared}>${inner}</section>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);
  }

  (async function run(){
    try {
      const res = await fetch('posts.json');
      const posts = await res.json();

      posts.forEach(post => {
        if (post.type === 'visual') {
          makeVisual(post);
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
      const play = () => vid.play().catch(()=>{});
      if (vid.readyState >= 2) play(); else vid.addEventListener('loadeddata', play);
    }
  });
})();
