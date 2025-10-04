// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Load posts from posts.json and render
async function loadPosts() {
  try {
    const res = await fetch('posts.json');
    const posts = await res.json();
    const container = document.getElementById('posts');
    posts.forEach(post => container.appendChild(renderCard(post)));
    revealOnScroll();
  } catch (e) {
    console.error('Could not load posts.json', e);
  }
}

function renderCard(post) {
  const card = document.createElement('article');
  card.className = 'card';

  const media = document.createElement('div');
  media.className = 'media';

  if (post.mediaType === 'video') {
    const v = document.createElement('video');
    v.src = post.media;
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    media.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = post.media;
    img.alt = post.title;
    media.appendChild(img);
  }
  if (post.badge) { const b = document.createElement('span'); b.className='badge'; b.textContent = post.badge; media.appendChild(b); }

  const content = document.createElement('div');
  content.className = 'content';
  const h3 = document.createElement('h3');
  const link = document.createElement('a'); link.href = post.href || '#'; link.textContent = post.title; link.className='post-link';
  h3.appendChild(link);

  const meta = document.createElement('div'); meta.className = 'meta';
  meta.textContent = [post.date, (post.tags||[]).join(' • ')].filter(Boolean).join(' • ');

  const excerpt = document.createElement('p'); excerpt.className = 'excerpt'; excerpt.textContent = post.excerpt || '';

  const actions = document.createElement('div'); actions.className = 'actions';
  if (post.href) {
    const readBtn = document.createElement('a'); readBtn.className='btn'; readBtn.href=post.href; readBtn.textContent='Read'; actions.appendChild(readBtn);
  }
  if (post.code) {
    const codeBtn = document.createElement('a'); codeBtn.className='btn'; codeBtn.href=post.code; codeBtn.textContent='Source'; actions.appendChild(codeBtn);
  }
  content.append(h3, meta, excerpt, actions);
  card.append(media, content);
  return card;
}

// Reveal on scroll
function revealOnScroll() {
  const cards = document.querySelectorAll('.card');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  cards.forEach(c => io.observe(c));
}

loadPosts();
