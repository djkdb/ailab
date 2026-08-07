/* ZUN AI Roadmap — AI 랩 (프롬프트 분석기 · 도구 비교 · 플레이그라운드) */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;
  const EX = window.ZUN_EXTRAS;

  let tab = 'analyzer';
  let analysis = null;
  let analyzerText = '';
  let situationKey = null;
  let pgKey = 'jaso';
  let pgText = '';
  let pgResult = null;

  function ring(score, cls) {
    const r = 56; const c = 2 * Math.PI * r;
    const off = c * (1 - score / 100);
    return `<svg class="${cls}" viewBox="0 0 132 132" aria-label="점수 ${score}점">
      <circle class="ring-bg" cx="66" cy="66" r="${r}" fill="none" stroke-width="10"/>
      <circle class="ring-fg" cx="66" cy="66" r="${r}" fill="none" stroke-width="10"
        stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 66 66)"/>
      <text x="66" y="76" text-anchor="middle">${score}</text>
    </svg>`;
  }

  /* ---------- 분석기 ---------- */
  function renderAnalyzer() {
    const a = analysis;
    let result = '';
    if (a) {
      const dims = a.dims.map((d) => `
        <div class="dim-row ${d.pass ? 'pass' : 'fail'}">
          <i class="d-ico">${d.pass ? '✅' : '⬜'}</i>
          <span><b>${esc(d.label)} · ${d.weight}점</b><span>${esc(d.msg)}${d.pass ? '' : ` ${esc(d.tip)}`}</span></span>
        </div>`).join('');
      result = `
      <div class="card" style="margin-top:32px;text-align:left">
        <div class="score-ring-wrap">
          ${ring(a.score, 'score-ring')}
          <div class="score-verdict">
            <h3>${esc(a.grade.name)}</h3>
            <p>${esc(a.grade.desc)}</p>
          </div>
        </div>
        <div class="dim-list">${dims}</div>
      </div>
      <div class="card" style="margin-top:20px;text-align:left">
        <h3 class="t-tagline">🔧 개선된 프롬프트</h3>
        <p class="t-caption muted" style="margin-top:4px">빠진 요소를 채워 다시 조립했어요. 괄호 부분만 채워서 쓰세요.</p>
        <div class="improved-prompt" data-improved>${esc(a.improved)}</div>
        <div class="copy-row"><button class="btn btn-utility" data-act="copy">복사하기</button></div>
      </div>`;
    }
    return `
    <div style="max-width:720px;margin:0 auto;text-align:left">
      <textarea class="prompt-input" data-analyzer-input placeholder="분석하고 싶은 프롬프트를 붙여넣으세요.&#10;예) 자소서 써줘">${esc(analyzerText)}</textarea>
      <div class="cta-row left" style="margin-top:16px">
        <button class="btn btn-primary" data-act="analyze">분석하기</button>
        <span class="t-caption muted" style="align-self:center">역할·맥락·형식 등 7가지 기준 · ${ZUN.state().counts.analyzer}회 분석함</span>
      </div>
      ${result}
    </div>`;
  }

  /* ---------- 도구 비교 ---------- */
  function renderCompare() {
    const cards = EX.tools.map((t) => `
      <div class="card tool-card">
        <div class="tool-mark" style="background:${t.color}">${esc(t.name[0])}</div>
        <h3>${esc(t.name)}</h3>
        <p class="t-caption" style="color:var(--ink-48)">${esc(t.maker)} · ${esc(t.tag)}</p>
        <ul>${t.strengths.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <p class="best-for">${esc(t.bestFor)}</p>
      </div>`).join('');

    const chips = EX.situations.map((s) => `
      <button class="situation-chip ${situationKey === s.key ? 'is-active' : ''}" data-situation="${s.key}">${esc(s.label)}</button>`).join('');

    let reco = '';
    if (situationKey) {
      const s = EX.situations.find((x) => x.key === situationKey);
      const t = EX.tools.find((x) => x.key === s.tool);
      reco = `
      <div class="reco-box">
        <p class="t-caption-strong" style="color:var(--ink-48)">이 상황의 추천 도구</p>
        <h3 class="t-tagline" style="margin-top:6px;color:${t.color}">${esc(t.name)}</h3>
        <p style="margin-top:8px">${esc(s.why)}</p>
        <p class="t-caption" style="margin-top:8px;color:var(--ink-48)">💡 ${esc(s.tip)}</p>
      </div>`;
    }

    return `
    <div class="compare-grid">${cards}</div>
    <h3 class="t-display-md" style="margin-top:64px">상황을 고르면, 도구를 골라드려요</h3>
    <div class="situation-picker">${chips}</div>
    ${reco}
    <p class="t-caption muted" style="margin-top:32px">도구의 세부 기능은 계속 바뀌어요. 여기서는 "고르는 눈"을 기르는 게 목적이에요.</p>`;
  }

  /* ---------- 플레이그라운드 ---------- */
  function renderPlayground() {
    const sc = EX.playground.find((x) => x.key === pgKey);
    const chips = EX.playground.map((x) => `
      <button class="situation-chip ${pgKey === x.key ? 'is-active' : ''}" data-pg="${x.key}">${esc(x.title)}</button>`).join('');
    let result = '';
    if (pgResult) {
      result = `
      <div class="ai-response" style="text-align:left">
        <div class="ai-tag">${pgResult.strong ? `AI의 응답 · 프롬프트 ${pgResult.score}점 — 좋은 프롬프트의 결과` : `AI의 응답 · 프롬프트 ${pgResult.score}점 — 밋밋한 프롬프트의 결과`}</div>${esc(pgResult.strong ? sc.strong : sc.weak)}
      </div>
      ${pgResult.strong
        ? '<div class="quiz-explain" style="text-align:left">구조가 잡힌 프롬프트예요. 실제 AI 도구에서도 이렇게 물어보세요.</div>'
        : '<div class="quiz-explain" style="text-align:left">역할·맥락·형식·조건을 넣어 55점을 넘기면 응답이 달라져요. 프롬프트 분석기로 점검해도 좋아요.</div>'}`;
    }
    return `
    <div style="max-width:720px;margin:0 auto;text-align:left">
      <div class="situation-picker" style="justify-content:flex-start">${chips}</div>
      <div class="diag-scenario" style="margin-top:24px">${esc(sc.brief)}</div>
      <textarea class="prompt-input" data-pg-input placeholder="${esc(sc.placeholder)}">${esc(pgText)}</textarea>
      <div class="cta-row left" style="margin-top:16px">
        <button class="btn btn-primary" data-act="pg-run">보내기 (시뮬레이션)</button>
        <span class="t-caption muted" style="align-self:center">같은 상황, 다른 프롬프트 — 결과 차이를 직접 봐요</span>
      </div>
      ${result}
    </div>`;
  }

  ZUN.views.lab = {
    subnav: { title: 'AI 랩', cta: '<span class="t-caption">단련하는 곳</span>' },

    render(params) {
      const sub = params[0];
      tab = (sub === 'compare' || sub === 'playground') ? sub : 'analyzer';

      const tabs = [
        ['analyzer', '🔬 프롬프트 분석기'],
        ['compare', '⚖️ 도구 비교'],
        ['playground', '🎮 플레이그라운드'],
      ].map(([k, label]) => `<button class="lab-tab ${tab === k ? 'is-active' : ''}" data-tab="${k}">${label}</button>`).join('');

      const heads = {
        analyzer: ['프롬프트를 과학하세요.', '점수 · 진단 · 개선까지 한 번에. 내 프롬프트가 Zero인지 Next인지 확인해요.'],
        compare: ['도구를 고르는 눈.', 'ChatGPT · Claude · Gemini — 뭐가 다르고, 언제 뭘 써야 할까요?'],
        playground: ['던져보고, 비교해요.', '같은 상황에 다른 프롬프트. 결과가 어떻게 달라지는지 직접 확인해요.'],
      };

      return `
      <section class="tile tile-light tile-center" style="min-height:60vh">
        <div class="tile-inner wide">
          <p class="eyebrow">AI Lab</p>
          <h1 class="t-display">${heads[tab][0]}</h1>
          <p class="t-lead" style="margin-top:12px;color:var(--ink-48);font-size:21px">${heads[tab][1]}</p>
          <div class="lab-tabs" style="margin-top:32px">${tabs}</div>
          ${tab === 'analyzer' ? renderAnalyzer() : tab === 'compare' ? renderCompare() : renderPlayground()}
        </div>
      </section>`;
    },

    bind(root, rerender) {
      root.querySelectorAll('[data-tab]').forEach((b) => {
        b.addEventListener('click', () => {
          tab = b.dataset.tab;
          window.location.hash = tab === 'analyzer' ? '#/lab' : `#/lab/${tab}`;
        });
      });

      const input = root.querySelector('[data-analyzer-input]');
      if (input) {
        input.addEventListener('input', () => { analyzerText = input.value; });
        const run = root.querySelector('[data-act="analyze"]');
        run.addEventListener('click', () => {
          if (!input.value.trim()) { input.focus(); return; }
          analyzerText = input.value;
          analysis = ZUN.analyzePrompt(input.value);
          ZUN.countAnalyzer();
          ZUN.refreshChrome();
          rerender();
        });
        const copy = root.querySelector('[data-act="copy"]');
        if (copy) copy.addEventListener('click', () => {
          const txt = analysis ? analysis.improved : '';
          if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => {
            copy.textContent = '복사됐어요 ✓';
            setTimeout(() => { copy.textContent = '복사하기'; }, 1600);
          });
        });
      }

      root.querySelectorAll('[data-situation]').forEach((b) => {
        b.addEventListener('click', () => { situationKey = b.dataset.situation; rerender(); });
      });

      root.querySelectorAll('[data-pg]').forEach((b) => {
        b.addEventListener('click', () => { pgKey = b.dataset.pg; pgText = ''; pgResult = null; rerender(); });
      });
      const pgInput = root.querySelector('[data-pg-input]');
      if (pgInput) {
        pgInput.addEventListener('input', () => { pgText = pgInput.value; });
        const run = root.querySelector('[data-act="pg-run"]');
        run.addEventListener('click', () => {
          if (!pgInput.value.trim()) { pgInput.focus(); return; }
          pgText = pgInput.value;
          const score = ZUN.analyzePrompt(pgText).score;
          pgResult = { score, strong: score >= 55 };
          rerender();
        });
      }
    },

    unbind() {},
  };
}());
