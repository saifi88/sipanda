# PHASE 09 — AUDIT: AUTOMATIC MILLIONAIRE QUESTIONS SHEET SETUP

**Tanggal:** 2026-09-16
**Scope audit:** `code.gs` (fungsi baru), docs phase 09, regresi repo
**Hasil:** LULUS (PASS) — siap checkpoint, tanpa deployment

---

## 1. code.gs syntax — PASS

- `Copy-Item code.gs → $env:TEMP\phase09_code_check.js` + `node --check` → **OK, exit True ($? = True)**.
  - Catatan: `node --check code.gs` langsung gagal dengan `ERR_UNKNOWN_FILE_EXTENSION (.gs)`,
    sehingga verifikasi dilakukan via salinan berekstensi `.js` (isi byte-identical).
- `new Function(src)` parse test → **parse: OK**.
- Total fungsi terdeteksi di `code.gs`: **23** (21 existing + 2 baru).

---

## 2. Fungsi existing tidak hilang — PASS

Perbandingan `git diff HEAD -- code.gs`:

- Baris `+function`: hanya 2 (baru):
  - `validateMillionaireQuestionsHeader_`
  - `setupMillionaireQuestions`
- Baris `-function`: **0**.
- Daftar fungsi existing masih lengkap: `doGet`, `doPost`, `getOrCreateSheet_`,
  `readGames_`, `readGameResults_`, `_millionaireNormalizeBoolean_`,
  `normalizeMillionaireQuestion_`, `validateMillionaireQuestion_`,
  `readMillionaireQuestions_`, `setupGameSheets`, `seedSampleGames`,
  `getSampleGames_`, `gameTypeFormatInstr_`, `countWords_`, `sanitizeGamePairs_`,
  `classifyGamePairs_`, `generateGamePairsFromImages`, `generateQuestionsFromImages`,
  `evaluateEssayWithAI`, `generateOverallFeedbackWithAI`, `pancingIzin`.
- Tidak ada modifikasi badan fungsi existing (diff `code.gs` = **62 insertions, 0 deletions**).

---

## 3. Konstanta tidak duplikat — PASS

Grep `code.gs`:

```text
var GAME_RESULTS_HEADER = [...]          (1x, line 3)
var MILLIONAIRE_QUESTIONS_SHEET = ...    (1x, line 12)
var MILLIONAIRE_QUESTIONS_HEADER = ...   (1x, line 13)
```

Fungsi baru **reuse** kedua konstanta Millionaire, tidak mendefinisikan ulang.

---

## 4. Header exact 12 kolom — PASS

- `MILLIONAIRE_QUESTIONS_HEADER` = `["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]` (12 kolom, urutan kontrak).
- Test T1 mock: header yang ditulis `insertSheet` + `appendRow` **byte-identical** dengan kontrak.
- Helper `validateMillionaireQuestionsHeader_` membandingkan **exact per kolom** setelah `trim`, tanpa normalisasi case.

---

## 5. Sheet name exact — PASS

- `MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions"` (case-sensitive).
- `setupMillionaireQuestions()` memakai `ss.getSheetByName(MILLIONAIRE_QUESTIONS_SHEET)` dan
  `ss.insertSheet(MILLIONAIRE_QUESTIONS_SHEET)` — tidak ada literal nama duplikat.
- Return object memakai `sheet: MILLIONAIRE_QUESTIONS_SHEET`.

---

## 6. Idempotency logic — PASS (15/15 mock test)

Harness: `C:\Users\Admin\AppData\Local\Temp\opencode\phase09_test.js` (mock `SpreadsheetApp`):

| Test | Hasil |
|---|---|
| T1 create-if-missing → `{ok:true, created:true, headerValid:true}`, 1 insert + 1 header append | PASS |
| T1 header tertulis exact 12 kolom | PASS |
| T2 run kedua → `{created:false}`, tanpa insert/append tambahan | PASS |
| T3 existing benar + ada data → return `created:false`, data untouched, 0 append | PASS |
| T4 header salah → throw diagnostik (`kolom 11: expected "isSafe"` + `TIDAK diubah`), data untouched | PASS |
| T5 sheet existing kosong → tulis header, `created:false` | PASS |
| T6 tidak ada referensi FALLBACK/seed di blok baru | PASS |

Ringkasan: **pass:15 fail:0**.

---

## 7. Tidak ada seed soal — PASS

- `git diff HEAD -- code.gs | Select-String appendRow/insertSheet/...` menunjukkan `appendRow`
  hanya untuk `MILLIONAIRE_QUESTIONS_HEADER` (2 lokasi: create + empty-sheet), tidak ada
  `appendRow` data soal.
- Tidak ada string `mill-ipas`, `FALLBACK_QUESTIONS`, atau contoh soal di blok baru.
- `FALLBACK_QUESTIONS` tetap hanya di `millionaire/MillionaireQuestions.js` (tidak diubah).

---

## 8. Tidak ada perubahan gameplay/frontend — PASS

- `git diff --name-only` → hanya `code.gs` (+ doc baru). Tidak ada perubahan di:
  - `millionaire/` (MillionaireGame.js, MillionaireData.js, MillionaireQuestions.js, css, assets)
  - `games/` (17 game + GameHub/GameShell/gameData)
  - `index.html`, `admin.html`
- `git diff --stat HEAD -- millionaire games index.html admin.html code_v2.gs` → **kosong**.

---

## 9. Tidak ada perubahan GameResults — PASS

- `GAME_RESULTS_HEADER` tetap 11 kolom:
  `["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik"]`.
- Diff tidak menyentuh `GAME_RESULTS_SHEET`, `GAME_RESULTS_HEADER`, `readGameResults_`,
  maupun branch `saveGameResult`.

---

## 10. code_v2.gs tidak dihapus — PASS

- `git status` → `code_v2.gs` tidak tercantum (unmodified).
- `Test-Path code_v2.gs` → ada; diff terhadapnya kosong.

---

## 11. Regression check 17 game + Millionaire — PASS

- `games/`: 20 file = 17 game (BalloonPop, BossBattle, Defense, Feed, FillBlank, Hangman,
  LogicTower, Match, Maze, Memory, QuizRush, Race, Scramble, Sequence, SnakeLadder, Sort,
  TrueFalse) + `gameData.js`, `GameHub.js`, `GameShell.js` — **tidak ada yang berubah**.
- Millionaire (`MillionaireData.js`, `MillionaireGame.js`, `MillionaireQuestions.js`,
  `millionaire.css`) — **tidak ada yang berubah**.
- `readMillionaireQuestions_` (reader produksi) tidak dimodifikasi; `getInitData` tidak
  memanggil fungsi setup baru (tidak ada auto-trigger).
- Mekanisme Spreadsheet konsisten: `SpreadsheetApp.getActiveSpreadsheet()` sama seperti
  `doGet`/`doPost`/`setupGameSheets`.

---

## 12. Keputusan audit

- **APPROVED untuk checkpoint Git** (tanpa deployment, tanpa run terhadap spreadsheet produksi).
- Tindak lanjut fase berikutnya (bukan phase ini): upgrade GameResults 11 → 15,
  sinkronisasi `code_v2.gs` bila diperlukan, dan manual run `setupMillionaireQuestions()`
  oleh operator di Spreadsheet yang benar.
