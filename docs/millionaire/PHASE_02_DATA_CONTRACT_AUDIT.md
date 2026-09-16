# PHASE 02 — DATA CONTRACT AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** DATA CONTRACT ONLY — No gameplay, no FSM runtime, no timer, no lifeline UI, no dashboard UI, no admin UI implementation.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md`
> **Audit Basis:** `PHASE_01_ARCHITECTURE_AUDIT.md` (U1–U5 unresolved)
> **Repository:** development copy `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5`, 4 files untracked (`index.html`, `admin.html`, `code.gs`, `code_v2.gs`, `games/`, `millionaire/assets`), `git log: 32b46f5 Initial commit` only
> **Method:** read-only repository evidence (`Read`, `Select-String`, `Get-ChildItem`, `System.Drawing.Image`, `git diff --no-index`), no `npm`/`build`, no live Google Sheets access

---

## 0. Executive Summary

| Gate | Spec Requirement | Audit Result | Status |
|------|------------------|--------------|--------|
| **Gate A — Backend Canonical (U1)** | Verify `code.gs` vs `code_v2.gs` deployment truth, lock canonical file | **Both files functionally identical; no deployment evidence in repo; `code_v2.gs:1-16` claims canonical but unverified** | **BLOCKED** for backend implementation (per `PHASE_02:94-100`). Contract decisions locked, code change must target both files until verified. |
| **Gate B — GameResults 11→15 (U2)** | Additive 4 cols at end, no shift 1–11, backward compat | **Contract verified by code audit; live spreadsheet test impossible offline; reader currently fixed 11-col (`code.gs:405`) → requires code change before production** | **CONDITIONALLY BLOCKED** for write path until reader updated + staging test |
| **Question Sheet** | `MillionaireQuestions` 12-col header, exact order | **Not present in repo; contract locked per `PHASE_02:204-244`** | LOCKED (no live sheet to validate rows) |
| **Validation/Normalization** | Field types, ranges, id/mapel/level/answer/prize/isSafe | **Contract locked; no implementation drift (no helper yet)** | LOCKED |
| **Result Payload** | `skor` 0–100 vs `virtualRupiah/safeRupiah` + `extra` JSON | **Contract locked; no code yet** | LOCKED |
| **Anti-farm** | `String(level)` + 30s key | **Existing `canSaveGameResult` verified; Millionaire mapping locked but not implemented** | LOCKED |

**Overall Phase 02 verdict:** **DATA CONTRACT LOCKED** for all 15 items below, but **Phase 03 implementation (helpers/sheet creation) is BLOCKED for backend write paths that depend on U1/U2** until deployment canonical is verified and staging `GameResults` test passes. All non-backend contracts can proceed to Phase 03 documentation/reader design. This audit satisfies `PHASE_02:2014-2046` exit pre-conditions for *documentation*, not for *code deployment*.

---

## 1. Contract Verification (15 items — evidence-based)

| # | Item (per prompt) | Verification | Evidence |
|---|---|---|---|
| 1 | **U1: canonical backend `code.gs` vs `code_v2.gs`** | **See §2 — BLOCKED** | `code.gs:1-3` vs `code_v2.gs:1-22`, `git diff --no-index` |
| 2 | **U2: `GameResults` 11→15 compatibility** | **See §7 — CONDITIONALLY BLOCKED** | `code.gs:3,405`, `code.gs:256` |
| 3 | **MillionaireQuestions sheet + exact 12-col header** | **See §3 — LOCKED, not present** | `Select-String Millionaire →0`, `Get-ChildItem millionaire` |
| 4 | **Question schema, types, validation, normalization** | **See §4–§5 — LOCKED** | `PHASE_02:250-265`, `index.html:82 MAPEL_LIST`, `games/GameShell.js` |
| 5 | **Mapel + level 1–15 + answer 0–3** | **See §4.2–4.3 — LOCKED** | `index.html:82-91`, `PHASE_02:309-370` |
| 6 | **Canonical prize/safe contract** | **See §4.4 — LOCKED** | `PHASE_00:35-53`, `PHASE_02:476-494` |
| 7 | **Production response `getInitData.millionaireQuestions`** | **See §6 — LOCKED, not implemented** | `code.gs:94-105`, `code.gs:8-22` |
| 8 | **Normalized frontend question model** | **See §6.3 — LOCKED** | `PHASE_02:654-693` |
| 9 | **Fallback contract** | **See §6.4 — LOCKED** | `PHASE_02:698-764` |
| 10 | **Result payload + score vs virtualRupiah** | **See §8 — LOCKED** | `index.html:225-241`, `code.gs:3` |
| 11 | **GameResults backward compatibility** | **See §7 — LOCKED** | `code.gs:402-420` |
| 12 | **Extra JSON contract** | **See §8.3 — LOCKED** | `PHASE_02:1306-1343` |
| 13 | **Anti-farm `String(level)`, 30s** | **See §9 — LOCKED** | `games/GameShell.js:34-42`, `PHASE_02:1449-1506` |
| 14 | **Admin write/data contract** | **See §10 — LOCKED** | `admin.html:292-470,643` |
| 15 | **Invalid/duplicate/missing-level handling** | **See §5.4–5.6 — LOCKED** | `PHASE_02:949-1053` |

---

## 2. Backend Canonical Verification (U1 — Gate A)

### 2.1 Files present

| File | Size | First 3 lines | Purpose (header) |
|------|------|---------------|------------------|
| `code.gs` | 60.792 bytes (1.286 lines) | `var GAMES_SHEET="Games"; var GAME_RESULTS_SHEET="GameResults"; var GAME_RESULTS_HEADER=["waktu",...,"durasiDetik"];` (`code.gs:1-6`) | Production backend *before* Zona Game — but already contains full Zona Game logic |
| `code_v2.gs` | 61.757 bytes | `// SI-PANDA BACKEND v2 ... pengganti penuh code.gs` (`code_v2.gs:1-16`) + identical `var GAMES_SHEET` lines (`code_v2.gs:18-21`) | Intended replacement, instructions `code_v2.gs:13-15`: *ganti Code.gs → Run setupGameSheets → Deploy New version* |

### 2.2 Diff evidence

```
git diff --no-index code.gs code_v2.gs
@@ -1,8 +1,23 @@
+// SI-PANDA BACKEND v2 ...
+ // [GAME-1] readGames_(), readGameResults_()
+ // [GAME-2] getInitData games/gameResults
+ // [GAME-3] saveGameResult
+ // [GAME-4] setupGameSheets()
 ...
- // Bonus-only linking: linkedExamId ...
+ // (removed comment)
  var GAMES_HEADER = ["id","type","mapel","title","duration","isActive","linkedExamId","pairs"];
 ...
- // --- 7. SIMPAN HASIL GAME SISWA (BONUS, ...) ---
+ // --- 7. [GAME-3] SIMPAN HASIL GAME SISWA ---
 ...
- // FUNGSI PENDUKUNG GAME (BONUS-ONLY)
+ // [GAME-1] FUNGSI PENDUKUNG GAME
+ // jsdoc getOrCreateSheet_, readGames_, etc.
```

