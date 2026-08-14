/* ZUN AI Roadmap — 레슨 플레이어 */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  const STEPS = ['배우기', '좋은 예 vs 나쁜 예', '연습', '실전', '퀴즈', '완료'];

  let L = null; // 현재 레슨 진행 상태

  function initState(id) {
    L = {
      id, step: 0,
      builderPicked: {}, builderFeedback: null,
      battleRound: 0, battleAnswered: false, battleCorrect: 0, battlePicked: null,
      practiceRan: false, practiceScore: 0, practiceText: '',
      quizIdx: 0, quizPicked: null, quizScore: 0,
      completeInfo: null,
    };
  }

  // 새로고침·이탈 후에도 이어서 학습할 수 있도록 진행 상태를 저장/복원한다.
  // 완료 화면(step 5)은 일회성이라 저장하지 않는다.
  function persist() {
    if (!L || L.step >= 5) return;
    ZUN.setProgress('lesson', L);
  }

  function hydrate(id) {
    const saved = ZUN.getProgress('lesson');
    if (saved && saved.id === id && saved.step < 5) {
      L = Object.assign({ practiceText: '' }, saved);
      return true;
    }
    initState(id);
    return false;
  }

  const lesson = () => window.ZUN_LESSONS.find((l) => l.id === L.id);

  function stepsBar() {
    return `<div class="lesson-steps">${STEPS.map((_, i) =>
      `<i class="${i < L.step ? 'done' : i === L.step ? 'active' : ''}"></i>`).join('')}</div>`;
  }

  function head(label) {
    const l = lesson();
    return `${stepsBar()}
      <div class="step-head">
        ${L.step > 0 ? `<button class="btn-step-back" data-act="back" aria-label="이전 단계로">← ${esc(STEPS[L.step - 1])}</button>` : '<span></span>'}
        <p class="step-label">${esc(label)} · LV.${l.id}</p>
      </div>`;
  }

  function nextBtn(label, enabled) {
    return `<div class="cta-row left" style="margin-top:32px">
      <button class="btn btn-primary" data-act="next" ${enabled ? '' : 'disabled'}>${esc(label || '다음')}</button>
    </div>`;
  }

  /* ---------- steps ---------- */
  function renderIntro() {
    const l = lesson();
    return `${head('배우기')}
      <h1 class="t-display">${esc(l.title)}</h1>
      <p class="t-lead" style="color:var(--ink-48);margin-top:8px;font-size:22px">${esc(l.subtitle)}</p>
      <h2 class="t-tagline" style="margin-top:40px">${esc(l.intro.heading)}</h2>
      ${l.intro.paragraphs.map((p) => `<p style="margin-top:16px">${esc(p)}</p>`).join('')}
      <div class="keypoints">
        ${l.intro.keyPoints.map((k) => `<div class="keypoint"><i>✦</i><span>${esc(k)}</span></div>`).join('')}
      </div>
      ${nextBtn('예시 보러 가기', true)}`;
  }

  function renderGoodBad() {
    const l = lesson();
    const pairs = l.goodBad.map((p) => `
      <div class="gb-pair">
        <p class="gb-situation">상황 — ${esc(p.situation)}</p>
        <div class="gb-card bad">
          <span class="gb-tag">BAD · 이렇게 쓰면</span>
          <div class="gb-text">${esc(p.bad.text)}</div>
          <p class="gb-why">${esc(p.bad.why)}</p>
        </div>
        <div class="gb-card good">
          <span class="gb-tag">GOOD · 이렇게 바꾸면</span>
          <div class="gb-text">${esc(p.good.text)}</div>
          <p class="gb-why">${esc(p.good.why)}</p>
        </div>
      </div>`).join('');
    return `${head('좋은 예 vs 나쁜 예')}
      <h1 class="t-display-md">같은 목적, 다른 결과</h1>
      <p class="muted" style="margin-top:8px">차이는 재능이 아니라 습관이에요. 두 쌍만 비교해 봐요.</p>
      ${pairs}
      ${nextBtn('직접 연습하기', true)}`;
  }

  function renderExercise() {
    const l = lesson();
    const ex = l.exercise;
    if (ex.type === 'builder') return renderBuilder(ex);
    return renderBattle(ex);
  }

  function renderBuilder(ex) {
    const b = ex.builder;
    const pickedGood = b.chips.filter((c, i) => L.builderPicked[i] && c.good).length;
    const ok = pickedGood >= b.minGood;
    const chips = b.chips.map((c, i) => {
      const picked = L.builderPicked[i];
      const cls = picked ? (c.good ? 'picked-good' : 'picked-bad') : '';
      return `<button class="chip ${cls}" data-chip="${i}">${esc(c.text)}</button>`;
    }).join('');
    const fb = L.builderFeedback != null
      ? `<div class="chip-feedback ${b.chips[L.builderFeedback].good ? 'good' : 'bad'}">${b.chips[L.builderFeedback].good ? '✓' : '✗'} ${esc(b.chips[L.builderFeedback].feedback)}</div>`
      : '<div class="chip-feedback" style="color:var(--ink-48)">조각을 눌러 프롬프트에 넣을지 판단해 보세요.</div>';
    return `${head('연습 · 프롬프트 조립')}
      <h1 class="t-display-md">${esc(ex.instruction)}</h1>
      <div class="diag-scenario" style="margin-top:16px">${esc(b.scenario)}</div>
      <p class="t-caption muted">좋은 조각 ${pickedGood} / ${b.minGood} 선택됨</p>
      <div class="chips">${chips}</div>
      ${fb}
      ${ok ? `<div class="ai-response"><div class="ai-tag">완성된 모범 프롬프트</div>${esc(b.modelAnswer)}</div>` : ''}
      ${nextBtn('실전으로', ok)}`;
  }

  function renderBattle(ex) {
    const rounds = ex.battle.rounds;
    const r = rounds[L.battleRound];
    const tagA = L.battleAnswered ? (r.better === 'a' ? 'is-right' : L.battlePicked === 'a' ? 'is-wrong' : '') : '';
    const tagB = L.battleAnswered ? (r.better === 'b' ? 'is-right' : L.battlePicked === 'b' ? 'is-wrong' : '') : '';
    const last = L.battleRound === rounds.length - 1;
    return `${head('연습 · 프롬프트 배틀')}
      <h1 class="t-display-md">${esc(ex.instruction)}</h1>
      <p class="muted" style="margin-top:8px">라운드 ${L.battleRound + 1} / ${rounds.length} — 더 좋은 프롬프트를 골라보세요.</p>
      <div class="battle-grid">
        <button class="battle-card ${tagA}" data-battle="a" ${L.battleAnswered ? 'disabled' : ''}><span class="b-tag">A</span>${esc(r.a)}</button>
        <button class="battle-card ${tagB}" data-battle="b" ${L.battleAnswered ? 'disabled' : ''}><span class="b-tag">B</span>${esc(r.b)}</button>
      </div>
      ${L.battleAnswered ? `<div class="quiz-explain">${L.battlePicked === r.better ? '🎯 정확해요!' : '아쉬워요.'} ${esc(r.why)}</div>
        <div class="cta-row left" style="margin-top:24px">
          <button class="btn btn-primary" data-act="${last ? 'next' : 'battle-next'}">${last ? `실전으로 (${L.battleCorrect}/${rounds.length} 정답)` : '다음 라운드'}</button>
        </div>` : ''}`;
  }

  function renderPractice() {
    const l = lesson();
    const p = l.practice;
    const strong = L.practiceScore >= 50;
    return `${head('실전 · AI에게 직접')}
      <h1 class="t-display-md">${esc(p.task)}</h1>
      <div class="diag-scenario" style="margin-top:16px">${esc(p.scenario)}</div>
      <div class="keypoints" style="margin-top:16px">
        ${p.checklist.map((c) => `<div class="keypoint"><i>✦</i><span>${esc(c)}</span></div>`).join('')}
      </div>
      <div class="practice-box">
        <textarea class="prompt-input" data-practice-input placeholder="${esc(p.placeholder)}">${esc(L.practiceText || '')}</textarea>
        <div class="checklist">
          ${[['role', '역할 부여'], ['context', '맥락 제공'], ['format', '형식 지정'], ['constraint', '제약 조건']]
            .map(([k, label]) => `<div class="check-item" data-check="${k}"><i>✓</i><span>${label}</span></div>`).join('')}
        </div>
        <p class="input-hint" data-hint hidden></p>
        <div class="cta-row left" style="margin-top:8px">
          <button class="btn btn-primary" data-act="run">AI에게 보내기 (시뮬레이션)</button>
          <details style="align-self:center"><summary class="t-caption" style="color:var(--blue);cursor:pointer">모범 프롬프트 보기</summary>
            <div class="ai-response" style="margin-top:8px"><div class="ai-tag">모범 프롬프트</div>${esc(p.samplePrompt)}</div>
          </details>
        </div>
        ${L.practiceRan ? `
          <div class="ai-response">
            <div class="ai-tag">${strong ? 'AI의 응답 — 좋은 프롬프트의 결과예요' : 'AI의 응답 — 프롬프트가 밋밋하면 이렇게 와요'}</div>${esc(strong ? p.strongResponse : p.weakResponse)}
          </div>
          <div class="quiz-explain">${strong
            ? `프롬프트 점수 ${L.practiceScore}점 — 구조가 살아있어요. 이 감각을 기억하세요.`
            : `프롬프트 점수 ${L.practiceScore}점 — 체크 항목을 채워서 다시 보내보세요. 50점부터 응답이 달라져요.`}</div>` : ''}
      </div>
      ${nextBtn('퀴즈 풀러 가기', L.practiceRan)}`;
  }

  function renderQuiz() {
    const l = lesson();
    const q = l.quiz[L.quizIdx];
    const answered = L.quizPicked != null;
    const opts = q.options.map((o, i) => {
      let cls = '';
      if (answered) {
        if (i === q.answer) cls = 'is-correct';
        else if (i === L.quizPicked) cls = 'is-wrong';
      }
      return `<button class="option ${cls}" data-quiz-opt="${i}" ${answered ? 'disabled' : ''}>
        <span class="opt-key">${i + 1}</span><span>${esc(o)}</span>
      </button>`;
    }).join('');
    const last = L.quizIdx === l.quiz.length - 1;
    return `${head('퀴즈')}
      <div class="diag-meta">
        <span class="comp-chip"><i></i>개념 확인</span>
        <span class="t-caption muted">${L.quizIdx + 1} / ${l.quiz.length} · 맞힌 문제 ${L.quizScore}</span>
      </div>
      <h1 class="t-display-md" style="margin-bottom:24px">${esc(q.q)}</h1>
      <div class="option-list">${opts}</div>
      ${answered ? `<div class="quiz-explain">${L.quizPicked === q.answer ? '🎯 정답!' : '오답이에요.'} ${esc(q.explain)}</div>
        <div class="cta-row left" style="margin-top:24px">
          <button class="btn btn-primary" data-act="${last ? 'finish' : 'quiz-next'}">${last ? '결과 보기' : '다음 문제'}</button>
        </div>` : ''}`;
  }

  function renderComplete() {
    const l = lesson();
    const info = L.completeInfo;
    const next = window.ZUN_LESSONS.find((x) => x.id === l.id + 1);
    const badges = info.badges.length
      ? `<div class="badge-earned-grid">
          ${info.badges.map((b) => `<div class="card" style="text-align:center"><span class="card-icon">${b.emoji}</span><h3 style="font-size:16px">${esc(b.name)}</h3><p>${esc(b.desc)}</p></div>`).join('')}
        </div>` : '';
    return `<div style="text-align:center" data-complete>
      ${stepsBar()}
      <div class="pixel-float" style="display:inline-block;margin-top:24px">${window.ZUN_EXTRAS.mascotSVG(84)}</div>
      <h1 class="t-display" style="margin-top:16px">LV.${l.id} 완료!</h1>
      <p class="muted" style="margin-top:8px">퀴즈 ${info.quizScore} / ${lesson().quiz.length} ${info.perfect ? '— 만점이에요! 🎯' : ''}</p>
      ${info.xp > 0 ? `<div class="xp-burst" style="margin-top:24px">+${info.xp} XP</div>` : ''}
      ${info.levelAfter > info.levelBefore
        ? `<div class="level-up-note">AI 레벨 ${info.levelBefore} → <b>${info.levelAfter}</b>${info.tierUp ? ` · ${info.tierAfter.name} 승급! 🎉` : ''}</div>`
        : '<div class="level-up-note">복습 완료 — 실력이 더 단단해졌어요</div>'}
      ${info.wrongCount ? `
      <div class="card" style="max-width:460px;margin:24px auto 0">
        <p class="t-body-strong">틀린 ${info.wrongCount}문항을 오답노트에 담아뒀어요</p>
        <p class="t-caption muted" style="margin-top:6px">지금 바로 다시 풀면 훨씬 오래 남아요.</p>
        <div class="cta-row" style="margin-top:16px"><a class="btn btn-primary" href="#/review">복습하러 가기</a></div>
      </div>` : ''}
      ${badges}
      <div class="cta-row" style="margin-top:32px">
        <button class="btn btn-pearl" data-act="share-img">완료 카드 저장</button>
        <button class="btn btn-pearl" data-act="share-txt">텍스트 복사</button>
      </div>
      <div class="cta-row">
        ${next ? `<a class="btn btn-primary btn-hero" href="#/lesson/${next.id}" data-next-lesson>다음: LV.${next.id} ${esc(next.title)}</a>` : '<a class="btn btn-primary btn-hero" href="#/profile">내 성장 기록 보기</a>'}
        <a class="btn btn-ghost btn-hero" href="#/roadmap">로드맵으로</a>
      </div>
    </div>`;
  }

  /* ---------- view ---------- */
  ZUN.views.lesson = {
    subnav: { title: '레슨', cta: '<a class="btn btn-primary" href="#/roadmap">로드맵</a>' },

    render(params) {
      const id = Number(params[0]);
      const known = window.ZUN_LESSONS.some((x) => x.id === id);
      if (!known) {
        // subnav.title은 뷰 객체에 남아서, 안 고치면 직전 레슨 제목이 그대로 걸린다
        this.subnav.title = '레슨';
        return '<section class="tile tile-light tile-center"><div class="tile-inner"><h1 class="t-display-md">레슨을 찾을 수 없어요</h1><p class="muted" style="margin-top:10px">주소가 잘못됐거나 아직 없는 레슨이에요.</p><div class="cta-row"><a class="btn btn-primary" href="#/roadmap">로드맵으로</a></div></div></section>';
      }

      if (!ZUN.isUnlocked(id)) {
        // 잠겨 있어도 '무엇을 배우는지'는 보여줘야 다음 레벨이 기다려진다.
        const p = window.ZUN_LESSONS.find((x) => x.id === id);
        this.subnav.title = `LV.${p.id} · ${p.title}`;
        return `<section class="tile tile-light tile-center hero"><div class="tile-inner" style="max-width:640px">
          <p class="eyebrow">Locked · LV.${id}</p>
          <h1 class="t-display">${esc(p.title)}</h1>
          <p class="t-lead" style="margin-top:12px;color:var(--ink-48);font-size:21px">${esc(p.subtitle)}</p>
          <div class="card" style="text-align:left;margin-top:32px">
            <p class="t-caption-strong" style="color:var(--blue)">이 레벨에서 배우는 것 · ${p.minutes}분</p>
            <h3 class="t-tagline" style="margin-top:10px">${esc(p.intro.heading)}</h3>
            <div class="keypoints" style="margin-top:16px">
              ${p.intro.keyPoints.map((k) => `<div class="keypoint"><i>✦</i><span>${esc(k)}</span></div>`).join('')}
            </div>
          </div>
          <p class="muted" style="margin-top:24px">🔒 LV.${id - 1}을 완료하면 열려요. 순서대로 쌓아야 실력이 무너지지 않아요.</p>
          <div class="cta-row"><a class="btn btn-primary" href="#/lesson/${id - 1}">LV.${id - 1} 하러 가기</a><a class="btn btn-ghost" href="#/roadmap">로드맵으로</a></div>
        </div></section>`;
      }

      if (!L || L.id !== id) hydrate(id);
      const l = lesson();
      this.subnav.title = `LV.${l.id} · ${l.title}`;
      const body = [renderIntro, renderGoodBad, renderExercise, renderPractice, renderQuiz, renderComplete][L.step]();
      return `<div class="lesson-shell">${body}</div>`;
    },

    bind(root, rerender) {
      const go = (step) => { L.step = step; persist(); rerender(); window.scrollTo({ top: 0 }); };

      const nextB = root.querySelector('[data-act="next"]');
      if (nextB) nextB.addEventListener('click', () => go(L.step + 1));

      const backB = root.querySelector('[data-act="back"]');
      if (backB) backB.addEventListener('click', () => go(L.step - 1));

      // builder
      root.querySelectorAll('[data-chip]').forEach((b) => {
        b.addEventListener('click', () => {
          const i = Number(b.dataset.chip);
          if (!L.builderPicked[i]) { L.builderPicked[i] = true; L.builderFeedback = i; persist(); rerender(); }
        });
      });

      // battle
      root.querySelectorAll('[data-battle]').forEach((b) => {
        b.addEventListener('click', () => {
          if (L.battleAnswered) return;
          L.battlePicked = b.dataset.battle;
          L.battleAnswered = true;
          const r = lesson().exercise.battle.rounds[L.battleRound];
          if (L.battlePicked === r.better) L.battleCorrect += 1;
          persist(); rerender();
        });
      });
      const battleNext = root.querySelector('[data-act="battle-next"]');
      if (battleNext) battleNext.addEventListener('click', () => {
        L.battleRound += 1; L.battleAnswered = false; L.battlePicked = null; persist(); rerender();
      });

      // practice
      const input = root.querySelector('[data-practice-input]');
      if (input) {
        const liveCheck = () => {
          L.practiceText = input.value;
          const dims = ZUN.analyzePrompt(input.value).dims;
          root.querySelectorAll('[data-check]').forEach((el) => {
            const d = dims.find((x) => x.key === el.dataset.check);
            el.classList.toggle('ok', !!(d && d.pass));
          });
        };
        input.addEventListener('input', liveCheck);
        input.addEventListener('blur', persist);
        liveCheck();
        const run = root.querySelector('[data-act="run"]');
        if (run) run.addEventListener('click', () => {
          if (!input.value.trim()) {
            const h = root.querySelector('[data-hint]');
            if (h) { h.textContent = '프롬프트를 먼저 작성해 주세요. 위 체크 항목을 참고하면 쉬워요.'; h.hidden = false; }
            input.focus(); return;
          }
          L.practiceText = input.value;
          L.practiceScore = ZUN.analyzePrompt(input.value).score;
          L.practiceRan = true;
          persist(); rerender();
        });
      }

      // quiz
      root.querySelectorAll('[data-quiz-opt]').forEach((b) => {
        b.addEventListener('click', () => {
          if (L.quizPicked != null) return;
          L.quizPicked = Number(b.dataset.quizOpt);
          // 틀린 문제는 오답노트로, 맞히면 노트에서 정리 (재수강 시에도 자동 반영)
          if (L.quizPicked === lesson().quiz[L.quizIdx].answer) {
            L.quizScore += 1;
            ZUN.clearWrong(L.id, L.quizIdx);
          } else {
            ZUN.recordWrong(L.id, L.quizIdx);
          }
          persist(); rerender();
        });
      });
      const quizNext = root.querySelector('[data-act="quiz-next"]');
      if (quizNext) quizNext.addEventListener('click', () => { L.quizIdx += 1; L.quizPicked = null; persist(); rerender(); });

      const finish = root.querySelector('[data-act="finish"]');
      if (finish) finish.addEventListener('click', () => {
        const levelBefore = ZUN.level();
        const tierBefore = ZUN.tierOf(levelBefore);
        const res = ZUN.completeLesson(L.id, L.quizScore, lesson().quiz.length);
        const levelAfter = ZUN.level();
        const tierAfter = ZUN.tierOf(levelAfter);
        L.completeInfo = {
          id: L.id, title: lesson().title,
          xp: res.xp || 0, badges: res.badges, perfect: res.perfect,
          quizScore: L.quizScore, levelBefore, levelAfter, tierAfter,
          tierUp: tierAfter.key !== tierBefore.key,
          done: Object.keys(ZUN.state().lessons).length,
          streak: ZUN.streakCount(),
          wrongCount: lesson().quiz.length - L.quizScore,
        };
        ZUN.refreshChrome();
        go(5);
      });

      const shareImg = root.querySelector('[data-act="share-img"]');
      if (shareImg) shareImg.addEventListener('click', () => {
        ZUN.downloadCard(ZUN.lessonCard(L.completeInfo), `zun-lv${L.completeInfo.id}-clear.png`);
        shareImg.textContent = '저장했어요 ✓';
        setTimeout(() => { shareImg.textContent = '완료 카드 저장'; }, 1800);
      });

      const shareTxt = root.querySelector('[data-act="share-txt"]');
      if (shareTxt) shareTxt.addEventListener('click', () => {
        ZUN.copyWithFeedback(shareTxt, ZUN.lessonShareText(L.completeInfo));
      });

      const complete = root.querySelector('[data-complete]');
      if (complete) ZUN.confetti(complete);
    },

    unbind() {
      // 완료 화면에서 떠나면 상태를 비워, 재진입 시 처음부터(재수강) 시작
      if (L && L.step === 5) L = null;
    },
  };
}());
