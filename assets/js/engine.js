/* ============================================================
   ZUN AI Roadmap — Engine
   state · level/xp · streak · badges · prompt analyzer
   ============================================================ */
(function () {
  'use strict';

  const ZUN = (window.ZUN = window.ZUN || {});
  const STORE_KEY = 'zun_ai_roadmap_v1';

  /* ---------- utils ---------- */
  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const todayKey = (d) => {
    const t = d || new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
  };

  // 로컬 날짜 기준 '하루 1 증가' 인덱스 — UTC 환산이라 서머타임 전환에도 안전
  const dayOfYear = () => {
    const n = new Date();
    return Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86400000);
  };

  /* ---------- state ---------- */
  const DEFAULT_STATE = () => ({
    v: 1,
    xp: 0,
    base: 0,
    diagnostic: null,
    lessons: {},
    challenges: {},
    badges: [],
    streakDays: [],
    counts: { analyzer: 0, quizPerfect: 0 },
    progress: {},   // 진행 중인 진단·레슨 (새로고침/이탈 후 이어하기용)
  });

  let state = DEFAULT_STATE();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(DEFAULT_STATE(), JSON.parse(raw));
    state.counts = Object.assign({ analyzer: 0, quizPerfect: 0 }, state.counts);
    state.progress = state.progress || {};
  } catch (e) { /* private mode etc. — keep in-memory state */ }

  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  };

  /* ---------- level / tier ---------- */
  const TIERS = [
    { key: 'zero', name: 'ZERO', min: 0, max: 39, desc: '이제 막 시작한 단계' },
    { key: 'up', name: 'UP', min: 40, max: 74, desc: 'AI를 도구로 쓰기 시작한 단계' },
    { key: 'next', name: 'NEXT', min: 75, max: 100, desc: 'AI와 함께 생각하는 단계' },
  ];

  const tierOf = (lv) => (lv >= 75 ? TIERS[2] : lv >= 40 ? TIERS[1] : TIERS[0]);

  const level = () => {
    let lv = state.base;
    Object.values(state.lessons).forEach((l) => { lv += 3 + (l.perfect ? 1 : 0); });
    lv += Math.min(10, Object.keys(state.challenges).length);
    return Math.max(0, Math.min(100, Math.round(lv)));
  };

  /* ---------- 진행 중 상태 (이어하기) ---------- */
  const setProgress = (key, val) => {
    if (val == null) delete state.progress[key];
    else state.progress[key] = val;
    save();
  };
  const getProgress = (key) => state.progress[key] || null;

  /* ---------- streak ---------- */
  const touchStreak = () => {
    const k = todayKey();
    if (!state.streakDays.includes(k)) {
      state.streakDays.push(k);
      state.streakDays = state.streakDays.slice(-90);
      save();
    }
  };

  const streakCount = () => {
    const days = new Set(state.streakDays);
    let count = 0;
    const cur = new Date();
    if (!days.has(todayKey(cur))) cur.setDate(cur.getDate() - 1); // 오늘 아직 안 했으면 어제부터
    while (days.has(todayKey(cur))) {
      count += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  };

  /* ---------- XP ---------- */
  const addXP = (n) => { state.xp += n; touchStreak(); save(); };

  /* ---------- badges ---------- */
  const BADGES = [
    { id: 'first-diag', emoji: '🧭', name: '첫 진단', desc: 'AI 레벨 진단 완료', test: (s) => !!s.diagnostic },
    { id: 'first-lesson', emoji: '🌱', name: '첫 발자국', desc: '첫 레슨 완료', test: (s) => Object.keys(s.lessons).length >= 1 },
    { id: 'zero-grad', emoji: '🎓', name: 'ZERO 졸업', desc: '레벨 1~5 완주', test: (s) => [1, 2, 3, 4, 5].every((i) => s.lessons[i]) },
    { id: 'up-grad', emoji: '🚀', name: 'UP 졸업', desc: '레벨 6~10 완주', test: (s) => [6, 7, 8, 9, 10].every((i) => s.lessons[i]) },
    { id: 'next-grad', emoji: '👑', name: 'NEXT 완주', desc: '로드맵 15레벨 완주', test: (s) => Object.keys(s.lessons).length >= 15 },
    { id: 'perfect-3', emoji: '🎯', name: '퍼펙트 x3', desc: '퀴즈 만점 3회', test: (s) => s.counts.quizPerfect >= 3 },
    { id: 'streak-3', emoji: '🔥', name: '3일 연속', desc: '3일 연속 학습', test: () => streakCount() >= 3 },
    { id: 'streak-7', emoji: '⚡', name: '7일 연속', desc: '일주일 연속 학습', test: () => streakCount() >= 7 },
    { id: 'analyzer-10', emoji: '🔬', name: '프롬프트 과학자', desc: '프롬프트 분석 10회', test: (s) => s.counts.analyzer >= 10 },
    { id: 'challenge-5', emoji: '🏅', name: '도전자', desc: '데일리 도전 5회 완료', test: (s) => Object.keys(s.challenges).length >= 5 },
    { id: 'level-50', emoji: '📈', name: '레벨 50', desc: 'AI 레벨 50 달성', test: () => level() >= 50 },
    { id: 'level-100', emoji: '💎', name: '레벨 100', desc: 'AI 레벨 100 달성', test: () => level() >= 100 },
  ];

  const awardBadges = () => {
    const fresh = [];
    BADGES.forEach((b) => {
      if (!state.badges.includes(b.id) && b.test(state)) {
        state.badges.push(b.id);
        state.xp += 50;
        fresh.push(b);
      }
    });
    if (fresh.length) save();
    return fresh;
  };

  /* ---------- domain actions ---------- */
  const XP_BY_TIER = { zero: 100, up: 150, next: 200 };
  const lessonTier = (id) => (id <= 5 ? 'zero' : id <= 10 ? 'up' : 'next');

  const completeLesson = (id, quizScore, quizTotal) => {
    delete state.progress.lesson;   // 완료했으니 이어하기 기록은 정리
    const perfect = quizScore === quizTotal;
    const already = !!state.lessons[id];
    if (!already) {
      state.lessons[id] = { done: true, quiz: quizScore, perfect, date: todayKey() };
      if (perfect) state.counts.quizPerfect += 1;
      addXP(XP_BY_TIER[lessonTier(id)] + (perfect ? 30 : 0));
    }
    const fresh = awardBadges();
    save();
    return { already, perfect, badges: fresh, xp: already ? 0 : XP_BY_TIER[lessonTier(id)] + (perfect ? 30 : 0) };
  };

  const setDiagnostic = (result) => {
    delete state.progress.diagnostic;   // 완료했으니 이어하기 기록은 정리
    state.diagnostic = result;
    state.base = Math.round(result.rawPct * 0.6); // 진단만으로는 60까지 — NEXT는 실전으로만
    addXP(80);
    const fresh = awardBadges();
    save();
    return fresh;
  };

  const completeChallenge = (challengeId) => {
    const k = todayKey();
    if (state.challenges[k]) return { already: true, badges: [] };
    state.challenges[k] = { id: challengeId, date: k };
    addXP(30);
    const fresh = awardBadges();
    save();
    return { already: false, badges: fresh };
  };

  const countAnalyzer = () => {
    state.counts.analyzer += 1;
    touchStreak();
    const fresh = awardBadges();
    save();
    return fresh;
  };

  const isUnlocked = (id) => {
    if (id === 1) return true;
    if (state.lessons[id - 1]) return true;
    const start = state.diagnostic ? state.diagnostic.startLevel : 1;
    return id <= start;
  };

  const resetAll = () => { state = DEFAULT_STATE(); save(); };

  /* ---------- diagnostic scoring ---------- */
  const COMPETENCIES = {
    questioning: { label: '질문력', desc: '원하는 것을 명확히 묻는 힘' },
    prompting: { label: '프롬프트 작성', desc: '역할·맥락·형식을 담아 쓰는 힘' },
    toolchoice: { label: '도구 선택', desc: '상황에 맞는 AI를 고르는 눈' },
    verification: { label: '정보 검증', desc: 'AI의 답을 의심하고 확인하는 습관' },
    automation: { label: '자동화 사고', desc: '반복을 시스템으로 바꾸는 사고' },
  };

  const scoreDiagnostic = (answers, questions) => {
    // answers: {questionId: optionIndex}
    const comps = {};
    Object.keys(COMPETENCIES).forEach((k) => { comps[k] = { got: 0, max: 0 }; });
    questions.forEach((q) => {
      const picked = answers[q.id];
      const got = picked != null ? q.options[picked].score : 0;
      comps[q.competency].got += got;
      comps[q.competency].max += 3;
    });
    let got = 0; let max = 0;
    const compPct = {};
    Object.keys(comps).forEach((k) => {
      got += comps[k].got; max += comps[k].max;
      compPct[k] = Math.round((comps[k].got / Math.max(1, comps[k].max)) * 100);
    });
    const rawPct = Math.round((got / Math.max(1, max)) * 100);

    // 시작 레벨 추천
    let startLevel = 1;
    if (rawPct >= 70) startLevel = 4;
    else if (rawPct >= 50) startLevel = 3;
    else if (rawPct >= 30) startLevel = 2;

    // 약점 역량 → 집중 레벨
    const FOCUS_MAP = {
      questioning: [2], prompting: [3, 4], toolchoice: [5, 6, 7],
      verification: [10], automation: [11, 12],
    };
    const weakest = Object.keys(compPct).sort((a, b) => compPct[a] - compPct[b]).slice(0, 2);
    const focusLevels = [...new Set(weakest.flatMap((k) => FOCUS_MAP[k]))].sort((a, b) => a - b);

    return { date: todayKey(), rawPct, comps: compPct, weakest, focusLevels, startLevel };
  };

  /* ---------- prompt analyzer ---------- */
  const DIMS = [
    {
      key: 'specific', label: '구체성', weight: 15,
      test: (t) => t.replace(/\s/g, '').length >= 25,
      pass: '무엇을 원하는지 충분히 설명했어요.',
      fail: '너무 짧아요. AI는 독심술사가 아니에요 — 원하는 것을 자세히 적어주세요.',
      tip: '한 문장 대신 3~4문장으로 늘려보세요.',
    },
    {
      key: 'role', label: '역할 부여', weight: 15,
      test: (t) => /(역할|너는|당신은|당신이|네가|로서|전문가|담당자|선생님|컨설턴트|마케터|기획자|작가|코치|act as|you are)/i.test(t),
      pass: 'AI에게 역할을 줬어요. 답변의 관점이 잡혀요.',
      fail: '역할이 없어요. "너는 OO 전문가야"라고 시작해 보세요.',
      tip: '예: "너는 10년 차 인사담당자야."',
    },
    {
      key: 'context', label: '맥락 제공', weight: 20,
      test: (t) => /(상황|배경|나는|저는|제가|우리|현재|중이|위해|목표|목적|대상|독자|학생|학교|회사|고객|과제|시험|발표|면접)/.test(t) || t.length >= 120,
      pass: '왜, 누구를 위해 필요한지 맥락이 있어요.',
      fail: '맥락이 없어요. 누구를 위한 것이고 왜 필요한지 알려주세요.',
      tip: '예: "IT 스타트업 인턴 지원용이야. 나는 비전공자고..."',
    },
    {
      key: 'format', label: '형식 지정', weight: 20,
      test: (t) => /(형식|표로|표 형태|목록|리스트|단계|번호|불릿|개조식|json|마크다운|글자|자 이내|자 내외|줄 이내|문단|구조|틀|템플릿|정리해|스타일|구도|카메라|장면|클립)/i.test(t),
      pass: '원하는 출력 형식을 지정했어요.',
      fail: '형식 지정이 없어요. 표·목록·단계 등 원하는 모양을 말해주세요.',
      tip: '예: "번호 목록으로, 항목당 한 줄 설명을 붙여줘."',
    },
    {
      key: 'constraint', label: '제약 조건', weight: 15,
      test: (t) => /(하지 마|하지마|제외|빼고|금지|이내|이하|이상|최대|최소|톤|말투|스타일|어조|반드시|꼭 |기준|조건)/.test(t),
      pass: '분량·톤·금지사항 같은 조건을 걸었어요.',
      fail: '조건이 없어요. 분량, 톤, 피해야 할 것을 정해주세요.',
      tip: '예: "500자 이내로, 과장 없이 담백한 톤으로."',
    },
    {
      key: 'example', label: '예시 제시', weight: 10,
      test: (t) => /(예시|예를 들|예:|예\)|샘플|참고로|다음과 같|이런 식으로|처럼 써)/.test(t),
      pass: '예시로 기대치를 보여줬어요. 결과가 안정돼요.',
      fail: '예시가 없어요. 원하는 결과물의 예를 한 개만 보여줘도 달라져요.',
      tip: '예: "예시: \'문제를 발견하면 손이 먼저 움직이는 사람\'"',
    },
    {
      key: 'think', label: '사고 유도', weight: 5,
      test: (t) => /(단계별|차근차근|이유|근거|출처|검토|확인해|물어봐|질문해|먼저 물|하나씩)/.test(t),
      pass: '단계적으로 생각하거나 되묻게 했어요. 고수의 습관이에요.',
      fail: '"필요한 정보가 있으면 먼저 물어봐줘" 한 줄이면 대화의 질이 달라져요.',
      tip: '예: "부족한 정보가 있으면 나에게 먼저 질문해줘."',
    },
  ];

  const analyzePrompt = (text) => {
    const t = String(text || '').trim();
    const dims = DIMS.map((d) => ({
      key: d.key, label: d.label, weight: d.weight,
      pass: d.test(t), msg: d.test(t) ? d.pass : d.fail, tip: d.tip,
    }));
    let score = dims.reduce((acc, d) => acc + (d.pass ? d.weight : 0), 0);

    const issues = [];
    if (t.replace(/\s/g, '').length < 12) {
      issues.push({ title: '한 줄 프롬프트', detail: '"써줘", "알려줘"만으로는 AI가 평균적인 답을 줄 수밖에 없어요.' });
    }
    const qMarks = (t.match(/\?/g) || []).length;
    if (qMarks >= 3) {
      issues.push({ title: '질문 과적재', detail: '한 번에 여러 질문을 던지면 답이 얕아져요. 가장 중요한 것 하나부터 물어보세요.' });
      score = Math.max(0, score - 5);
    }
    if (/(알아서|적당히|잘 좀|대충)/.test(t)) {
      issues.push({ title: '모호한 지시어', detail: '"알아서", "적당히"는 AI에게 기준이 없다는 뜻이에요. 기준을 숫자나 예시로 바꿔주세요.' });
      score = Math.max(0, score - 5);
    }
    dims.filter((d) => !d.pass).forEach((d) => {
      issues.push({ title: `${d.label} 없음`, detail: d.msg, tip: d.tip });
    });

    const grade = score >= 75
      ? { key: 'next', name: 'NEXT 프롬프트', desc: 'AI와 함께 생각하는 프롬프트예요. 그대로 쓰세요.' }
      : score >= 40
        ? { key: 'up', name: 'UP 프롬프트', desc: '꽤 좋아요. 아래 항목만 채우면 결과가 확 달라져요.' }
        : { key: 'zero', name: 'ZERO 프롬프트', desc: '아직 AI에게 일을 맡길 준비가 안 된 프롬프트예요. 함께 고쳐봐요.' };

    return { text: t, score, grade, dims, issues, improved: improvePrompt(t, dims) };
  };

  const improvePrompt = (t, dims) => {
    const has = (k) => dims.find((d) => d.key === k).pass;
    const core = t.length > 160 ? t.slice(0, 160) + '…' : (t || '(여기에 원래 요청을 넣어주세요)');
    const lines = [];
    lines.push(has('role') ? '# 역할 — 이미 잘 담겨 있어요. 유지하세요.' : '너는 이 분야에서 10년 일한 전문가야.');
    lines.push('');
    lines.push(`# 요청\n${core}`);
    lines.push('');
    if (!has('context')) lines.push('# 맥락\n(누구를 위한 것인지, 왜 필요한지, 지금 상황을 2~3문장으로)');
    if (!has('format')) lines.push('# 형식\n번호 목록으로, 항목마다 한 줄 설명을 붙여서 정리해줘.');
    if (!has('constraint')) lines.push('# 조건\n분량은 500자 이내. 과장된 표현은 빼고 담백한 톤으로.');
    if (!has('example')) lines.push('# 예시\n(원하는 결과물의 예를 하나 보여주면 정확도가 올라가요)');
    lines.push('');
    lines.push('시작하기 전에, 더 필요한 정보가 있으면 나에게 먼저 질문해줘.');
    return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  };

  /* ---------- 결과 공유 카드 (인스타 1:1 규격) ---------- */
  const shareCard = (result) => {
    const S = 1080;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const g = cv.getContext('2d');
    const lv = Math.round(result.rawPct * 0.6);
    const tier = tierOf(lv);
    const F = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard, "Noto Sans KR", sans-serif';

    g.fillStyle = '#0a0c10'; g.fillRect(0, 0, S, S);

    // 브랜드 마크 — 3사각형 + 워드마크
    const sq = 26; const gap = 12; const bx = 96; const by = 96;
    ['#a7c2fe', '#699efe', '#007eec'].forEach((c, i) => {
      g.fillStyle = c; g.fillRect(bx + i * (sq + gap), by, sq, sq);
    });
    g.fillStyle = '#fff'; g.font = `700 30px ${F}`; g.letterSpacing = '5px';
    g.fillText('ZUN', bx + 3 * (sq + gap) + 18, by + 24);
    g.letterSpacing = '0px';
    g.fillStyle = '#6b7280'; g.font = `600 20px ${F}`;
    g.fillText('AI ROADMAP', bx + 3 * (sq + gap) + 110, by + 23);

    // 헤드라인
    g.fillStyle = '#9ca3af'; g.font = `400 34px ${F}`;
    g.fillText('나의 AI 레벨', bx, 250);

    // 큰 숫자
    g.fillStyle = '#fff'; g.font = `600 232px ${F}`;
    const numTxt = String(lv);
    g.fillText(numTxt, bx - 8, 430);
    const numW = g.measureText(numTxt).width;
    g.fillStyle = '#4b5563'; g.font = `300 72px ${F}`;
    g.fillText('/ 100', bx + numW + 8, 430);

    // 티어 배지
    const tierColor = tier.key === 'zero' ? '#9ca3af' : tier.key === 'up' ? '#699efe' : '#a7c2fe';
    g.fillStyle = tierColor; g.font = `700 40px ${F}`; g.letterSpacing = '6px';
    g.fillText(tier.name, bx, 500);
    g.letterSpacing = '0px';
    g.fillStyle = '#6b7280'; g.font = `400 26px ${F}`;
    g.fillText(tier.desc, bx, 546);

    // 역량 바 5개
    let y = 626;
    Object.keys(COMPETENCIES).forEach((k) => {
      const pct = result.comps[k];
      g.fillStyle = '#d1d5db'; g.font = `600 26px ${F}`;
      g.fillText(COMPETENCIES[k].label, bx, y + 8);
      const barX = bx + 220; const barW = 560; const barH = 14;
      g.fillStyle = '#1f2430';
      g.beginPath(); g.roundRect(barX, y - 8, barW, barH, 7); g.fill();
      g.fillStyle = result.weakest.includes(k) ? '#4b5563' : '#007eec';
      g.beginPath(); g.roundRect(barX, y - 8, Math.max(barH, barW * pct / 100), barH, 7); g.fill();
      g.fillStyle = '#9ca3af'; g.font = `400 24px ${F}`;
      g.fillText(`${pct}%`, barX + barW + 20, y + 7);
      y += 62;
    });

    // 푸터
    g.fillStyle = '#374151'; g.fillRect(bx, 946, S - bx * 2, 1);
    g.fillStyle = '#fff'; g.font = `600 32px ${F}`;
    g.fillText('Zero → Up → Next', bx, 1010);
    g.fillStyle = '#6b7280'; g.font = `400 26px ${F}`;
    const handle = '@zun_it_';
    g.fillText(handle, S - bx - g.measureText(handle).width, 1010);

    return cv;
  };

  const shareText = (result) => {
    const lv = Math.round(result.rawPct * 0.6);
    const tier = tierOf(lv);
    const bars = Object.keys(COMPETENCIES)
      .map((k) => `${COMPETENCIES[k].label} ${result.comps[k]}%`).join(' · ');
    return `나의 AI 레벨: ${lv}/100 (${tier.name})\n${bars}\n\nZero → Up → Next\nZUN AI Roadmap에서 5분 만에 진단받기`;
  };

  /* ---------- confetti ---------- */
  const confetti = (host) => {
    // ZUN 브랜드 3단 블루 + 잉크 — 축하 순간에만 쓰는 브랜드 표현
    const colors = ['#a7c2fe', '#699efe', '#007eec', '#1d1d1f'];
    const stage = document.createElement('div');
    stage.className = 'confetti-stage';
    for (let i = 0; i < 26; i += 1) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = `${Math.random() * 0.5}s`;
      c.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
      stage.appendChild(c);
    }
    host.prepend(stage);
    setTimeout(() => stage.remove(), 2600);
  };

  /* ---------- count-up ---------- */
  const countUp = (el, target, ms) => {
    const dur = ms || 1200;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- exports ---------- */
  ZUN.esc = esc;
  ZUN.todayKey = todayKey;
  ZUN.dayOfYear = dayOfYear;
  ZUN.state = () => state;
  ZUN.save = save;
  ZUN.level = level;
  ZUN.tierOf = tierOf;
  ZUN.TIERS = TIERS;
  ZUN.BADGES = BADGES;
  ZUN.COMPETENCIES = COMPETENCIES;
  ZUN.XP_BY_TIER = XP_BY_TIER;
  ZUN.lessonTier = lessonTier;
  ZUN.streakCount = streakCount;
  ZUN.setProgress = setProgress;
  ZUN.getProgress = getProgress;
  ZUN.addXP = addXP;
  ZUN.completeLesson = completeLesson;
  ZUN.setDiagnostic = setDiagnostic;
  ZUN.completeChallenge = completeChallenge;
  ZUN.countAnalyzer = countAnalyzer;
  ZUN.isUnlocked = isUnlocked;
  ZUN.resetAll = resetAll;
  ZUN.scoreDiagnostic = scoreDiagnostic;
  ZUN.shareCard = shareCard;
  ZUN.shareText = shareText;
  ZUN.analyzePrompt = analyzePrompt;
  ZUN.confetti = confetti;
  ZUN.countUp = countUp;
  ZUN.views = {};
}());