**Diff result:** *Only documentation/comments/whitespace*. No logic, no schema, no `doGet`/`doPost` action, no `GAME_RESULTS_HEADER`/`GAMES_HEADER` difference. `GAMES_HEADER` 8 cols identical, `GAME_RESULTS_HEADER` 11 cols identical, `doGet getInitData` returns same 7 fields (`code.gs:94-105` vs `code_v2.gs:109-121`).

### 2.3 Deployment evidence search

- `Get-ChildItem -Recurse -Include "appsscript.json",".clasp.json"` → **0 results**
- `Select-String -Pattern "deploymentId|Deployment|appsscript"` → 0 in `code.gs`/`code_v2.gs`/`index.html`/`admin.html`
- `WEB_APP_URL` hardcoded `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` **identical** in `index.html:78` and `admin.html:17` (`Select-String WEB_APP_URL` → 2 hits), but identical URL does not prove which file is deployed — both files would be deployed to same URL after manual copy-paste.
- `git log --oneline` → only `32b46f5 Initial commit` (no deployment tag), `git status` → `interactive rebase` with no committed backend change.

### 2.4 Verdict — U1: **BLOCKED**

Per `PHASE_02:94-100`: *Jika deployment tidak dapat diverifikasi → STATUS = BLOCKED untuk backend implementation.*

- **Canonical *intended*:** `code_v2.gs` (per its header `code_v2.gs:1-16` and naming), `code.gs` = backup.
- **Canonical *verified*:** **UNVERIFIED** — no `appsscript.json`, no live `getInitData` response, no Execution logs in repo.
- **Uncertainty remaining:** 100% — offline repo cannot prove which file's content is currently at `WEB_APP_URL`.
- **Phase 02 decision (contract level):** Lock `code_v2.gs` as *contract canonical* for documentation, but **all backend code changes (readMillionaireQuestions_, saveGameResult extension, admin actions) must be applied to BOTH files** until verification completes. Document verification steps for handoff.

### 2.5 Required verification before Phase 03 code (handoff)

1. Open Google Apps Script project linked to `WEB_APP_URL` → *Deployments* → compare deployed source vs `code.gs` vs `code_v2.gs` (check for `[GAME-1]` comments).
2. `fetch(WEB_APP_URL + "?action=getInitData")` live and inspect `games`/`gameResults` fields — if present, deployed is `v2`-like.
3. Create `docs/millionaire/BACKEND_CANONICAL.md` with `canonical file | deploymentId | verification date | evidence screenshot`.
4. After verification, merge: `code.gs ← code_v2.gs` (or delete `code_v2.gs`) and keep single source.

---

## 3. MillionaireQuestions Sheet Contract

### 3.1 Absence verification

- `Select-String -Path code.gs,code_v2.gs,index.html,admin.html,games/*.js -Pattern "Millionaire|MILLIONAIRE|millionaire"` → **0 hits** (verified `§2.3` bash).
- `Get-ChildItem millionaire -Recurse` → only `assets/backgrounds/{desktop,mobile}/*.png` (4 files), `branding/`, `characters/`, `effects/`, `icons/` (0 entries).
- No `MillionaireQuestions.js` fallback file exists (consistent with Phase 01 audit `1.1`).

**Conclusion:** No production sheet exists; no fallback seed exists; contract is *design-locked* but *not implemented* — no drift to correct.

### 3.2 Canonical sheet name — LOCKED

- **Exact name:** `MillionaireQuestions` — case-sensitive (`PHASE_02:177-189`).
- **Constant (backend):** `const MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";` or `window.SIPANDA_MILLIONAIRE.MILLIONAIRE_QUESTIONS_SHEET` if global (`PHASE_02:188-198`).
- **Evidence for name choice:** Reuse pattern `GAMES_SHEET="Games"` (`code.gs:1`) — same `const` style, `getSheetByName` case-sensitive (`code.gs:354`).

### 3.3 Exact 12-column header — LOCKED

**Canonical header (exact order, `PHASE_02:204-244`):**

```js
["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]
```

- **Count:** 12 columns (`PHASE_02:224`).
- **Order immutable** without versioned contract change (`PHASE_02:247`).
- **Existing pattern evidence:** `GAMES_HEADER` 8 cols (`code.gs:6`) and `GAME_RESULTS_HEADER` 11 cols (`code.gs:3`) both use same *header-array + `appendRow(header)`* pattern in `getOrCreateSheet_` (`code.gs:340-351`).
- **Sheet initialization contract (`PHASE_02:1608-1626`):** `create if missing → appendRow(header) → setFontWeight("bold") → setFrozenRows(1) → setNumberFormat` (level/answer `0`, prize `#,##0`, `isSafe` text/boolean, `id` text).
- **Current repo state:** Sheet does not exist; header not yet created — no conflict.

### 3.4 Sheet initialization helper (contract, not yet implemented)

Per `PHASE_02:1608-1626`, helper `getOrCreateSheet_(ss, MILLIONAIRE_QUESTIONS_SHEET, MILLIONAIRE_QUESTIONS_HEADER, ["A"])` must be code that Phase 03 will add. `A` (id) must be `@` text format to preserve `mill-ipas-01-l01` (prevents `001` stripping). Existing `getOrCreateSheet_` already supports `textColumns` (`code.gs:340`).

---

## 4. Question Field Contract (Detailed)

### 4.1 Field table — verified against `MAPEL_LIST` and ladder

| Field | Type | Required | Rule (locked) | Evidence |
|-------|------|----------|---------------|----------|
| `id` | string | YES | Unique, non-empty, trimmed, `^[A-Za-z0-9_-]+$` (`PHASE_02:276-304`), no space/slash/JSON | `PHASE_02:250-265` |
| `mapel` | string | YES | **Exact match** `MAPEL_LIST` from `index.html:82-91` (8 values): `["Pendidikan Pancasila","Bahasa Indonesia","Matematika","IPAS","Seni Rupa","Bahasa Jawa","Bahasa Inggris","Koding & AI"]`; no fuzzy, case-sensitive `IPAS≠ipas` (`PHASE_02:309-330`) | `index.html:82`, `admin.html:19` same list |
| `level` | integer | YES | 1–15 only, integer, not `mudah/sedang/sulit` (`PHASE_02:334-372`) | `PHASE_00:35-53` |
| `question` | string | YES | Non-empty after trim, max 200 chars, may contain `[GAMBAR:url]` if `renderContent` (`index.html:128`) supports it; no new media format (`PHASE_02:378-398`) | `index.html:128-143` `renderContent` |
| `optionA` | string | YES | Non-empty | `PHASE_02:402-415` |
| `optionB` | string | YES | Non-empty | same |
| `optionC` | string | YES | Non-empty | same |
| `optionD` | string | YES | Non-empty | same |
| `answer` | integer | YES | 0–3 (A=0,B=1,C=2,D=3) (`PHASE_02:439-471`); `Number.parseInt(value,10)` + `Number.isInteger && 0<=x<=3` | `PHASE_02:458-470` |
| `prize` | number | YES | **Exactly equals** `PRIZE_LADDER[level]` canonical; mismatch handling per §4.4 | `PHASE_02:476-543` |
| `isSafe` | boolean | YES | **Derived from level**, not source of truth (`PHASE_02:590-631`): `isSafe = [5,10,15].includes(level)`; sheet value normalized (`PHASE_02:605-630`) | `PHASE_02:548-568` |
| `explanation` | string | NO | Max 500 chars, `""` valid, post-reveal only (`PHASE_02:634-651`) | `PHASE_02:638-642` |

