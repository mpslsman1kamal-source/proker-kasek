/* SIPERENCANA — app.js: shell, router hash, login (sandi + Google), boot tunggal, navigasi, prefetch. */
(function () {
  const { esc, $, $$, ic, toast, modal } = UI;
  const PAGES = window.PAGES = {};
  const GRUP = [
    ['Perencanaan & Evaluasi', ['dashboard', 'rapor', 'keputusan', 'rencana']],
    ['Kependidikan & Guru', ['supervisi', 'kompetensi']],
    ['Monitoring & Evaluasi', ['monev', 'rapat']],
    ['Tata Usaha & Sistem', ['surat', 'komunikasi', 'pustaka', 'pengaturan']]
  ];
  let cur = null, offs = [], info = {};
  const root = () => $('#app');
  const ok = (n) => { const p = PAGES[n]; return p && (!p.need || p.need()); };
  const navList = () => Object.keys(PAGES).filter(ok);

  /* ---------- login ---------- */
  function loginView(pesan) {
    const nama = info.nama_sekolah || 'SMAN 1 KAMAL BANGKALAN';
    root().innerHTML = '<div class="lg"><div class="hero"><div class="row"><span class="logo" style="background:rgba(255,255,255,.2)">' + ic('school') + '</span><b style="font-size:20px">SIPERENCANA</b></div><div><h1>Sistem Informasi Perencanaan Sekolah</h1><ul>' +
      ['Rapor Pendidikan → keputusan → RKJM &amp; RKT dalam satu alur', 'Supervisi, monev, dan tindak lanjut yang terhubung', 'Surat, rapat, dan pengumuman WhatsApp terpusat'].map(t => '<li>' + ic('check_circle') + '<span>' + t + '</span></li>').join('') + '</ul></div><div class="sm" style="opacity:.85">' + esc(nama) + '</div></div>' +
      '<div class="fm"><div class="box"><div class="row" style="margin-bottom:22px"><span class="logo">' + ic('school') + '</span><div><h2>Masuk</h2><div class="muted sm">' + esc(nama) + '</div></div></div>' +
      (pesan ? '<div class="alert warn" role="alert" style="margin-bottom:14px">' + ic('info') + '<span>' + esc(pesan) + '</span></div>' : '') +
      '<form id="lf" class="col" novalidate><div class="f"><label for="lu">Username</label><input class="in" id="lu" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>' +
      '<div class="f"><label for="lp">Kata sandi</label><div class="pw"><input class="in" id="lp" type="password" autocomplete="current-password" required><button type="button" class="iconbtn" id="lv" aria-label="Tampilkan kata sandi">' + ic('visibility') + '</button></div></div>' +
      '<div class="err" id="le" role="alert" hidden></div><button class="btn p" id="lb" type="submit" style="width:100%">Masuk</button></form>' +
      '<div id="gwrap" hidden><div class="or">atau</div><div id="gbtn" style="display:flex;justify-content:center"></div></div>' +
      '<p class="muted xs" style="margin-top:22px;text-align:center">Lupa kata sandi? Hubungi Admin sekolah.</p></div></div></div>';
    const f = $('#lf'), err = $('#le');
    $('#lv').onclick = () => { const i = $('#lp'); i.type = i.type === 'password' ? 'text' : 'password'; };
    f.onsubmit = async (e) => {
      e.preventDefault(); const u = $('#lu').value.trim(), p = $('#lp').value; err.hidden = true;
      if (!u || !p) { err.textContent = 'Username dan kata sandi wajib diisi.'; err.hidden = false; return; }
      const b = $('#lb'); b.classList.add('load'); b.disabled = true;
      const r = await API.read('auth.login', { username: u, sandi: p }, { retry: 1 });
      b.classList.remove('load'); b.disabled = false;
      if (!r.success) { err.textContent = r.message; err.hidden = false; $('#lp').value = ''; $('#lp').focus(); return; }
      API.setToken(r.data.token);
      r.data.wajib_ganti ? gantiSandiView(r.data.user, true) : start();
    };
    $('#lu').focus(); initGoogle();
  }
  function initGoogle() {
    if (!info.google_aktif || !info.google_client_id) return;
    const pasang = () => {
      if (!window.google || !google.accounts) return;
      google.accounts.id.initialize({ client_id: info.google_client_id, callback: async (resp) => {
        const r = await API.read('auth.google', { idToken: resp.credential }, { retry: 1 });
        if (!r.success) { const e = $('#le'); if (e) { e.textContent = r.message; e.hidden = false; } return; }
        API.setToken(r.data.token); start();
      } });
      const el = $('#gbtn'); if (el) { google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 320, locale: 'id' }); $('#gwrap').hidden = false; }
    };
    if (window.google && google.accounts) return pasang();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = pasang; document.head.appendChild(s);
  }
  function gantiSandiView(user, wajib) {
    root().innerHTML = '<div class="lg" style="grid-template-columns:1fr"><div class="fm"><div class="box"><div class="row" style="margin-bottom:18px"><span class="logo" style="background:var(--teal)">' + ic('lock_reset') + '</span><div><h2>Buat kata sandi baru</h2><div class="muted sm">' + esc(user.nama) + '</div></div></div>' +
      '<div class="alert" style="margin-bottom:14px">' + ic('shield') + '<span>Demi keamanan, ganti kata sandi sementara Anda. Minimal 8 karakter, memuat huruf dan angka.</span></div>' +
      '<form id="gf" class="col" novalidate><div class="f"><label for="g0">Kata sandi saat ini</label><input class="in" id="g0" type="password" autocomplete="current-password"></div>' +
      '<div class="f"><label for="g1">Kata sandi baru</label><input class="in" id="g1" type="password" autocomplete="new-password"><div class="bar" style="margin-top:6px"><i id="gk" style="width:0"></i></div><div class="hint" id="gt">Kekuatan: —</div></div>' +
      '<div class="f"><label for="g2">Ulangi kata sandi baru</label><input class="in" id="g2" type="password" autocomplete="new-password"></div><div class="err" id="ge" role="alert" hidden></div>' +
      '<button class="btn p" id="gb" type="submit">Simpan &amp; masuk</button>' + (wajib ? '<button class="btn g" type="button" id="gx">Keluar</button>' : '') + '</form></div></div></div>';
    const kuat = (p) => { let s = 0; if (p.length >= 8) s++; if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++; if (p.length >= 12) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
    $('#g1').oninput = () => { const s = kuat($('#g1').value); $('#gk').style.width = s * 25 + '%'; $('#gk').parentNode.className = 'bar ' + (s < 2 ? 'merah' : s < 3 ? 'kuning' : 'hijau'); $('#gt').textContent = 'Kekuatan: ' + ['—', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][s]; };
    if ($('#gx')) $('#gx').onclick = () => { API.setToken(null); loginView(); };
    $('#gf').onsubmit = async (e) => {
      e.preventDefault(); const er = $('#ge'); er.hidden = true;
      const a = $('#g0').value, b = $('#g1').value, c = $('#g2').value;
      if (b !== c) { er.textContent = 'Ulangi kata sandi tidak sama.'; er.hidden = false; return; }
      const btn = $('#gb'); btn.classList.add('load'); btn.disabled = true;
      const r = await API.write('auth.gantiSandi', { sandiLama: a, sandiBaru: b }); btn.classList.remove('load'); btn.disabled = false;
      if (!r.success) { er.textContent = r.message; er.hidden = false; return; }
      API.setToken(r.data.token); toast('Kata sandi diperbarui.', 'ok'); start();
    };
    $('#g0').focus();
  }

  /* ---------- shell ---------- */
  function initials(n) { return String(n || '?').replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?'; }
  const ROLE_L = { admin: 'Administrator', kepsek: 'Kepala Sekolah', wakasek: 'Wakil Kepala Sekolah', guru: 'Guru', pengamat: 'Pengamat' };
  function shell() {
    const u = Store.user, list = navList(), nama = Store.set.NAMA_SEKOLAH || '';
    const nav = GRUP.map(g => { const it = g[1].filter(n => list.indexOf(n) > -1); if (!it.length) return ''; return '<div class="grp">' + esc(g[0]) + '</div>' + it.map(n => { const p = PAGES[n]; return '<a href="#/' + n + '" data-n="' + n + '" style="--c:' + p.c + ';--c-t:' + p.ct + '" title="' + esc(p.t) + '"><span class="chip">' + ic(p.ic) + '</span><span class="tx">' + esc(p.t) + '</span></a>'; }).join(''); }).join('');
    const pref = ['dashboard', 'rencana', 'rapor', 'monev', 'supervisi', 'rapat', 'komunikasi'].filter(n => list.indexOf(n) > -1).slice(0, 4);
    const bn = pref.map(n => '<a href="#/' + n + '" data-n="' + n + '">' + ic(PAGES[n].ic) + '<span>' + esc(n === 'dashboard' ? 'Beranda' : n === 'rencana' ? 'Rencana' : PAGES[n].t.split(' ')[0]) + '</span></a>').join('') + '<button id="more" aria-label="Menu lainnya">' + ic('apps') + '<span>Lainnya</span></button>';
    root().innerHTML = '<div class="sync" id="sync"></div><aside class="side" aria-label="Navigasi utama"><div class="brand"><span class="logo">' + ic('school') + '</span><div><b>SIPERENCANA</b><span class="s">' + esc(nama) + '</span></div></div><nav class="nav">' + nav + '</nav></aside>' +
      '<div class="main"><header class="top"><div class="ttl grow" id="ttl"></div><span class="ta">' + ic('event_available', '') + 'TA ' + esc(Store.set.TA_AKTIF || '') + '</span><button class="iconbtn" id="bell" aria-label="Pengumuman">' + ic('notifications') + '<span class="badge" id="bb" hidden></span></button>' +
      '<div style="position:relative"><button class="me" id="me" aria-haspopup="true" aria-expanded="false"><span class="av">' + esc(initials(u.nama)) + '</span><span class="nm sm b" style="text-align:left;line-height:1.2;max-width:150px;overflow:hidden;text-overflow:ellipsis">' + esc(u.nama) + '<br><span class="muted xs" style="font-weight:600">' + esc(ROLE_L[u.peran] || u.peran) + '</span></span>' + ic('expand_more') + '</button></div></header>' +
      '<main class="view" id="view" tabindex="-1"></main></div><nav class="bnav" aria-label="Navigasi bawah">' + bn + '</nav>';
    $('#me').onclick = (e) => { e.stopPropagation(); userMenu(); };
    $('#bell').onclick = bellModal; $('#more').onclick = moreSheet;
    $$('[data-n]').forEach(a => { const pre = () => { const p = PAGES[a.dataset.n]; if (p && p.tables) Store.loadMany(p.tables); }; a.addEventListener('mouseenter', pre, { passive: true }); a.addEventListener('touchstart', pre, { passive: true }); });
    Store.on('sync', (n) => { const s = $('#sync'); if (!s) return; if (n) { s.style.opacity = 1; s.style.width = '70%'; } else { s.style.width = '100%'; setTimeout(() => { s.style.opacity = 0; s.style.width = '0'; }, 250); } });
    badge();
  }
  function userMenu() {
    const old = $('.menu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.className = 'menu'; m.innerHTML = '<div style="padding:10px 12px"><div class="b">' + esc(Store.user.nama) + '</div><div class="muted xs">' + esc(Store.user.username) + ' · ' + esc(ROLE_L[Store.user.peran]) + '</div></div><button data-a="pw">' + ic('key') + 'Ganti kata sandi</button><button data-a="out">' + ic('logout') + 'Keluar</button>';
    $('#me').parentNode.appendChild(m);
    const tutup = () => { m.remove(); document.removeEventListener('click', tutup); }; setTimeout(() => document.addEventListener('click', tutup), 0);
    m.onclick = (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'out') logout(); else ubahSandi(); };
  }
  function ubahSandi() {
    UI.form({ title: 'Ganti kata sandi', size: 'sm', fields: [{ k: 'a', l: 'Kata sandi saat ini', t: 'pass', req: 1, full: 1 }, { k: 'b', l: 'Kata sandi baru', t: 'pass', req: 1, full: 1, hint: 'Minimal 8 karakter, memuat huruf dan angka.' }, { k: 'c', l: 'Ulangi kata sandi baru', t: 'pass', req: 1, full: 1 }],
      onSubmit: async (v) => { if (v.b !== v.c) return { success: false, message: 'Ulangi kata sandi tidak sama.' }; const r = await API.write('auth.gantiSandi', { sandiLama: v.a, sandiBaru: v.b }); if (r.success) { API.setToken(r.data.token); toast('Kata sandi diperbarui.', 'ok'); } return r; } });
  }
  async function logout() { await API.read('auth.logout', {}, { retry: 0, timeout: 6000 }); API.setToken(null); Store.clear(); loginView(); }
  const lido = () => { try { return JSON.parse(localStorage.getItem(Store.ns() + 'dibaca') || '[]'); } catch (e) { return []; } };
  const peng = () => Store.rows('Pengumuman').filter(p => p.status === 'terkirim').sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
  function badge() { const b = $('#bb'); if (!b) return; const n = peng().filter(p => lido().indexOf(p.id) < 0).length; b.hidden = !n; b.textContent = n > 9 ? '9+' : n; }
  function bellModal() {
    const l = peng().slice(0, 15), baca = lido();
    const m = modal({ title: 'Pengumuman', footer: '<button class="btn" data-x2>Tutup</button>', body: l.length ? l.map(p => '<div class="card flat" style="margin-bottom:10px"><div class="row between"><b>' + esc(p.judul) + '</b>' + (baca.indexOf(p.id) < 0 ? '<span class="pill biru">Baru</span>' : '') + '</div><div class="muted xs">' + UI.tgl(p.tanggal) + '</div><p style="margin-top:6px;white-space:pre-wrap">' + esc(p.isi) + '</p></div>').join('') : UI.emptyBox('notifications_off', 'Belum ada pengumuman', 'Pengumuman dari sekolah akan muncul di sini.') });
    m.$('[data-x2]').onclick = m.close;
    const baru = l.filter(p => baca.indexOf(p.id) < 0); if (baru.length) { try { localStorage.setItem(Store.ns() + 'dibaca', JSON.stringify(baca.concat(baru.map(p => p.id)))); } catch (e) { } baru.forEach(p => API.read('pengumuman.baca', { id: p.id }, { retry: 0 })); badge(); }
  }
  function moreSheet() {
    const sudah = $$('.bnav [data-n]').map(a => a.dataset.n);
    const sisa = navList().filter(n => sudah.indexOf(n) < 0);
    const m = modal({ title: 'Menu lainnya', size: 'sm', footer: false, body: '<div class="col" style="gap:4px">' + sisa.map(n => '<a class="row" style="padding:10px;border-radius:12px;text-decoration:none;color:inherit;min-height:48px" href="#/' + n + '" data-close><span class="chip" style="width:34px;height:34px;border-radius:10px;background:' + PAGES[n].ct + ';color:' + PAGES[n].c + ';display:grid;place-items:center">' + ic(PAGES[n].ic) + '</span><b>' + esc(PAGES[n].t) + '</b></a>').join('') + '</div>' });
    m.el.addEventListener('click', e => { if (e.target.closest('[data-close]')) m.close(); });
  }

  /* ---------- router ---------- */
  function parse() { const h = location.hash.replace(/^#\/?/, ''), p = h.split('/').map(decodeURIComponent); return { n: p[0] || 'dashboard', parts: p.slice(1) }; }
  function route() {
    if (!Store.user) return;
    let { n, parts } = parse();
    if (!ok(n)) { if (n !== 'dashboard') toast('Anda tidak memiliki akses ke halaman itu.', 'bad'); location.replace('#/dashboard'); return; }
    offs.forEach(f => f()); offs = [];
    const P = PAGES[n], v = $('#view'), t0 = performance.now(); cur = n;
    document.documentElement.style.setProperty('--ac', P.c); document.documentElement.style.setProperty('--ac-t', P.ct);
    $('#ttl').textContent = P.t; document.title = P.t + ' · SIPERENCANA';
    $$('[data-n]').forEach(a => { a.getAttribute('data-n') === n ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    const ctx = { parts, watch(evs, fn) { [].concat(evs).forEach(e => offs.push(Store.on(e, () => { if (cur === n && document.body.contains(v)) fn(); }))); }, go(h) { location.hash = '#/' + h; }, base: n };
    v.innerHTML = ''; try { P.render(v, parts, ctx); } catch (e) { console.error(e); v.innerHTML = UI.emptyBox('error', 'Halaman gagal ditampilkan', 'Muat ulang halaman. Jika berulang, hubungi Admin.'); }
    window.scrollTo(0, 0); Perf.add({ aksi: 'render:' + n, total_ms: Math.round(performance.now() - t0), dari: 'cache' });
    if (P.tables) Store.loadMany(P.tables);
  }
  Store.on('t:Pengumuman', () => badge());

  /* ---------- mulai ---------- */
  async function start() {
    root().innerHTML = '<div class="main" style="margin:0;padding:40px;max-width:900px;margin:auto"><div class="sk" style="height:40px;width:50%"></div><div class="sk" style="height:140px;margin-top:20px"></div><div class="sk" style="height:140px;margin-top:14px"></div></div>';
    const r = await API.read('boot', {}, { retry: 2 });
    if (!r.success) { if (r.code === 'WAJIB_GANTI') return gantiSandiView({ nama: 'Pengguna' }, true); API.setToken(null); return loginView(r.offline ? r.message : (r.code === 'SESI' ? 'Sesi berakhir. Silakan masuk kembali.' : r.message)); }
    Store.init(r.data); shell();
    window.removeEventListener('hashchange', route); window.addEventListener('hashchange', route);
    if (!location.hash || location.hash === '#') location.replace('#/dashboard'); route();
    const semua = Object.keys(Store.izin).filter(t => Store.can(t, 'L') && ['Pengaturan', 'Log_Aktivitas', 'AntrianNotif', 'Pengguna'].indexOf(t) < 0);
    setTimeout(() => Store.loadMany(semua), 250);                 // prefetch seluruh data yang boleh dibaca → pindah menu tanpa tunggu
    setInterval(() => { if (document.visibilityState === 'visible' && Store.user) { Store.refreshDash(); if (PAGES[cur] && PAGES[cur].tables) Store.loadMany(PAGES[cur].tables); } }, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Store.user && PAGES[cur] && PAGES[cur].tables) Store.loadMany(PAGES[cur].tables); });
  }
  API.on('sesi', (m) => { if (!Store.user) return; API.setToken(null); Store.clear(); loginView(m || 'Sesi berakhir. Silakan masuk kembali.'); });
  window.addEventListener('offline', () => toast('Anda sedang offline. Data tersimpan tetap bisa dilihat.', 'bad'));
  window.addEventListener('online', () => { toast('Kembali online.', 'ok'); if (Store.user && PAGES[cur] && PAGES[cur].tables) Store.loadMany(PAGES[cur].tables, true); });
  window.App = { start, route, loginView, PAGES, ok };
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.SIP_CONFIG.GAS_URL) { root().innerHTML = '<div class="lg" style="grid-template-columns:1fr"><div class="fm"><div class="box"><div class="alert warn">' + ic('settings') + '<span>Aplikasi belum terhubung ke server. Isi <b>GAS_URL</b> pada <code>js/config.js</code> dengan URL Web App Apps Script (berakhiran /exec), lalu muat ulang.</span></div></div></div></div>'; return; }
    API.ping();                                                   // pemanasan server (cold start) sambil layar login/boot tampil
    if (API.hasToken()) return start();
    loginView();
    API.read('publik.info', {}, { retry: 1 }).then(r => { if (r.success) { info = r.data; if (!Store.user && $('#lf')) { initGoogle(); const s = $('.fm .muted'); if (s) s.textContent = info.nama_sekolah; } } });
  });
})();
