/* ZUN AI Roadmap — AI 실력 진단 테스트 */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  let phase = 'intro'; // intro | quiz | result
  let idx = 0;
  let answers = {};
  let lastResult = null;

  const questions = () => window.ZUN_DIAGNOSTIC.questions;

  function reset() { phase = 'intro'; idx = 0; answers = {}; lastResult = null; }

  function renderIntro() {
    const s = ZUN.state();
    const prev = s.diagnostic;
    const compRows = Object.entries(ZUN.COMPETENCIES).map(([k, c]) => `
      <div class="card" style="text-align:left">
        <h3 style="font-size:17px">${esc(c.label)}</h3>
        <p>${esc(c.desc)}</p>
      </div>`).join('');

    return `
    <section class="tile tile-light tile-center hero" style="padding-bottom:48px">
      <div class="tile-inner">
        <p class="eyebrow">AI Skill Diagnostic</p>
        <h1 class="t-hero">당신의 AI 레벨은<br>몇입니까?</h1>
        <p class="t-lead" style="margin-top:24px;color:var(--ink-48)">20개의 실제 상황을 드릴게요. 정답을 고르는 시험이 아니라,<br>"당신이라면 어떻게 할지"를 고르는 테스트예요.</p>
        ${prev ? `<p class="t-caption muted" style="margin-top:12px">지난 진단: AI 레벨 ${Math.round(prev.rawPct * 0.6)} (${esc(prev.date)}) — 다시 진단하면 기록이 갱신돼요.</p>` : ''}
        <div class="cta-row">
          <button class="btn btn-primary btn-hero" data-act="start">진단 시작하기</button>
        </div>
        <p class="t-caption muted" style="margin-top:14px">약 5분 · 20문항 · 완료 시 +80 XP</p>
      </div>
    </section>
    <section class="tile tile-parchment tile-center" style="padding-top:48px">
      <div class="tile-inner">
        <h2 class="t-display-md">5가지 역량을 측정해요</h2>
        <div class="card-grid" style="grid-template-columns:repeat(5,1fr);gap:12px" data-comp-grid>
          ${compRows}
        </div>
      </div>
    </section>`;
  }

  function renderQuiz() {
    const qs = questions();
    const q = qs[idx];
    const comp = ZUN.COMPETENCIES[q.competency];
    const picked = answers[q.id];
    const opts = q.options.map((o, i) => `
      <button class="option${picked === i ? ' is-selected' : ''}" data-opt="${i}">
        <span class="opt-key">${i + 1}</span>
        <span>${esc(o.text)}</span>
      </button>`).join('');

    return `
    <section class="tile tile-light" style="padding-top:48px">
      <div class="tile-inner" style="max-width:720px">
        <div class="diag-progress"><i style="width:${(idx / qs.length) * 100}%"></i></div>
        <div class="diag-meta">
          <span class="comp-chip"><i></i>${esc(comp.label)}</span>
          <span class="t-caption muted">${idx + 1} / ${qs.length}</span>
        </div>
        <div class="diag-scenario">${esc(q.scenario)}</div>
        <h2 class="t-display-md diag-question">${esc(q.question)}</h2>
        <div class="option-list">${opts}</div>
        <div style="display:flex;justify-content:space-between;margin-top:24px">
          ${idx > 0 ? '<button class="btn btn-pearl" data-act="prev">← 이전</button>' : '<span></span>'}
          <span class="t-caption muted" style="align-self:center">키보드 1–4로도 고를 수 있어요</span>
        </div>
      </div>
    </section>`;
  }

  function renderResult() {
    const r = lastResult;
    const level = Math.round(r.rawPct * 0.6);
    const tier = ZUN.tierOf(level);
    const bars = Object.entries(r.comps).map(([k, pct]) => {
      const weak = r.weakest.includes(k);
      return `
      <div class="comp-bar-row${weak ? ' weak' : ''}">
        <span class="label">${esc(ZUN.COMPETENCIES[k].label)}${weak ? ' ⚠️' : ''}</span>
        <div class="comp-bar"><i data-w="${pct}"></i></div>
        <span class="pct">${pct}%</span>
      </div>`;
    }).join('');

    const focus = r.focusLevels.map((id) => {
      const lesson = window.ZUN_LESSONS.find((l) => l.id === id);
      if (!lesson) return '';
      return `
      <a class="focus-item" href="#/lesson/${id}" style="text-decoration:none;color:inherit">
        <span class="f-num">${id}</span>
        <span><b class="t-body-strong">LV.${id} ${esc(lesson.title)}</b><p>${esc(lesson.subtitle)}</p></span>
      </a>`;
    }).join('');

    return `
    <section class="tile tile-light tile-center" style="padding-top:64px">
      <div class="tile-inner" style="max-width:720px">
        <p class="eyebrow">Diagnostic Result</p>
        <h1 class="t-display">당신의 AI 레벨</h1>
        <div class="level-figure">
          <div class="level-number"><span data-count>0</span><small> / 100</small></div>
          <div class="tier-badge ${tier.key}">${tier.name}</div>
          <p class="muted" style="margin-top:12px">${esc(tier.desc)} — ${tier.key === 'next' ? '이미 상위권이에요. 로드맵 후반부로 직행하세요.' : '진단만으로는 레벨 60까지만 나와요. NEXT는 실전으로만 도달할 수 있어요.'}</p>
        </div>
        <div class="comp-bars">${bars}</div>
      </div>
    </section>
    <section class="tile tile-parchment tile-center">
      <div class="tile-inner" style="max-width:720px">
        <h2 class="t-display-md">당신만의 로드맵이 준비됐어요</h2>
        <p class="muted" style="margin-top:8px">추천 시작 지점은 <b>LV.${r.startLevel}</b>이에요. 그 이전 레벨은 잠금이 풀린 채로 열려 있으니 빠르게 복습해도 좋아요.</p>
        ${focus ? `<p class="t-caption-strong" style="margin-top:24px;color:var(--ink-80)">약한 역량을 위한 집중 추천 레벨</p><div class="focus-list">${focus}</div>` : ''}
        <div class="cta-row">
          <a class="btn btn-primary btn-hero" href="#/roadmap">내 로드맵 시작하기</a>
          <button class="btn btn-ghost btn-hero" data-act="retry">다시 진단하기</button>
        </div>
      </div>
    </section>`;
  }

  ZUN.views.diagnostic = {
    subnav: { title: 'AI 레벨 진단', cta: '<span class="t-caption">5분 · 20문항</span>' },

    render() {
      if (phase === 'intro') return renderIntro();
      if (phase === 'quiz') return renderQuiz();
      return renderResult();
    },

    bind(root, rerender) {
      if (phase === 'intro') {
        root.querySelector('[data-act="start"]').addEventListener('click', () => {
          phase = 'quiz'; idx = 0; answers = {};
          rerender();
          window.scrollTo({ top: 0 });
        });
        return;
      }

      if (phase === 'quiz') {
        const qs = questions();
        const q = qs[idx];
        let picking = false; // 더블클릭·연타로 두 문항 넘어가는 것 방지
        const pick = (i) => {
          if (picking) return;
          picking = true;
          answers[q.id] = i;
          const btn = root.querySelector(`[data-opt="${i}"]`);
          if (btn) btn.classList.add('is-selected');
          setTimeout(() => {
            if (idx < qs.length - 1) { idx += 1; rerender(); }
            else {
              lastResult = ZUN.scoreDiagnostic(answers, qs);
              ZUN.setDiagnostic(lastResult);
              phase = 'result';
              rerender();
              window.scrollTo({ top: 0 });
            }
          }, 260);
        };
        root.querySelectorAll('[data-opt]').forEach((b) => {
          b.addEventListener('click', () => pick(Number(b.dataset.opt)));
        });
        const prevBtn = root.querySelector('[data-act="prev"]');
        if (prevBtn) prevBtn.addEventListener('click', () => { idx -= 1; rerender(); });

        // rerender마다 bind가 다시 불리므로, 이전 핸들러를 반드시 제거
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = (e) => {
          const n = Number(e.key);
          if (n >= 1 && n <= 4 && !e.repeat) pick(n - 1);
        };
        document.addEventListener('keydown', this._keyHandler);
        return;
      }

      // result
      const counter = root.querySelector('[data-count]');
      if (counter) ZUN.countUp(counter, Math.round(lastResult.rawPct * 0.6), 1400);
      setTimeout(() => {
        root.querySelectorAll('.comp-bar i').forEach((bar) => {
          bar.style.width = `${bar.dataset.w}%`;
        });
      }, 150);
      const retry = root.querySelector('[data-act="retry"]');
      if (retry) retry.addEventListener('click', () => { reset(); rerender(); window.scrollTo({ top: 0 }); });
      ZUN.refreshChrome();
    },

    unbind() {
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
      }
    },
  };
}());