### 4.2 Mapel — exact `MAPEL_LIST` source of truth

- Repo source: `index.html:82-91` defines 8 mapel; `admin.html:19-22` identical copy (risk: duplication, but source for audit is `index.html:82`).
- Phase 02 locks **exact match** validation (`PHASE_02:312-317`), not `toLowerCase()` or `includes()`. Example `PHASE_02:323-326`.
- If repo later adds mapel, contract must be versioned; Millionaire must not invent mapel list.

### 4.3 Level 1–15 — not difficulty

- Existing game difficulty `GAME_DIFFICULTY = {mudah:1 round, sedang:2 rounds, sulit:3 rounds}` (`games/GameShell.js:53-57`) is **unrelated**. Millionaire level is numeric ladder (`PHASE_02:334-372`), invalid values `0,16,"sedang","7a",null` must be rejected (`PHASE_02:364-372`).
- Type locked: `level: Number` integer, validated `1<=level<=15` (`PHASE_02:358-362`).

### 4.4 Prize / Safe — canonical ladder

| Level | Prize | Safe | Evidence |
|-------|-------|------|----------|
| 1 | 100 | NO | `PHASE_00:38` |
| 2 | 200 | NO | `PHASE_00:39` |
| 3 | 300 | NO | `PHASE_00:40` |
| 4 | 500 | NO | `PHASE_00:41` |
| 5 | 1.000 | **YES** | `PHASE_00:42`, `PHASE_02:485` |
| 6 | 2.000 | NO | `PHASE_00:43` |
| 7 | 4.000 | NO | `PHASE_00:44` |
| 8 | 8.000 | NO | `PHASE_00:45` |
| 9 | 16.000 | NO | `PHASE_00:46` |
| 10 | 32.000 | **YES** | `PHASE_00:47` |
| 11 | 64.000 | NO | `PHASE_00:48` |
| 12 | 125.000 | NO | `PHASE_00:49` |
| 13 | 250.000 | NO | `PHASE_00:50` |
| 14 | 500.000 | NO | `PHASE_00:51` |
| 15 | 1.000.000 | **YES/FINAL** | `PHASE_00:52`, `PHASE_02:494` |

- **Canonical representation:** `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER` (`PHASE_02:498-500`) — single source, no alternative ladders between frontend/backend/admin/result (`PHASE_02:388-397`).
- **Validation:** `sheet prize == PRIZE_LADDER[level]` (`PHASE_02:508-524`). **Decision locked:** mismatch → **override with canonical ladder value + warning/log** (recommended `PHASE_02:530-543`), because `level` is source of truth, prize derived. Not arbitrary admin input.
- **Display:** numeric sheet value `#,##0` (`PHASE_02:1674`), UI formats `Rp1.000` etc. (`PHASE_02:1682-1690`). No `Rp` or currency symbol stored.

### 4.5 Safe derivation

- `isSafe` locked as derived (`PHASE_02:590-604`): `isSafe = [5,10,15].includes(level)`.
- Sheet value `isSafe=TRUE` at level 7 → normalized `FALSE` (`PHASE_02:608-617`); `isSafe=FALSE` at level 10 → normalized `TRUE` (`PHASE_02:622-630`).
- `safeRupiah` calculation (`PHASE_02:558-584`): `highestReachedSafePrize` — e.g., level 7 → 1.000, level 12 → 32.000, wrong at 4 → 0.

### 4.6 Frontend normalized model — LOCKED

Per `PHASE_02:654-693`, production row must normalize to:

```js
{
  id: String,              // trimmed
  mapel: String,           // trimmed
  level: Number,           // Number()
  question: String,        // trimmed
  options: [String,String,String,String], // [optionA-D] trimmed
  answer: Number,          // parseInt 0-3
  prize: Number,           // canonical ladder value
  isSafe: Boolean,         // derived [5,10,15]
  explanation: String      // trimmed, "" if missing
}
```

MillionaireGame consumes only this model, never raw sheet row (`PHASE_02:691-693`).

### 4.7 Normalization rules — LOCKED

Per `PHASE_02:1694-1752`:

| Input | Normalization |
|-------|---------------|
| `id` | `String(value).trim()` |
| `mapel` | `String(value).trim()` |
| `level` | `Number(value)` |
| `question` | `String(value).trim()` |
| `optionA-D` | `String(value).trim()` |
| `answer` | `parseInt(value,10)` |
| `prize` | `Number(value)` |
| `isSafe` | `normalizeBoolean(value)` → `true/false/TRUE/FALSE/1/0` → `Boolean` (`PHASE_02:1722-1742`) |
| `explanation` | `String(value||"").trim()` |

Sheet inputs may be `string|number|boolean|empty` (`PHASE_02:1698-1703`) — all handled.

---

## 5. Validation & Error Handling

### 5.1 Invalid row contract — LOCKED

Per `PHASE_02:949-973`:

- Invalid conditions: `missing id | invalid id | invalid mapel | invalid level | empty question | empty option | invalid answer (not 0-3) | invalid prize (mismatch ladder)`.
- **Behavior:** `skip row → Logger.log(reason) → continue` — **must not crash** `getInitData` (`PHASE_02:934-945` try/catch → `[]`).
- No `auto-generate`/`reuse another mapel`/`skip level` (`PHASE_02:1044-1051`).

### 5.2 Duplicate handling — LOCKED

| Duplicate type | Policy (locked) | Evidence |
|----------------|-----------------|----------|
| **Duplicate `id` (global)** | **Reject duplicate rows, log warning** — not *last wins* (`PHASE_02:978-992`). Deterministic. | `PHASE_02:983` |
| **Duplicate `mapel+level`** (e.g., two `IPAS L5`) | **Minimum 1 valid required; if multiple → random selection among valid rows** (`PHASE_02:998-1013`). Prize unchanged. Single → use it. | `PHASE_02:1006-1018` |
| **`mapel+level` key** | Canonical logical key `mapel+level` (`PHASE_02:803-817`), question `id` global unique, game `gameId` separate (`PHASE_02:1511-1529`) | `PHASE_02:804` |

### 5.3 Missing level — LOCKED

Incomplete set (e.g., missing 15, only 14 levels `PHASE_02:1033-1036`) → `INCOMPLETE` (`PHASE_02:1041`). Millionaire **must not** invent/skip level (`PHASE_02:1044-1051`), show **controlled error** (`PHASE_02:1052`). Frontend check: if production has `<15` valid levels → fallback trigger (see §6.4) or error screen.

### 5.4 Number/boolean formats — LOCKED

- `level→0, answer→0, prize→#,##0, isSafe→text/boolean` (`PHASE_02:1669-1676`), `id` text (`PHASE_02:1678`).
- `isSafe` accepts `true/false/TRUE/FALSE/"true"/"false"/1/0` → `Boolean` (`PHASE_02:1724-1742`).
- `answer` accepts numeric string `"2"` → `parseInt` → 2.

