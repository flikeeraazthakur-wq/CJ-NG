/* ============================================================
   AUTH HELPERS  (localStorage-based session)
============================================================ */
function getUser()      { try { return JSON.parse(localStorage.getItem('cjnj_user')); } catch { return null; } }
function setUser(u)     { localStorage.setItem('cjnj_user', JSON.stringify(u)); }
function clearUser()    { localStorage.removeItem('cjnj_user'); }
function isLoggedIn()   { return !!getUser(); }

/* ============================================================
   NAVBAR — update auth buttons based on session
============================================================ */
function refreshNavAuth() {
  const user = getUser();
  const authContainers = document.querySelectorAll('.nav-auth, .nav-mobile-auth');

  authContainers.forEach(container => {
    if (user) {
      container.innerHTML = `
        <span class="nav-username">👋 ${user.name}</span>
        ${user.is_admin ? `<a href="admin.html" class="btn-login" style="text-decoration:none;text-align:center">⚙️ Admin</a>` : ''}
        <button class="btn-login" onclick="logout()">Logout</button>
      `;
    } else {
      container.innerHTML = `
        <button class="btn-login"  onclick="openModal('loginModal')">Login</button>
        <button class="btn-signup" onclick="openModal('signupModal')">Sign Up</button>
      `;
    }
  });
}

function logout() {
  clearUser();
  refreshNavAuth();
  // Redirect home from any protected page (not menu — menu is now public)
  if (window.location.pathname.includes('admin.html')) {
    window.location.href = 'homepage.html';
  }
}

/* ============================================================
   MODAL HELPERS
============================================================ */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  const errEl = document.querySelector(`#${id} .modal-error`);
  if (errEl) errEl.textContent = '';
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ============================================================
   LOGIN
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errEl    = document.getElementById('loginModalError');
      errEl.textContent = '';

      if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in…';

      try {
        const fd = new FormData();
        fd.append('email', email);
        fd.append('password', password);

        const res  = await fetch('login.php', { method: 'POST', body: fd });
        const data = await res.json();

        if (data.success) {
          setUser({ name: data.name || email.split('@')[0], email, is_admin: data.is_admin || false });
          closeModal('loginModal');
          refreshNavAuth();
          showToast(`Welcome back, ${getUser().name}! 🎉`);
        } else {
          errEl.textContent = data.message || 'Login failed.';
        }
      } catch {
        errEl.textContent = 'Server error. Please try again.';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    });
  }

  /* ============================================================
     SIGN UP
  ============================================================ */
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const name     = document.getElementById('signupName').value.trim();
      const email    = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const errEl    = document.getElementById('signupModalError');
      errEl.textContent = '';

      if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
      if (password.length < 6)          { errEl.textContent = 'Password must be at least 6 characters.'; return; }

      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating account…';

      try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('email', email);
        fd.append('password', password);

        const res  = await fetch('signup.php', { method: 'POST', body: fd });
        const data = await res.json();

        if (data.success) {
          setUser({ name, email });
          closeModal('signupModal');
          refreshNavAuth();
          showToast(`Account created! Welcome, ${name}! 🎉`);
        } else {
          errEl.textContent = data.message || 'Signup failed.';
        }
      } catch {
        errEl.textContent = 'Server error. Please try again.';
      } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
      }
    });
  }

  /* ============================================================
     HAMBURGER
  ============================================================ */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  /* ============================================================
     SCROLL REVEAL
  ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  }

  // Menu is now public — no login guard needed here

  /* init */
  refreshNavAuth();
});

/* ============================================================
   CAROUSEL
============================================================ */
const dishes = [
  { img: 'images/chowmein.jpg',    label: 'Chicken Noodles', emoji: '🍜' },
  { img: 'images/shirmp.jpg',       label: 'Shrimp Fry',      emoji: '🦐' },
  { img: 'images/pasta.jpg',        label: 'Pasta',           emoji: '🍝' },
  { img: 'images/BBQ Stick.jpg',    label: 'BBQ Stick',       emoji: '🍖' },
  { img: 'images/buffalowing.jpg',  label: 'Buffalo Wing',    emoji: '🍗' },
];

let carouselStart = 0; // index of leftmost visible dish

function renderCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const sizes  = ['sz-xs', 'sz-sm', 'sz-main', 'sz-sm', 'sz-xs'];
  const n      = dishes.length;
  track.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const d   = dishes[(carouselStart + i) % n];
    const isMain = i === 2;

    const item = document.createElement('div');
    item.className = 'dish-item';
    item.innerHTML = `
      <div class="dish-circle ${sizes[i]}">
        <img src="${d.img}" alt="${d.label}"
             onerror="this.style.display='none';this.parentElement.innerHTML='${d.emoji}'"/>
      </div>
      ${isMain ? `<span class="dish-label">${d.label}</span>` : ''}
    `;
    track.appendChild(item);

    if (i < 4) {
      const conn = document.createElement('div');
      conn.className = 'connector';
      track.appendChild(conn);
    }
  }
}

function nextDish() {
  carouselStart = (carouselStart + 1) % dishes.length;
  renderCarousel();
}
function prevDish() {
  carouselStart = (carouselStart - 1 + dishes.length) % dishes.length;
  renderCarousel();
}

// Init carousel if track exists
if (document.getElementById('carouselTrack')) renderCarousel();

/* ============================================================
   TOAST NOTIFICATION
============================================================ */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-show'));
  setTimeout(() => {
    t.classList.remove('toast-show');
    setTimeout(() => t.remove(), 400);
  }, 3000);
}