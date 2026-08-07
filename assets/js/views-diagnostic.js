/* ZUN AI Roadmap — AI 실력 진단 테스트 */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  let phase = 'intro'; // intro | quiz | result
  let idx = 0;
  let answers = {};
  let lastResult = null;
  let reviewOpen = false;

  const questions = () => window.ZUN_DIAGNOSTIC.questions;

  function reset() {
    phase = 'intro'; idx = 0; answers = {}; lastResult = null; reviewOpen = false;
    ZUN.setProgress('diagnostic', null);
  }

  const persist = () => ZUN.setProgress('diagnostic', { idx, answers });

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
        <p class="t-caption muted" style="margin-top:14px">약 5분 · 20문항 · 완료 시 +80 XP · 중간에 나가도 이어서 할 수 있어요</p>
      </div>
    </section>
    <section class="tile tile-parchment tile-center" style="padding-top:48px">
      <div class="tile-inner">
        <h2 class="t-display-md">5가지 역량을 측정해요</h2>
        <div class="card-grid cols-5" data-comp-grid>
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
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap">
          ${idx > 0 ? '<button class="btn btn-pearl" data-act="prev">← 이전</button>' : '<span></span>'}
          <span class="t-caption muted">키보드 1–4로도 고를 수 있어요 · 진행은 자동 저장돼요</span>
          <button class="btn-step-back" data-act="restart">처음부터 다시</button>
        </div>
      </div>
    </section>`;
  }

  function renderReview() {
    const qs = questions();
    return qs.map((q, i) => {
      const picked = answers[q.id];
      const mine = picked != null ? q.options[picked] : null;
      const best = q.options.reduce((a, b) => (b.score > a.score ? b : a));
      const isBest = mine && mine.score === 3;
      return `
      <div class="card" style="text-align:left;margin-bottom:12px">
        <p class="t-caption-strong" style="color:var(--ink-48)">${i + 1}. ${esc(ZUN.COMPETENCIES[q.competency].label)}</p>
        <p style="margin-top:6px;font-size:15px">${esc(q.question)}</p>
        <div class="dim-row ${isBest ? 'pass' : 'fail'}" style="margin-top:12px">
          <i class="d-ico">${isBest ? '✅' : '▪️'}</i>
          <span><b>내 선택 · ${mine ? mine.score : 0}점</b><span>${esc(mine ? mine.text : '무응답')}</span></span>
        </div>
        ${isBest ? '' : `
        <div class="dim-row pass" style="margin-top:8px">
          <i class="d-ico">🎯</i>
          <span><b>가장 좋은 선택 · 3점</b><span>${esc(best.text)}</span></span>
        </div>`}
      </div>`;
    }).join('');
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

    const best = questions().filter((q) => answers[q.id] != null && q.options[answers[q.id]].score === 3).length;

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

        <div class="cta-row" style="margin-top:32px">
          <button class="btn btn-primary" data-act="share-img">결과 이미지 저장</button>
          <button class="btn btn-pearl" data-act="share-txt">결과 텍스트 복사</button>
        </div>
        <p class="t-caption muted" style="margin-top:10px">인스타 스토리에 딱 맞는 정사각 카드로 저장돼요.</p>
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
    </section>

    <section class="tile tile-light">
      <div class="tile-inner" style="max-width:720px">
        <div style="text-align:center">
          <h2 class="t-display-md">내 답변 다시 보기</h2>
          <p class="muted" style="margin-top:8px">20문항 중 <b>${best}개</b>에서 가장 좋은 선택을 하셨어요. 나머지는 어떤 답이 더 나았는지 확인해 보세요.</p>
          <div class="cta-row" style="margin-top:20px">
            <button class="btn btn-pearl" data-act="toggle-review">${reviewOpen ? '접기' : '문항별로 펼쳐보기'}</button>
          </div>
        </div>
        ${reviewOpen ? `<div style="margin-top:32px">${renderReview()}</div>` : ''}
      </div>
    </section>`;
  }

  ZUN.views.diagnostic = {
    subnav: { title: 'AI 레벨 진단', cta: '<span class="t-caption">5분 · 20문항</span>' },

    render() {
      // 저장된 진행이 있으면 인트로를 건너뛰고 그 문항에서 바로 이어간다.
      // (새로고침·앱 전환 후 "날아갔나?" 싶은 순간을 없애기 위함)
      if (phase === 'intro') {
        const saved = ZUN.getProgress('diagnostic');
        if (saved && saved.answers && Object.keys(saved.answers).length) {
          phase = 'quiz'; idx = saved.idx; answers = saved.answers;
        }
      }
      if (phase === 'intro') return renderIntro();
      if (phase === 'quiz') return renderQuiz();
      return renderResult();
    },

    bind(root, rerender) {
      // 어떤 phase로 렌더되든, 이전 문항의 keydown 핸들러부터 정리
      if (this._keyHandler) {
        document.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
      }

      if (phase === 'intro') {
        const start = root.querySelector('[data-act="start"]');
        if (start) start.addEventListener('click', () => {
          phase = 'quiz'; idx = 0; answers = {};
          persist(); rerender(); window.scrollTo({ top: 0 });
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
            if (idx < qs.length - 1) { idx += 1; persist(); rerender(); }
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
        if (prevBtn) prevBtn.addEventListener('click', () => { idx -= 1; persist(); rerender(); });

        const restart = root.querySelector('[data-act="restart"]');
        if (restart) restart.addEventListener('click', () => {
          if (!window.confirm('지금까지 고른 답을 지우고 처음부터 다시 할까요?')) return;
          reset(); rerender(); window.scrollTo({ top: 0 });
        });

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

      const toggle = root.querySelector('[data-act="toggle-review"]');
      if (toggle) toggle.addEventListener('click', () => {
        reviewOpen = !reviewOpen;
        const y = window.scrollY;
        rerender();
        window.scrollTo({ top: y });
      });

      const imgBtn = root.querySelector('[data-act="share-img"]');
      if (imgBtn) imgBtn.addEventListener('click', () => {
        const cv = ZUN.shareCard(lastResult);
        cv.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `zun-ai-level-${Math.round(lastResult.rawPct * 0.6)}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
        imgBtn.textContent = '저장했어요 ✓';
        setTimeout(() => { imgBtn.textContent = '결과 이미지 저장'; }, 1800);
      });

      const txtBtn = root.querySelector('[data-act="share-txt"]');
      if (txtBtn) txtBtn.addEventListener('click', () => {
        const txt = ZUN.shareText(lastResult);
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => {
          txtBtn.textContent = '복사했어요 ✓';
          setTimeout(() => { txtBtn.textContent = '결과 텍스트 복사'; }, 1800);
        });
      });

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
