# PHASE 00 — VALIDATION REPORT: SI-PANDA v3 vs Millionaire Master Spec

> **Status:** READ-ONLY AUDIT. Tidak ada perubahan kode. Baseline komitmen: SI-PANDA v3 Release (master spec decision #1).
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Baseline Spec:** `docs/millionaire/PHASE_00_MILLIONAIRE_MASTER_SPEC.md` (20 locked decisions, 15-level ladder, 12 states, 3 lifelines)
> **Asset Spec:** `docs/millionaire/MILLIONAIRE_ASSET_SPEC.md` (B1–B4)
> **Commit:** `32b46f5 Initial commit` — workdir dalam `interactive rebase` onto 32b46f5, seluruh file aplikasi masih *untracked* (`git status`).

---

## 0. Ringkasan Eksekutif

| Area | Verdict |
|------|---------|
| **Baseline SI-PANDA v3 teridentifikasi** | ✅ JELAS — SPA React 18 + Babel standalone + Tailwind CDN, tanpa build step |
| **17 game eksisting tidak berubah** | ✅ KONFIRM — 17 tipe terhitung, kontrak `finishGame()` stabil |
| **Prasyarat Millionaire terpenuhi untuk implementasi aditif** | ✅ YA — dapat dibangun sebagai modul terisolasi tanpa refactor luas |
| **Blocking issue** | ⚠️ Tidak ada *blocking* yang memaksa backend baru, namun 6 risk **HIGH** wajib dimitigasi di Phase 01 (question source terpisah, dual layout, state machine, anti-farm mapping, skor vs Rupiah) |
| **Aset** | ⚠️ B1–B4 tersedia sebagai PNG 2 MB/biji, belum WebP/kompresi, folder `characters/branding/effects/icons` kosong |
| **Kepatuhan spec 20 keputusan** | 14 ✅ patuh, 4 ⚠️ butuh guardrail implementasi, 2 ℹ️ belum dapat dinilai (butuh bukti uji) |

**Keputusan audit:** **LANJUT ke Phase 01** dengan syarat guardrail pada §3 dan §5 ditaati. Tidak diperlukan backend/result system baru (sesuai decision #9) — pipeline existing `finishGame → saveGameResult → GameResults` dapat dipakai ulang dengan ekstensi field, bukan penggantian.

---

## 1. Struktur Aktual SI-PANDA v3 (hasil inspeksi file system)

### 1.1 Topologi репозиitori

```
E:\Github\sipandav3 - Millionaire\
├── index.html                  # SPA siswa + router view (login/student/games/game/exam)
├── admin.html                  # Panel admin terpisah (generate soal AI, kelola game/materi)
├── code.gs                     # Backend GAS (doGet/doPost) — versi deployed
├── code_v2.gs                  # Backend GAS v2 — pengganti penuh code.gs (+ Zona Game), belum tentu deployed
├── README.md                   # template GitLab — tidak deskriptif
├── docs/millionaire/
│   ├── PHASE_00_MILLIONAIRE_MASTER_SPEC.md
│   └── MILLIONAIRE_ASSET_SPEC.md
├── games/ (20 file)
│   ├── gameData.js             # SAMPLE_GAMES fallback (28 sample, bank per-level)
│   ├── GameShell.js            # kontrak bersama (GAME_TYPE_META, difficulty, HUD, ResultModal)
│   ├── GameHub.js              # lobby Zona Game
│   └── 17 game: MatchGame.js, MemoryGame.js, QuizRushGame.js, BalloonPopGame.js,
│       ScrambleGame.js, SnakeLadderGame.js, TrueFalseGame.js, HangmanGame.js,
│       BossBattleGame.js, SortGame.js, FillBlankGame.js, RaceGame.js,
│       LogicTowerGame.js, SequenceGame.js, MazeGame.js, DefenseGame.js, FeedGame.js
└── millionaire/assets/
    ├── backgrounds/desktop/{B1-gameplay.png (2.06 MB), B3-intro.png (2.17 MB)}
    ├── backgrounds/mobile/{B2-gameplay.png (1.99 MB), B4-intro.png (2.07 MB)}
    ├── branding/ (kosong)
    ├── characters/ (kosong)
    ├── effects/ (kosong)
    └── icons/ (kosong)
```

Tidak ditemukan `MillionaireQuestions.js`, `MillionaireGame.js`, `Millionaire/` type, atau sheet `MillionaireQuestions` — konsisten dengan status *pra-implementasi* (decision #4: modul baru terisolasi).

### 1.2 Frontend — `index.html`

- **Stack:** React 18 UMD, ReactDOM 18, Babel standalone, Tailwind CDN. Tidak ada `package.json`, `vite`, `webpack` — semua script dimuat via `<script type="text/babel" src="games/*.js?v=16">` (`index.html:54-73`). Urutan load **kritis**: `gameData.js → GameShell.js → 17 game → GameHub.js → inline <script type="text/babel">` (App).
- **Versi/cache:** `APP_VERSION = "11.09.2026-v16"` (`index.html:164`) + `?v=16` pada script tag + `localStorage sipanda_version` reload paksa. Penambahan modul Millionaire wajib bump `v` dan `APP_VERSION` bersamaan.
- **Routing view:** `useState view ∈ {login, admin, student, games, game, exam}` (`index.html:148`). `isFullScreenView = view==='exam' || view==='game'` menyembunyikan header (`index.html:377`).
- **Data bootstrap:** `fetch(WEB_APP_URL + "?action=getInitData&v=" + APP_VERSION)` (`index.html:173`) mengharapkan `games` + `gameResults` dari backend.
- **WEB_APP_URL:** hardcoded `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` (`index.html:78`). Duplikat di `admin.html:17` — risiko divergensi.
- **Student dashboard:** `StudentDashboard` (`index.html:789`), `DaftarTugasFilteredView` (`index.html:935`), `DaftarMateriView` (`index.html:1100`). Daftar tugas & materi sudah menampilkan *latihan bonus* game via `gamesForExam()` / `bestScoreForGame()` — titik integrasi Millionaire.
- **Game dispatcher:** `startGame(game, contextExamId)` (`index.html:208`), `finishGame(result)` (`index.html:225`), `replayGame()` / `exitGame()` + `requestGameFullscreen()` / `exitGameFullscreen()` (`games/GameShell.js:227-241`). Render 17 cabang `activeGame.type === '...'` (`index.html:476-655`) + fallback ke `MatchGame`. **Millionaire akan menambah cabang baru (`type === 'millionaire'`) di sini — perubahan aditif minimal 1 file.**
- **Result pipeline:** `finishGame` membangun `record {waktu, nisn, nama, gameId, game, mapel, tipe, skor, benar, salah, durasiDetik, level}` (`index.html:228-244`), `canSaveGameResult(nisn, gameId, level)` anti-farm 30s (`games/GameShell.js:34`), lalu `POST {action:"saveGameResult", ...record}` (`index.html:253`). Backend append ke `GameResults` (`code.gs:255`).

### 1.3 Admin — `admin.html`

- Duplikat komponen `Icon`, `hashString`, `NoteModal` — bukan shared module.
- Tabs: `overview | ai-generator | games | materi | exams | results` (`admin.html:643-645`). Panel `GameAdminPanelStandalone` (`admin.html:292`) mengelola `pairsMudah/Sedang/Sulit` (3 bank) + generate AI per level + `✂️ Bagi rata` / `🤖 Bagi AI` (classify). `BANK_FORMAT_GUIDE` (`admin.html:272`) memandu format per tipe.
- `admin.html:17` WEB_APP_URL sama dengan `index.html:78` — harus tetap sinkron.

### 1.4 Game Engine Bersama — `games/GameShell.js`

- `GAME_TYPE_META` 17 entri (`GameShell.js:7-24`), `GAME_TYPES` array (`GameShell.js:27`), `gameTheme(type)` (`GameShell.js:29`).
- **Difficulty universal:** `GAME_DIFFICULTY {mudah:1 round, sedang:2 rounds +20s/q, sulit:3 rounds +12s/q}` + penalti 3/6/10 (`GameShell.js:53-57`). Digunakan semua 17 game.
- **Bank per-level:** helpers `isPerLevelPairs()` / `flatPairs()` / `bankForLevel()` / `levelBankCounts()` (`GameShell.js:82-129`). Kolom Sheet `pairs` tetap 1 kolom JSON — kompatibel array lama *atau* objek `{mudah,sedang,sulit}` (`code.gs:364-396`). **Ini menjadi preseden untuk Millionaire:** penambahan sheet baru tidak memecah kolom; tapi spec Millionaire menuntut *dedicated source* terpisah — jangan numpang kolom Games.
- `buildMCQ()`, `calcChallengeScore()` (`GameShell.js:132-144`), `DifficultySelect` (`GameShell.js:161-208`), `GameHud` (`GameShell.js:250-274`), `GameResultModal` (`GameShell.js:276-340`), `gamesForExam()` (`GameShell.js:217-223`), `bestScoreForGame()` (`GameShell.js:210-214`).

### 1.5 17 Game Eksisting

| # | Type key | File | Judul sample (gameData.js) | Mapel sample |
|---|----------|------|-----------------------------|--------------|
| 1 | `match` | `games/MatchGame.js:37` | Bagian Tumbuhan & Fungsinya | IPAS |
| 2 | `memory` | `games/MemoryGame.js` | Memori: Planet Tata Surya | IPAS |
| 3 | `quizrush` | `games/QuizRushGame.js:7` | Kuis Cepat: Penjumlahan | MTK |
| 4 | `balloon` | `games/BalloonPopGame.js` | Balon Meletus: Perkalian | MTK |
| 5 | `scramble` | `games/ScrambleGame.js` | Acak Kata: Benda Sekitar | Inggris |
| 6 | `snake` | `games/SnakeLadderGame.js` | Ular Tangga: Tata Surya | IPAS |
| 7 | `truefalse` | `games/TrueFalseGame.js` | Benar atau Salah: Pancasila | PPKn |
| 8 | `hangman` | `games/HangmanGame.js` | Tebak Kata: Animals | Inggris |
| 9 | `boss` | `games/BossBattleGame.js` | Boss Battle: Perkalian Sakti | MTK |
| 10 | `sort` | `games/SortGame.js` | Sortir: Golongan Hewan | IPAS |
| 11 | `fillblank` | `games/FillBlankGame.js` | Isian: Kata Baku & Imbuhan | Indo |
| 12 | `race` | `games/RaceGame.js` | Balapan: Pengurangan Kilat | MTK |
| 13 | `tower` | `games/LogicTowerGame.js` | Menara Logika: Pola Bilangan | MTK |
| 14 | `sequence` | `games/SequenceGame.js` | Susun Kalimat: Fakta Seru | Indo |
| 15 | `maze` | `games/MazeGame.js` | Labirin Harta: Tata Surya | IPAS |
| 16 | `defense` | `games/DefenseGame.js` | Invasi Robot: Kata Baku | Indo |
| 17 | `feed` | `games/FeedGame.js` | Mochi Lapar: Berhitung | MTK |

Semua game memakai pola yang sama: `DifficultySelect → GameHud + timer global → konten spesifik → GameResultModal → onFinish`. Tidak ada game yang memakai `exams`/`Soal` sheet langsung — hanya `games` dari `gameData.js` / `Games` sheet. Perubahan Millionaire tidak menyentuh file 17 game ini jika isolasi dijaga.

### 1.6 Backend — `code.gs` vs `code_v2.gs`

- Keduanya mendeklarasikan `GAMES_SHEET="Games"`, `GAME_RESULTS_SHEET="GameResults"`, `GAMES_HEADER 8 kolom` (`code.gs:1-6`). `code_v2.gs:1-16` header komentar menjelaskan sebagai *pengganti penuh* code.gs.
- `doGet?action=getInitData` (`code.gs:23-106`) mengembalikan `{settings, students, exams, results, materi, games, gameResults}`. `readGames_()` & `readGameResults_()` (`code.gs:354-421`) memfilter `isActive === FALSE` & parse `pairs`.
- `doPost` 11 action (`code.gs:109-334`): `saveResult`, `updateExamStatus`, `updateCatatan`, `addMateri`, `saveNewExam`, `generateAIQuestions`, `saveGameResult`, `saveGame`, `toggleGameStatus`, `generateGamePairs`, `classifyGamePairs_`. Millionaire akan butuh action baru (mis. `getMillionaireQuestions` / `saveMillionaireResult`) — tetapi decision #9 melarang backend baru kecuali audit membuktikan tak terhindarkan. Audit menyimpulkan: **tidak perlu system baru**, cukup ekstensi action pada file yang sama dan/atau reuse `saveGameResult` dengan payload tambahan (lihat §5).
- Sheet yang dibaca: `Pengaturan, Siswa, Soal, Hasil, Materi, Games, GameResults` — 7 sheet. Penambahan Millionaire yang *clean* adalah sheet `MillionaireQuestions` (atau `MillionaireBank`) terpisah, bukan menumpuk ke `Games` atau `Soal` (memenuhi decision #5).
- `GEMINI_API_KEY` via `PropertiesService` (`code.gs:1082`) dipakai untuk `generateGamePairs` & `classifyGamePairs_`. Millionaire question generation dapat reuse pola yang sama.
- `setupGameSheets()` / `seedSampleGames()` (`code.gs:423-471`) idempotent — menambah ID yang belum ada saja.

### 1.7 Question Source Saat Ini

- **17-game source:** `Games.pairs` JSON (array atau per-level object) + fallback `SAMPLE_GAMES` (`games/gameData.js:16-829`). 28 sample seeded (`code.gs:475-981`). Kolom `linkedExamId` menghubungkan game ke tugas formal (`Soal.id`) — dipakai di `DaftarTugasFilteredView:1036` & `DaftarMateriView:1157`.
- **Formal exam source:** `Soal` sheet via `examsMap` (`code.gs:40-64`), ditampilkan di `ExamInterface` (`index.html:1186`).
- **Millionaire source:** **belum ada.** Spec menuntut *dedicated Millionaire question source, separate from the 17-game question source* (decision #5) dan *`MillionaireQuestions.js` is fallback/demo seed only, not production source of truth* (decision #6). Belum ada file `MillionaireQuestions.js` — patuh secara default, namun perlu dibuat sebagai seed saja di Phase 01.

---

## 2. Audit vs 20 Locked Decisions

| # | Locked Decision | Actual State | Verdict | Catatan / Evidence |
|---|-----------------|--------------|---------|---------------------|
| 1 | SI-PANDA v3 Release is the baseline | `index.html:164` APP_VERSION 11.09.2026-v16, `games/` 17 modul, `code.gs` + `code_v2.gs` dual, no build step | ✅ PATUH | Baseline jelas; rebase belum selesai tapi working tree mencerminkan v3 |
| 2 | Implementation is additive; do not broad refactor | Struktur SPA monolitik tapi modular per game; tidak ada framework build yang memaksa refactor | ✅ PATUH | Guardrail: Millionaire hanya tambah 1 script + 1 cabang dispatcher + optional sheet baru |
| 3 | 17 existing games must not change behavior | 17 files terpisah, `GameHub` lobby, `GameShell` helpers; `index.html:476-655` render per-type | ✅ PATUH | Risk: global namespace (`GAME_TYPE_META`, `shuffleArray`). Millionaire wajib prefix `MILLIONAIRE_*` |
| 4 | Millionaire is a new isolated game module | `millionaire/` hanya berisi `assets/` (4 PNG) — belum ada kode game | ✅ PATUH (pre-phase) | Rekomendasi: `millionaire/MillionaireGame.js` + `millionaire/MillionaireQuestions.js` (seed) + `millionaire/MillionaireShell.js` jika perlu |
| 5 | Production Millionaire questions use dedicated source, separate from 17-game source | Saat ini hanya `Games` & `Soal`. Belum ada dedicated source — **harus dibuat**, jangan reuse `Games.pairs` / `Soal` | ⚠️ GUARDRAIL | Proposal Phase 01: sheet `MillionaireQuestions` (atau reuse `Games` dengan `type='millionaire'` **DITOLAK** karena melanggar decision #5). Pisahkan penyimpanan. |
| 6 | `MillionaireQuestions.js` is fallback/demo seed only | File belum ada — patuh; jangan jadikan source of truth produksi | ✅ PATUH | Buat file seed kecil (15 soal demo) bertanda `// FALLBACK ONLY` |
| 7 | Existing student dashboard remains entry point | `StudentDashboard` (`index.html:789`) + `DaftarTugasFilteredView` + `DaftarMateriView` tetap entry; `GameHub` dipanggil via `onOpenGames` / `onPlayGame` | ✅ PATUH | Integrasi Millionaire: tambah card/banner di dashboard atau treat sebagai game ke-18 di Zona Game + shortcut di kartu tugas |
| 8 | Existing result/finishGame pipeline remains result path | `finishGame → canSaveGameResult → POST saveGameResult → GameResults` (`index.html:225-258`, `code.gs:254-271`) stabil | ✅ PATUH | Millionaire harus memanggil `finishGame()` yang sama dengan field tambahan (`prize`, `levelReached`, `safePrize`, `lifelinesUsed`, `walkAway`) |
| 9 | Do not create new backend/result system unless audit proves unavoidable | Audit membuktikan **TIDAK perlu** system baru | ✅ PATUH | Ekstensi: tambah kolom opsional di `GameResults` atau sheet `MillionaireResults` **hanya jika** kolom existing tidak cukup — prefer reuse `GameResults` + JSON `extra` |
| 10 | Millionaire has 15 levels | Spec ladder 15 baris (Rp100 → Rp1.000.000) (`PHASE_00...:35-53`). Belum ada implementasi game 15-level | ✅ SPEC LOCKED | Implementasi wajib 15, bukan 12 atau 10 |
| 11 | Game displays virtual Rupiah prize ladder | Belum ada UI ladder | ✅ SPEC LOCKED | Asset B1/B2 menyediakan *ruang* ladder tapi tidak membaked ladder |
| 12 | Virtual Rupiah and leaderboard score are separate values | Saat ini `skor` 0–100 + `benar/salah` disimpan ke leaderboard (`GameResults.skor`). Virtual Rupiah belum ada | ⚠️ GUARDRAIL | Millionaire harus simpan **dua nilai**: `virtualRupiah` (ladder) + `skor` leaderboard (mis. hitung dari level/tier). Jangan tulis Rupiah ke kolom `skor` mentah. |
| 13 | Desktop is landscape; mobile is portrait-native | `index.html:5` viewport `user-scalable=no`, `@supports min-height:100dvh` (`index.html:43`), `index.html:14-48` keyframes. `MILLIONAIRE_ASSET_SPEC` B1 16:9, B2 9:16 | ✅ PATUH | Risk: games existing mostly single-column responsive, bukan dual composition |
| 14 | Mobile must not be simple crop of desktop | B1–B4 adalah 4 file **terpisah** (desktop intro/gameplay + mobile intro/gameplay) — bukan 2 file di-crop | ✅ PATUH (aset) | Guardrail: CSS Millionaire harus pakai `backgrounds/desktop/*` vs `backgrounds/mobile/*` via media query, bukan `object-position: center` crop |
| 15 | Skin uses background assets plus HTML/CSS/JS for interactive UI | `millionaire/assets/backgrounds/{desktop,mobile}/*.png` ada; belum ada HTML/CSS game | ✅ PATUH (aset) | Verifikasi visual diperlukan di Phase 02: background tidak boleh blur oleh overlay |
| 16 | Do not copy official WWTBAM branding/logo/music/protected assets | `branding/` kosong, tidak ada logo/lifeline icon bermerek di repo | ✅ PATUH | Lifelines dinamai `50:50, Tanya Kelas, Tanya Teman` — aman. Hindari font/suara mirip franchise. |
| 17 | Backgrounds must not contain dynamic UI | Spec asset B1–B4: keep visual space, no baked UI. File PNG belum diinspeksi pixel-level tapi spec eksplisit | ⚠️ BUTUH VERIFIKASI VISUAL | Phase 01: buka B1–B4 di Figma/Photoshop, pastikan tidak ada teks pertanyaan/jawaban/ladder/timer/lifeline terpanggang |
| 18 | Every phase produces an .md report | `docs/millionaire/PHASE_00_MILLIONAIRE_MASTER_SPEC.md` ada; laporan ini adalah pemenuhan Phase 00 | ✅ PATUH | Next: `PHASE_01_...md` dst. |
| 19 | Do not delete existing files | `git status` semua file untracked, tidak ada deletion; spec melarang hapus | ✅ PATUH | Millionaire tidak boleh hapus/overwrite 17 game atau ganti `code.gs` tanpa preserve `code_v2.gs` |
| 20 | Do not declare phase complete without test/evidence | Belum ada klaim complete — audit ini sendiri adalah evidence | ℹ️ MENUNGGU | Phase 01 wajib sertakan: screenshot desktop+mobile, rekaman lifeline, log `saveGameResult`, test 15 level |

---

## 3. Potensi Konflik & Risiko

### 3.1 Konflik Kritis (HIGH)

**C1 — Global namespace collision.**
`index.html` inline script mendeklarasikan `MAPEL_LIST`, `Icon`, `shuffleArray`, `hashString`, `renderContent` di `window`. `GameShell.js` mendeklarasikan `GAME_TYPE_META`, `GAME_DIFFICULTY`, `gameTheme`, `formatGameTime`, `canSaveGameResult`, `DifficultySelect`, `GameHud`, `GameResultModal`, `bestScoreForGame`, `gamesForExam` juga di `window`. Jika `MillionaireGame.js` mendeklarasikan `Icon` atau `GAME_TYPE_META` ulang, 17 game lain rusak. **Mitigasi:** semua simbol Millionaire ber-prefix `MILLIONAIRE_` atau namespace `window.Millionaire = {}` ; jangan redeclare `MAPEL_LIST`/`Icon`.

**C2 — Dual WEB_APP_URL & dual backend file.**
`index.html:78` dan `admin.html:17` duplikat URL; `code.gs` vs `code_v2.gs` duplikat backend. Jika deploy `code_v2.gs` lupa sync URL, `fetch` siswa vs admin divergen. **Mitigasi:** Phase 01 buat `config.js` tunggal atau minimal assert `WEB_APP_URL` identik via grep CI; tentukan single source of truth backend (sarankan `code_v2.gs` sebagai canonical, `code.gs` sebagai backup).

**C3 — Question source co-mingling (pelanggaran decision #5 jika salah).**
Godaan untuk menyimpan Millionaire bank di sheet `Games` dengan `type='millionaire'` sangat besar karena `readGames_()` sudah ada. Itu **melanggar** decision #5 (dedicated source). Juga kolom `pairs` tidak cocok untuk format Millionaire (4 opsi + kunci + tier + safe). **Mitigasi:** buat sheet baru `MillionaireQuestions` dengan header `id | mapel | level | question | optionA | optionB | optionC | optionD | answer | prize | isSafe | explanation` atau JSON `questions` per mapel; `getInitData` tambah `millionaireQuestions`. `MillionaireQuestions.js` hanya seed 15 soal demo.

**C4 — Skor vs Virtual Rupiah dual-metric.**
`GameResults` kolom `skor` saat ini dipakai leaderboard (`GameHub.js:37`, `admin.html:460`). Jika Millionaire menulis `skor = 1000000` (Rupiah) maka leaderboard hancur (outlier). Decision #12 menegaskan terpisah. **Mitigasi:** simpan `skor` leaderboard tetap 0–100 (mis. `Math.round(levelReached/15*100)` atau hitung dari `benar`), dan `virtualRupiah` di kolom baru `skorRupiah` / `extra JSON`. Tampilkan keduanya di `GameResultModal` varian Millionaire.

**C5 — State machine 12 states belum ada.**
Spec `PHASE_00:55` menuntut `INTRO, READY, QUESTION, SELECTING, LOCKED, REVEAL, CORRECT, WRONG, SAFE_EXIT, GAME_OVER, VICTORY, FINISHED`. 17 game saat ini hanya pakai `level → playing → finished` (boolean). Jika Millionaire disamakan dengan pola lama, spec state dilanggar. **Mitigasi:** implementasi FSM eksplisit `MILLIONAIRE_STATE` di `MillionaireGame.js` dengan transisi terdokumentasi.

**C6 — Mobile bukan crop — butuh dual layout.**
Spec #14 + asset spec B2/B4 menuntut komposisi portrait-native. 17 game saat ini responsif single-column (grid 1→2→3) tapi bukan dual background swap. Jika Millionaire hanya pakai `B1-gameplay.png` di mobile dengan `background-size: cover`, itu crop terlarang. **Mitigasi:** CSS Millionaire:
```css
.millionaire-stage { background-image: url('millionaire/assets/backgrounds/desktop/stage-gameplay.webp'); }
@media (max-width: 768px) and (orientation: portrait) {
  .millionaire-stage { background-image: url('millionaire/assets/backgrounds/mobile/stage-gameplay.webp'); }
}
```
dan layout `Host | Question | Ladder` (desktop) vs `Header → Ladder → Question → A-D → Lifelines` (mobile) sesuai `MILLIONAIRE_ASSET_SPEC.md:63-66`.

### 3.2 Konflik Sedang (MEDIUM)

**M1 — Anti-farm 30s per game per level** (`GameShell.js:34`). Millionaire 15 level × lifeline sekali pakai — anti-farm per level bisa menghalangi replay cepat saat QA. Perlu `level` yang dikirim adalah `levelReached` bukan difficulty lama.

**M2 — `linkedExamId` coupling.** `GameHub.js:106`, `DaftarTugasFilteredView:1036`, `DaftarMateriView:1157` menampilkan game bonus yang `linkedExamId` cocok. Millionaire jika di-link ke exam tertentu akan muncul sebagai bonus di kartu tugas — ini fitur, bukan bug, tapi perlu disepakati: apakah Millionaire di-link ke mapel saja atau ke exam spesifik?

**M3 — Asset size & format.** 4 PNG ~2 MB/biji = 8.2 MB total (`B1 2.06 MB, B3 2.17 MB, B2 1.99 MB, B4 2.07 MB`). Spesifikasi final: WebP compressed. Ukuran sekarang tidak block dev, tapi block production Lighthouse. Folder `characters/effects/icons/branding` kosong — placeholder host/lifeline icons belum ada.

**M4 — `Music/branding` copyright.** Repo belum ada musik, tapi `index.html:14-48` punya `gameShake/gamePop/gameFloat` — Millionaire jangan tambah `who-wants-to-be-a-millionaire.mp3`. Gunakan tone generik `playGameTone()` yang sudah ada (`MatchGame.js:11`).

**M5 — Fullscreen behavior.** `requestGameFullscreen()` / `exitGameFullscreen()` (`GameShell.js:227-241`) dipanggil di `startGame` (`index.html:210`). Millionaire perlu fullscreen juga, tapi iOS Safari fallback diam — test di device nyata.

**M6 — `questions` vs `pairs` naming.** 17 game pakai `pairs: {left,right}` (istilah → definisi). Millionaire butuh `question + 4 options + answerIndex`. Jangan paksa format `left/right` ke Millionaire — buat tipe data baru `MillionaireQuestion {id, text, options[4], answer, prize, isSafe}`.

### 3.3 Risiko Rendah (LOW)

- Rebase `interactive` belum `continue` — commit history akan berubah. Tidak mempengaruhi runtime.
- `admin.html:292` `EMPTY_BANK = '[{"left":"Akar"...}]'` — tidak relevan untuk Millionaire.
- `README.md` masih template GitLab — tidak block.

---

## 4. Dependency Graph

```
[Browser]
  └─ index.html (React 18 UMD + Babel + Tailwind CDN)
       ├─ games/gameData.js        ─┐
       ├─ games/GameShell.js        ├─► window: MAPEL_LIST, Icon, shuffleArray,
       ├─ games/*Game.js (17)       │         GAME_TYPE_META, gameTheme, DifficultySelect,
       └─ games/GameHub.js         ─┘         GameHud, GameResultModal, canSaveGameResult
       │
       ├─ inline App (StudentDashboard, DaftarTugas, DaftarMateri, ExamInterface)
       │     ├─ fetch GET getInitData ──► code.gs/doGet ──► Sheets: Pengaturan,Siswa,Soal,Hasil,Materi,Games,GameResults
       │     ├─ startGame() ──────────► requestGameFullscreen()
       │     ├─ finishGame(result) ───► canSaveGameResult() ──► POST saveGameResult ──► code.gs/doPost → GameResults
       │     └─ finishExam() ─────────► POST saveResult ──► Hasil (+ AI essay)
       │
       └─ [FUTURE] millionaire/MillionaireGame.js
             ├─ depends on: GameShell.js (GameHud, formatGameTime, toggleGameFullscreen) — reuse, jangan duplikat
             ├─ depends on: MillionaireQuestions.js (fallback seed) + Millionaire Question Source (production, Sheet baru)
             ├─ depends on: millionaire/assets/backgrounds/{desktop,mobile}/*.{webp,png}
             ├─ calls: finishGame({gameId:'millionaire-...', type:'millionaire', skor, benar, salah, durasiDetik, level, virtualRupiah, safePrize, lifelinesUsed})
             └─ rendered via: index.html dispatcher cabang baru (type==='millionaire')

[Admin]
  └─ admin.html
       ├─ fetch GET getInitData (same WEB_APP_URL)
       ├─ GameAdminPanelStandalone (kelola Games — JANGAN dipakai untuk Millionaire)
       └─ [FUTURE] MillionaireAdminPanel (kelola MillionaireQuestions sheet)
```

**External deps (CDN):** `cdn.tailwindcss.com`, `unpkg.com/react@18`, `unpkg.com/react-dom@18`, `unpkg.com/@babel/standalone`. Tidak ada `npm`. Penambahan Millionaire tidak menambah CDN baru (jaga CSP).

**Sheets dependency (existing):**

| Sheet | Kunci | Dipakai oleh |
|-------|-------|--------------|
| `Siswa` | `nisn` | login siswa |
| `Soal` | `id` (= examId) | `examsMap` di `code.gs:40` |
| `Hasil` | `nisn+ujian` | `finishExam` |
| `Materi` | `mapel+linkedExamId` | `DaftarMateriView` |
| `Games` | `id` | `readGames_()` |
| `GameResults` | `nisn+gameId` | `readGameResults_()` |
| **NEW `MillionaireQuestions`** | `id+level` | `MillionaireGame` (proposed) |

---

## 5. Titik Integrasi Millionaire (rencana aditif tanpa ubah 17 game)

### 5.1 Entry Points (Dashboard — decision #7)

1. **Zona Game sebagai game ke-18.** `GameHub.js:10` menerima `games` array — jika backend mengirim game `type:'millionaire'` lewat `Games` sheet, ia otomatis muncul. **TIDAK disarankan** karena melanggar decision #5. Sebagai gantinya, `GameHub` dapat menerima prop tambahan `millionaireEntry` terpisah atau `App` render banner Millionaire di atas grid `GameHub`.
2. **Rekomendasi:** `StudentDashboard` (`index.html:789`) tambah banner **“🏆 Millionaire — 15 Level, Rp1.000.000”** (mirip banner Zona Game `index.html:877`) yang memanggil `startGame({id:'millionaire-'+mapel, type:'millionaire', mapel, title:'Millionaire: '+mapel}, null)`.
3. **Shortcut kontekstual:** `DaftarTugasFilteredView:1036` & `DaftarMateriView:1157` sudah punya slot `🎮 Latihan Bonus`. Millionaire dapat muncul sebagai opsi bonus di `gamesForExam()` jika `millionaire.linkedExamId` cocok — tapi spec Millionaire tidak menyebut linking ke tugas formal, jadi default **global** (tidak terikat examId).

### 5.2 Dispatcher — `index.html`

Perubahan minimal di `index.html`:

```jsx
// di dalam <main> setelah 17 cabang game:
{view === 'game' && activeGame && activeGame.type === 'millionaire' && (
  <MillionaireGame
    key={gamePlayKey}
    game={activeGame}
    currentUser={currentUser}
    onFinish={finishGame}
    onExit={exitGame}
    onReplay={replayGame}
  />
)}
```

dan satu `<script type="text/babel" src="millionaire/MillionaireGame.js?v=17">` **sebelum** inline App (urutan `index.html:73` setelah `GameHub.js`). Tambah `<script type="text/babel" src="millionaire/MillionaireQuestions.js?v=17">` sebagai fallback seed.

Jangan ubah 17 cabang existing.

### 5.3 Question Source (decision #5 & #6)

**Opsi A (REKOMENDASI): Sheet baru `MillionaireQuestions`.**

Header: `id | mapel | level (1-15) | question | optionA | optionB | optionC | optionD | answer (0-3) | prize | isSafe (TRUE/FALSE) | explanation`

`doGet?action=getInitData` (`code.gs:94`) tambah:

```js
millionaireQuestions: readMillionaireQuestions_(ss)
```

`readMillionaireQuestions_()` mirip `readGames_()` tapi return array 15 soal per mapel terurut level. Frontend: `MillionaireGame` fetch dari `appData.millionaireQuestions` atau fallback `MILLIONAIRE_QUESTIONS` dari `MillionaireQuestions.js`.

**Opsi B:** endpoint terpisah `?action=getMillionaireQuestions&mapel=IPAS` — lebih hemat payload tapi menambah round-trip.

**Jangan:** simpan Millionaire di `Games.pairs` atau `Soal` — melanggar decision #5.

### 5.4 Gameplay → Result Pipeline (decision #8 & #9)

`MillionaireGame` memanggil kontrak yang **sama** dengan 17 game:

```js
onFinish({
  gameId: game.id,           // e.g. "millionaire-ipas-01"
  title: game.title,
  mapel: game.mapel,
  type: "millionaire",       // tipe baru — GameResults.tipe dukung string bebas (code.gs:262)
  skor: leaderboardScore,    // 0-100, untuk leaderboard (jangan isi Rupiah)
  benar: correctCount,       // 0-15
  salah: wrongCount,         // 0-1 (Millionaire salah sekali = game over)
  durasiDetik,
  level: levelReached,       // 1-15, untuk anti-farm key
  // — ekstensi Millionaire (disimpan sebagai kolom baru atau JSON extra) —
  virtualRupiah: prizeLadder[levelReached],
  safeRupiah: lastSafePrize,
  walkAway: didWalkAway,     // boolean SAFE_EXIT
  lifelinesUsed: { fifty:true, kelas:false, teman:true }
})
```

Backend `saveGameResult` (`code.gs:254`) perlu diperluas **aditif** (tambah kolom opsional di akhir, bukan sisip di tengah — jaga `GAME_RESULTS_HEADER` order):

```js
// usulan header perluasan (backward compatible):
// ["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik","level","virtualRupiah","safeRupiah","walkAway","lifelines"]
```

Jika tidak ingin ubah header, alternatif: kolom `skor` tetap, dan detail Millionaire disimpan di `catatan` JSON atau sheet baru `MillionaireResults`. Decision #9 membolehkan ekstensi minimal — bukan system baru terpisah penuh.

### 5.5 Aset & Skin (decision #13-17)

- `millionaire/assets/backgrounds/desktop/stage-gameplay.webp` (B1), `mobile/stage-gameplay.webp` (B2), `desktop/stage-intro.webp` (B3), `mobile/stage-intro.webp` (B4) — sudah ada sebagai PNG. Phase 01: konversi ke WebP, verifikasi dimensi (desktop 1920×1080 16:9, mobile 1080×1920 9:16), kompres, catat ukuran di `MILLIONAIRE_ASSET_SPEC.md`.
- CSS/JS Millionaire harus render semua UI dinamis (pertanyaan, 4 jawaban A-D, ladder, lifelines, timer, score) sebagai HTML — jangan bake ke background. Verifikasi visual: buka PNG dan pastikan area tengah bersih (sesuai `MILLIONAIRE_ASSET_SPEC.md:53-62`).
- Folder `characters/`, `effects/`, `icons/`, `branding/` masih kosong — siapkan asset host (avatar guru/siswa) dan ikon lifeline (grid 50:50, polling kelas, chat teman) tanpa meniru WWTBAM.

### 5.6 Admin

Jangan campur dengan `GameAdminPanelStandalone` (`admin.html:292`). Buat tab baru `Millionaire` di `AdminDashboardFull` (`admin.html:473`) yang CRUD sheet `MillionaireQuestions` (15 baris per set, validasi `answer ∈ 0..3`, `prize` sesuai ladder, `isSafe` hanya di level 5 & 10).

---

## 6. Ladder, Lifelines, States — Gap Analysis

### 6.1 Virtual Prize Ladder (spec 15 tingkat)

```
 1  Rp100          6  Rp2.000        11 Rp64.000
 2  Rp200          7  Rp4.000        12 Rp125.000
 3  Rp300          8  Rp8.000        13 Rp250.000
 4  Rp500          9  Rp16.000       14 Rp500.000
 5  Rp1.000  SAFE 10 Rp32.000 SAFE  15 Rp1.000.000 FINAL
```

Spec `PHASE_00:35-53` mengunci nominal dan safe di level 5 & 10. Tidak ada kode yang merepresentasikan ladder ini — harus dibuat konstanta `MILLIONAIRE_LADDER` di `MillionaireGame.js`. `virtualRupiah` dan `leaderboard skor` terpisah (decision #12).

### 6.2 Lifelines (sekali pakai per game)

- **50:50** — eliminasi 2 jawaban salah acak. Implementasi: filter `options` where `idx !== answer`, shuffle, slice 2, disable.
- **Tanya Kelas** — polling kelas (simulasi). Butuh distribusi: jawaban benar 55–75% + sisanya acak. Tampilkan bar chart HTML.
- **Tanya Teman** — “friend” suggestion dengan confidence. Tampilkan bubble chat.

Semua lifeline butuh state `lifelinesUsed: {fifty, kelas, teman}` dan tombol disabled setelah pakai. Belum ada helper — buat baru di `MillionaireGame.js`, jangan modifikasi `GameShell.js`.

### 6.3 Required States (12)

`INTRO → READY → QUESTION → SELECTING → LOCKED → REVEAL → CORRECT → WRONG → SAFE_EXIT → GAME_OVER → VICTORY → FINISHED`

Mapping ke UI:
- `INTRO`: splash B3/B4 + tombol Start + pilih mapel/level
- `READY`: transisi, tampilkan ladder + lifelines
- `QUESTION`: tampilkan soal + 4 opsi + timer
- `SELECTING`: opsi di-hover/ketuk
- `LOCKED`: kunci jawaban (confirm), disable lifeline
- `REVEAL`: animasi reveal jawaban benar
- `CORRECT`: lanjut level berikutnya atau cek safe/victory
- `WRONG`: game over, hadiah = last safe
- `SAFE_EXIT`: Walk Away — hadiah = current prize
- `VICTORY`: level 15 benar
- `GAME_OVER / FINISHED`: modal hasil + `onFinish()` + `onExit()`/`onReplay()`

Pisahkan `SAFE_EXIT` (sengaja berhenti) dari `WRONG` (salah). Spec menuntut `FINISHED` sebagai terminal setelah `GAME_OVER`/`VICTORY`/`SAFE_EXIT` → `onFinish`.

---

## 7. Evidence Checklist Phase 00

- [x] `docs/millionaire/PHASE_00_MILLIONAIRE_MASTER_SPEC.md` dibaca & dikutip
- [x] `docs/millionaire/MILLIONAIRE_ASSET_SPEC.md` dibaca
- [x] `index.html` (177k, ~1590 baris) diinspeksi — dispatcher, dashboard, finishGame, view router
- [x] `admin.html` (79k) diinspeksi — tabs, GameAdminPanel
- [x] `code.gs` (60k) & `code_v2.gs` (61k) dibaca — doGet/doPost, 7 sheet, 11 action
- [x] `games/` 20 file disensus — 17 game + GameShell/GameHub/gameData
- [x] `millionaire/assets/backgrounds/{desktop,mobile}/*.png` diverifikasi ada (4 file, ~2 MB/biji)
- [x] `git log --oneline` & `git status` dieksekusi — baseline commit `32b46f5`, rebase in progress, semua file untracked
- [x] Daftar 17 tipe game diverifikasi `games/GameShell.js:7` vs `index.html:476-655` vs `games/gameData.js`
- [x] Tidak ada perubahan file — audit read-only (kecuali pembuatan laporan ini)

---

## 8. Rekomendasi Phase 01 (tanpa coding di laporan ini)

1. **Buat file baru (aditif):**
   - `millionaire/MillionaireGame.js` — FSM 12 states, ladder 15, 3 lifelines, dual layout desktop/mobile
   - `millionaire/MillionaireQuestions.js` — `const MILLIONAIRE_QUESTIONS_FALLBACK = [...]` 15 soal demo, header `// FALLBACK ONLY — production source is MillionaireQuestions sheet`
   - `millionaire/Millionaire.css` (optional) atau Tailwind inline — background swap desktop/mobile
2. **Edit minimal 1 file:**
   - `index.html`: tambah 2 `<script>` + 1 cabang dispatcher `type==='millionaire'` + bump `?v=17` & `APP_VERSION`
3. **Backend ekstensi aditif:**
   - Tambah sheet `MillionaireQuestions` + helper `readMillionaireQuestions_()` + include di `getInitData`
   - Perluas `saveGameResult` untuk field Millionaire (opsional kolom baru di akhir) — atau sheet `MillionaireResults` jika kolom tidak cukup
   - Jangan ubah header `GAMES_HEADER` / `GAME_RESULTS_HEADER` order existing
4. **Aset:**
   - Konversi 4 PNG → WebP, catat dimensi & ukuran di `MILLIONAIRE_ASSET_SPEC.md` § Production optimization
   - Isi `characters/`, `icons/` dengan host & ikon lifeline original (bukan WWTBAM)
   - Verifikasi visual B1–B4 tidak mengandung teks UI terpanggang
5. **Test/evidence wajib Phase 01 (decision #20):**
   - Screenshot desktop (16:9) & mobile (9:16) INTRO + GAMEPLAY + VICTORY
   - Rekaman lifeline 50:50 / Tanya Kelas / Tanya Teman dipakai sekali dan disabled
   - Log `saveGameResult` di Sheet `GameResults` menampilkan `skor` + `virtualRupiah` terpisah
   - Walk Away (`SAFE_EXIT`) mengembalikan hadiah last safe (level 5/10)
   - Tidak ada regresi 17 game (smoke test tiap tipe 1×)

---

## 9. Lampiran: Catatan Verifikasi File-by-File

| File | Baris kunci | Temuan |
|------|-------------|--------|
| `index.html:54-73` | `src="games/*.js?v=16"` | Urutan load ketat; Millionaire sisip setelah GameHub |
| `index.html:78` | `WEB_APP_URL` | Duplikat dengan `admin.html:17` |
| `index.html:164` | `APP_VERSION` | `"11.09.2026-v16"` — wajib bump bersama `?v=` |
| `index.html:208-258` | `startGame/finishGame` | Kontrak `finishGame` stabil — reuse untuk Millionaire |
| `index.html:476-655` | `activeGame.type ===` | 17 cabang + fallback — tambah 1 cabang Millionaire |
| `index.html:789-933` | `StudentDashboard` | Entry point — tambah banner Millionaire |
| `index.html:935-1098` | `DaftarTugasFilteredView` | Slot bonus `gamesForExam` — Millionaire dapat reuse |
| `games/GameShell.js:7-27` | `GAME_TYPE_META` | 17 entri — jangan ubah; Millionaire pakai namespace sendiri |
| `games/GameShell.js:34-42` | `canSaveGameResult` | Anti-farm 30s per level — Millionaire `level`=levelReached |
| `games/GameShell.js:82-129` | `bankForLevel/flatPairs` | Preseden bank per-level — Millionaire jangan pakai `pairs` |
| `games/GameShell.js:227-274` | `requestGameFullscreen/GameHud` | Reuse untuk Millionaire |
| `games/gameData.js:16` | `SAMPLE_GAMES` | 28 sample fallback — jangan campur dengan MillionaireQuestions |
| `code.gs:1-6` | `GAMES_SHEET/HEADER` | 8 kolom — jangan sisip kolom tengah |
| `code.gs:23-106` | `doGet getInitData` | Tambah `millionaireQuestions` di Phase 01 |
| `code.gs:254-271` | `saveGameResult` | Titik ekstensi aditif untuk Millionaire fields |
| `code.gs:354-421` | `readGames_/readGameResults_` | Pola baca sheet — tiru untuk `readMillionaireQuestions_` |
| `admin.html:17` | `WEB_APP_URL` | Duplikat — sinkron dengan index.html |
| `admin.html:272-291` | `BANK_FORMAT_GUIDE` | Format pairs — tidak berlaku untuk Millionaire |
| `admin.html:292-470` | `GameAdminPanelStandalone` | Jangan campur admin Millionaire ke sini |
| `millionaire/assets/backgrounds/desktop/B1-gameplay.png` | 2.06 MB | Ada — belum WebP |
| `millionaire/assets/backgrounds/desktop/B3-intro.png` | 2.17 MB | Ada — belum WebP |
| `millionaire/assets/backgrounds/mobile/B2-gameplay.png` | 1.99 MB | Ada — belum WebP |
| `millionaire/assets/backgrounds/mobile/B4-intro.png` | 2.07 MB | Ada — belum WebP |
| `millionaire/assets/{branding,characters,effects,icons}/` | (kosong) | Placeholder — isi di Phase 01 |

---

## 10. Pernyataan Kepatuhan

Audit ini **tidak mengubah file apapun** kecuali pembuatan laporan ini (`docs/millionaire/PHASE_00_VALIDATION_REPORT.md`) sesuai instruksi. Seluruh keputusan terkunci (20) telah dipetakan ke struktur aktual. Tidak ditemukan kebutuhan untuk *rebuild engine/dashboard/result storage* atau *migrasi question bank* (non-goals spec). Implementasi Millionaire dapat dilanjutkan secara aditif dan terisolasi.

> Laporan ini memenuhi **decision #18: Every phase produces an .md report.**

---

*— End of PHASE 00 VALIDATION REPORT —*