### 5.5 Security / range validation (result side) — LOCKED

Per `PHASE_02:1772-1824`:

- Server validates if `tipe==="millionaire"`: `level 1-15, skor 0-100, benar 0-15, salah 0-1, virtualRupiah/safeRupiah >=0, compatible with ladder, reject `level>15, skor>100, benar>15, salah>1, safe>virtual` where semantics forbid.
- Question `answer` is game data; frontend not trusted per `PHASE_02:1756-1769`, but no backend grading — validation only.

---

## 6. Production Question Response & Frontend Model

### 6.1 `getInitData` contract — LOCKED

**Existing:** `getInitData` returns 7 fields (`code.gs:94-105`):

```js
{ settings, students, exams, results, materi, games, gameResults }
```

**Millionaire additive:** 8th field `millionaireQuestions` (`PHASE_02:848-865`):

```js
{
  settings, students, exams, results, materi, games, gameResults,
  millionaireQuestions // new
}
```

- **Additive, not breaking:** no rename/restructure of existing 7 (`PHASE_02:869-871`).
- **Backend read:** `readMillionaireQuestions_(ss)` responsibilities `PHASE_02:916-932`: locate sheet → create only if explicit setup → read header → map rows → normalize → validate → reject invalid → normalize `isSafe` → validate prize → sort → return JSON-safe objects. Wrapped in `try { millionaireQuestions = read... } catch { [] ; Logger.log }` (`PHASE_02:939-945`) so `getInitData` never crashes if sheet missing.

**Current repo state:** `code.gs:94-105` does **not** yet return `millionaireQuestions` — contract locked, implementation pending Phase 03 helper.

### 6.2 `millionaireQuestions` response format — LOCKED

Per `PHASE_02:874-909`:

```js
millionaireQuestions: [
  { id, mapel, level, question, optionA, optionB, optionC, optionD, answer, prize, isSafe, explanation }
  // only rows that passed validation
]
// ordering: mapel ASC, level ASC (or documented deterministic)
// frontend must still normalize (defense in depth)
```

### 6.3 Normalized frontend model — LOCKED

See §4.6. Frontend `MillionaireGame` will filter `millionaireQuestions` by `mapel` + sort `level ASC` + pick 1 per level (random if multiple per `mapel+level`). Example canonical:

```js
{
  id: "mill-ipas-01-l01",
  mapel: "IPAS",
  level: 1,
  question: "Planet terdekat Matahari?",
  options: ["Merkurius","Venus","Bumi","Mars"],
  answer: 0,
  prize: 100,
  isSafe: false,
  explanation: "Merkurius orbit 58 juta km."
}
```

### 6.4 Fallback contract — LOCKED

- **File:** `millionaire/MillionaireQuestions.js` → `window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS` (`PHASE_02:702-708`).
- **Marker:** `// FALLBACK ONLY` (`PHASE_02:712-715`).
- **Minimum:** 15 rows, ideal 1 per level (`PHASE_02:717-727`).
- **Trigger:** `productionQuestions == null || productionQuestions.length < 15` (`PHASE_02:749-753`) **OR** `fetch error` **OR** `production unavailable`. Fallback **must not** silently patch missing individual level if production dataset authoritative — show controlled error instead (`PHASE_02:755-763`).
- **Question set contract:** One game = 1 question per level 1–15 contiguous (`PHASE_02:771-787`). No `L1=3, L2=0, L3=random` (`PHASE_02:781-787`). If multiple per level, random among valid (`PHASE_02:792-799`).

**Current repo:** No `MillionaireQuestions.js` exists — contract locked, seed delivery is Phase 03.

---

## 7. GameResults Compatibility (U2 — Gate B)

### 7.1 Existing header — verified

```
Existing (11): 1 waktu, 2 nisn, 3 nama, 4 gameId, 5 game, 6 mapel, 7 tipe, 8 skor, 9 benar, 10 salah, 11 durasiDetik
```
Evidence: `var GAME_RESULTS_HEADER = ["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik"]` (`code.gs:3`), `code_v2.gs:20` identical, `readGameResults_(ss)` uses `GAME_RESULTS_HEADER.length` (11) for range width (`code.gs:405`: `sheet.getRange(2,1, sheet.getLastRow()-1, GAME_RESULTS_HEADER.length).getValues()`), `getOrCreateSheet_` creates header + `setNumberFormat("@")` for col B (`code.gs:256,340-350`).

### 7.2 Target additive — LOCKED

```
Additive (4): 12 level, 13 virtualRupiah, 14 safeRupiah, 15 extra
Total (15): waktu | nisn | nama | gameId | game | mapel | tipe | skor | benar | salah | durasiDetik | level | virtualRupiah | safeRupiah | extra
```

Per `PHASE_02:1057-1089`, `PHASE_02:1380-1398`: **must not insert between 1–11**, only append at end (`PHASE_02:157-158`).

### 7.3 Write path analysis

- **Current write:** `doPost saveGameResult` (`code.gs:254-270`):
  ```js
  var gameSheet = getOrCreateSheet_(ss, GAME_RESULTS_SHEET, GAME_RESULTS_HEADER, ["B"]);
  gameSheet.appendRow([waktu, nisn, nama, gameId, game, mapel, tipe, skor, benar, salah, durasiDetik]);
  ```
  `appendRow` with 11 values — sheet auto-extends width if needed, but current code writes exactly 11.
- **Target write (Millionaire):** 15 values:
  ```js
  gameSheet.appendRow([waktu, nisn, nama, gameId, game, mapel, tipe, skor, benar, salah, durasiDetik, String(level), Number(virtualRupiah), Number(safeRupiah), JSON.stringify(extra)]);
  ```
  Existing rows would have cols 12–15 empty → backward compatible.

### 7.4 Read path analysis — REQUIRES CODE CHANGE

- **Current read:** `var rows = sheet.getRange(2,1, sheet.getLastRow()-1, GAME_RESULTS_HEADER.length).getValues()` (`code.gs:405`) — fixed width 11. New cols 12–15 would be **ignored** (truncated).
- **Required Phase 03 change (per `PHASE_02:1401-1428`):**
  ```js
  // Detect available cols: reader must handle 11..15
  var lastCol = Math.min(sheet.getLastColumn(), GAME_RESULTS_HEADER.length + 4); // 15
  var rows = sheet.getRange(2,1, sheet.getLastRow()-1, lastCol).getValues();
  // map 1-11 existing, 12 level → String, 13 virtualRupiah → Number, 14 safeRupiah → Number, 15 extra → JSON parse safe
  // if 12-15 missing → null/default (not error)
  ```
  `PHASE_02:1406-1428` specifies `1-11 existing, 12 level, 13 virtualRupiah, 14 safeRupiah, 15 extra; if absent → null/default`.

### 7.5 Verdict — U2: **CONDITIONALLY BLOCKED**

