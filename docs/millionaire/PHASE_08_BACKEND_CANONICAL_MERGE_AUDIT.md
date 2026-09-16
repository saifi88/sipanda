# PHASE 08 — BACKEND CANONICAL MERGE AUDIT

**Status:** PASS_WITH_RESIDUAL (repository merge) + BLOCKED / UNVERIFIED (live deployment)
**Tanggal:** 2026-09-16 (UTC)
**Auditor:** OpenCode (Muse Spark)
**Spec:** `docs/millionaire/PHASE_08_BACKEND_CANONICAL_MERGE.md`
**Scope:** backend consolidation only — no frontend, Millionaire engine, FSM, timer, lifeline, scoring, 17-game, atau schema GameResults change

---

## 1. File comparison

| Item | `code.gs` (pre-merge) | `code_v2.gs` |
|---|---|---|
| Size | 67.645 bytes / 1.422 lines | 68.442 bytes / 1.468 lines |
| Normalized similarity (`difflib`, full file) | ratio **0,9744**, 51 opcode groups | — |
| Top-17-line header block | absent | present (`SI-PANDA BACKEND v2 ... [GAME-1]..[GAME-4]`, usage: replace Code.gs → Run setupGameSheets → Deploy New version) |
| Functional code | 20/21 functions byte-identical after comment/whitespace strip; 1 cosmetic-only diff (`setupGameSheets`) | — |
| Single functional gap | `GAMES_HEADER` referenced 5x but **never defined** | `GAMES_HEADER` defined (line 21) |

Pre-merge `diff` opcode summary (non-equal groups only): header insert, `GAMES_HEADER`-vs-comment replace, `[GAME-2]/[GAME-3]` comment replaces, JSDoc inserts (`getOrCreateSheet_`, `readGames_`, `readGameResults_`, `setupGameSheets`), `Logger.log` / `else` / `autoResizeColumns` inserts in `setupGameSheets`, two deleted stale comments, trailing-newline diff. No other code hunks.

Prior art consistent: `docs/millionaire/BACKEND_CANONICAL.md` (2026-09-15) already recorded pre-Phase-03 diff as comments/whitespace-only; Phase 03 then patched Millionaire helpers into **both** files identically.

## 2. Function inventory

Extraction method: regex `function\s+([A-Za-z0-9_]+)` + brace-counted bodies; normalization = strip `//` + `/* */` + all whitespace, then compare.

Both files declare the **same 21 functions, no additions/omissions either way**:

```text
_millionaireNormalizeBoolean_
classifyGamePairs_
countWords_
doGet
doPost
evaluateEssayWithAI
gameTypeFormatInstr_
generateGamePairsFromImages
generateOverallFeedbackWithAI
generateQuestionsFromImages
getOrCreateSheet_
getSampleGames_
normalizeMillionaireQuestion_
pancingIzin
readGameResults_
readGames_
readMillionaireQuestions_
sanitizeGamePairs_
seedSampleGames
setupGameSheets
validateMillionaireQuestion_
```

Normalized body comparison:

| Result | Functions |
|---|---|
| IDENTICAL (20) | all except `setupGameSheets` |
| DIFF, cosmetic-only (1) | `setupGameSheets` (normalized 682 vs 918 chars — see §5) |

Clarification on spec §4.1 names `getInitData` and `saveGameResult`: neither file declares them as top-level `function` — in **both** files they are `doGet`/`doPost` **action branches** (`code.gs:32` `if (action === "getInitData")`, `code.gs:274` `if (data.action === "saveGameResult")`; same in `code_v2.gs`). Parity holds; no function loss. All other §4.1 names (`readGames_`, `readGameResults_`, `getOrCreateSheet_`, `setupGameSheets`, `seedSampleGames`, `generateQuestionsFromImages`, `classifyGamePairs_`, `readMillionaireQuestions_`, plus `doGet`/`doPost`) are present in both.

## 3. Constant/schema comparison

| Constant | `code.gs` pre-merge | `code_v2.gs` | Post-merge canonical (`code.gs`) |
|---|---|---|---|
| `GAMES_SHEET` | `"Games"` | `"Games"` | unchanged |
| `GAME_RESULTS_SHEET` | `"GameResults"` | `"GameResults"` | unchanged |
| `GAME_RESULTS_HEADER` (11 col, Phase-08 frozen) | `["waktu","nisn","nama","gameId","game","mapel","tipe","skor","benar","salah","durasiDetik"]` | identical | unchanged — **no 11→15 migration** (deferred to U2 per spec §9) |
| `GAMES_HEADER` (8 col) | **MISSING (dangling refs at lines 293, 310, 375, 581, 592)** | `["id","type","mapel","title","duration","isActive","linkedExamId","pairs"]` (line 21) | **ported verbatim** from v2 (now `code.gs:4`); 8-col + 7-col-legacy-compat reader untouched |
| `MILLIONAIRE_QUESTIONS_SHEET` | `"MillionaireQuestions"` | identical | unchanged |
| `MILLIONAIRE_QUESTIONS_HEADER` (12 col) | `["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"]` | identical | unchanged |
| `MILLIONAIRE_PRIZE_LADDER` | `[100,...,1000000]` (15) | identical | unchanged |
| `MILLIONAIRE_SAFE_LEVELS` | `[5,10,15]` | identical | unchanged |

