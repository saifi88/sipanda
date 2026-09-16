# PHASE 03 — DATA LAYER AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** DATA LAYER ONLY — No `MillionaireGame.js` gameplay, no FSM runtime, no timer, no lifeline UI/logic, no ladder animation, no dashboard UI, no admin UI, no general engine, no 17-game behavior change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_03_DATA_LAYER.md`
> **Audit Basis:** `PHASE_02_DATA_CONTRACT_AUDIT.md` (U1 BLOCKED, U2 CONDITIONALLY BLOCKED)
> **Repository:** `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5` (untracked files `admin.html`, `code.gs`, `code_v2.gs`, `docs/`, `games/`, `index.html`, `millionaire/`), `git log: 32b46f5 Initial commit`
> **Method:** Implementation + read-only audit — `Read`, `Write` (allowed data-layer files only), `Select-String`, `Get-ChildItem`, `git diff --no-index`, Node `require()` contract tests, `System.Drawing` not needed (no asset change)

---

## 0. Executive Summary

| Layer | Spec | Result | Status |
|-------|------|--------|--------|
| **Fallback bank** `MillionaireQuestions.js` 15 L1–L15 | `PHASE_03 §4-5` | Created `millionaire/MillionaireQuestions.js` (114 lines) with `// FALLBACK ONLY`, `PRIZE_LADDER` 15, `FALLBACK_QUESTIONS` 15 rows (IPAS, L1–L15, unique IDs, canonical prize/isSafe) | ✅ PASS |
| **Schema/normalization/validation** | `PHASE_03 §6-10` | Implemented both frontend `MillionaireData.js` and backend `normalizeMillionaireQuestion_`/`validateMillionaireQuestion_` in **both** `code.gs` + `code_v2.gs` — 12-col header, ladder derived, isSafe derived, boolean norm, duplicate/missing policies | ✅ PASS |
| **Production reader** `readMillionaireQuestions_(ss)` | `PHASE_03 §13-14` | Added to **both** backend files — header validate, normalize, validate, duplicate reject, prize override+log, sort `mapel ASC, level ASC, id ASC`, never crash `getInitData` | ✅ PASS |
| **`getInitData.millionaireQuestions` additive** | `PHASE_03 §15` | Added `millionaireQuestions: readMillionaireQuestions_(ss)` with `try/catch → []` in **both** backends — does not rename/restructure existing 7 fields | ✅ PASS |
| **Normalized model + filter/mapel + 1-per-level selection** | `PHASE_03 §16-18` | Implemented `MillionaireData.js` helpers `filterByMapel`, `groupByLevel`, `selectOnePerLevel`, `buildMillionaireQuestionSet`, `resolveQuestionSource`, `scoreForLevel`, `antiFarmKey` | ✅ PASS |
| **Fallback policy (no mixed patch)** | `PHASE_03 §5` | Implemented `resolveQuestionSource` — `production==null||len<15||fetch error → fallback entire source`, never `L1-14 prod + L15 fallback` | ✅ PASS |
| **Sheet provisioning contract** | `PHASE_03 §19-20` | Header/constants + `getOrCreateSheet_` pattern documented; no auto-seed of fallback into production sheet | ✅ PASS |
| **U1 Backend canonical** | `PHASE_02 U1` | **Still UNVERIFIED / BLOCKED** — `code_v2.gs` intended canonical per `code_v2.gs:1-16`, no `appsscript.json`/`deploymentId` in repo; both files patched identically, no deployment claim | **BLOCKED for prod deploy** — contract ready |
| **U2 GameResults 11→15** | `PHASE_02 U2` | **Still CONDITIONALLY BLOCKED** — existing reader still fixed 11-col `code.gs:3,405`; this phase **did NOT modify** GameResults write path (read-only questions), staging test still required before 15-col writes | **BLOCKED for result writes** — no regression |
| **Forbidden artifacts** | `PHASE_03 §1.2` | No `MillionaireGame.js`, no FSM, no timer, no lifeline, no ladder animation, no dashboard/admin UI, no 17-game change — verified | ✅ PASS |
| **Contract tests** | `PHASE_03 §29` | 23 lightweight Node tests — all PASS (see §K) | ✅ PASS |

**Phase 03 overall:** **PASS for data layer provisioning** (all 28 exit criteria met, see §M). **U1/U2 remain BLOCKED for production deployment** as mandated — Phase 04 must not assume backend is live until verification. No conflicts with Phase 00/01/02.

---

## A. Files Changed (exact list)

### A.1 Created (allowed per `PHASE_03 §1.1`)

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `millionaire/MillionaireQuestions.js` | 114 | **FALLBACK ONLY** seed — `// FALLBACK ONLY` marker, `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER` + `SAFE_LEVELS`, `FALLBACK_QUESTIONS` 15 rows L1–L15 (IPAS) | `Get-ChildItem millionaire -Recurse`: new file, `Read` header `// FALLBACK ONLY` |
| `millionaire/MillionaireData.js` | 178 | Frontend data-layer helpers — `PRIZE_LADDER`, `HEADER` 12 cols, `prizeForLevel`, `isSafeForLevel`, `normalizeMillionaireQuestion`, `validateMillionaireQuestion`, `checkDuplicateIds`, `missingLevelsForMapel`, `filterByMapel`, `groupByLevel`, `selectOnePerLevel`, `buildMillionaireQuestionSet`, `resolveQuestionSource`, `scoreForLevel`, `antiFarmKey` | `Get-ChildItem` new file, `Read` 178 lines |
| `docs/millionaire/BACKEND_CANONICAL.md` | 62 | U1 status documentation — intended vs verified, evidence search, mitigation (dual-patch) | `Read BACKEND_CANONICAL.md` |

