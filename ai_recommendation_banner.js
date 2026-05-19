/**
 * ai_recommendation_banner.js
 * Drop this file next to your other scripts, then add ONE line to any page:
 *   <script src="ai_recommendation_banner.js"></script>
 *
 * The banner injects itself right after <body> opens (before the navbar).
 * Zero changes needed to existing HTML/CSS/JS.
 */

(function () {
  'use strict';

  // ── Styles ────────────────────────────────────────────────
  const CSS = `
  #ai-rec-banner {
    width: 100%;
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2010 55%, #1a1a1a 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.55s cubic-bezier(.4,0,.2,1), opacity 0.45s ease;
    position: relative;
    z-index: 200;
  }
  #ai-rec-banner.loaded {
    max-height: 120px;
    opacity: 1;
  }
  .ai-rec-inner {
    max-width: 1200px;
    width: 100%;
    padding: 0.75rem 2rem;
    display: flex;
    align-items: center;
    gap: 1.1rem;
    flex-wrap: wrap;
  }
  .ai-rec-spark {
    font-size: 1.3rem;
    flex-shrink: 0;
    animation: aiSpark 2.8s ease-in-out infinite;
  }
  @keyframes aiSpark {
    0%,100% { transform: scale(1) rotate(0deg); }
    50%      { transform: scale(1.18) rotate(8deg); }
  }
  .ai-rec-label {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #c8894b;
    white-space: nowrap;
    flex-shrink: 0;
    background: rgba(200,137,75,0.15);
    padding: 0.22rem 0.65rem;
    border-radius: 50px;
    border: 1px solid rgba(200,137,75,0.3);
  }
  .ai-rec-divider {
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,0.12);
    flex-shrink: 0;
  }
  .ai-rec-content {
    flex: 1;
    min-width: 0;
  }
  .ai-rec-dish-name {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 700;
    color: #f5e6d3;
    display: inline;
    margin-right: 0.45rem;
  }
  .ai-rec-text {
    font-size: 0.83rem;
    color: rgba(255,255,255,0.75);
    line-height: 1.55;
    display: inline;
  }
  .ai-rec-price {
    font-size: 0.78rem;
    font-weight: 700;
    color: #c8894b;
    background: rgba(200,137,75,0.14);
    border: 1px solid rgba(200,137,75,0.25);
    border-radius: 6px;
    padding: 0.18rem 0.6rem;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .ai-rec-btn {
    flex-shrink: 0;
    padding: 0.48rem 1.2rem;
    background: #c8894b;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s, transform 0.15s;
    letter-spacing: 0.01em;
  }
  .ai-rec-btn:hover { background: #a86e38; transform: scale(1.04); }
  .ai-rec-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: rgba(255,255,255,0.35);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.2rem 0.3rem;
    transition: color 0.2s;
    line-height: 1;
  }
  .ai-rec-close:hover { color: #fff; }
  .ai-rec-skeleton {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex: 1;
  }
  .ai-rec-skel-line {
    height: 10px;
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    animation: aiShimmer 1.4s ease-in-out infinite;
  }
  @keyframes aiShimmer {
    0%,100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
  @media (max-width: 640px) {
    .ai-rec-inner { padding: 0.7rem 1rem; gap: 0.7rem; }
    .ai-rec-divider { display: none; }
    .ai-rec-price { display: none; }
    .ai-rec-dish-name { font-size: 0.9rem; }
    .ai-rec-text { font-size: 0.78rem; }
  }
  `;

  // ── Inject <style> ────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── Build banner HTML (skeleton state) ───────────────────
  const banner = document.createElement('div');
  banner.id = 'ai-rec-banner';
  banner.innerHTML = `
    <div class="ai-rec-inner">
      <span class="ai-rec-spark">✨</span>
      <span class="ai-rec-label">Today's Pick</span>
      <div class="ai-rec-divider"></div>
      <div class="ai-rec-skeleton">
        <div class="ai-rec-skel-line" style="width:55%"></div>
        <div class="ai-rec-skel-line" style="width:25%"></div>
      </div>
    </div>
  `;

  // Insert as very first child of <body>
  document.body.insertBefore(banner, document.body.firstChild);

  // Reveal with skeleton
  requestAnimationFrame(() => banner.classList.add('loaded'));

  // ── Fetch recommendation ──────────────────────────────────
  fetch('/cj-ng/get_recommendation.php')
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error('No recommendation');

      const dish   = data.dish;
      const text   = data.ai_text || '';
      const price  = parseFloat(dish.price).toFixed(2);

      banner.querySelector('.ai-rec-inner').innerHTML = `
        <span class="ai-rec-spark">✨</span>
        <span class="ai-rec-label">Today's Pick</span>
        <div class="ai-rec-divider"></div>
        <div class="ai-rec-content">
          <span class="ai-rec-dish-name">${escBanner(dish.name)}</span>
          <span class="ai-rec-text">${escBanner(text)}</span>
        </div>
        <span class="ai-rec-price">रू ${price}</span>
        <button class="ai-rec-btn" onclick="scrollToMenuDish(${dish.id})">Order Now →</button>
        <button class="ai-rec-close" onclick="dismissRecBanner()" title="Dismiss">✕</button>
      `;
    })
    .catch(() => {
      // Silently hide on error — don't break the page
      banner.style.display = 'none';
    });

  // ── Helpers ───────────────────────────────────────────────
  window.dismissRecBanner = function () {
    const b = document.getElementById('ai-rec-banner');
    if (!b) return;
    b.style.maxHeight = '0';
    b.style.opacity   = '0';
    setTimeout(() => b.remove(), 500);
  };

  // Scrolls to the dish card on menu.html (or redirects if on another page)
  window.scrollToMenuDish = function (dishId) {
    // If we're already on menu.html, find the card and highlight it
    const grid = document.getElementById('menuGrid');
    if (grid) {
      // Make sure All category is selected and search is cleared
      const allBtn = document.querySelector('.cat-btn[data-cat="all"]');
      if (allBtn && !allBtn.classList.contains('active')) allBtn.click();
      const search = document.getElementById('menuSearch');
      if (search && search.value) { search.value = ''; if (typeof filterMenu === 'function') filterMenu(); }

      setTimeout(() => {
        // Cards are rendered dynamically; find by scanning card names
        const cards = grid.querySelectorAll('.menu-card');
        // Highlight first card that matches — fallback: just scroll to grid
        if (cards.length) {
          cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } else {
      // Navigate to menu page
      window.location.href = 'menu.html';
    }
  };

  function escBanner(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();