/* ZUN AI Roadmap — 홈 */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  // 히어로 체험 위젯 상태 — before(입력) → scored(점수) → improved(개선 후)
  let demoIdx = 0;
  let demoStage = 'before';
  let demoText = null;   // 사용자가 직접 고쳐 쓴 경우
  let demoScore = null;

  function demoWidget() {
    const d = window.ZUN_EXTRAS.heroDemos[demoIdx];
    const text = demoStage === 'improved' ? d.good : (demoText != null ? demoText : d.bad);
    const a = demoScore;

    const chips = window.ZUN_EXTRAS.heroDemos.map((x, i) => `
      <button class="demo-chip ${i === demoIdx ? 'is-active' : ''}" data-demo="${i}">${esc(x.label)}</button>`).join('');

    let panel = '';
    if (a) {
      const improved = demoStage === 'improved';
      panel = `
      <div class="demo-result ${improved ? 'is-good' : 'is-bad'}">
        <div class="demo-score">
          <span class="demo-num" data-demo-count>0</span>
          <span class="demo-grade">${esc(a.grade.name)}</span>
        </div>
        <div class="demo-verdict">
          <p>${improved
            ? `역할 · 맥락 · 형식 · 조건이 모두 들어갔어요.<br><b>${esc(d.gain)}</b>`
            : `AI는 이 말만 듣고는 <b>평균적인 답</b>밖에 못 줘요.<br>빠진 것: ${a.dims.filter((x) => !x.pass).slice(0, 4).map((x) => esc(x.label)).join(' · ')}`}</p>
          ${improved
            ? '<a class="btn btn-primary" href="#/diagnostic">그럼 내 AI 레벨은? →</a>'
            : '<button class="btn btn-primary" data-demo-fix>이렇게 바꾸면 →</button>'}
        </div>
      </div>`;
    }

    return `
    <div class="demo-box">
      <p class="demo-eyebrow">30초 체험 · 가입 없이</p>
      <p class="demo-q">AI에게 이렇게 말한 적, 있으시죠?</p>
      <div class="demo-chips">${chips}</div>
      ${demoStage === 'improved'
        ? `<pre class="demo-good">${esc(text)}</pre>`
        : `<textarea class="demo-input" data-demo-input rows="2" aria-label="프롬프트 입력">${esc(text)}</textarea>`}
      ${a ? '' : '<button class="btn btn-primary btn-hero" data-demo-run>내 프롬프트 점수 보기</button>'}
      ${panel}
    </div>`;
  }

  function bindDemo(root, rerender) {
    root.querySelectorAll('[data-demo]').forEach((b) => {
      b.addEventListener('click', () => {
        demoIdx = Number(b.dataset.demo);
        demoStage = 'before'; demoText = null; demoScore = null;
        rerender();
      });
    });

    const input = root.querySelector('[data-demo-input]');
    if (input) input.addEventListener('input', () => { demoText = input.value; });

    const run = root.querySelector('[data-demo-run]');
    if (run) run.addEventListener('click', () => {
      const t = input ? input.value : '';
      if (!t.trim()) { if (input) input.focus(); return; }
      demoText = t;
      demoScore = ZUN.analyzePrompt(t);
      demoStage = 'scored';
      rerender();
    });

    const fix = root.querySelector('[data-demo-fix]');
    if (fix) fix.addEventListener('click', () => {
      const d = window.ZUN_EXTRAS.heroDemos[demoIdx];
      demoStage = 'improved';
      demoText = null;
      demoScore = ZUN.analyzePrompt(d.good);
      rerender();
    });

    const counter = root.querySelector('[data-demo-count]');
    if (counter && demoScore) ZUN.countUp(counter, demoScore.score, 900);
  }

  ZUN.views.home = {
    subnav: { title: 'ZUN AI Roadmap', cta: '<a class="btn btn-primary" href="#/diagnostic">AI 레벨 진단</a>' },

    render() {
      const s = ZUN.state();
      const lv = ZUN.level();
      const tier = ZUN.tierOf(lv);
      const started = !!s.diagnostic || Object.keys(s.lessons).length > 0;
      const doneCount = Object.keys(s.lessons).length;

      const primaryCta = started
        ? '<a class="btn btn-primary btn-hero" href="#/roadmap">이어서 성장하기</a>'
        : '<a class="btn btn-primary btn-hero" href="#/diagnostic">내 AI 레벨 진단하기</a>';
      const secondCta = started
        ? '<a class="btn btn-ghost btn-hero" href="#/diagnostic">다시 진단하기</a>'
        : '<a class="btn btn-ghost btn-hero" href="#/roadmap">로드맵 둘러보기</a>';

      const pathDots = window.ZUN_LESSONS.map((l) => {
        const done = !!s.lessons[l.id];
        return `<span class="path-dot${done ? ' done' : ''}">${l.id}</span>`
          + (l.id < window.ZUN_LESSONS.length ? '<span class="path-link"></span>' : '');
      }).join('');

      return `
      <section class="tile tile-light tile-center hero">
        <div class="tile-inner">
          <p class="eyebrow">Zero → Up → Next</p>
          <h1 class="t-hero">AI 레벨을 올리는<br>가장 확실한 방법.</h1>
          <p class="t-lead" style="margin-top:24px">프롬프트 암기가 아니라, AI와 함께 생각하는 법.<br>진단 테스트로 내 레벨을 확인하고 나만의 로드맵으로 성장하세요.</p>

          ${demoWidget()}

          <div class="cta-row">${primaryCta}${secondCta}</div>
          <div class="hero-stats">
            <div class="hero-stat"><b>${started ? `Lv.${lv}` : '?'}</b><span>${started ? `현재 내 AI 레벨 · ${tier.name}` : '진단하면 알 수 있어요'}</span></div>
            <div class="hero-stat"><b>15</b><span>성장 레벨</span></div>
            <div class="hero-stat"><b>20</b><span>실전 진단 문항</span></div>
            <div class="hero-stat"><b>${started ? doneCount : ZUN.BADGES.length}</b><span>${started ? '완료한 레슨' : '모을 수 있는 배지'}</span></div>
          </div>
        </div>
      </section>

      <section class="tile tile-dark tile-center on-dark reveal">
        <div class="tile-inner">
          <p class="eyebrow">Worldview</p>
          <h2 class="t-display">모든 성장은 Zero에서 시작해요.</h2>
          <p class="t-lead-airy muted" style="margin-top:16px">"ChatGPT가 있다는 건 아는데, 어떻게 써야 할지 모르겠어요."<br>괜찮아요. 여기의 모든 여정은 0에서 출발하도록 설계됐어요.</p>
          <div class="worldview">
            <div class="world-card zero">
              <div class="w-label">ZERO</div>
              <h3>처음 만나는 AI</h3>
              <p>AI가 뭔지, 어떻게 말을 거는지부터. 아무것도 몰라도 시작할 수 있어요.</p>
              <span class="world-range">AI 레벨 0 – 39 · 로드맵 LV.1 – 5</span>
            </div>
            <div class="world-card up">
              <div class="w-label">UP</div>
              <h3>도구를 다루는 사람</h3>
              <p>ChatGPT·Claude·Gemini를 골라 쓰고, 이미지와 영상까지 만들어요.</p>
              <span class="world-range">AI 레벨 40 – 74 · 로드맵 LV.6 – 10</span>
            </div>
            <div class="world-card next">
              <div class="w-label">NEXT</div>
              <h3>AI와 함께 생각하는 사람</h3>
              <p>자동화, AI 코딩, 에이전트까지. 일하는 방식 자체가 달라져요.</p>
              <span class="world-range">AI 레벨 75 – 100 · 로드맵 LV.11 – 15</span>
            </div>
          </div>
        </div>
      </section>

      <section class="tile tile-light tile-center reveal">
        <div class="tile-inner">
          <p class="eyebrow">How it works</p>
          <h2 class="t-display">게임처럼, 그러나 진짜 실력으로.</h2>
          <div class="card-grid">
            <div class="card">
              <span class="card-icon">🧭</span>
              <h3>1. 진단</h3>
              <p>20개의 실제 상황으로 질문력·프롬프트·도구 선택·검증·자동화 사고를 측정해요. 결과는 "AI 레벨 N / 100".</p>
            </div>
            <div class="card">
              <span class="card-icon">🗺️</span>
              <h3>2. 맞춤 로드맵</h3>
              <p>약한 역량에 맞춰 시작 지점과 집중 레벨이 정해져요. 아는 건 건너뛰고, 모르는 것에 집중해요.</p>
            </div>
            <div class="card">
              <span class="card-icon">📈</span>
              <h3>3. 레벨 업</h3>
              <p>레슨을 완료할 때마다 AI 레벨과 XP가 올라요. 다음 레슨이 열리고, 배지가 쌓여요.</p>
            </div>
          </div>
          <div class="path-preview" aria-label="15개 레벨 경로">${pathDots}</div>
          <p class="t-caption muted" style="margin-top:12px">AI란 무엇인가부터 AI 에이전트까지 — 15개의 레벨</p>
        </div>
      </section>

      <section class="tile tile-parchment tile-center reveal">
        <div class="tile-inner">
          <p class="eyebrow">Training ground</p>
          <h2 class="t-display">배우고, 바로 단련하세요.</h2>
          <div class="card-grid">
            <a class="card card-link" href="#/lab"><span class="card-icon">🔬</span><h3>프롬프트 분석기 →</h3><p>내 프롬프트를 붙여넣으면 7가지 기준으로 점수를 매기고, 문제를 찾아 고쳐줘요.</p></a>
            <a class="card card-link" href="#/library"><span class="card-icon">📖</span><h3>프롬프트 도서관 →</h3><p>실전 프롬프트 ${window.ZUN_PROMPTS.length}개. 복사만 하는 게 아니라 왜 좋은지 요소별로 뜯어봐요.</p></a>
            <a class="card card-link" href="#/lab/compare"><span class="card-icon">⚖️</span><h3>AI 도구 비교 →</h3><p>ChatGPT vs Claude vs Gemini. 상황을 고르면 지금 써야 할 도구를 알려줘요.</p></a>
            <a class="card card-link" href="#/lab/playground"><span class="card-icon">🎮</span><h3>플레이그라운드 →</h3><p>실전 시나리오에서 프롬프트를 던져보세요. 좋은 프롬프트와 밋밋한 프롬프트의 결과 차이를 직접 봐요.</p></a>
            <a class="card card-link" href="#/challenge"><span class="card-icon">🏆</span><h3>오늘의 도전 →</h3><p>하루 10분 안쪽, 실제 AI 도구로 해보는 미션. 스트릭이 쌓일수록 실력도 쌓여요.</p></a>
            <a class="card card-link" href="#/profile"><span class="card-icon">🎖️</span><h3>내 성장 기록 →</h3><p>XP·스트릭·배지 ${ZUN.BADGES.length}종. ZERO 졸업부터 레벨 100까지의 기록이 쌓여요.</p></a>
          </div>
        </div>
      </section>

      <section class="tile tile-dark-2 tile-center on-dark reveal">
        <div class="tile-inner">
          <div class="pixel-float" style="display:inline-block">${window.ZUN_EXTRAS.mascotSVG(96)}</div>
          <h2 class="t-display" style="margin-top:24px">"나는 프롬프트를 외운 게 아니라,<br>AI와 함께 생각할 줄 알아요."</h2>
          <p class="t-lead-airy muted" style="margin-top:16px">로드맵을 완주한 당신이 하게 될 말이에요.</p>
          <div class="cta-row">
            <a class="btn btn-primary btn-hero" href="#/diagnostic">${started ? '다시 진단하기' : '무료로 진단 시작하기'}</a>
          </div>
          <p class="t-caption muted" style="margin-top:16px">가입도, 설치도 없어요. 지금 바로 시작해요.</p>
        </div>
      </section>`;
    },

    bind(root, rerender) { bindDemo(root, rerender); },
  };
}());