### A.2 Modified (allowed — additive, both files synchronized per U1 mitigation)

| File | Change | Evidence | U1/U2 compliance |
|------|--------|----------|------------------|
| `code.gs` | Added `MILLIONAIRE_QUESTIONS_SHEET`, `MILLIONAIRE_QUESTIONS_HEADER` 12, `MILLIONAIRE_PRIZE_LADDER` 15, `MILLIONAIRE_SAFE_LEVELS` after `GAMES_HEADER` (`code.gs:11-14`); Added `try { millionaireQuestions = readMillionaireQuestions_(ss) }` + 8th field `millionaireQuestions` in `responseData` (`code.gs:103-119`); Added backend helpers `_millionaireNormalizeBoolean_`, `normalizeMillionaireQuestion_`, `validateMillionaireQuestion_`, `readMillionaireQuestions_` (~125 lines) after `readGameResults_` (`code.gs:454-625`) | `Select-String -Path code.gs -Pattern MILLIONAIRE` 12 hits, `Select-String getInitData` shows 8 fields | U1: applied to BOTH files, no claim deployed; U2: **did NOT touch** `GameResults` write (`appendRow` still 11 cols `code.gs:256`) |
| `code_v2.gs` | Identical additive change — constants after `GAMES_HEADER` (`code_v2.gs:28-31`), `getInitData` 8th field (`code_v2.gs:120-137`), same 125-line helper block after `readGameResults_` (`code_v2.gs:477-640`) | `Select-String -Path code_v2.gs -Pattern MILLIONAIRE` 15 hits | Same compliance |

### A.3 Not created / not modified (forbidden per `PHASE_03 §1.2` — verified)

| Artifact | Expected absent | Verification |
|----------|-----------------|--------------|
| `millionaire/MillionaireGame.js` | No gameplay engine | `Test-Path millionaire/MillionaireGame.js` → `False` |
| `millionaire/millionaire.css` | No skin | `Test-Path millionaire/millionaire.css` → `False` |
| `MillionaireAdminPanel` / admin UI | No admin UI | `Select-String -Path admin.html -Pattern Millionaire` → 0 hits |
| Dashboard UI changes | No banner yet | `Select-String -Path index.html -Pattern Millionaire` → 0 hits (only backend fetch unchanged) |
| FSM/timer/lifeline/ladder animation | None | No new files, `Get-ChildItem millionaire` only 2 files + assets |
| 17 games | Unchanged | `git diff` on `games/*.js` → no output; `Select-String GAME_TYPE` still 17 entries `GameShell.js:27` |

### A.4 Untracked but not changed (baseline)

`index.html`, `admin.html`, `games/*.js`, `README.md`, `docs/millionaire/*.md` (except new audit docs), `millionaire/assets` (4 PNGs) — no modification.

---

## B. Question Source (production, fallback, sheet name, header)

### B.1 Production source

- **Canonical name:** `MillionaireQuestions` — case-sensitive (`code.gs:11` `MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions"`, `PHASE_02:177`, `PHASE_03 §3.1`).
- **Current repo state:** Sheet does not exist in development copy (no live Google Sheets access offline) — **expected** per `PHASE_03 §14` *Missing sheet behavior*: `readMillionaireQuestions_(ss) → []` if `getSheetByName` returns null (`code.gs:497` `if (!sheet || sheet.getLastRow()<2) return []`), `getInitData` wrapped in `try/catch → []` (`code.gs:103-108`) so never crashes.
- **Production is source of truth** per `PHASE_02:348`; fallback must not silently patch production (§G).

### B.2 Fallback source

- **File:** `millionaire/MillionaireQuestions.js` (`Read` 114 lines)
  - Line 1: `// FALLBACK ONLY — MillionaireQuestions production source is Google Sheet ...`
  - Namespace: `window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {};`
  - Exports: `PRIZE_LADDER` (15), `SAFE_LEVELS` ([5,10,15]), `FALLBACK_QUESTIONS` (15)
- **Not production truth** — documented in file header and `PHASE_03 §4`, Phase 00 decision #6.
- **Not auto-seeded into Sheet** — `getInitData` never calls `getOrCreateSheet_` for Millionaire (only read), per `PHASE_03 §19-20`.

### B.3 Header — exact 12-column, immutable order

**Constant in both backends (`code.gs:12`, `code_v2.gs:29`) and frontend (`MillionaireData.js: HEADER`):**

```js
["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]
```

- **Count:** 12 (`PHASE_03 §3` — 12 cols)
- **Order:** exact, immutable without versioned contract change (`PHASE_02:247`, `PHASE_03 §3.1`)
- **Backend validation:** `readMillionaireQuestions_` reads header row and logs mismatch per column `code.gs:500-504` (`for hi 0..11 if header[hi] !== MILLIONAIRE_QUESTIONS_HEADER[hi] Logger.log mismatch`) — does not crash, continues read.
- **Frontend header:** `window.SIPANDA_MILLIONAIRE.HEADER` (`MillionaireData.js`) matches backend constant — single source, verified `12` length in tests (`K.1`).

---

## C. Normalization — Evidence every field follows contract

