/* ClassTrack data store: everything lives on the phone (localStorage). */
(function () {
  const KEY = 'classtrack.v1';
  const SCHEMA = 1;

  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => toISO(new Date());
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function blank() {
    return {
      schema: SCHEMA,
      settings: {
        theme: 'dark',
        className: '',
        crName: '',
        semesterName: '',
        semesterStart: '',
        threshold: 75,
        seeded: false,
      },
      courses: [],
      students: [],
      sessions: [],
    };
  }

  function seedDemo(db) {
    const c = { id: uid(), name: 'Demo Course', code: 'DEMO-101', teacher: 'Sample Teacher', studentIds: null, demo: true };
    const s = [
      { id: uid(), roll: '01', name: 'Ali Ahmed (demo)', demo: true },
      { id: uid(), roll: '02', name: 'Sara Khan (demo)', demo: true },
      { id: uid(), roll: '03', name: 'Usman Tariq (demo)', demo: true },
    ];
    db.courses.push(c);
    db.students.push(...s);
    db.sessions.push({
      id: uid(), date: today(), courseId: c.id, lecture: 1,
      marks: { [s[0].id]: 'P', [s[1].id]: 'A', [s[2].id]: 'P' },
      demo: true, createdAt: Date.now(), updatedAt: Date.now(),
    });
    db.settings.seeded = true;
  }

  let db;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : null;
    } catch (e) { db = null; }
    if (!db || typeof db !== 'object') { db = blank(); }
    db = Object.assign(blank(), db);
    db.settings = Object.assign(blank().settings, db.settings || {});
    if (!db.settings.seeded) { seedDemo(db); save(); }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { console.error(e); return false; }
  }

  const rollKey = (r) => {
    const s = String(r || '');
    const m = s.match(/(\d+)\s*$/);
    return [s.replace(/\d+\s*$/, '').toLowerCase(), m ? parseInt(m[1], 10) : -1, s];
  };
  function byRoll(a, b) {
    const x = rollKey(a.roll), y = rollKey(b.roll);
    if (x[0] !== y[0]) return x[0] < y[0] ? -1 : 1;
    if (x[1] !== y[1]) return x[1] - y[1];
    return a.name.localeCompare(b.name);
  }

  const Store = {
    toISO, today, parseISO, uid, pad,
    get db() { return db; },
    load, save,

    // ---------- settings ----------
    setSetting(k, v) { db.settings[k] = v; save(); },

    // ---------- courses ----------
    courses() { return db.courses.slice(); },
    course(id) { return db.courses.find((c) => c.id === id); },
    saveCourse(c) {
      if (c.id) Object.assign(this.course(c.id), c);
      else { c.id = uid(); db.courses.push(c); }
      save(); return c;
    },
    deleteCourse(id) {
      db.courses = db.courses.filter((c) => c.id !== id);
      db.sessions = db.sessions.filter((s) => s.courseId !== id);
      save();
    },

    // ---------- students ----------
    students() { return db.students.slice().sort(byRoll); },
    student(id) { return db.students.find((s) => s.id === id); },
    rosterFor(courseId) {
      const c = this.course(courseId);
      const all = this.students();
      if (!c || !Array.isArray(c.studentIds)) return all;
      const set = new Set(c.studentIds);
      return all.filter((s) => set.has(s.id));
    },
    saveStudent(s) {
      if (s.id) Object.assign(this.student(s.id), s);
      else {
        s.id = uid(); db.students.push(s);
        db.courses.forEach((c) => { if (Array.isArray(c.studentIds) && s._addToAll) c.studentIds.push(s.id); });
        delete s._addToAll;
      }
      save(); return s;
    },
    deleteStudent(id) {
      db.students = db.students.filter((s) => s.id !== id);
      db.courses.forEach((c) => { if (Array.isArray(c.studentIds)) c.studentIds = c.studentIds.filter((x) => x !== id); });
      db.sessions.forEach((s) => { delete s.marks[id]; });
      save();
    },
    /** Parse pasted lines: "01, Ali", "BSCS-01 Ali Khan", "Ali Khan" */
    parseStudentLines(text) {
      const out = [];
      const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let auto = db.students.length;
      for (const line of lines) {
        let roll = '', name = '';
        const sep = line.match(/^([^,\t;|]+)[,\t;|]+(.+)$/);
        if (sep) { roll = sep[1].trim(); name = sep[2].trim(); }
        else {
          const m = line.match(/^(\S*\d\S*)\s+(.+)$/);
          if (m) { roll = m[1]; name = m[2]; }
          else { name = line; }
        }
        // "Ali Khan, 12" -> swap if the roll looks like a name and the name like a number
        if (roll && !/\d/.test(roll) && /^\S*\d\S*$/.test(name)) { const t = roll; roll = name; name = t; }
        roll = roll.replace(/[.)\-:]+$/, '');
        if (!roll) { auto += 1; roll = pad(auto); }
        if (name) out.push({ roll, name });
      }
      return out;
    },
    addStudents(list) {
      const existing = new Set(db.students.map((s) => s.roll.toLowerCase()));
      let added = 0, skipped = 0;
      for (const s of list) {
        if (existing.has(s.roll.toLowerCase())) { skipped++; continue; }
        existing.add(s.roll.toLowerCase());
        db.students.push({ id: uid(), roll: s.roll, name: s.name });
        added++;
      }
      save();
      return { added, skipped };
    },

    // ---------- sessions ----------
    sessions() { return db.sessions.slice(); },
    session(id) { return db.sessions.find((s) => s.id === id); },
    sessionsOn(date) { return this.sortSessions(db.sessions.filter((s) => s.date === date)); },
    sessionsBetween(from, to, courseId) {
      return this.sortSessions(db.sessions.filter((s) => s.date >= from && s.date <= to && (!courseId || s.courseId === courseId)));
    },
    sortSessions(list) {
      return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.lecture - b.lecture) || (a.createdAt - b.createdAt)));
    },
    nextLectureNo(date) {
      const nums = db.sessions.filter((s) => s.date === date).map((s) => s.lecture || 0);
      return nums.length ? Math.max(...nums) + 1 : 1;
    },
    saveSession(s) {
      s.updatedAt = Date.now();
      if (s.id && this.session(s.id)) Object.assign(this.session(s.id), s);
      else { s.id = s.id || uid(); s.createdAt = Date.now(); db.sessions.push(s); }
      save(); return s;
    },
    deleteSession(id) { db.sessions = db.sessions.filter((s) => s.id !== id); save(); },
    countMarks(s) {
      let p = 0, a = 0;
      for (const k in s.marks) { if (s.marks[k] === 'A') a++; else if (s.marks[k] === 'P') p++; }
      return { p, a, total: p + a };
    },
    firstDate() {
      if (db.settings.semesterStart) return db.settings.semesterStart;
      const d = db.sessions.map((s) => s.date).sort()[0];
      return d || today();
    },
    lastDate() {
      const d = db.sessions.map((s) => s.date).sort().pop();
      return d && d > today() ? d : today();
    },

    // ---------- demo ----------
    hasDemo() { return db.courses.some((c) => c.demo) || db.students.some((s) => s.demo) || db.sessions.some((s) => s.demo); },
    removeDemo() {
      const demoStudents = new Set(db.students.filter((s) => s.demo).map((s) => s.id));
      const demoCourses = new Set(db.courses.filter((c) => c.demo).map((c) => c.id));
      db.courses = db.courses.filter((c) => !c.demo);
      db.students = db.students.filter((s) => !s.demo);
      db.sessions = db.sessions.filter((s) => !s.demo && !demoCourses.has(s.courseId));
      db.sessions.forEach((s) => demoStudents.forEach((id) => delete s.marks[id]));
      db.courses.forEach((c) => { if (Array.isArray(c.studentIds)) c.studentIds = c.studentIds.filter((x) => !demoStudents.has(x)); });
      save();
    },

    // ---------- backup ----------
    exportJSON() {
      return JSON.stringify({ app: 'ClassTrack', exportedAt: new Date().toISOString(), data: db }, null, 1);
    },
    importJSON(text) {
      let obj;
      try { obj = JSON.parse(text); } catch (e) { throw new Error('This file is not a ClassTrack backup.'); }
      const data = obj && obj.app === 'ClassTrack' ? obj.data : obj;
      if (!data || !Array.isArray(data.courses) || !Array.isArray(data.students) || !Array.isArray(data.sessions)) {
        throw new Error('This file is not a ClassTrack backup.');
      }
      const theme = db.settings.theme;
      db = Object.assign(blank(), data);
      db.settings = Object.assign(blank().settings, data.settings || {}, { seeded: true, theme });
      save();
      return { courses: db.courses.length, students: db.students.length, sessions: db.sessions.length };
    },
    newSemester({ keepStudents, keepCourses }) {
      db.sessions = [];
      if (!keepCourses) db.courses = [];
      if (!keepStudents) { db.students = []; db.courses.forEach((c) => { c.studentIds = null; }); }
      db.settings.semesterStart = today();
      db.settings.semesterName = '';
      save();
    },
    wipeAll() {
      const theme = db.settings.theme;
      db = blank(); db.settings.seeded = true; db.settings.theme = theme; save();
    },
  };

  window.Store = Store;
})();
