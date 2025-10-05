// --------------------------------------
// Footer year
// --------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// --------------------------------------
// Load and render posts
// --------------------------------------
async function loadPosts() {
  try {
    const res = await fetch('posts.json', { cache: 'no-store' });
    const posts = await res.json();
    const container = document.getElementById('posts');

    posts.forEach(post => {
      const el = (post.type === 'visual') ? renderVisual(post) : renderCard(post);
      container.appendChild(el);
    });

    revealOnScroll();
  } catch (e) {
    console.error('Could not load posts.json', e);
  }
}

// --------------------------------------
// Standard ARTICLE card (title/excerpt/link)
// Fixed-height via CSS var --post-height
// --------------------------------------
function renderCard(post) {
  const card = document.createElement('article');
  card.className = 'card';

  // Per-post overrides (optional)
  if (post.height)      card.style.setProperty('--post-height', post.height + 'px');  // numeric (e.g. 420)
  if (post.mediaScale)  card.style.setProperty('--media-scale', post.mediaScale);      // not used by card, but safe

  // Media
  const media = document.createElement('div');
  media.className = 'media';

  if (post.mediaType === 'video') {
    const v = document.createElement('video');
    v.src = post.media;
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    media.appendChild(v);
  } else if (post.media) {
    const img = document.createElement('img');
    img.src = post.media;
    img.alt = post.title || '';
    media.appendChild(img);
  }

  if (post.badge) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = post.badge;
    media.appendChild(b);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'content';

  if (post.title) {
    const h3 = document.createElement('h3');
    const link = document.createElement('a');
    link.href = post.href || '#';
    link.textContent = post.title;
    link.className = 'post-link';
    h3.appendChild(link);
    content.appendChild(h3);
  }

  if (post.date) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = post.date;
    content.appendChild(meta);
  }

  if (post.excerpt) {
    const excerpt = document.createElement('p');
    excerpt.className = 'excerpt';
    excerpt.textContent = post.excerpt;
    content.appendChild(excerpt);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'actions';
  if (post.href) {
    const readBtn = document.createElement('a');
    readBtn.className = 'btn';
    readBtn.href = post.href;
    readBtn.textContent = 'Read';
    actions.appendChild(readBtn);
  }
  if (post.code) {
    const codeBtn = document.createElement('a');
    codeBtn.className = 'btn';
    codeBtn.href = post.code;
    codeBtn.textContent = 'Source';
    actions.appendChild(codeBtn);
  }
  if (actions.children.length) content.appendChild(actions);

  card.append(media, content);
  return card;
}

// --------------------------------------
// VISUAL post (image/video)
// Supports layouts:
//   "center" (default), "left", "right", "two"
// Per-post control:
//   height: Number (px)  -> fixed block height
//   mediaScale: 0.3–1    -> relative width/area of media
//   caption: String      -> single-line text
//   media2: String       -> second media (when layout="two")
//   mediaType: "image"|"video"
//   media2Type: "image"|"video" (optional; defaults to mediaType)
// --------------------------------------
function renderVisual(post) {
  const layout = (post.layout || 'center').toLowerCase();

  // Root element
  const root = document.createElement('section');
  root.className = 'visual-post' + (layout === 'two' ? ' two' : (layout === 'left' || layout === 'right') ? ' side ' + layout : ' center');

  // Per-post overrides
  if (post.height)     root.style.setProperty('--post-height', post.height + 'px');
  if (post.mediaScale) root.style.setProperty('--media-scale', post.mediaScale); // e.g. 0.6 makes media narrower

  // Helper: create a media node (img/video) inside a wrap
  const makeMediaWrap = (src, type) => {
    const wrap = document.createElement('div');
    wrap.className = 'vp-media-wrap';
    const node = document.createElement((type === 'video') ? 'video' : 'img');
    node.src = src;
    node.className = 'visual-media';
    if (type === 'video') { node.autoplay = true; node.loop = true; node.muted = true; node.playsInline = true; }
    wrap.appendChild(node);
    return wrap;
  };

  if (layout === 'two') {
    // Two media side-by-side
    const grid = document.createElement('div');
    grid.className = 'two-grid';

    const media1 = makeMediaWrap(post.media, post.mediaType || 'image');
    grid.appendChild(media1);

    const secondSrc  = post.media2 || post.mediaAlt || null;   // accept either "media2" or "mediaAlt"
    const secondType = post.media2Type || post.mediaType || 'image';
    if (secondSrc) {
      const media2 = makeMediaWrap(secondSrc, secondType);
      grid.appendChild(media2);
    } else {
      // if no second media provided, duplicate the first to keep the layout balanced
      grid.appendChild(makeMediaWrap(post.media, post.mediaType || 'image'));
    }

    root.appendChild(grid);

    if (post.caption) {
      const cap = document.createElement('p');
      cap.className = 'visual-caption';
      cap.textContent = post.caption;
      root.appendChild(cap);
    }

  } else if (layout === 'left' || layout === 'right') {
    // Side-by-side: media on left OR right, caption on opposite side
    const mediaWrap = makeMediaWrap(post.media, post.mediaType || 'image');
    const cap = document.createElement('p');
    cap.className = 'visual-caption';
    cap.textContent = post.caption || '';

    // Order is handled by CSS (right layout flips columns using direction)
    root.append(mediaWrap, cap);

  } else {
    // CENTER: media centered with caption below
    const mediaWrap = makeMediaWrap(post.media, post.mediaType || 'image');
    root.appendChild(mediaWrap);

    if (post.caption) {
      const cap = document.createElement('p');
      cap.className = 'visual-caption';
      cap.textContent = post.caption;
      root.appendChild(cap);
    }
  }

  return root;
}

// --------------------------------------
// Reveal on scroll
// --------------------------------------
function revealOnScroll() {
  const targets = document.querySelectorAll('.card, .visual-post');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
}

// Init
loadPosts();