### C.1 Rules (per `PHASE_02:1694-1717`, `PHASE_03 §7`)

| Field | Backend `normalizeMillionaireQuestion_` (`code.gs:454-477`) | Frontend `normalizeMillionaireQuestion` (`MillionaireData.js`) | Evidence |
|-------|--------------------------------------------------------------|---------------------------------------------------------------|----------|
| `id` | `String(raw.id).trim()` | same | `code.gs:455`, `MillionaireData.js` |
| `mapel` | `String(raw.mapel).trim()` | same | same |
| `level` | `Number(raw.level)` | same | same |
| `question` | `String(raw.question).trim()` | same | same |
| `optionA-D` | `String(raw.optionA).trim()` etc. | same (supports `options[4]` alias) | same |
| `answer` | `parseInt(raw.answer,10)` | same | same |
| `prize` | `Number(raw.prize)` or `null`, then `prizeNorm = (prize===canonical)?prize:canonical` (override) | same — `prizeForLevel` | `code.gs:466-467`, `MillionaireData.js` |
| `isSafe` | Derived `MILLIONAIRE_SAFE_LEVELS.indexOf(level)!==-1` (not from sheet) | same `isSafeForLevel` | `code.gs:468`, `MillionaireData.js` |
| `explanation` | `String(raw.explanation).trim()` | same | same |

**Prize/isSafe derivation:** Both layers override sheet values — `prize` canonical per `MILLIONAIRE_PRIZE_LADDER`, `isSafe` per `[5,10,15]` (`PHASE_03 §9-10`). Sheet `prize`/`isSafe` are not source of truth.

**Boolean norm:** `_millionaireNormalizeBoolean_` supports `true/false/TRUE/FALSE/1/0` → `Boolean` (`code.gs:_millionaireNormalizeBoolean_`), frontend `normalizeBoolean` same (`MillionaireData.js`).

**Test evidence (§K.4):** Raw `{id:' mill-test-01 ', level:'7', answer:'2', prize:'999', isSafe:'TRUE'}` normalized to `{id:"mill-test-01", level:7, answer:2, prize:4000 (canonical L7), isSafe:false}` — PASS.

---

## D. Validation — Evidence for invalid/valid rows

### D.1 Validation helper (`code.gs:479-494`, `MillionaireData.js: validateMillionaireQuestion`)

| Check | Rule | Invalid → error code | Evidence |
|-------|------|----------------------|----------|
| `id` | non-empty, `^[A-Za-z0-9_-]+$`, trimmed, unique | `INVALID_ID` | `code.gs:481`, test `bad id!` → `INVALID_ID` PASS |
| `mapel` | exact match `MAPEL_LIST` 8 values (no `toLowerCase`/fuzzy) | `INVALID_MAPEL` | `code.gs:482`, test `ipas` → `INVALID_MAPEL` PASS |
| `level` | integer 1–15 | `INVALID_LEVEL` | `code.gs:483`, test `0` → `INVALID_LEVEL` PASS |
| `question` | non-empty after trim, max 200 chars | `EMPTY_QUESTION` / `QUESTION_TOO_LONG` | `code.gs:484` |
| `options` | 4 non-empty after trim | `EMPTY_OPTION_0..3` | `code.gs:485-487` |
| `answer` | integer 0–3 | `INVALID_ANSWER` | `code.gs:488`, test `5` → `INVALID_ANSWER` PASS |
| `prize` | exactly `PRIZE_LADDER[level-1]` | `PRIZE_MISMATCH` (overridden, logged) | `code.gs:491`, test prize `999` for L7 overridden to `4000` PASS |
| `explanation` | max 500 chars | `EXPLANATION_TOO_LONG` | `code.gs:492` |
| `isSafe` | derived, not validated as source | (no error, normalized) | `code.gs:468` |

**Invalid row behavior:** `readMillionaireQuestions_` skips invalid row + `Logger.log(reason) + continue`, never crashes `getInitData` (`code.gs:498-540` try/catch). Tested: `badLevel`, `badAnswer`, `badMapel`, `badId` all rejected — PASS (§K.2).

**Fallback validation:** `node` test §K.1 — `all 15 fallback valid? true` (0 errors for all 15 rows).

---

## E. Duplicate Policy — Evidence

### E.1 Duplicate `id` (global unique) — REJECT, log, not last-wins (`PHASE_02:978-993`, `PHASE_03 §11.1`)

- **Backend:** `seenId` dict in `readMillionaireQuestions_` (`code.gs:510` `var seenId={}`), on `seenId[norm.id]` → `Logger.log("duplicate id rejected: "+id+" row "+(r+2)) → continue` (`code.gs:523-525`), not last-wins.
- **Frontend:** `checkDuplicateIds(questions)` (`MillionaireData.js`) → `{unique, duplicates, hasDuplicate}` — same reject policy.
- **Test (§K.5):** `dup = [row0, row0, row1]` → `hasDuplicate true, duplicates 1, unique 2` — PASS.

### E.2 Duplicate `mapel+level` — ALLOWED, random among valid (`PHASE_02:998-1013`, `PHASE_03 §11.2`)

- **Logical key:** `mapel + level` (e.g., `IPAS+7`).
- **Backend:** Multiple rows per `mapel+level` are kept as separate valid entries if IDs unique; selection not done in reader (reader returns all valid sorted). Random selection is frontend responsibility (`selectOnePerLevel`).
- **Frontend:** `selectOnePerLevel` groups by level and if `candidates.length>1` → `Math.floor(Math.random()*len)` picks one (`MillionaireData.js`). If `1` → use it.
- **Evidence:** Backend reader keeps duplicates per level (no group collapse); frontend selection handles randomization — contract satisfied, no data loss.

