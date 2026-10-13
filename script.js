document.documentElement.classList.add('js');

// splash screen
const splash = document.getElementById('splash');
function hideSplash() { splash.classList.add('hide'); }
window.addEventListener('load', function () { setTimeout(hideSplash, 1300); });
setTimeout(hideSplash, 3000); // safety if load never fires

// light / dark theme
const root = document.documentElement;
const themeBtn = document.getElementById('theme');
let saved = null;
try { saved = localStorage.getItem('theme'); } catch (e) {}
if (saved === 'light') root.setAttribute('data-theme', 'light');

function syncIcon() {
  themeBtn.textContent = root.getAttribute('data-theme') === 'light' ? '☾' : '☀';
}
syncIcon();
themeBtn.addEventListener('click', function () {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  if (next === 'light') { root.setAttribute('data-theme', 'light'); }
  else { root.removeAttribute('data-theme'); }
  try { localStorage.setItem('theme', next); } catch (e) {}
  syncIcon();
});

// showcase tabs
const tabButtons = document.querySelectorAll('.tabs button');
const panels = document.querySelectorAll('.panel');
tabButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    tabButtons.forEach(function (b) { b.classList.remove('on'); });
    panels.forEach(function (p) { p.classList.remove('on'); });
    btn.classList.add('on');
    const shown = document.getElementById(btn.dataset.tab);
    shown.classList.add('on');
    stagger(shown);
  });
});

// contact form opens the visitor's email app
document.getElementById('mail-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('f-name').value;
  const msg = document.getElementById('f-msg').value;
  const subject = encodeURIComponent('Portfolio message from ' + name);
  const body = encodeURIComponent(msg + '\n\n' + name);
  window.location.href = 'mailto:beytullahayr12@gmail.com?subject=' + subject + '&body=' + body;
});

// fade sections in while scrolling
const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });

// photos: use every photo that loads, show initials only if none of them do
const swing = document.getElementById('swing');
const avatar = document.getElementById('avatar');
const photoList = ['photos/profile.jpg', 'photos/profile2.jpg'];
let workingPhotos = [];
let photoIndex = 0;

function initialsFallback() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110"><rect width="110" height="110" fill="#2a2a31"/>' +
    '<text x="55" y="68" font-size="40" font-weight="700" text-anchor="middle" fill="#f3f3f5" font-family="sans-serif">BA</text></svg>';
  avatar.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

if (avatar) {
  const found = [];
  let pending = photoList.length;
  photoList.forEach(function (src, i) {
    const img = new Image();
    function done() {
      pending--;
      if (pending === 0) {
        workingPhotos = found.filter(Boolean);
        if (workingPhotos.length === 0) initialsFallback();
        else avatar.src = workingPhotos[0];
      }
    }
    img.onload = function () { found[i] = src; done(); };
    img.onerror = done;
    img.src = src;
  });
}

// hanging badge: drag it with the mouse or finger, it swings back like a real lanyard
if (swing) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = swing.parentElement;
  let angle = 0;
  let vel = reduced ? 0 : 1.2;   // small push at the start
  let hover = 0;
  let dragging = false, moved = 0, startX = 0, startY = 0;

  function pivot() {
    const r = wrap.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  }

  function angleFromPointer(e) {
    const p = pivot();
    const dx = e.clientX - p.x;
    const dy = Math.max(e.clientY - p.y, 120);
    const a = -Math.atan(dx / dy) * 180 / Math.PI;
    return Math.max(-40, Math.min(40, a));
  }

  function tick() {
    if (!dragging) {
      vel += (hover - angle) * 0.02;
      vel *= reduced ? 0.9 : 0.975;
      angle += vel;
    }
    swing.style.transform = 'rotate(' + angle + 'deg)';
    requestAnimationFrame(tick);
  }

  // a tap (not a drag) switches to the next photo
  function swapPhoto() {
    if (workingPhotos.length < 2) return;
    photoIndex = (photoIndex + 1) % workingPhotos.length;
    avatar.src = workingPhotos[photoIndex];
  }

  swing.addEventListener('pointerdown', function (e) {
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startY = e.clientY;
    swing.classList.add('drag');
    swing.setPointerCapture(e.pointerId);
  });

  swing.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
    const target = angleFromPointer(e);
    vel = (target - angle) * 0.6;
    angle = target;
  });

  function release() {
    if (!dragging) return;
    dragging = false;
    swing.classList.remove('drag');
    if (moved < 6) swapPhoto();
  }
  swing.addEventListener('pointerup', release);
  swing.addEventListener('pointercancel', release);

  // moving the mouse over the card gives it a push
  swing.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse' && !dragging) vel += (Math.random() > 0.5 ? 1 : -1) * 2.5;
  });

  // card leans toward the mouse when it is not being dragged
  document.addEventListener('pointermove', function (e) {
    if (dragging || e.pointerType === 'touch') return;
    const p = pivot();
    hover = Math.max(-12, Math.min(12, -(e.clientX - p.x) / window.innerWidth * 24));
  });

  tick();
}

// certificates: click to enlarge, close with X, backdrop click or Esc
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lbImg = lightbox.querySelector('img');
  function closeLb() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  document.querySelectorAll('.cert').forEach(function (fig) {
    fig.addEventListener('click', function () {
      lbImg.src = fig.dataset.full;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.id === 'lb-close') closeLb();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
}

document.getElementById('year').textContent = new Date().getFullYear();

// page views: every menu link opens its own page with a transition
const viewNames = ['home', 'work', 'experience', 'resume', 'contact'];
const viewEls = Array.from(document.querySelectorAll('.view'));
const navLinks = document.querySelectorAll('.nav nav a');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentView = null, viewTimer = null;

function viewOf(el) { return el.dataset.view || el.id; }

function stagger(box) {
  box.querySelectorAll('.card, .cert, .tiles > div').forEach(function (el, i) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.style.setProperty('--i', i);
    el.classList.add('pop');
  });
}

function showView(name) {
  if (viewNames.indexOf(name) < 0) name = 'home';
  if (name === currentView) return;
  clearTimeout(viewTimer);
  const prev = viewEls.filter(function (el) { return viewOf(el) === currentView; });
  const next = viewEls.filter(function (el) { return viewOf(el) === name; });
  function enter() {
    viewEls.forEach(function (el) { el.classList.remove('active', 'leaving'); });
    next.forEach(function (el) { el.classList.add('active'); });
    currentView = name;
    window.scrollTo(0, 0);
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + name); });
    if (name === 'work') stagger(document.querySelector('.panel.on'));
  }
  if (prev.length && !calm) {
    prev.forEach(function (el) { el.classList.add('leaving'); });
    viewTimer = setTimeout(enter, 250);
  } else { enter(); }
}

document.addEventListener('click', function (e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const name = a.getAttribute('href').slice(1);
  if (viewNames.indexOf(name) < 0) return;
  e.preventDefault();
  if (location.hash.slice(1) !== name) location.hash = name; else showView(name);
});
window.addEventListener('hashchange', function () { showView(location.hash.slice(1)); });
showView(location.hash.slice(1));

// glow follows the mouse
document.addEventListener('pointermove', function (e) {
  root.style.setProperty('--mx', e.clientX + 'px');
  root.style.setProperty('--my', e.clientY + 'px');
});