Millionaire preservation verified in canonical `code.gs`: `MILLIONAIRE_QUESTIONS_SHEET/HEADER/LADDER/SAFE_LEVELS` + `readMillionaireQuestions_` + `normalizeMillionaireQuestion_` + `validateMillionaireQuestion_` + `getInitData.millionaireQuestions` (`millionaireQuestions: millionaireQuestions`, `readMillionaireQuestions_(ss)` with try/catch fallback to `[]`). Production source remains `MillionaireQuestions` sheet; no frontend fallback substitution.

Apps Script services used (identical both files): `SpreadsheetApp, HtmlService, ContentService, PropertiesService, UrlFetchApp, Logger`.

## 4. doGet/doPost action comparison

Identical 12-action set in both files (no action exists in only one file):

```text
getInitData        (doGet)
addMateri, classifyGamePairs, generateAIQuestions, generateGamePairs,
saveGame, saveGameResult, saveNewExam, saveResult,
toggleGameStatus, updateCatatan, updateExamStatus   (doPost)
```

`saveGameResult` still appends the frozen 11-col row (`waktu, nisn, nama, gameId, game, mapel, tipe, skor, benar, salah, durasiDetik`); `saveGame` still writes the 8-col `GAMES_HEADER` row with `linkedExamId` + `pairs`-as-JSON. No action, parameter, or response shape changed.

## 5. Behavior differences

**D1 — `GAMES_HEADER` missing in `code.gs` (functional, FIXED by this merge).**
Pre-merge `code.gs` referenced `GAMES_HEADER` in `saveGame` (2x), `readGames_` (1x), `setupGameSheets`/`seedSampleGames` path (2x) with no definition → `ReferenceError` on any game-sheet path. `code_v2.gs` defines it. Fix: one-line verbatim port, no other edit. Post-merge: zero dangling references (all 8 tracked symbols defined).

**D2 — `setupGameSheets` cosmetic diff (non-behavioral, KEPT as-is in canonical).**
Same data effects in both: create `GameResults` if absent; 7→8-col `linkedExamId` migration; `seedSampleGames()` when empty/new. `code_v2.gs` additionally: captures `getOrCreateSheet_` return, `Logger.log` on create/skip paths (3x), `else { Logger.log(...Games... dilewati) }`, `autoResizeColumns(1,6)` in try/catch. None alter sheets, headers, seed data, or return values consumed by callers. Per NO-REFACTOR rule the canonical keeps the `code.gs` body untouched; difference logged here, not merged.

**D3 — Comments/whitespace/headers only (non-behavioral).** v2 header block, `[GAME-1..4]` tags, JSDoc, `// lewati game dengan data rusak...`, `// NISN sebagai teks`, `// id & pairs (JSON) sebagai teks`, stale-comment deletions. Zero logic impact (proven by normalized comparison).

No other behavior delta found. No dependency beyond the fixed `GAMES_HEADER` symbol; call graph (`doGet/doPost` → `readGames_`, `readGameResults_`, `readMillionaireQuestions_`, `getOrCreateSheet_`, `setupGameSheets` → `seedSampleGames` → `getSampleGames_`, AI helpers → `UrlFetchApp`/`PropertiesService`) intact in canonical.

## 6. Canonical decision

Per spec §5 (identical business logic → `code.gs` canonical):

```text
canonical repository : code.gs (SINGLE BACKEND SOURCE OF TRUTH, post-merge)
non-canonical        : code_v2.gs (retained on disk, NOT deleted — see §8)
canonical deployment : UNVERIFIED (see §10)
```

D1 was a provable omission bug (use-without-definition), not a design fork — porting the one constant restores the evidently intended behavior shared by both files rather than choosing between rival behaviors. D2/D3 are cosmetic. No BLOCKED fork condition (§16) triggered at repository level.

## 7. Merge changes

Exactly **one** edit to `code.gs` (line 4 inserted; nothing else touched):

```diff
 var GAME_RESULTS_HEADER = ["waktu", "nisn", "nama", "gameId", "game", "mapel", "tipe", "skor", "benar", "salah", "durasiDetik"];
+var GAMES_HEADER = ["id", "type", "mapel", "title", "duration", "isActive", "linkedExamId", "pairs"];
```

Value is byte-identical to `code_v2.gs:21`. No function added/removed/renamed, no parameter/response/schema/behavior change, no frontend / Millionaire engine / FSM / timer / lifeline / scoring / 17-game edit. `code_v2.gs` unmodified.

## 8. code_v2 handling

**NOT deleted, NOT archived — retained in place** per spec §6 order (archive/remove only after deployment verification) and §12 (`JANGAN HAPUS` if unsure). Rationale: live deployment identity is UNVERIFIED (§10), so removing the only other full-backend copy would be destructive and irreversible. No `docs/millionaire/archive/code_v2_pre_merge.gs` copy created (no content lost; original still on disk). Follow-up after §10 verification: archive/remove `code_v2.gs` so only one active full backend remains.

