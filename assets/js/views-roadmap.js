/* ZUN AI Roadmap — 로드맵 (RPG 여정) */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  const TIER_BANDS = [
    { key: 'zero', name: 'ZERO', range: [1, 5], tileClass: 'tile-parchment', mapClass: '', head: '처음 만나는 AI', sub: 'AI가 뭔지, 어떻게 말을 거는지부터 시작해요.' },
    { key: 'up', name: 'UP', range: [6, 10], tileClass: 'tile-light', mapClass: '', head: '도구를 다루는 사람', sub: '도구를 골라 쓰고, 이미지와 영상까지 만들어요.' },
    { key: 'next', name: 'NEXT', range: [11, 15], tileClass: 'tile-dark on-dark', mapClass: 'on-dark-map', head: 'AI와 함께 생각하는 사람', sub: '자동화, AI 코딩, 에이전트 — 일하는 방식이 달라져요.' },
    { key: 'deep', name: 'NEXT 심화', range: [16, 20], tileClass: 'tile-dark-2 on-dark', mapClass: 'on-dark-map', head: '시스템을 만드는 사람', sub: '도구를 잇고, 나만의 방식을 만들고, 책임까지 지는 단계예요.' },
  ];

  // 처음 온 사람을 막지 않으면서 세계관을 알려주는 인라인 안내.
  // 모달로 가로막으면 첫인상이 나빠지므로, 로드맵 위에 접히는 카드로 둔다.
  const GUIDE = [
    {
      icon: '📊', title: 'AI 레벨은 0부터 100까지예요',
      body: '진단으로 시작 레벨이 정해지고, 레슨을 완료할 때마다 올라가요. 진단만으로는 60까지 — 그 위는 실제로 해봐야 도달할 수 있어요.',
    },
    {
      icon: '🗺️', title: 'ZERO → UP → NEXT 순서로 자라요',
      body: 'ZERO(0–39)는 AI와 말 트기, UP(40–74)은 도구를 골라 쓰기, NEXT(75–100)는 자동화와 에이전트까지. 여기에 NEXT 심화(LV.16–20)까지 더해 총 20개 레벨이 놓여 있어요.',
    },
    {
      icon: '🔥', title: 'XP·스트릭·배지는 기록이에요',
      body: 'XP는 쌓은 노력의 총량, 스트릭은 며칠 연속 했는지, 배지는 이정표예요. 레벨과 달리 줄어들지 않으니 편하게 모으세요.',
    },
  ];

  let guideStep = 0;

  function guideCard() {
    const s = ZUN.state();
    if (s.seenGuide) return '';
    const g = GUIDE[guideStep];
    const last = guideStep === GUIDE.length - 1;
    return `
    <div class="guide-card">
      <div class="guide-dots">
        ${GUIDE.map((_, i) => `<span class="guide-dot${i === guideStep ? ' is-on' : ''}"></span>`).join('')}
        <button class="guide-skip" data-guide-skip>건너뛰기</button>
      </div>
      <div class="guide-body">
        <span class="guide-icon">${g.icon}</span>
        <div>
          <h3>${esc(g.title)}</h3>
          <p>${esc(g.body)}</p>
        </div>
      </div>
      <div class="cta-row left" style="margin-top:16px">
        <button class="btn btn-primary" data-guide-next>${last ? '이해했어요, 시작할게요' : '다음'}</button>
      </div>
    </div>`;
  }

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

      this.subnav.cta = `<span class="t-caption">${done} / ${ZUN.totalLessons()} 완료</span><a class="btn btn-primary" href="${curId ? `#/lesson/${curId}` : '#/profile'}">${curId ? '이어서 학습' : '성장 기록 보기'}</a>`;

      const banner = s.diagnostic ? '' : `
        <div class="card" style="max-width:560px;margin:32px auto 0;text-align:center">
          <p class="t-body-strong">아직 진단 전이에요.<br>진단을 마치면 시작 지점과 집중 레벨이 맞춤으로 정해져요.</p>
          <div class="cta-row" style="margin-top:16px"><a class="btn btn-primary" href="#/diagnostic">5분 진단 받기</a></div>
        </div>`;

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
              <span class="lv-meta">${meta}${unlocked ? '' : '<span class="lock">🔒 미리보기</span>'}</span>`;
            // 잠긴 레슨도 링크로 열어 '무엇을 배우는지' 미리보기를 제공한다.
            const card = `<a class="level-card" href="#/lesson/${l.id}">${cardInner}</a>`;
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
          <p class="t-lead" style="margin-top:16px;color:var(--ink-48)">현재 AI 레벨 <b style="color:var(--ink)">${lv}</b> · ${tier.name} — 레슨 ${done}/${ZUN.totalLessons()} 완료</p>
          ${guideCard()}
          ${banner}
        </div>
      </section>
      ${sections}`;
    },

    bind(root, rerender) {
      const next = root.querySelector('[data-guide-next]');
      if (next) next.addEventListener('click', () => {
        if (guideStep < GUIDE.length - 1) { guideStep += 1; }
        else { ZUN.state().seenGuide = true; ZUN.save(); }
        rerender();
      });
      const skip = root.querySelector('[data-guide-skip]');
      if (skip) skip.addEventListener('click', () => {
        ZUN.state().seenGuide = true; ZUN.save(); rerender();
      });
    },
  };
}());
