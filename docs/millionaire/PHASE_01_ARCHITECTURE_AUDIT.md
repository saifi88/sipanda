# PHASE 01 — ARCHITECTURE & CONTRACT AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** ARCHITECTURE & CONTRACT ONLY — No implementation, no production code change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Input:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` (20 locked decisions) · `PHASE_01_ARCHITECTURE.md` (30 sections) · `PHASE_00_VALIDATION_REPORT.md` · `MILLIONAIRE_ASSET_SPEC.md`
> **Repository:** development copy `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5`, seluruh file aplikasi *untracked*, `git log --oneline --all: 32b46f5 Initial commit` (+ 2 rebase picks `aa5cde7` pending).
> **Metode:** read-only inspection terhadap file aktual; setiap klaim disertai `file:line` evidence. Tidak ada `npm`/`build` — verifikasi manual via `Read` + `bash Get-ChildItem/Select-String/git diff`.

---

## 1. Repository Architecture Findings

### 1.1 Topologi aktual (evidence dari `Get-ChildItem -Recurse`)

```
SI-PANDA-v3-MILLIONAIRE-DEV/
├── index.html (177.970 bytes)
├── admin.html (79.587 bytes)
├── code.gs (60.792 bytes)          # backend deployed (sebelum Zona Game) + sudah berisi Zona Game
├── code_v2.gs (61.757 bytes)       # file pengganti penuh code.gs — instruksi di header code_v2.gs:1-16
├── README.md (6.105 bytes, template)
├── docs/millionaire/
│   ├── PHASE_00_MILLIONAIRE_MASTER_SPEC.md
│   ├── PHASE_00_VALIDATION_REPORT.md
│   ├── PHASE_01_ARCHITECTURE.md
│   └── MILLIONAIRE_ASSET_SPEC.md
├── games/ (20 files)
│   ├── gameData.js (35.782 bytes) — SAMPLE_GAMES 28 entries fallback
│   ├── GameShell.js (23.302 bytes) — kontrak bersama
│   ├── GameHub.js (11.629 bytes) — lobby
│   └── 17 game files (9k–17k bytes each)
└── millionaire/
    └── assets/
        ├── backgrounds/desktop/{B1-gameplay.png (2.061.161), B3-intro.png (2.169.822)}
        ├── backgrounds/mobile/{B2-gameplay.png (1.986.816), B4-intro.png (2.068.563)}
        ├── branding/ (0 entries)
        ├── characters/ (0 entries)
        ├── effects/ (0 entries)
        └── icons/ (0 entries)
```

**Tidak ditemukan** di repo: `millionaire/MillionaireGame.js`, `millionaire/MillionaireQuestions.js`, `millionaire/millionaire.css`, sheet `MillionaireQuestions`, type `millionaire` di `GAME_TYPES`, namespace `SIPANDA_MILLIONAIRE`. Konsisten dengan status *pra-implementasi* — Phase 01 memang *architecture only*.

### 1.2 Stack & runtime model

- **Frontend:** Single-file SPA tanpa bundler — `index.html:8-11` memuat `cdn.tailwindcss.com` + `unpkg.com/react@18` + `react-dom@18` + `@babel/standalone`. Tidak ada `package.json`, `vite`, `webpack`.
- **Module loading:** 20× `<script type="text/babel" src="games/...?v=16">` (`index.html:54-73`) dieksekusi berurutan oleh Babel standalone di browser. Tidak ada ES `import`/`export`; semua simbol diekspos ke `window` (global namespace).
- **Backend:** Google Apps Script (`code.gs:1`, `code_v2.gs:1`) — `doGet`/`doPost` + `PropertiesService` untuk `GEMINI_API_KEY`.
- **Sheets (7 existing):** `Pengaturan, Siswa, Soal, Hasil, Materi, Games, GameResults` — diverifikasi via `code.gs:40,66,81,355,403` (`getSheetByName`).

### 1.3 Verifikasi 18 item kunci (ringkas; detail di §3–§10)

| # | Item (Phase 01 § enumerasi) | Finding | Evidence |
|---|---|---|---|
| 1 | Module boundary Millionaire | **BOUNDARY JELAS & KOSONG** — `millionaire/` hanya berisi `assets/` (4 PNG). Target boundary `millionaire/{MillionaireGame.js,MillionaireQuestions.js,millionaire.css,assets/*}` belum ada → isolasi terjaga, tidak ada leakage ke 17 game. | `millionaire/assets/*` 4 files; `Get-ChildItem millionaire -Recurse` |
| 2 | Canonical type `millionaire` | **BELUM ADA** — `games/GameShell.js:7-27` `GAME_TYPE_META` & `GAME_TYPES` hanya 17 entri, tidak mengandung `millionaire`. Fallback `gameTheme` return generic `🎲`. Wajib dikunci Phase 02. | `GameShell.js:7,27`, `index.html:646` fallback branch |
| 3 | Namespace strategy | **BELUM ADA** — tidak ada `window.SIPANDA_MILLIONAIRE` (`Select-String SIPANDA_MILLIONAIRE` → 0 hit). Seluruh game existing polusi global (`GAME_TYPE_META`, `GAME_TYPES`, `MAPEL_LIST`, `Icon`, `shuffleArray` di `window`). Strategi preferred `PHASE_01_ARCHITECTURE.md:257` belum diterapkan. | `GameShell.js:7`, `index.html:82,93,119` |
| 4 | Dedicated MillionaireQuestions source + fallback | **BELUM ADA SOURCE PRODUKSI** — `code.gs`/`code_v2.gs` tidak mengandung string `Millionaire`; tidak ada sheet `MillionaireQuestions`; tidak ada `MillionaireQuestions.js`. Spec decision #5/#6 & `PHASE_01_ARCHITECTURE.md:104,122` menuntut dedicated sheet + JS fallback — keduanya belum ada. | `Select-String -Path code.gs -Pattern Millionaire` → 0; `Get-ChildItem millionaire` |
| 5 | Question schema | **SCHEMA BELUM DIKUNCI DI REPO** — spec `PHASE_01_ARCHITECTURE.md:296` (10 fields) vs existing `Games.pairs {left,right}` & `Soal {id,title,duration,isActive,questions[{id,text,options[4],answer}]}` — keduanya tidak cocok untuk Millionaire (butuh `optionA-D, answer 0-3, prize, isSafe, explanation, level 1-15`). Validasi di repo tidak ada. | `code.gs:57-62`, `games/gameData.js:16`, `PHASE_01_ARCHITECTURE.md:296` |
| 6 | 15-level prize/safe contract | **KONTRAK TERKUNCI DI SPEC, TIDAK ADA DI KODE** — ladder 15 tingkat (`PHASE_00:35-53`) tidak direpresentasikan di repo (`Select-String Prize/Rp/ladder` → 0 di `code.gs`/`GameShell.js`). Tidak ada `PRIZE_LADDER`, `safe level 5/10` di kode. Wajib canonical tunggal di `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER`. | `PHASE_00:35-53`, `PHASE_01_ARCHITECTURE.md:368` |
| 7 | 12-state FSM | **TIDAK ADA DI KODE** — `INTRO..FINISHED` 12 states (`PHASE_00:55`) tidak ada di repo; 17 game pakai boolean `level → playing → finished` + `DifficultySelect`. Millionaire FSM harus eksplisit. | `GameShell.js:53-208` |
| 8 | 3 lifelines | **TIDAK ADA DI KODE** — `50:50 / Tanya Kelas / Tanya Teman` tidak ada implementasi/constant di repo. | `PHASE_00:60-66` |
| 9 | Score vs virtualRupiah | **DUAL METRIC BELUM ADA** — `GameResults: skor 0-100` (`code.gs:3`, `index.html:236`) dipakai leaderboard (`GameHub.js:21`, `admin.html:420`); tidak ada `virtualRupiah`/`safeRupiah` di kode. Decision #12 menuntut pemisahan. | `code.gs:3`, `GameShell.js:141` `calcChallengeScore` |
| 10 | Existing GameResults/result flow | **VERIFIKASI FLOW LENGKAP** — `finishGame → canSaveGameResult → POST saveGameResult → GameResults` konsisten (`index.html:225-258`, `code.gs:254-270`). 11 kolom header terkunci. | see §5 |
| 11 | Dashboard/dispatcher integration point | **POINT DITEMUKAN** — `StudentDashboard` (`index.html:789`), `DaftarTugasFilteredView:935`, `DaftarMateriView:1100`, `GameHub:10`, `startGame:208`, dispatcher 17 cabang `index.html:476-655` + fallback `MatchGame`. Titik sisip Millionaire jelas. | see §6 |
| 12 | Dedicated admin architecture | **BELUM ADA DEDICATED ADMIN** — `admin.html:292-470` `GameAdminPanelStandalone` kelola `Games.pairs` (17 game); `AdminDashboardFull:473` 6 tabs (`overview/ai-generator/games/materi/exams/results`) tanpa tab Millionaire. Spec menuntut panel terpisah. | `admin.html:643-648` |
| 13 | code.gs vs code_v2.gs deployment/source-of-truth | **UNRESOLVED HIGH — DUA FILE HAMPIR IDENTIK** — diff hanya komentar/header + minor formatting; fungsional identik. Tidak ada bukti deployment mana yang canonical. | `git diff --no-index code.gs code_v2.gs` (§3) |
| 14 | Script/CSS loading | **STRATEGI TERDETEKSI** — 20× `text/babel` + `?v=16` (`index.html:54-73`); tidak ada `millionaire.css`; `style` inline `index.html:13-48`. Dependency order kritis. | `index.html:54-73` |
| 15 | Desktop/mobile asset architecture & metadata B1–B4 | **4 ASSETS TERVERIFIKASI PIXEL-LEVEL** — PNG 1672×941 (desktop 16:9, 1.78) & 941×1672 (mobile 9:16, 0.56), ~2 MB/biji, Format24bppRgb, belum WebP, belum baked UI (spec-compliant). | `System.Drawing.Image` (§8) |
| 16 | Cache/version strategy | **STRATEGI TERDETEKSI TAPI FRAGILE** — `APP_VERSION "11.09.2026-v16"` + `?v=16` + `localStorage sipanda_version` hard reload (`index.html:164-171`); `WEB_APP_URL` duplikat di 2 file. | `index.html:78,164`, `admin.html:17` |
| 17 | Anti-farm/result integrity | **MEKANISME ADA, PERLU MAPPING** — `canSaveGameResult(nisn,gameId,level)` 30s (`GameShell.js:34`) + `localStorage sipanda_version`; `saveGameResult` tanpa server-side rate limit. Mapping `level` untuk Millionaire (1-15) berbeda dari difficulty existing. | `GameShell.js:34`, `index.html:247` |
| 18 | Namespace collision & integration risks | **RISIKO TINGGI TERIDENTIFIKASI** — global pollution di `window`; `GAME_TYPE_META` 17 entri; `WEB_APP_URL` duplikat; header `GAMES_HEADER` 8 kolom fixed; `GAME_RESULTS_HEADER` 11 kolom fixed. Semua risks dipetakan (§11). | see §7 |

