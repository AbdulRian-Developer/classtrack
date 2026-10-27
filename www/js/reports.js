/* ClassTrack reports: number crunching, PDF generation, WhatsApp text. */
(function () {
  const S = () => window.Store;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function fmtDate(iso, opts = {}) {
    const d = S().parseISO(iso);
    const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (opts.short) return base;
    return `${opts.noDay ? '' : DAYS[d.getDay()] + ', '}${base} ${d.getFullYear()}`;
  }
  const pct = (p, t) => (t ? Math.round((p / t) * 1000) / 10 : null);
  const pctText = (v) => (v == null ? '-' : (Number.isInteger(v) ? v : v.toFixed(1)) + '%');

  /** Attendance matrix for one course in a date range. */
  function courseMatrix(courseId, from, to) {
    const store = S();
    const sessions = store.sessionsBetween(from, to, courseId);
    const ids = new Set(store.rosterFor(courseId).map((s) => s.id));
    sessions.forEach((s) => Object.keys(s.marks).forEach((id) => ids.add(id)));
    const students = store.students().filter((s) => ids.has(s.id));
    const rows = students.map((st) => {
      let p = 0, a = 0;
      const cells = sessions.map((se) => {
        const m = se.marks[st.id];
        if (m === 'P') p++; else if (m === 'A') a++;
        return m || '-';
      });
      return { student: st, cells, p, a, total: p + a, pct: pct(p, p + a) };
    });
    let tp = 0, tt = 0;
    rows.forEach((r) => { tp += r.p; tt += r.total; });
    return { course: store.course(courseId), sessions, rows, avg: pct(tp, tt) };
  }

  /** Overall summary across all courses. */
  function overall(from, to) {
    const store = S();
    const courses = store.courses();
    const mats = courses.map((c) => courseMatrix(c.id, from, to));
    const map = new Map();
    store.students().forEach((st) => map.set(st.id, { student: st, per: {}, p: 0, a: 0 }));
    mats.forEach((m) => m.rows.forEach((r) => {
      const o = map.get(r.student.id); if (!o) return;
      o.per[m.course.id] = r.total ? r.pct : null;
      o.p += r.p; o.a += r.a;
    }));
    const rows = [...map.values()].map((o) => Object.assign(o, { total: o.p + o.a, pct: pct(o.p, o.p + o.a) }));
    let tp = 0, tt = 0; rows.forEach((r) => { tp += r.p; tt += r.total; });
    return { courses, mats, rows, avg: pct(tp, tt), sessionCount: mats.reduce((n, m) => n + m.sessions.length, 0) };
  }

  /** One day's summary. */
  function daily(date) {
    const store = S();
    const sessions = store.sessionsOn(date);
    const items = sessions.map((se) => {
      const c = store.course(se.courseId) || { name: 'Deleted course' };
      const cnt = store.countMarks(se);
      const absent = Object.keys(se.marks).filter((id) => se.marks[id] === 'A').map((id) => store.student(id)).filter(Boolean).sort((a, b) => store.students().indexOf(a) - store.students().indexOf(b));
      return { session: se, course: c, ...cnt, pct: pct(cnt.p, cnt.total), absent };
    });
    return { date, items };
  }

  // ------------------------------------------------------------------ text
  function dailyText(date) {
    const st = S().db.settings;
    const d = daily(date);
    const lines = [];
    lines.push(`*${st.className ? st.className + ' · ' : ''}Attendance*`);
    lines.push(fmtDate(date));
    if (!d.items.length) { lines.push('', 'No lectures marked.'); }
    d.items.forEach((it) => {
      lines.push('');
      lines.push(`*L${it.session.lecture} · ${it.course.name}*`);
      lines.push(`Present ${it.p}/${it.total}${it.pct != null ? ` (${pctText(it.pct)})` : ''}`);
      lines.push(it.absent.length ? `Absent (${it.absent.length}): ${it.absent.map((s) => `${s.roll} ${s.name}`).join(', ')}` : 'Absent: none');
    });
    lines.push('', `_Sent from ClassTrack${st.crName ? ' by ' + st.crName : ''}_`);
    return lines.join('\n');
  }

  function rangeText(from, to, courseId) {
    const st = S().db.settings;
    const th = Number(st.threshold) || 75;
    const lines = [`*${st.className ? st.className + ' · ' : ''}Attendance summary*`, `${fmtDate(from, { noDay: true })} to ${fmtDate(to, { noDay: true })}`];
    const courses = courseId ? [S().course(courseId)] : S().courses();
    courses.forEach((c) => {
      const m = courseMatrix(c.id, from, to);
      lines.push('', `*${c.name}*`, `Lectures: ${m.sessions.length} · Average: ${pctText(m.avg)}`);
      const low = m.rows.filter((r) => r.total && r.pct < th);
      if (low.length) lines.push(`Below ${th}%: ${low.map((r) => `${r.student.roll} ${r.student.name} (${pctText(r.pct)})`).join(', ')}`);
    });
    lines.push('', `_Sent from ClassTrack${st.crName ? ' by ' + st.crName : ''}_`);
    return lines.join('\n');
  }

  // ------------------------------------------------------------------ pdf
  const C = {
    navy: [27, 32, 48], teal: [15, 138, 106], tealSoft: [221, 243, 234], red: [200, 52, 52], redSoft: [252, 231, 231],
    text: [20, 26, 38], muted: [100, 110, 125], line: [220, 227, 234], zebra: [247, 249, 251], warn: [154, 98, 0], warnSoft: [252, 240, 214],
  };

  function newDoc(orientation) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4', compress: true });
    doc.setFont('helvetica', 'normal');
    return doc;
  }

  function header(doc, title, subtitle, meta) {
    const W = doc.internal.pageSize.getWidth();
    const st = S().db.settings;
    doc.setFillColor(...C.navy); doc.rect(0, 0, W, 64, 'F');
    // C-check mark
    doc.setDrawColor(93, 202, 165); doc.setLineWidth(3.2);
    const cx = 40, cy = 32, r = 13;
    const arc = []; for (let i = 0; i <= 24; i++) { const t = (40 + (280 * i) / 24) * Math.PI / 180; arc.push([cx + r * Math.cos(t), cy - r * Math.sin(t)]); }
    for (let i = 1; i < arc.length; i++) doc.line(arc[i - 1][0], arc[i - 1][1], arc[i][0], arc[i][1]);
    doc.setDrawColor(230, 241, 251); doc.setLineWidth(2.6);
    doc.line(cx - 5, cy, cx - 1, cy + 4); doc.line(cx - 1, cy + 4, cx + 7, cy - 4);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(title, 64, 29);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(190, 200, 215);
    doc.text(subtitle, 64, 45);
    const right = [st.className, st.semesterName].filter(Boolean).join(' · ');
    if (right) { doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text(right, W - 28, 29, { align: 'right' }); }
    if (st.crName) { doc.setFontSize(9); doc.setTextColor(190, 200, 215); doc.text(`CR: ${st.crName}`, W - 28, 45, { align: 'right' }); }
    let y = 86;
    if (meta && meta.length) {
      doc.setFontSize(10); doc.setTextColor(...C.muted);
      doc.text(meta.join('   ·   '), 28, y);
      y += 14;
    }
    return y;
  }

  function footer(doc) {
    const n = doc.getNumberOfPages();
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const stamp = new Date();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.muted);
      doc.text(`Generated by ClassTrack on ${fmtDate(S().toISO(stamp), { noDay: true })} ${S().pad(stamp.getHours())}:${S().pad(stamp.getMinutes())}`, 28, H - 16);
      doc.text(`Page ${i} of ${n}`, W - 28, H - 16, { align: 'right' });
    }
  }

  const tableBase = (doc) => ({
    theme: 'grid',
    margin: { left: 28, right: 28, top: 40, bottom: 34 },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, textColor: C.text, lineColor: C.line, lineWidth: 0.5, valign: 'middle' },
    headStyles: { fillColor: C.navy, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    alternateRowStyles: { fillColor: C.zebra },
  });

  function heading(doc, y, text, sub) {
    const H = doc.internal.pageSize.getHeight();
    if (y > H - 90) { doc.addPage(); y = 44; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...C.text);
    doc.text(text, 28, y + 8);
    let ny = y + 14;
    if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.muted); doc.text(sub, 28, y + 22); ny = y + 30; }
    return ny;
  }

  function registerTable(doc, m, y, th) {
    const head = [['Roll', 'Name', 'P', 'A', '%', ...m.sessions.map((s) => `${s.date.slice(8)}/${s.date.slice(5, 7)}\nL${s.lecture}`)]];
    const body = m.rows.map((r) => [r.student.roll, r.student.name, r.p, r.a, pctText(r.pct), ...r.cells]);
    if (!body.length) { doc.setFontSize(10); doc.setTextColor(...C.muted); doc.text('No students in this course.', 28, y + 12); return y + 24; }
    const base = tableBase(doc);
    window.autoTable(doc, Object.assign(base, {
      startY: y + 4,
      head, body,
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: [0, 1, 2, 3, 4],
      columnStyles: {
        0: { cellWidth: 46, halign: 'left' },
        1: { cellWidth: 118, halign: 'left' },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell(data) {
        if (data.section !== 'body') return;
        const row = m.rows[data.row.index];
        if (data.column.index >= 5) {
          data.cell.styles.halign = 'center'; data.cell.styles.cellWidth = 27; data.cell.styles.fontStyle = 'bold';
          if (data.cell.raw === 'A') { data.cell.styles.textColor = C.red; data.cell.styles.fillColor = C.redSoft; }
          else if (data.cell.raw === 'P') { data.cell.styles.textColor = C.teal; }
          else { data.cell.styles.textColor = C.muted; }
        }
        if (row.total && row.pct < th && (data.column.index <= 4)) {
          data.cell.styles.textColor = C.red;
          if (data.column.index === 4) data.cell.styles.fillColor = C.redSoft;
        }
      },
    }));
    return doc.lastAutoTable.finalY + 18;
  }

  function lowList(doc, rows, y, th) {
    const low = rows.filter((r) => r.total && r.pct < th);
    if (!low.length) return y;
    y = heading(doc, y, `Below ${th}% attendance (${low.length})`);
    window.autoTable(doc, Object.assign(tableBase(doc), {
      startY: y + 2, tableWidth: 360,
      head: [['Roll', 'Name', 'Present', 'Absent', '%']],
      body: low.map((r) => [r.student.roll, r.student.name, r.p, r.a, pctText(r.pct)]),
      headStyles: { fillColor: C.red, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 150 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center', fontStyle: 'bold' } },
    }));
    return doc.lastAutoTable.finalY + 18;
  }

  function rangeLabel(from, to) { return from === to ? fmtDate(from) : `${fmtDate(from, { noDay: true })} – ${fmtDate(to, { noDay: true })}`; }

  /** Register PDF: one course or every course (+ overall summary). */
  function registerPDF(from, to, courseId, label) {
    const store = S();
    const th = Number(store.db.settings.threshold) || 75;
    const doc = newDoc('landscape');
    const courses = courseId ? [store.course(courseId)] : store.courses();
    courses.forEach((c, i) => {
      if (i > 0) doc.addPage();
      const m = courseMatrix(c.id, from, to);
      let y = header(doc, 'Attendance register', `${label ? label + ' · ' : ''}${rangeLabel(from, to)}`);
      const sub = [c.code, c.teacher ? `Teacher: ${c.teacher}` : '', `Lectures: ${m.sessions.length}`, `Students: ${m.rows.length}`, `Class average: ${pctText(m.avg)}`].filter(Boolean).join('   ·   ');
      y = heading(doc, y, c.name, sub);
      if (!m.sessions.length) {
        doc.setFontSize(10); doc.setTextColor(...C.muted); doc.text('No lectures recorded in this period.', 28, y + 12);
        return;
      }
      y = registerTable(doc, m, y, th);
      lowList(doc, m.rows, y, th);
    });
    if (!courseId && courses.length > 1) {
      doc.addPage();
      const o = overall(from, to);
      let y = header(doc, 'Overall summary', `${label ? label + ' · ' : ''}${rangeLabel(from, to)}`, [`Courses: ${o.courses.length}`, `Lectures: ${o.sessionCount}`, `Class average: ${pctText(o.avg)}`]);
      window.autoTable(doc, Object.assign(tableBase(doc), {
        startY: y + 6,
        head: [['Roll', 'Name', ...o.courses.map((c) => c.code || c.name), 'P', 'A', 'Overall']],
        body: o.rows.map((r) => [r.student.roll, r.student.name, ...o.courses.map((c) => pctText(r.per[c.id] ?? null)), r.p, r.a, pctText(r.pct)]),
        horizontalPageBreak: true, horizontalPageBreakRepeat: [0, 1],
        columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 130 } },
        didParseCell(data) {
          if (data.section !== 'body') return;
          if (data.column.index >= 2) data.cell.styles.halign = 'center';
          const raw = String(data.cell.raw);
          if (data.column.index >= 2 && raw.endsWith('%') && parseFloat(raw) < th) { data.cell.styles.textColor = C.red; data.cell.styles.fillColor = C.redSoft; }
          if (data.column.index === data.table.columns.length - 1) data.cell.styles.fontStyle = 'bold';
        },
      }));
    }
    footer(doc);
    const name = courseId ? courses[0].name : 'All courses';
    return { doc, filename: safe(`ClassTrack_${name}_${from}_to_${to}.pdf`) };
  }

  /** Daily PDF: every lecture of one day, absentees and a P/A grid. */
  function dailyPDF(date) {
    const store = S();
    const d = daily(date);
    const doc = newDoc('portrait');
    let y = header(doc, 'Daily attendance report', fmtDate(date), [`Lectures: ${d.items.length}`]);
    if (!d.items.length) {
      doc.setFontSize(11); doc.setTextColor(...C.muted); doc.text('No lectures were marked on this day.', 28, y + 16);
      footer(doc); return { doc, filename: `ClassTrack_Daily_${date}.pdf` };
    }
    window.autoTable(doc, Object.assign(tableBase(doc), {
      startY: y + 4,
      head: [['Lecture', 'Course', 'Teacher', 'Present', 'Absent', '%']],
      body: d.items.map((it) => [`L${it.session.lecture}`, it.course.name, it.course.teacher || '-', `${it.p}/${it.total}`, it.a, pctText(it.pct)]),
      columnStyles: { 0: { halign: 'center', cellWidth: 46 }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center', fontStyle: 'bold' } },
      styles: Object.assign(tableBase(doc).styles, { fontSize: 9.5 }),
    }));
    y = doc.lastAutoTable.finalY + 22;

    d.items.forEach((it) => {
      y = heading(doc, y, `L${it.session.lecture} · ${it.course.name}`, `Present ${it.p} of ${it.total}   ·   Absent ${it.a}`);
      doc.setFontSize(10);
      if (!it.absent.length) { doc.setTextColor(...C.teal); doc.text('Everyone was present.', 28, y + 6); y += 22; return; }
      doc.setTextColor(...C.red);
      const txt = it.absent.map((s) => `${s.roll}  ${s.name}`).join('     ');
      const lines = doc.splitTextToSize(txt, doc.internal.pageSize.getWidth() - 56);
      lines.forEach((ln) => { if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 44; } doc.text(ln, 28, y + 6); y += 14; });
      y += 10;
    });

    // Full P/A grid for the day
    const ids = new Set();
    d.items.forEach((it) => Object.keys(it.session.marks).forEach((id) => ids.add(id)));
    const students = store.students().filter((s) => ids.has(s.id));
    y = heading(doc, y, 'Student-wise sheet');
    window.autoTable(doc, Object.assign(tableBase(doc), {
      startY: y + 2,
      head: [['Roll', 'Name', ...d.items.map((it) => `L${it.session.lecture}\n${(it.course.code || it.course.name).slice(0, 12)}`)]],
      body: students.map((s) => [s.roll, s.name, ...d.items.map((it) => it.session.marks[s.id] || '-')]),
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 150 } },
      didParseCell(data) {
        if (data.section !== 'body' || data.column.index < 2) return;
        data.cell.styles.halign = 'center'; data.cell.styles.fontStyle = 'bold';
        if (data.cell.raw === 'A') { data.cell.styles.textColor = C.red; data.cell.styles.fillColor = C.redSoft; }
        else if (data.cell.raw === 'P') data.cell.styles.textColor = C.teal;
        else data.cell.styles.textColor = C.muted;
      },
    }));
    footer(doc);
    return { doc, filename: `ClassTrack_Daily_${date}.pdf` };
  }

  /** One student's full history. */
  function studentPDF(studentId, from, to) {
    const store = S();
    const st = store.student(studentId);
    const doc = newDoc('portrait');
    let y = header(doc, 'Student attendance', `${st.roll} · ${st.name}`, [rangeLabel(from, to)]);
    const rows = [];
    store.courses().forEach((c) => {
      const m = courseMatrix(c.id, from, to);
      const r = m.rows.find((x) => x.student.id === studentId);
      if (r && r.total) rows.push([c.name, r.p, r.a, r.total, pctText(r.pct)]);
    });
    window.autoTable(doc, Object.assign(tableBase(doc), {
      startY: y + 4, head: [['Course', 'Present', 'Absent', 'Lectures', '%']], body: rows,
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center', fontStyle: 'bold' } },
    }));
    y = doc.lastAutoTable.finalY + 22;
    const absences = store.sessionsBetween(from, to).filter((s) => s.marks[studentId] === 'A');
    y = heading(doc, y, `Absences (${absences.length})`);
    if (absences.length) {
      window.autoTable(doc, Object.assign(tableBase(doc), {
        startY: y + 2, head: [['Date', 'Lecture', 'Course']],
        body: absences.map((s) => [fmtDate(s.date), `L${s.lecture}`, (store.course(s.courseId) || {}).name || '-']),
      }));
    }
    footer(doc);
    return { doc, filename: safe(`ClassTrack_${st.roll}_${st.name}.pdf`) };
  }

  function safe(name) { return name.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_'); }

  window.Reports = { fmtDate, pct, pctText, courseMatrix, overall, daily, dailyText, rangeText, registerPDF, dailyPDF, studentPDF, MONTHS, DAYS };
})();
