# PHASE 10C — AUDIT: MILLIONAIRE SAVE GATE FIX

**Tanggal:** 2026-09-16
**Root cause (Phase 10B):** `canSaveGameResult()` dipanggil dua kali dengan key
identik — pre-call di `MillionaireGame` menulis timestamp, gate di `App.finishGame`
selalu `false`, `fetch` POST tidak pernah terjadi.
**Hasil:** PASS — siap checkpoint, tanpa deployment, tanpa perubahan backend.

---

## 1. Exact change (`millionaire/MillionaireGame.js`, +4/−15)

Dihapus dari FINISHED effect (blok lama :513-525):

- pre-call `canSaveGameResult(currentUser.nisn, result.gameId, String(levelReached))`;
- fallback lokal `M.antiFarmKey` + baca/tulis `localStorage` langsung;
- variabel dead `shouldPost` (seluruhnya, 0 sisa);
- `try/catch` pembungkusnya.

Diganti komentar 4 baris: `App.finishGame()` adalah satu-satunya pemilik gate;
pre-call dilarang karena meracuni key. Tidak ada gate baru. `onFinish(result)`
tetap dipanggil identik (`try { onFinish(result); } catch...`), payload 15-field
tidak tersentuh, FSM/state transition tidak tersentuh (0 baris `-` mengandung
`transitionTo/STATES/highestLevel/walkAway()`).

## 2. File changed

- `millionaire/MillionaireGame.js` — satu-satunya file kode (`git diff --name-only`
  terfilter docs).
- Tidak tersentuh: `index.html`, `games/*`, `code.gs`, `code_v2.gs`, CSS, data
  contract, question engine, prize ladder, timer, lifeline.

## 3. Test results — 24/24 PASS (`phase10c_test.js`)

- F1: file utuh ter-parse + ter-transform JSX via `@babel/standalone`
  (preset persis produksi); output retains `onFinish(result)`.
- F2 (statik): 0 pemanggilan executable `canSaveGameResult`; `shouldPost` hilang;
  8/8 field payload (`gameId`, `type`, `level`, `virtualRupiah`, `safeRupiah`,
  `walkAway`, `lifelinesUsed`, `extra`) utuh.
- F3 (behavioral, fungsi `canSaveGameResult` ASLI + `doPost` ASLI via eval):
  - victory Lv15 → gate lolos → POST → row 15 kolom (`15/1000000/1000000`);
  - walk-away Lv8 → tersimpan (`8/8000/1000`, `extra.walkAway=true`);
  - wrong Lv4 → tersimpan (`4/0/0`, `salah=1`, nol legit utuh);
  - replay key sama <30 dtk → ditahan satu gate, tanpa row baru.

## 4. Anti-farm regression — PASS

- Gate tunggal di `App.finishGame` (`index.html:294-299`) tidak diubah dan tetap
  menahan replay <30 dtk (F3-replay). Throttle 30 dtk per key
  `game_last_${nisn}_${gameId}_${String(level)}` berlaku untuk Millionaire
  (numerik) maupun game existing (difficulty string) seperti sebelumnya.

## 5. 17-game regression — PASS

- Grep 17 file game: 0 referensi executable `canSaveGameResult`/`shouldPost`
  (jalur tunggal via App, tak berubah).
- Simulasi finish existing game → tersimpan (`level "sedang"` jujur,
  `virtualRupiah/safeRupiah/extra = ""`, tanpa nilai palsu).

## 6. Status: PASS

Millionaire kini memakai satu gate yang sama dengan 17 game; tidak ada fungsi
yang hilang; tidak ada perubahan perilaku selain terbukanya kembali POST yang
sebelumnya mustahil terkirim. JANGAN deploy pada phase ini.
