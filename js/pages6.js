/* SIPERENCANA — pages6.js: UPGRADE — Rekomendasi (2.1), Prioritas (2.2), Lembar Kerja RKT (3), Lembar Kerja ARKAS (4), Cetak.
 * Berkas BARU. Menambah tab lewat window.PAGES_EXTRA (dibaca oleh pages1.js untuk Rapor dan pages2.js untuk RKJM & RKT);
 * tampilan, komponen, dan kelas CSS yang sudah ada dipakai ulang. */
(function () {
  const { esc, $, $$, ic, num: unum, rp, toast, DataTable, pillKat } = UI, can = (t, h) => Store.can(t, h);
  const num2 = (n) => (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const BLN = UI.BLN, URUT = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  const ta = () => Store.set.TA_AKTIF || '';
  const nrm = (t) => String(t == null ? '' : t).toLowerCase().replace(/\s+/g, ' ').trim();
  const rapi = (t) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  const kat = (s) => { const m = +(Store.set.AMBANG_RAPOR_MERAH || 50), h = +(Store.set.AMBANG_RAPOR_HIJAU || 75); return s < m ? 'merah' : s < h ? 'kuning' : 'hijau'; };
  const alert = (t, c) => '<div class="alert ' + (c || 'warn') + '" style="margin:0 0 12px">' + ic(c === 'bad' ? 'error' : c === 'ok' ? 'check_circle' : 'info') + '<span>' + t + '</span></div>';
  const sekolah = () => Store.rows('Sekolah')[0] || {};
  const muatXlsx = async () => { if (window.XLSX) return; await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); };

  /* ================= CETAK (tingkat 1: cetak dari aplikasi, A4 landscape + kop sekolah) ================= */
  const cetak = async (judul, subjudul, kolom, baris, opsi) => {
    opsi = opsi || {}; try { await Store.load('Sekolah'); } catch (e) { } const s = sekolah();
    const kop = '<div class="kop"><b>' + esc(s.nama || Store.set.NAMA_SEKOLAH || '') + '</b>' + (s.npsn ? '<div>NPSN ' + esc(s.npsn) + '</div>' : '') + (s.alamat ? '<div>' + esc(s.alamat) + '</div>' : '') + '</div>';
    const th = kolom.map(k => '<th' + (k.w ? ' style="width:' + k.w + '"' : '') + '>' + esc(k.l) + '</th>').join('');
    const tb = baris.map(r => r._grup ? '<tr class="grup"><td colspan="' + kolom.length + '">' + r._grup + '</td></tr>' : '<tr>' + kolom.map(k => '<td class="' + (k.r ? 'r' : '') + '">' + (k.h ? k.h(r) : esc(r[k.k] == null ? '' : r[k.k])) + '</td>').join('') + '</tr>').join('');
    const area = document.createElement('div'); area.id = 'print-area';
    area.innerHTML = kop + '<h2>' + esc(judul) + '</h2>' + (subjudul ? '<div class="sub">' + esc(subjudul) + '</div>' : '') + '<table><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody></table>' +
      (opsi.catatan ? '<div class="cat">' + opsi.catatan + '</div>' : '') +
      '<div class="ttd"><div>Mengetahui,<br>Kepala Sekolah<br><br><br><br><b><u>' + esc(s.kepala_sekolah || '........................') + '</u></b>' + (s.nip_kepsek ? '<br>NIP ' + esc(s.nip_kepsek) : '') + '</div></div>' +
      '<div class="ft">Dicetak dari SIPERENCANA · ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + (opsi.sumber ? ' · ' + esc(opsi.sumber) : '') + '</div>';
    document.body.appendChild(area); document.body.classList.add('printing');
    const bersih = () => { area.remove(); document.body.classList.remove('printing'); window.removeEventListener('afterprint', bersih); };
    window.addEventListener('afterprint', bersih); setTimeout(() => window.print(), 50);
  };

  /* ================= REKOMENDASI 2.1 & PRIORITAS 2.2 ================= */
  const bacaKatalog = (tbl) => {
    let h = -1;
    for (let i = 0; i < Math.min(tbl.length, 40); i++) { const t = tbl[i].map(x => rapi(x).toLowerCase()); if (t.some(x => x.indexOf('akar masalah') > -1) && t.some(x => x.indexOf('kegiatan benahi') > -1)) { h = i; break; } }
    if (h < 0) return null;
    const hd = tbl[h].map(x => rapi(x).toLowerCase()), cari = (f) => hd.findIndex(f);
    const cId = cari(x => x.indexOf('identifikasi') === 0 || x === 'indikator' || x === 'kode indikator'), cAk = cari(x => x.indexOf('akar masalah') === 0), cKb = cari(x => x === 'kegiatan benahi' || x.indexOf('kegiatan benahi') === 0 && x.indexOf('inspirasi') < 0 && x.indexOf('tautan') < 0);
    const cIn = cari(x => x.indexOf('inspirasi') > -1), cTa = cari(x => x.indexOf('tautan') > -1 || x.indexOf('referensi') > -1), cAr = cari(x => x.indexOf('kegiatan arkas') > -1 && x.indexOf('uraian') < 0);
    if (cAk < 0 || cKb < 0) return null;
    let ver = ''; for (let i = 0; i < tbl.length; i++) { const m = /laporan\s+diperbarui\s*[:\-]?\s*(.+)/i.exec(tbl[i].map(rapi).join(' ')); if (m) { ver = rapi(m[1]).slice(0, 60); break; } }
    const kd = (t) => { const m = /^\s*([A-Za-z]{1,3}\.?\d+(?:\.\d+)*)\b/.exec(rapi(t)); return m ? m[1] : ''; };
    const data = []; let id = '', ak = '';
    for (let i = h + 1; i < tbl.length; i++) {
      const r = tbl[i]; if (r.every(x => rapi(x) === '')) continue;
      if (cId >= 0 && rapi(r[cId])) id = rapi(r[cId]);
      const akarBaru = rapi(r[cAk]); if (akarBaru) ak = akarBaru;
      const kb = rapi(r[cKb]); if (!ak && !kb) continue;
      const kodeInd = kd(id) || rapi(id).split(' ')[0], kodeAkar = kd(ak);
      data.push({ kode_indikator: kodeInd, kode_akar: kodeAkar, akar_masalah: rapi(ak.replace(/^\s*[A-Za-z]{1,3}\.?\d+(?:\.\d+)*\s*[-–.:]?\s*/, '')) || ak, kegiatan_benahi: kb,
        inspirasi: cIn >= 0 ? rapi(r[cIn]) : '', tautan: cTa >= 0 ? rapi(r[cTa]) : '', kegiatan_arkas: cAr >= 0 ? rapi(r[cAr]) : '', versi: ver, _baris: i + 1 });
    }
    return { data, versi: ver };
  };
  const bacaKatalogPolos = (tbl) => {              // format templat sederhana (judul kolom = nama field)
    const hd = (tbl[0] || []).map(x => rapi(x).toLowerCase().replace(/\s+/g, '_'));
    if (hd.indexOf('kode_indikator') < 0 || hd.indexOf('akar_masalah') < 0) return null;
    const data = tbl.slice(1).filter(r => r.some(x => rapi(x))).map((r, i) => { const o = { _baris: i + 2 }; hd.forEach((k, j) => { if (k) o[k] = rapi(r[j]); }); return o; });
    return { data, versi: '' };
  };
  const formImpor = () => {
    const m = UI.modal({ title: 'Impor katalog rekomendasi (Excel sheet 2.1)', size: 'lg', footer: '<button class="btn" data-c>Tutup</button>', body:
      '<ol class="muted sm" style="padding-left:18px;margin:0 0 12px"><li>Buka berkas Excel Rapor Pendidikan Anda, sheet <b>2.1 Rekomendasi Keseluruhan</b>.</li><li>Unggah berkas Excel (.xlsx) itu di sini. Baris contoh "[CONTOH]" dilewati otomatis.</li><li>Periksa pratinjau, lalu impor. Impor ulang aman — tidak membuat data ganda.</li></ol>' +
      '<div class="dz" id="dz2" tabindex="0" style="border:2px dashed var(--border,#cfd8ea);border-radius:12px;padding:22px;text-align:center;cursor:pointer">' + ic('upload_file') + '<div><b>Pilih berkas Excel</b> atau tarik ke sini</div><input type="file" id="fi2" accept=".xlsx,.xls" hidden></div><div id="pv2" style="margin-top:14px"></div>' });
    m.$('[data-c]').onclick = m.close;
    const pv = m.$('#pv2'), fi = m.$('#fi2'), dz = m.$('#dz2');
    const proses = async (file) => {
      pv.innerHTML = '<div class="sk" style="height:90px"></div>';
      try {
        await muatXlsx(); const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        let hasil = null; const nama = wb.SheetNames.slice().sort((a, b) => (/2\.1|rekomendasi/i.test(b) ? 1 : 0) - (/2\.1|rekomendasi/i.test(a) ? 1 : 0));
        for (const n of nama) { const tbl = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: false }); hasil = bacaKatalog(tbl) || bacaKatalogPolos(tbl); if (hasil && hasil.data.length) break; }
        if (!hasil || !hasil.data.length) { pv.innerHTML = alert('Kolom <b>Akar Masalah</b> dan <b>Kegiatan Benahi</b> tidak ditemukan. Pastikan berkas adalah sheet 2.1 dari Excel Rapor Pendidikan.', 'bad'); return; }
        const dr = await API.write('impor.katalog', { rows: hasil.data, dryRun: true });
        if (!dr.success) { pv.innerHTML = alert(esc(dr.message), 'bad'); return; }
        const d = dr.data;
        pv.innerHTML = '<div class="grid g4 keep2"><div class="card flat"><div class="kpi"><div><div class="v">' + hasil.data.length + '</div><div class="l">Baris terbaca</div></div></div></div><div class="card flat"><div class="kpi"><div><div class="v">' + d.tambah + '</div><div class="l">Baru</div></div></div></div><div class="card flat"><div class="kpi"><div><div class="v">' + d.ubah + '</div><div class="l">Diperbarui</div></div></div></div><div class="card flat"><div class="kpi"><div><div class="v">' + d.lewati + '</div><div class="l">Tidak berubah</div></div></div></div></div>' +
          (hasil.versi ? '<div class="muted sm" style="margin-top:8px">Laporan diperbarui: <b>' + esc(hasil.versi) + '</b></div>' : '') +
          (d.contoh ? '<div class="muted sm">' + d.contoh + ' baris contoh dilewati.</div>' : '') +
          (d.galat.length ? '<div class="alert warn" style="margin-top:12px">' + ic('warning') + '<div><b>Baris bermasalah (dilewati):</b><ul style="margin:6px 0 0;padding-left:18px">' + d.galat.slice(0, 6).map(g => '<li>Baris ' + ((hasil.data[g.baris - 2] && hasil.data[g.baris - 2]._baris) || g.baris) + ': ' + esc(g.pesan) + '</li>').join('') + '</ul></div></div>' : '') +
          '<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn p" id="go2" ' + (d.tambah + d.ubah ? '' : 'disabled') + '>' + ic('check') + 'Impor ' + (d.tambah + d.ubah) + ' baris</button></div>';
        m.$('#go2').onclick = async (e) => { const b = e.currentTarget; b.classList.add('load'); const r = await API.write('impor.katalog', { rows: hasil.data, abaikanGalat: true }); b.classList.remove('load'); if (!r.success) { toast(r.message, 'bad'); return; } toast('Katalog diimpor: ' + r.data.tambah + ' baru, ' + r.data.ubah + ' diperbarui.', 'ok'); Store.invalidate('Katalog_Rekomendasi'); m.close(); document.dispatchEvent(new CustomEvent('rekom:refresh')); };
      } catch (e) { pv.innerHTML = alert('Gagal membaca berkas: ' + esc(e.message || e), 'bad'); }
    };
    dz.onclick = () => fi.click(); fi.onchange = () => fi.files[0] && proses(fi.files[0]);
    ['dragover', 'dragenter'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); }));
    dz.addEventListener('drop', ev => { ev.preventDefault(); if (ev.dataTransfer.files[0]) proses(ev.dataTransfer.files[0]); });
  };

  const rekomTab = (mode) => async (el, X) => {
    let tahun = null, filt = 'semua', q = '', data = null;
    const prioritas = mode === 'prioritas';
    const muat = async () => {
      el.innerHTML = '<div class="sk" style="height:180px"></div>';
      const r = await API.read('rekom.daftar', tahun ? { tahun } : {}); if (!el.isConnected) return;
      if (!r.success) { el.innerHTML = alert(esc(r.message), 'bad'); return; }
      data = r.data; tahun = data.tahun; gambar();
    };
    const kandidat = () => data.indikator.filter(r => (prioritas ? r.kategori !== 'hijau' : (filt === 'semua' || r.kategori === filt)) && (!q || nrm(r.kode + ' ' + r.indikator + ' ' + r.akar.map(a => a.akar_masalah + ' ' + a.kegiatan_benahi).join(' ')).indexOf(q) > -1));
    const jadikan = async (id, btn) => {
      const r0 = data.indikator.find(x => x.id === id); if (!r0) return;
      if (!await UI.confirm({ text: 'Jadikan indikator "' + r0.kode + ' ' + r0.indikator + '" sebagai masalah prioritas? Akar masalah dari katalog ikut dicatat.', ok: 'Jadikan masalah prioritas' })) return;
      btn.classList.add('load'); const r = await API.write('rekom.jadikanMasalah', { indikator_id: id }); btn.classList.remove('load');
      if (!r.success) { toast(r.message, r.code === 'DUPLIKAT' ? 'warn' : 'bad'); if (r.code === 'DUPLIKAT') muat(); return; }
      toast(r.message, 'ok'); Store.invalidate('Masalah_Prioritas'); Store.load('Masalah_Prioritas', true); muat();
    };
    const aksiMasalah = (r) => r.masalah_id ? '<a class="btn sm" href="#/keputusan">' + ic('balance') + 'Sudah di Pengambilan Keputusan</a>' : (r.kategori !== 'hijau' && can('Masalah_Prioritas', 'T') ? '<button class="btn sm p" data-jm="' + esc(r.id) + '">' + ic('flag') + 'Jadikan masalah prioritas</button>' : '');
    const gambar = () => {
      const l = kandidat(), jml = { merah: 0, kuning: 0, hijau: 0 }; data.indikator.forEach(r => jml[r.kategori]++);
      const tg = '<div class="toolbar">' + '<select class="in" id="rt" aria-label="Tahun" style="width:auto">' + data.tahunList.map(t => '<option value="' + t + '"' + (t === tahun ? ' selected' : '') + '>Rapor ' + t + '</option>').join('') + '</select>' +
        (prioritas ? '' : '<div class="seg" role="group">' + [['semua', 'Semua'], ['merah', 'Merah (' + jml.merah + ')'], ['kuning', 'Kuning (' + jml.kuning + ')'], ['hijau', 'Hijau (' + jml.hijau + ')']].map(f => '<button class="btn sm ' + (filt === f[0] ? 'p' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>') +
        UI.searchBox('Cari indikator / akar masalah') + (can('Katalog_Rekomendasi', 'T') ? '<button class="btn" id="ik">' + ic('upload_file') + 'Impor katalog</button>' : '') + '<button class="btn" id="cx">' + ic('print') + 'Cetak</button></div>';
      const info = !data.indikator.length ? '<div class="card">' + UI.emptyBox('fact_check', 'Belum ada data Rapor untuk tahun ini', 'Impor data Rapor Pendidikan lebih dulu pada tab Impor Data.') + '</div>' : '';
      const ket = data.jumlah_katalog ? '<div class="muted xs" style="margin:0 0 10px">Sumber katalog: ' + esc(data.sumber) + (data.versi ? ' · diperbarui ' + esc(data.versi) : '') + ' · ' + data.jumlah_katalog + ' baris</div>' :
        (can('Katalog_Rekomendasi', 'L') ? alert('Katalog rekomendasi belum diisi. ' + (can('Katalog_Rekomendasi', 'T') ? 'Klik <b>Impor katalog</b> lalu unggah sheet 2.1 dari Excel Rapor Pendidikan.' : 'Minta Kepala Sekolah atau Admin mengimpor katalog.'), 'warn') : '');
      let body;
      if (!l.length) body = info || '<div class="card">' + UI.emptyBox('search_off', prioritas ? 'Tidak ada indikator merah/kuning' : 'Tidak ada hasil', prioritas ? 'Semua indikator berkategori baik.' : 'Ubah filter atau kata kunci.') + '</div>';
      else if (prioritas) {
        body = '<div class="card"><div class="tw"><table class="tbl rsp"><thead><tr><th>No</th><th>Kode</th><th>Indikator</th><th>Skor</th><th>Kategori</th><th>Akar masalah (katalog)</th><th></th></tr></thead><tbody>' +
          l.map((r, i) => '<tr><td data-l="No">' + (i + 1) + '</td><td data-l="Kode"><b>' + esc(r.kode) + '</b></td><td data-l="Indikator">' + esc(r.indikator) + '</td><td data-l="Skor"><b>' + num2(r.skor) + '</b></td><td data-l="Kategori">' + pillKat(r.kategori) + '</td><td data-l="Akar masalah">' + (r.akar.length ? r.akar.length + ' akar masalah' : '<span class="muted">—</span>') + '</td><td>' + aksiMasalah(r) + '</td></tr>').join('') + '</tbody></table></div></div>';
      } else {
        body = l.map(r => '<div class="card" style="margin-bottom:14px"><div class="row between wrap"><div><span class="pill">' + esc(r.kode) + '</span> <b>' + esc(r.indikator) + '</b><div class="xs muted">' + esc(r.standar_atau_aspek || '') + '</div></div><div class="row">' + '<b style="font-size:18px">' + num2(r.skor) + '</b>' + pillKat(r.kategori) + aksiMasalah(r) + '</div></div>' +
          (r.akar.length ? '<div class="tw" style="margin-top:10px"><table class="tbl rsp"><thead><tr><th>Akar masalah</th><th>Kegiatan benahi</th><th>Inspirasi kegiatan</th><th>Kegiatan ARKAS</th></tr></thead><tbody>' + r.akar.map(a => '<tr><td data-l="Akar masalah">' + (a.kode_akar ? '<span class="xs muted">' + esc(a.kode_akar) + '</span> ' : '') + esc(a.akar_masalah) + '</td><td data-l="Kegiatan benahi">' + esc(a.kegiatan_benahi) + (a.tautan ? ' <a href="' + esc(a.tautan) + '" target="_blank" rel="noopener noreferrer" title="Referensi">' + ic('open_in_new') + '</a>' : '') + '</td><td data-l="Inspirasi">' + esc(a.inspirasi) + '</td><td data-l="Kegiatan ARKAS">' + esc(a.kegiatan_arkas) + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="muted sm" style="margin-top:8px">Belum ada akar masalah di katalog untuk indikator ini.</div>') + '</div>').join('');
      }
      el.innerHTML = tg + ket + body; const s = $('[data-q]', el); if (s) { s.value = q; s.oninput = UI.debounce(e => { q = nrm(e.target.value); gambar(); const n = $('[data-q]', el); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 200); }
      const rt = $('#rt', el); if (rt) rt.onchange = () => { tahun = +rt.value; muat(); };
      $$('[data-f]', el).forEach(b => b.onclick = () => { filt = b.dataset.f; gambar(); });
      if ($('#ik', el)) $('#ik', el).onclick = formImpor;
      $$('[data-jm]', el).forEach(b => b.onclick = () => jadikan(b.dataset.jm, b));
      $('#cx', el).onclick = () => cetak(prioritas ? 'Rekomendasi Prioritas' : 'Rekomendasi Keseluruhan', 'Rapor Pendidikan ' + tahun, prioritas ?
        [{ l: 'No', w: '5%', h: r => r._no }, { l: 'Kode', k: 'kode', w: '8%' }, { l: 'Indikator', k: 'indikator' }, { l: 'Skor', w: '8%', r: 1, h: r => num2(r.skor) }, { l: 'Kategori', w: '10%', h: r => esc(r.kategori) }, { l: 'Akar masalah & kegiatan benahi', h: r => r.akar.map(a => esc((a.kode_akar ? a.kode_akar + ' ' : '') + a.akar_masalah) + ' → ' + esc(a.kegiatan_benahi)).join('<br>') }] :
        [{ l: 'Indikator', h: r => '<b>' + esc(r.kode) + '</b> ' + esc(r.indikator) + '<br>Skor ' + num2(r.skor) + ' (' + esc(r.kategori) + ')', w: '28%' }, { l: 'Akar masalah', h: r => r.akar.map(a => esc((a.kode_akar ? a.kode_akar + ' ' : '') + a.akar_masalah)).join('<br>') }, { l: 'Kegiatan benahi', h: r => r.akar.map(a => esc(a.kegiatan_benahi)).join('<br>') }, { l: 'Kegiatan ARKAS', h: r => r.akar.map(a => esc(a.kegiatan_arkas)).join('<br>') }],
        l.map((r, i) => Object.assign({ _no: i + 1 }, r)), { sumber: data.sumber });
    };
    if (el._rk) document.removeEventListener('rekom:refresh', el._rk);
    el._rk = () => { if (el.isConnected) muat(); };
    document.addEventListener('rekom:refresh', el._rk);
    await muat();
  };

  /* ================= LEMBAR KERJA RKT (sheet 3) ================= */
  const rktTab = (el, X) => {
    const keg = () => Store.rows('Kegiatan_RKT').filter(k => k.tahun_ajaran === ta()), msl = (id) => Store.byId('Masalah_Prioritas', id);
    const progs = () => Store.rows('Program_RKJM');
    let katalog = null;
    const muatKatalog = async () => { if (katalog) return katalog; const r = await API.read('rekom.daftar', {}); katalog = r.success ? r.data.indikator : []; return katalog; };
    const form = async (r) => {
      const kt = can('Katalog_Rekomendasi', 'L') ? await muatKatalog() : [];
      const v = r || { tahun_ajaran: ta(), butuh_biaya: 'ya', bulan_mulai: 7, bulan_selesai: 7, status: 'rencana', sumber_dana: 'BOSP' };
      const m = UI.modal({ title: r ? 'Ubah baris Lembar Kerja RKT' : 'Tambah baris Lembar Kerja RKT', size: 'lg', footer: '<button class="btn" data-n>Batal</button><button class="btn p" data-ok>Simpan</button>', body:
        '<form id="fk" novalidate><div class="fg">' +
        '<div class="f full"><label>Indikator prioritas (Identifikasi) *</label><select class="in" name="masalah_id"><option value="">— pilih masalah prioritas —</option>' + Store.rows('Masalah_Prioritas').map(x => '<option value="' + esc(x.id) + '"' + (x.id === v.masalah_id ? ' selected' : '') + '>' + esc(x.masalah) + '</option>').join('') + '</select><div class="hint xs muted">Belum ada? Buat dulu dari menu Rapor → Prioritas atau Pengambilan Keputusan.</div></div>' +
        '<div class="f full"><label>Akar masalah</label><input class="in" name="akar_masalah" list="dl-ak" value="' + esc(v.akar_masalah || '') + '" maxlength="500"><datalist id="dl-ak"></datalist></div>' +
        '<div class="f full"><label>Kegiatan benahi *</label><input class="in" name="kegiatan_benahi" list="dl-kb" value="' + esc(v.kegiatan_benahi || v.kegiatan || '') + '" maxlength="500"><datalist id="dl-kb"></datalist><div class="hint xs muted">Pilih dari saran katalog atau tulis sendiri.</div></div>' +
        '<div class="f full"><label>Penjelasan implementasi</label><textarea class="in" name="penjelasan" rows="3" maxlength="2000">' + esc(v.penjelasan || '') + '</textarea></div>' +
        '<div class="f"><label>Apakah kegiatan membutuhkan biaya? *</label><select class="in" name="butuh_biaya"><option value="ya"' + (v.butuh_biaya !== 'tidak' ? ' selected' : '') + '>Ya</option><option value="tidak"' + (v.butuh_biaya === 'tidak' ? ' selected' : '') + '>Tidak</option></select></div>' +
        '<div class="f"><label>Program RKJM induk *</label><select class="in" name="program_id"><option value="">— pilih —</option>' + progs().map(p => '<option value="' + esc(p.id) + '"' + (p.id === v.program_id ? ' selected' : '') + '>Th-' + esc(p.tahun_ke) + ' · ' + esc(p.program) + '</option>').join('') + '</select></div>' +
        '<div class="f"><label>Penanggung jawab</label><input class="in" name="penanggung_jawab" value="' + esc(v.penanggung_jawab || '') + '" maxlength="200"></div>' +
        '<div class="f"><label>Bulan mulai</label><select class="in" name="bulan_mulai">' + URUT.map(b => '<option value="' + b + '"' + (+v.bulan_mulai === b ? ' selected' : '') + '>' + BLN[b - 1] + '</option>').join('') + '</select></div>' +
        '<div class="f"><label>Bulan selesai</label><select class="in" name="bulan_selesai">' + URUT.map(b => '<option value="' + b + '"' + (+v.bulan_selesai === b ? ' selected' : '') + '>' + BLN[b - 1] + '</option>').join('') + '</select></div>' +
        '</div><div class="err" id="ferr" hidden style="margin-top:10px"></div></form>' });
      const f = (n) => m.$('[name="' + n + '"]'), saran = () => {
        const ms = msl(f('masalah_id').value), ik = ms && kt.find(x => x.id === ms.indikator_id), ak = ik ? ik.akar : [];
        m.$('#dl-ak').innerHTML = ak.map(a => '<option value="' + esc((a.kode_akar ? a.kode_akar + ' ' : '') + a.akar_masalah) + '"></option>').join('');
        const cur = nrm(f('akar_masalah').value), sub = ak.filter(a => !cur || nrm((a.kode_akar ? a.kode_akar + ' ' : '') + a.akar_masalah) === cur);
        m.$('#dl-kb').innerHTML = (sub.length ? sub : ak).map(a => '<option value="' + esc(a.kegiatan_benahi) + '"></option>').join('');
      };
      f('masalah_id').onchange = saran; f('akar_masalah').oninput = saran; saran();
      f('kegiatan_benahi').onchange = () => { const ms = msl(f('masalah_id').value), ik = ms && kt.find(x => x.id === ms.indikator_id), a = ik && ik.akar.find(x => nrm(x.kegiatan_benahi) === nrm(f('kegiatan_benahi').value)); if (a && !f('penjelasan').value && a.inspirasi) f('penjelasan').value = a.inspirasi; };
      m.$('[data-n]').onclick = m.close;
      m.$('[data-ok]').onclick = async (e) => {
        const err = m.$('#ferr'); err.hidden = true; const g = (n) => f(n).value.trim();
        if (!g('kegiatan_benahi')) { err.textContent = 'Kegiatan benahi wajib diisi.'; err.hidden = false; return; } if (!g('program_id')) { err.textContent = 'Program RKJM induk wajib dipilih.'; err.hidden = false; return; }
        if (URUT.indexOf(+g('bulan_selesai')) < URUT.indexOf(+g('bulan_mulai'))) { err.textContent = 'Bulan selesai tidak boleh sebelum bulan mulai (tahun ajaran Juli–Juni).'; err.hidden = false; return; }
        const ms = msl(g('masalah_id')), baris = Object.assign({}, r || {}, { tahun_ajaran: (r && r.tahun_ajaran) || ta(), program_id: g('program_id'), kegiatan: g('kegiatan_benahi').slice(0, 500), kegiatan_benahi: g('kegiatan_benahi'), akar_masalah: g('akar_masalah'), penjelasan: g('penjelasan'), butuh_biaya: g('butuh_biaya'), masalah_id: g('masalah_id'), penanggung_jawab: g('penanggung_jawab'), bulan_mulai: g('bulan_mulai'), bulan_selesai: g('bulan_selesai'), indikator: (r && r.indikator) || (ms ? ms.masalah : '') });
        if (!r) { baris.status = 'rencana'; baris.sumber_dana = 'BOSP'; baris.anggaran = 0; }
        const bt = e.currentTarget; bt.classList.add('load'); const s = await Store.save('Kegiatan_RKT', baris); bt.classList.remove('load');
        if (!s.success) { err.textContent = s.message; err.hidden = false; return; } toast('Baris RKT tersimpan.', 'ok'); m.close();
      };
    };
    const ringkas = () => { const l = keg(); return { n: l.length, ya: l.filter(k => k.butuh_biaya === 'ya').length, tdk: l.filter(k => k.butuh_biaya === 'tidak').length, blm: l.filter(k => !k.butuh_biaya).length }; };
    el.innerHTML = '<div class="toolbar">' + UI.searchBox('Cari kegiatan') + '<span class="muted sm" id="cn"></span>' + '<button class="btn" id="cx">' + ic('print') + 'Cetak</button>' + (can('Kegiatan_RKT', 'T') ? '<button class="btn p" id="nk">' + ic('add') + 'Tambah baris</button>' : '') + '</div><div id="rs"></div><div id="tbl"></div>';
    const rs = () => { const s = ringkas(); const e = $('#rs', el); if (e) e.innerHTML = '<div class="muted sm" style="margin-bottom:10px">TA ' + esc(ta()) + ' · ' + s.n + ' kegiatan · <b>' + s.ya + '</b> membutuhkan biaya (otomatis masuk Lembar Kerja ARKAS) · ' + s.tdk + ' tanpa biaya' + (s.blm ? ' · <b>' + s.blm + '</b> belum ditandai Ya/Tidak (data lama)' : '') + '</div>'; };
    rs();
    const dt = new DataTable($('#tbl', el), { rows: keg, per: 30, sort: { k: 'kegiatan_benahi', d: 1 }, onCount: n => { const c = $('#cn', el); if (c) c.textContent = n + ' baris'; },
      cols: [{ k: 'masalah_id', l: 'Identifikasi (indikator prioritas)', val: r => (msl(r.masalah_id) || {}).masalah || '', fmt: r => esc((msl(r.masalah_id) || {}).masalah || r.indikator || '—') },
        { k: 'akar_masalah', l: 'Akar masalah', fmt: r => esc(r.akar_masalah || '—') }, { k: 'kegiatan_benahi', l: 'Kegiatan benahi', val: r => r.kegiatan_benahi || r.kegiatan, fmt: r => '<b>' + esc(r.kegiatan_benahi || r.kegiatan) + '</b>' },
        { k: 'penjelasan', l: 'Penjelasan implementasi', fmt: r => esc(r.penjelasan || '') }, { k: 'butuh_biaya', l: 'Butuh biaya', fmt: r => r.butuh_biaya === 'ya' ? '<span class="pill hijau">Ya</span>' : r.butuh_biaya === 'tidak' ? '<span class="pill">Tidak</span>' : '<span class="pill kuning">Belum diisi</span>' }],
      empty: { ic: 'checklist', t: 'Belum ada baris Lembar Kerja RKT', s: 'Pilih masalah prioritas, lalu tambahkan kegiatan benahi.' },
      actions: r => (can('Kegiatan_RKT', 'U') ? UI.actBtn('e', 'edit', 'Ubah') : '') + (can('Kegiatan_RKT', 'H') ? UI.actBtn('h', 'delete', 'Hapus') : ''),
      onAct: async (a, id) => { const r = Store.byId('Kegiatan_RKT', id); if (a === 'e') form(r); if (a === 'h' && await UI.confirm({ text: 'Hapus kegiatan "' + (r.kegiatan_benahi || r.kegiatan) + '"?', danger: 1, ok: 'Hapus' })) { const x = await Store.remove('Kegiatan_RKT', id); toast(x.success ? 'Kegiatan dihapus.' : x.message, x.success ? 'ok' : 'bad'); } } });
    el._dt = dt; $('[data-q]', el).oninput = UI.debounce(e => dt.setQ(e.target.value), 120); if ($('#nk', el)) $('#nk', el).onclick = () => form(null);
    $('#cx', el).onclick = () => cetak('Lembar Kerja Rencana Kegiatan dan Anggaran Tahunan (RKT)', 'Tahun Ajaran ' + ta(), [{ l: 'No', w: '4%', h: r => r._no }, { l: 'Identifikasi (indikator prioritas)', h: r => esc((msl(r.masalah_id) || {}).masalah || r.indikator || '') }, { l: 'Akar masalah', k: 'akar_masalah' }, { l: 'Kegiatan benahi', h: r => esc(r.kegiatan_benahi || r.kegiatan) }, { l: 'Penjelasan implementasi', k: 'penjelasan' }, { l: 'Butuh biaya', w: '9%', h: r => r.butuh_biaya === 'ya' ? 'Ya' : r.butuh_biaya === 'tidak' ? 'Tidak' : '' }],
      keg().map((r, i) => Object.assign({ _no: i + 1 }, r)));
  };

  /* ================= LEMBAR KERJA ARKAS (sheet 4) ================= */
  const arkasTab = async (el, X) => {
    const kegYa = () => Store.rows('Kegiatan_RKT').filter(k => k.tahun_ajaran === ta() && k.butuh_biaya === 'ya').sort((a, b) => String(a.kegiatan_benahi || a.kegiatan).localeCompare(String(b.kegiatan_benahi || b.kegiatan)));
    const rin = (id) => Store.rows('Rincian_ARKAS').filter(r => r.kegiatan_id === id);
    const SAT = ['paket', 'orang', 'kegiatan', 'bulan', 'lembar', 'buah', 'unit', 'set', 'rim', 'jam', 'hari', 'kali', 'kg', 'meter'];
    const komponenAda = () => { const s = {}; Store.rows('Pagu_Anggaran').forEach(p => { s[p.komponen] = 1; }); Store.rows('Rincian_ARKAS').forEach(r => { if (r.komponen) s[r.komponen] = 1; }); return Object.keys(s); };
    let sm = null;
    const muatSm = async () => { const r = await API.read('arkas.ringkasan', { tahun_ajaran: ta() }); sm = r.success ? r.data : null; return r; };
    const segarkan = async () => { Store.invalidate('Kegiatan_RKT'); Store.load('Kegiatan_RKT', true); await muatSm(); if (el.isConnected) gambar(); };

    const formRincian = (keg, r) => {
      const v = r || { kegiatan_id: keg.id, jumlah: 1, harga_satuan: 0, satuan: 'paket', bulan: '7', kegiatan_arkas: '', komponen: '' };
      const m = UI.modal({ title: (r ? 'Ubah' : 'Tambah') + ' rincian ARKAS', size: 'lg', footer: '<button class="btn" data-n>Batal</button><button class="btn p" data-ok>Simpan</button>', body:
        '<div class="muted sm" style="margin-bottom:10px">Kegiatan: <b>' + esc(keg.kegiatan_benahi || keg.kegiatan) + '</b></div><form id="fr" novalidate><div class="fg">' +
        '<div class="f full"><label>Kegiatan ARKAS</label><input class="in" name="kegiatan_arkas" value="' + esc(v.kegiatan_arkas || '') + '" list="dl-ka" maxlength="300"><datalist id="dl-ka">' + [...new Set(Store.rows('Rincian_ARKAS').map(x => x.kegiatan_arkas).filter(Boolean))].map(x => '<option value="' + esc(x) + '">').join('') + '</datalist></div>' +
        '<div class="f full"><label>Uraian kegiatan ARKAS (barang / jasa) *</label><input class="in" name="uraian" value="' + esc(v.uraian || '') + '" maxlength="500"></div>' +
        '<div class="f"><label>Bulan dianggarkan</label><select class="in" name="bulan"><option value="">—</option>' + URUT.map(b => '<option value="' + b + '"' + (String(v.bulan) === String(b) ? ' selected' : '') + '>' + BLN[b - 1] + '</option>').join('') + '</select></div>' +
        '<div class="f"><label>Komponen / sumber</label><input class="in" name="komponen" value="' + esc(v.komponen || '') + '" list="dl-kp" maxlength="120"><datalist id="dl-kp">' + komponenAda().map(x => '<option value="' + esc(x) + '">').join('') + '</datalist></div>' +
        '<div class="f"><label>Jumlah *</label><input class="in" type="number" name="jumlah" min="0" step="any" value="' + esc(v.jumlah) + '"></div>' +
        '<div class="f"><label>Satuan</label><input class="in" name="satuan" value="' + esc(v.satuan || '') + '" list="dl-st" maxlength="40"><datalist id="dl-st">' + SAT.map(x => '<option value="' + x + '">').join('') + '</datalist></div>' +
        '<div class="f"><label>Harga satuan (Rp) *</label><input class="in" type="number" name="harga_satuan" min="0" step="any" value="' + esc(v.harga_satuan) + '"></div>' +
        '<div class="f"><label>Total (otomatis)</label><div class="in" id="tot" style="font-weight:700;background:var(--bg2,#f4f7fd)">' + rp(v.jumlah * v.harga_satuan) + '</div></div></div><div class="err" id="rerr" hidden style="margin-top:10px"></div></form>' });
      const f = (n) => m.$('[name="' + n + '"]'), hit = () => { m.$('#tot').textContent = rp((+f('jumlah').value || 0) * (+f('harga_satuan').value || 0)); };
      f('jumlah').oninput = hit; f('harga_satuan').oninput = hit; m.$('[data-n]').onclick = m.close;
      m.$('[data-ok]').onclick = async (e) => {
        const err = m.$('#rerr'); err.hidden = true; const j = +f('jumlah').value, h = +f('harga_satuan').value;
        if (!f('uraian').value.trim()) { err.textContent = 'Uraian wajib diisi.'; err.hidden = false; return; } if (!(j >= 0) || !(h >= 0) || f('jumlah').value === '' || f('harga_satuan').value === '') { err.textContent = 'Jumlah dan harga satuan harus angka 0 atau lebih.'; err.hidden = false; return; }
        const baris = Object.assign({}, r || {}, { kegiatan_id: keg.id, kegiatan_arkas: f('kegiatan_arkas').value.trim(), uraian: f('uraian').value.trim(), bulan: f('bulan').value, komponen: f('komponen').value.trim(), jumlah: j, satuan: f('satuan').value.trim(), harga_satuan: h, total: Math.round(j * h * 100) / 100 });
        const bt = e.currentTarget; bt.classList.add('load'); const s = await Store.save('Rincian_ARKAS', baris); bt.classList.remove('load');
        if (!s.success) { err.textContent = s.message; err.hidden = false; return; } toast('Rincian tersimpan.', 'ok'); m.close(); segarkan();
      };
    };
    const formPagu = (r) => UI.form({ title: r ? 'Ubah pagu' : 'Tambah pagu anggaran', vals: r || { tahun_ajaran: ta() }, fields: [
      { k: 'tahun_ajaran', l: 'Tahun ajaran', t: 'text', req: 1 }, { k: 'komponen', l: 'Komponen / sumber dana', t: 'text', req: 1, ph: 'mis. BOSP Reguler' }, { k: 'pagu', l: 'Pagu (Rp)', t: 'num', min: 0, step: 1000, req: 1 }, { k: 'catatan', l: 'Catatan', t: 'text', full: 1 }],
      onSubmit: async (x) => { const s = await Store.save('Pagu_Anggaran', Object.assign({}, r || {}, x, { pagu: +x.pagu || 0 })); if (s.success) { toast('Pagu tersimpan.', 'ok'); segarkan(); } return s; } });

    const gambar = () => {
      const kg = kegYa(), S = sm; let ring = '';
      if (S) {
        const stat = S.status === 'melebihi' ? '<div class="alert bad" style="margin:0 0 12px">' + ic('error') + '<span><b>Total anggaran melebihi pagu</b> sebesar <b>' + rp(Math.abs(S.selisih)) + '</b>. Kurangi rincian atau perbarui pagu sebelum diajukan.</span></div>' : S.status === 'aman' ? '<div class="alert ok" style="margin:0 0 12px">' + ic('check_circle') + '<span>Total anggaran dalam batas pagu. Sisa <b>' + rp(S.selisih) + '</b>.</span></div>' : (can('Pagu_Anggaran', 'L') ? '<div class="alert warn" style="margin:0 0 12px">' + ic('info') + '<span>Pagu belum diisi untuk TA ' + esc(ta()) + '.' + (can('Pagu_Anggaran', 'T') ? ' Klik <b>Atur pagu</b>.' : '') + '</span></div>' : '');
        ring = stat + '<div class="grid g4 keep2" style="margin-bottom:14px"><div class="card flat"><div class="kpi"><div><div class="v">' + rp(S.total) + '</div><div class="l">Total rincian</div></div></div></div>' + (can('Pagu_Anggaran', 'L') ? '<div class="card flat"><div class="kpi"><div><div class="v">' + (S.pagu_total ? rp(S.pagu_total) : '—') + '</div><div class="l">Pagu</div></div></div></div><div class="card flat"><div class="kpi"><div><div class="v" style="' + (S.status === 'melebihi' ? 'color:var(--red,#d93025)' : '') + '">' + (S.selisih === null ? '—' : (S.selisih < 0 ? '−' : '') + rp(Math.abs(S.selisih))) + '</div><div class="l">' + (S.selisih !== null && S.selisih < 0 ? 'Kelebihan' : 'Sisa pagu') + '</div></div></div></div>' : '') + '<div class="card flat"><div class="kpi"><div><div class="v">' + S.jumlah_rincian + '</div><div class="l">Baris rincian</div></div></div></div></div>' +
          (S.komponen.length ? '<div class="card" style="margin-bottom:14px"><div class="row between"><h3>Per komponen</h3>' + (can('Pagu_Anggaran', 'T') ? '<button class="btn sm" id="ap">' + ic('tune') + 'Atur pagu</button>' : '') + '</div><div class="tw"><table class="tbl rsp"><thead><tr><th>Komponen</th><th>Total rincian</th>' + (can('Pagu_Anggaran', 'L') ? '<th>Pagu</th><th>Selisih</th>' : '') + '</tr></thead><tbody>' + S.komponen.map(k => '<tr><td data-l="Komponen">' + esc(k.komponen) + '</td><td data-l="Total">' + rp(k.total) + '</td>' + (can('Pagu_Anggaran', 'L') ? '<td data-l="Pagu">' + (k.pagu === null ? '—' : rp(k.pagu)) + '</td><td data-l="Selisih">' + (k.selisih === null ? '—' : '<span class="pill ' + (k.status === 'melebihi' ? 'merah' : 'hijau') + '">' + (k.selisih < 0 ? '−' : '') + rp(Math.abs(k.selisih)) + '</span>') + '</td>' : '') + '</tr>').join('') + '</tbody></table></div></div>' : (can('Pagu_Anggaran', 'T') ? '<div class="row" style="margin-bottom:12px"><button class="btn sm" id="ap">' + ic('tune') + 'Atur pagu</button></div>' : '')) +
          '<div class="card" style="margin-bottom:14px"><h3>Ringkasan per bulan</h3><div class="tw"><table class="tbl"><thead><tr>' + URUT.map(b => '<th>' + UI.BLN3[b - 1] + '</th>').join('') + '<th>Tanpa bulan</th></tr></thead><tbody><tr>' + URUT.map(b => '<td>' + rp(S.per_bulan[String(b)] || 0) + '</td>').join('') + '<td>' + rp(S.per_bulan['0'] || 0) + '</td></tr></tbody></table></div></div>';
      }
      const blok = kg.length ? kg.map(k => { const rs = rin(k.id), tot = rs.reduce((a, r) => a + (+r.total || 0), 0); const ms = Store.byId('Masalah_Prioritas', k.masalah_id);
        return '<div class="card" style="margin-bottom:14px"><div class="row between wrap"><div><b>' + esc(k.kegiatan_benahi || k.kegiatan) + '</b>' + (ms ? '<div class="xs muted">' + esc(ms.masalah) + '</div>' : '') + (k.penjelasan ? '<div class="sm" style="margin-top:4px">' + esc(k.penjelasan) + '</div>' : '') + '</div><div class="row"><b>' + rp(tot) + '</b>' + (can('Rincian_ARKAS', 'T') ? '<button class="btn sm p" data-add="' + esc(k.id) + '">' + ic('add') + 'Tambah rincian</button>' : '') + '</div></div>' +
          (rs.length ? '<div class="tw" style="margin-top:10px"><table class="tbl rsp"><thead><tr><th>Kegiatan ARKAS</th><th>Uraian</th><th>Bulan</th><th>Jumlah</th><th>Satuan</th><th>Harga satuan</th><th>Total</th><th></th></tr></thead><tbody>' + rs.map(r => '<tr style="' + (r._pending ? 'opacity:.55' : '') + '"><td data-l="Kegiatan ARKAS">' + esc(r.kegiatan_arkas || '') + '</td><td data-l="Uraian">' + esc(r.uraian) + '</td><td data-l="Bulan">' + esc(r.bulan ? BLN[r.bulan - 1] : '') + '</td><td data-l="Jumlah">' + esc(r.jumlah) + '</td><td data-l="Satuan">' + esc(r.satuan || '') + '</td><td data-l="Harga">' + rp(r.harga_satuan) + '</td><td data-l="Total"><b>' + rp(r.total) + '</b></td><td>' + (can('Rincian_ARKAS', 'U') ? '<button class="iconbtn" data-ed="' + esc(r.id) + '" aria-label="Ubah">' + ic('edit') + '</button>' : '') + (can('Rincian_ARKAS', 'H') ? '<button class="iconbtn" data-del="' + esc(r.id) + '" aria-label="Hapus">' + ic('delete') + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="muted sm" style="margin-top:8px">Belum ada rincian anggaran.</div>') + '</div>'; }).join('') :
        '<div class="card">' + UI.emptyBox('payments', 'Belum ada kegiatan yang membutuhkan biaya', 'Di Lembar Kerja RKT, tandai kegiatan dengan "Butuh biaya: Ya" — otomatis muncul di sini.') + '</div>';
      el.innerHTML = '<div class="toolbar"><span class="muted sm">TA ' + esc(ta()) + '</span><span style="flex:1"></span><button class="btn" id="cx">' + ic('print') + 'Cetak</button></div>' + ring + blok;
      $$('[data-add]', el).forEach(b => b.onclick = () => formRincian(Store.byId('Kegiatan_RKT', b.dataset.add)));
      $$('[data-ed]', el).forEach(b => b.onclick = () => { const r = Store.byId('Rincian_ARKAS', b.dataset.ed); formRincian(Store.byId('Kegiatan_RKT', r.kegiatan_id), r); });
      $$('[data-del]', el).forEach(b => b.onclick = async () => { const r = Store.byId('Rincian_ARKAS', b.dataset.del); if (!await UI.confirm({ text: 'Hapus rincian "' + r.uraian + '"?', danger: 1, ok: 'Hapus' })) return; const x = await Store.remove('Rincian_ARKAS', r.id); toast(x.success ? 'Rincian dihapus.' : x.message, x.success ? 'ok' : 'bad'); if (x.success) segarkan(); });
      if ($('#ap', el)) $('#ap', el).onclick = () => aturPagu();
      $('#cx', el).onclick = () => { const baris = []; let no = 0; kg.forEach(k => { const rs = rin(k.id); baris.push({ _grup: '<b>' + esc(k.kegiatan_benahi || k.kegiatan) + '</b>' + (k.penjelasan ? ' — ' + esc(k.penjelasan) : '') }); rs.forEach(r => baris.push(Object.assign({ _no: ++no }, r))); });
        if (S) baris.push({ _grup: '<b>TOTAL ' + rp(S.total) + '</b>' + (S.pagu_total ? ' · Pagu ' + rp(S.pagu_total) + ' · ' + (S.selisih < 0 ? 'Kelebihan ' : 'Sisa ') + rp(Math.abs(S.selisih)) : '') });
        cetak('Lembar Kerja ARKAS', 'Tahun Ajaran ' + ta(), [{ l: 'No', w: '4%', h: r => r._no }, { l: 'Kegiatan ARKAS', k: 'kegiatan_arkas' }, { l: 'Uraian', k: 'uraian' }, { l: 'Bulan', w: '8%', h: r => esc(r.bulan ? BLN[r.bulan - 1] : '') }, { l: 'Jumlah', w: '7%', r: 1, k: 'jumlah' }, { l: 'Satuan', w: '8%', k: 'satuan' }, { l: 'Harga satuan', w: '11%', r: 1, h: r => rp(r.harga_satuan) }, { l: 'Total', w: '11%', r: 1, h: r => rp(r.total) }], baris); };
    };
    const aturPagu = () => {
      const m = UI.modal({ title: 'Pagu anggaran TA ' + ta(), size: 'lg', footer: '<button class="btn" data-c>Tutup</button>', body: '<div id="pg"></div>' });
      m.$('[data-c]').onclick = m.close;
      const dg = () => { const l = Store.rows('Pagu_Anggaran').filter(p => p.tahun_ajaran === ta()); m.$('#pg').innerHTML = '<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn p" id="pa">' + ic('add') + 'Tambah pagu</button></div>' + (l.length ? '<div class="tw"><table class="tbl rsp"><thead><tr><th>Komponen</th><th>Pagu</th><th>Catatan</th><th></th></tr></thead><tbody>' + l.map(p => '<tr><td data-l="Komponen">' + esc(p.komponen) + '</td><td data-l="Pagu">' + rp(p.pagu) + '</td><td data-l="Catatan">' + esc(p.catatan || '') + '</td><td>' + (can('Pagu_Anggaran', 'U') ? '<button class="iconbtn" data-pe="' + esc(p.id) + '">' + ic('edit') + '</button>' : '') + (can('Pagu_Anggaran', 'H') ? '<button class="iconbtn" data-pd="' + esc(p.id) + '">' + ic('delete') + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="muted sm">Belum ada pagu.</div>');
        m.$('#pa').onclick = () => formPagu(null); $$('[data-pe]', m.$('#pg')).forEach(b => b.onclick = () => formPagu(Store.byId('Pagu_Anggaran', b.dataset.pe)));
        $$('[data-pd]', m.$('#pg')).forEach(b => b.onclick = async () => { if (await UI.confirm({ text: 'Hapus pagu ini?', danger: 1, ok: 'Hapus' })) { const x = await Store.remove('Pagu_Anggaran', b.dataset.pd); toast(x.success ? 'Pagu dihapus.' : x.message, x.success ? 'ok' : 'bad'); if (x.success) segarkan(); } }); };
      dg(); const off = Store.on('t:Pagu_Anggaran', () => { if (document.body.contains(m.$('#pg'))) dg(); else off && off(); });
    };
    el.innerHTML = '<div class="sk" style="height:180px"></div>';
    await Store.loadMany(['Kegiatan_RKT', 'Rincian_ARKAS', 'Pagu_Anggaran', 'Masalah_Prioritas']); await muatSm(); if (!el.isConnected) return; gambar();
  };

  /* ================= daftar tab tambahan ================= */
  window.PAGES_EXTRA = window.PAGES_EXTRA || {};
  window.PAGES_EXTRA.rapor = [
    { k: 'rekom', l: 'Rekomendasi', need: () => can('Rapor_Indikator', 'L') && can('Katalog_Rekomendasi', 'L') && !!Store.can('Katalog_Rekomendasi', 'L') && ['admin', 'kepsek', 'wakasek'].indexOf(Store.user.peran) > -1, draw: rekomTab('semua') },
    { k: 'prioritas', l: 'Prioritas', need: () => can('Rapor_Indikator', 'L') && can('Katalog_Rekomendasi', 'L') && ['admin', 'kepsek', 'wakasek'].indexOf(Store.user.peran) > -1, draw: rekomTab('prioritas') }];
  window.PAGES_EXTRA.rencana = [
    { k: 'lkrkt', l: 'Lembar Kerja RKT', need: () => can('Kegiatan_RKT', 'L'), draw: rktTab },
    { k: 'arkas', l: 'Lembar Kerja ARKAS', need: () => can('Rincian_ARKAS', 'L'), draw: arkasTab }];
})();