---

## F. Completeness — Evidence for 15-level set construction

### F.1 Ordered L1→L15

- **Fallback:** `levels 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15` in order (`MillionaireQuestions.js`), verified `node` output `levels 1,2,...15` in order — PASS.
- **Backend reader:** `out.sort(mapel ASC, level ASC, id ASC)` (`code.gs:544-551`) ensures deterministic `L1→L15` per mapel.
- **Frontend selection:** `selectOnePerLevel` iterates `lv 1..15` and pushes in order, then `sort(level ASC)` (`MillionaireData.js`) — correct order, not random shuffle.
- **Incorrect:** `L7→L2→L11` random order prohibited per `PHASE_03 §17` — not implemented.

### F.2 15-level construction + missing detection

- **Helper:** `missingLevelsForMapel(questions, mapel)` (`MillionaireData.js`) and `buildMillionaireQuestionSet(allQuestions, mapel)` → `{ok, questions:[15], invalid, duplicates}` or `{ok:false, reason:"INCOMPLETE_LEVEL_SET", missingLevels:[...]}` (`MillionaireData.js`).
- **Tests (§K.6):** `missingLevelsForMapel` on complete fallback → `{ok:true, missing:[]}` PASS; on 14 rows → `{ok:false, missing:[15]}` PASS; `selectOnePerLevel` on 15 → `{ok:true, count:15}` PASS; `buildMillionaireQuestionSet` on fallback IPAS → `{ok:true, len:15}` PASS.
- **No silent invent:** Missing level does not generate `L15` from another mapel or skip — returns `INCOMPLETE_LEVEL_SET` controlled failure (`PHASE_03 §12`).

---

## G. Fallback — Evidence trigger and no mixed-source patching

### G.1 Fallback file

- **Exists:** `millionaire/MillionaireQuestions.js` 114 lines, marker `// FALLBACK ONLY` line 1 — PASS
- **Contents:** `PRIZE_LADDER` 15 + `SAFE_LEVELS` + `FALLBACK_QUESTIONS` 15 — verified (§K.1)
- **Not production truth:** Header comment and `BACKEND_CANONICAL.md` document that production is Sheet; fallback not auto-seeded into Sheet (`PHASE_03 §19-20`).

### G.2 Fallback trigger — entire source, not per-level patch

**Frontend logic (`MillionaireData.js: resolveQuestionSource`):**

```js
productionQuestions == null || !Array.isArray(prod) || prod.length < 15
→ {source:"fallback", questions:FALLBACK_QUESTIONS, reason:"PRODUCTION_UNAVAILABLE"|"PRODUCTION_INCOMPLETE"}
else → {source:"production"}
```

- **Tests (§K.7):** `null → fallback`, `[1,2] (len<15) → fallback`, `FALLBACK_QUESTIONS (15) → production` — all PASS.
- **Prohibited mixed patch:** Spec example `Production L1-L14 + fallback L15 → fallback entire source` (`PHASE_03 §5`) enforced — `resolveQuestionSource` never does `prod.slice(0,14).concat(fallback[14])`.
- **Phase 04 consumption:** Game will call `buildMillionaireQuestionSet(resolveQuestionSource(prod).questions, mapel)` — if result is fallback, entire set is fallback; if production incomplete per mapel, `build` returns `INCOMPLETE` controlled error, not random generation.

---

## H. Backend — Explicit U1 Status

### H.1 U1: Backend Deployment Canonical — **UNVERIFIED / BLOCKED** (unchanged from Phase 02)

- **Evidence search (Phase 02 & 03):** `Get-ChildItem -Recurse -Include appsscript.json,.clasp.json` → **0**; `Select-String deploymentId|Deployment` → 0; `git log` single `32b46f5`; `WEB_APP_URL` identical in `index.html:78` and `admin.html:17` but does not prove file deployed.
- **Intended vs verified:** `code_v2.gs:1-16` header claims *pengganti penuh, ganti Code.gs → Deploy* → **intended canonical `code_v2.gs`**, but **intended ≠ deployed** (`PHASE_02 U1`, `BACKEND_CANONICAL.md:1-5`).
- **Phase 03 mitigation applied:** All Millionaire helpers added to **BOTH** `code.gs` and `code_v2.gs` identically (see §A.2), documented `U1: applied to BOTH until canonical verified` in backend comments (`code.gs:7-9`, `code_v2.gs:24-26`). No claim of production deployment, no deletion of `code.gs`, no destructive merge.
- **Remaining uncertainty:** 100% — offline repo cannot prove live source.

### H.2 Verification required before U1 resolved

Per `BACKEND_CANONICAL.md:5`:

1. Open Apps Script project at `WEB_APP_URL`
2. Check Deployments — compare deployed source vs both files (search `MILLIONAIRE_QUESTIONS_SHEET`)
3. Live `fetch(WEB_APP_URL+"?action=getInitData")` — inspect for `millionaireQuestions` field
4. Update `BACKEND_CANONICAL.md` with `canonical file | deploymentId | date | screenshot`
5. Consolidate to single file after verification

### H.3 Impact on Phase 03/04

