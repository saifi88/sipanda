# PHASE 09 — AUTOMATIC MILLIONAIRE QUESTIONS SHEET SETUP

**Status:** READY FOR MANUAL RUN (no deployment, no direct spreadsheet change in this phase)
**Repo:** SI-PANDA v3 + Millionaire
**Backend canonical:** `code.gs`
**Tanggal:** 2026-09-16

---

## 1. Tujuan

Menyediakan mekanisme Apps Script yang dapat membuat dan memvalidasi sheet
`MillionaireQuestions` secara otomatis, tanpa mengubah gameplay Millionaire,
FSM, visual skin, timer, lifeline, GameHub, 17 game existing, atau kontrak
frontend yang sudah locked.

Fungsi `setupMillionaireQuestions()` dijalankan **manual** dari editor Apps Script
(bound ke Spreadsheet SI-PANDA) pada saat operasional, bukan saat phase ini.

Phase ini hanya menyiapkan kode + dokumentasi + audit.

---

## 2. Scope

### Termasuk

- Fungsi `setupMillionaireQuestions()` di `code.gs`.
- Helper validasi header `validateMillionaireQuestionsHeader_(headerRow)` di `code.gs`.
- Reuse konstanta existing:
  - `MILLIONAIRE_QUESTIONS_SHEET`
  - `MILLIONAIRE_QUESTIONS_HEADER`
- Dokumentasi phase ini.
- Audit phase ini.

### Tidak termasuk (dilarang di phase ini)

- Mengubah gameplay Millionaire (`millionaire/MillionaireGame.js`, FSM, timer, lifeline).
- Mengubah visual skin (`millionaire/millionaire.css`, asset).
- Mengubah `GameHub` / registrasi game.
- Mengubah 17 game existing.
- Mengubah schema kontrak frontend yang sudah locked.
- Mengubah `GAME_RESULTS_HEADER` (upgrade GameResults 11 → 15 adalah fase berikutnya).
- Memasukkan soal demo/fallback ke spreadsheet.
- Deployment.
- Mengubah Google Spreadsheet secara langsung.
- Membuat sheet melalui API eksternal.
- Menghapus `code_v2.gs`.
- Mengubah fungsi existing selain penambahan helper/fungsi yang benar-benar diperlukan.

---

## 3. Kontrak sheet (LOCKED)

Nama sheet exact, case-sensitive:

```text
MillionaireQuestions
```

Header wajib 12 kolom, urutan tidak boleh berubah:

```text
1  id
2  mapel
3  level
4  question
5  optionA
6  optionB
7  optionC
8  optionD
9  answer
10 prize
11 isSafe
12 explanation
```

Representasi kanonis di `code.gs`:

```js
var MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";
var MILLIONAIRE_QUESTIONS_HEADER = ["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"];
```

Fungsi setup **tidak mendefinisikan ulang** konstanta tersebut.

---

## 4. Perilaku create-if-missing

1. Mendapatkan Spreadsheet aktif dengan mekanisme yang konsisten dengan backend existing:
   ```js
   var ss = SpreadsheetApp.getActiveSpreadsheet();
   ```
   Sama seperti `doGet`, `doPost`, `setupGameSheets`, `seedSampleGames`.
2. Mencari sheet bernama persis `MillionaireQuestions` via:
   ```js
   ss.getSheetByName(MILLIONAIRE_QUESTIONS_SHEET)
   ```
3. Jika belum ada:
   - buat dengan `ss.insertSheet(MILLIONAIRE_QUESTIONS_SHEET)`;
   - tulis header 12 kolom persis kontrak via `appendRow(MILLIONAIRE_QUESTIONS_HEADER)`;
   - format minimal: header bold + freeze baris 1;
   - kembalikan:
     ```js
     { ok: true, sheet: "MillionaireQuestions", created: true, headerValid: true }
     ```
4. Tidak menulis satu pun baris soal.

---

## 5. Perilaku existing sheet

- Jika sheet sudah ada, **jangan** membuat sheet baru.
- Baca baris 1 selebar 12 kolom, trim tiap sel, bandingkan exact per kolom dengan
  `MILLIONAIRE_QUESTIONS_HEADER` via `validateMillionaireQuestionsHeader_()`.
- Jika header sudah benar:
  - jangan mengubah data apa pun (tidak tulis ulang header, tidak format ulang, tidak hapus baris);
  - kembalikan:
    ```js
    { ok: true, sheet: "MillionaireQuestions", created: false, headerValid: true }
    ```
- Jika header salah/tidak sesuai:
  - **JANGAN** diam-diam merombak data;
  - lempar `Error` diagnostik berisi:
    - nama sheet;
    - daftar mismatch per kolom (`kolom N: expected "X" got "Y"`);
    - array `Expected [...]` vs `Actual [...]`;
    - penegasan bahwa data existing TIDAK diubah;
    - instruksi memperbaiki baris 1 manual lalu menjalankan ulang fungsi.
