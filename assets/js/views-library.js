/* ZUN AI Roadmap — 프롬프트 도서관
   프롬프트를 "나눠주는" 곳이 아니라 "뜯어보는" 곳.
   모든 항목은 분석기로 실시간 채점되어 왜 좋은지 근거와 함께 보여준다. */
(function () {
  'use strict';
  const ZUN = window.ZUN;
  const esc = ZUN.esc;

  let query = '';
  let cat = 'all';       // all | 카테고리 키 | saved | mine
  let openId = null;

  const CATS = () => window.ZUN_PROMPT_CATS;
  const ALL = () => window.ZUN_PROMPTS;
  const catOf = (k) => CATS().find((c) => c.key === k);

  const TOOL_LABEL = { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini' };
  const TOOL_COLOR = { chatgpt: '#10a37f', claude: '#d97757', gemini: '#4285f4' };

  function matches(p, q) {
    if (!q) return true;
    const hay = `${p.title} ${p.text} ${p.tip} ${catOf(p.cat) ? catOf(p.cat).label : ''}`.toLowerCase();
    // 공백으로 나눈 모든 토큰이 포함되어야 함 (AND 검색)
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.indexOf(t) !== -1);
  }

  function visibleList() {
    const s = ZUN.state();
    if (cat === 'mine') {
      return s.mine
        .filter((m) => matches({ title: m.title, text: m.text, tip: '', cat: '' }, query))
        .map((m) => ({ id: m.id, title: m.title, text: m.text, tip: '', cat: null, tools: [], mine: true }));
    }
    let list = ALL();
    if (cat === 'saved') list = list.filter((p) => ZUN.isSaved(p.id));
    else if (cat !== 'all') list = list.filter((p) => p.cat === cat);
    return list.filter((p) => matches(p, query));
  }

  function scoreChip(text) {
    const a = ZUN.analyzePrompt(text);
    const hit = a.dims.filter((d) => d.pass);
    return { score: a.score, grade: a.grade, hit };
  }

  function card(p) {
    const open = openId === p.id;
    const c = p.cat ? catOf(p.cat) : null;
    const a = scoreChip(p.text);
    const saved = p.mine ? true : ZUN.isSaved(p.id);
    const lesson = p.lesson ? window.ZUN_LESSONS.find((l) => l.id === p.lesson) : null;

    return `
    <article class="prompt-card${open ? ' is-open' : ''}">
      <button class="prompt-head" data-open="${esc(p.id)}" aria-expanded="${open}">
        <span class="prompt-head-main">
          <span class="prompt-title">${c ? c.icon + ' ' : '📝 '}${esc(p.title)}</span>
          <span class="prompt-meta">
            ${c ? `<span class="p-cat">${esc(c.label)}</span>` : '<span class="p-cat">내가 만든 것</span>'}
            ${(p.tools || []).map((t) => `<span class="p-tool" style="--tc:${TOOL_COLOR[t]}">${esc(TOOL_LABEL[t])}</span>`).join('')}
            <span class="p-score">${a.score}점 · ${esc(a.grade.name)}</span>
          </span>
        </span>
        <span class="prompt-caret">${open ? '−' : '+'}</span>
      </button>

      ${open ? `
      <div class="prompt-body">
        <pre class="prompt-text" data-text>${esc(p.text)}</pre>

        <div class="why-box">
          <p class="t-caption-strong" style="color:var(--ink-48)">이 프롬프트가 좋은 이유 — 분석기가 찾은 요소</p>
          <div class="why-chips">
            ${a.hit.map((d) => `<span class="why-chip">✓ ${esc(d.label)}</span>`).join('')}
          </div>
        </div>

        ${p.tip ? `<p class="prompt-tip">💡 ${esc(p.tip)}</p>` : ''}

        <div class="prompt-actions">
          <button class="btn btn-utility" data-copy="${esc(p.id)}">복사</button>
          <button class="btn btn-pearl" data-analyze="${esc(p.id)}">분석기에서 열기</button>
          ${p.mine
            ? `<button class="btn btn-pearl" data-del="${esc(p.id)}">삭제</button>`
            : `<button class="btn btn-pearl" data-save="${esc(p.id)}">${saved ? '★ 저장됨' : '☆ 저장'}</button>`}
          ${lesson ? `<a class="btn btn-pearl" href="#/lesson/${lesson.id}">관련 레슨 · LV.${lesson.id}</a>` : ''}
        </div>
      </div>` : ''}
    </article>`;
  }

  ZUN.views.library = {
    subnav: { title: '프롬프트 도서관', cta: '' },

    render() {
      const s = ZUN.state();
      const list = visibleList();
      const savedCount = s.saved.length;
      const mineCount = s.mine.length;

      const chips = [
        `<button class="situation-chip ${cat === 'all' ? 'is-active' : ''}" data-cat="all">전체 ${ALL().length}</button>`,
        ...CATS().map((c) => {
          const n = ALL().filter((p) => p.cat === c.key).length;
          return `<button class="situation-chip ${cat === c.key ? 'is-active' : ''}" data-cat="${c.key}">${c.icon} ${esc(c.label)} ${n}</button>`;
        }),
        `<button class="situation-chip ${cat === 'saved' ? 'is-active' : ''}" data-cat="saved">★ 저장함 ${savedCount}</button>`,
        `<button class="situation-chip ${cat === 'mine' ? 'is-active' : ''}" data-cat="mine">📝 내가 만든 것 ${mineCount}</button>`,
      ].join('');

      const emptyMsg = cat === 'saved'
        ? '아직 저장한 프롬프트가 없어요. 마음에 드는 프롬프트를 펼쳐서 ☆ 저장을 눌러보세요.'
        : cat === 'mine'
          ? 'AI 랩의 프롬프트 분석기에서 만든 프롬프트를 여기에 보관할 수 있어요.'
          : `"${esc(query)}"와 맞는 프롬프트가 없어요. 다른 단어로 찾아보세요.`;

      const sources = window.ZUN_PROMPT_SOURCES.map((x) => `
        <div class="card" style="text-align:left">
          <h3 style="font-size:17px">${esc(x.name)} <span class="t-fine muted">· ${esc(x.lang)}</span></h3>
          <p style="margin-top:6px">${esc(x.desc)}</p>
          <p style="margin-top:12px"><a href="${esc(x.url)}" target="_blank" rel="noopener">바로 가기 ↗</a></p>
        </div>`).join('');

      return `
      <section class="tile tile-light tile-center" style="padding-bottom:32px">
        <div class="tile-inner wide">
          <p class="eyebrow">Prompt Library</p>
          <h1 class="t-display">베껴 쓰지 말고, 뜯어보세요.</h1>
          <p class="t-lead" style="margin-top:12px;color:var(--ink-48);font-size:21px">
            실제로 쓸 수 있는 프롬프트 ${ALL().length}개. 각 프롬프트가 <b style="color:var(--ink)">왜</b> 좋은지<br>
            분석기가 요소별로 뜯어서 보여줘요.
          </p>

          <div class="lib-search">
            <input type="search" class="search-input" data-q placeholder="무엇을 하고 싶으세요? (예: 자소서, 요약, 여행, 거절)" value="${esc(query)}" aria-label="프롬프트 검색">
          </div>
          <div class="situation-picker" style="margin-top:16px">${chips}</div>
          <p class="t-caption muted" style="margin-top:14px">${list.length}개 표시 중</p>
        </div>
      </section>

      <section class="tile tile-parchment" style="padding-top:32px">
        <div class="tile-inner" style="max-width:760px">
          ${list.length
            ? `<div class="prompt-list">${list.map(card).join('')}</div>`
            : `<p class="t-lead" style="text-align:center;color:var(--ink-48);font-size:19px;padding:48px 0">${emptyMsg}</p>`}
        </div>
      </section>

      <section class="tile tile-light tile-center">
        <div class="tile-inner">
          <h2 class="t-display-md">더 찾고 싶다면</h2>
          <p class="muted" style="margin-top:8px">전 세계 사용자와 개발사가 공개한 프롬프트 모음이에요. 대부분 영어라, 번역해서 읽고 우리 상황에 맞게 바꿔 쓰는 연습을 해보세요.</p>
          <div class="card-grid cols-2" style="margin-top:32px;text-align:left">${sources}</div>
          <p class="t-caption muted" style="margin-top:24px">위 도서관의 프롬프트는 커뮤니티에서 검증된 패턴(역할 → 맥락 → 형식 → 조건 → 되묻기)을 참고해<br>한국 상황에 맞게 새로 작성했어요. 패턴 참고: awesome-chatgpt-prompts (CC0)</p>
        </div>
      </section>`;
    },

    bind(root, rerender) {
      const input = root.querySelector('[data-q]');
      if (input) {
        // 입력 중 리렌더로 포커스를 잃지 않도록, 렌더 후 커서를 끝으로 되돌린다
        let t = null;
        input.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            query = input.value;
            openId = null;
            rerender();
            const box = document.querySelector('[data-q]');
            if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
          }, 220);
        });
      }

      root.querySelectorAll('[data-cat]').forEach((b) => {
        b.addEventListener('click', () => { cat = b.dataset.cat; openId = null; rerender(); });
      });

      root.querySelectorAll('[data-open]').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.dataset.open;
          openId = openId === id ? null : id;
          rerender();
        });
      });

      const find = (id) => {
        const p = ALL().find((x) => x.id === id);
        if (p) return p;
        const m = ZUN.state().mine.find((x) => x.id === id);
        return m ? { id: m.id, text: m.text } : null;
      };

      root.querySelectorAll('[data-copy]').forEach((b) => {
        b.addEventListener('click', () => {
          const p = find(b.dataset.copy);
          if (p && navigator.clipboard) navigator.clipboard.writeText(p.text).then(() => {
            b.textContent = '복사했어요 ✓';
            setTimeout(() => { b.textContent = '복사'; }, 1600);
          });
        });
      });

      root.querySelectorAll('[data-analyze]').forEach((b) => {
        b.addEventListener('click', () => {
          const p = find(b.dataset.analyze);
          if (!p) return;
          ZUN.pendingAnalyze = p.text;   // 랩이 열리면서 집어간다
          window.location.hash = '#/lab';
        });
      });

      root.querySelectorAll('[data-save]').forEach((b) => {
        b.addEventListener('click', () => {
          const now = ZUN.toggleSaved(b.dataset.save);
          b.textContent = now ? '★ 저장됨' : '☆ 저장';
          ZUN.refreshChrome();
        });
      });

      root.querySelectorAll('[data-del]').forEach((b) => {
        b.addEventListener('click', () => {
          if (!window.confirm('이 프롬프트를 삭제할까요?')) return;
          ZUN.removeMine(b.dataset.del);
          openId = null;
          rerender();
        });
      });
    },

    unbind() {},
  };
}());