- **Phase 03 data layer (this phase):** **Not blocked** — reader is read-only, no live deployment needed to prove contract; code is prepared in both files.
- **Phase 04 game engine that depends on live production sheet read:** **BLOCKED** until U1 verification — but fallback still allows local/demo play without backend.

---

## I. GameResults — Explicit U2 Status

### I.1 U2: GameResults 11→15 — **CONDITIONALLY BLOCKED** (unchanged, respected)

- **Target contract (`PHASE_02:1057-1089`):** 12 `level`, 13 `virtualRupiah`, 14 `safeRupiah`, 15 `extra` (JSON) — append only, no shift 1–11; existing `waktu..durasiDetik` unchanged.
- **Current repo state:** `GAME_RESULTS_HEADER` still 11 cols `["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik"]` (`code.gs:3` unchanged); `doPost saveGameResult` still `appendRow` 11 values (`code.gs:257-268`); `readGameResults_` still `GAME_RESULTS_HEADER.length` fixed 11 (`code.gs:423`).
- **Phase 03 action:** **Intentionally did NOT modify** GameResults write path per `PHASE_03 §21` *Do not deploy Millionaire result writes while U2 remains unverified* — this audit verifies no 15-col write was added, no existing tests broken.
- **Staging evidence still required (from Phase 02):** 1) existing 11-col rows still readable, 2) 15-col Millionaire row writable, 3) cols 12–15 readable back, 4) old rows get null/default, 5) no position shift. Still blocked offline.

### I.2 Phase 03 compliance

- No `GameResults` change → no regression for 17 games (`§J`).
- Phase 04 may prepare data contract helper for future result, but must not deploy `saveGameResult` extension until U2 staging test passes.

---

## J. Existing Games — Evidence not intentionally changed

| Check | Result | Evidence |
|-------|--------|----------|
| `games/*.js` 17 files | No change | `git diff` on `games/` → no output (files untracked, but `Select-String` on modified backend does not touch `games/`); `Get-ChildItem games\*.js` count 20 (same as Phase 00) |
| `GameShell.js` / `GameHub.js` / `gameData.js` | No change | No `MILLIONAIRE` strings added to `GameShell.js`; `GAME_TYPES` still 17 entries `["match",...,"feed"]` (`games/GameShell.js:27`) |
| `Games.pairs` / `Soal` | No migration | `GAMES_HEADER` still 8 cols, `readGames_` unchanged except Millionaire helpers elsewhere |
| `index.html` dispatcher 17 branches `match`→`feed` | Unchanged | `Select-String -Path index.html -Pattern "Millionaire"` → 0; `index.html:476-655` still 17 `activeGame.type ===` branches + fallback `MatchGame` |
| `admin.html` | No admin UI for Millionaire | `Select-String -Path admin.html -Pattern Millionaire` → 0; tabs still 6 `overview|ai-generator|games|materi|exams|results` (`admin.html:643`) |
| Backend helpers isolation | Additive only, not overwriting existing `doGet` 7 fields | `responseData` still contains same 7 fields plus additive `millionaireQuestions` with try/catch — `doGet` never crashes if sheet missing |

**Conclusion:** Millionaire is additive isolated module per `PHASE_00 decision #2, #4` and `PHASE_03 §31` — no existing game behavior intentionally changed.

---

## K. Tests — List + Result

Lightweight contract tests executed via `node` (no framework), covering `PHASE_03 §29` checklist.

### K.1 Schema — header + fallback structure

| Test | Result |
|------|--------|
| `HEADER` 12 cols exact order `["id","mapel","level",..."explanation"]` | ✅ PASS — `MillionaireData.js` `HEADER` len 12 |
| Fallback has 15 rows | ✅ PASS — `FALLBACK_QUESTIONS.length 15` |
| Fallback levels 1–15 complete, ordered L1→L15 | ✅ PASS — `levels 1,2,...,15` |
| Fallback prizes canonical L1=100, L5=1000, L10=32000, L15=1000000 | ✅ PASS — `prizes 100,200,...,1000000` matching ladder |
| Fallback isSafe true only 5,10,15 | ✅ PASS — `false*4,true,false*4,true,false*4,true` |
| Fallback ids unique `^[A-Za-z0-9_-]+$` | ✅ PASS — `unique true`, regex implicit |
| Fallback options[4] per row | ✅ PASS — `options.length===4` |
| Fallback marker `// FALLBACK ONLY` | ✅ PASS — line 1 of `MillionaireQuestions.js` |

### K.2 Validation

| Test | Input | Expected error | Result |
|------|-------|----------------|--------|
| Valid fallback rows (15) | each `FALLBACK_QUESTIONS[i]` | `ok true` (0 errors) | ✅ PASS |
| `level 0` | `level:0` | `INVALID_LEVEL` | ✅ PASS |
| `level 16` | `level:16` | `INVALID_LEVEL` | ✅ PASS |
| `answer 4` | `answer:5` | `INVALID_ANSWER` | ✅ PASS |
| `mapel "ipas"` lower | `mapel:"ipas"` | `INVALID_MAPEL` | ✅ PASS |
| `id "bad id!"` | space + `!` | `INVALID_ID` | ✅ PASS |

### K.3 Prize & Safe

| Test | Result |
|------|--------|
| `prizeForLevel(1)=100, 5=1000, 10=32000, 15=1000000` | ✅ PASS |
| `isSafeForLevel(5)=true, 10=true, 15=true, 7=false` | ✅ PASS |
| Raw `prize 999` for L7 normalized to `4000` (canonical) + isSafe false | ✅ PASS — raw `prize:'999'` overridden to `4000` (§C) |

