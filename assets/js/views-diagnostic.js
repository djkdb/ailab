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
  const nQ = () => questions().length;
  const nInput = () => questions().filter((q) => q.type === 'input').length;

  function reset() {
    phase = 'intro'; idx = 0; answers = {}; lastResult = null; reviewOpen = false;
    ZUN.setProgress('diagnostic', null);
  }

  // 문항이 바뀌면 예전 진행 상태는 버린다 (보기 번호가 다른 문항을 가리키게 되므로)
  const DATA_VERSION = () => window.ZUN_DIAGNOSTIC.version || 1;
  const persist = () => ZUN.setProgress('diagnostic', { v: DATA_VERSION(), idx, answers });

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
        <p class="t-lead" style="margin-top:24px;color:var(--ink-48)">${nQ()}개의 실제 상황을 드릴게요. 고르는 문항 ${nQ() - nInput()}개와,<br>프롬프트를 직접 써보는 문항 ${nInput()}개예요.</p>
        <p class="t-caption muted" style="margin-top:14px">정답을 맞히는 시험이 아니라, 평소 당신이 어떻게 하는지를 보는 테스트예요.</p>
        ${prev ? `<p class="t-caption muted" style="margin-top:12px">지난 진단: AI 레벨 ${Math.round(prev.rawPct * 0.6)} (${esc(prev.date)}) — 다시 진단하면 기록이 갱신돼요.</p>` : ''}
        <div class="cta-row">
          <button class="btn btn-primary btn-hero" data-act="start">진단 시작하기</button>
        </div>
        <p class="t-caption muted" style="margin-top:14px">약 5분 · ${nQ()}문항 · 완료 시 +80 XP · 중간에 나가도 이어서 할 수 있어요</p>
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

  // 시작 버튼을 누른 직후 한 번 더 짚어주는 화면.
  // 첫 문항에 들어가기 전에 "정답 찾기"가 아니라는 걸 못 박아야 점수가 부풀지 않는다.
  function renderBrief() {
    return `
    <section class="tile tile-light" style="padding-top:28px">
      <div class="tile-inner" style="max-width:640px">
        <div class="checkpoint" style="padding:var(--sp-sm) var(--sp-lg) 0">
          <div class="pixel-float">${window.ZUN_EXTRAS.mascotSVG(64)}</div>
          <h2 class="t-display-md" style="margin-top:16px">시작하기 전에, 딱 하나만</h2>
          <p class="t-lead" style="margin-top:12px;font-size:19px">이건 <b>시험이 아니에요.</b><br>정답을 고르지 말고, <b>평소 당신이 하는 대로</b> 골라주세요.</p>
        </div>

        <div class="brief-list">
          <div class="brief-item">
            <span class="brief-ico">🙂</span>
            <span><b>좋아 보이는 답을 고르면 손해예요</b>
            <span>이상적인 답을 고르면 레벨이 실제보다 높게 나와요. 그러면 이미 아는 내용부터 배우게 되고, 로드맵이 시간 낭비가 됩니다.</span></span>
          </div>
          <div class="brief-item">
            <span class="brief-ico">✍️</span>
            <span><b>${nInput()}문항은 직접 써야 해요</b>
            <span>프롬프트를 직접 쓰는 문항이 ${nInput()}개 섞여 있어요. 잘 쓰려고 애쓰지 말고 평소대로 쓰면 됩니다. 막히면 건너뛰어도 돼요.</span></span>
          </div>
          <div class="brief-item">
            <span class="brief-ico">💾</span>
            <span><b>중간에 나가도 괜찮아요</b>
            <span>${Math.floor((nQ() - 1) / 5)}번 쉬어가는 지점이 있고, 답은 자동 저장돼요. 나갔다 와도 그 문항부터 이어서 합니다.</span></span>
          </div>
        </div>

        <div class="cta-row" style="margin-top:24px">
          <button class="btn btn-primary btn-hero" data-act="begin">알겠어요, 시작할게요</button>
        </div>
        <p class="t-caption muted" style="text-align:center;margin-top:12px">낮게 나와도 괜찮아요. 그래야 올라가는 게 보여요.</p>
      </div>
    </section>`;
  }

  // 20문항을 한 번에 달리면 지쳐요. 5문항(=5역량 한 바퀴)마다 숨 고르는 지점을 둡니다.
  const ROUND_NOTES = [
    { title: '1바퀴 완주!', body: '5가지 역량을 한 번씩 지나왔어요. 어렵게 느껴진 문항이 있어도 괜찮아요 — 그게 바로 앞으로 배울 부분이에요.' },
    { title: '절반 왔어요', body: '10문항 남았어요. 지금까지 고른 답은 자동 저장돼 있으니, 잠깐 나갔다 와도 이어서 할 수 있어요.' },
    { title: '15문항 완료', body: '이제 5문항만 남았어요. 마지막 바퀴는 자동화와 검증처럼 조금 더 깊은 질문이 섞여 있어요.' },
  ];

  function renderCheckpoint() {
    const n = Math.floor(idx / 5);
    const note = ROUND_NOTES[n - 1] || ROUND_NOTES[0];
    const qs = questions();
    return `
    <section class="tile tile-light" style="padding-top:48px">
      <div class="tile-inner" style="max-width:720px">
        <div class="diag-progress"><i style="width:${(idx / qs.length) * 100}%"></i></div>
        <div class="checkpoint">
          <div class="pixel-float">${window.ZUN_EXTRAS.mascotSVG(72)}</div>
          <h2 class="t-display-md" style="margin-top:16px">${esc(note.title)}</h2>
          <p class="muted" style="margin-top:10px">${esc(note.body)}</p>
          <div class="round-dots">
            ${[0, 1, 2, 3].map((i) => `<span class="round-dot${i < n ? ' done' : ''}"></span>`).join('')}
          </div>
          <p class="t-caption muted">${idx} / ${qs.length} 문항 완료</p>
          <div class="cta-row" style="margin-top:24px">
            <button class="btn btn-primary btn-hero" data-act="continue">이어서 풀기</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderQuiz() {
    const qs = questions();
    const q = qs[idx];
    const comp = ZUN.COMPETENCIES[q.competency];
    const picked = answers[q.id];
    const isInput = q.type === 'input';

    // spot 유형 — AI가 실제로 내놓은 결과를 보여주고 그 안의 문제를 찾게 한다
    const outputBox = q.output
      ? `<div class="diag-output"><span class="diag-output-tag">AI 화면</span>${esc(q.output)}</div>`
      : '';

    // 매 문항마다 같은 자리에서 같은 말을 반복한다 — "좋아 보이는 답"을 고르는 걸 막는 장치
    const INSTRUCT = {
      choice: '정답을 고르는 게 아니에요. <b>평소 당신이 실제로 하는 쪽</b>을 골라주세요.',
      spot: '정답을 맞히는 문제가 아니에요. <b>지금 당신 눈에 보이는 대로</b> 골라주세요.',
      input: '잘 쓰려고 하지 않아도 돼요. <b>평소 AI에 쓰시던 그대로</b> 써주세요.',
    };
    const instruct = `<p class="diag-instruct">${INSTRUCT[q.type] || INSTRUCT.choice}</p>`;

    const body = isInput
      ? `
        ${instruct}
        <textarea class="diag-input" data-diag-input rows="5"
          placeholder="${esc(q.placeholder || 'AI 채팅창에 쓰듯이 적어보세요.')}">${esc(typeof picked === 'object' && picked ? picked.text : '')}</textarea>
        <div class="cta-row left" style="margin-top:16px">
          <button class="btn btn-primary" data-act="submit-input">이렇게 보낼게요 →</button>
          <button class="btn btn-pearl" data-act="skip-input">잘 모르겠어요 · 건너뛰기</button>
        </div>
        <p class="t-caption muted" style="margin-top:10px">채점 기준은 결과 화면에서 문항별로 알려드려요.</p>`
      : `${instruct}<div class="option-list">${q.options.map((o, i) => `
          <button class="option${picked === i ? ' is-selected' : ''}" data-opt="${i}">
            <span class="opt-key">${i + 1}</span>
            <span>${esc(o.text)}</span>
          </button>`).join('')}</div>`;

    return `
    <section class="tile tile-light" style="padding-top:48px">
      <div class="tile-inner" style="max-width:720px">
        <div class="diag-progress"><i style="width:${(idx / qs.length) * 100}%"></i></div>
        <div class="diag-meta">
          <span class="comp-chip"><i></i>${esc(comp.label)}</span>
          ${isInput ? '<span class="diag-type-chip">직접 작성</span>' : ''}
          <span class="t-caption muted">${idx + 1} / ${qs.length}</span>
        </div>
        <div class="diag-scenario">${esc(q.scenario)}</div>
        ${outputBox}
        <h2 class="t-display-md diag-question">${esc(q.question)}</h2>
        ${body}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap">
          ${idx > 0 ? '<button class="btn btn-pearl" data-act="prev">← 이전</button>' : '<span></span>'}
          <span class="t-caption muted">${isInput ? '진행은 자동 저장돼요' : '키보드 1–4로도 고를 수 있어요 · 진행은 자동 저장돼요'}</span>
          <button class="btn-step-back" data-act="restart">처음부터 다시</button>
        </div>
      </div>
    </section>`;
  }

  function renderReview() {
    const qs = questions();
    return qs.map((q, i) => {
      const a = answers[q.id];
      const got = ZUN.answerPoints(q, a);
      const full = got === 3;
      const head = `
        <p class="t-caption-strong" style="color:var(--ink-48)">${i + 1}. ${esc(ZUN.COMPETENCIES[q.competency].label)}${q.type === 'input' ? ' · 직접 작성' : ''}</p>
        <p style="margin-top:6px;font-size:15px">${esc(q.question)}</p>`;

      // 직접 작성 문항 — 내가 쓴 프롬프트를 7개 항목으로 되짚어준다
      if (q.type === 'input') {
        const text = (a && typeof a === 'object') ? a.text : '';
        const dims = text ? ZUN.analyzePrompt(text).dims : [];
        const chips = dims.map((d) => `<span class="dim-chip${d.pass ? ' on' : ''}">${d.pass ? '✓' : '·'} ${esc(d.label)}</span>`).join('');
        return `
        <div class="card" style="text-align:left;margin-bottom:12px">
          ${head}
          <div class="dim-row ${full ? 'pass' : 'fail'}" style="margin-top:12px">
            <i class="d-ico">${full ? '✅' : '▪️'}</i>
            <span><b>내가 쓴 프롬프트 · ${got}점</b><span>${text ? esc(text) : '건너뛴 문항이에요 (0점)'}</span></span>
          </div>
          ${chips ? `<div class="dim-chips">${chips}</div>` : ''}
          <p class="t-caption muted" style="margin-top:10px">${esc(q.why)}</p>
        </div>`;
      }

      const mine = (typeof a === 'number') ? q.options[a] : null;
      const best = q.options.reduce((x, y) => (y.score > x.score ? y : x));
      return `
      <div class="card" style="text-align:left;margin-bottom:12px">
        ${head}
        <div class="dim-row ${full ? 'pass' : 'fail'}" style="margin-top:12px">
          <i class="d-ico">${full ? '✅' : '▪️'}</i>
          <span><b>내 선택 · ${got}점</b><span>${esc(mine ? mine.text : '무응답')}</span></span>
        </div>
        ${full ? '' : `
        <div class="dim-row pass" style="margin-top:8px">
          <i class="d-ico">🎯</i>
          <span><b>가장 좋은 선택 · 3점</b><span>${esc(best.text)}</span></span>
        </div>`}
        <p class="t-caption muted" style="margin-top:10px">${esc(q.why)}</p>
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

    const best = questions().filter((q) => ZUN.answerPoints(q, answers[q.id]) === 3).length;
    const written = questions().filter((q) => q.type === 'input');
    const skipped = written.filter((q) => {
      const a = answers[q.id];
      return !(a && typeof a === 'object' && a.text);
    }).length;

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
          <p class="muted" style="margin-top:8px">${questions().length}문항 중 <b>${best}개</b>에서 만점을 받으셨어요. 나머지는 어떤 답이 더 나았는지 확인해 보세요.${skipped ? ` 건너뛴 직접 작성 ${skipped}문항은 0점으로 계산했어요.` : ''}</p>
          <div class="cta-row" style="margin-top:20px">
            <button class="btn btn-pearl" data-act="toggle-review">${reviewOpen ? '접기' : '문항별로 펼쳐보기'}</button>
          </div>
        </div>
        ${reviewOpen ? `<div style="margin-top:32px">${renderReview()}</div>` : ''}
      </div>
    </section>`;
  }

  ZUN.views.diagnostic = {
    subnav: { title: 'AI 레벨 진단', cta: `<span class="t-caption">5분 · ${nQ()}문항</span>` },

    render() {
      // 저장된 진행이 있으면 인트로를 건너뛰고 그 문항에서 바로 이어간다.
      // (새로고침·앱 전환 후 "날아갔나?" 싶은 순간을 없애기 위함)
      if (phase === 'intro') {
        const saved = ZUN.getProgress('diagnostic');
        if (saved && saved.v !== DATA_VERSION()) {
          ZUN.setProgress('diagnostic', null);
        } else if (saved && saved.answers && Object.keys(saved.answers).length) {
          phase = 'quiz'; idx = saved.idx; answers = saved.answers;
        }
      }
      if (phase === 'intro') return renderIntro();
      if (phase === 'brief') return renderBrief();
      if (phase === 'checkpoint') return renderCheckpoint();
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
          phase = 'brief'; rerender(); window.scrollTo({ top: 0 });
        });
        return;
      }

      if (phase === 'brief') {
        const begin = root.querySelector('[data-act="begin"]');
        if (begin) begin.addEventListener('click', () => {
          phase = 'quiz'; idx = 0; answers = {};
          persist(); rerender(); window.scrollTo({ top: 0 });
        });
        return;
      }

      if (phase === 'checkpoint') {
        const cont = root.querySelector('[data-act="continue"]');
        if (cont) cont.addEventListener('click', () => {
          phase = 'quiz'; rerender(); window.scrollTo({ top: 0 });
        });
        return;
      }

      if (phase === 'quiz') {
        const qs = questions();
        const q = qs[idx];
        let picking = false; // 더블클릭·연타로 두 문항 넘어가는 것 방지

        const advance = () => {
          if (idx < qs.length - 1) {
            idx += 1; persist();
            // 5문항마다(마지막 문항 직전 제외) 숨 고르는 지점
            if (idx % 5 === 0 && idx < qs.length) phase = 'checkpoint';
            rerender();
            window.scrollTo({ top: 0 });
          } else {
            lastResult = ZUN.scoreDiagnostic(answers, qs);
            ZUN.setDiagnostic(lastResult);
            phase = 'result';
            rerender();
            window.scrollTo({ top: 0 });
          }
        };

        const pick = (i) => {
          if (picking) return;
          picking = true;
          answers[q.id] = i;
          const btn = root.querySelector(`[data-opt="${i}"]`);
          if (btn) btn.classList.add('is-selected');
          setTimeout(advance, 260);
        };

        if (q.type === 'input') {
          const ta = root.querySelector('[data-diag-input]');
          const submit = () => {
            if (picking) return;
            picking = true;
            const text = ta ? ta.value.trim() : '';
            // 채점은 프롬프트 분석기가 그대로 한다 — 진단과 학습의 기준을 하나로 유지
            answers[q.id] = { text, score: text ? ZUN.analyzePrompt(text).score : 0 };
            persist();
            advance();
          };
          const submitBtn = root.querySelector('[data-act="submit-input"]');
          if (submitBtn) submitBtn.addEventListener('click', submit);
          const skipBtn = root.querySelector('[data-act="skip-input"]');
          if (skipBtn) skipBtn.addEventListener('click', () => {
            if (picking) return;
            picking = true;
            answers[q.id] = { text: '', score: 0 };
            persist();
            advance();
          });
          if (ta) {
            ta.addEventListener('keydown', (e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
            });
            setTimeout(() => ta.focus(), 60);
          }
        } else {
          root.querySelectorAll('[data-opt]').forEach((b) => {
            b.addEventListener('click', () => pick(Number(b.dataset.opt)));
          });
          // 숫자 단축키는 선택형에서만 — 작성형에서 켜두면 타이핑이 곧 응답이 된다
          this._keyHandler = (e) => {
            const n = Number(e.key);
            if (n >= 1 && n <= 4 && !e.repeat) pick(n - 1);
          };
          document.addEventListener('keydown', this._keyHandler);
        }

        const prevBtn = root.querySelector('[data-act="prev"]');
        if (prevBtn) prevBtn.addEventListener('click', () => { idx -= 1; persist(); rerender(); });

        const restart = root.querySelector('[data-act="restart"]');
        if (restart) restart.addEventListener('click', () => {
          if (!window.confirm('지금까지 고른 답을 지우고 처음부터 다시 할까요?')) return;
          reset(); rerender(); window.scrollTo({ top: 0 });
        });
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
        ZUN.downloadCard(ZUN.shareCard(lastResult),
          `zun-ai-level-${Math.round(lastResult.rawPct * 0.6)}.png`);
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