- **Contract level:** LOCKED — additive columns at end, no shift, 11..15 range.
- **Code audit:** PASS — principle verified that `appendRow` with 15 cols is compatible with Sheets API, and `getRange` truncation explains why reader must be updated.
- **Live verification:** **BLOCKED** — offline repo cannot test live `GameResults` sheet with real 11-col rows + new Millionaire rows. Staging test required:
  1. Create staging spreadsheet with existing `GameResults` (11-col header + sample rows)
  2. Call `appendRow` with 15 cols (Millionaire payload)
  3. Verify `readGameResults_` with 11-col read still returns existing rows correctly
  4. Update reader to 15-col and verify Millionaire fields round-trip + old rows return defaults

Until staging test passes, Phase 03 must not deploy Millionaire result writes to production.

---

## 8. Result Payload Contract

### 8.1 Canonical result — LOCKED (`PHASE_02:1057-1144`)

| Field | Millionaire meaning | Type |
|-------|---------------------|------|
| `waktu` | completion timestamp | string (`toLocaleString("id-ID")`) |
| `nisn` | student identity | string |
| `nama` | student name | string |
| `gameId` | instance ID `millionaire-{mapel}-01` (`PHASE_02:1513-1529`) | string |
| `game` | display title `Millionaire: IPAS [Lv 7]` | string |
| `mapel` | subject | string |
| `tipe` | `"millionaire"` (`PHASE_02:1532-1556`) | string canonical |
| `skor` | normalized 0–100, **not Rupiah** | number |
| `benar` | 0–15 | number |
| `salah` | 0–1 (1 = wrong, 0 = walk-away/victory) | number |
| `durasiDetik` | elapsed | number |
| `level` | last reached 1–15 (terminal) | string (stored `String(level)` per `PHASE_02:1190-1194`) |
| `virtualRupiah` | ending virtual prize | number |
| `safeRupiah` | highest safe prize | number |
| `extra` | JSON detail | string (JSON) |

Existing flow evidence: `finishGame` builds `record` with same first 11 fields + `level` (`index.html:225-241`).

### 8.2 Score formula — LOCKED

Per `PHASE_02:1115-1143`:

```js
skor = Math.round((levelReached / 15) * 100)
// Examples: L1→7, L5→33, L10→67, L15→100
```

- Must be 0–100, not Rupiah. Leaderboard (`GameHub: bestScoreForGame` `games/GameHub.js:21` / `admin.html:420`) uses `skor`.
- `skor` vs `virtualRupiah` separate metric (`PHASE_00 decision #12`, `PHASE_02:1862-1885`).

### 8.3 Benar/Salah — LOCKED

Per `PHASE_02:1146-1170`: `benar max 15, salah max 1` (one wrong ends game). Walk-away `salah=0`, victory `benar=15,salah=0`.

### 8.4 VirtualRupiah/SafeRupiah semantics — LOCKED

Per `PHASE_02:1196-1235`:

| Scenario | levelReached | virtualRupiah | safeRupiah | walkAway |
|----------|--------------|---------------|------------|----------|
| Wrong before safe | 4 | 0 | 0 | false |
| Wrong after L5 | 7 | 1.000 | 1.000 | false |
| Walk away L8 | 8 | 8.000 | 1.000 | true |
| Victory L15 | 15 | 1.000.000 | 1.000.000 | false |

Rule: if wrong → `virtualRupiah = safeRupiah` (`PHASE_02:580-584`).

### 8.5 Walk-away — LOCKED

`walkAway: boolean` (`PHASE_02:1237-1258`), true only on `SAFE_EXIT`, false on wrong/victory.

### 8.6 Lifelines + extra JSON — LOCKED

Canonical (`PHASE_02:1260-1343`):

```js
lifelinesUsed: { fiftyFifty: Boolean, askClass: Boolean, askFriend: Boolean }
// persisted in extra:
extra = JSON.stringify({ walkAway, lifelinesUsed, prizeLadderSnapshot })
```

Structure (`PHASE_02:1310-1334`):

```js
{
  walkAway: Boolean,
  lifelinesUsed: { fiftyFifty, askClass, askFriend },
  prizeLadderSnapshot: [{level:1, prize:100, isSafe:false}, ...] // 15 entries
}
```

If JSON invalid on read → ignore `extra`, not entire row (`PHASE_02:1336-1343`).

### 8.7 Result write normalization — LOCKED

Before POST (`PHASE_02:1430-1446`): `level=String(level)`, `skor/benar/salah/durasiDetik/virtualRupiah/safeRupiah=Number()`, `walkAway=Boolean()`.

Server defensive: validate `tipe==="millionaire" → level 1-15, skor 0-100, benar 0-15, salah 0-1, virtualRupiah/safeRupiah >=0, ladder compatible` (`PHASE_02:1774-1798`), reject `level>15, skor>100, safe>virtual` where invalid (`PHASE_02:1801-1824`).

### 8.8 Frontend vs backend trust

Per `PHASE_02:1754-1769`: question `answer` is game data, browser not trusted, but no backend grading introduced — backend validates structure, result numeric ranges, not answer correctness.

---

## 9. Anti-Farm Contract

### 9.1 Existing mechanism — verified

```js
// games/GameShell.js:34-42
const canSaveGameResult = (nisn, gameId, level) => {
  const key = `game_last_${nisn}_${gameId}_${level || "sedang"}`;
  const last = Number(localStorage.getItem(key) || 0);
  if (Date.now() - last < 30000) return false;
  localStorage.setItem(key, String(Date.now()));
  return true;
};
```

Called in `finishGame` (`index.html:247-250`): `canSaveGameResult(currentUser.nisn, result.gameId, result.level) ? POST : skip`. No server-side rate limit — client-only.

### 9.2 Millionaire mapping — LOCKED

Per `PHASE_02:1449-1506`:

- **Reuse same helper**, no new global anti-farm.
- **Canonical key:** `game_last_${nisn}_${gameId}_${String(level)}` (`PHASE_02:1462`), 30s timeout (`PHASE_02:1467`).
- **Level conversion:** numeric `1-15` → `String(level)` before call (`PHASE_02:1483-1500`, `1190-1194`). Example `level 7 → "7"` not `"sedang"` (`PHASE_02:1502-1506`).
- Existing `level || "sedang"` default still works for 17 games; Millionaire always passes numeric string.

### 9.3 Game ID — LOCKED

`gameId: "millionaire-{mapel}-01"` (`PHASE_02:1513-1525`), deterministic, not changing per replay. Replay same `gameId` + new `level` → new anti-farm key per level, but 30s per `(nisn,gameId,level)` still throttles rapid replay of same level. Documented as compliant with existing policy (`PHASE_02:1449`).

---

## 10. Admin Contract

### 10.1 Existing admin — verified

- `AdminApp` (`admin.html:150`), `fetch getInitData` (`admin.html:159`), 6-tab `activeTab` (`admin.html:474,643-648`: `overview|ai-generator|games|materi|exams|results`).
- `GameAdminPanelStandalone` (`admin.html:292-470`): form `id,type,mapel,title,duration,linkedExamId,pairsMudah/Sedang/Sulit`, 17-type select (`admin.html:429`), `saveGame` → `POST saveGame` (`admin.html:416`), `generateGamePairs`/`classifyGamePairs`.
- No `Millionaire` type in select; `BANK_FORMAT_GUIDE` (`admin.html:272`) covers `pairs` schema.