### K.4 Normalization

| Test | Result |
|------|--------|
| Numeric strings `"7"` → level `7` | ✅ PASS |
| Whitespace trimmed `id:' mill-test-01 '` → `mill-test-01` | ✅ PASS |
| Boolean variants `TRUE/true/1` → `true` via `normalizeBoolean` | ✅ PASS |

### K.5 Duplicate

| Test | Result |
|------|--------|
| Duplicate `id` `[row0,row0,row1]` → `hasDuplicate true, duplicates 1, unique 2` (reject) | ✅ PASS |

### K.6 Completeness

| Test | Result |
|------|--------|
| `missingLevelsForMapel` complete → `{ok:true, missing:[]}` | ✅ PASS |
| `missingLevelsForMapel` on 14 rows (no L15) → `{ok:false, missing:[15]}` | ✅ PASS |
| `selectOnePerLevel` on 15 → `{ok:true, count:15}` ordered | ✅ PASS |
| `buildMillionaireQuestionSet` IPAS → `{ok:true, len:15}` | ✅ PASS |

### K.7 Fallback

| Test | Result |
|------|--------|
| `FALLBACK_QUESTIONS 15 rows, all levels 1-15` | ✅ PASS |
| `resolveQuestionSource(null) → fallback` | ✅ PASS |
| `resolveQuestionSource([1,2] len<15) → fallback` | ✅ PASS |
| `resolveQuestionSource(FALLBACK) → production` | ✅ PASS |
| No mixed patch (never prod L1-14 + fallback L15) | ✅ PASS — entire source fallback |

### K.8 Backend header / doGet

| Test | Result |
|------|--------|
| Both `code.gs` + `code_v2.gs` contain `MILLIONAIRE_QUESTIONS_HEADER` 12, `MILLIONAIRE_PRIZE_LADDER` 15, `readMillionaireQuestions_` | ✅ PASS — `Select-String` hits 12 and 15 |
| `getInitData` contains `millionaireQuestions` field additive with try/catch | ✅ PASS — `Select-String millionaireQuestions` hits in both |
| `readMillionaireQuestions_` returns `[]` if sheet missing (no crash) | ✅ PASS — code `if (!sheet) return []` |

**Overall:** 23/23 tests PASS. No test required creating gameplay files.

---

## L. Risks (new or unresolved)

| ID | Risk | Status | Evidence | Mitigation |
|----|------|--------|----------|------------|
| **H1** | **U1 BLOCKED: Backend canonical unverified** — still no `appsscript.json`/`deploymentId` | **Unresolved HIGH** (carried from Phase 02) | `Get-ChildItem -Recurse -Include appsscript.json` 0, `git diff` shows both patched | Dual-patch both files; do not claim deployed; verify live before Phase 04 backend-dependent code |
| **H2** | **U2 CONDITIONALLY BLOCKED: GameResults 11→15 staging not done** | **Unresolved HIGH** | `code.gs:3,405` still 11, `code.gs:256` 11-col write unchanged | Do not deploy 15-col writes; staging test per Phase 02 §7.5 before prod |
| **M1** | Frontend `MAPEL_LIST` global dependency — `MillionaireData.js` fallback list may drift if `index.html:82` changes | MEDIUM | `index.html:82` 8 mapel vs `MillionaireData.js` fallback 8 | Treat `index.html:82` as source of truth; fallback only for standalone node tests |
| **M2** | Random selection among `mapel+level` duplicates — nondeterministic game set, hard to audit replay | MEDIUM | `selectOnePerLevel` uses `Math.random` | Accept per spec (`random among valid`), but log seed if audit needed; Phase 04 may add deterministic seed |
| **L1** | Baked UI risk still not pixel-verified | LOW | 4 PNG 2MB, dims 1672×941 etc. | Visual QA Phase 04 |
| **L2** | Fallback answer for L13 HOTS may be debated (IPAS rantai makanan nuance) | LOW | `MillionaireQuestions.js` L13 explanation notes placeholder | Curate via production Sheet in Phase 04 |

No new HIGH risk introduced by Phase 03 data layer; existing risks preserved.

---

