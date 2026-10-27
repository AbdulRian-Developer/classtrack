/* ClassTrack UI */
(function () {
  const S = window.Store, R = window.Reports, N = window.Native;
  const APP_VERSION = '1.0.0';
  S.load();

  // ------------------------------------------------------------------ helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    home: P('<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>'),
    chart: P('<path d="M4 20h16"/><rect x="5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="7" width="3" height="10" rx="1"/><rect x="16" y="4" width="3" height="13" rx="1"/>'),
    users: P('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.2.1 3.7 1.6 4 4"/>'),
    settings: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    back: P('<path d="M15 5l-7 7 7 7"/>'),
    chev: P('<path d="M9 6l6 6-6 6"/>'),
    left: P('<path d="M15 6l-6 6 6 6"/>'),
    check: P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    x: P('<path d="M6 6l12 12M18 6L6 18"/>'),
    share: P('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
    file: P('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    msg: P('<path d="M4 19.5l1.4-4A8 8 0 1 1 8.6 18.8z"/><path d="M9 10.5h6M9 13.5h4"/>'),
    trash: P('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>'),
    edit: P('<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    cal: P('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>'),
    search: P('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: P('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
    download: P('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    upload: P('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
    refresh: P('<path d="M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4"/>'),
    alert: P('<path d="M12 9v4M12 17h.01"/><path d="M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/>'),
    book: P('<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h10"/>'),
    user: P('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/>'),
    more: P('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
    clip: P('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 13l2 2 4-4"/>'),
    list: P('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    sparkle: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  };
  const icon = (name, cls = '') => `<span class="ico ${cls}">${ICONS[name] || ''}</span>`;
  const LOGO = `<svg viewBox="0 0 96 96" width="36" height="36" aria-hidden="true"><rect width="96" height="96" rx="22" fill="#1B2030"/><path d="M66 30 A24 24 0 1 0 66 66" fill="none" stroke="#5DCAA5" stroke-width="9" stroke-linecap="round"/><path d="M38 48 L46 56 L62 40" fill="none" stroke="#E6F1FB" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  const addDays = (iso, n) => { const d = S.parseISO(iso); d.setDate(d.getDate() + n); return S.toISO(d); };
  const weekStart = (iso) => { const d = S.parseISO(iso); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return S.toISO(d); };
  const monthStart = (iso) => iso.slice(0, 8) + '01';
  const monthEnd = (iso) => { const d = S.parseISO(monthStart(iso)); d.setMonth(d.getMonth() + 1); d.setDate(0); return S.toISO(d); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  // ------------------------------------------------------------------ theme
  function applyTheme() {
    const t = S.db.settings.theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    N.setBars(t);
  }

  // ------------------------------------------------------------------ router
  const state = {
    stack: [{ name: 'home' }],
    setupTab: 'courses',
    rep: { mode: 'week', anchor: S.today(), from: '', to: '', courseId: '' },
    studentQuery: '',
  };
  const current = () => state.stack[state.stack.length - 1];
  function go(name, params = {}, replace = false) {
    if (replace) state.stack[state.stack.length - 1] = { name, ...params };
    else state.stack.push({ name, ...params });
    render(true);
  }
  function tab(name) { state.stack = [{ name }]; render(true); }
  function back() {
    if (closeSheet()) return true;
    const cur = current();
    if (cur.name === 'mark' && markDirty()) {
      confirmSheet({ title: 'Discard changes?', body: 'Attendance for this lecture has not been saved.', ok: 'Discard', danger: true, onOk: () => { state.stack.pop(); render(true); } });
      return true;
    }
    if (state.stack.length > 1) { state.stack.pop(); render(true); return true; }
    if (cur.name !== 'home') { tab('home'); return true; }
    return false;
  }
  window.addEventListener('popstate', () => { back(); history.pushState(null, ''); });
  history.pushState(null, '');
  N.onBack(back);

  function render(scrollTop) {
    applyTheme();
    const cur = current();
    const view = $('#view');
    $('#tabbar').classList.toggle('hidden', cur.name === 'mark');
    view.classList.toggle('full', cur.name === 'mark');
    const root = state.stack[0].name;
    $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === root));
    const views = { home: viewHome, mark: viewMark, day: viewDay, reports: viewReports, setup: viewSetup, settings: viewSettings };
    (views[cur.name] || viewHome)(view, cur);
    if (scrollTop) window.scrollTo(0, 0);
  }

  $$('.tab').forEach((b) => { b.querySelector('.ico').innerHTML = ICONS[b.querySelector('.ico').dataset.icon]; b.addEventListener('click', () => tab(b.dataset.tab)); });

  // ------------------------------------------------------------------ sheets
  function openSheet(html, onMount) {
    closeSheet();
    const root = $('#sheet-root');
    root.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
    $('.scrim', root).addEventListener('click', closeSheet);
    const sheet = $('.sheet', root);
    if (onMount) onMount(sheet);
    return sheet;
  }
  function closeSheet() {
    const root = $('#sheet-root');
    if (!root.innerHTML) return false;
    root.innerHTML = '';
    return true;
  }
  function confirmSheet({ title, body, ok = 'OK', danger = false, onOk }) {
    openSheet(`<h2>${esc(title)}</h2><p class="muted" style="margin-bottom:18px">${esc(body)}</p>
      <div class="actions"><button class="btn" data-x>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button></div>`, (sh) => {
      $('[data-x]', sh).onclick = closeSheet;
      $('[data-ok]', sh).onclick = () => { closeSheet(); onOk && onOk(); };
    });
  }
  function busy(btn, on) { if (!btn) return; btn.disabled = on; btn.style.opacity = on ? .6 : 1; }

  async function sharePdf(builder, btn) {
    busy(btn, true);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const { doc, filename } = builder();
      const blob = doc.output('blob');
      const r = await N.shareFile(blob, filename, filename.replace(/\.pdf$/, ''));
      if (r === 'downloaded') toast('PDF saved to downloads');
    } catch (e) { console.error(e); toast('Could not create the PDF'); }
    finally { busy(btn, false); }
  }
  async function shareText(text) {
    const r = await N.shareText(text, 'Attendance');
    if (r === 'copied') toast('Copied. Paste it in your WhatsApp group');
    if (r === 'failed') toast('Could not share');
  }

  // ------------------------------------------------------------------ HOME
  function sessionRow(se) {
    const c = S.course(se.courseId) || { name: 'Deleted course' };
    const k = S.countMarks(se);
    return `<button class="row" data-session="${se.id}">
      <div class="session"><div class="lec"><small>LEC</small>${esc(se.lecture)}</div></div>
      <div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${k.p} present · ${k.a} absent</div></div>
      <span class="pill ${k.a ? 'a' : 'p'}">${k.a ? k.a + ' A' : 'All P'}</span>
      ${icon('chev', 'sm chev')}
    </button>`;
  }

  function viewHome(el) {
    const st = S.db.settings;
    const t = S.today();
    const todays = S.sessionsOn(t);
    const courses = S.courses(), students = S.students();
    const recentDates = [...new Set(S.sessions().map((s) => s.date).filter((d) => d !== t))].sort().reverse().slice(0, 7);
    let absToday = 0, totToday = 0; todays.forEach((s) => { const k = S.countMarks(s); absToday += k.a; totToday += k.total; });

    el.innerHTML = `
      <div class="topbar"><div class="brand">${LOGO}<div><div class="title" style="font-size:19px">ClassTrack</div><div class="tiny muted">${esc(st.className || 'Offline class attendance')}</div></div></div><div class="grow"></div>
        <button class="icon-btn ghost" id="themeBtn" aria-label="Toggle theme">${icon(st.theme === 'light' ? 'moon' : 'sun')}</button></div>
      ${S.hasDemo() ? `<div class="banner">${icon('sparkle', 'sm')}<div class="grow">Demo data is loaded so you can try things out.</div><button class="btn sm" id="rmDemo">Remove</button></div>` : ''}
      <div class="hero">
        <div class="date">${R.fmtDate(t)}</div>
        <h1>${greeting()}${st.crName ? ', ' + esc(st.crName.split(' ')[0]) : ''}</h1>
        <button class="btn primary big block" id="markBtn">${icon('clip')} Mark attendance</button>
      </div>
      <div class="stats section" style="margin-top:12px">
        <div class="stat"><div class="v">${todays.length}</div><div class="l">Lectures today</div></div>
        <div class="stat"><div class="v">${totToday ? Math.round(((totToday - absToday) / totToday) * 100) + '%' : '-'}</div><div class="l">Present today</div></div>
        <div class="stat"><div class="v">${students.length}</div><div class="l">Students</div></div>
      </div>
      <div class="section">
        <div class="section-head"><h2>Today</h2>${todays.length ? `<button class="btn sm" id="shareToday">${icon('share', 'sm')} Share day</button>` : ''}</div>
        ${todays.length ? `<div class="list">${todays.map(sessionRow).join('')}</div>` :
          `<div class="card empty">${icon('cal')}<h3>No lectures marked yet</h3><p class="small">${courses.length ? 'Tap Mark attendance when a lecture starts.' : 'Add your courses and students in the Class tab first.'}</p>
           ${!courses.length || !students.length ? `<button class="btn sm" style="margin-top:12px" id="goSetup">Set up class</button>` : ''}</div>`}
      </div>
      ${recentDates.length ? `<div class="section"><div class="section-head"><h2>Recent days</h2></div><div class="list">
        ${recentDates.map((d) => { const ss = S.sessionsOn(d); let a = 0; ss.forEach((s) => a += S.countMarks(s).a);
          return `<button class="row" data-day="${d}"><span class="ico" style="color:var(--faint)">${ICONS.cal}</span><div class="grow"><div class="t">${R.fmtDate(d)}</div><div class="s">${ss.length} lecture${ss.length === 1 ? '' : 's'} · ${a} absences</div></div>${icon('chev', 'sm chev')}</button>`; }).join('')}
      </div></div>` : ''}
    `;
    $('#markBtn').onclick = startMarking;
    $('#themeBtn').onclick = () => { S.setSetting('theme', st.theme === 'light' ? 'dark' : 'light'); render(); };
    const rm = $('#rmDemo'); if (rm) rm.onclick = () => confirmSheet({ title: 'Remove demo data?', body: 'The demo course, demo students and demo lecture will be deleted. Your own data stays.', ok: 'Remove', danger: true, onOk: () => { S.removeDemo(); toast('Demo data removed'); render(); } });
    const gs = $('#goSetup'); if (gs) gs.onclick = () => tab('setup');
    const sh = $('#shareToday'); if (sh) sh.onclick = () => dayShareSheet(t);
    $$('[data-session]', el).forEach((b) => b.onclick = () => go('mark', { sessionId: b.dataset.session }));
    $$('[data-day]', el).forEach((b) => b.onclick = () => go('day', { date: b.dataset.day }));
  }

  function dayShareSheet(date) {
    openSheet(`<h2>Share ${date === S.today() ? "today's" : R.fmtDate(date, { short: true })} report</h2>
      <button class="option" data-a="pdf"><span class="ic">${icon('file')}</span><div class="grow"><div class="t" style="font-weight:600">PDF report</div><div class="small muted">Every lecture, absentees and a P/A sheet</div></div></button>
      <button class="option" data-a="txt"><span class="ic">${icon('msg')}</span><div class="grow"><div class="t" style="font-weight:600">WhatsApp message</div><div class="small muted">Short text summary for the class group</div></div></button>`, (sh) => {
      $('[data-a=pdf]', sh).onclick = (e) => { const b = e.currentTarget; sharePdf(() => R.dailyPDF(date), b).then(closeSheet); };
      $('[data-a=txt]', sh).onclick = () => { closeSheet(); shareText(R.dailyText(date)); };
    });
  }

  // ------------------------------------------------------------------ DAY
  function viewDay(el, cur) {
    const d = cur.date;
    const ss = S.sessionsOn(d);
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk" aria-label="Back">${icon('back')}</button><div class="grow"><div class="title">${R.fmtDate(d)}</div></div></div>
      ${ss.length ? `<div class="list">${ss.map(sessionRow).join('')}</div>` : `<div class="card empty">${icon('cal')}<h3>No lectures on this day</h3></div>`}
      <div class="btn-row section">
        <button class="btn" id="addL">${icon('plus', 'sm')} Add lecture</button>
        ${ss.length ? `<button class="btn primary" id="shr">${icon('share', 'sm')} Share</button>` : ''}
      </div>`;
    $('#bk').onclick = back;
    $('#addL').onclick = () => startMarking(d);
    const sh = $('#shr'); if (sh) sh.onclick = () => dayShareSheet(d);
    $$('[data-session]', el).forEach((b) => b.onclick = () => go('mark', { sessionId: b.dataset.session }));
  }

  // ------------------------------------------------------------------ START MARKING
  function startMarking(dateArg) {
    const courses = S.courses();
    if (!courses.length) {
      confirmSheet({ title: 'Add a course first', body: 'Create your courses and add students in the Class tab, then come back to mark attendance.', ok: 'Open Class tab', onOk: () => { state.setupTab = 'courses'; tab('setup'); } });
      return;
    }
    let date = typeof dateArg === 'string' ? dateArg : S.today();
    let courseId = null;
    openSheet(`<h2>Mark attendance</h2>
      <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" id="mDate" value="${date}" max="${addDays(S.today(), 365)}"></label>
      <label class="field"><span>Lecture no.</span><input class="input" type="number" inputmode="numeric" min="1" max="20" id="mLec" value="${S.nextLectureNo(date)}"></label></div>
      <div class="field"><span>Course</span></div>
      <div class="list" id="mCourses">${courses.map((c) => `<button class="row" data-c="${c.id}"><span class="ico" style="color:var(--accent)">${ICONS.book}</span><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc([c.code, c.teacher].filter(Boolean).join(' · ') || ' ')} · ${S.rosterFor(c.id).length} students</div></div>${icon('chev', 'sm chev')}</button>`).join('')}</div>
      <div class="err" id="mErr"></div>`, (sh) => {
      const dateIn = $('#mDate', sh), lecIn = $('#mLec', sh);
      dateIn.onchange = () => { date = dateIn.value || S.today(); lecIn.value = S.nextLectureNo(date); };
      $$('[data-c]', sh).forEach((b) => b.onclick = () => {
        courseId = b.dataset.c;
        const lecture = parseInt(lecIn.value, 10);
        date = dateIn.value;
        if (!date) { $('#mErr', sh).textContent = 'Pick a date.'; return; }
        if (!lecture || lecture < 1) { $('#mErr', sh).textContent = 'Enter a lecture number.'; return; }
        if (!S.rosterFor(courseId).length) { $('#mErr', sh).textContent = 'This course has no students yet. Add students in the Class tab.'; return; }
        const dup = S.sessionsOn(date).find((s) => s.lecture === lecture);
        if (dup) {
          const dc = S.course(dup.courseId);
          closeSheet();
          confirmSheet({ title: `Lecture ${lecture} already marked`, body: `${dc ? dc.name : 'A course'} is saved as lecture ${lecture} on this day. Open it to edit?`, ok: 'Open it', onOk: () => go('mark', { sessionId: dup.id }) });
          return;
        }
        closeSheet();
        go('mark', { draft: { courseId, date, lecture } });
      });
    });
  }

  // ------------------------------------------------------------------ MARK
  let mark = null; // working copy
  function markDirty() { return !!mark && JSON.stringify(mark.se.marks) !== mark.original; }

  function viewMark(el, cur) {
    if (!mark || mark.key !== (cur.sessionId || JSON.stringify(cur.draft))) {
      let se;
      if (cur.sessionId) se = JSON.parse(JSON.stringify(S.session(cur.sessionId)));
      else se = { ...cur.draft, marks: {} };
      const roster = S.rosterFor(se.courseId);
      // students removed from roster later still show if they have a mark
      const ids = new Set(roster.map((s) => s.id));
      Object.keys(se.marks).forEach((id) => ids.add(id));
      const students = S.students().filter((s) => ids.has(s.id));
      students.forEach((s) => { if (!se.marks[s.id]) se.marks[s.id] = 'P'; });
      mark = { key: cur.sessionId || JSON.stringify(cur.draft), se, students, query: '', original: cur.sessionId ? JSON.stringify(se.marks) : '' };
    }
    const { se } = mark;
    const c = S.course(se.courseId) || { name: 'Course' };
    el.innerHTML = `
      <div class="mark-head">
        <div class="topbar" style="margin-bottom:8px">
          <button class="icon-btn" id="bk" aria-label="Back">${icon('back')}</button>
          <div class="grow"><div class="title">${esc(c.name)}</div><div class="small muted">${R.fmtDate(se.date)} · Lecture ${esc(se.lecture)}</div></div>
          ${cur.sessionId ? `<button class="icon-btn" id="more" aria-label="More">${icon('more')}</button>` : ''}
        </div>
        <div class="counts"><span class="pill p" id="cP"></span><span class="pill a" id="cA"></span><span class="grow"></span>
          <button class="chip sm" id="allP">All P</button><button class="chip sm" id="allA">All A</button></div>
        <div class="searchbar">${icon('search', 'sm')}<input id="q" placeholder="Search name or roll no." value="${esc(mark.query)}" autocomplete="off"></div>
      </div>
      <div id="stuList"></div>
      <p class="tiny faint" style="text-align:center;margin-top:14px">Everyone starts as present. Tap a student to mark absent.</p>
      <div class="savebar"><div class="inner"><button class="btn primary big block" id="save">${icon('check')} Save attendance</button></div></div>`;

    const list = $('#stuList');
    const drawList = () => {
      const q = mark.query.trim().toLowerCase();
      const items = mark.students.filter((s) => !q || s.name.toLowerCase().includes(q) || String(s.roll).toLowerCase().includes(q));
      list.innerHTML = items.length ? items.map((s) => {
        const a = se.marks[s.id] === 'A';
        return `<button class="stu ${a ? 'abs' : ''}" data-id="${s.id}" aria-pressed="${a}"><span class="roll">${esc(s.roll)}</span><span class="nm">${esc(s.name)}</span><span class="mk">${a ? 'A' : 'P'}</span></button>`;
      }).join('') : `<div class="empty">No student matches “${esc(mark.query)}”.</div>`;
    };
    const drawCounts = () => {
      let p = 0, a = 0; mark.students.forEach((s) => (se.marks[s.id] === 'A' ? a++ : p++));
      $('#cP').textContent = `${p} present`; $('#cA').textContent = `${a} absent`;
    };
    drawList(); drawCounts();

    list.addEventListener('click', (e) => {
      const b = e.target.closest('.stu'); if (!b) return;
      const id = b.dataset.id;
      const a = se.marks[id] !== 'A';
      se.marks[id] = a ? 'A' : 'P';
      b.classList.toggle('abs', a); b.setAttribute('aria-pressed', a);
      b.querySelector('.mk').textContent = a ? 'A' : 'P';
      if (navigator.vibrate) navigator.vibrate(8);
      drawCounts();
    });
    $('#q').addEventListener('input', (e) => { mark.query = e.target.value; drawList(); });
    $('#allP').onclick = () => { mark.students.forEach((s) => se.marks[s.id] = 'P'); drawList(); drawCounts(); };
    $('#allA').onclick = () => { mark.students.forEach((s) => se.marks[s.id] = 'A'); drawList(); drawCounts(); };
    $('#bk').onclick = back;
    $('#save').onclick = () => {
      const saved = S.saveSession({ ...se });
      const k = S.countMarks(saved);
      mark = null;
      state.stack.pop(); render(true);
      toast(`Saved · ${k.p} present, ${k.a} absent`);
    };
    const more = $('#more');
    if (more) more.onclick = () => sessionOptions(se);
  }

  function sessionOptions(se) {
    openSheet(`<h2>Lecture details</h2>
      <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" id="eDate" value="${se.date}"></label>
      <label class="field"><span>Lecture no.</span><input class="input" type="number" min="1" id="eLec" value="${se.lecture}"></label></div>
      <label class="field"><span>Course</span><select class="input" id="eCourse">${S.courses().map((c) => `<option value="${c.id}" ${c.id === se.courseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <div class="err" id="eErr"></div>
      <div class="actions"><button class="btn danger" id="eDel">${icon('trash', 'sm')} Delete</button><button class="btn primary" id="eOk">Apply</button></div>`, (sh) => {
      $('#eOk', sh).onclick = () => {
        const date = $('#eDate', sh).value, lecture = parseInt($('#eLec', sh).value, 10), courseId = $('#eCourse', sh).value;
        if (!date || !lecture) { $('#eErr', sh).textContent = 'Date and lecture number are required.'; return; }
        const clash = S.sessionsOn(date).find((s) => s.lecture === lecture && s.id !== se.id);
        if (clash) { $('#eErr', sh).textContent = `Lecture ${lecture} already exists on that day.`; return; }
        Object.assign(se, { date, lecture, courseId });
        closeSheet(); render();
      };
      $('#eDel', sh).onclick = () => {
        closeSheet();
        confirmSheet({ title: 'Delete this lecture?', body: 'Its attendance will be removed from every report.', ok: 'Delete', danger: true, onOk: () => { S.deleteSession(se.id); mark = null; state.stack.pop(); render(true); toast('Lecture deleted'); } });
      };
    });
  }

  // ------------------------------------------------------------------ REPORTS
  function repRange() {
    const r = state.rep, t = S.today();
    switch (r.mode) {
      case 'day': return { from: r.anchor, to: r.anchor, label: 'Daily report' };
      case 'week': { const f = weekStart(r.anchor); return { from: f, to: addDays(f, 6), label: 'Weekly report' }; }
      case 'month': return { from: monthStart(r.anchor), to: monthEnd(r.anchor), label: 'Monthly report' };
      case 'semester': return { from: S.firstDate(), to: S.lastDate(), label: S.db.settings.semesterName ? `${S.db.settings.semesterName} semester` : 'Semester report' };
      default: return { from: r.from || monthStart(t), to: r.to || t, label: 'Custom report' };
    }
  }
  function rangeTitle(rg) {
    const r = state.rep;
    if (r.mode === 'day') return R.fmtDate(rg.from);
    if (r.mode === 'month') { const d = S.parseISO(rg.from); return `${R.MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
    return `${R.fmtDate(rg.from, { short: true })} – ${R.fmtDate(rg.to, { short: true })} ${rg.to.slice(0, 4)}`;
  }

  function viewReports(el) {
    const r = state.rep;
    const courses = S.courses();
    if (r.courseId && !S.course(r.courseId)) r.courseId = '';
    const rg = repRange();
    const th = Number(S.db.settings.threshold) || 75;
    const modes = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['semester', 'Semester'], ['custom', 'Custom']];
    const stepable = ['day', 'week', 'month'].includes(r.mode);

    let body = '';
    if (r.mode === 'day') {
      const d = R.daily(rg.from);
      body = d.items.length ? d.items.filter((it) => !r.courseId || it.session.courseId === r.courseId).map((it) => `
        <div class="card"><div class="section-head" style="margin:0 0 6px"><h3>L${it.session.lecture} · ${esc(it.course.name)}</h3><span class="pill ${it.pct != null && it.pct < th ? 'a' : 'p'}">${R.pctText(it.pct)}</span></div>
        <div class="small muted">${it.p} present · ${it.a} absent</div>
        ${it.absent.length ? `<div class="small" style="margin-top:8px;color:var(--absent)">${it.absent.map((s) => `${esc(s.roll)} ${esc(s.name)}`).join(', ')}</div>` : `<div class="small" style="margin-top:8px;color:var(--accent)">Everyone present</div>`}</div>`).join('')
        : `<div class="card empty">${icon('cal')}<h3>No lectures on this day</h3></div>`;
    } else {
      const ms = (r.courseId ? [r.courseId] : courses.map((c) => c.id)).map((id) => R.courseMatrix(id, rg.from, rg.to));
      const lectures = ms.reduce((n, m) => n + m.sessions.length, 0);
      let rows;
      if (r.courseId) rows = ms[0] ? ms[0].rows : [];
      else rows = R.overall(rg.from, rg.to).rows;
      rows = rows.filter((x) => x.total);
      let tp = 0, tt = 0; rows.forEach((x) => { tp += x.p; tt += x.total; });
      const low = rows.filter((x) => x.pct < th).length;
      body = `
        <div class="stats"><div class="stat"><div class="v">${lectures}</div><div class="l">Lectures</div></div>
          <div class="stat"><div class="v">${tt ? Math.round((tp / tt) * 100) + '%' : '-'}</div><div class="l">Average</div></div>
          <div class="stat"><div class="v" style="color:${low ? 'var(--absent)' : 'inherit'}">${low}</div><div class="l">Below ${th}%</div></div></div>
        ${!r.courseId && ms.length ? `<div class="section"><div class="section-head"><h2>By course</h2></div><div class="list">${ms.map((m) => `
          <button class="row" data-course="${m.course.id}"><div class="grow"><div class="t">${esc(m.course.name)}</div><div class="s">${m.sessions.length} lectures</div>
          <div class="bar ${m.avg != null && m.avg < th ? 'low' : ''}"><i style="width:${m.avg || 0}%"></i></div></div><b class="small">${R.pctText(m.avg)}</b></button>`).join('')}</div></div>` : ''}
        <div class="section"><div class="section-head"><h2>Students</h2><span class="tiny faint">Tap for details</span></div>
        ${rows.length ? `<div class="card" style="padding:4px 10px"><table class="rtable"><thead><tr><th>Roll</th><th>Name</th><th class="num">P/T</th><th class="num">%</th></tr></thead><tbody>
          ${rows.map((x) => `<tr class="${x.pct < th ? 'low' : ''}" data-stu="${x.student.id}"><td>${esc(x.student.roll)}</td><td>${esc(x.student.name)}</td><td class="num">${x.p}/${x.total}</td><td class="num"><b>${R.pctText(x.pct)}</b></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="card empty">${icon('chart')}<h3>No attendance in this period</h3><p class="small">Pick another range or mark some lectures first.</p></div>`}</div>`;
    }

    el.innerHTML = `
      <div class="topbar"><div class="grow"><div class="title">Reports</div></div></div>
      <div class="seg seg5" id="modes">${modes.map(([k, l]) => `<button class="${r.mode === k ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</div>
      <div class="card" style="margin-top:12px;padding:8px">
        ${r.mode === 'custom' ? `<div class="grid2" style="padding:4px"><label class="field" style="margin:0"><span>From</span><input class="input" type="date" id="rf" value="${rg.from}"></label><label class="field" style="margin:0"><span>To</span><input class="input" type="date" id="rt" value="${rg.to}"></label></div>`
        : `<div style="display:flex;align-items:center;gap:6px">${stepable ? `<button class="icon-btn ghost" id="prev" aria-label="Previous">${icon('left')}</button>` : ''}
            <div style="flex:1;text-align:center"><div style="font-weight:600">${rangeTitle(rg)}</div><div class="tiny muted">${rg.label}</div></div>
            ${stepable ? `<button class="icon-btn ghost" id="next" aria-label="Next">${icon('chev')}</button>` : ''}</div>
            ${r.mode === 'day' ? `<input class="input" type="date" id="rd" value="${rg.from}" style="margin-top:8px">` : ''}`}
      </div>
      <div class="chips" style="margin-top:12px">${[['', 'All courses'], ...courses.map((c) => [c.id, c.code || c.name])].map(([id, l]) => `<button class="chip ${r.courseId === id ? 'on' : ''}" data-cid="${id}">${esc(l)}</button>`).join('')}</div>
      <div class="btn-row" style="margin-top:14px"><button class="btn primary" id="pdf">${icon('file', 'sm')} PDF</button><button class="btn" id="txt">${icon('msg', 'sm')} WhatsApp</button></div>
      <div class="section">${body}</div>`;

    $$('[data-m]', el).forEach((b) => b.onclick = () => { r.mode = b.dataset.m; if (r.mode === 'custom' && !r.from) { r.from = rg.from; r.to = rg.to; } render(); });
    $$('[data-cid]', el).forEach((b) => b.onclick = () => { r.courseId = b.dataset.cid; render(); });
    const step = (dir) => {
      if (r.mode === 'day') r.anchor = addDays(r.anchor, dir);
      if (r.mode === 'week') r.anchor = addDays(weekStart(r.anchor), 7 * dir);
      if (r.mode === 'month') { const d = S.parseISO(monthStart(r.anchor)); d.setMonth(d.getMonth() + dir); r.anchor = S.toISO(d); }
      render();
    };
    if ($('#prev')) { $('#prev').onclick = () => step(-1); $('#next').onclick = () => step(1); }
    if ($('#rd')) $('#rd').onchange = (e) => { if (e.target.value) { r.anchor = e.target.value; render(); } };
    if ($('#rf')) {
      const upd = () => { const f = $('#rf').value, t = $('#rt').value; if (f && t) { r.from = f <= t ? f : t; r.to = f <= t ? t : f; render(); } };
      $('#rf').onchange = upd; $('#rt').onchange = upd;
    }
    $$('[data-course]', el).forEach((b) => b.onclick = () => { r.courseId = b.dataset.course; render(); });
    $$('[data-stu]', el).forEach((tr) => tr.onclick = () => studentSheet(tr.dataset.stu, rg.from, rg.to));
    $('#pdf').onclick = (e) => {
      if (r.mode === 'day') return sharePdf(() => R.dailyPDF(rg.from), e.currentTarget);
      if (!courses.length) return toast('Add a course first');
      sharePdf(() => R.registerPDF(rg.from, rg.to, r.courseId || null, rg.label), e.currentTarget);
    };
    $('#txt').onclick = () => shareText(r.mode === 'day' ? R.dailyText(rg.from) : R.rangeText(rg.from, rg.to, r.courseId || null));
  }

  function studentSheet(id, from, to) {
    const st = S.student(id); if (!st) return;
    const th = Number(S.db.settings.threshold) || 75;
    const per = S.courses().map((c) => ({ c, r: R.courseMatrix(c.id, from, to).rows.find((x) => x.student.id === id) })).filter((x) => x.r && x.r.total);
    const abs = S.sessionsBetween(from, to).filter((s) => s.marks[id] === 'A').reverse();
    openSheet(`<h2>${esc(st.name)}</h2><p class="small muted" style="margin:-8px 0 14px">Roll ${esc(st.roll)} · ${R.fmtDate(from, { noDay: true })} – ${R.fmtDate(to, { noDay: true })}</p>
      ${per.length ? per.map(({ c, r }) => `<div style="margin-bottom:12px"><div class="kv" style="padding:0"><span>${esc(c.name)}</span><b style="color:${r.pct < th ? 'var(--absent)' : 'inherit'}">${R.pctText(r.pct)}</b></div><div class="tiny muted">${r.p} present · ${r.a} absent</div><div class="bar ${r.pct < th ? 'low' : ''}"><i style="width:${r.pct}%"></i></div></div>`).join('') : '<p class="muted">No attendance in this period.</p>'}
      ${abs.length ? `<div class="hr"></div><h3 style="margin-bottom:8px">Absent on (${abs.length})</h3>${abs.slice(0, 30).map((s) => `<div class="kv"><span>${R.fmtDate(s.date)}</span><span class="muted">L${s.lecture} · ${esc((S.course(s.courseId) || {}).name || '')}</span></div>`).join('')}` : ''}
      <div class="actions" style="margin-top:16px"><button class="btn primary" id="sp">${icon('file', 'sm')} Student PDF</button></div>`, (sh) => {
      $('#sp', sh).onclick = (e) => sharePdf(() => R.studentPDF(id, from, to), e.currentTarget);
    });
  }

  // ------------------------------------------------------------------ SETUP (Class)
  function viewSetup(el) {
    const t = state.setupTab;
    el.innerHTML = `
      <div class="topbar"><div class="grow"><div class="title">Class</div></div><button class="btn sm primary" id="add">${icon('plus', 'sm')} ${t === 'courses' ? 'Course' : 'Students'}</button></div>
      <div class="seg"><button class="${t === 'courses' ? 'on' : ''}" data-t="courses">Courses (${S.courses().length})</button><button class="${t === 'students' ? 'on' : ''}" data-t="students">Students (${S.students().length})</button></div>
      <div class="section" id="setupBody"></div>`;
    $$('[data-t]', el).forEach((b) => b.onclick = () => { state.setupTab = b.dataset.t; render(); });
    $('#add').onclick = () => (t === 'courses' ? courseSheet() : addStudentsSheet());
    const body = $('#setupBody');
    if (t === 'courses') {
      const cs = S.courses();
      body.innerHTML = cs.length ? `<div class="list">${cs.map((c) => {
        const n = S.sessions().filter((s) => s.courseId === c.id).length;
        return `<button class="row" data-c="${c.id}"><span class="ico" style="color:var(--accent)">${ICONS.book}</span><div class="grow"><div class="t">${esc(c.name)}${c.demo ? ' <span class="pill w">demo</span>' : ''}</div><div class="s">${esc([c.code, c.teacher].filter(Boolean).join(' · ') || 'No code')} · ${n} lectures · ${S.rosterFor(c.id).length} students</div></div>${icon('chev', 'sm chev')}</button>`;
      }).join('')}</div>` : `<div class="card empty">${icon('book')}<h3>Add your first course</h3><p class="small">Add every subject you study this semester.</p></div>`;
      $$('[data-c]', body).forEach((b) => b.onclick = () => courseSheet(b.dataset.c));
    } else {
      const all = S.students();
      body.innerHTML = all.length ? `<div class="searchbar" style="margin:0 0 12px">${icon('search', 'sm')}<input id="sq" placeholder="Search students" value="${esc(state.studentQuery)}"></div><div class="list" id="sl"></div>`
        : `<div class="card empty">${icon('users')}<h3>Add your class list</h3><p class="small">Paste the whole list at once. One student per line, like “01, Ali Khan”.</p></div>`;
      const draw = () => {
        const q = state.studentQuery.toLowerCase();
        const items = all.filter((s) => !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q));
        $('#sl').innerHTML = items.map((s) => `<button class="row" data-s="${s.id}" style="min-height:52px"><span class="small faint" style="width:52px">${esc(s.roll)}</span><div class="grow"><div class="t">${esc(s.name)}</div></div>${icon('chev', 'sm chev')}</button>`).join('') || '<div class="empty">No match</div>';
        $$('[data-s]', body).forEach((b) => b.onclick = () => studentEditSheet(b.dataset.s));
      };
      if (all.length) { draw(); $('#sq').oninput = (e) => { state.studentQuery = e.target.value; draw(); }; }
    }
  }

  function courseSheet(id) {
    const c = id ? S.course(id) : { name: '', code: '', teacher: '', studentIds: null };
    const students = S.students();
    let custom = Array.isArray(c.studentIds);
    const chosen = new Set(custom ? c.studentIds : students.map((s) => s.id));
    openSheet(`<h2>${id ? 'Edit course' : 'New course'}</h2>
      <label class="field"><span>Course name</span><input class="input" id="cn" value="${esc(c.name)}" placeholder="Data Structures"></label>
      <div class="grid2"><label class="field"><span>Code (optional)</span><input class="input" id="cc" value="${esc(c.code)}" placeholder="CS-201"></label>
      <label class="field"><span>Teacher (optional)</span><input class="input" id="ct" value="${esc(c.teacher)}" placeholder="Dr. Ahmed"></label></div>
      <div class="row" style="padding:6px 0;min-height:0"><div class="grow"><div class="t">All students take this course</div><div class="s">Turn off for electives or split sections</div></div><label class="switch"><input type="checkbox" id="call" ${custom ? '' : 'checked'}><i></i></label></div>
      <div id="pick" style="${custom ? '' : 'display:none'};margin-top:8px"><div class="list" style="max-height:260px;overflow:auto">${students.map((s) => `<label class="row" style="min-height:46px"><input type="checkbox" data-p="${s.id}" ${chosen.has(s.id) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent)"><span class="small faint" style="width:46px">${esc(s.roll)}</span><span class="grow">${esc(s.name)}</span></label>`).join('') || '<div class="empty small">No students yet</div>'}</div></div>
      <div class="err" id="cErr"></div>
      <div class="actions" style="margin-top:14px">${id ? `<button class="btn danger" id="cDel">${icon('trash', 'sm')} Delete</button>` : '<button class="btn" id="cX">Cancel</button>'}<button class="btn primary" id="cOk">Save</button></div>`, (sh) => {
      $('#call', sh).onchange = (e) => { custom = !e.target.checked; $('#pick', sh).style.display = custom ? '' : 'none'; };
      if ($('#cX', sh)) $('#cX', sh).onclick = closeSheet;
      $('#cOk', sh).onclick = () => {
        const name = $('#cn', sh).value.trim();
        if (!name) { $('#cErr', sh).textContent = 'Enter the course name.'; $('#cn', sh).focus(); return; }
        const studentIds = custom ? $$('[data-p]', sh).filter((x) => x.checked).map((x) => x.dataset.p) : null;
        S.saveCourse({ ...(id ? { id } : {}), name, code: $('#cc', sh).value.trim(), teacher: $('#ct', sh).value.trim(), studentIds, demo: undefined });
        closeSheet(); render(); toast(id ? 'Course updated' : 'Course added');
      };
      if (id) $('#cDel', sh).onclick = () => {
        const n = S.sessions().filter((s) => s.courseId === id).length;
        closeSheet();
        confirmSheet({ title: `Delete ${c.name}?`, body: n ? `This also deletes ${n} saved lecture${n === 1 ? '' : 's'} of attendance for this course.` : 'This course has no saved attendance.', ok: 'Delete', danger: true, onOk: () => { S.deleteCourse(id); render(); toast('Course deleted'); } });
      };
    });
  }

  function addStudentsSheet() {
    let mode = 'paste';
    const draw = (sh) => {
      $('#body', sh).innerHTML = mode === 'paste' ? `
        <label class="field"><span>Paste your class list, one student per line</span><textarea class="input" id="bulk" placeholder="01, Ali Khan&#10;02, Sara Ahmed&#10;03 Usman Tariq"></textarea></label>
        <p class="tiny muted" style="margin:-6px 0 12px">Roll number first, then the name. A comma, tab or space between them all work, so you can copy straight from Excel.</p>
        <div class="small" id="prev"></div>`
        : `<div class="grid2 w12"><label class="field"><span>Roll no.</span><input class="input" id="r1" placeholder="01"></label><label class="field"><span>Name</span><input class="input" id="n1" placeholder="Ali Khan"></label></div>`;
      $$('.seg button', sh).forEach((b) => b.classList.toggle('on', b.dataset.m === mode));
      const bulk = $('#bulk', sh);
      if (bulk) bulk.oninput = () => { const l = S.parseStudentLines(bulk.value); $('#prev', sh).innerHTML = l.length ? `<span class="pill p">${l.length} students found</span> <span class="muted tiny">First: ${esc(l[0].roll)} · ${esc(l[0].name)}</span>` : ''; };
    };
    openSheet(`<h2>Add students</h2>
      <div class="seg" style="margin-bottom:14px"><button data-m="paste" class="on">Paste list</button><button data-m="one">One student</button></div>
      <div id="body"></div><div class="err" id="sErr"></div>
      <div class="actions" style="margin-top:8px"><button class="btn" id="sX">Cancel</button><button class="btn primary" id="sOk">Add</button></div>`, (sh) => {
      draw(sh);
      $$('.seg button', sh).forEach((b) => b.onclick = () => { mode = b.dataset.m; draw(sh); });
      $('#sX', sh).onclick = closeSheet;
      $('#sOk', sh).onclick = () => {
        const err = $('#sErr', sh);
        if (mode === 'paste') {
          const l = S.parseStudentLines($('#bulk', sh).value);
          if (!l.length) { err.textContent = 'Paste at least one student.'; return; }
          const r = S.addStudents(l);
          closeSheet(); state.setupTab = 'students'; render();
          toast(`${r.added} added${r.skipped ? `, ${r.skipped} skipped (roll no. already exists)` : ''}`);
        } else {
          const roll = $('#r1', sh).value.trim(), name = $('#n1', sh).value.trim();
          if (!roll || !name) { err.textContent = 'Enter both roll number and name.'; return; }
          if (S.students().some((s) => s.roll.toLowerCase() === roll.toLowerCase())) { err.textContent = `Roll no. ${roll} already exists.`; return; }
          S.saveStudent({ roll, name });
          $('#r1', sh).value = ''; $('#n1', sh).value = ''; err.textContent = '';
          toast(`${name} added`); $('#r1', sh).focus();
          state.setupTab = 'students'; render();
        }
      };
    });
  }

  function studentEditSheet(id) {
    const s = S.student(id);
    const marks = S.sessions().filter((se) => se.marks[id]);
    let p = 0; marks.forEach((se) => { if (se.marks[id] === 'P') p++; });
    openSheet(`<h2>Edit student</h2>
      <div class="grid2 w12"><label class="field"><span>Roll no.</span><input class="input" id="r" value="${esc(s.roll)}"></label><label class="field"><span>Name</span><input class="input" id="n" value="${esc(s.name)}"></label></div>
      <div class="card" style="margin-bottom:14px;background:var(--surface-2)"><div class="kv" style="padding:0"><span class="muted">Overall attendance</span><b>${marks.length ? R.pctText(R.pct(p, marks.length)) : '-'}</b></div><div class="tiny muted">${p} present of ${marks.length} lectures</div></div>
      <div class="err" id="eErr"></div>
      <div class="actions"><button class="btn danger" id="del">${icon('trash', 'sm')} Delete</button><button class="btn" id="hist">History</button><button class="btn primary" id="ok">Save</button></div>`, (sh) => {
      $('#ok', sh).onclick = () => {
        const roll = $('#r', sh).value.trim(), name = $('#n', sh).value.trim();
        if (!roll || !name) { $('#eErr', sh).textContent = 'Roll number and name are required.'; return; }
        if (S.students().some((x) => x.id !== id && x.roll.toLowerCase() === roll.toLowerCase())) { $('#eErr', sh).textContent = `Roll no. ${roll} already exists.`; return; }
        S.saveStudent({ id, roll, name }); closeSheet(); render(); toast('Saved');
      };
      $('#hist', sh).onclick = () => studentSheet(id, S.firstDate(), S.lastDate());
      $('#del', sh).onclick = () => {
        closeSheet();
        confirmSheet({ title: `Delete ${s.name}?`, body: 'Their attendance will be removed from all lectures and reports.', ok: 'Delete', danger: true, onOk: () => { S.deleteStudent(id); render(); toast('Student deleted'); } });
      };
    });
  }

  // ------------------------------------------------------------------ SETTINGS
  function viewSettings(el) {
    const st = S.db.settings;
    el.innerHTML = `
      <div class="topbar"><div class="grow"><div class="title">Settings</div></div></div>
      <div class="section-head"><h2>Appearance</h2></div>
      <div class="seg"><button data-th="dark" class="${st.theme !== 'light' ? 'on' : ''}">${icon('moon', 'sm')} Midnight</button><button data-th="light" class="${st.theme === 'light' ? 'on' : ''}">${icon('sun', 'sm')} Light</button></div>

      <div class="section"><div class="section-head"><h2>Class details</h2><span class="tiny faint">Printed on reports</span></div>
      <div class="card">
        <label class="field"><span>Class / section</span><input class="input" data-k="className" value="${esc(st.className)}" placeholder="BSCS 5th A"></label>
        <label class="field"><span>CR name</span><input class="input" data-k="crName" value="${esc(st.crName)}" placeholder="Your name"></label>
        <div class="grid2"><label class="field"><span>Semester</span><input class="input" data-k="semesterName" value="${esc(st.semesterName)}" placeholder="Fall 2026"></label>
        <label class="field"><span>Semester start</span><input class="input" type="date" data-k="semesterStart" value="${esc(st.semesterStart)}"></label></div>
        <label class="field" style="margin:0"><span>Short attendance limit (%)</span><input class="input" type="number" inputmode="numeric" min="1" max="100" data-k="threshold" value="${esc(st.threshold)}"></label>
      </div></div>

      <div class="section"><div class="section-head"><h2>Your data</h2></div>
      <div class="list">
        <button class="row" id="bk">${icon('download')}<div class="grow"><div class="t">Back up data</div><div class="s">Save a file to Drive or WhatsApp. Do this every week.</div></div></button>
        <button class="row" id="rs">${icon('upload')}<div class="grow"><div class="t">Restore from backup</div><div class="s">Bring data to a new phone or hand over to a junior</div></div></button>
        <button class="row" id="ns">${icon('refresh')}<div class="grow"><div class="t">Start a new semester</div><div class="s">Clears attendance, keeps students if you want</div></div></button>
        ${S.hasDemo() ? `<button class="row" id="rd">${icon('sparkle')}<div class="grow"><div class="t">Remove demo data</div></div></button>` : ''}
        <button class="row" id="wipe" style="color:var(--absent)">${icon('trash')}<div class="grow"><div class="t">Erase everything</div></div></button>
      </div></div>
      <input type="file" id="file" accept=".json,application/json,text/plain,*/*" style="display:none">

      <div class="section" style="text-align:center"><div style="display:inline-block">${LOGO}</div><div style="font-weight:600;margin-top:6px">ClassTrack ${APP_VERSION}</div>
        <div class="tiny muted">Works fully offline. Your data never leaves this phone unless you share it.</div></div>`;

    $$('[data-th]', el).forEach((b) => b.onclick = () => { S.setSetting('theme', b.dataset.th); render(); });
    $$('[data-k]', el).forEach((inp) => inp.onchange = () => {
      let v = inp.value.trim();
      if (inp.dataset.k === 'threshold') { v = Math.min(100, Math.max(1, parseInt(v, 10) || 75)); inp.value = v; }
      S.setSetting(inp.dataset.k, v); toast('Saved');
    });
    $('#bk').onclick = (e) => doBackup(e.currentTarget);
    $('#rs').onclick = () => $('#file').click();
    $('#file').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        confirmSheet({ title: 'Replace data with this backup?', body: 'Everything currently in the app will be replaced by the backup file.', ok: 'Restore', danger: true, onOk: () => {
          try { const r = S.importJSON(String(rd.result)); mark = null; render(); toast(`Restored ${r.students} students, ${r.courses} courses, ${r.sessions} lectures`); }
          catch (err) { toast(err.message); }
        } });
      };
      rd.readAsText(f); e.target.value = '';
    };
    $('#ns').onclick = newSemesterSheet;
    if ($('#rd')) $('#rd').onclick = () => { S.removeDemo(); render(); toast('Demo data removed'); };
    $('#wipe').onclick = () => confirmSheet({ title: 'Erase everything?', body: 'All courses, students and attendance will be deleted from this phone. Make a backup first if you might need it.', ok: 'Erase', danger: true, onOk: () => { S.wipeAll(); mark = null; tab('home'); toast('All data erased'); } });
  }

  async function doBackup(btn) {
    const blob = new Blob([S.exportJSON()], { type: 'application/json' });
    busy(btn, true);
    try {
      const r = await N.shareFile(blob, `ClassTrack_backup_${S.today()}.json`, 'ClassTrack backup');
      if (r === 'downloaded') toast('Backup saved to downloads');
    } catch (e) { toast('Backup failed'); }
    finally { busy(btn, false); }
  }

  function newSemesterSheet() {
    openSheet(`<h2>Start a new semester</h2>
      <p class="small muted" style="margin-bottom:12px">All attendance records will be cleared. Save a backup first so the old semester is not lost.</p>
      <div class="row" style="padding:8px 0;min-height:0"><div class="grow t">Keep student list</div><label class="switch"><input type="checkbox" id="ks" checked><i></i></label></div>
      <div class="row" style="padding:8px 0;min-height:0"><div class="grow t">Keep courses</div><label class="switch"><input type="checkbox" id="kc"><i></i></label></div>
      <div class="actions" style="margin-top:16px"><button class="btn" id="bk2">${icon('download', 'sm')} Backup</button><button class="btn danger" id="go">Start fresh</button></div>`, (sh) => {
      $('#bk2', sh).onclick = (e) => doBackup(e.currentTarget);
      $('#go', sh).onclick = () => {
        const opts = { keepStudents: $('#ks', sh).checked, keepCourses: $('#kc', sh).checked };
        closeSheet();
        confirmSheet({ title: 'Clear this semester?', body: 'This cannot be undone without a backup file.', ok: 'Clear', danger: true, onOk: () => { S.newSemester(opts); mark = null; tab('home'); toast('New semester started'); } });
      };
    });
  }

  N.onPause(() => S.save());
  render();
})();