### 10.2 Dedicated Millionaire admin — LOCKED

Per `PHASE_02:1845-1860` & `PHASE_01 D15`: Phase 08 admin may assume `sheet=MillionaireQuestions, header 12 cols, level 1-15, answer 0-3, prize derived, isSafe derived`. **Admin must not create new schema.**

**Phase 02 contract (data layer, not UI):**

- Future actions (Phase 08) `getMillionaireQuestions|saveMillionaireQuestion|toggleMillionaireQuestionActive|deleteMillionaireQuestion` (`PHASE_02:1562-1570`) — **Phase 02 only defines contract, not implements actions** (`PHASE_02:1571-1573`).
- **Derived fields:** `prize`/`isSafe` derived from `level` (`PHASE_02:1577-1604`), admin level is input → `prize=32000, isSafe=true` for `level=10` (`PHASE_02:1592-1595`). Admin **must not** allow `level=10, prize=50000, isSafe=false` (`PHASE_02:1599-1603`).
- **Spreadsheet validation (recommended):** `mapel` = `MAPEL_LIST`, `level` 1-15, `answer` 0-3, `isSafe` TRUE/FALSE, `prize` protected/derived (`PHASE_02:1629-1663`).

### 10.3 Isolation guarantee

- Millionaire admin is **dedicated tab** (`activeTab==='millionaire'`) + panel `MillionaireAdminPanel`, separate from `GameAdminPanelStandalone` (prohibition `PHASE_02:1845`).
- Must not mix into `Games.pairs` (`PHASE_02:717` prohibition).

---

## 11. Risks

### 11.1 HIGH

| ID | Risk | Evidence | Impact | Mitigation |
|----|------|----------|--------|------------|
| **H1** | **U1 BLOCKED: Backend canonical unverified** — `code.gs` vs `code_v2.gs` identical logic, no `appsscript.json`/`deploymentId` in repo | `code.gs:1` vs `code_v2.gs:1-22`, `git diff`, `Get-ChildItem -Recurse -Include appsscript.json` 0 | Millionaire helpers written to wrong file → not deployed; `getInitData.millionaireQuestions` never live | Until verified, **apply all backend changes to BOTH files**; create `BACKEND_CANONICAL.md` after live fetch check |
| **H2** | **U2 CONDITIONALLY BLOCKED: `readGameResults_` fixed 11-col truncation** — `sheet.getRange(2,1,lastRow-1, GAME_RESULTS_HEADER.length)` (`code.gs:405`) ignores cols 12-15 | `code.gs:405`, `code.gs:3` | Millionaire `level/virtualRupiah/safeRupiah/extra` written but never read back; dashboard `gameResults` missing Millionaire data | Phase 03 must update reader to `Math.min(lastColumn, 15)` + null/default for missing cols (`PHASE_02:1401-1428`) and staging-test before prod |

### 11.2 MEDIUM

| ID | Risk | Evidence | Mitigation |
|----|------|----------|------------|
| **M1** | **Prize derivation vs sheet value** — if admin writes `prize=999` for L5, contract says override, but override logic not yet coded | `PHASE_02:508-543` | Implement `prize = PRIZE_LADDER[level]` before append; `Logger.log` mismatch |
| **M2** | **Missing level set** — production sheet may have gaps (e.g., no L15 for a mapel) | `PHASE_02:1022-1053` | Reader must not invent; game shows controlled error per `PHASE_02:1052` |
| **M3** | **`WEB_APP_URL` duplication** — `index.html:78` vs `admin.html:17` identical today, but future edit may diverge | `Select-String WEB_APP_URL` 2 hits | Phase 03 add `WEB_APP_URL` single-source or CI assert |
| **M4** | **Anti-farm client-only** — `canSaveGameResult` localStorage can be bypassed via DevTools | `GameShell.js:34-42` | Accept per existing security model (`PHASE_02:1756`); server validation is range-only, not anti-cheat |

### 11.3 LOW

| ID | Risk | Evidence | Mitigation |
|----|------|----------|------------|
| **L1** | Baked UI risk — `MILLIONAIRE_ASSET_SPEC` but not pixel-OCR verified | `millionaire/assets` 4 PNG 2MB | Visual QA in Phase 03 (open PNGs) |
| **L2** | `MAPEL_LIST` duplication (index vs admin) | `index.html:82`, `admin.html:19` | Treat `index.html:82` as source of truth (`PHASE_02:326-330`) |
| **L3** | Fallback seed size — 15 rows ideal but production may have <15 for some mapel | `PHASE_02:745-753` | Trigger fallback only if `<15` valid, not partial patch |

---

## 12. Decisions (Locked for Phase 03)

| # | Area | Decision | Spec Source |
|---|------|----------|-------------|
| D1 | Backend canonical (contract) | `code_v2.gs` *intended* canonical, `code.gs` backup; both patched until verification date recorded | `PHASE_01 D16`, `PHASE_02:80-111` |
| D2 | Sheet name | `MillionaireQuestions` case-sensitive | `PHASE_02:177-189` |
| D3 | Header | 12 columns exact order `["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]` | `PHASE_02:204-244` |
| D4 | Field types | `id:String unique, mapel:String exact MAPEL_LIST, level:int 1-15, question:String non-empty max200, options non-empty, answer 0-3, prize Number ladder, isSafe Boolean derived, explanation String max500` | `PHASE_02:250-265`, `§4` |
| D5 | Prize ladder | Canonical `100,200,300,500,1000*,2000,4000,8000,16000,32000*,64000,125000,250000,500000,1000000*` (*safe), single `PRIZE_LADDER` in `window.SIPANDA_MILLIONAIRE.PRIZE_LADDER` | `PHASE_00:35-53`, `PHASE_02:476-500` |
| D6 | Prize validation | `sheet prize == PRIZE_LADDER[level]` else **override canonical + warn/log** | `PHASE_02:506-543` |
| D7 | isSafe | Derived `[5,10,15].includes(level)` | `PHASE_02:590-631` |
| D8 | Normalization | `String.trim, Number(), parseInt, normalizeBoolean` per `PHASE_02:1694-1752` | `PHASE_02:1694` |
| D9 | Invalid row | Skip + `Logger.log` + continue, never crash `getInitData` | `PHASE_02:949-973` |
| D10 | Duplicate id | **Reject duplicate, log warning** (not last-wins) | `PHASE_02:978-993` |
| D11 | Duplicate mapel+level | Random among valid (`PHASE_02:1006-1013`) | `PHASE_02:998` |
| D12 | Missing level | Incomplete → controlled error, no invent (`PHASE_02:1022-1053`) | `PHASE_02:1044` |
| D13 | getInitData | Add `millionaireQuestions` 8th field, additive, try/catch `[]` on missing sheet | `PHASE_02:824-945` |
| D14 | Frontend model | `{id:String, mapel:String, level:Number, question:String, options:[4], answer:Number, prize:Number, isSafe:Boolean, explanation:String}` | `PHASE_02:654-693` |
| D15 | Fallback | `millionaire/MillionaireQuestions.js` → `FALLBACK_QUESTIONS` `// FALLBACK ONLY`, 15 rows, trigger `production==null || len<15` or fetch error | `PHASE_02:698-764` |
| D16 | Question set | One game = 1 per level 1-15 contiguous, no random source | `PHASE_02:769-799` |
| D17 | GameResults | 15 cols (11 existing + `level,virtualRupiah,safeRupiah,extra`), append only, no shift 1-11 | `PHASE_02:1057-1093`, Gate B |
| D18 | Score | `skor = Math.round(levelReached/15*100)` (L1→7, L5→33, L10→67, L15→100), 0-100 | `PHASE_02:1115-1143` |
| D19 | Result payload | `waktu,nisn,nama,gameId,game,mapel,tipe="millionaire",skor,benar0-15,salah0-1,durasiDetik,level String,virtualRupiah,safeRupiah,extra JSON` | `PHASE_02:1057-1144` |
| D20 | Extra JSON | `{walkAway:Boolean, lifelinesUsed:{fiftyFifty,askClass,askFriend}, prizeLadderSnapshot:[15]}` stringified, invalid JSON → ignore extra | `PHASE_02:1306-1343` |
| D21 | Anti-farm | `canSaveGameResult(nisn,gameId,String(level))` 30s, key `game_last_${nisn}_${gameId}_${String(level)}` | `PHASE_02:1449-1506` |
| D22 | Admin write | `getMillionaireQuestions|saveMillionaireQuestion|toggle|delete` (Phase 08), prize/isSafe derived from level, no free prize edit | `PHASE_02:1559-1604` |
| D23 | Sheet init | `getOrCreateSheet_(MillionaireQuestions, HEADER, ["A"])` → bold header + freeze + numberFormats | `PHASE_02:1608-1683` |
| D24 | Reader contract | `readMillionaireQuestions_(ss)` 11 responsibilities `PHASE_02:914-933`, not crash missing sheet | `PHASE_02:912` |