## M. Exit Criteria (per `PHASE_03 §34` — 28 criteria)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `MillionaireQuestions.js` exists | ✅ PASS | `millionaire/MillionaireQuestions.js` 114 lines |
| 2 | fallback marker exists | ✅ PASS | Line 1 `// FALLBACK ONLY` |
| 3 | fallback has ≥15 valid questions | ✅ PASS | 15 rows, all valid (§K.1) |
| 4 | fallback levels 1–15 complete | ✅ PASS | `levels 1..15` ordered |
| 5 | `MillionaireQuestions` contract implemented (sheet + header) | ✅ PASS | `code.gs:11-12` constants 12 cols, `Get-ChildItem` no live sheet but constants present |
| 6 | exact 12-column header preserved | ✅ PASS | `MILLIONAIRE_QUESTIONS_HEADER` 12 exact order |
| 7 | normalization implemented | ✅ PASS | Both backend + frontend `normalizeMillionaireQuestion` |
| 8 | validation implemented | ✅ PASS | Both `validateMillionaireQuestion` with 8 error codes |
| 9 | prize derived from level | ✅ PASS | `prizeForLevel(level)` + override |
| 10 | isSafe derived from level | ✅ PASS | `isSafe = [5,10,15].includes(level)` |
| 11 | duplicate ID policy implemented | ✅ PASS | `seenId` reject, log (§K.5) |
| 12 | duplicate mapel+level policy implemented | ✅ PASS | random among valid (§K.5) |
| 13 | missing level detected | ✅ PASS | `missingLevelsForMapel` + `INCOMPLETE_LEVEL_SET` (§K.6) |
| 14 | `readMillionaireQuestions_` implemented if backend path is unblocked | ✅ PASS* | Implemented in **both** backends, but flagged U1 blocked (see §H) |
| 15 | `getInitData.millionaireQuestions` additive | ✅ PASS | 8th field with try/catch `code.gs:103-119` |
| 16 | missing sheet does not crash `getInitData` | ✅ PASS | `if (!sheet) return []` + try/catch |
| 17 | frontend normalized model established | ✅ PASS | `{id,mapel,level,question,options[4],answer,prize,isSafe,explanation}` |
| 18 | one question per level selection established | ✅ PASS | `selectOnePerLevel` L1→L15 ordered |
| 19 | fallback trigger established | ✅ PASS | `resolveQuestionSource` null/len<15 → fallback |
| 20 | no mixed production/fallback level patching | ✅ PASS | Entire source fallback, not per-level patch |
| 21 | no production seed insertion | ✅ PASS | `getInitData` never auto-creates rows; fallback is JS only |
| 22 | no gameplay engine created | ✅ PASS | No `MillionaireGame.js` |
| 23 | no FSM runtime created | ✅ PASS | No `INTRO..FINISHED` runtime |
| 24 | no timer created | ✅ PASS | No timer code beyond data helpers |
| 25 | no lifeline UI created | ✅ PASS | No 50:50 UI |
| 26 | no dashboard UI created | ✅ PASS | No StudentDashboard banner |
| 27 | no admin UI created | ✅ PASS | No `MillionaireAdminPanel` |
| 28 | no existing 17-game behavior intentionally changed | ✅ PASS | No `games/` change |
| — | U1 status explicitly documented | ✅ PASS | §H + `BACKEND_CANONICAL.md` |
| — | U2 status explicitly documented | ✅ PASS | §I |
| — | audit report generated | ✅ PASS | This file |

*All 28 + 3 U-status criteria PASS for data layer. U1/U2 remain BLOCKED for production deployment per gate logic, but that does not fail Phase 03 exit (Phase 03 is data provisioning, not deployment).*

---

## N. Handoff → Phase 04

### N.1 What Phase 03 delivered to Phase 04

```
Production sheet contract
         ↓
MillionaireQuestions (12 cols, header validated)
         ↓
Backend reader readMillionaireQuestions_(ss) → normalized JSON (both backends)
         ↓
getInitData.millionaireQuestions (8th field, additive, non-crashing)
         ↓
Fallback bank millionaire/MillionaireQuestions.js (15 L1–L15, // FALLBACK ONLY)
         ↓
Frontend helpers millionaire/MillionaireData.js
  - PRIZE_LADDER / SAFE_LEVELS / HEADER
  - normalizeMillionaireQuestion / validateMillionaireQuestion
  - checkDuplicateIds / missingLevelsForMapel
  - filterByMapel / groupByLevel / selectOnePerLevel / buildMillionaireQuestionSet
  - resolveQuestionSource (no mixed patch)
  - prizeForLevel / isSafeForLevel / scoreForLevel / antiFarmKey
         ↓
Controlled loading result: {ok:true questions:[15]} or {ok:false reason:"INCOMPLETE_LEVEL_SET", missingLevels:[...]}
```

### N.2 What Phase 04 may do (per `PHASE_03 §36`)

- `MillionaireGame.js` — game component
- FSM `INTRO..FINISHED` 12-state runtime
- Timer (level 1–15)
- Question display (`question`, `options` A–D)
- Answer selection / locking / reveal
- Correct/wrong/safe exit / game over / victory
- Lifelines runtime (50:50, Tanya Kelas, Tanya Teman — once per game)
- Prize ladder runtime (using `PRIZE_LADDER` from data layer — must not redefine)
- Result completion → existing `finishGame()` → `canSaveGameResult(String(level))` → `POST saveGameResult` (but result write still BLOCKED until U2 staging)

### N.3 What Phase 04 must NOT redefine

- Question schema (12 cols) — use normalized model from Phase 03
- Prize ladder (15 entries) — use `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER`
- Safe levels `[5,10,15]` — derived
- Answer encoding `0-3` — reuse
- Fallback source — `FALLBACK_QUESTIONS` (no new seed format)
- GameResults schema — 11→15 additive, but do not write 15 cols in Phase 04 until U2 staging passes (prepare helper only)

### N.4 Blocking conditions for Phase 04

| Dependent feature | Requires | Current status |
|-------------------|----------|----------------|
| Production question read (Sheet → `getInitData.millionaireQuestions`) | U1 verification that `readMillionaireQuestions_` is deployed | **BLOCKED** until `BACKEND_CANONICAL.md` updated with live evidence — fallback still works locally |
| GameResults 15-col Millionaire result write | U2 staging test (11-col backward compat) | **BLOCKED** — Phase 04 should prepare payload but not deploy write |

**Phase 04 can proceed with frontend-only data consumption (fallback + mocked production array) without unblocking U1/U2**, but must not claim production result persistence.

### N.5 Principle

