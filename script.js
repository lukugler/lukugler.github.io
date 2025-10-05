// Loads posts from posts.json and renders either article cards or visual blocks.
// If a post's href ends with .md, it links through the Markdown viewer (articles/article.html?src=...)
(async function() {
  const postsEl = document.querySelector('.posts');
  if (!postsEl) return;

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

  function makeArticleCard(post) {
    const aHref = (post.href && post.href.endsWith('.md'))
      ? `articles/article.html?src=${encodeURIComponent(post.href)}&title=${encodeURIComponent(post.title||'')}&date=${encodeURIComponent(post.date||'')}`
      : (post.href || '#');

    const media = post.mediaType === 'video'
      ? `<video src="${post.media}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''} poster="${post.poster||''}"></video>`
      : `<img src="${post.media}" alt="">`;

    const badge = post.badge ? `<div class="badge">${post.badge}</div>` : '';

    const html = `
      <article class="card" style="--post-height:${(post.height||420)}px">
        <div class="media">${badge}${media}</div>
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
    const layout = post.layout || 'center';
    const scale = post.mediaScale || 1;
    const height = post.height || 420;
    const shared = `class="visual-post ${layout==='two' ? 'two' : (layout==='left'||layout==='right' ? 'side '+layout : 'center')}" style="--post-height:${height}px; --media-scale:${scale};"`;
    const mediaTag = (src, type) => type==='video' 
      ? `<video class="visual-media" src="${src}" ${post.autoplay ? 'autoplay muted loop playsinline' : ''}></video>`
      : `<img class="visual-media" src="${src}" alt="">`;

    let inner = '';
    if (layout === 'two') {
      inner = `
        <div class="two-grid">
          <div class="vp-media-wrap">${mediaTag(post.media, post.mediaType)}</div>
          <div class="vp-media-wrap">${mediaTag(post.media2, post.media2Type)}</div>
        </div>
        <div class="visual-caption">${post.caption||''}</div>`;
    } else if (layout === 'left' || layout === 'right') {
      inner = `
        <div class="vp-media-wrap">${mediaTag(post.media, post.mediaType)}</div>
        <div class="visual-caption">${post.caption||''}</div>`;
    } else {
      inner = `
        <div class="vp-media-wrap">${mediaTag(post.media, post.mediaType)}</div>
        <div class="visual-caption">${post.caption||''}</div>`;
    }

    const html = `<section ${shared}>${inner}</section>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    postsEl.appendChild(node);
    revealOnIntersect(node);
  }

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
    postsEl.innerHTML = '<p style="color:#fca5a5;">Could not load posts.json</p>';
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
