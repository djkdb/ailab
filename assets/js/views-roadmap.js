/* ZUN AI Roadmap — 로드맵 (RPG 여정) */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  const TIER_BANDS = [
    { key: 'zero', name: 'ZERO', range: [1, 5], tileClass: 'tile-light', mapClass: '', head: '처음 만나는 AI', sub: 'AI가 뭔지, 어떻게 말을 거는지부터 시작해요.' },
    { key: 'up', name: 'UP', range: [6, 10], tileClass: 'tile-parchment', mapClass: '', head: '도구를 다루는 사람', sub: '도구를 골라 쓰고, 이미지와 영상까지 만들어요.' },
    { key: 'next', name: 'NEXT', range: [11, 15], tileClass: 'tile-dark on-dark', mapClass: 'on-dark-map', head: 'AI와 함께 생각하는 사람', sub: '자동화, AI 코딩, 에이전트 — 일하는 방식이 달라져요.' },
  ];

  function currentLevelId(s) {
    for (let i = 1; i <= window.ZUN_LESSONS.length; i += 1) {
      if (!s.lessons[i] && ZUN.isUnlocked(i)) return i;
    }
    return null;
  }

  ZUN.views.roadmap = {
    subnav: { title: '로드맵', cta: '' },

    render() {
      const s = ZUN.state();
      const done = Object.keys(s.lessons).length;
      const lv = ZUN.level();
      const tier = ZUN.tierOf(lv);
      const startLevel = s.diagnostic ? s.diagnostic.startLevel : 1;
      const curId = currentLevelId(s);

      this.subnav.cta = `<span class="t-caption">${done} / 15 완료</span><a class="btn btn-primary" href="${curId ? `#/lesson/${curId}` : '#/profile'}">${curId ? '이어서 학습' : '성장 기록 보기'}</a>`;

      const banner = s.diagnostic ? '' : `
      <section class="tile tile-parchment tile-center" style="padding:32px 24px">
        <div class="tile-inner">
          <p class="t-body-strong">아직 진단 전이에요. 진단을 마치면 시작 지점과 집중 레벨이 맞춤으로 정해져요.</p>
          <div class="cta-row" style="margin-top:16px"><a class="btn btn-primary" href="#/diagnostic">5분 진단 받기</a></div>
        </div>
      </section>`;

      const sections = TIER_BANDS.map((band) => {
        const rows = window.ZUN_LESSONS
          .filter((l) => l.id >= band.range[0] && l.id <= band.range[1])
          .map((l) => {
            const rec = s.lessons[l.id];
            const unlocked = ZUN.isUnlocked(l.id);
            const isCurrent = l.id === curId;
            const stateClass = rec ? 'done' : isCurrent ? 'current' : unlocked ? '' : 'locked';
            const skippable = !rec && unlocked && l.id < startLevel;
            const nodeInner = rec ? '✓' : unlocked ? l.id : '🔒';
            const meta = rec
              ? '<span class="done-check">완료 ✓</span>'
              : skippable
                ? '<span class="skip-note">진단 통과 — 복습 추천</span>'
                : `<span class="xp-chip">+${ZUN.XP_BY_TIER[ZUN.lessonTier(l.id)]} XP</span>`;
            const cardInner = `
              <span>
                <h3>LV.${l.id} · ${esc(l.title)}</h3>
                <p>${esc(l.subtitle)} · ${l.minutes}분</p>
              </span>
              <span class="lv-meta">${meta}${unlocked ? '' : '<span class="lock">이전 레벨 완료 시 해제</span>'}</span>`;
            const card = unlocked
              ? `<a class="level-card" href="#/lesson/${l.id}">${cardInner}</a>`
              : `<div class="level-card">${cardInner}</div>`;
            return `
            <div class="level-row ${stateClass}">
              <div class="level-node">${nodeInner}</div>
              ${card}
            </div>`;
          }).join('');

        return `
        <section class="tier-section ${band.tileClass}">
          <div class="tier-head">
            <p class="t-fine" style="color:${band.key === 'next' ? 'var(--blue-on-dark)' : 'var(--blue)'}">${band.name} · LV.${band.range[0]}–${band.range[1]}</p>
            <h2 class="t-display-md" style="margin-top:8px">${esc(band.head)}</h2>
            <p class="muted" style="margin-top:6px">${esc(band.sub)}</p>
          </div>
          <div class="levels ${band.mapClass}">${rows}</div>
        </section>`;
      }).join('');

      return `
      <section class="tile tile-light tile-center" style="padding-bottom:48px">
        <div class="tile-inner">
          <p class="eyebrow">My Roadmap</p>
          <h1 class="t-display">Zero → Up → Next</h1>
          <p class="t-lead" style="margin-top:16px;color:var(--ink-48)">현재 AI 레벨 <b style="color:var(--ink)">${lv}</b> · ${tier.name} — 레슨 ${done}/15 완료</p>
        </div>
      </section>
      ${banner}
      ${sections}`;
    },

    bind() { /* 링크 기반 — 추가 바인딩 없음 */ },
  };
}());
