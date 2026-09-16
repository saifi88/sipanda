# PHASE 07 — CONTESTANT & MAPEL SELECTION AUDIT

> **Status:** ADDITIVE PRE-GAME GATE — FSM 12 state/matrix tidak diubah; timer, lifeline, timeout, walk-away, scoring, result flow, backend, 17 game tidak diubah perilakunya.
> **Tanggal:** 2026-09-16
> **Auditor:** OpenCode (Muse Spark)
> **Parent Spec:** `docs/millionaire/PHASE_07_CONTESTANT_MAPEL_SELECTION.md`
> **Live QA:** Chrome headless + local HTTP server + `puppeteer-core`, real `MillionaireGame`, 10 skenario klik nyata (1366×768 + 390×844).

---

## 1. Desain (additive, mengikuti kode aktual §19)

- Pre-game adalah **local UI state** (`_pg = {show, selectedMapel}`), bukan FSM state. Saat gate tampil, FSM diam di `INTRO`; tidak ada penambahan ke `ALLOWED_TRANSITIONS` (diuji: `data-state INTRO` + `.millionaire-pregame` tampil bersamaan).
- **Kontestan** dari `props.currentUser` existing (backend sheet Siswa hanya membawa `nisn+name` — tidak ada field kelas di sumber mana pun, jadi tidak difabrikasi; lihat §7).
- **Mapel** dari resolved source (`resolveQuestionSource(rawProd)`): mapel unik, urut `MAPEL_LIST`, validitas per mapel via `buildMillionaireQuestionSet` (helper existing, hanya `ok` yang dipakai). Normalisasi baris mentah per-baris via `normalizeMillionaireQuestion` (display-only; load effect engine byte-identical).
- **Load effect** di-gate: `if (_pg.show) return;` + deps `[_pg.show, _state.mapel]`; MULAI → set `mapel` + `show:false` → alur INTRO→READY→QUESTION existing mengambil alih. Timer/lifeline/timeout/walk-away/score/result/backend nol sentuhan.
- **Kembali** pre-game → `handleExit` (`onExit`); tanpa result/save/anti-farm karena game belum mulai (diuji P4).
- Satu insiden saat implementasi: deps load effect membaca `_pg` sebelum baris deklarasinya (hoisted `var` masih `undefined` saat render) → crash. Dipindah: blok pre-game **wajib di atas** load effect + komentar penanda. Tidak ada logika gameplay yang tersentuh perbaikan ini.

## 2. File yang Diubah (2 file)

- **`millionaire/MillionaireGame.js`** (+~120 baris): state `_pg`; memo `pregame` (resolve→normalize→uniq→validity); `chooseMapel`/`startPregame` (double guard valid, tanpa fallback diam-diam); gate load effect; render branch contestant screen (avatar inisial, kartu mapel + badge `✓ L1–L15`/`Belum lengkap`, pesan `[MAPEL] SIAP DIMAINKAN!` vs spec-error + detail level hilang, MULAI disabled-until-valid, Kembali).
- **`millionaire/millionaire.css`** (+~110 baris, blok `PHASE 07 pre-game`, 100% scoped): kartu glass/dark, avatar gold, grid 2-kolom desktop / 1-kolom portrait, touch target ≥44px, tombol full-width di portrait.

## 3. Hasil Test

| # | Test | Hasil |
|---|---|---|
| P1 | Contestant screen muncul saat mount (FSM INTRO) | ✅ nama aktual `Sinta`, 1 kartu IPAS, MULAI disabled, ada Kembali |
| P2 | Pilih IPAS → `IPAS SIAP DIMAINKAN!` → MULAI aktif → QUESTION, timer `30s` | ✅ `warns:[]` |
| P3 | Mapel tak lengkap (Matematika mentah L1–L3) ditolak | ✅ pesan spec persis + `(Kurang: L4…L15)`, MULAI disabled, tetap INTRO |
| P4 | Kembali pre-game | ✅ `exited:true`, `finish:null` |
| P5 | Mobile 390×844 | ✅ stacked, `scrollW==bodyW` (tanpa overflow) |
| R1 | Walk-away via gate | ✅ FINISHED `walkAway:true/salah:0`, `warns:[]` |
| R2 | Wrong lock via gate | ✅ FINISHED `salah:1/walkAway:false`, `warns:[]` |
| R3 | Correct L1 → L2 | ✅ |
| R4 | Timeout (t=4) via gate | ✅ FINISHED `salah:1/walkAway:false`, `warns:[]` |
| R5 | Kembali gameplay | ✅ `exited:true`, `finish:null` |

Evidence: `docs/millionaire/PHASE_07_PREGAME_1366x768.png`, `docs/millionaire/PHASE_07_PREGAME_390x844.png`.

## 4. Regression 17 Game — PASS

`games/*` untouched (mtime terakhir 15-Sep pra-sesi; tidak ada file game tersentuh 16-Sep); tidak ada referensi silang baru (`transitionTo`/`handleTimeout`/pre-game hanya di `MillionaireGame.js`); dispatcher/`GameShell`/`GameHub`/`gameData`/backend tidak diubah.

## 5. File yang TIDAK Diubah

`ALLOWED_TRANSITIONS`, 12 states, timer, lifeline, `handleTimeout`, `walkAway`, question engine/data, prize ladder, score formula, result builder/flow, `MillionaireData.js`, `MillionaireQuestions.js`, `index.html`, `games/*`, `GameShell`, `GameHub`, `gameData`, backend, GameResults, `admin.html`.

## 6. DoD Checklist (§20)

Pre-game tampil ✅ · identitas dari session ✅ · mapel dari resolved source ✅ · mapel tak lengkap tak bisa mulai ✅ · mapel valid → set L1–L15 ✅ · Kembali ✅ · INTRO pintu masuk ✅ · FSM utuh ✅ · timer/lifeline/timeout/walk-away tak regresi ✅ · desktop+HP responsif ✅ · 17 game utuh ✅.

## 7. Catatan jujur / residual

1. **Kelas siswa tidak ada di sumber data** (sheet Siswa: `nisn+name`; tidak ada `kelas` di `index.html`/`code.gs`). Baris kedua kartu menampilkan `kelas` bila suatu saat tersedia, bila tidak menampilkan teks netral `Kontestan SI-PANDA` — tidak memfabrikasi data, tidak membuat sumber baru (sesuai larangan spec).
2. `onReplay` (Main Lagi) me-remount → gate tampil lagi (sesi baru = alur kontestan baru). Dipertahankan sebagai perilaku konsisten yang paling sederhana.

## 8. Final Status

### `PHASE 07 PASS`

> **STOP.** Harness (`_phase07_harness.html`) dihapus; server QA dimatikan; tidak ada pekerjaan engine/backend/skin lain.
