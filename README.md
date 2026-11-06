# SIPERENCANA — Sistem Informasi Perencanaan Sekolah

Frontend statis (HTML/CSS/JS murni) untuk GitHub Pages. Backend berupa Google Apps Script REST API yang diserahkan terpisah (berkas `.gs`).

```
index.html
css/style.css
js/config.js    ← satu-satunya berkas yang Anda ubah: isi GAS_URL
js/api.js  js/ui.js  js/app.js  js/pages1.js … pages5.js
```

Langkah lengkap ada di **PANDUAN-INSTALASI.md**. Berkas ini tidak memuat rahasia apa pun; `config.js` hanya berisi URL publik `/exec`.
