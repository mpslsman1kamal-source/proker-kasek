/* SIPERENCANA — ui.js: komponen bersama (escape, toast, modal, form, tabel, grafik). Semua data pengguna di-escape. */
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], BLN3 = BLN.map(b => b.slice(0, 3));
  const tgl = (s) => { if (!/^\d{4}-\d{2}-\d{2}/.test(s || '')) return s || '—'; const p = s.slice(0, 10).split('-'); return +p[2] + ' ' + BLN3[+p[1] - 1] + ' ' + p[0]; };
  const tglPanjang = (s) => { if (!/^\d{4}-\d{2}-\d{2}/.test(s || '')) return s || '—'; const p = s.slice(0, 10).split('-'); const d = new Date(+p[0], +p[1] - 1, +p[2]); return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()] + ', ' + +p[2] + ' ' + BLN[+p[1] - 1] + ' ' + p[0]; };
  const rp = (n) => 'Rp' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rpS = (n) => { n = Number(n) || 0; return n >= 1e9 ? 'Rp ' + (n / 1e9).toFixed(1).replace('.', ',') + ' M' : n >= 1e6 ? 'Rp ' + (n / 1e6).toFixed(1).replace('.', ',') + ' jt' : rp(n); };
  const num = (n, d) => (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 1 : d });
  const hari = () => { const d = new Date(Date.now() + 7 * 3600e3 - (new Date().getTimezoneOffset() + 420) * 0 ); const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const debounce = (f, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => f.apply(c, a), ms); }; };
  const ic = (n, cls) => '<span class="mi ' + (cls || '') + '" aria-hidden="true">' + n + '</span>';
  const kat = (skor) => { const m = +(Store.set.AMBANG_RAPOR_MERAH || 50), h = +(Store.set.AMBANG_RAPOR_HIJAU || 75); return skor < m ? 'merah' : skor < h ? 'kuning' : 'hijau'; };
  const katMonev = (p) => { const m = +(Store.set.AMBANG_MONEV_MERAH || 70), h = +(Store.set.AMBANG_MONEV_HIJAU || 90); return p < m ? 'merah' : p < h ? 'kuning' : 'hijau'; };
  const KAT_L = { merah: 'Kritis', kuning: 'Perlu perhatian', hijau: 'Baik' };
  const pillKat = (k) => '<span class="pill ' + k + '"><span class="dot"></span>' + KAT_L[k] + '</span>';

  /* ---- toast ---- */
  function toast(msg, tipe) {
    let w = $('#toasts'); if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast ' + (tipe || ''); t.innerHTML = ic(tipe === 'bad' ? 'error' : tipe === 'ok' ? 'check_circle' : 'info') + '<span>' + esc(msg) + '</span>';
    w.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, tipe === 'bad' ? 6000 : 3200);
  }
  /* ---- modal ---- */
  function modal(o) {
    const ov = document.createElement('div'); ov.className = 'ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="dlg ' + (o.size === 'lg' ? 'wide' : (o.size || '')) + '"><header><h3>' + esc(o.title) + '</h3><button class="iconbtn" data-x aria-label="Tutup">' + ic('close') + '</button></header><div class="bd">' + (o.body || '') + '</div>' + (o.footer === false ? '' : '<footer>' + (o.footer || '') + '</footer>') + '</div>';
    const prev = document.activeElement;
    const close = () => { ov.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) try { prev.focus(); } catch (e) { } if (o.onClose) o.onClose(); };
    const key = (e) => { if (e.key === 'Escape' && !o.noEsc) close(); };
    ov.addEventListener('mousedown', e => { if (e.target === ov && !o.noEsc) close(); }); $('[data-x]', ov).onclick = close; document.addEventListener('keydown', key);
    document.body.appendChild(ov); const f = $('input,select,textarea', ov); if (f && !o.noFocus) f.focus(); else { const b = $('button.p', ov); if (b) b.focus(); }
    return { el: ov, close, $: (s) => $(s, ov), $$: (s) => $$(s, ov) };
  }
  function confirmBox(o) {
    return new Promise(res => {
      const m = modal({ title: o.title || 'Konfirmasi', size: 'sm', body: '<p>' + (o.html || esc(o.text || '')) + '</p>' + (o.input ? '<div class="f" style="margin-top:12px"><label>' + esc(o.input) + '</label><input class="in" id="cf-in" autocomplete="off"></div>' : ''),
        footer: '<button class="btn" data-n>Batal</button><button class="btn ' + (o.danger ? 'd' : 'p') + '" data-y>' + esc(o.ok || 'Ya, lanjutkan') + '</button>', onClose: () => res(false) });
      m.$('[data-n]').onclick = () => m.close();
      m.$('[data-y]').onclick = () => { const v = o.input ? m.$('#cf-in').value : true; if (o.input && !v) { m.$('#cf-in').classList.add('bad'); return; } res(v); m.el.remove(); };
    });
  }
  /* ---- form ---- */
  function fieldHtml(f, v, vals) {
    const id = 'f_' + f.k, val = v == null ? '' : v, req = f.req ? ' required' : '', reqMark = f.req ? ' <span style="color:var(--bad)">*</span>' : '';
    let inp = '';
    if (f.t === 'area') inp = '<textarea class="in" id="' + id + '" name="' + f.k + '" rows="' + (f.rows || 3) + '"' + req + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '>' + esc(val) + '</textarea>';
    else if (f.t === 'sel' || f.t === 'user' || f.t === 'ref') {
      let opts = f.opts || [];
      if (f.t === 'user') opts = Store.users.filter(u => !f.peran || f.peran.indexOf(u.peran) > -1).map(u => [u.id, u.nama + (u.jabatan ? ' — ' + u.jabatan : '')]);
      if (f.t === 'ref') opts = Store.rows(f.table).map(r => [r.id, f.lbl(r)]);
      inp = '<select class="in" id="' + id + '" name="' + f.k + '"' + req + '><option value="">' + esc(f.ph || '— Pilih —') + '</option>' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
    }
    else if (f.t === 'sw') return '<div class="f ' + (f.full ? 'full' : '') + '"><label class="row" style="justify-content:space-between"><span>' + esc(f.l) + '</span><span class="sw"><input type="checkbox" id="' + id + '" name="' + f.k + '"' + (val === true || val === 'YA' ? ' checked' : '') + '><i></i></span></label>' + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
    else inp = '<input class="in" id="' + id + '" name="' + f.k + '" type="' + ({ num: 'number', date: 'date', time: 'time', url: 'url', email: 'email', pass: 'password' }[f.t] || 'text') + '" value="' + esc(val) + '"' + req +
      (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.t === 'num' ? ' step="' + (f.step || 'any') + '" inputmode="decimal"' : '') + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.t === 'pass' ? ' autocomplete="new-password"' : ' autocomplete="off"') + '>';
    return '<div class="f ' + (f.full || f.t === 'area' ? 'full' : '') + '" data-f="' + f.k + '"><label for="' + id + '">' + esc(f.l) + reqMark + '</label>' + inp + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '<div class="err" hidden></div></div>';
  }
  function readForm(root, fields) {
    const o = {};
    fields.forEach(f => { const el = $('[name="' + f.k + '"]', root); if (!el) return; o[f.k] = f.t === 'sw' ? el.checked : f.t === 'num' ? (el.value === '' ? '' : Number(el.value)) : String(el.value).trim(); });
    return o;
  }
  function validate(root, fields, vals) {
    let ok = true;
    $$('.err', root).forEach(e => { e.hidden = true; }); $$('.in.bad', root).forEach(e => e.classList.remove('bad'));
    fields.forEach(f => {
      const box = $('[data-f="' + f.k + '"]', root); if (!box) return; const v = vals[f.k]; let msg = '';
      if (f.req && (v === '' || v == null)) msg = f.l + ' wajib diisi.';
      else if (f.t === 'num' && v !== '' && (isNaN(v) || (f.min != null && v < f.min) || (f.max != null && v > f.max))) msg = f.l + ' harus ' + (f.min != null && f.max != null ? 'antara ' + f.min + ' dan ' + f.max : 'berupa angka') + '.';
      else if (f.t === 'url' && v && !/^https:\/\/\S+$/i.test(v)) msg = 'Tautan harus diawali https://';
      if (msg) { ok = false; const e = $('.err', box); e.textContent = msg; e.hidden = false; $('.in', box).classList.add('bad'); }
    });
    if (!ok) { const b = $('.in.bad', root); if (b) b.focus(); }
    return ok;
  }
  /** Form modal. onSubmit(vals) → {success, message}; modal menutup bila sukses. */
  function form(o) {
    const vals = o.vals || {}, vis = (f) => !f.show || f.show(vals);
    const m = modal({ title: o.title, size: o.size, body: '<form id="frm" novalidate><div class="fg">' + o.fields.map(f => fieldHtml(f, vals[f.k], vals)).join('') + '</div>' + (o.extra || '') + '<div class="err" id="frm-err" style="margin-top:10px" hidden></div></form>',
      footer: '<button class="btn" type="button" data-n>Batal</button><button class="btn p" type="button" data-ok>' + esc(o.ok || 'Simpan') + '</button>' });
    const frm = m.$('#frm');
    const apply = () => { const cur = readForm(frm, o.fields); o.fields.forEach(f => { const b = $('[data-f="' + f.k + '"]', frm) || (f.t === 'sw' ? $('#f_' + f.k, frm) : null); if (b && f.show) (b.closest('.f') || b).hidden = !f.show(cur); }); };
    frm.addEventListener('input', apply); frm.addEventListener('change', apply); apply();
    m.$('[data-n]').onclick = m.close;
    const submit = async () => {
      const act = o.fields.filter(f => { const b = (frm.querySelector('[name="' + f.k + '"]') || {}).closest && frm.querySelector('[name="' + f.k + '"]').closest('.f'); return !b || !b.hidden; });
      const v = Object.assign({}, vals, readForm(frm, o.fields));
      if (!validate(frm, act, v)) return;
      const btn = m.$('[data-ok]'); btn.classList.add('load'); btn.disabled = true; const er = m.$('#frm-err'); er.hidden = true;
      let r; try { r = await o.onSubmit(v); } catch (e) { r = { success: false, message: 'Terjadi kesalahan.' }; }
      btn.classList.remove('load'); btn.disabled = false;
      if (r && r.success !== false) m.close(); else { er.textContent = (r && r.message) || 'Gagal menyimpan.'; er.hidden = false; }
    };
    m.$('[data-ok]').onclick = submit; frm.addEventListener('submit', e => { e.preventDefault(); submit(); });
    return m;
  }
  /* ---- tabel data (cari, urut, halaman, kartu di HP) ---- */
  class DataTable {
    constructor(root, o) { this.root = root; this.o = o; this.q = ''; this.sort = o.sort || null; this.page = 1; this.per = o.per || 25; this.filter = null; this.draw(); }
    rows() { let r = this.o.rows(); if (this.filter) r = r.filter(this.filter); if (this.q) { const q = this.q.toLowerCase(); r = r.filter(x => this.o.cols.some(c => String(c.txt ? c.txt(x) : x[c.k]).toLowerCase().indexOf(q) > -1)); }
      if (this.sort) { const c = this.o.cols.find(x => x.k === this.sort.k), dir = this.sort.d; const val = (x) => c.val ? c.val(x) : x[c.k]; r = r.slice().sort((a, b) => { const A = val(a), B = val(b); return (A > B ? 1 : A < B ? -1 : 0) * dir; }); } return r; }
    draw() {
      const o = this.o, all = this.rows(), shown = all.slice(0, this.page * this.per);
      const head = o.cols.map(c => '<th class="' + (c.sort !== false ? 's' : '') + '" data-k="' + c.k + '" ' + (this.sort && this.sort.k === c.k ? 'aria-sort="' + (this.sort.d > 0 ? 'ascending' : 'descending') + '"' : '') + '>' + esc(c.l) + (this.sort && this.sort.k === c.k ? (this.sort.d > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('') + (o.actions ? '<th></th>' : '');
      const body = shown.map(r => '<tr data-id="' + esc(r.id) + '" class="' + (o.onRow ? 'klik' : '') + '" style="' + (r._pending ? 'opacity:.55' : '') + '">' + o.cols.map(c => '<td data-l="' + esc(c.l) + '" class="' + (c.cls || '') + '">' + (c.fmt ? c.fmt(r) : esc(r[c.k] == null || r[c.k] === '' ? '—' : r[c.k])) + '</td>').join('') + (o.actions ? '<td class="act nowrap">' + o.actions(r) + '</td>' : '') + '</tr>').join('');
      const e = o.empty || {};
      this.root.innerHTML = '<div class="tw"><table class="tbl rsp"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>' +
        (all.length ? '' : '<div class="empty">' + ic(e.ic || 'inbox') + '<b>' + esc(this.q ? 'Tidak ada hasil untuk "' + this.q + '"' : e.t || 'Belum ada data') + '</b><span>' + esc(this.q ? 'Coba kata kunci lain.' : e.s || '') + '</span>' + (e.btn || '') + '</div>') + '</div>' +
        (all.length > shown.length ? '<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-more>Tampilkan lebih banyak (' + (all.length - shown.length) + ')</button></div>' : '');
      this.count = all.length; if (o.onCount) o.onCount(all.length);
      if (!this._b) { this._b = 1; this.root.addEventListener('click', ev => {
        const th = ev.target.closest('th.s'); if (th) { const k = th.dataset.k; this.sort = this.sort && this.sort.k === k ? { k, d: -this.sort.d } : { k, d: 1 }; this.page = 1; this.draw(); return; }
        if (ev.target.closest('[data-more]')) { this.page++; this.draw(); return; }
        const a = ev.target.closest('[data-act]'); if (a) { ev.stopPropagation(); const tr = a.closest('tr'); o.onAct && o.onAct(a.dataset.act, tr ? tr.dataset.id : null, a); return; }
        const tr = ev.target.closest('tbody tr'); if (tr && o.onRow) o.onRow(tr.dataset.id);
      }); }
    }
    setQ(q) { this.q = q; this.page = 1; this.draw(); }
    refresh() { this.draw(); }
  }
  const searchBox = (ph) => '<div class="search">' + ic('search') + '<input class="in" type="search" data-q placeholder="' + esc(ph || 'Cari…') + '" aria-label="Cari"></div>';
  const emptyBox = (icon, t, s, btn) => '<div class="empty">' + ic(icon) + '<b>' + esc(t) + '</b><span>' + esc(s || '') + '</span>' + (btn || '') + '</div>';
  const actBtn = (act, icon, label, cls) => '<button class="btn sm ' + (cls || 'g') + '" data-act="' + act + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + ic(icon) + '</button>';

  /* ---- grafik SVG ringan ---- */
  const WARNA = { merah: '#E5484D', kuning: '#F5A524', hijau: '#2DBE7B', biru: '#2457E6', teal: '#12B5A6', ungu: '#7C5CFC' };
  function donut(parts, size) {
    size = size || 150; const tot = parts.reduce((s, p) => s + p.v, 0) || 1, r = size / 2 - 12, c = 2 * Math.PI * r; let off = 0;
    const arcs = parts.filter(p => p.v > 0).map(p => { const len = p.v / tot * c, s = '<circle r="' + r + '" cx="' + size / 2 + '" cy="' + size / 2 + '" fill="none" stroke="' + p.c + '" stroke-width="18" stroke-dasharray="' + len + ' ' + (c - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"></circle>'; off += len; return s; }).join('');
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + esc(parts.map(p => p.l + ' ' + p.v).join(', ')) + '"><circle r="' + r + '" cx="' + size / 2 + '" cy="' + size / 2 + '" fill="none" stroke="#E9EEF9" stroke-width="18"></circle>' + arcs + '</svg>';
  }
  function hbars(items, max) {
    max = max || Math.max.apply(null, items.map(i => i.v).concat([1]));
    return items.map(i => '<div style="margin-bottom:10px"><div class="row between sm"><span class="b">' + esc(i.l) + '</span><span class="b">' + esc(i.t != null ? i.t : num(i.v)) + '</span></div><div class="bar ' + (i.k || '') + '"><i style="width:' + Math.min(100, i.v / max * 100) + '%;' + (i.c ? 'background:' + i.c : '') + '"></i></div></div>').join('');
  }
  function line(points, o) {
    o = o || {}; const W = o.w || 420, H = o.h || 160, p = 28; if (!points.length) return '';
    const max = o.max || Math.max.apply(null, points.map(x => x.v).concat([1])), min = o.min || 0, step = points.length > 1 ? (W - 2 * p) / (points.length - 1) : 0;
    const xy = points.map((q, i) => [p + i * step, H - p - (q.v - min) / (max - min || 1) * (H - 2 * p)]);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" role="img" aria-label="Grafik tren"><polyline fill="none" stroke="' + (o.c || '#2457E6') + '" stroke-width="3" stroke-linejoin="round" points="' + xy.map(a => a.join(',')).join(' ') + '"></polyline>' +
      xy.map((a, i) => '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="4.5" fill="#fff" stroke="' + (o.c || '#2457E6') + '" stroke-width="2.5"></circle><text x="' + a[0] + '" y="' + (a[1] - 10) + '" font-size="11" font-weight="700" text-anchor="middle" fill="#1B2540">' + num(points[i].v) + '</text><text x="' + a[0] + '" y="' + (H - 8) + '" font-size="10.5" text-anchor="middle" fill="#5B6B88">' + esc(points[i].l) + '</text>').join('') + '</svg>';
  }
  /* ---- berkas ---- */
  const b64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
  function saveBlob(nama, mime, b64s) { const bin = atob(b64s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const url = URL.createObjectURL(new Blob([u], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
  /** Unggah berkas (langsung ≤3 MB, bertahap bila lebih). Mengembalikan {url,id,nama}. */
  async function unggah(file, tujuan, onProg) {
    if (file.size > 10 * 1024 * 1024) return { success: false, message: 'Ukuran berkas maksimal 10 MB.' };
    const data = await b64(file);
    if (file.size <= 3 * 1024 * 1024) { onProg && onProg(40); const r = await API.write('file.unggah', { nama: file.name, b64: data, tujuan }); onProg && onProg(100); return r; }
    const CH = 90000, n = Math.ceil(data.length / CH), m = await API.read('file.mulai', { nama: file.name, ukuran: file.size, jumlah: n, tujuan });
    if (!m.success) return m;
    const id = m.data.uploadId; let done = 0, gagal = null;
    const kirim = async (i) => { for (let t = 0; t < 3; t++) { const r = await API.read('file.chunk', { uploadId: id, idx: i, b64: data.slice(i * CH, (i + 1) * CH) }); if (r.success) { done++; onProg && onProg(Math.round(done / n * 95)); return; } gagal = r; } };
    const q = Array.from({ length: n }, (_, i) => i); await Promise.all([0, 1, 2, 3].map(async () => { while (q.length) await kirim(q.shift()); }));
    if (done < n) return gagal || { success: false, message: 'Unggah gagal.' };
    return API.write('file.selesai', { uploadId: id });
  }
  async function unduh(idOrUrl, namaCadangan) {
    toast('Menyiapkan berkas…'); const r = await API.read('file.unduh', { id: idOrUrl });
    if (!r.success) { if (r.code === 'LUAR' && /^https:/.test(idOrUrl)) window.open(idOrUrl, '_blank', 'noopener'); else toast(r.message, 'bad'); return; }
    saveBlob(r.data.nama || namaCadangan || 'berkas', r.data.mime, r.data.b64);
  }
  window.UI = { esc, $, $$, tgl, tglPanjang, rp, rpS, num, hari, debounce, ic, kat, katMonev, KAT_L, pillKat, toast, modal, confirm: confirmBox, form, fieldHtml, DataTable, searchBox, emptyBox, actBtn, donut, hbars, line, WARNA, b64, saveBlob, unggah, unduh, BLN, BLN3 };
})();
