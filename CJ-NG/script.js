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
      const initials = user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      container.innerHTML = `
        <div class="nav-profile" id="navProfile" onclick="toggleProfileMenu(event)">
          <div class="nav-avatar">${initials}</div>
          <div class="nav-profile-dropdown" id="profileDropdown">
            <div class="profile-drop-head">
              <div class="profile-drop-avatar">${initials}</div>
              <div style="min-width:0">
                <div class="profile-drop-name">${user.name}</div>
                <div class="profile-drop-email">${user.email}</div>
              </div>
            </div>
            <div class="profile-drop-menu">
              <a href="menu.html" class="profile-drop-item" onclick="closeProfileDropdown()">
                <span class="pdi-icon"></span> Menu
              </a>
              <a href="menu.html#myorders" class="profile-drop-item" onclick="closeProfileDropdown()">
                <span class="pdi-icon"></span> My Orders
              </a>
              ${user.is_admin ? `<a href="admin.html" class="profile-drop-item"><span class="pdi-icon"></span> Admin Panel</a>` : ''}
              <button class="profile-drop-item" onclick="openChangePwModal()">
                <span class="pdi-icon"></span> Change Password
              </button>
              <button class="profile-drop-item profile-drop-logout" onclick="logout()">
                <span class="pdi-icon">↩</span> Log Out
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="btn-login"  onclick="openModal('loginModal')">Login</button>
        <button class="btn-signup" onclick="openModal('signupModal')">Sign Up</button>
      `;
    }
  });
}

function toggleProfileMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

function closeProfileDropdown() {
  document.querySelectorAll('.nav-profile-dropdown.open').forEach(d => d.classList.remove('open'));
}

// Close profile dropdown when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-profile-dropdown.open').forEach(d => d.classList.remove('open'));
});

function logout() {
  clearUser();
  refreshNavAuth();
  if (window.location.pathname.includes('admin.html')) {
    window.location.href = 'homepage.html';
  }
}

