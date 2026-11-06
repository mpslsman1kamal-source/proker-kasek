# Panduan Instalasi SIPERENCANA

Ada dua bagian: **Backend** (Google Apps Script, disalin-tempel) dan **Frontend** (folder `siperencana-frontend`, diunggah ke GitHub Pages). Kerjakan berurutan.

## Apa yang terisi otomatis dan apa yang Anda isi

| Item | Siapa yang mengisi | Di mana |
|---|---|---|
| Spreadsheet database, folder Drive, templat dokumen, pemicu waktu | **Otomatis** oleh `setupAppEnvironment()` | Google Drive Anda |
| `SESSION_SECRET` (kunci sesi) | **Otomatis** (dibangkitkan acak) | Script Properties |
| Kata sandi admin awal | **Otomatis**, tampil sekali di log eksekusi | Log Apps Script |
| URL Web App (`/exec`) | **Anda** | `js/config.js` → `GAS_URL` |
| Google Client ID (login Google, opsional) | **Admin** | Aplikasi → Pengaturan → Keamanan & Notifikasi |
| Token Fonnte (WhatsApp, opsional) | **Admin** | Aplikasi → Pengaturan → Keamanan & Notifikasi |

Rahasia tidak pernah ditulis di kode, `config.js`, atau spreadsheet. Token Fonnte dan Client ID disimpan di Script Properties dan hanya tampil tersamar.

## A. Backend (Apps Script)

1. Buka https://script.google.com → **Proyek baru**, beri nama `SIPERENCANA API`. Gunakan **akun Google yang akan memiliki data**.
2. Buat berkas skrip dan tempel isi tiap berkas `.gs` yang diserahkan: `Config`, `Rahasia`, `Data`, `Kode`, `Auth`, `Modul`, `Notif`, `DocEngine`, `Migrasi`, `Setup`, `ContohData` (opsional).
3. **Pengaturan proyek** (ikon roda gigi) → centang **Tampilkan file manifes "appsscript.json"**. Buka `appsscript.json` dan ganti seluruh isinya dengan berkas `appsscript.json` yang diserahkan.
4. Pilih fungsi **`setupAppEnvironment`** → **Jalankan**. Setujui izin (Sheets, Drive, Docs, kirim email, layanan eksternal, pemicu).
5. Buka **Eksekusi/Log**. Catat **username `admin`** dan **kata sandi sementara**. Hanya tampil sekali. Lupa? Jalankan `resetAdmin`.
6. (Opsional demo) jalankan `setupContohData` untuk data contoh dan 7 akun contoh; kata sandi sementaranya juga di log. **Jangan** dijalankan di data produksi.
7. **Deploy → Deployment baru → Aplikasi web**: *Jalankan sebagai* **Saya**, *Yang memiliki akses* **Siapa saja**. Salin **URL Web App** (berakhiran `/exec`).
8. Setiap kali Anda mengubah kode `.gs`: **Deploy → Kelola deployment → ikon pensil → Versi: Versi baru → Deploy**. URL tidak berubah. Tanpa langkah ini perubahan tidak aktif.

## B. Frontend (GitHub Pages)

1. Di komputer, ekstrak ZIP frontend. Folder hasil ekstrak **adalah** folder proyek; di dalamnya langsung terlihat `index.html`, `css`, `js`.
2. Buka `js/config.js`, isi `GAS_URL: 'https://script.google.com/macros/s/…/exec'`. Simpan.
3. Buat akun di https://github.com. Buat **repository baru** (Public, **jangan** centang README/.gitignore/license), mis. `siperencana`.
4. Buka terminal **di folder proyek tadi** (Windows: buka folder di File Explorer, klik address bar, ketik `powershell`, Enter). Pastikan `dir` (atau `ls`) menampilkan `index.html` paling atas. Jika yang terlihat folder `backend` atau `frontend`, Anda satu tingkat terlalu tinggi: masuk ke folder yang berisi `index.html`.
5. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/siperencana.git
   git push -u origin main
   ```
   Saat diminta kata sandi, tempel **Personal Access Token** (GitHub → Settings → Developer settings → Tokens (classic) → centang `repo`). Layar tampak kosong saat menempel; itu normal. Jangan unggah lewat tombol "Upload files" di web GitHub karena struktur folder rusak.
6. Repository → **Settings → Pages** → Source **Deploy from a branch**, Branch **main** / **(root)** → Save. Centang **Enforce HTTPS**. Tunggu 1–2 menit; alamat `https://USERNAME.github.io/siperencana/` aktif.
7. Buka alamat itu, masuk sebagai `admin` memakai kata sandi sementara, lalu ganti kata sandi.

