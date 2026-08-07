/* ZUN AI Roadmap — 오늘의 도전 · 내 성장 */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  /* ---------- 오늘의 도전 ---------- */
  ZUN.views.challenge = {
    subnav: { title: '오늘의 도전', cta: '<span class="t-caption">매일 5분</span>' },

    render() {
      const pool = window.ZUN_CHALLENGES.challenges;
      const ch = pool[ZUN.dayOfYear() % pool.length];
      const doneToday = !!ZUN.state().challenges[ZUN.todayKey()];
      const streak = ZUN.streakCount();
      const totalDone = Object.keys(ZUN.state().challenges).length;

      return `
      <section class="tile tile-light tile-center hero" style="padding-bottom:64px">
        <div class="tile-inner">
          <p class="eyebrow">Daily Challenge</p>
          <h1 class="t-display">오늘의 도전</h1>
          <p class="t-lead" style="margin-top:12px;color:var(--ink-48);font-size:21px">배운 것은 실제 도구에서 써야 실력이 돼요.<br>ChatGPT·Claude·Gemini 아무거나 열고, 지금 해보세요.</p>
          <div class="hero-stats" style="margin-top:32px">
            <div class="hero-stat"><b>🔥 ${streak}</b><span>연속 학습</span></div>
            <div class="hero-stat"><b>${totalDone}</b><span>완료한 도전</span></div>
            <div class="hero-stat"><b>+30</b><span>완료 시 XP</span></div>
          </div>
          <div class="card challenge-card">
            <p class="t-caption-strong" style="color:var(--blue)">TODAY · 약 ${ch.minutes}분</p>
            <h2 class="t-display-md" style="margin-top:8px">${esc(ch.title)}</h2>
            <p style="margin-top:12px">${esc(ch.task)}</p>
            <div class="challenge-example">${esc(ch.example)}</div>
            <p class="t-caption" style="color:var(--ink-48)">💡 ${esc(ch.tip)}</p>
            <div class="cta-row left">
              <button class="btn btn-utility" data-act="copy-example">예시 프롬프트 복사</button>
              ${doneToday
                ? '<span class="level-up-note" style="margin-top:0">오늘의 도전 완료 ✓ 내일 새 도전이 열려요</span>'
                : '<button class="btn btn-primary" data-act="done">해봤어요 — 완료 처리 (+30 XP)</button>'}
            </div>
          </div>
        </div>
      </section>`;
    },

    bind(root, rerender) {
      const pool = window.ZUN_CHALLENGES.challenges;
      const ch = pool[ZUN.dayOfYear() % pool.length];
      const copyBtn = root.querySelector('[data-act="copy-example"]');
      if (copyBtn) copyBtn.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(ch.example).then(() => {
          copyBtn.textContent = '복사됐어요 ✓';
          setTimeout(() => { copyBtn.textContent = '예시 프롬프트 복사'; }, 1600);
        });
      });
      const doneBtn = root.querySelector('[data-act="done"]');
      if (doneBtn) doneBtn.addEventListener('click', () => {
        ZUN.completeChallenge(ch.id);
        ZUN.refreshChrome();
        rerender();
      });
    },

    unbind() {},
  };

  /* ---------- 내 성장 ---------- */
  ZUN.views.profile = {
    subnav: { title: '내 성장', cta: '' },

    render() {
      const s = ZUN.state();
      const lv = ZUN.level();
      const tier = ZUN.tierOf(lv);
      const r = 80; const c = 2 * Math.PI * r;
      const off = c * (1 - lv / 100);
      const lessons = Object.keys(s.lessons).length;
      const streak = ZUN.streakCount();

      // 최근 14일 스트릭
      const days = [];
      for (let i = 13; i >= 0; i -= 1) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = ZUN.todayKey(d);
        days.push(`<span class="streak-day ${s.streakDays.includes(key) ? 'lit' : ''}" title="${key}"></span>`);
      }

      const badges = ZUN.BADGES.map((b) => {
        const owned = s.badges.includes(b.id);
        return `<div class="badge-cell ${owned ? '' : 'locked'}">
          <span class="b-emoji">${b.emoji}</span><b>${esc(b.name)}</b><span>${esc(b.desc)}</span>
        </div>`;
      }).join('');

      const nextTier = tier.key === 'zero' ? 'UP까지 ' + (40 - lv) : tier.key === 'up' ? 'NEXT까지 ' + (75 - lv) : '정상이에요';

      return `
      <section class="tile tile-dark on-dark">
        <div class="tile-inner">
          <div class="profile-hero">
            <svg class="profile-ring" viewBox="0 0 180 180" aria-label="AI 레벨 ${lv}">
              <circle class="ring-bg" cx="90" cy="90" r="${r}" fill="none" stroke-width="10"/>
              <circle class="ring-fg" cx="90" cy="90" r="${r}" fill="none" stroke-width="10"
                stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 90 90)"/>
              <text x="90" y="86" text-anchor="middle" style="font-size:44px;font-weight:600;fill:#fff">${lv}</text>
              <text x="90" y="112" text-anchor="middle" style="font-size:13px;fill:#ccc">AI LEVEL</text>
            </svg>
            <div class="profile-meta">
              <p class="t-fine">MY GROWTH · ZERO → UP → NEXT</p>
              <h1 class="t-display" style="margin-top:8px">${tier.name}</h1>
              <p class="muted" style="margin-top:6px">${esc(tier.desc)} · ${tier.key === 'next' ? esc(nextTier) : `${esc(String(nextTier))} 남았어요`}</p>
              <p class="muted" style="margin-top:14px">⭐ ${s.xp.toLocaleString()} XP · 🔥 ${streak}일 연속 · 🎖️ 배지 ${s.badges.length}/${ZUN.BADGES.length}</p>
              ${s.diagnostic ? '' : '<a class="btn btn-primary" style="margin-top:18px" href="#/diagnostic">진단부터 시작하기</a>'}
            </div>
          </div>
        </div>
      </section>

      <section class="tile tile-light tile-center">
        <div class="tile-inner">
          <h2 class="t-display-md">기록이 실력이에요</h2>
          <div class="stat-grid">
            <div class="stat-cell"><b>${lessons}<span style="font-size:17px;color:var(--ink-48)"> / 15</span></b><span>완료한 레슨</span></div>
            <div class="stat-cell"><b>${s.counts.quizPerfect}</b><span>퀴즈 만점</span></div>
            <div class="stat-cell"><b>${Object.keys(s.challenges).length}</b><span>완료한 도전</span></div>
            <div class="stat-cell"><b>${s.counts.analyzer}</b><span>프롬프트 분석</span></div>
          </div>
          <p class="t-caption-strong" style="margin-top:48px;color:var(--ink-80)">최근 14일</p>
          <div class="streak-days">${days.join('')}</div>
        </div>
      </section>

      <section class="tile tile-parchment tile-center">
        <div class="tile-inner">
          <h2 class="t-display-md">배지</h2>
          <p class="muted" style="margin-top:6px">배지 하나당 +50 XP. 전부 모으면 진짜 NEXT예요.</p>
          <div class="badge-grid">${badges}</div>
          <div class="cta-row">
            <button class="btn btn-pearl" data-act="reset">기록 초기화</button>
          </div>
          <p class="t-caption muted" style="margin-top:10px">학습 기록은 이 브라우저에만 저장돼요.</p>
        </div>
      </section>`;
    },

    bind(root, rerender) {
      const reset = root.querySelector('[data-act="reset"]');
      if (reset) reset.addEventListener('click', () => {
        if (window.confirm('정말 모든 학습 기록을 지울까요? 되돌릴 수 없어요.')) {
          ZUN.resetAll();
          ZUN.refreshChrome();
          rerender();
        }
      });
    },

    unbind() {},
  };
}());