---

## 13. Unresolved Items

| ID | Item | Status | Evidence | Blocking | Next Step |
|----|------|--------|----------|----------|-----------|
| **U1** | **Backend canonical deployment truth** | **BLOCKED** — `code.gs` vs `code_v2.gs` identical, no `appsscript.json`/deployment log, live fetch not possible offline | `get-Content` headers, `git diff`, `Get-ChildItem -Recurse` 0 deployment files, `git log` single commit | **YES — blocks any backend code deployment** (Phase 03 implementation) | Live verification: Apps Script Deployments + `fetch(getInitData)` live; write `BACKEND_CANONICAL.md` with file + date + screenshot; until then dual-patch both files |
| **U2** | **GameResults 15-col live compatibility** | **CONDITIONALLY BLOCKED** — code audit confirms principle, but no staging spreadsheet to test `appendRow(15)` + `read 11 vs 15` | `code.gs:405` fixed 11, `code.gs:256` 11-col append | **YES — blocks Millionaire result writes to prod** until staging test passes | Staging spreadsheet test per §7.5 (11→15 round-trip) |
| **U3** | **B1-B4 baked UI pixel verification** | Open (not Phase 02 scope) | `System.Drawing` dims only, no OCR | No (Phase 03 visual QA) | Open PNGs at 100%, confirm no question/A-D/ladder text |
| **U4** | **`MAPEL_LIST` single source** | Open (minor) — `index.html:82` vs `admin.html:19` duplicate | `Select-String MAPEL_LIST` 2 files | No | Treat `index.html:82` as truth (`PHASE_02:326-330`) |
| **U5** | **Spreadsheet number format for `prize`** | Open — needs live sheet to confirm `#,##0` vs `Rp` | `PHASE_02:1669-1676` | No | Set in `getOrCreateSheet_` numberFormats phase |

No unresolved item blocks *documentation* Phase 02 exit; U1/U2 block *code* Phase 03 write paths (marked per prompt requirement).

---

## 14. Decision Matrix (Required — `PHASE_02:1996-2011`)

| Area | Current State | Contract Decision | Evidence | Status |
|------|---------------|-------------------|----------|--------|
| Backend canonical | `code.gs` 60.792 vs `code_v2.gs` 61.757, diff only comments, no deployment log | `code_v2.gs` *intended* canonical, verify live before code | `code.gs:1`, `code_v2.gs:1-22`, `git diff` | **BLOCKED** until verification |
| Question sheet | absent (0 Millionaire strings in repo) | `MillionaireQuestions` 12-col exact header | `Select-String` 0, `Get-ChildItem millionaire` | LOCKED |
| Header | absent | `["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]` | `PHASE_02:229-244` | LOCKED |
| Question model | absent (only `Games.pairs {left,right}` & `Soal` 6-field) | normalized `{id,mapel,level,question,options[4],answer,prize,isSafe,explanation}` | `PHASE_02:654-693` | LOCKED |
| Prize | absent (no PRIZE_LADDER in repo) | canonical ladder 15 levels `100..1.000.000`, `isSafe` at 5/10/15 | `PHASE_00:35-53`, `PHASE_02:498-500` | LOCKED |
| isSafe | absent | derived `[5,10,15].includes(level)`, override sheet mismatch | `PHASE_02:590-631` | LOCKED |
| getInitData | 7 fields `settings,students,exams,results,materi,games,gameResults` (`code.gs:94-105`) | + `millionaireQuestions` 8th additive, try/catch `[]` | `code.gs:8-105` | LOCKED |
| GameResults | 11 cols `waktu..durasiDetik` (`code.gs:3`) | +4 at end `level,virtualRupiah,safeRupiah,extra` = 15 cols, no shift 1-11 | `code.gs:3,405` | LOCKED (staged) |
| Score | `skor` 0-100 via `calcChallengeScore` (`GameShell.js:141`) | `skor = round(level/15*100)` (L15=100), Rupiah separate | `PHASE_02:1125-1143` | LOCKED |
| Anti-farm | `canSaveGameResult(nisn,gameId,level)` 30s (`GameShell.js:34-42`) | `String(level)` numeric 1-15, key `game_last_${nisn}_${gameId}_${String(level)}` | `GameShell.js:34`, `PHASE_02:1462` | LOCKED |
| Admin | 6 tabs, `GameAdminPanelStandalone` 17 types (`admin.html:429,643`) | dedicated `millionaire` tab + `MillionaireAdminPanel`, derived prize/isSafe, separate sheet | `admin.html:292-648` | LOCKED |

---

## 15. Exit Criteria (per `PHASE_02:2014-2046`)

