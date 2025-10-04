// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Load posts from posts.json and render
async function loadPosts() {
  try {
    const res = await fetch('posts.json');
    const posts = await res.json();
    const container = document.getElementById('posts');

    posts.forEach(post => {
      let element;
      // If post is a visual-only section (image/video with optional caption)
      if (post.type === 'visual') {
        element = renderVisual(post);
      } else {
        element = renderCard(post);
      }
      container.appendChild(element);
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

  // Media block
  const media = document.createElement('div');
  media.className = 'media';

  if (post.mediaType === 'video') {
    const v = document.createElement('video');
    v.src = post.media;
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    media.appendChild(v);
  } else if (post.media) {
    const img = document.createElement('img');
    img.src = post.media;
    img.alt = post.title || '';
    media.appendChild(img);
  }

  // Optional badge
  if (post.badge) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = post.badge;
    media.appendChild(b);
  }

  // Content area
  const content = document.createElement('div');
  content.className = 'content';

  // Title
  if (post.title) {
    const h3 = document.createElement('h3');
    const link = document.createElement('a');
    link.href = post.href || '#';
    link.textContent = post.title;
    link.className = 'post-link';
    h3.appendChild(link);
    content.appendChild(h3);
  }

  // Date (tags removed per your request)
  if (post.date) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = post.date;
    content.appendChild(meta);
  }

  // Excerpt
  if (post.excerpt) {
    const excerpt = document.createElement('p');
    excerpt.className = 'excerpt';
    excerpt.textContent = post.excerpt;
    content.appendChild(excerpt);
  }

  // Action buttons
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
  if (actions.children.length > 0) content.appendChild(actions);

  card.append(media, content);
  return card;
}

/* ---------- Visual-only posts (images / videos / short captions) ---------- */
function renderVisual(post) {
  const section = document.createElement('section');
  section.className = 'visual-post' + (post.layout === 'side' ? ' side' : '');

  // Image or video
  const media = document.createElement(post.mediaType === 'video' ? 'video' : 'img');
  media.src = post.media;
  media.className = 'visual-media';
  if (post.mediaType === 'video') {
    media.autoplay = true;
    media.loop = true;
    media.muted = true;
    media.playsInline = true;
  }
  section.appendChild(media);

  // Optional caption
  if (post.caption) {
    const caption = document.createElement('p');
    caption.className = 'visual-caption';
    caption.textContent = post.caption;
    section.appendChild(caption);
  }

  return section;
}

/* ---------- Reveal-on-scroll animation ---------- */
function revealOnScroll() {
  const observed = document.querySelectorAll('.card, .visual-post');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  observed.forEach(el => io.observe(el));
}

// Initialize
loadPosts();