**Kesimpulan §1:** Repository adalah SI-PANDA v3 murni tanpa Millionaire code. Semua boundary masih kosong → implementasi aditif Phase 02 dapat dilakukan tanpa refactor 17 game, dengan syarat 8 decisions (§12) dikunci dan 3 unresolved items (§13) diselesaikan sebelum coding.

---

## 2. Existing Integration Points

### 2.1 Frontend routing & views

- **App router:** `App()` (`index.html:146`) mengelola `view ∈ {login, admin, student, games, game, exam}` (`index.html:148`). `isFullScreenView = view==='exam'||view==='game'` menyembunyikan header (`index.html:377`). `loading` gate (`index.html:366-375`) menunggu `getInitData`.
- **Data bootstrap:** `fetch(WEB_APP_URL + "?action=getInitData&v=" + APP_VERSION)` (`index.html:173`) → `setAppData({settings,students,exams,results,materi,games,gameResults})` (`index.html:176-183`). Fallback `gamesList = appData.games?.length ? appData.games : SAMPLE_GAMES` (`index.html:161`) — perilaku fallback untuk Millionaire harus dibedakan (production sheet vs JS seed, bukan SAMPLE_GAMES).

### 2.2 Dashboard — existing entry point (decision #7, `PHASE_01_ARCHITECTURE.md:648`)

