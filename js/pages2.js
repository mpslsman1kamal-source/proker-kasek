/* SIPERENCANA — pages2.js: Rencana (RKJM, RKT, kalender, anggaran, persetujuan, keselarasan, cetak). */
(function () {
  const { esc, $, $$, ic, tgl, num, rp, rpS, toast, DataTable } = UI, P = window.PAGES, { tabs, head, can, standar } = window.H;
  const BLN = UI.BLN, BLN3 = UI.BLN3, URUT = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6], idxAk = (m) => URUT.indexOf(+m);
  const SD = ['BOSP', 'BOS Daerah', 'Komite', 'Lainnya'];
  const STATUS_K = { rencana: ['Rencana', ''], berjalan: ['Berjalan', 'biru'], selesai: ['Selesai', 'hijau'], tertunda: ['Tertunda', 'kuning'], batal: ['Batal', 'merah'] };
  const TAHAP_IC = { 'Draf': 'edit_note', 'Review TPS': 'rate_review', 'Disetujui Kepala Sekolah': 'verified', 'Rapat Dewan Guru': 'groups', 'Pertimbangan Komite': 'diversity_3', 'Pengesahan Dinas': 'account_balance', 'Final': 'lock' };
  const TAHAP_PERAN = { 'Draf': 'Wakasek / Kepsek', 'Review TPS': 'Wakasek / Kepsek', 'Disetujui Kepala Sekolah': 'Kepala Sekolah', 'Rapat Dewan Guru': 'Kepala Sekolah', 'Pertimbangan Komite': 'Kepala Sekolah', 'Pengesahan Dinas': 'Kepala Sekolah' };

  P.rencana = { t: 'RKJM & RKT', ic: 'event_note', c: '#12B5A6', ct: '#E0F7F5', tables: ['Program_RKJM', 'Kegiatan_RKT', 'Masalah_Prioritas', 'Rapor_Indikator'], need: () => can('Program_RKJM', 'L'), render(v, parts, X) {
    const periode = () => Store.set.PERIODE_RKJM || '', ta = () => Store.set.TA_AKTIF || '';
    let appr = null, selaras = null;
    const loadAppr = async () => { const r = await API.read('persetujuan.semua'); if (r.success) { appr = r.data.daftar; redraw(); } };
    const stat = (j, s) => appr && appr.find(a => a.jenis === j && a.scope === s);
    const final = (j, s) => { const a = stat(j, s); return !!(a && a.final); };
    v.innerHTML = head('Rencana RKJM & RKT', 'Program 4 tahunan (RKJM) diturunkan menjadi kegiatan tahunan (RKT) lengkap dengan jadwal dan anggaran.', '<span class="pill biru">' + ic('calendar_month') + 'Periode ' + esc(periode()) + '</span><span class="pill teal">TA ' + esc(ta()) + '</span>') + '<div id="body"></div>';
    const prg = () => Store.rows('Program_RKJM'), kgt = () => Store.rows('Kegiatan_RKT').filter(k => k.tahun_ajaran === ta() || true);
    const progName = (id) => { const p = Store.byId('Program_RKJM', id); return p ? p.program : '— tanpa program —'; };
    const kunci = (j, s) => final(j, s) ? '<div class="alert ok" style="margin-bottom:12px">' + ic('lock') + '<span>Dokumen <b>' + j + ' ' + esc(s) + '</b> sudah <b>Final &amp; terkunci</b>. Untuk mengubah, buat versi baru di tab Persetujuan.</span></div>' : '';

    /* ---------- RKJM ---------- */
    const pForm = (r) => UI.form({ title: r ? 'Ubah program RKJM' : 'Tambah program RKJM', size: 'lg', vals: r || { periode: periode(), tahun_ke: 1, status: 'draf' }, fields: [
      { k: 'periode', l: 'Periode', t: 'text', req: 1 }, { k: 'tahun_ke', l: 'Tahun ke-', t: 'sel', req: 1, opts: [[1, 'Tahun 1'], [2, 'Tahun 2'], [3, 'Tahun 3'], [4, 'Tahun 4']] },
      { k: 'standar', l: 'Standar', t: 'sel', opts: standar().map(s => [s.kode, s.kode + ' — ' + s.nama]) }, { k: 'penanggung_jawab', l: 'Penanggung jawab (bidang)', t: 'text', ph: 'mis. Kurikulum' },
      { k: 'program', l: 'Nama program', t: 'text', req: 1, full: 1 }, { k: 'tujuan', l: 'Tujuan', t: 'area', full: 1, rows: 2 }, { k: 'indikator', l: 'Indikator keberhasilan', t: 'text', full: 1 }, { k: 'target', l: 'Target', t: 'text', ph: 'mis. ≥ 60 atau 100%' },
      { k: 'masalah_id', l: 'Menjawab masalah prioritas', t: 'ref', table: 'Masalah_Prioritas', lbl: m => m.masalah, hint: 'Wajib agar lolos pemeriksaan keselarasan dengan Rapor.' }],
      onSubmit: async (x) => { x.tahun_ke = +x.tahun_ke; const s = await Store.save('Program_RKJM', Object.assign({}, r || {}, x)); if (s.success) toast('Program tersimpan.', 'ok'); return s; } });
    const rkjm = (el) => {
      el.innerHTML = kunci('RKJM', periode()) + '<div class="toolbar">' + UI.searchBox('Cari program') + '<select class="in" id="tk" style="width:auto" aria-label="Tahun ke"><option value="">Semua tahun</option>' + [1, 2, 3, 4].map(n => '<option value="' + n + '">Tahun ke-' + n + '</option>').join('') + '</select>' + (can('Program_RKJM', 'T') ? '<button class="btn p" id="np">' + ic('add') + 'Tambah program</button>' : '') + '</div><div id="tbl"></div>';
      const dt = new DataTable($('#tbl', el), { rows: prg, per: 30, sort: { k: 'tahun_ke', d: 1 },
        cols: [{ k: 'tahun_ke', l: 'Tahun', fmt: r => '<span class="pill teal">Ke-' + r.tahun_ke + '</span><div class="xs muted">' + esc(r.jadwal_tahun || '') + '</div>' }, { k: 'program', l: 'Program', fmt: r => '<b>' + esc(r.program) + '</b><div class="xs muted">' + esc(r.tujuan || '') + '</div>' },
          { k: 'standar', l: 'Standar' }, { k: 'indikator', l: 'Indikator / Target', fmt: r => esc(r.indikator || '—') + '<div class="xs b">' + esc(r.target || '') + '</div>' }, { k: 'penanggung_jawab', l: 'PJ' },
          { k: 'masalah_id', l: 'Dasar', txt: r => r.masalah_id, fmt: r => r.masalah_id ? '<span class="pill hijau">' + ic('link') + 'Terhubung</span>' : '<span class="pill kuning">Belum terhubung</span>' },
          { k: 'status', l: 'Status', fmt: r => '<span class="pill ' + (r.status === 'disetujui' ? 'hijau' : '') + '">' + esc(r.status || 'draf') + '</span>' }],
        empty: { ic: 'event_note', t: 'Belum ada program RKJM', s: 'Buat dari hasil keputusan (otomatis) atau tambah manual.' },
        actions: r => (can('Program_RKJM', 'U') ? UI.actBtn('e', 'edit', 'Ubah') : '') + (can('Program_RKJM', 'H') ? UI.actBtn('h', 'delete', 'Hapus') : ''),
        onAct: async (a, id) => { const r = Store.byId('Program_RKJM', id); if (a === 'e') pForm(r); if (a === 'h' && await UI.confirm({ text: 'Hapus program "' + r.program + '"?', danger: 1, ok: 'Hapus' })) { const x = await Store.remove('Program_RKJM', id); toast(x.success ? 'Program dihapus.' : x.message, x.success ? 'ok' : 'bad'); } } });
      el._dt = dt; let tk = ''; const ap = () => { dt.filter = r => !tk || String(r.tahun_ke) === tk; dt.page = 1; dt.draw(); };
      $('[data-q]', el).oninput = UI.debounce(e => dt.setQ(e.target.value), 120); $('#tk', el).onchange = e => { tk = e.target.value; ap(); }; if ($('#np', el)) $('#np', el).onclick = () => pForm(null);
    };

    /* ---------- RKT ---------- */
    const kForm = (r) => UI.form({ title: r ? 'Ubah kegiatan RKT' : 'Tambah kegiatan RKT', size: 'lg', vals: r || { tahun_ajaran: ta(), sumber_dana: 'BOSP', status: 'rencana', bulan_mulai: 7, bulan_selesai: 7, anggaran: 0 }, fields: [
      { k: 'tahun_ajaran', l: 'Tahun ajaran', t: 'text', req: 1, ph: '2026/2027' }, { k: 'program_id', l: 'Program RKJM induk', t: 'ref', table: 'Program_RKJM', lbl: p => 'Th-' + p.tahun_ke + ' · ' + p.program, req: 1 },
      { k: 'kegiatan', l: 'Nama kegiatan', t: 'text', req: 1, full: 1 }, { k: 'indikator', l: 'Indikator', t: 'text' }, { k: 'target', l: 'Target', t: 'text' },
      { k: 'bulan_mulai', l: 'Bulan mulai', t: 'sel', req: 1, opts: URUT.map(m => [m, BLN[m - 1]]) }, { k: 'bulan_selesai', l: 'Bulan selesai', t: 'sel', req: 1, opts: URUT.map(m => [m, BLN[m - 1]]) },
      { k: 'penanggung_jawab', l: 'Penanggung jawab', t: 'text' }, { k: 'anggaran', l: 'Anggaran (Rp)', t: 'num', min: 0, step: 1000 },
      { k: 'sumber_dana', l: 'Sumber dana', t: 'sel', opts: SD.map(s => [s, s]) }, { k: 'kode_arkas', l: 'Kode ARKAS', t: 'text', ph: 'mis. 07.02' },
      { k: 'status', l: 'Status', t: 'sel', opts: Object.keys(STATUS_K).map(k => [k, STATUS_K[k][0]]) }],
      onSubmit: async (x) => { if (idxAk(x.bulan_selesai) < idxAk(x.bulan_mulai)) return { success: false, message: 'Bulan selesai tidak boleh sebelum bulan mulai dalam tahun ajaran (Juli–Juni).' }; x.bulan_mulai = String(x.bulan_mulai); x.bulan_selesai = String(x.bulan_selesai); x.anggaran = +x.anggaran || 0;
        const s = await Store.save('Kegiatan_RKT', Object.assign({}, r || {}, x)); if (s.success) toast('Kegiatan tersimpan.', 'ok'); return s; } });
    const rkt = (el) => {
      el.innerHTML = kunci('RKT', ta()) + '<div class="toolbar">' + UI.searchBox('Cari kegiatan') + '<span class="muted sm" id="cn"></span>' + (can('Kegiatan_RKT', 'T') ? '<button class="btn p" id="nk">' + ic('add') + 'Tambah kegiatan</button>' : '') + '</div><div id="tbl"></div>';
      const dt = new DataTable($('#tbl', el), { rows: kgt, per: 30, sort: { k: 'bulan_mulai', d: 1 }, onCount: n => { const c = $('#cn', el); if (c) c.textContent = n + ' kegiatan'; },
        cols: [{ k: 'kegiatan', l: 'Kegiatan', fmt: r => '<b>' + esc(r.kegiatan) + '</b><div class="xs muted">' + esc(progName(r.program_id)) + '</div>' }, { k: 'bulan_mulai', l: 'Waktu', val: r => idxAk(r.bulan_mulai), fmt: r => esc(BLN3[r.bulan_mulai - 1] || '') + (r.bulan_selesai !== r.bulan_mulai ? ' – ' + esc(BLN3[r.bulan_selesai - 1] || '') : '') },
          { k: 'penanggung_jawab', l: 'PJ' }, { k: 'anggaran', l: 'Anggaran', val: r => +r.anggaran, fmt: r => '<b>' + rp(r.anggaran) + '</b><div class="xs muted">' + esc(r.sumber_dana || '') + (r.kode_arkas ? ' · ' + esc(r.kode_arkas) : '') + '</div>' },
          { k: 'status', l: 'Status', fmt: r => { const s = STATUS_K[r.status] || STATUS_K.rencana; return '<span class="pill ' + s[1] + '">' + s[0] + '</span>'; } }],
        empty: { ic: 'checklist', t: 'Belum ada kegiatan RKT', s: 'Turunkan program RKJM menjadi kegiatan tahunan.' },
        actions: r => (can('Kegiatan_RKT', 'U') ? UI.actBtn('e', 'edit', 'Ubah') : '') + (can('Kegiatan_RKT', 'H') ? UI.actBtn('h', 'delete', 'Hapus') : ''),
        onAct: async (a, id) => { const r = Store.byId('Kegiatan_RKT', id); if (a === 'e') kForm(r); if (a === 'h' && await UI.confirm({ text: 'Hapus kegiatan "' + r.kegiatan + '"?', danger: 1, ok: 'Hapus' })) { const x = await Store.remove('Kegiatan_RKT', id); toast(x.success ? 'Kegiatan dihapus.' : x.message, x.success ? 'ok' : 'bad'); } } });
      el._dt = dt; $('[data-q]', el).oninput = UI.debounce(e => dt.setQ(e.target.value), 120); if ($('#nk', el)) $('#nk', el).onclick = () => kForm(null);
    };

    /* ---------- Kalender (Gantt) ---------- */
    const kalender = (el) => {
      const ks = kgt().filter(k => k.tahun_ajaran === ta()); if (!ks.length) { el.innerHTML = '<div class="card">' + UI.emptyBox('calendar_month', 'Belum ada kegiatan untuk TA ' + ta(), 'Tambahkan kegiatan pada tab RKT.') + '</div>'; return; }
      const now = new Date().getMonth() + 1;
      const cls = { selesai: 'selesai', tertunda: 'tertunda', batal: 'batal' };
      el.innerHTML = '<div class="card"><div class="row between wrap"><h3>Kalender kegiatan TA ' + esc(ta()) + '</h3><div class="legend">' + [['Rencana/Berjalan', 'var(--teal)'], ['Selesai', 'var(--green)'], ['Ditunda', 'var(--amber)']].map(x => '<span><i style="background:' + x[1] + '"></i>' + x[0] + '</span>').join('') + '</div></div><div class="gantt" style="margin-top:12px"><div class="h">Kegiatan</div>' + URUT.map(m => '<div class="h" style="' + (m === now ? 'color:var(--cobalt)' : '') + '">' + BLN3[m - 1] + '</div>').join('') +
        ks.slice().sort((a, b) => idxAk(a.bulan_mulai) - idxAk(b.bulan_mulai)).map(k => { const a = Math.max(0, idxAk(k.bulan_mulai)), z = Math.max(a, idxAk(k.bulan_selesai)); return '<div class="nm" title="' + esc(k.kegiatan) + '">' + esc(k.kegiatan) + '</div>' + (a ? '<div style="grid-column:span ' + a + '"></div>' : '') + '<div style="grid-column:span ' + (z - a + 1) + '"><span class="bar2 ' + (cls[k.status] || '') + '" title="' + esc(BLN[k.bulan_mulai - 1] + '–' + BLN[k.bulan_selesai - 1]) + '"></span></div>' + (11 - z ? '<div style="grid-column:span ' + (11 - z) + '"></div>' : ''); }).join('') + '</div><p class="muted xs" style="margin-top:10px">Tahun ajaran dihitung Juli–Juni. Kegiatan yang melintasi dua tahun ajaran dipecah menjadi dua entri.</p></div>';
    };

    /* ---------- Anggaran ---------- */
    const anggaran = (el) => {
      const ks = kgt().filter(k => k.tahun_ajaran === ta()), tot = ks.reduce((s, k) => s + (+k.anggaran || 0), 0), per = {}, sd = {}, bln = {};
      ks.forEach(k => { const pn = progName(k.program_id); per[pn] = (per[pn] || 0) + (+k.anggaran || 0); sd[k.sumber_dana || 'Lainnya'] = (sd[k.sumber_dana || 'Lainnya'] || 0) + (+k.anggaran || 0); const m = +k.bulan_mulai; bln[m] = (bln[m] || 0) + (+k.anggaran || 0); });
      const tanpaArkas = ks.filter(k => +k.anggaran && !k.kode_arkas);
      el.innerHTML = '<div class="grid g3 keep2" style="margin-bottom:16px"><div class="card kpi"><span class="ic">' + ic('payments') + '</span><div><div class="v">' + rpS(tot) + '</div><div class="l">Total anggaran RKT</div></div></div><div class="card kpi"><span class="ic">' + ic('checklist') + '</span><div><div class="v">' + ks.length + '</div><div class="l">Kegiatan</div></div></div><div class="card kpi"><span class="ic" style="background:#FFF1D9;color:#B7791F">' + ic('qr_code') + '</span><div><div class="v">' + tanpaArkas.length + '</div><div class="l">Belum berkode ARKAS</div></div></div></div>' +
        '<div class="grid g2"><div class="card"><h3>Per program</h3>' + UI.hbars(Object.keys(per).map(k => ({ l: k, v: per[k], t: rpS(per[k]), k: 'biru' })), Math.max.apply(null, Object.values(per).concat([1]))) + '</div><div class="card"><h3>Per sumber dana</h3>' + UI.hbars(Object.keys(sd).map(k => ({ l: k, v: sd[k], t: rpS(sd[k]), k: 'teal' })), Math.max.apply(null, Object.values(sd).concat([1]))) + '</div></div>' +
        '<div class="card" style="margin-top:16px"><h3>Serapan rencana per bulan</h3>' + UI.line(URUT.map(m => ({ l: BLN3[m - 1], v: (bln[m] || 0) / 1e6 })), { c: '#12B5A6' }) + '<div class="xs muted">Dalam juta rupiah, menurut bulan mulai kegiatan.</div></div>' +
        (tanpaArkas.length ? '<div class="alert warn" style="margin-top:16px">' + ic('warning') + '<span>' + tanpaArkas.length + ' kegiatan beranggaran belum memiliki kode ARKAS: ' + tanpaArkas.slice(0, 3).map(k => esc(k.kegiatan)).join('; ') + (tanpaArkas.length > 3 ? '…' : '') + '</span></div>' : '');
    };

    /* ---------- Persetujuan ---------- */
    const persetujuan = (el) => {
      if (!appr) { el.innerHTML = '<div class="sk" style="height:160px"></div>'; return; }
      el.innerHTML = '<div class="col" style="gap:16px">' + appr.map((a, i) => { const st = a.tahap, peran = TAHAP_PERAN[a.tahap_sekarang] || '';
        return '<div class="card"><div class="row between wrap"><div><h3>' + esc(a.jenis) + ' · ' + esc(a.scope) + '</h3><div class="muted sm">Versi ' + a.versi + ' · ' + (a.final ? 'Final &amp; terkunci' : 'Tahap sekarang: <b>' + esc(a.tahap_sekarang) + '</b>' + (peran ? ' (' + peran + ')' : '')) + '</div></div>' + (a.final ? '<span class="pill hijau">' + ic('lock') + 'Final v' + a.versi + '</span>' : '<span class="pill biru">Dalam proses</span>') + '</div>' +
          '<ol class="tl">' + st.map(t => { const now = !a.final && t.nama === a.tahap_sekarang; return '<li class="' + (t.selesai ? 'done' : now ? 'now' : '') + '"><div><b>' + esc(t.nama) + '</b><div class="xs muted">' + (t.selesai ? esc(t.oleh) + ' · ' + tgl(t.tanggal) : now ? 'Menunggu tindakan' : 'Belum') + '</div></div></li>'; }).join('') + '</ol>' +
          '<div class="row wrap" style="margin-top:8px">' + (!a.final ? '<button class="btn p" data-pr="' + i + '">' + ic('task_alt') + 'Proses tahap “' + esc(a.tahap_sekarang) + '”</button>' : (can('Program_RKJM', 'S') ? '<button class="btn" data-vb="' + i + '">' + ic('edit_document') + 'Buat versi baru</button>' : '')) + '<button class="btn g" data-rw="' + i + '">' + ic('history') + 'Riwayat (' + a.riwayat.length + ')</button></div></div>'; }).join('') + '</div>';
      el.onclick = async (e) => {
        const pr = e.target.closest('[data-pr]'), vb = e.target.closest('[data-vb]'), rw = e.target.closest('[data-rw]');
        if (pr) { const a = appr[+pr.dataset.pr], pd = a.tahap_sekarang === 'Pengesahan Dinas';
          UI.form({ title: a.tahap_sekarang + ' — ' + a.jenis + ' ' + a.scope, ok: 'Simpan keputusan', vals: { aksi: 'setuju' }, fields: [{ k: 'aksi', l: 'Keputusan', t: 'sel', req: 1, opts: [['setuju', 'Setujui / selesai tahap ini'], ['tolak', 'Tolak (kembali ke Draf)']] }, { k: 'catatan', l: 'Catatan', t: 'area', hint: 'Wajib diisi bila menolak.' }, { k: 'bukti_url', l: 'Tautan bukti (https://)', t: 'url', show: v => pd && v.aksi === 'setuju', hint: 'Wajib pada tahap Pengesahan Dinas, mis. tautan SK Drive.' }],
            onSubmit: async (x) => { if (x.aksi === 'tolak' && !x.catatan) return { success: false, message: 'Catatan revisi wajib diisi saat menolak.' }; if (pd && x.aksi === 'setuju' && !x.bukti_url) return { success: false, message: 'Tautan bukti pengesahan Dinas wajib diisi.' };
              const r = await API.write('persetujuan.proses', { jenis: a.jenis, scope: a.scope, aksi: x.aksi, catatan: x.catatan, bukti_url: x.bukti_url }); if (r.success) { toast(r.message || 'Tahap diproses.', 'ok'); await loadAppr(); await Store.loadMany(['Program_RKJM', 'Kegiatan_RKT'], true); Store.refreshDash(); } return r; } }); }
        if (vb) { const a = appr[+vb.dataset.vb]; UI.form({ title: 'Buat versi baru ' + a.jenis + ' ' + a.scope, ok: 'Buat versi baru', fields: [{ k: 'alasan', l: 'Alasan revisi', t: 'area', req: 1, full: 1 }],
          onSubmit: async (x) => { const r = await API.write('persetujuan.versiBaru', { jenis: a.jenis, scope: a.scope, alasan: x.alasan }); if (r.success) { toast(r.message, 'ok'); await loadAppr(); await Store.loadMany(['Program_RKJM', 'Kegiatan_RKT'], true); } return r; } }); }
        if (rw) { const a = appr[+rw.dataset.rw], m = UI.modal({ title: 'Riwayat ' + a.jenis + ' ' + a.scope, size: 'lg', footer: '<button class="btn" data-c>Tutup</button>', body: a.riwayat.length ? '<div class="tw"><table class="tbl rsp"><thead><tr><th>Tanggal</th><th>Tahap</th><th>Status</th><th>Oleh</th><th>Catatan</th></tr></thead><tbody>' + a.riwayat.slice().reverse().map(h => '<tr><td data-l="Tanggal">' + tgl(h.tanggal) + '</td><td data-l="Tahap">' + esc(h.tahap) + '</td><td data-l="Status"><span class="pill ' + (h.status === 'ditolak' ? 'merah' : h.status === 'selesai' ? 'hijau' : 'biru') + '">' + esc(h.status) + '</span></td><td data-l="Oleh">' + esc(h.oleh) + '</td><td data-l="Catatan">' + esc(h.catatan || '') + (h.bukti_url ? ' <a href="' + esc(h.bukti_url) + '" target="_blank" rel="noopener">bukti</a>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : UI.emptyBox('history', 'Belum ada riwayat', '') }); m.$('[data-c]').onclick = m.close; }
      };
    };

    /* ---------- Keselarasan ---------- */
    const keselarasan = async (el) => {
      el.innerHTML = '<div class="sk" style="height:160px"></div>'; const r = await API.read('selaras.cek'); if (!el.isConnected) return;
      if (!r.success) { el.innerHTML = '<div class="alert bad">' + ic('error') + '<span>' + esc(r.message) + '</span></div>'; return; }
      const d = r.data, w = { tinggi: ['merah', 'Tinggi'], sedang: ['kuning', 'Sedang'], rendah: ['', 'Rendah'] };
      el.innerHTML = '<div class="grid g32"><div class="card"><div class="row between"><h3>Temuan keselarasan</h3><span class="muted sm">Rapor merah → masalah → program → kegiatan</span></div>' + (d.temuan.length ? d.temuan.map(t => '<div class="row" style="align-items:flex-start;padding:10px 0;border-top:1px solid var(--border)"><span class="pill ' + w[t.level][0] + '">' + w[t.level][1] + '</span><div class="grow"><b class="sm">' + esc(t.jenis) + '</b><div class="sm muted">' + esc(t.teks) + '</div></div></div>').join('') : '<div class="alert ok" style="margin-top:12px">' + ic('check_circle') + '<span>Semua rantai perencanaan selaras. Tidak ada temuan.</span></div>') + '</div>' +
        '<div class="card" style="text-align:center"><h3>Skor keselarasan</h3>' + UI.donut([{ l: 'Selaras', v: d.skor, c: UI.WARNA.hijau }, { l: 'Perlu perbaikan', v: 100 - d.skor, c: '#E3E9F7' }], 150, d.skor + '%') + '<div class="muted sm" style="margin-top:8px">' + d.ringkas.rapor_merah + ' rapor merah · ' + d.ringkas.program + ' program · ' + d.ringkas.kegiatan + ' kegiatan</div></div></div>';
    };

    /* ---------- Cetak ---------- */
    const cetak = (el) => {
      const jenisL = [['rkjm', 'RKJM ' + periode(), periode(), 'Program_RKJM'], ['rkt', 'RKT ' + ta(), ta(), 'Kegiatan_RKT']];
      el.innerHTML = '<div class="grid g2">' + jenisL.map(j => { const a = stat(j[0].toUpperCase(), j[2]); return '<div class="card"><div class="row between"><h3>' + esc(j[1]) + '</h3>' + (a ? (a.final ? '<span class="pill hijau">Final v' + a.versi + '</span>' : '<span class="pill kuning">Draf — ' + esc(a.tahap_sekarang) + '</span>') : '') + '</div><p class="muted sm">Dokumen resmi dari templat Google Docs sekolah, lengkap dengan status pengesahan.</p><div class="row wrap"><button class="btn p" data-c="' + j[0] + '|pdf|' + esc(j[2]) + '">' + ic('picture_as_pdf') + 'Unduh PDF</button><button class="btn" data-c="' + j[0] + '|docx|' + esc(j[2]) + '">' + ic('description') + 'Unduh Word</button></div></div>'; }).join('') + '</div><div class="alert" style="margin-top:16px">' + ic('info') + '<span>Templat diatur Admin di Pengaturan → Templat Dokumen. Pengamat hanya dapat mencetak dokumen yang sudah Final.</span></div>';
      el.onclick = async (e) => { const b = e.target.closest('[data-c]'); if (!b) return; const [jn, fmt, ref] = b.dataset.c.split('|'); b.classList.add('load'); b.disabled = true; const r = await API.write('dok.cetak', { jenis: jn, format: fmt, ref }, { timeout: 60000, retry: 0 }); b.classList.remove('load'); b.disabled = false; if (!r.success) { toast(r.message, 'bad'); return; } UI.saveBlob(r.data.nama, r.data.mime, r.data.b64); toast('Dokumen siap diunduh.', 'ok'); };
    };

    const DAFTAR = [['rkjm', 'RKJM'], ['rkt', 'RKT'], ['kalender', 'Kalender'], ['anggaran', 'Anggaran'], ['persetujuan', 'Persetujuan'], ['selaras', 'Keselarasan'], ['cetak', 'Cetak']];
    const sub = DAFTAR.map(x => x[0]).indexOf(parts[0]) > -1 ? parts[0] : 'rkjm';
    const draw = (k, el) => { ({ rkjm, rkt, kalender, anggaran, persetujuan, selaras: keselarasan, cetak })[k](el); };
    const go = tabs($('#body', v), DAFTAR, sub, draw);
    const redraw = () => { const t = $('.tabs [aria-selected=true]', v); if (t && t.dataset.t === 'persetujuan') draw('persetujuan', $('#tb', v)); };
    loadAppr();
    X.watch(['t:Program_RKJM', 't:Kegiatan_RKT', 't:Masalah_Prioritas'], () => { const t = $('.tabs [aria-selected=true]', v); if (!t) return; const k = t.dataset.t, el = $('#tb', v); if ((k === 'rkjm' || k === 'rkt') && el._dt) el._dt.draw(); else if (k !== 'selaras' && k !== 'persetujuan' && k !== 'cetak') draw(k, el); });
  } };
})();