## 9. Static/syntax test

| Test | Method | Result |
|---|---|---|
| `code.gs` syntax | copy → `.js`, `node --check` (node v26.8.2) | **PASS** (exit 0) |
| `code_v2.gs` syntax | copy → `.js`, `node --check` | **PASS** (exit 0) |
| Note | `.gs` extension not accepted by `node --check` directly (`ERR_UNKNOWN_FILE_EXTENSION`), hence the `.js`-copy shim; content unmodified | — |

Pre-merge baseline was also PASS/PASS; post-merge re-run confirms the 1-line insert broke nothing.

## 10. Live deployment verification

| Check | Result |
|---|---|
| `appsscript.json` / `.clasp.json` in repo | **0 results** (`Get-ChildItem -Recurse -Force -Include`) |
| `deploymentId` evidence in repo | none found (consistent with `BACKEND_CANONICAL.md` 2026-09-15) |
| `WEB_APP_URL` | `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` referenced by `index.html:83` + `admin.html:17` (identity known, deployed content unknown) |
| Test A `?action=getInitData` live | **NOT RUN — no Sheets/Apps Script access in this environment** |
| Tests B/C/D live | **NOT RUN — same reason** |
| Deployment status | **BLOCKED / UNVERIFIED — no PASS claimed** (spec §10) |

Required human follow-up: open the Apps Script project behind `WEB_APP_URL` → Deployments → confirm deployed source contains `GAMES_HEADER` + `MILLIONAIRE_QUESTIONS_SHEET`; live-fetch `?action=getInitData` and check `games`, `gameResults`, `millionaireQuestions`; then record `deploymentId + verification date + evidence` and proceed with `code_v2.gs` archival.

## 11. Regression test

Script: `phase08_regression.py` (function-set, per-spec names, normalized bodies, constants, 12 actions, dangling-symbol, `setupGameSheets` core ops, `node --check` both files, `code_v2.gs` retained, frontends present).

| # | Check | Result |
|---|---|---|
| 1 | function set identical (21 = 21) | PASS |
| 2–13 | `doGet, doPost, readGames_, readGameResults_, getOrCreateSheet_, setupGameSheets, seedSampleGames, generateQuestionsFromImages, classifyGamePairs_, readMillionaireQuestions_` preserved | PASS each |
| 14 | 20 bodies identical + only `setupGameSheets` cosmetic diff | PASS |
| 15–23 | `GAMES_HEADER` defined & matches v2; all sheet/header/ladder constants; 11-col `GAME_RESULTS_HEADER`; 12-col Millionaire header; `getInitData.millionaireQuestions` | PASS each |
| 24 | 12 doGet/doPost actions identical | PASS |
| 25–32 | no dangling refs (8 symbols); `setupGameSheets` core ops (create GameResults/Games, seed, 7→8-col migration) | PASS each |
| 33–34 | syntax `code.gs`, `code_v2.gs` | PASS each |
| 35–37 | `code_v2.gs` retained; `index.html` + `admin.html` present (unmodified by this phase — no writes issued to them) | PASS each |
| — | `getInitData` / `saveGameResult` as *top-level functions* | N/A by design — both are action branches in both files (§2); covered by action-parity check instead (2 naive script expectations adjusted, **zero code impact**) |

Net: **all semantic regression checks pass**. Frontend compatibility is static (no frontend files touched); Game Hub / 17 games / Millionaire read paths depend on the now-fixed `GAMES_HEADER` symbol, strictly improving over pre-merge `code.gs`.

## 12. Residual risks

1. **Deployment unknown (highest).** Either file's content — or something else entirely — may be live. Mitigation: dual-file Phase-03 patching already shipped Millionaire helpers to both; this merge changes only `code.gs`, so a deploy step is still required.
2. **`code_v2.gs` still on disk → two full backends coexist.** Intentional until §10 clears; risk is operator confusion (deploying the wrong file). Mitigation: this report + spec declare `code.gs` the repo canonical; delete/archive only post-verification.
3. **`setupGameSheets` cosmetic fork retained.** Zero data impact, but a future diff will still flag it. Accept or harmonize (log-only) at deploy time.
4. **No live test of `getInitData`/`saveGameResult`.** Static parity only; U2 15-col work remains out of scope and must not ride this phase.

## 13. Final status

```text
Repository canonical merge : PASS_WITH_RESIDUAL
  - code.gs is now the single canonical repo backend (1-line GAMES_HEADER port, all 21 functions preserved)
  - RESIDUAL: code_v2.gs intentionally retained pending deployment proof (§8, §12)
Live deployment            : BLOCKED / UNVERIFIED (§10) — no PASS claimed
Schema                     : FROZEN per Phase-08 rule (GameResults 11-col; Millionaire 12-col) — PASS
Overall Phase 08           : PASS_WITH_RESIDUAL + DEPLOYMENT BLOCKED
```

**PHASE 08 = BACKEND CONSOLIDATION ONLY.** No gameplay, visual, frontend, FSM, timer, lifeline, scoring, 17-game, or GameResults-migration change was made.