- Kasus khusus sheet existing tetapi kosong total (`getLastRow() < 1` atau
  `getLastColumn() < 1`): tidak ada data yang perlu dilindungi, sehingga header
  kontrak ditulis + format bold/freeze diterapkan, lalu kembalikan
  `{ ok: true, sheet, created: false, headerValid: true }`.

Kolom tambahan di kanan kolom 12 (jika ada) diabaikan oleh validasi setup;
validasi hanya mencakup 12 kolom pertama sesuai kontrak.

---

## 6. Idempotency

Menjalankan `setupMillionaireQuestions()` berkali-kali:

- tidak membuat sheet duplikat;
- tidak menulis header duplikat;
- tidak menghapus/menimpa data;
- hasil run ke-2 dan seterusnya pada kondisi normal:
  ```js
  { ok: true, sheet: "MillionaireQuestions", created: false, headerValid: true }
  ```

---

## 7. No demo seed

- `setupMillionaireQuestions()` tidak memasukkan soal demo/fallback ke spreadsheet.
- `FALLBACK_QUESTIONS` tetap hanya berada di `millionaire/MillionaireQuestions.js`
  dan diberi marker `// FALLBACK ONLY`.
- Pengisian soal produksi dilakukan manual oleh guru/admin setelah sheet tersedia.

---

## 8. Cara menjalankan fungsi di Apps Script

Phase ini **tidak** menjalankannya terhadap Spreadsheet produksi.

Langkah operasional (nanti, manual):

1. Buka Spreadsheet SI-PANDA yang terikat ke project Apps Script.
2. Buka **Extensions → Apps Script**.
3. Pastikan file `code.gs` yang aktif adalah versi phase ini (berisi
   `setupMillionaireQuestions`).
4. Di toolbar fungsi, pilih `setupMillionaireQuestions`.
5. Klik **Run**.
6. Setujui otorisasi Spreadsheet bila diminta.
7. Hasil sukses terlihat di log/return object:
   ```js
   { ok: true, sheet: "MillionaireQuestions", created: true/false, headerValid: true }
   ```
8. Jika header mismatch, baca pesan error lengkap, perbaiki baris 1 manual,
   lalu Run ulang.
9. Verifikasi manual: sheet `MillionaireQuestions` ada, baris 1 = 12 header kontrak.

Tidak ada trigger otomatis, tidak ada pemanggilan dari `doGet`/`doPost`/
`setupGameSheets`.

---

## 9. Validasi

- `code.gs` lolos `node --check`.
- Konstanta tidak duplikat (hanya definisi existing dipakai ulang).
- Seluruh fungsi existing `code.gs` dipertahankan.
- `GAME_RESULTS_HEADER` tidak berubah (tetap 11 kolom).
- `code_v2.gs` tidak dihapus/diubah.
- Tidak ada string seed soal di `code.gs` di luar sample Games existing.
- Frontend Millionaire tidak diubah.
- Lihat bukti lengkap di `PHASE_09_AUTOMATIC_QUESTIONS_SHEET_SETUP_AUDIT.md`.

---

## 10. Rollback / safety notes

- Rollback = revert commit checkpoint phase ini (`git revert` / checkout `code.gs`
  versi sebelumnya). Tidak ada perubahan spreadsheet yang perlu di-rollback karena
  phase ini tidak menyentuh spreadsheet.
- Fungsi aman di-run ulang (idempotent).
- Pada header mismatch, fungsi menolak menulis — tidak ada risiko overwrite diam-diam.
- Jangan menambahkan auto-call ke `setupMillionaireQuestions()` dari
  `doGet`/`doPost` tanpa fase tersendiri karena akan mengubah perilaku runtime.
- Jangan menambahkan seed soal ke fungsi setup tanpa change request eksplisit.

---

## 11. Residual risks

1. Operator menjalankan fungsi dari project Apps Script yang salah (tidak bound ke
   Spreadsheet produksi) → sheet tercipta di file yang salah. Mitigasi: verifikasi
   nama Spreadsheet + cek `SpreadsheetApp.getActiveSpreadsheet() == null` sudah
   melempar error diagnostik.
2. Header diperbaiki sebagian lalu run ulang tetap gagal — by design, sampai 12 kolom
   exact. Ini protektif, bukan bug.
3. Sheet existing kosong tetapi memiliki formatting sisa (filter, named range):
   fungsi hanya append header; artefak format lama tetap ada. Risiko rendah.
4. Kolom ekstra (>12) tidak divalidasi — disengaja agar tidak over-strict, tetapi
   admin harus menghindari menambah kolom kanonis tanpa versioned contract change.
5. `code_v2.gs` belum disinkronkan dengan fungsi ini — disengaja; `code.gs` adalah
   kanonis dan `code_v2.gs` dipertahankan apa adanya sampai deployment verification
   selesai.