- [x] backend canonical status verified **or explicitly blocked** (§2, BLOCKED documented)
- [x] U1 resolved/documented (BLOCKED with dual-patch mitigation & verification steps)
- [x] U2 GameResults compatibility verified/documented (§7, CONDITIONALLY BLOCKED + staging plan)
- [x] `MillionaireQuestions` exact name locked (`MillionaireQuestions`, §3.2)
- [x] 12-column header locked (§3.3)
- [x] all question field types locked (§4)
- [x] mapel validation locked (exact `MAPEL_LIST` 8, §4.2)
- [x] level 1–15 validation locked (§4.3)
- [x] answer 0–3 locked (§4.1)
- [x] prize canonical validation locked (ladder + override, §4.4)
- [x] `isSafe` derived from level (§4.5)
- [x] normalization rules locked (§4.7)
- [x] duplicate ID policy locked (reject, §5.2)
- [x] duplicate mapel+level policy locked (random, §5.2)
- [x] missing level policy locked (incomplete → controlled error, §5.3)
- [x] fallback contract locked (§6.4)
- [x] `getInitData.millionaireQuestions` contract locked (§6.1-6.2)
- [x] normalized frontend question model locked (§4.6)
- [x] 15-column GameResults contract locked (§7.2)
- [x] backward compatibility strategy locked (11..15, §7.4)
- [x] result payload locked (§8.1)
- [x] score formula locked (`round(level/15*100)`, §8.2)
- [x] virtualRupiah/safeRupiah semantics locked (§8.4)
- [x] `extra` JSON contract locked (§8.6)
- [x] anti-farm key mapping locked (`String(level)`, §9.2)
- [x] admin write contract locked (derived prize/isSafe, §10.2)
- [x] validation/security boundaries documented (§5, `PHASE_02:1754`)
- [x] Phase 03 handoff documented (§16)
- [x] no gameplay implementation performed (this audit creates no `MillionaireGame.js`/`millionaire.css`/FSM/timer/lifeline UI/dashboard/admin UI — only this `.md`)

**All 26 criteria met for *contract documentation*; U1/U2 remain BLOCKED for *code deployment* as required by gate logic.**

---

## 16. Phase 03 Handoff

### 16.1 What Phase 03 may do (immediate next — per `PHASE_02:2050-2063`)

Phase 03 is **data layer provisioning**, not gameplay:

```
MillionaireQuestions.js          — fallback seed (15 rows, // FALLBACK ONLY, window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS)
MillionaireQuestions production reader — readMillionaireQuestions_(ss) helper + getInitData.millionaireQuestions
question bank loading            — frontend fetch + normalize + filter by mapel + sort level
fallback seed policy             — trigger len<15 or fetch error
question selection rules         — mapel+level random among valid, prize/isSafe derived
```

Phase 03 **must not** implement `PHASE_04 GAME ENGINE` (full gameplay: FSM, timer, lifeline UI, ladder animation).

### 16.2 Required pre-work for Phase 03 (blocked paths)

| Path | Unblock Condition | Evidence Needed |
|------|-------------------|-----------------|
| Backend helpers (`readMillionaireQuestions_`, `saveGameResult` 15-col, admin actions) | Resolve **U1** live + apply to canonical file | `BACKEND_CANONICAL.md` with deploymentId + date |
| `GameResults` writes (15-col) | Resolve **U2** staging test | Staging sheet screenshot: 11-col rows intact + 15-col Millionaire row + read-back JSON |

Non-blocked paths (reader design, fallback seed, normalization helpers, contract tests) can proceed in parallel without deployment.

### 16.3 Handoff artifacts for Phase 03

- This audit (`PHASE_02_DATA_CONTRACT_AUDIT.md`) — single source for all decisions D1-D24
- `PHASE_02_DATA_CONTRACT.md` — normative contract (always cite with `PHASE_02:line`)
- `PHASE_01_ARCHITECTURE_AUDIT.md` U1/U2 details — deployment gate
- `MILLIONAIRE_ASSET_SPEC.md` B1-B4 dims (1672×941 / 941×1672 PNG) — asset loading in Phase 03 not yet, but reader may need `question [GAMBAR:url]` support via `renderContent` (`index.html:128`)

### 16.4 Stop condition reminder

Per `PHASE_02:2071-2094`: if `repository actual behavior` conflicts with `Phase 00/01/02` contracts, **record CONFLICT/EVIDENCE/IMPACT/RECOMMENDED RESOLUTION and halt dependent implementation** — do not silently pick one.

---

## Appendix A — Evidence Index (file:line)

| Evidence | Location |
|----------|----------|
| `GAMES_SHEET`/`GAME_RESULTS_SHEET`/`GAME_RESULTS_HEADER` 11 cols / `GAMES_HEADER` 8 cols | `code.gs:1-6`, `code_v2.gs:18-21` |
| `doGet getInitData` 7 fields | `code.gs:8-105` (`code_v2.gs:23-121` identical) |
| `doPost 11 actions saveGameResult` 11-col append | `code.gs:109-334`, `code.gs:254-270` |
| `getOrCreateSheet_` header+format | `code.gs:340-351` |
| `readGames_` 8-col logic | `code.gs:354-400` |
| `readGameResults_` fixed 11-col read | `code.gs:402-420` (`405` width) |
| `setupGameSheets`/`seedSampleGames` 28 entries | `code.gs:423-981` |
| `code_v2` intended canonical header | `code_v2.gs:1-16` |
| `WEB_APP_URL` dup | `index.html:78`, `admin.html:17` |
| `APP_VERSION v16` + `?v=16` + `sipanda_version` reload | `index.html:54-73,164-173` |
| `MAPEL_LIST` 8 mapel | `index.html:82-91`, `admin.html:19-22` |
| `Icon`/`shuffleArray`/`renderContent` | `index.html:93,119,128` |
| `finishGame` record + `canSaveGameResult` + `POST saveGameResult` | `index.html:225-258`, `games/GameShell.js:34-42` |
| `GAME_TYPES 17` / `GAME_TYPE_META` 17 | `games/GameShell.js:7-27` |
| `canSaveGameResult String(level)` key | `games/GameShell.js:34-36` |
| `calcChallengeScore` | `games/GameShell.js:141` |
| `SAMPLE_GAMES` fallback | `games/gameData.js:16` |
| `GameAdminPanelStandalone` 17-type select | `admin.html:292-430` |
| `AdminDashboardFull` 6 tabs | `admin.html:473,643` |
| `millionaire/assets` 4 PNG B1-B4 | `Get-ChildItem millionaire/assets/backgrounds/*` (2.06/2.16/1.98/2.06 MB) |
| `No Millionaire strings` | `Select-String Millionaire` 0 hits |
| `No appsscript.json/.clasp` | `Get-ChildItem -Recurse -Include appsscript.json` 0 |
| `git` single commit `32b46f5` + rebase pending | `git log --oneline`, `git status` |

## Appendix B — Sheet Creation Snippet (contract illustration, not deployed)

```js
// Backend — will be added to canonical file in Phase 03 (illustration only)
const MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";
const MILLIONAIRE_QUESTIONS_HEADER = [
  "id","mapel","level","question","optionA","optionB","optionC","optionD",
  "answer","prize","isSafe","explanation"
];
// getOrCreateSheet_(ss, MILLIONAIRE_QUESTIONS_SHEET, MILLIONAIRE_QUESTIONS_HEADER, ["A"])
// columns: A id text (@), C level 0, I prize #,##0, K isSafe text, H answer 0
```

> **This audit performed no production code change.** Only this markdown file `PHASE_02_DATA_CONTRACT_AUDIT.md` was created, per Phase instructions.

*— End of PHASE 02 DATA CONTRACT AUDIT —*