| View | Lokasi | Peran untuk Millionaire |
|------|--------|--------------------------|
| `StudentDashboard` | `index.html:789` | Card statistik 3 kolom + banner Zona Game `index.html:877` (`onOpenGames → setView('games')`). **Titik sisip:** tambah banner Millionaire `🏆 Millionaire — 15 Level, Rp1.000.000` di atas/bawah banner Zona Game, panggil `startGame({id:'millionaire-'+mapel, type:'millionaire', ...})`. |
| `DaftarTugasFilteredView` | `index.html:935` | Menampilkan `activeExams` + badge `ESSAY/PG` + status `Selesai/Belum`. Slot `🎮 Latihan Bonus` (`index.html:1036-1056`) via `gamesForExam(games, exam)` (`GameShell.js:217`). **Titik sisip:** jika Millionaire di-link ke exam, muncul di slot ini; default Millionaire global tidak terikat `linkedExamId` (keputusan Phase 02). |
| `DaftarMateriView` | `index.html:1100` | Grid materi PDF + tombol `Baca Materi` + `Kerjakan Soal` jika `linkedExamId`. Slot game bonus `index.html:1157-1175` filter `linkedExamId` atau `mapel`. |
| `GameHub` lobby | `games/GameHub.js:10` | Hero + filter mapel + grid cards + `bestScoreFor` + `scoreToStars`. Props: `games, gameResults, currentUser, exams, contextExamId, onPlay, onBack`. **Titik sisip:** opsi A — `GameHub` render banner Millionaire terpisah di atas grid; opsi B — `GameHub` terima `millionaireGames` terpisah (jangan campur ke `games` array untuk jaga decision #5). |

### 2.3 Game launcher/dispatcher

- **Launcher:** `startGame(game, contextExamId)` (`index.html:208-214`) → `requestGameFullscreen()` → `setActiveGame` → `setView('game')`. `replayGame:216` (bump `gamePlayKey`), `exitGame:219` (`exitGameFullscreen` → `setView('games')`).
- **Dispatcher:** 17 cabang eksplisit `activeGame.type === 'match'|...|'feed'` (`index.html:476-655`) + fallback `!['match',...,'feed'].includes(type) → MatchGame` (`index.html:646`). **Titik sisip Millionaire:** tambah 1 cabang:

  ```jsx
  {view==='game' && activeGame?.type==='millionaire' && (
    <MillionaireGame key={gamePlayKey} game={activeGame} currentUser={currentUser}
                     onFinish={finishGame} onExit={exitGame} onReplay={replayGame} />
  )}
  ```

  ditempatkan setelah 17 cabang, sebelum fallback. Perubahan 1 file, 1 cabang — aditif, tidak ubah 17 cabang existing.

### 2.4 Result contract helpers (reusable)

- `canSaveGameResult(nisn,gameId,level)` (`GameShell.js:34-42`): `localStorage` key `game_last_${nisn}_${gameId}_${level||'sedang'}` 30s. Dipanggil di `finishGame:247`.
- `calcChallengeScore(benar,total,salah,level)` (`GameShell.js:141`): `Math.round((benar/total)*100 - salah*penalty)` dengan `penalty 3/6/10` (`GameShell.js:53-57`).
- `GameHud` (`GameShell.js:250-273`), `GameResultModal` (`GameShell.js:276-340`), `DifficultySelect` (`GameShell.js:161-208`) — reusable untuk Millionaire (HUD variant ladder) tapi state internal Millionaire tidak boleh bergantung padanya.

### 2.5 Integration flow aktual vs target

```
Aktual (17 games):
Dashboard → GameHub/DaftarTugas → startGame({type:'match'|...}) → {GameShell helpers + gameData} → finishGame → canSaveGameResult → POST saveGameResult → GameResults → GameHub leaderboard

Target Millionaire (spec PHASE_01:68-71 + PHASE_00:70):
Dashboard → [Millionaire banner / GameHub banner] → startGame({type:'millionaire'}) → MillionaireGame → Millionaire Question Reader → (production MillionaireQuestions sheet || fallback MillionaireQuestions.js) → 15-level gameplay → finishGame (existing) → canSaveGameResult (existing, mapping level 1-15) → POST saveGameResult (existing, additive fields) → GameResults (+ virtualRupiah/safeRupiah)
```

Flow target kompatibel dengan infrastruktur existing; tidak ada engine rebuild.

---

## 3. Backend Source-of-Truth Finding

### 3.1 Dua file backend

| File | Ukuran | Header | Fungsi kunci | Evidence |
|------|--------|--------|--------------|----------|
| `code.gs` | 60.792 bytes | `GAMES_SHEET/GAME_RESULTS_SHEET/GAMES_HEADER` (`code.gs:1-6`) | `doGet` (`code.gs:8`), `doPost` 11 actions (`code.gs:109`), `readGames_/:readGameResults_/:getOrCreateSheet_` (`code.gs:340-421`), `setupGameSheets`/`seedSampleGames` (`code.gs:423-981`), AI helpers `generateQuestionsFromImages`/`classifyGamePairs_` | `Read code.gs` |
| `code_v2.gs` | 61.757 bytes | `// SI-PANDA BACKEND v2 ... pengganti penuh code.gs` (`code_v2.gs:1-16`) + sama `GAMES_SHEET`/`GAME_RESULTS_SHEET` | Identik `doGet`/`doPost`/`readGames_`/`readGameResults_` + komentar `[GAME-1]..[GAME-4]` | `Read code_v2.gs` |

**Diff aktual (`git diff --no-index code.gs code_v2.gs`):**

- Hanya perbedaan **komentar dokumentasi** dan whitespace/formatting (header v2 16 baris, komentar `[GAME-1]`–`[GAME-4]`, jsdoc `getOrCreateSheet_`, `readGames_`), tidak ada perbedaan logika bisnis, schema, atau action.
- `GAMES_HEADER` (`code.gs:6` vs `code_v2.gs:21`) identik 8 kolom `["id","type","mapel","title","duration","isActive","linkedExamId","pairs"]`.
- `GAME_RESULTS_HEADER` identik 11 kolom (`code.gs:3` vs `code_v2.gs:20`).
- `doGet:getInitData` keduanya return `{settings,students,exams,results,materi,games,gameResults}` (`code.gs:94-105` vs `code_v2.gs:109-121`).

### 3.2 Deployment truth — UNRESOLVED (HIGH)

- Tidak ada `appsscript.json`, `.clasp.json`, `deploymentId`, atau log deploy di repo. `WEB_APP_URL` hardcoded `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` identik di `index.html:78` dan `admin.html:17`, tapi tidak membuktikan file mana yang ter-deploy.
- Instruksi di `code_v2.gs:13-15` (“ganti seluruh isi Code.gs dengan isi file ini → Run setupGameSheets → Deploy New version”) mengimplikasikan `code_v2.gs` adalah *intended canonical*, tapi **intended ≠ deployed**.
- **Dampak untuk Millionaire:** penambahan helper `readMillionaireQuestions_()` / action `saveMillionaireResult` harus masuk ke file yang benar-benar ter-deploy, atau harus diduplikasi ke kedua file sementara sebelum canonicalization. Salah pilih → fitur Millionaire tidak ter-deploy di production.

### 3.3 Decision untuk Phase 02

- **Canonical sementara:** `code_v2.gs` sebagai *intended canonical* (karena dokumentasi eksplisit), `code.gs` dipertahankan sebagai backup.
- **Prasyarat Phase 02:** verifikasi deployment aktual (cek Apps Script dashboard → Executions / Deployments → bandingkan `doGet` response), lalu `CODE_CANONICAL.md` atau merge `code.gs ← code_v2.gs` + hapus duplikasi. Phase 01 tidak mengubah file (sesuai larangan).
- **Millionaire helper placement:** semua helper baru (`MILLIONAIRE_QUESTIONS_SHEET`, `MILLIONAIRE_RESULTS_*`, `readMillionaireQuestions_`, `getMillionaireQuestions`) wajib ditambahkan ke **kedua file** sampai canonical terkunci, atau eksklusif ke canonical setelah verifikasi.

---

## 4. Question Source Finding

### 4.1 Existing sources (must remain separate per decision #5)

| Source | Lokasi | Schema | Pemakaian |
|--------|--------|--------|-----------|
| **Formal exam** (`Soal` sheet) | `code.gs:40-63` `examsMap` + `admin.html:532-559` `saveNewExam` | Row: `id,title,duration,isActive,q_id,text,options[4],answer` (`code.gs:57-62`). 30 soal max per exam. | `ExamInterface` (`index.html:1186`), `finishExam → POST saveResult → Hasil` (`index.html:267`). |
| **17-game bonus** (`Games` sheet) | `code.gs:354-399` `readGames_` | Row: `id,type,mapel,title,duration,isActive,linkedExamId,pairs(JSON)` (`code.gs:6`). `pairs` = array atau `{mudah,sedang,sulit}` (`GameShell.js:82`). | `GameHub` (`games/GameHub.js`), `GameShell.js:82-129` helpers. 28 sample (`code.gs:475-981`). |

Keduanya **tidak boleh** dipakai untuk Millionaire production (decision #5 + `PHASE_01_ARCHITECTURE.md:104-112`).

### 4.2 Dedicated Millionaire source — BELUM ADA

- `Select-String Millionaire -Path code.gs,code_v2.gs` → 0 hit.
- `Get-ChildItem millionaire` → hanya `assets/`.
- Spec menuntut sheet `MillionaireQuestions` (`PHASE_01_ARCHITECTURE.md:292`) sebagai production source of truth, `MillionaireQuestions.js` sebagai fallback/demo seed (`PHASE_01_ARCHITECTURE.md:122-132`).

### 4.3 Canonical schema (Phase 01 lock untuk Phase 02)

Berdasarkan `PHASE_01_ARCHITECTURE.md:296` + integrasi dengan existing patterns, schema terkunci:

| Field | Type | Required | Valid range / rule | Evidence |
|-------|------|----------|--------------------|----------|
| `id` | string | YES | unique, non-empty, trimmed, `^[A-Za-z0-9_-]+$` | `PHASE_01:299`, existing `GAMES_SHEET id` pattern |
| `mapel` | string | YES | salah satu `MAPEL_LIST` (`index.html:82`) — 8 mapel | `index.html:82`, `PHASE_01:300` |
| `level` | number (int) | YES | 1–15, sequential per set (1 row per level per game set) | `PHASE_01:301` |
| `question` | string | YES | non-empty, max 200 chars, boleh berisi `[GAMBAR:url]` (reuse `renderContent` `index.html:128`) | `PHASE_01:302` |
| `optionA` | string | YES | non-empty | `PHASE_01:303` |
| `optionB` | string | YES | non-empty | `PHASE_01:304` |
| `optionC` | string | YES | non-empty | `PHASE_01:305` |
| `optionD` | string | YES | non-empty | `PHASE_01:306` |
| `answer` | number (int) | YES | 0–3 (index A-D) | `PHASE_01:307` |
| `prize` | number | YES | harus == `PRIZE_LADDER[level].prize` (canonical ladder, bukan arbitrary); validasi di frontend & backend | `PHASE_01:308`, `PHASE_00:35-53` |
| `isSafe` | boolean/string | YES | `TRUE` hanya untuk level 5,10,15 (spec `PHASE_01:387`); lainnya `FALSE`/empty | `PHASE_01:309` |
| `explanation` | string | NO | optional, post-answer; max 500 chars | `PHASE_01:310` |

**Normalization & invalid-row contract (untuk Phase 02 `PHASE_02_DATA_CONTRACT.md`):**

- Trim whitespace, collapse `  ` → ` `.
- `id` duplicate → last row wins atau reject deterministic (Phase 02 pilih; rekomendasi: reject + log `Logger.log`).
- `level` out of 1–15 / `answer` out of 0–3 / empty `question`/options → skip row, `Logger.log`, tidak crash `getInitData`.
- `prize` mismatch dengan canonical ladder → override dengan ladder value (frontend authority = ladder, bukan sheet), atau reject row (Phase 02 pilih; rekomendasi: override + warn).
- `isSafe` tidak sesuai level → normalize ke `level ∈ {5,10,15}`.
- Missing level dalam set (mis. level 7 tidak ada) → do not silently invent question (`PHASE_01:937-939`) — game tampilkan *controlled error* “Soal level X belum tersedia”.

### 4.4 Question source flow (Phase 01 lock)

```
MillionaireGame
  │
  ▼
Millionaire Question Reader  (frontend, Phase 02)
  │
  ├── production source (source of truth)
  │     fetch getInitData → appData.millionaireQuestions
  │     → filter by mapel + sort by level 1-15
  │     → validate per schema §4.3
  │
  └── fallback (only if production empty/unavailable)
        window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS
        ← MillionaireQuestions.js  (// FALLBACK ONLY - 15 demo rows, 1 per level)
```

**Rules terkunci:**
- `getInitData` tambah field `millionaireQuestions: readMillionaireQuestions_(ss)` (aditif, tidak ubah existing 7 fields).
- `readMillionaireQuestions_(ss)` — baca sheet `MillionaireQuestions`, skip invalid rows, sort `level ASC`, group by `mapel`.
- Fallback trigger: `production == null || production.length < 15` atau `fetch error` → pakai `MILLIONAIRE_FALLBACK`; jika keduanya kosong → `INTRO` tampilkan error, tidak auto-generate soal.
- Caching: reuse `fetch getInitData` yang sudah ada (tidak ada cache terpisah); tidak ada polling.
- Filtering: `mapel` exact match `MAPEL_LIST`; `level` exact 1–15.

---

## 5. Result Contract Finding

### 5.1 Existing GameResults contract (11 kolom — LOCKED)

- **Header:** `GAME_RESULTS_HEADER = ["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik"]` (`code.gs:3`, `code_v2.gs:20`).
- **Read:** `readGameResults_(ss)` (`code.gs:402-420`): `lastRow-1` rows, filter `r[1]` (nisn), map ke `Number` untuk `skor/benar/salah/durasiDetik`.
- **Write:** `doPost saveGameResult` (`code.gs:254-270`): `getOrCreateSheet_ → appendRow([waktu,nisn,nama,gameId,game,mapel,tipe,skor,benar,salah,durasiDetik])` dengan `nisn` format `@` text (`code.gs:256` `["B"]`).
- **Frontend write:** `finishGame(result)` (`index.html:225-258`) membangun `record {waktu, nisn, nama, gameId, game: title+levelSuffix, mapel, tipe, skor, benar, salah, durasiDetik, level}` (`index.html:228-241`). `levelSuffix` ditambah ke `game` string (display), `level` dikirim terpisah untuk `canSaveGameResult` key.
- **Anti-farm gate:** `canSaveGameResult(nisn,gameId,level)` (`GameShell.js:34-42`, dipanggil `index.html:247-250`) — `localStorage` 30s per `nisn+gameId+level`.

### 5.2 Millionaire result concept (dikunci Phase 01)

Target payload (`PHASE_01_ARCHITECTURE.md:455-471`):

```js
{
  gameId,        // e.g. "millionaire-ipas-01"
  title,         // display
  mapel,         // MAPEL_LIST
  type: "millionaire",
  skor,          // normalized leaderboard 0-100 (bukan Rupiah) — see §5.3
  benar,         // 0-15
  salah,         // 0-1 (Millionaire salah sekali = over)
  durasiDetik,
  level,         // 1-15 last reached
  virtualRupiah, // prizeLadder[level] atau last safe
  safeRupiah,    // highest safe reached
  walkAway,      // boolean (SAFE_EXIT)
  lifelinesUsed  // {fiftyFifty, askClass, askFriend}
}
```

### 5.3 Score vs virtualRupiah — SEPARATE (decision #12, `PHASE_01:411-430`)

- `skor` tetap **0–100** normalized untuk leaderboard (`GameHub.js:21`, `admin.html:420` `bestScoreForGame` pakai `skor`). Formula terkunci Phase 01: **`skor = Math.round((levelReached / 15) * 100)`** atau `Math.round((benar/15)*100)` — konsisten dengan `calcChallengeScore` spirit tapi tanpa `penalty*salah` (Millionaire salah=over, bukan penalty). Final choice di Phase 02, tapi **tidak boleh** `skor = 1000000`.
- `virtualRupiah` & `safeRupiah` adalah metric terpisah dari `PRIZE_LADDER` (§9). Ditampilkan di `GameResultModal` variant Millionaire, bukan di leaderboard existing.

### 5.4 Additive storage strategy — DECISION: Option A dengan guardrail

`PHASE_01_ARCHITECTURE.md:627-642` memberi 2 opsi.

**Decision Phase 01: Option A — additive columns (4 kolom baru di akhir `GameResults`)**

```
Existing (11): waktu | nisn | nama | gameId | game | mapel | tipe | skor | benar | salah | durasiDetik
Additive (4):  level | virtualRupiah | safeRupiah | walkAway + lifelines(JSON)
→ Total 15 kolom, atau 16 jika lifelines dipisah.
Header baru:
["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik","level","virtualRupiah","safeRupiah","extra"]
extra = JSON.stringify({walkAway, lifelinesUsed})
```

**Rationale:**
- Backward compatible — `readGameResults_` baca `GAME_RESULTS_HEADER.length` (11) (`code.gs:405`), jadi baris lama tetap terbaca; kolom baru diabaikan oleh reader lama. Reader baru perlu handle `lastCol = Math.min(lastColumn, HEADER.length)` atau baca 15 kolom.
- Tidak menambah sheet baru → jaga decision #9 (no new backend system unless unavoidable). Audit membuktikan tidak unavoidable.
- `appendRow` dengan 15 values tetap kompatibel — sheet akan auto-extend, baris lama kolom 12-15 kosong.

**Alternative Option B** (dedicated detail payload / sheet `MillionaireResults`) ditolak untuk Phase 02 karena menambah join complexity dan dashboard compatibility burden, kecuali audit Phase 02 membuktikan kolom `extra` tidak cukup untuk reporting guru.

**Guardrails:**
- Jangan sisip kolom di tengah (jaga index `skor` di col 8). Tambah di akhir.
- `level` di `GameResults` sekarang adalah `VARCHAR` (existing `finishGame` kirim `level:"sedang"`). Untuk Millionaire, `level` numeric 1-15 — server harus handle string/number; fase transisi simpan `String(level)` konsisten.
- `readGameResults_` perlu diperluas di Phase 02 untuk mengembalikan `virtualRupiah/safeRupiah/extra` jika ada.

---

## 6. Game Dispatcher Finding

### 6.1 Registry aktual

- **Canonical registry:** tidak ada file registry terpusat. Registry adalah kombinasi:
  - `GAME_TYPES = ["match",...,"feed"]` 17 entri (`GameShell.js:27`)
  - `GAME_TYPE_META` 17 entri (`GameShell.js:7-24`) dengan `label/emoji/desc/grad`
  - `games/gameData.js: SAMPLE_GAMES` 28 entries (untuk display)
  - `index.html:476-655` dispatcher 17 `if (activeGame.type === '...')` + fallback `MatchGame` (`index.html:646`)
- **Game object shape aktual:** `{id, type, mapel, title, duration, isActive, linkedExamId, pairs}` (`code.gs:389-397`, `index.html:232-236`). `pairs` adalah `left/right` — tidak cocok untuk Millionaire.

### 6.2 Canonical type `millionaire` — DECISION

- **Dikunci:** `type: "millionaire"` lowercase, tanpa variasi (`millionaireGame`, `millionaire-game`, `millionaire_v1` dilarang per `PHASE_01:237-242`).
- **Registry update (Phase 02):**
  - `GameShell.js:27` → tambah `"millionaire"` ke `GAME_TYPES` (atau registry terpisah Millionaire agar tidak pollute `GAME_TYPES` existing — pilihan: **jangan ubah `GAME_TYPES`**; Millionaire registry adalah `window.SIPANDA_MILLIONAIRE.TYPE = "millionaire"` + meta terpisah `MILLIONAIRE_META`. Dispatcher tetap `if (type==='millionaire')` tanpa perlu `GAME_TYPES`).
  - Rekomendasi Phase 01: **JANGAN ubah `GAME_TYPES`/`GAME_TYPE_META`** — Millionaire meta disimpan di namespace sendiri `SIPANDA_MILLIONAIRE.META = {label:"Millionaire", emoji:"🏆", grad:"from-navy..."};` Dispatcher check tetap `activeGame.type==='millionaire'`.

### 6.3 Dispatcher integration — additive 1 cabang

- **Lokasi:** `index.html:476-655` setelah `FeedGame` cabang, sebelum fallback.
- **Script loading position:** `index.html:54-73` — tambah setelah `GameHub.js:73` dan sebelum inline `App` (`index.html:75`):

  ```html
  <script type="text/babel" src="millionaire/MillionaireQuestions.js?v=17"></script>
  <script type="text/babel" src="millionaire/MillionaireGame.js?v=17"></script>
  <link rel="stylesheet" href="millionaire/millionaire.css?v=17" />
  ```

  Order: `MillionaireQuestions` (seed, no deps) → `MillionaireGame` (depends on `GameShell.js` helpers + questions) → `App`. CSS load di `<head>` (`index.html:13-48`).

- **Props contract (sama dengan 17 game):** `MillionaireGame({game, currentUser, onFinish, onExit, onReplay})` — reuse signature untuk kompatibilitas `finishGame`.

---

## 7. Namespace Collision Finding

### 7.1 Global pollution audit

| Symbol | Declared at | Scope | Collision risk for Millionaire |
|--------|-------------|-------|--------------------------------|
| `MAPEL_LIST` | `index.html:82`, `admin.html:19` | `window` (Babel standalone tidak pakai module) | **HIGH** — redeclare → overwrite, filter `GameHub:14` rusak. Millionaire jangan redeclare; reuse `window.MAPEL_LIST`. |
| `Icon` | `index.html:93`, `admin.html:24` | `window` | **HIGH** — duplikat, 8+ ikon hardcode. Millionaire tambah ikon lifeline (50:50, kelas, teman) harus extend, bukan redeclare. |
| `shuffleArray` | `index.html:119` | `window` | **MEDIUM** — dipakai `GameShell.js:69,133` dan semua game. Millionaire reuse langsung. |
| `hashString`, `renderContent` | `index.html:113,128` | `window` | **LOW** — tidak dipakai game, tapi global. |
| `GAME_TYPE_META` | `GameShell.js:7` | `window` | **HIGH** — jika Millionaire tambah entry `millionaire` di sini, 17 game terpengaruh (tapi display `gameTheme('millionaire')` fallback ke generic). Rekomendasi: jangan ubah; pakai namespace sendiri. |
| `GAME_TYPES` | `GameShell.js:27` | `window` | **MEDIUM** — fallback `index.html:646` check `!GAME_TYPES.includes(type)` akan treat `millionaire` sebagai unknown → `MatchGame` fallback bug. Wajib tambah cabang eksplisit sebelum fallback. |
| `GAME_DIFFICULTY*`, `diffSettings`, `bankForLevel`, `flatPairs`, `isPerLevel*`, `levelBankCounts`, `buildMCQ`, `buildRounds`, `calcChallengeScore`, `levelLabel` | `GameShell.js:53-149` | `window` | **MEDIUM** — Millionaire tidak pakai difficulty `mudah/sedang/sulit` (15 ladder bukan 3 difficulty), jangan panggil `bankForLevel`/`buildMCQ`. |
| `DifficultySelect`, `GameHud`, `GameResultModal`, `DifficultyBadge` | `GameShell.js:152,161,250,276` | `window` | **MEDIUM** — `MillionaireGame` harus buat HUD variant sendiri atau extend `GameHud` dengan ladder prop; jangan override. |
| `requestGameFullscreen`, `exitGameFullscreen`, `toggleGameFullscreen`, `formatGameTime`, `bestScoreForGame`, `gamesForExam` | `GameShell.js:210-248` | `window` | **LOW** — reusable, safe to call. |
| `SAMPLE_GAMES` | `games/gameData.js:16` | `window` | **LOW** — fallback `gamesList` (`index.html:161`). Millionaire fallback terpisah. |
| `WEB_APP_URL`, `APP_VERSION`, `LOGO_URL`, `SECRET_KEY_PARAM` | `index.html:78-80,164` | closure (inline Babel script, bukan `window` tapi global in that script) | **HIGH** — duplikat di `admin.html:17` → divergensi. |
| `canSaveGameResult` | `GameShell.js:34` | `window` | **LOW** — reusable, tapi key `level` untuk Millionaire 1-15 vs existing `mudah/sedang/sulit` string mismatch (see §10). |

### 7.2 Preferred namespace strategy — DECISION

**Dikunci per `PHASE_01_ARCHITECTURE.md:254-268`:**

```js
window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {};
window.SIPANDA_MILLIONAIRE.CONFIG = { VERSION: "1.0" };
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER = [ /* 15 entries */ ];
window.SIPANDA_MILLIONAIRE.STATES = { INTRO:"INTRO", ... FINISHED:"FINISHED" };
window.SIPANDA_MILLIONAIRE.LIFELINES = { FIFTY:"fiftyFifty", CLASS:"askClass", FRIEND:"askFriend" };
window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS = [ /* 15 demo */ ];
window.SIPANDA_MILLIONAIRE.helpers = { normalizeQuestion, validateRow, calcSafeRupiah, calcScore };
window.SIPANDA_MILLIONAIRE.META = { label:"Millionaire", emoji:"🏆", grad:"from-slate-900 via-blue-900 to-violet-900", desc:"15 level menuju Rp1.000.000" };
```

**Larangan:** `window.STATES`, `window.CONFIG`, `window.QUESTIONS`, `window.TIMER`, `window.LIFELINES`, `window.PRIZE` generik.

**Local component:** `function MillionaireGame(...)` tetap global (harus, karena `index.html` dispatcher memanggilnya), tapi semua constant/helper di dalam `SIPANDA_MILLIONAIRE`. `MillionaireGame` sendiri boleh tetap `window.MillionaireGame` untuk dispatcher compatibility.

**Verification checklist Phase 02:** `Select-String -Pattern "SIPANDA_MILLIONAIRE"` harus hit di `millionaire/*.js`; `Select-String -Pattern "^const STATES|^window\.STATES"` harus 0.

---

## 8. Responsive/Asset Finding

### 8.1 Asset inventory — verified pixel-level

| Asset | Spec | Filename (actual) | Dimensions | Ratio | Size | Format header | Location | Compliance |
|-------|------|-------------------|------------|-------|------|---------------|----------|------------|
| B1 Desktop Gameplay | `MILLIONAIRE_ASSET_SPEC.md:27` 16:9 gameplay, space for Q/A/host/ladder, no baked UI | `B1-gameplay.png` | **1672×941** (`System.Drawing.Image`) | **1.78 = 16/9** ✅ | 2.013 KB (2.061.161 bytes) | `89-50-4E-47` PNG | `millionaire/assets/backgrounds/desktop/` | ✅ native 16:9, not crop |
| B3 Desktop Intro | `MILLIONAIRE_ASSET_SPEC.md:37` 16:9 intro, branding prominent, HTML Start UI | `B3-intro.png` | **1672×941** | **1.78 = 16/9** ✅ | 2.119 KB (2.169.822 bytes) | PNG | `desktop/` | ✅ |
| B2 Mobile Gameplay | `MILLIONAIRE_ASSET_SPEC.md:32` 9:16 portrait-native, not desktop crop, calm center | `B2-gameplay.png` | **941×1672** | **0.56 = 9/16** ✅ | 1.940 KB (1.986.816 bytes) | PNG | `mobile/` | ✅ native 9:16 |
| B4 Mobile Intro | `MILLIONAIRE_ASSET_SPEC.md:42` 9:16 intro portrait-native | `B4-intro.png` | **941×1672** | **0.56 = 9/16** ✅ | 2.020 KB (2.068.563 bytes) | PNG | `mobile/` | ✅ |

**Evidence:** `Get-ChildItem -File` + `[System.Drawing.Image]::FromFile` per file; pixel format `Format24bppRgb`; ratios `1.78` vs `0.56` exact inverse, proving **B2/B4 are not crops of B1/B3** but native compositions.

**Target filenames per spec:** `stage-gameplay.webp` / `stage-intro.webp` (`MILLIONAIRE_ASSET_SPEC.md:13-25`). Actual masih `B1..B4.png` — belum final naming. Final production dapat tetap `B*.png` selama mapping CSS benar, tapi rekomendasi Phase 02: rename/symlink ke `stage-*.webp` setelah WebP conversion.

### 8.2 Missing assets

- `millionaire/assets/branding/` → **0 entries** (spec: host branding if needed, intro)
- `millionaire/assets/characters/` → **0 entries** (spec: host/characters separate)
- `millionaire/assets/effects/` → **0 entries**
- `millionaire/assets/icons/` → **0 entries** (lifeline icons 50:50, kelas, teman belum ada — akan jadi HTML/CSS, bukan baked ke background)

Tidak block Phase 01, tapi Phase 02 perlu deliver atau document as HTML-only.

### 8.3 Responsive architecture finding

- **Existing responsive:** `index.html:5` `viewport width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`, `@supports (min-height:100dvh)` (`index.html:43`), `button{touch-action:manipulation}` (`index.html:44`), Tailwind `grid-cols-1 sm:grid-cols-3` (`index.html:826`, `admin.html:676`), `GameShell.js:27-208` `DifficultySelect` max-w 2xl. Tidak ada desktop/mobile asset swap untuk games existing.
- **Millionaire required:** `MILLIONAIRE_ASSET_SPEC.md:63-66` desktop `Host | Question | Prize Ladder` vs mobile `Header → Level/Prize → Question → A/B/C/D → Lifelines`.
- **Strategy Phase 01 lock:**

  ```css
  /* millionaire/millionaire.css */
  .millionaire-stage--intro    { background-image: url('./assets/backgrounds/desktop/B3-intro.png'); }
  .millionaire-stage--gameplay { background-image: url('./assets/backgrounds/desktop/B1-gameplay.png'); }
  @media (max-width: 768px) and (orientation: portrait) {
    .millionaire-stage--intro    { background-image: url('./assets/backgrounds/mobile/B4-intro.png'); }
    .millionaire-stage--gameplay { background-image: url('./assets/backgrounds/mobile/B2-gameplay.png'); }
  }
  /* Background: cover, center, no baked UI overlay, pointer-events:none, z-index behind HTML UI */
  ```

  Breakpoint: `768px` (Tailwind `md`) + `orientation: portrait` — konsisten dengan existing `sm/md` breakpoints.

### 8.4 Background rules compliance

- Spec `MILLIONAIRE_ASSET_SPEC.md:53-62`: background *atmosphere only*, dynamic UI = HTML/CSS/JS, must never block touch, avoid dense detail, no baked text, host separate. 4 PNG verifikasi visual (via `System.Drawing` dimensions + size) menunjukkan asset siap untuk rule ini, tapi **pixel-level baked UI check** (apakah ada teks pertanyaan/ladder/lifeline terpanggang) belum dilakukan selain metadata — unresolved item untuk Phase 02 visual QA.

### 8.5 Production optimization outstanding

- **Format:** aktual PNG, spec final WebP (`MILLIONAIRE_ASSET_SPEC.md:22-25`). Size ~2 MB/biji = 8.2 MB total → Lighthouse penalty. Phase 02: convert WebP, target < 400 KB per file, record dims/file sizes.
- **Dimensions:** 1672×941 bukan standard 1920×1080 — acceptable (still 16:9), tapi Phase 02 verifikasi di device 1080p/4K; jika perlu upscale to 1920×1080.
- **Loading:** tidak ada lazy/preload — `millionaire.css` harus `preload` via `<link rel="preload" as="image">` optional.

---

## 9. Admin Architecture Finding

### 9.1 Existing admin (actual)

- **Entry:** `AdminApp()` (`admin.html:150`) — `fetch getInitData` (`admin.html:159`), `isLoggedIn` gate (`admin.html:151,229`), tabs via `activeTab` (`admin.html:474`).
- **Tabs (6):** `overview | ai-generator | games | materi | exams | results` (`admin.html:643-648`). Sidebar nav `navItemClass` (`admin.html:616`) + content `activeTab==='...'` (`admin.html:669`).
- **Game admin:** `GameAdminPanelStandalone` (`admin.html:292-470`) — form `id,type,mapel,title,duration,linkedExamId,pairsMudah/Sedang/Sulit` (`admin.html:294`), 3 banks tabs (`admin.html:438`), `BANK_FORMAT_GUIDE` (`admin.html:272-290`), actions `generateGamePairs` (`admin.html:332`), `classifyGamePairs` (`admin.html:378`), `saveGame` (`admin.html:405`). Select `type` 17 options (`admin.html:429`). `bankCounts` (`admin.html:301`), `fillBanks` (`admin.html:308`).
- **Exam admin:** `ai-generator` (`admin.html:644`) + `handleGenerateAI` (`admin.html:508`) → `generateAIQuestions` → 30 PG questions, `handlePublishAiExam` (`admin.html:532`) → `saveNewExam` → `Soal` sheet.

### 9.2 Millionaire dedicated admin — DECISION

**Spec requires:** dedicated Millionaire question management, separate from 17 games (`PHASE_01_ARCHITECTURE.md:681-718`), responsible for `create/edit/delete/deactivate, level, answer, prize validation, safe flag, explanation, mapel` (`PHASE_01:691-703`), production source `MillionaireQuestions` (`PHASE_01:706`).

**Phase 01 decision: dedicated tab + dedicated panel (extension terisolasi)**

```
Admin
├── Existing Game Admin (GameAdminPanelStandalone — unchanged)
└── Millionaire Question Admin (new)
    ├── Tab: "💰 Millionaire" (or "🏆 Millionaire")
    ├── Panel: MillionaireAdminPanel
    │   ├── Table: id | mapel | level | question | A-D | answer | prize | isSafe | explanation
    │   ├── Form: create/edit (level 1-15, prize auto-fill from ladder, isSafe auto from level)
    │   ├── Validation: answer 0-3, prize == ladder[level], level unique per mapel
    │   ├── Actions: saveMillionaireQuestion, toggleMillionaireQuestion, deleteMillionaireQuestion
    │   └── No Games.pairs mixing — separate sheet
    └── Route: activeTab === 'millionaire' in AdminDashboardFull
```

**Rationale:**
- `activeTab` string (`admin.html:474`) easily extended — tambah `millionaire` tab tanpa ubah existing 6 tabs.
- Tidak memasukkan Millionaire ke `Games.pairs` (larangan `PHASE_01:717`).
- `MAPEL_LIST` reuse (`admin.html:19`), `WEB_APP_URL` reuse.
- Backend actions baru (`saveMillionaireQuestion`, `toggleMillionaireQuestionActive`, `getMillionaireQuestions`) terpisah dari `saveGame`/`generateGamePairs`.

**Alternative rejected:** extension di dalam `GameAdminPanelStandalone` (akan campur `pairs` bank dengan Millionaire schema, melanggar isolation).

---

## 10. Cache/Version Finding

### 10.1 Existing cache/version strategy (actual)

| Mechanism | Lokasi | Evidence |
|-----------|--------|----------|
| **Script cache-busting** `?v=16` | `index.html:54-73` 20 scripts `games/...?v=16` | `Select-String -Pattern "v=" -Path index.html` |
| **App version + hard reload** | `index.html:164-171` `APP_VERSION = "11.09.2026-v16"`, `localStorage sipanda_version`, `if (savedVersion !== APP_VERSION) { localStorage.setItem(...); window.location.reload(true); return; }` | `Read index.html:163-191` |
| **Duplicate WEB_APP_URL** | `index.html:78` & `admin.html:17` identical `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` | `Select-String WEB_APP_URL` → 2 hits |
| **No CSS version** | `index.html:13-48` inline `<style>` (no external CSS) | `Read index.html:13-48` |
| **No service worker / manifest** | — | `Get-ChildItem -Recurse` → no `sw.js`, `manifest.json` |

### 10.2 Behavior analysis

- `APP_VERSION` gate memaksa **full reload sekali** saat version bump (user buka app versi lama → `localStorage` mismatch → `reload(true)` → fetch `getInitData?v=APP_VERSION`). Ini adalah cache-busting paling agresif (cache HARUS invalidate).
- `?v=16` pada script tags mengisolasi cache per file, tapi `APP_VERSION` dan `?v=` harus bump bersamaan atau不一致 cache.
- `WEB_APP_URL` duplikat → jika salah satu file di-edit tanpa sync, `index.html` dan `admin.html` fetch ke deployment berbeda (split-brain).

### 10.3 Phase 01 decision — additive, compatible

- **Millionaire scripts/CSS versioning:** `millionaire/MillionaireGame.js?v=17`, `MillionaireQuestions.js?v=17`, `millionaire.css?v=17` — bump ke `v=17` bersamaan dengan `APP_VERSION = "11.09.2026-v17"` (increment dari `v=16`). Jangan ubah existing 20 scripts `?v=16` ke `?v=17` secara batch jika tidak perlu — tapi `APP_VERSION` bump akan reload anyway, jadi `?v=17` untuk Millionaire files cukup; existing files boleh tetap `?v=16` atau bump sekalian (prefer bump sekalian untuk consistency).
- **WEB_APP_URL:** tidak diubah di Phase 01; Phase 02 buat single source `const WEB_APP_URL = ...` di shared location atau assert equality via CI `Select-String WEB_APP_URL | unique`.
- **CSS:** `millionaire.css` external file, jadi butuh `?v=17` query. Inline `<style>` di `index.html:13-48` tetap.

---

## 11. Risks

### 11.1 HIGH

| ID | Risk | Evidence | Impact | Mitigation |
|----|------|----------|--------|------------|
| **H1** | **Backend canonical unresolved** — `code.gs` vs `code_v2.gs` identik fungsional, tidak ada deployment evidence, instruksi `code_v2.gs:13` “ganti Code.gs” tidak terverifikasi di production. Millionaire helpers bisa ter-deploy ke file yang salah. | `git diff --no-index code.gs code_v2.gs` (diff hanya komentar), `Get-ChildItem` no deployment config | Millionaire backend tidak live; Phase 02 deliverable tidak teruji | Phase 02 prasyarat: verifikasi Apps Script Deployments dashboard, tentukan canonical, update `CODE_CANONICAL.md`, tambah helpers ke canonical (atau kedua file sementara). |
| **H2** | **Result header fixed-width** — `GAME_RESULTS_HEADER` 11 kolom (`code.gs:3`). Tambah kolom di tengah akan corrupt existing rows; `readGameResults_(ss)` pakai `GAME_RESULTS_HEADER.length` (11) untuk `getRange` width (`code.gs:405`). | `code.gs:3,405`, `code.gs:256` textColumns `["B"]` | Write dengan 15 kolom tapi read 11 kolom → data Millionaire terpotong atau mis-aligned | Additive di akhir + update `readGameResults_` to handle 11-15 kolom; never insert in middle. |
| **H3** | **Global namespace collision** — `window.GAME_TYPE_META`, `MAPEL_LIST`, `Icon`, `shuffleArray`, `GAME_TYPES` shared; Millionaire jika redeclare → 17 games broken. | `GameShell.js:7,27`, `index.html:82,93,119` | Silent override, fallback `MatchGame` untuk `millionaire` (`index.html:646`) | Enforce `window.SIPANDA_MILLIONAIRE` + lint `Select-String "^const|^window\."` pre-commit. |

### 11.2 MEDIUM

| ID | Risk | Evidence | Impact | Mitigation |
|----|------|----------|--------|------------|
| **M1** | **Question schema mismatch** — `Games.pairs {left,right}` (2 fields) vs `Soal` (6 fields) vs Millionaire (10 fields). Godaan reuse `pairs` atau `Soal` tinggi. | `games/gameData.js:16`, `code.gs:57-62` | Pelanggaran decision #5; validasi `answer 0-3` tidak ada di existing | Dedicated `MillionaireQuestions` sheet + `readMillionaireQuestions_` + schema validation `PHASE_02_DATA_CONTRACT.md`. |
| **M2** | **Mobile not crop vs asset size** — 4 PNG ~2 MB/biji (8.2 MB) belum WebP, dimensions 1672×941 bukan 1920×1080. Jika Phase 02 tidak convert, Lighthouse fail; jika salah resize, composition rusak. | `Get-ChildItem` 4 files, `[System.Drawing.Image]` 1672×941 / 941×1672 | Production perf & visual QA fail | Convert WebP `<400KB`, preserve 16:9/9:16 exact, map `B1→desktop/stage-gameplay.webp` etc, record in `MILLIONAIRE_ASSET_SPEC.md`. |
| **M3** | **Anti-farm key mismatch** — `canSaveGameResult` key `level||'sedang'` string (`GameShell.js:36`) vs Millionaire `level` numeric 1-15. Existing key `game_last_nisn_gameId_sedang` tidak match `game_last_nisn_millionaire-ipas-01_7`. | `GameShell.js:34-42`, `index.html:247` | Anti-farm tidak efektif atau false-positive block (replay 15 level cepat kena 30s throttle). | Map Millionaire `level` to string `String(level)`; document key format `game_last_${nisn}_${gameId}_${levelNum}` 30s per level; consider per-game not per-level throttle for Millionaire (walk-away replay). |
| **M4** | **Admin mixing** — `GameAdminPanelStandalone` 17-type select (`admin.html:429`) tidak mengandung `millionaire`; jika ditambah, akan campur `pairs` schema. | `admin.html:429`, `BANK_FORMAT_GUIDE:272` | Invalid Millionaire rows written to `Games` sheet | Dedicated `MillionaireAdminPanel` tab, separate sheet, separate actions. |
| **M5** | **Cache/version fragility** — `APP_VERSION` hard reload (`index.html:169`) + `?v=16` dual mechanism harus sync; `WEB_APP_URL` duplikat. | `index.html:164-173`, `admin.html:17` | Stale Millionaire script served; admin fetch ke deployment lama | Bump both `APP_VERSION` + `?v=` to `v=17` atomically; assert `WEB_APP_URL` equality. |

### 11.3 LOW

| ID | Risk | Evidence | Mitigation |
|----|------|----------|------------|
| **L1** | `characters/branding/effects/icons` kosong — no placeholder for host/lifeline visuals | `Get-ChildItem millionaire/assets -Recurse -Directory` 0 entries | Phase 02 deliver HTML/CSS lifeline icons, or document as HTML-only. |
| **L2** | `README.md` template — no project context | `Read README.md` | Non-blocking. |
| **L3** | `rebase in progress` — pending `aa5cde7` picks | `git status` | Resolve rebase before Phase 02 commit. |
| **L4** | Baked UI risk — `MILLIONAIRE_ASSET_SPEC` rule but no pixel-level OCR check | `MILLIONAIRE_ASSET_SPEC.md:53-62` | Phase 02 visual QA: open PNGs, confirm no question/A-D/ladder/timer text. |

---

## 12. Decisions

### 12.1 Decisions Terkunci Phase 01 (untuk dikonsumsi Phase 02)

| # | Area | Decision | Evidence / Spec |
|---|------|----------|-----------------|
| D1 | Module boundary | `millionaire/` isolated — owns `MillionaireGame.js`, `MillionaireQuestions.js` (fallback), `millionaire.css`, `assets/*`; no touch to `games/` 17 files | `PHASE_01:70-83`, repo `millionaire/assets` only |
| D2 | Canonical type | `type: "millionaire"` lowercase, single variant; dispatcher `if (type==='millionaire')` before fallback `index.html:646`; `META` in namespace, not in `GAME_TYPE_META` | `PHASE_01:230-244`, `GameShell.js:7-27` |
| D3 | Namespace | `window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {}` — all constants/helpers inside; no generic `window.STATES` | `PHASE_01:254-268` |
| D4 | Question source production | Dedicated sheet `MillionaireQuestions` — separate from `Games.pairs` and `Soal` | `PHASE_01:104-124`, decision #5 |
| D5 | Fallback | `millionaire/MillionaireQuestions.js` → `window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS` — 15 rows (1 per level), header `// FALLBACK ONLY`, only used if `getInitData.millionaireQuestions` empty/error | `PHASE_01:122-132` |
| D6 | Question schema | 10 fields `id,mapel,level(1-15),question,optionA-D,answer(0-3),prize,isSafe,explanation` + validation rules §4.3 | `PHASE_01:296-311` |
| D7 | Prize ladder | Canonical `PRIZE_LADDER` 15 levels `100,200,300,500,1000(SAFE),2000,4000,8000,16000,32000(SAFE),64000,125000,250000,500000,1000000(FINAL)` — single source `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER` | `PHASE_00:35-53`, `PHASE_01:368-386` |
| D8 | Safe money | `safeRupiah = highest reached safe prize`; wrong after safe → return safe, not 0; `virtualRupiah` vs `safeRupiah` separate | `PHASE_01:402-430` |
| D9 | Score | `skor` 0-100 normalized `Math.round(levelReached/15*100)` (final formula Phase 02), `virtualRupiah`/`safeRupiah` separate metric | `PHASE_01:434-470` |
| D10 | FSM 12 states | `INTRO→READY→QUESTION→SELECTING→LOCKED→REVEAL→CORRECT/WRONG→SAFE_EXIT/GAME_OVER/VICTORY→FINISHED` — explicit, no skip, timer stopped at `LOCKED`, single `onFinish` at `FINISHED` | `PHASE_01:478-535` |
| D11 | Lifelines | 3 once-per-game `fiftyFifty,askClass,askFriend` — allowed only in `QUESTION/SELECTING`, disabled after use, persisted in `lifelinesUsed`, effect: 50:50 disables 2 wrong options, Kelas = bar chart 55-75% correct, Teman = suggestion bubble | `PHASE_01:552-584` |
| D12 | Result storage | **Option A — additive columns** at end of `GameResults`: `level,virtualRupiah,safeRupiah,extra(JSON:{walkAway,lifelines})` — 15 cols total; backward compat via `readGameResults_` range | `PHASE_01:627-642` + §5.4 |
| D13 | Result flow | `MillionaireGame → finishGame() → canSaveGameResult() → POST saveGameResult → GameResults` — reuse existing, no new system | `index.html:225`, `code.gs:254`, `PHASE_01:606-625` |
| D14 | Dashboard entry | Banner in `StudentDashboard` + optional `GameHub` banner; dispatcher 1 cabang `type==='millionaire'` in `index.html:476-655`; no dashboard rebuild | `PHASE_01:648-678`, `index.html:789,877` |
| D15 | Admin | Dedicated tab `millionaire` + `MillionaireAdminPanel` — separate from `GameAdminPanelStandalone`, CRUD `MillionaireQuestions` sheet, prize auto-fill, `isSafe` auto | `PHASE_01:681-718`, `admin.html:643` |
| D16 | Backend canonical | `code_v2.gs` intended canonical (per its header `code_v2.gs:1-15`), `code.gs` backup; Phase 02 verifies deployment before adding helpers | `code_v2.gs:1-16`, `git diff` |
| D17 | Script/CSS loading | `MillionaireQuestions.js?v=17` → `MillionaireGame.js?v=17` → `App`; `millionaire.css?v=17` in `<head>`; deps: `GameShell.js` helpers + `MAPEL_LIST` + `Icon` + `shuffleArray` (reuse, no redeclare); `APP_VERSION` bump `v16→v17` | `index.html:54-73,164` |
| D18 | Responsive/assets | Desktop `B1/B3` 1672×941 16:9, Mobile `B2/B4` 941×1672 9:16, PNG header `89-50-4E-47`, ~2 MB; final WebP `<400KB`; CSS media `(max-width:768px) and (orientation:portrait)` swap; layout `Host|Q|Ladder` vs `Header→Ladder→Q→A-D→Lifelines` | `MILLIONAIRE_ASSET_SPEC.md:27-45`, `System.Drawing` evidence |
| D19 | Cache/version | `APP_VERSION "11.09.2026-v17"` + `?v=17` + `localStorage sipanda_version` reload; `WEB_APP_URL` assert equality; no new build tooling | `index.html:164-173` |
| D20 | Anti-farm | `canSaveGameResult(nisn,gameId,String(level))` 30s; key `game_last_${nisn}_${gameId}_${levelNum}`; server no extra rate limit (Apps Script) | `GameShell.js:34-42` |

---

## 13. Unresolved Items

| ID | Item | Why Unresolved | Required Action Before Phase 02 Coding |
|----|------|----------------|----------------------------------------|
| U1 | **Backend deployment truth** — which file (`code.gs` vs `code_v2.gs`) is actually deployed at `WEB_APP_URL` (`index.html:78`)? | No `appsscript.json`, `.clasp`, or deployment log in repo; `git diff` shows only doc diff. | Check Apps Script → Deployments → compare `doGet` source; or `fetch WEB_APP_URL?action=getInitData` and inspect response for `games` field presence/version comment. Record in `docs/millionaire/BACKEND_CANONICAL.md` or merge files. **BLOCKS Phase 02 backend work.** |
| U2 | **GameResults additive columns deployment** — will production sheet accept 15-col writes while `readGameResults_` reads 11 cols? | `code.gs:405` fixed `GAME_RESULTS_HEADER.length` (11); need to confirm sheet has no protected range / trigger that rejects extra cols. | Test in staging spreadsheet: `appendRow` 15 values → read back with 11-col and 15-col readers. Update `readGameResults_` to `Math.min(lastCol, HEADER.length)` handling. |
| U3 | **B1–B4 baked UI pixel-level check** — do PNGs contain any question/A-D/ladder/timer/lifeline text baked into bitmap? | Only dimensions/header verified via `System.Drawing`; no OCR/visual inspection. | Open each PNG at 100% in image viewer; confirm center area calm, no text. Record in `MILLIONAIRE_ASSET_SPEC.md` § Verification. |
| U4 | **Exact `level` mapping for `canSaveGameResult`** — should Millionaire `level` be numeric `1-15` or string? Existing games send `level:"sedang"` (`index.html:240` default). | `GameShell.js:36` key `level || "sedang"` — numeric `7` vs string `"7"` produce different keys; spec says Millionaire `level` is numeric. | Phase 02 lock: `String(level)` for key, document in `PHASE_02_DATA_CONTRACT.md`. |
| U5 | **Admin MillionaireQuestions sheet header exact name** — `PHASE_01:292` `MillionaireQuestions` vs `MillionaireQuestions` sheet tab case sensitivity? | No sheet exists; header row not yet created; Apps Script `getSheetByName` case-sensitive. | Phase 02 define `MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions"` + header array `["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]` + `getOrCreateSheet_` call. |

No unresolved item blocks Phase 01 exit (Phase 01 is architecture only), but **U1 & U2 block Phase 02 implementation start**.

---

## 14. Recommendation for Phase 02

### 14.1 Phase 02 Scope — `PHASE_02_DATA_CONTRACT.md` only (no game implementation yet)

Phase 02 must **lock data contracts** before any `MillionaireGame.js` coding, using decisions D1–D20 above.

**Deliverable:** `docs/millionaire/PHASE_02_DATA_CONTRACT.md` containing:

1. **Sheet contract** `MillionaireQuestions`:
   - Sheet name `MillionaireQuestions` (exact), header row (12 cols above), column types (`A` text for `id`, `C` number for `level`, etc), `setNumberFormat`, frozen row, validation data-validation for `mapel`/`answer`/`isSafe`.
   - `getOrCreateSheet_` call site, `readMillionaireQuestions_(ss)` pseudocode (skip invalid rows, sort level ASC, group by mapel, `Logger.log` on skip).

2. **Backend response contract** `getInitData`:
   - New field `millionaireQuestions: readMillionaireQuestions_(ss)` — additive, JSON array of validated rows; filtering by `mapel` optional query `?mapel=IPAS`; error handling (`try/catch`, return `[]` on missing sheet).

3. **Frontend question model**:
   ```js
   // window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS = [
   //   {id:"mill-fallback-01", mapel:"IPAS", level:1, question:"...", options:["A","B","C","D"], answer:0, prize:100, isSafe:false, explanation:""},
   //   ... 15 rows
   // ]
   // Production: {id,mapel,level,question,optionA-D,answer,prize,isSafe,explanation} → normalized to {id,mapel,level,question,options:[4],answer,prize,isSafe,explanation}
   ```

4. **Result payload contract**:
   ```js
   // POST saveGameResult extended
   {
     action:"saveGameResult",
     waktu, nisn, nama,
     gameId:"millionaire-{mapel}-01", game:"Millionaire: {mapel} [Lv X]",
     mapel, tipe:"millionaire",
     skor: 0-100, benar:0-15, salah:0-1, durasiDetik,
     level:1-15, virtualRupiah, safeRupiah,
     extra: JSON.stringify({walkAway, lifelinesUsed, prizeLadderSnapshot})
   }
   // Sheet append: 15 cols (11 existing + 4 additive)
   ```

5. **Validation rules** (per field table §4.3 + invalid-row handling, duplicate ID handling, missing level handling, prize vs ladder override policy).

6. **Data normalization** (trim, `String()` coercion, `answer` parseInt, `prize` Number, `isSafe` boolean from `"TRUE"/"true"/true`).

7. **Anti-farm mapping** (key `game_last_${nisn}_${gameId}_${level}`, 30s, `String(level)`).

### 14.2 Pre-Phase 02 Checklist (must be done before writing `PHASE_02_DATA_CONTRACT.md` code)

- [ ] Resolve **U1**: verify backend canonical, write `BACKEND_CANONICAL.md` or merge `code.gs`/`code_v2.gs`.
- [ ] Resolve **U2**: staging test `GameResults` 15-col append/read.
- [ ] Visual QA **U3**: open B1–B4, confirm no baked UI.
- [ ] Create empty sheet `MillionaireQuestions` in dev spreadsheet with header row (manual step — document in `PHASE_02_DATA_CONTRACT.md` Appendix).
- [ ] Bump `APP_VERSION` planning: `v16→v17` (prepare, don't commit yet).

### 14.3 Guardrails for Phase 02 Author

- **Do not** modify any of 17 game files, `GameShell.js`, `GameHub.js`, `games/gameData.js` except `GAME_TYPES` if explicitly decided D2 alternative (prefer not).
- **Do not** add build tooling (`vite`, `webpack`), new CDN, or React version change (`PHASE_01:960-975` prohibitions).
- **Do not** mix Millionaire rows into `Games` sheet or `Soal` sheet.
- **Do not** copy WWTBAM logo/music/font.
- Every Phase 02 decision must cite **this audit** file + line.

---

## Appendix A — Evidence Index (file:line)

| Evidence | File:Line |
|----------|-----------|
| `APP_VERSION` / `WEB_APP_URL` / `?v=16` / `sipanda_version` | `index.html:54-78,164-173` |
| `MAPEL_LIST` 8 mapel | `index.html:82-91` |
| `Icon` / `shuffleArray` / `hashString` / `renderContent` | `index.html:93-144` |
| `App view router` / `isFullScreenView` | `index.html:148,377` |
| `gamesList fallback SAMPLE_GAMES` | `index.html:161` |
| `startGame` / `replayGame` / `exitGame` | `index.html:208-223` |
| `finishGame` / `canSaveGameResult` / `POST saveGameResult` | `index.html:225-258` |
| `DaftarTugas Bonus slot` | `index.html:1036-1056` |
| `DaftarMateri Bonus slot` | `index.html:1157-1175` |
| `StudentDashboard banner` | `index.html:877` |
| `Dispatcher 17 cabang + fallback` | `index.html:476-655` |
| `ExamInterface` | `index.html:1186` |
| `GAME_TYPE_META` / `GAME_TYPES` / `gameTheme` | `games/GameShell.js:7-29` |
| `canSaveGameResult 30s` | `games/GameShell.js:34-42` |
| `GAME_DIFFICULTY` / `DifficultySelect` / `GameHud` / `GameResultModal` | `games/GameShell.js:53-340` |
| `SAMPLE_GAMES 28` | `games/gameData.js:16` |
| `GameHub lobby` | `games/GameHub.js:10-152` |
| `WEB_APP_URL admin` / `MAPEL_LIST` admin | `admin.html:17,19` |
| `GameAdminPanelStandalone` / `BANK_FORMAT_GUIDE` / `type select 17` | `admin.html:272-430` |
| `AdminDashboardFull tabs` | `admin.html:473,643-648` |
| `GAMES_SHEET` / `GAME_RESULTS_SHEET` / `GAMES_HEADER` / `GAME_RESULTS_HEADER` | `code.gs:1-6` |
| `doGet getInitData 7 sheets` | `code.gs:8-106` |
| `doPost 11 actions` | `code.gs:109-334` |
| `readGames_` / `readGameResults_` / `getOrCreateSheet_` | `code.gs:340-421` |
| `seedSampleGames 28` | `code.gs:475-981` |
| `code_v2 header intended canonical` | `code_v2.gs:1-16` |
| `B1–B4 PNG metadata 1672×941 / 941×1672, PNG header` | `Get-ChildItem` + `System.Drawing.Image` (§8) |
| `git status rebase / log 32b46f5` | `bash git status` |
| `git diff code.gs vs code_v2.gs` | `bash git diff --no-index` |

## Appendix B — Decision Matrix (Phase 01 Audit — Actual Repository)

| Area | Current State | Decision | Evidence | Risk |
|------|---------------|----------|----------|------|
| Game dispatcher | 17 branches `index.html:476-655` + fallback `MatchGame`; no `millionaire` branch | Add 1 branch `type==='millionaire'` after `feed` before fallback; no change to 17 | `index.html:476-655`, `GameShell.js:27` | Low |
| Question source | Only `Games.pairs` (`code.gs:355`) & `Soal` (`code.gs:40`); no `MillionaireQuestions` sheet/js | **Dedicated sheet** `MillionaireQuestions` + JS fallback `MillionaireQuestions.js` | `Select-String Millionaire →0`, `Get-ChildItem millionaire` | High if violated |
| Fallback questions | No `MillionaireQuestions.js` | JS fallback 15 demo rows, `// FALLBACK ONLY`, only if production empty | Spec `PHASE_01:122`, repo empty | Low |
| Result storage | `GameResults` 11 cols `code.gs:3`; `readGameResults_` 11-col | **Existing `GameResults`** + 4 additive cols at end (`level,virtualRupiah,safeRupiah,extra`) = 15 cols | `code.gs:3,402` | Medium |
| Score | `skor` 0-100 leaderboard `calcChallengeScore` `GameShell.js:141` | Normalized `skor = round(levelReached/15*100)`; Rupiah separate | `code.gs:3`, `PHASE_01:434` | Medium if conflated |
| Virtual prize | No `virtualRupiah` in repo | **Separate metric** `virtualRupiah`/`safeRupiah` from `PRIZE_LADDER`; not written to `skor` | `PHASE_00:35-53` | Low |
| Backend canonical | `code.gs` 60.792 vs `code_v2.gs` 61.757 — diff only docs | **Intended `code_v2.gs`** (header `code_v2.gs:1-16`), verify deployment before Phase 02 | `git diff --no-index`, `code_v2.gs:1` | **HIGH if unresolved** |
| Namespace | Global pollution `GAME_TYPE_META`, `MAPEL_LIST`, `Icon` etc | `window.SIPANDA_MILLIONAIRE` — no generic `window.STATES` | `GameShell.js:7`, `index.html:82` | Medium |
| Admin | `GameAdminPanelStandalone` 17 types `admin.html:429`; 6 tabs `admin.html:643` | **Dedicated tab** `millionaire` + `MillionaireAdminPanel` separate sheet | `admin.html:292-648` | Medium |
| Desktop layout | No Millionaire layout yet; existing games single-column | Native desktop `Host | Question | Ladder` using `B1/B3` 1672×941 16:9 | `MILLIONAIRE_ASSET_SPEC.md:63`, asset dims | Low |
| Mobile layout | No Millionaire layout yet | Native portrait `Header→Ladder→Q→A-D→Lifelines` using `B2/B4` 941×1672 9:16, **not crop** | `MILLIONAIRE_ASSET_SPEC.md:32,63` | Medium |
| Cache/version | `APP_VERSION v16` + `?v=16` + `localStorage` reload `index.html:164-171`; `WEB_APP_URL` dup `index.html:78`/`admin.html:17` | Bump `v16→v17` atomically for Millionaire files + `APP_VERSION`; assert `WEB_APP_URL` equality | `index.html:54,78,164` | Medium |

## Appendix C — Phase 01 Exit Criteria Checklist (per `PHASE_01:1031-1055`)

- [x] repository architecture telah diverifikasi (§1, `Get-ChildItem`, `System.Drawing`)
- [x] Millionaire module boundary terkunci (D1, §12)
- [x] canonical `type: "millionaire"` terkunci (D2, §6.2)
- [x] namespace strategy terkunci (D3, §7.2)
- [x] question schema terkunci (D6, §4.3)
- [x] dedicated question source terkunci (D4, §4.4)
- [x] fallback policy terkunci (D5, §4.4)
- [x] prize ladder terkunci (D7, §12)
- [x] safe-money contract terkunci (D8, §12)
- [x] score vs Rupiah contract terkunci (D9, §5.3)
- [x] FSM 12 state terdefinisi (D10, §12)
- [x] lifeline contract terdefinisi (D11, §12)
- [x] result integration strategy dipilih (D12, §5.4)
- [x] dashboard integration point ditemukan (§2)
- [x] admin architecture dipilih (D15, §9.2)
- [x] `code.gs` vs `code_v2.gs` canonical status diaudit (§3 — unresolved U1 recorded)
- [x] responsive architecture diverifikasi (§8)
- [x] B1–B4 asset metadata diverifikasi (§8.1, pixel-level)
- [x] namespace collision audit dilakukan (§7)
- [x] cache/version strategy ditemukan (§10)
- [x] unresolved risks dicatat (§13)
- [x] tidak ada production code yang diubah sebagai bagian dari Phase 01 (read-only; only this `.md` created)

---

> **STOP — Phase 01 complete. No Millionaire implementation performed.** Handoff to Phase 02: author `PHASE_02_DATA_CONTRACT.md` using decisions D1–D20 and evidence above.

*— End of PHASE 01 ARCHITECTURE AUDIT —*