/* ============================================================
   CHANGE PASSWORD MODAL (injected dynamically, no extra file)
============================================================ */
function openChangePwModal() {
  closeProfileDropdown();

  // Inject modal into DOM once
  if (!document.getElementById('changePwModal')) {
    const el = document.createElement('div');
    el.id = 'changePwModal';
    el.className = 'modal-overlay';
    el.onclick = e => { if (e.target === el) closeCPModal(); };
    el.innerHTML = `
      <div class="modal-box cp-modal-box">
        <div class="modal-header">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:700">Change Password</h2>
          <button class="modal-close" onclick="closeCPModal()">✕</button>
        </div>
        <div class="cp-body">
          <div class="cp-field">
            <label>Current Password</label>
            <div class="cp-input-wrap">
              <input type="password" id="cpCurrent" placeholder="Your current password" autocomplete="current-password"/>
              <button class="cp-eye" type="button" onclick="cpToggleEye('cpCurrent',this)">👁</button>
            </div>
          </div>
          <div class="cp-field">
            <label>New Password</label>
            <div class="cp-input-wrap">
              <input type="password" id="cpNew" placeholder="At least 6 characters" autocomplete="new-password" oninput="cpStrength(this.value)"/>
              <button class="cp-eye" type="button" onclick="cpToggleEye('cpNew',this)">👁</button>
            </div>
            <div class="cp-strength-bar"><div class="cp-strength-fill" id="cpStrFill"></div></div>
            <span class="cp-strength-lbl" id="cpStrLbl"></span>
          </div>
          <div class="cp-field">
            <label>Confirm New Password</label>
            <div class="cp-input-wrap">
              <input type="password" id="cpConfirm" placeholder="Re-enter new password" autocomplete="new-password"/>
              <button class="cp-eye" type="button" onclick="cpToggleEye('cpConfirm',this)">👁</button>
            </div>
          </div>
          <p class="modal-error" id="cpError"></p>
          <button class="cp-submit-btn" id="cpSubmitBtn" onclick="submitChangePw()">Update Password</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }

  // Reset every time it opens
  ['cpCurrent','cpNew','cpConfirm'].forEach(id => {
    const inp = document.getElementById(id);
    inp.value = ''; inp.type = 'password';
  });
  document.getElementById('cpError').textContent = '';
  document.getElementById('cpStrFill').style.width = '0';
  document.getElementById('cpStrFill').className = 'cp-strength-fill';
  document.getElementById('cpStrLbl').textContent = '';
  document.getElementById('cpStrLbl').className = 'cp-strength-lbl';
  const btn = document.getElementById('cpSubmitBtn');
  btn.disabled = false; btn.textContent = 'Update Password';
  document.getElementById('changePwModal').classList.add('open');
}

function closeCPModal() {
  document.getElementById('changePwModal')?.classList.remove('open');
}

function cpToggleEye(id, btn) {
  const inp = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '' : '👁';
}

function cpStrength(pw) {
  const fill = document.getElementById('cpStrFill');
  const lbl  = document.getElementById('cpStrLbl');
  if (!pw) { fill.style.width='0'; fill.className='cp-strength-fill'; lbl.textContent=''; return; }
  let s = 0;
  if (pw.length >= 6)            s++;
  if (pw.length >= 10)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const lvl = [
    { w:'20%', c:'cp-str-weak',   t:'Weak'   },
    { w:'40%', c:'cp-str-weak',   t:'Weak'   },
    { w:'60%', c:'cp-str-fair',   t:'Fair'   },
    { w:'80%', c:'cp-str-good',   t:'Good'   },
    { w:'100%',c:'cp-str-strong', t:'Strong' },
  ][Math.min(s, 4)];
  fill.style.width = lvl.w;
  fill.className   = 'cp-strength-fill ' + lvl.c;
  lbl.textContent  = lvl.t;
  lbl.className    = 'cp-strength-lbl ' + lvl.c;
}

async function submitChangePw() {
  const cur  = document.getElementById('cpCurrent').value;
  const nw   = document.getElementById('cpNew').value;
  const conf = document.getElementById('cpConfirm').value;
  const err  = document.getElementById('cpError');
  err.textContent = '';

  if (!cur || !nw || !conf)  { err.textContent = 'Please fill in all fields.'; return; }
  if (nw.length < 6)         { err.textContent = 'New password must be at least 6 characters.'; return; }
  if (nw !== conf)           { err.textContent = 'Passwords do not match.'; return; }
  if (cur === nw)            { err.textContent = 'New password must differ from current.'; return; }

  const btn = document.getElementById('cpSubmitBtn');
  btn.disabled = true; btn.textContent = 'Updating…';

  try {
    const fd = new FormData();
    fd.append('email',      getUser().email);
    fd.append('current_pw', cur);
    fd.append('new_pw',     nw);
    const data = await fetch('change_password.php', { method:'POST', body:fd }).then(r => r.json());
    if (data.success) {
      closeCPModal();
      showToast(' Password updated successfully!');
    } else {
      err.textContent = data.message || 'Failed. Please try again.';
      btn.disabled = false; btn.textContent = 'Update Password';
    }
  } catch {
    err.textContent = 'Server error. Please try again.';
    btn.disabled = false; btn.textContent = 'Update Password';
  }
}

/* ============================================================
   FORGOT PASSWORD — global function called from HTML link
============================================================ */
function openForgotModal() {
  closeModal('loginModal');
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotError').textContent = '';
  openModal('forgotModal');
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
     FORGOT PASSWORD — 3-step OTP flow
  ============================================================ */
  let _fpEmail = '';

  document.getElementById('forgotSendBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('forgotEmail').value.trim();
    const errEl = document.getElementById('forgotError');
    const btn   = document.getElementById('forgotSendBtn');
    errEl.textContent = '';
    if (!email) { errEl.textContent = 'Please enter your email.'; return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const fd = new FormData(); fd.append('email', email);
      const data = await fetch('send_otp.php', { method: 'POST', body: fd }).then(r => r.json());
      if (data.success) {
        _fpEmail = email;
        document.getElementById('otpEmailDisplay').textContent = email;
        document.getElementById('otpCode').value = '';
        document.getElementById('otpError').textContent = '';
        closeModal('forgotModal'); openModal('otpModal');
      } else { errEl.textContent = data.message || 'Failed to send OTP.'; }
    } catch { errEl.textContent = 'Network error. Please try again.'; }
    finally { btn.disabled = false; btn.textContent = 'Send OTP'; }
  });

  document.getElementById('otpVerifyBtn')?.addEventListener('click', async () => {
    const otp   = document.getElementById('otpCode').value.trim();
    const errEl = document.getElementById('otpError');
    const btn   = document.getElementById('otpVerifyBtn');
    errEl.textContent = '';
    if (!/^\d{6}$/.test(otp)) { errEl.textContent = 'Enter the 6-digit code.'; return; }
    btn.disabled = true; btn.textContent = 'Verifying…';
    try {
      const fd = new FormData(); fd.append('email', _fpEmail); fd.append('otp', otp);
      const data = await fetch('verify_otp.php', { method: 'POST', body: fd }).then(r => r.json());
      if (data.success) {
        document.getElementById('resetPassword').value = '';
        document.getElementById('resetConfirm').value  = '';
        document.getElementById('resetError').textContent = '';
        closeModal('otpModal'); openModal('resetModal');
      } else { errEl.textContent = data.message || 'Invalid OTP.'; }
    } catch { errEl.textContent = 'Network error. Please try again.'; }
    finally { btn.disabled = false; btn.textContent = 'Verify OTP'; }
  });

  document.getElementById('resetBtn')?.addEventListener('click', async () => {
    const pw    = document.getElementById('resetPassword').value;
    const conf  = document.getElementById('resetConfirm').value;
    const errEl = document.getElementById('resetError');
    const btn   = document.getElementById('resetBtn');
    errEl.textContent = '';
    if (pw.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if (pw !== conf)   { errEl.textContent = 'Passwords do not match.'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const fd = new FormData(); fd.append('email', _fpEmail); fd.append('password', pw);
      const data = await fetch('reset_password.php', { method: 'POST', body: fd }).then(r => r.json());
      if (data.success) {
        closeModal('resetModal'); _fpEmail = '';
        openModal('loginModal');
        const loginErr = document.getElementById('loginModalError');
        loginErr.style.color = 'green';
        loginErr.textContent = 'Password reset! Please log in.';
      } else { errEl.textContent = data.message || 'Reset failed.'; }
    } catch { errEl.textContent = 'Network error. Please try again.'; }
    finally { btn.disabled = false; btn.textContent = 'Reset Password'; }
  });

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