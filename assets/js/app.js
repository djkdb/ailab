/* ZUN AI Roadmap — 라우터 & 부트스트랩 */
(function () {
  'use strict';
  const ZUN = window.ZUN;

  const app = document.getElementById('app');
  const subnav = document.getElementById('subnav');
  const subnavTitle = document.getElementById('subnav-title');
  const subnavCta = document.getElementById('subnav-cta');

  let activeView = null;

  const ROUTES = {
    '': 'home',
    home: 'home',
    diagnostic: 'diagnostic',
    roadmap: 'roadmap',
    lesson: 'lesson',
    library: 'library',
    review: 'review',
    lab: 'lab',
    challenge: 'challenge',
    profile: 'profile',
  };

  function parseHash() {
    const raw = window.location.hash.replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    const key = parts[0] || '';
    // 프로토타입 키(#/constructor 등)로 빈 화면이 되지 않게 own-property만 조회
    const name = Object.prototype.hasOwnProperty.call(ROUTES, key) ? ROUTES[key] : 'home';
    return { name, params: parts.slice(1) };
  }

  /* 상단 레벨 칩 + 활성 내비 갱신 */
  ZUN.refreshChrome = function () {
    const lv = ZUN.level();
    const tier = ZUN.tierOf(lv);
    const streak = ZUN.streakCount();
    const chip = document.getElementById('gnav-level');
    chip.innerHTML = `<span class="tier-dot" style="background:${tier.key === 'zero' ? '#86868b' : tier.key === 'up' ? '#2997ff' : '#ffffff'}"></span>`
      + `Lv.${lv} · ${tier.name}`
      + (streak > 0 ? `<span class="streak">🔥${streak}</span>` : '');
  };

  function setActiveNav(name) {
    // 레슨은 로드맵의 하위 화면이므로 로드맵 탭을 활성으로 본다
    const active = name === 'lesson' ? 'roadmap' : name;
    document.querySelectorAll('#gnav-links a, #tabbar a').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.nav === active);
    });
  }

  function observeReveals() {
    const els = app.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) return; // 미지원 → 그대로 표시

    const pending = [];
    els.forEach((el) => {
      // 뷰포트 아래에 있는 섹션만 숨겼다가 스크롤 시 등장
      if (el.getBoundingClientRect().top > window.innerHeight * 0.85) {
        el.classList.add('reveal-pending');
        pending.push(el);
      }
    });
    if (!pending.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    pending.forEach((el) => io.observe(el));

    // 안전장치 — 어떤 이유로든 관찰이 실패해도 콘텐츠는 반드시 보이게
    setTimeout(() => pending.forEach((el) => el.classList.add('is-visible')), 4000);
  }

  function renderRoute() {
    const { name, params } = parseHash();
    const view = ZUN.views[name];
    if (!view) return;

    if (activeView && activeView.unbind) activeView.unbind();
    activeView = view;

    const doRender = () => {
      app.innerHTML = `<div class="view-enter">${view.render(params)}</div>`;
      const sn = view.subnav || null;
      if (sn) {
        subnav.hidden = false;
        subnavTitle.textContent = sn.title || '';
        subnavCta.innerHTML = sn.cta || '';
      } else {
        subnav.hidden = true;
      }
      if (view.bind) view.bind(app, doRender);
      observeReveals();
    };

    doRender();
    setActiveNav(name);
    ZUN.refreshChrome();
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', () => {
    ZUN.refreshChrome();
    renderRoute();
  });
}());
