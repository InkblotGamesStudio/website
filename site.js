document.documentElement.classList.add('js');

// nav gets a backdrop once the page is scrolled
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// fade sections in as they enter the viewport
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Screenshot lightbox. Without JS the links still open the full image.
// mailing list: subscribe in place; if that fails, fall back to a normal form post
document.querySelectorAll('.signup').forEach((form) => {
  const note = form.querySelector('.signup-note');
  const button = form.querySelector('button');
  let fallback = false;

  form.addEventListener('submit', async (e) => {
    if (fallback) return;
    e.preventDefault();
    button.disabled = true;
    note.classList.remove('error');
    note.textContent = 'Subscribing…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') throw new Error('rejected');
      form.reset();
      note.textContent = 'Almost done. Check your email to confirm your subscription.';
    } catch {
      // let the browser post the form to Kit directly instead
      fallback = true;
      note.textContent = 'Opening the signup page…';
      form.requestSubmit();
      fallback = false;
    } finally {
      button.disabled = false;
    }
  });
});

// hero background footage: desktop only, skipped for reduced motion and data saver
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  const ok = matchMedia('(min-width: 48rem)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches
    && !(navigator.connection && navigator.connection.saveData);
  if (ok) {
    heroVideo.addEventListener('playing', () => heroVideo.classList.add('playing'), { once: true });
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.play().catch(() => {});
    // stop decoding while the hero is off screen
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) heroVideo.play().catch(() => {});
      else heroVideo.pause();
    }).observe(heroVideo);
  }
}

const links = [...document.querySelectorAll('.banner, .gallery a')];
if (links.length) initLightbox();

function initLightbox() {

const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

const dialog = document.createElement('dialog');
dialog.className = 'lightbox';
dialog.innerHTML = `
  <button class="lb-close" aria-label="Close">${icon('M6 6l12 12M18 6L6 18')}</button>
  <button class="lb-prev" aria-label="Previous screenshot">${icon('M15 5l-7 7 7 7')}</button>
  <figure>
    <img alt="">
    <figcaption></figcaption>
  </figure>
  <button class="lb-next" aria-label="Next screenshot">${icon('M9 5l7 7-7 7')}</button>`;
document.body.append(dialog);

const img = dialog.querySelector('img');
const caption = dialog.querySelector('figcaption');
let index = 0;

function show(i) {
  index = (i + links.length) % links.length;
  const thumb = links[index].querySelector('img');
  img.src = links[index].href;
  img.alt = thumb.alt;
  caption.textContent = `${index + 1} / ${links.length}`;
  // warm the neighbours so stepping feels instant
  for (const n of [index + 1, index - 1]) {
    new Image().src = links[(n + links.length) % links.length].href;
  }
}

links.forEach((link, i) => {
  link.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    show(i);
    dialog.showModal();
  });
});

dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));

// click on the backdrop (the dialog itself, not its contents) closes
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

dialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});

// return focus to the thumbnail that was being viewed
dialog.addEventListener('close', () => links[index].focus());

// swipe left/right on touch screens
let startX = null;
dialog.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
dialog.addEventListener('touchend', (e) => {
  if (startX === null) return;
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  startX = null;
});
}