Memperbarui frontend: `git add .` → `git commit -m "pesan"` → `git push`; tekan Ctrl+Shift+R di browser.

## C. Setelah masuk sebagai Admin

1. **Pengaturan → Profil & Templat**: lengkapi profil sekolah; ganti templat dokumen bila perlu.
2. **Pengaturan → Parameter**: tahun ajaran, periode RKJM, ambang warna, format nomor surat, 8 standar.
3. **Pengaturan → Pengguna & Akses**: buat akun (Kepsek, Wakasek, Guru, Pengamat). Kata sandi awal tampil sekali; pengguna wajib menggantinya.
4. **Login Google (opsional)**: di Google Cloud Console buat OAuth Client ID (Web). Tambahkan `https://USERNAME.github.io` ke *Authorized JavaScript origins*. Tempel Client ID di **Pengaturan → Keamanan & Notifikasi**. Atur akun pengguna ke metode *Google* atau *Keduanya* dan isi emailnya.
5. **WhatsApp (opsional)**: tempel token Fonnte di tempat yang sama, **Kirim tes**, lalu aktifkan saklar WhatsApp. Saklar WA dan email **mati** secara bawaan. Pesan dikirim lewat antrean (pemicu tiap 1 menit).
6. **Migrasi dari aplikasi lama (opsional)**: Pengaturan → Migrasi. Tempel tautan spreadsheet lama, **Pindai** (tidak menulis), periksa laporan, lalu **Jalankan impor**. Aman diulang.

## D. Pemecahan masalah

| Gejala | Penyebab / solusi |
|---|---|
| Halaman 404 di GitHub Pages | `git init` dijalankan di folder yang salah. Pindah ke folder berisi `index.html`, ulangi dari langkah 5 (`git push -u origin main --force`). |
| Halaman tanpa gaya | Struktur `css/` dan `js/` tidak ikut terunggah; unggah ulang lewat terminal. |
| "URL server belum diisi" | `GAS_URL` di `js/config.js` kosong. |
| Perubahan backend tidak berlaku | Belum membuat **versi baru** deployment (A.8). |
| "Tidak dapat terhubung ke server" | Deployment bukan *Siapa saja*, atau URL salah / bukan berakhiran `/exec`. |
| Tombol Google tidak muncul | Client ID belum diisi atau origin GitHub Pages belum didaftarkan. |
| Dokumen tidak bisa dicetak | Templat belum terpasang atau izin Docs belum disetujui; jalankan ulang `setupAppEnvironment`. |

## E. Batasan yang perlu diketahui

- Migrasi hanya untuk tabel utama (Pengguna, Sekolah, Rapor, RKJM, RKT, Realisasi Monev, Rapat, Surat, Dokumen, Pengumuman, Kontak). Masalah/Alternatif keputusan, Supervisi & RTL, Pelatihan, dan Persetujuan perlu diinput ulang. Sesi login tidak ikut pindah; pengguna hasil impor perlu reset kata sandi.
- Kegiatan RKT yang melintasi dua tahun ajaran dicatat sebagai dua entri.
- Modul belum dibangun: disposisi surat, penganalisis isi dokumen regulasi, kode QR pada dokumen (opsional di skill).
- Kuota Google (email harian, UrlFetch) berlaku; antrean notifikasi membatasi batch.