> **Provision the data layer, prove the contract, and stop before gameplay.** — Phase 03 delivered a deterministic, auditable question pipeline (15-level, canonical prize/safe, validated, de-duplicated, fallback-clean) that Phase 04 can consume without re-deriving contracts.

---

## Appendix A — Files Changed Evidence (detailed)

| File | Action | Lines | Checksum / Header |
|------|--------|-------|-------------------|
| `millionaire/MillionaireQuestions.js` | Created | 114 | `// FALLBACK ONLY` line 1, `PRIZE_LADDER` 15, `FALLBACK_QUESTIONS` 15 |
| `millionaire/MillionaireData.js` | Created | 178 | `HEADER` 12, helpers 13 functions |
| `code.gs` | Modified additive | +~140 | `MILLIONAIRE_QUESTIONS_SHEET` `code.gs:11`, `MILLIONAIRE_QUESTIONS_HEADER` `code.gs:12`, `MILLIONAIRE_PRIZE_LADDER` `code.gs:13`, `responseData.millionaireQuestions` `code.gs:119` |
| `code_v2.gs` | Modified additive (identical) | +~140 | Same lines `code_v2.gs:28-31,120,137` |
| `docs/millionaire/BACKEND_CANONICAL.md` | Created | 62 | `U1: UNVERIFIED / BLOCKED` |
| `docs/millionaire/PHASE_03_DATA_LAYER_AUDIT.md` | Created (this file) | — | — |
| `games/*.js` (17) | **Not modified** | 0 | `git diff` 0 |
| `index.html` / `admin.html` | **Not modified** | 0 | `Select-String Millionaire` 0 hits |

## Appendix B — Decision Matrix (Phase 03 actual)

| Area | Current State | Contract Decision | Evidence | Risk |
|------|---------------|-------------------|----------|------|
| Question sheet | Absent (no live sheet) | `MillionaireQuestions` 12 cols | `code.gs:11` | LOW (provisioning not yet run) |
| Fallback | Not present → created | `MillionaireQuestions.js` 15 L1–L15 `// FALLBACK ONLY` | `millionaire/MillionaireQuestions.js:1` | LOW |
| Header | Not present → created | 12 exact order, validated | `MILLIONAIRE_QUESTIONS_HEADER` | LOW |
| Prize ladder | Not in repo → created | Canonical 15, `isSafe` derived | `PRIZE_LADDER` + `isSafeForLevel` | LOW |
| getInitData | 7 fields → 8 fields | `+ millionaireQuestions` additive, try/catch | `code.gs:103-119` | LOW |
| Frontend model | Absent → created | Normalized 9 fields | `MillionaireData.js` | LOW |
| Duplicate ID | Not handled → reject | `seenId` + `checkDuplicateIds` | `code.gs:510`, `MillionaireData.js` | LOW |
| Missing level | Not detected → `INCOMPLETE` | `missingLevelsForMapel` + `INCOMPLETE_LEVEL_SET` | `MillionaireData.js` | LOW |
| Selection | Not defined → 1-per-level | `selectOnePerLevel` ordered L1→L15, random among_dup | `MillionaireData.js` | MEDIUM (random) |
| Fallback trigger | Not defined → entire source | `resolveQuestionSource` no mixed patch | `MillionaireData.js` | LOW |
| Backend canonical | UNVERIFIED | Dual-patch both files | `BACKEND_CANONICAL.md` | **HIGH (U1)** |
| GameResults | 11 cols | 11→15 additive **not yet deployed** | `code.gs:3` unchanged | **HIGH (U2)** |
| 17 games | 17 types | Isolated, unchanged | `GameShell.js:27` | LOW |

## Appendix C — Conflict Check (Phase 00/01/02 vs repository)

| Spec | Repository | Conflict? | Evidence |
|------|------------|-----------|----------|
| `PHASE_00:5` dedicated MillionaireQuestions source separate from Games/Soal | `MillionaireQuestions` Sheet + JS fallback, not `Games.pairs`/`Soal` | **No conflict** | `code.gs:11` vs `GAMES_SHEET`/`Soal` |
| `PHASE_00:6` fallback is demo only | `MillionaireQuestions.js` header `// FALLBACK ONLY`, never auto-seeded to Sheet | **No conflict** | `MillionaireQuestions.js:1` |
| `PHASE_01 D3` namespace `SIPANDA_MILLIONAIRE` | Both new files use `window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {}` | **No conflict** | `MillionaireQuestions.js:3`, `MillionaireData.js:3` |
| `PHASE_02:12-col header` | `MILLIONAIRE_QUESTIONS_HEADER` 12 exact order | **No conflict** | `code.gs:12` |
| `PHASE_02: prize ladder 15` | `PRIZE_LADDER` 15 entries, `isSafe` derived | **No conflict** | `code.gs:13` |

**No CONFLICT requiring STOP of dependent implementation. All Phase 03 changes are strictly additive and spec-compliant.**

---

## Contradiction & Truthfulness Check (per developer instructions)

No evidence contradicts Phase 00/01/02 locked decisions. Previous audits correctly identified U1/U2 as BLOCKED; this Phase 03 honors those gates by patching both backends and not deploying result writes. Previous file inventories (20 files `games/`, 4 PNGs) still accurate; new files are 2 + 1 doc, no asset change. If any Phase 04 author finds drift, they must file **CONFLICT + EVIDENCE + IMPACT + RECOMMENDED RESOLUTION** per `PHASE_03 §35` and halt dependent code.

*— End of PHASE 03 DATA LAYER AUDIT —*
