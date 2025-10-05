// Set current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Load posts from posts.json and render
async function loadPosts() {
  try {
    // cache-bust to ensure you always see fresh changes
    const res = await fetch('posts.json?' + Date.now());
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

/* ---------- Standard article cards ---------- */
function renderCard(post) {
  const card = document.createElement('article');
  card.className = 'card';

  // Allow per-post height override (e.g. "height": 480 in posts.json)
  if (post.height) card.style.setProperty('--post-height', post.height + 'px');

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

  // Actions (buttons)
  const actions = document.createElement('div');
  actions.className = 'actions';

  // Poster button (opens PDF in new tab)
  if (post.poster) {
    const posterBtn = document.createElement('a');
    posterBtn.className = 'btn';
    posterBtn.href = post.poster;
    posterBtn.target = '_blank';
    posterBtn.rel = 'noopener';
    posterBtn.textContent = 'Poster';
    actions.appendChild(posterBtn);
  }

  // Viewer button (external web viewer)
  if (post.viewer) {
    const viewerBtn = document.createElement('a');
    viewerBtn.className = 'btn';
    viewerBtn.href = post.viewer;
    viewerBtn.target = '_blank';
    viewerBtn.rel = 'noopener';
    viewerBtn.textContent = 'Viewer';
    actions.appendChild(viewerBtn);
  }

  // Project Report button (external)
  if (post.projectReport) {
    const prBtn = document.createElement('a');
    prBtn.className = 'btn';
    prBtn.href = post.projectReport;
    prBtn.target = '_blank';
    prBtn.rel = 'noopener';
    prBtn.textContent = 'Project Report';
    actions.appendChild(prBtn);
  }

  // Read button (article page)
  if (post.href) {
    const readBtn = document.createElement('a');
    readBtn.className = 'btn';
    readBtn.href = post.href;
    readBtn.textContent = 'Read';
    actions.appendChild(readBtn);
  }

  if (actions.children.length) content.appendChild(actions);

  card.append(media, content);
  return card;
}

/* ---------- Visual-only posts ---------- */
function renderVisual(post) {
  const layout = (post.layout || 'center').toLowerCase();
  const root = document.createElement('section');
  root.className = 'visual-post' + (['left','right'].includes(layout) ? ' side ' + layout : (layout === 'two' ? ' two' : ' center'));

  if (post.height) root.style.setProperty('--post-height', post.height + 'px');
  if (post.mediaScale) root.style.setProperty('--media-scale', post.mediaScale);

  const makeMediaWrap = (src, type) => {
    const wrap = document.createElement('div');
    wrap.className = 'vp-media-wrap';
    const node = document.createElement(type === 'video' ? 'video' : 'img');
    node.src = src;
    node.className = 'visual-media';
    if (type === 'video') { node.autoplay = true; node.loop = true; node.muted = true; node.playsInline = true; }
    wrap.appendChild(node);
    return wrap;
  };

  if (layout === 'two') {
    const grid = document.createElement('div');
    grid.className = 'two-grid';
    grid.appendChild(makeMediaWrap(post.media, post.mediaType || 'image'));
    const secondSrc = post.media2 || post.mediaAlt || post.media;
    grid.appendChild(makeMediaWrap(secondSrc, post.media2Type || post.mediaType || 'image'));
    root.appendChild(grid);
    if (post.caption) {
      const cap = document.createElement('p');
      cap.className = 'visual-caption';
      cap.textContent = post.caption;
      root.appendChild(cap);
    }
  } else if (layout === 'left' || layout === 'right') {
    const mediaWrap = makeMediaWrap(post.media, post.mediaType || 'image');
    const cap = document.createElement('p');
    cap.className = 'visual-caption';
    cap.textContent = post.caption || '';
    root.append(mediaWrap, cap);
  } else {
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

/* ---------- Reveal on scroll ---------- */
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

// Go
loadPosts();
