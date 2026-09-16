# PHASE 10 — GAME RESULTS 11 → 15 COLUMN BACKWARD-COMPATIBLE

**Status:** CODE READY, NOT DEPLOYED (tanpa deployment, tanpa sentuh spreadsheet produksi)
**Repo:** SI-PANDA v3 + Millionaire
**Backend canonical:** `code.gs`
**Tanggal:** 2026-09-16
**Prasyarat:** Phase 09 PASS (tidak diubah pada phase ini)

---

## 1. Masalah 11 → 15

`GameResults` existing menyimpan 11 kolom. Millionaire membutuhkan 4 kolom tambahan
(`level`, `virtualRupiah`, `safeRupiah`, `extra`) agar hasil permainan (level terminal,
Rupiah virtual/aman, detail lifeline) tercatat tanpa membuat storage terpisah.

Frontend (`index.html` → `finishGame`) **sudah** mengirim 4 field tersebut untuk
`tipe === "millionaire"`, tetapi backend lama membuangnya (append 11 kolom saja).
Phase 10 menutup celah tulis/baca itu tanpa merusak data lama.

---

## 2. Kontrak final (LOCKED)

`GAME_RESULTS_SHEET` tidak berubah:

```text
GameResults
```

`GAME_RESULTS_HEADER` final, 15 kolom:

```text
1  waktu
2  nisn
3  nama
4  gameId
5  game
6  mapel
7  tipe
8  skor
9  benar
10 salah
11 durasiDetik
12 level
13 virtualRupiah
14 safeRupiah
15 extra
```

11 kolom depan: nama dan urutan **identik** dengan existing. 4 kolom baru hanya
ditambahkan di belakang. Tidak ada penyisipan di tengah.

---

## 3. Backward compatibility

- `readGameResults_` membaca `min(max(lastColumn, 11), 15)` kolom:
  sheet 11 kolom → dibaca 11 kolom; sheet 15 kolom → dibaca 15 kolom.
- Baris lama 11 kolom tidak crash; kolom 12–15 dinormalisasi menjadi `""`.
- Baris baru 15 kolom terbaca lengkap (`level` string, `virtualRupiah`/`safeRupiah`
  number-or-`""`, `extra` string).
- `getInitData` tidak berubah signature-nya; field `gameResults` kini membawa 4
  field tambahan (kosong untuk data lama).
- Tidak ada migrasi/penulisan ulang historical rows — hanya `appendRow` untuk
  data baru.

---

## 4. Payload existing games

`saveGameResult` menerima 15 field. Untuk game existing yang tidak mengirim 4
field Millionaire, backend menyimpan:

```text
level = ""
virtualRupiah = ""
safeRupiah = ""
extra = ""
```

Catatan jujur terhadap frontend aktual: `index.html` sudah mengirim
`level: String(...)` ("mudah"/"sedang"/"sulit") untuk semua game. Bila `level`
dikirim (tidak kosong), backend menyimpannya **apa adanya sebagai string**
(bukan `""`), karena itu data nyata kesulitan game — bukan nilai Millionaire
palsu. `virtualRupiah`/`safeRupiah`/`extra` yang tidak dikirim tetap `""`.
Tidak ada nilai Millionaire yang difabrikasi.

---

## 5. Payload Millionaire

Untuk `tipe === "millionaire"`:

- `level` — dipakai langsung dari payload frontend (level terminal/highest level),
  dinormalisasi ke string (`7` → `"7"`). Backend tidak menghitung ulang.
- `virtualRupiah` / `safeRupiah` — dipakai langsung dari payload (`Number(...)`).
  Nilai legit `0` (salah sebelum safe) dipertahankan sebagai `0`, bukan `""`.
  Nilai non-numerik diamankan menjadi `""`.
- `extra` — dipertahankan apa adanya sebagai string. Bila frontend mengirim objek,
  di-`JSON.stringify` (tidak pernah dihitung ulang).
- Skor tetap normalized 0–100 dari frontend; formula tidak diubah.

---

## 6. Extra JSON

`extra` wajib mempertahankan isi frontend:

```js
{
  walkAway: Boolean,
  lifelinesUsed: { fiftyFifty: Boolean, askClass: Boolean, askFriend: Boolean },
  prizeLadderSnapshot: [{ level, prize, isSafe }, ...]
}
```

Backend tidak mem-parsing, tidak memvalidasi, tidak menambah/menghapus key —
hanya meneruskan string. Test C/F membuktikan round-trip `JSON.parse(row.extra)`
identik dengan objek yang dikirim.

---

## 7. Historical data policy

- Data existing 11 kolom **tidak dihapus, tidak ditulis ulang, tidak dipadatkan**.
- Test G membuktikan: setelah `saveGameResult` baru, historical rows byte-identical;
  hanya satu row baru 15 kolom yang di-append.
- Baris lama yang dibaca lewat `getInitData` mendapat `level/virtualRupiah/safeRupiah/extra = ""`.

---

## 8. Migration policy

- **Tidak ada migrasi data otomatis** pada phase ini.
- Sheet `GameResults` produksi yang header-nya masih 11 kolom tetap berfungsi:
  `appendRow` 15 nilai memperlebar sheet secara alami; reader membaca posisi,
  bukan nama header.
- Follow-up deployment (manual, oleh operator, di luar phase ini):
  1. Deploy `code.gs` versi ini ke Apps Script terikat.
  2. Tambahkan 4 nama header (`level`, `virtualRupiah`, `safeRupiah`, `extra`)
     di baris 1 kolom L–O secara manual bila belum ada.
  3. Uji `saveGameResult` 11-field dan 15-field di spreadsheet staging/copy.
  4. Verifikasi `getInitData` memuat kedua jenis baris.

---

## 9. Anti-farm

Tidak diubah. Anti-farm adalah guard frontend (`games/GameShell.js` →
`canSaveGameResult`, dipakai `index.html` → `finishGame`) dengan key:

```text
game_last_${nisn}_${gameId}_${String(level)}
```

Backend tidak memiliki anti-farm; tidak ditambahkan. Normalisasi `level` backend
(`String(...)`, integer → string) konsisten dengan kontrak `String(level)` frontend
untuk Millionaire (numerik 1–15) maupun game existing ("mudah"/"sedang"/"sulit").

---

## 10. Scope / non-scope

Termasuk: `GAME_RESULTS_HEADER` 15 kolom, write path `saveGameResult` 15 nilai,
reader `readGameResults_` backward-compatible, update 2 baris komentar U2 yang
kedaluwarsa, docs + audit + harness phase ini.

Non-scope (tidak disentuh, terbukti via `git diff --name-only` = hanya `code.gs`):
`millionaire/` (Game/Data/Questions/css), `games/` (17 game + GameHub/GameShell/gameData),
`index.html`, `admin.html`, `code_v2.gs`, `MillionaireQuestions` (tidak diisi soal),
skor formula, anti-farm, deployment, spreadsheet produksi.

`code_v2.gs` dipertahankan apa adanya; perbedaannya dengan `code.gs` (belum ada
write/read 15 kolom) dicatat sebagai residual.

---

## 11. Deployment follow-up

JANGAN DEPLOY pada phase ini. Saat deployment nanti (fase terpisah): deploy
`code.gs`, lakukan langkah manual §8, dan sinkronkan/putuskan status `code_v2.gs`
setelah verifikasi kanonis.
