/* SIPERENCANA — api.js: panggilan REST ke GAS + penyimpanan data (stale-while-revalidate, optimistic UI). */
(function () {
  const C = window.SIP_CONFIG || {};
  const Perf = window.Perf = { log: [], add(e) { this.log.push(e); if (this.log.length > 300) this.log.shift(); }, table() { console.table(this.log.slice(-40)); } };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  let token = null; const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }; const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }; const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { } };
  token = lsGet('sp.tok');
  const subs = {}; const on = (e, f) => { (subs[e] = subs[e] || []).push(f); return () => { subs[e] = (subs[e] || []).filter(x => x !== f); }; }; const emit = (e, d) => (subs[e] || []).slice().forEach(f => { try { f(d); } catch (x) { console.error(x); } });

  async function call(action, data, opt) {
    opt = opt || {}; const t0 = performance.now();
    if (!C.GAS_URL) return { success: false, message: 'URL server belum diisi di js/config.js (GAS_URL).' };
    const write = !!opt.write, reqId = write ? (opt.reqId || rid()) : undefined, tries = opt.retry != null ? opt.retry : 2;
    let lastErr = null;
    for (let a = 0; a <= tries; a++) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), opt.timeout || 30000);
      try {
        const r = await fetch(C.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, data: data || {}, token, reqId }), signal: ctl.signal });
        clearTimeout(to);
        const j = await r.json(); const ms = Math.round(performance.now() - t0);
        Perf.add({ aksi: action, total_ms: ms, server_ms: j.ms, jaringan_ms: j.ms != null ? ms - j.ms : null, ok: !!j.success });
        if (!j.success && j.code === 'SESI') emit('sesi', j.message);
        return j;
      } catch (e) { clearTimeout(to); lastErr = e; if (a < tries) await sleep(500 * (a + 1)); }
    }
    Perf.add({ aksi: action, total_ms: Math.round(performance.now() - t0), ok: false, galat: String(lastErr && lastErr.name) });
    return { success: false, offline: true, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.' };
  }
  const API = window.API = {
    call, on, emit, rid,
    read: (a, d, o) => call(a, d, o),
    write: (a, d, o) => call(a, d, Object.assign({ write: true }, o)),
    setToken(t) { token = t; if (t) lsSet('sp.tok', t); else lsDel('sp.tok'); },
    hasToken: () => !!token,
    ping: () => call('ping', {}, { retry: 0, timeout: 20000 }),
    batch: (aksi) => call('batch', { aksi }, {})
  };

  /* ================= Store ================= */
  const Store = window.Store = {
    user: null, izin: {}, set: {}, users: [], dash: null, t: {}, ver: {}, at: {}, inflight: {}, FRESH: 30000,
    on, emit,
    ns() { return 'sp' + C.SKEMA + ':' + (this.user ? this.user.id : '_') + ':'; },
    can(table, huruf) { return String((this.izin || {})[table] || '').indexOf(huruf) > -1; },
    rows(table) { return this.t[table] || []; },
    byId(table, id) { return this.rows(table).find(r => r.id === id) || null; },
    userName(id) { const u = this.users.find(x => x.id === id); return u ? u.nama : (id || '—'); },
    init(boot) {
      this.user = boot.user; this.izin = boot.izin; this.set = boot.setting || {}; this.users = boot.pengguna || []; this.dash = boot.dash || {};
      this.t = {}; this.ver = {}; this.at = {}; this.at.__dash = Date.now();       // dashboard baru saja dibawa boot → tak perlu dash.get lagi
      Object.keys(this.izin).forEach(tb => { if (this.can(tb, 'L')) { const raw = lsGet(this.ns() + tb); if (raw) { try { const o = JSON.parse(raw); this.t[tb] = o.rows; this.ver[tb] = o.v; this.at[tb] = 0; } catch (e) { } } } });
      lsSet(this.ns() + 'dash', JSON.stringify(this.dash));
    },
    cachedDash() { try { return JSON.parse(lsGet(this.ns() + 'dash') || 'null'); } catch (e) { return null; } },
    persist(tb) { lsSet(this.ns() + tb, JSON.stringify({ rows: this.t[tb], v: this.ver[tb] })); },
    absorb(tb, d) {
      if (d.notModified) { this.at[tb] = Date.now(); return false; }
      this.t[tb] = d.rows; this.ver[tb] = d.v; this.at[tb] = Date.now(); this.persist(tb); this.emit('t:' + tb, d.rows); return true;
    },
    stale(tb) { return !this.at[tb] || Date.now() - this.at[tb] > this.FRESH; },
    async load(tb, force) {
      if (!this.can(tb, 'L')) return [];
      if (!force && !this.stale(tb)) return this.rows(tb);
      if (this.inflight[tb]) return this.inflight[tb];
      this.sync(1);
      this.inflight[tb] = API.read('crud.list', { table: tb, v: force ? undefined : this.ver[tb] }).then(r => {
        delete this.inflight[tb]; this.sync(-1);
        if (r.success) this.absorb(tb, r.data); return this.rows(tb);
      });
      return this.inflight[tb];
    },
    /** Penghitung permintaan berjalan → bilah sinkron tetap menyala selama masih ada yang menunggu. */
    nsync: 0,
    sync(d) { this.nsync = Math.max(0, this.nsync + d); this.emit('sync', this.nsync > 0 ? 1 : 0); },
    /** Muat banyak tabel sekaligus: kelompok kecil (6 tabel) dikirim PARALEL, bukan berurutan, supaya data tiba lebih cepat. */
    async loadMany(list, force) {
      const perlu = list.filter(tb => this.can(tb, 'L') && (force || this.stale(tb)) && !this.inflight[tb]), jobs = [];
      for (let i = 0; i < perlu.length; i += 6) {
        const grup = perlu.slice(i, i + 6); this.sync(1);
        const job = API.batch(grup.map(tb => ({ action: 'crud.list', data: { table: tb, v: force ? undefined : this.ver[tb] } }))).then(r => {
          grup.forEach(tb => delete this.inflight[tb]); this.sync(-1);
          if (r.success) r.data.hasil.forEach((h, k) => { if (h.success) this.absorb(grup[k], h.data); });
        });
        grup.forEach(tb => { this.inflight[tb] = job.then(() => this.rows(tb)); });     // yang menunggu menerima data SESUDAH diserap
        jobs.push(job);
      }
      await Promise.all(jobs);
    },
    async refreshDash() { const r = await API.read('dash.get'); if (r.success) { this.dash = r.data; lsSet(this.ns() + 'dash', JSON.stringify(r.data)); this.emit('dash', r.data); } },
    invalidate(...tbs) { tbs.forEach(tb => { this.at[tb] = 0; }); },
    /** Simpan dengan optimistic UI: baris langsung tampil (ditandai _pending), diganti hasil server, rollback bila gagal. */
    async save(tb, row) {
      const baru = !row.id, snap = (this.t[tb] || []).slice(), tmpId = 'tmp-' + rid();
      const opt = Object.assign({}, row, { id: baru ? tmpId : row.id, _pending: true });
      this.t[tb] = baru ? [opt].concat(snap) : snap.map(x => x.id === row.id ? Object.assign({}, x, opt) : x);
      this.emit('t:' + tb, this.t[tb]);
      const r = await API.write('crud.save', { table: tb, row });
      if (!r.success) { this.t[tb] = snap; this.emit('t:' + tb, snap); return r; }
      const srv = r.data.row;
      this.t[tb] = (this.t[tb] || []).map(x => x.id === opt.id ? srv : x); this.persist(tb); this.at[tb] = 0; this.emit('t:' + tb, this.t[tb]);
      this.afterWrite(tb); return r;
    },
    async remove(tb, id) {
      const snap = (this.t[tb] || []).slice(); this.t[tb] = snap.filter(x => x.id !== id); this.emit('t:' + tb, this.t[tb]);
      const r = await API.write('crud.delete', { table: tb, id });
      if (!r.success) { this.t[tb] = snap; this.emit('t:' + tb, snap); return r; }
      this.persist(tb); this.at[tb] = 0; this.afterWrite(tb); return r;
    },
    afterWrite(tb) { this.refreshDash(); const dep = { Alternatif_Keputusan: ['Masalah_Prioritas', 'Program_RKJM'], Program_RKJM: ['Kegiatan_RKT'], Kegiatan_RKT: ['Realisasi_Monev'] }[tb]; if (dep) dep.forEach(d => this.invalidate(d)); },
    clear() { try { Object.keys(localStorage).filter(k => k.indexOf('sp' + C.SKEMA + ':') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { } this.user = null; this.t = {}; this.ver = {}; this.at = {}; }
  };
})();
