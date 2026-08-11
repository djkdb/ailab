/* ZUN AI Roadmap — 오답노트
   틀린 문제만 모아 다시 푼다. 맞히면 노트에서 사라지고, 또 틀리면 남는다.
   "왜 틀렸는지"를 다시 만나는 게 목적이라 해설을 항상 함께 보여준다. */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  let phase = 'list';   // list | quiz | done
  let queue = [];       // 이번 복습에서 풀 문제들
  let idx = 0;
  let picked = null;
  let fixed = 0;        // 이번에 정리한 문제 수
  let stillWrong = 0;

  function startReview() {
    queue = ZUN.wrongList();
    idx = 0; picked = null; fixed = 0; stillWrong = 0;
    phase = queue.length ? 'quiz' : 'list';
  }

  function renderList() {
    const list = ZUN.wrongList();
    const s = ZUN.state();
    const doneLessons = Object.keys(s.lessons).length;

    if (!list.length) {
      const msg = doneLessons
        ? '지금은 틀린 문제가 없어요. 완벽해요! 🎯'
        : '아직 푼 퀴즈가 없어요. 레슨을 완료하면 틀린 문제가 여기 모여요.';
      return `
      <section class="tile tile-light tile-center hero">
        <div class="tile-inner" style="max-width:640px">
          <p class="eyebrow">Review Notes</p>
          <h1 class="t-display">오답노트</h1>
          <div class="pixel-float" style="display:inline-block;margin-top:32px">${window.ZUN_EXTRAS.mascotSVG(84)}</div>
          <p class="t-lead" style="margin-top:24px;color:var(--ink-48);font-size:21px">${esc(msg)}</p>
          <div class="cta-row">
            <a class="btn btn-primary btn-hero" href="#/roadmap">${doneLessons ? '다음 레슨 하러 가기' : '로드맵 보러 가기'}</a>
          </div>
        </div>
      </section>`;
    }

    // 레슨별로 묶어서 보여주면 "어느 레벨이 약한지"가 드러난다
    const byLesson = {};
    list.forEach((w) => {
      byLesson[w.lessonId] = byLesson[w.lessonId] || { title: w.lessonTitle, items: [] };
      byLesson[w.lessonId].items.push(w);
    });
    const groups = Object.keys(byLesson).sort((a, b) => a - b).map((id) => {
      const g = byLesson[id];
      return `
      <div class="wrong-group">
        <div class="wrong-group-head">
          <span><b>LV.${id} · ${esc(g.title)}</b><span class="t-caption muted"> ${g.items.length}문항</span></span>
          <a class="t-caption" href="#/lesson/${id}">레슨 다시 보기 →</a>
        </div>
        ${g.items.map((w) => `<p class="wrong-q">${esc(w.quiz.q)}</p>`).join('')}
      </div>`;
    }).join('');

    return `
    <section class="tile tile-light tile-center" style="padding-bottom:32px">
      <div class="tile-inner" style="max-width:720px">
        <p class="eyebrow">Review Notes</p>
        <h1 class="t-display">틀린 문제만 다시</h1>
        <p class="t-lead" style="margin-top:12px;color:var(--ink-48);font-size:21px">
          <b style="color:var(--ink)">${list.length}문항</b>이 기다리고 있어요.<br>
          맞히면 노트에서 사라져요. 또 틀리면 남고요.
        </p>
        <div class="cta-row">
          <button class="btn btn-primary btn-hero" data-act="start">복습 시작 (문항당 +5 XP)</button>
        </div>
      </div>
    </section>
    <section class="tile tile-parchment">
      <div class="tile-inner" style="max-width:720px">
        <p class="t-caption-strong" style="color:var(--ink-48);margin-bottom:16px">레슨별 오답</p>
        ${groups}
      </div>
    </section>`;
  }

  function renderQuiz() {
    const w = queue[idx];
    const q = w.quiz;
    const answered = picked != null;
    const opts = q.options.map((o, i) => {
      let cls = '';
      if (answered) {
        if (i === q.answer) cls = 'is-correct';
        else if (i === picked) cls = 'is-wrong';
      }
      return `<button class="option ${cls}" data-opt="${i}" ${answered ? 'disabled' : ''}>
        <span class="opt-key">${i + 1}</span><span>${esc(o)}</span>
      </button>`;
    }).join('');
    const last = idx === queue.length - 1;

    return `
    <section class="tile tile-light" style="padding-top:48px">
      <div class="tile-inner" style="max-width:720px">
        <div class="diag-progress"><i style="width:${(idx / queue.length) * 100}%"></i></div>
        <div class="diag-meta">
          <span class="comp-chip"><i></i>LV.${w.lessonId} · ${esc(w.lessonTitle)}</span>
          <span class="t-caption muted">${idx + 1} / ${queue.length}</span>
        </div>
        <h2 class="t-display-md" style="margin-bottom:24px">${esc(q.q)}</h2>
        <div class="option-list">${opts}</div>
        ${answered ? `
          <div class="quiz-explain">${picked === q.answer
            ? '🎯 이번엔 맞혔어요! 노트에서 지웠어요.'
            : '아직 헷갈리시네요. 노트에 남겨둘게요.'} ${esc(q.explain)}</div>
          <div class="cta-row left" style="margin-top:24px">
            <button class="btn btn-primary" data-act="${last ? 'finish' : 'next'}">${last ? '결과 보기' : '다음 문제'}</button>
          </div>` : ''}
      </div>
    </section>`;
  }

  function renderDone() {
    const left = ZUN.wrongList().length;
    return `
    <section class="tile tile-light tile-center hero">
      <div class="tile-inner" style="max-width:640px" data-review-done>
        <div class="pixel-float" style="display:inline-block">${window.ZUN_EXTRAS.mascotSVG(84)}</div>
        <h1 class="t-display" style="margin-top:24px">복습 완료!</h1>
        <p class="t-lead" style="margin-top:16px;color:var(--ink-48);font-size:21px">
          ${fixed}문항을 정리했어요${stillWrong ? ` · ${stillWrong}문항은 다음에 다시` : ''}
        </p>
        ${fixed ? `<div class="xp-burst" style="margin-top:24px">+${fixed * 5} XP</div>` : ''}
        <div class="level-up-note">${left ? `노트에 ${left}문항 남았어요` : '노트를 완전히 비웠어요 🎉'}</div>
        <div class="cta-row">
          ${left
            ? '<button class="btn btn-primary btn-hero" data-act="again">남은 문항 이어서</button>'
            : '<a class="btn btn-primary btn-hero" href="#/roadmap">다음 레슨 하러 가기</a>'}
          <a class="btn btn-ghost btn-hero" href="#/profile">내 성장 보기</a>
        </div>
      </div>
    </section>`;
  }

  ZUN.views.review = {
    subnav: { title: '오답노트', cta: '' },

    render() {
      const n = ZUN.wrongList().length;
      this.subnav.cta = n ? `<span class="t-caption">${n}문항 남음</span>` : '';
      if (phase === 'quiz') return renderQuiz();
      if (phase === 'done') return renderDone();
      return renderList();
    },

    bind(root, rerender) {
      const start = root.querySelector('[data-act="start"]');
      if (start) start.addEventListener('click', () => {
        startReview(); rerender(); window.scrollTo({ top: 0 });
      });

      root.querySelectorAll('[data-opt]').forEach((b) => {
        b.addEventListener('click', () => {
          if (picked != null) return;
          picked = Number(b.dataset.opt);
          const w = queue[idx];
          if (picked === w.quiz.answer) {
            ZUN.clearWrong(w.lessonId, w.quizIdx);
            ZUN.addXP(5);
            fixed += 1;
          } else {
            stillWrong += 1;
          }
          ZUN.refreshChrome();
          rerender();
        });
      });

      const next = root.querySelector('[data-act="next"]');
      if (next) next.addEventListener('click', () => {
        idx += 1; picked = null; rerender(); window.scrollTo({ top: 0 });
      });

      const finish = root.querySelector('[data-act="finish"]');
      if (finish) finish.addEventListener('click', () => {
        phase = 'done'; rerender(); window.scrollTo({ top: 0 });
      });

      const again = root.querySelector('[data-act="again"]');
      if (again) again.addEventListener('click', () => {
        startReview(); rerender(); window.scrollTo({ top: 0 });
      });

      const doneBox = root.querySelector('[data-review-done]');
      if (doneBox && fixed) ZUN.confetti(doneBox);
    },

    unbind() {
      // 복습을 끝내거나 떠나면 목록 화면부터 다시 시작
      if (phase === 'done') { phase = 'list'; queue = []; idx = 0; picked = null; }
    },
  };
}());
