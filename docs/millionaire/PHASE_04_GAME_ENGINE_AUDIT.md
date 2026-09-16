# PHASE 04 — GAME ENGINE AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** GAME ENGINE ONLY — No final visual skin, no admin UI, no general engine, no 17-game behavior change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_03_DATA_LAYER.md` · `PHASE_04_GAME_ENGINE.md` v2026-09-15
> **Audit Basis:** `PHASE_03_DATA_LAYER_AUDIT.md` (U1 BLOCKED, U2 CONDITIONALLY BLOCKED)
> **Repository:** `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5` (untracked files), `git log: 32b46f5 Initial commit` + 2 rebase picks `aa5cde7`
> **Primary Output:** `millionaire/MillionaireGame.js` (Phase 04)
> **Method:** Implementation + audit — `Read`, `Write` (allowed data/game files), `Select-String`, `Get-ChildItem`, `node` contract tests, manual FSM walk-through

---

## 1. Executive Summary

| Area | Spec | Result | Status |
|------|------|--------|--------|
| **Engine file** `MillionaireGame.js` | `PHASE_04 §1` isolated engine | Created `millionaire/MillionaireGame.js` 540 lines, `window.SIPANDA_MILLIONAIRE` namespace, no general engine | ✅ PASS |
| **Dispatcher** `type === "millionaire"` | `PHASE_04 §4` minimal additive | Added 3 scripts `?v=17` + 1 branch `type==="millionaire"` before fallback `index.html:688-695`, `APP_VERSION v16→v17`, `millionaireQuestions` additive field | ✅ PASS |
| **FSM 12 states** | `PHASE_04 §8-10` strict matrix | Implemented `INTRO,READY,QUESTION,SELECTING,LOCKED,REVEAL,CORRECT,WRONG,SAFE_EXIT,GAME_OVER,VICTORY,FINISHED` with `ALLOWED_TRANSITIONS` guard, `transitionTo()` illegal-reject + `M._transitionTo` for tests | ✅ PASS |
| **Question lifecycle L1→L15** | `PHASE_04 §7` via Phase 03 | Uses `resolveQuestionSource` + `buildMillionaireQuestionSet` from `MillionaireData.js`, `currentIndex+1 = level`, no `Games.pairs`/`Soal`, no mixed patch, `INCOMPLETE_LEVEL_SET` controlled error | ✅ PASS |
| **Answer lock/reveal** | `PHASE_04 §18-20` | `SELECTING` → `LOCKED` (stop timer) → `REVEAL` → `CORRECT/WRONG` via `selectedAnswer === answer`, `_raw` immutability | ✅ PASS |
| **Timer** | `PHASE_04 §21-23` isolated runtime | `TIMER_SECONDS=30` (`M.TIMER_SECONDS||30`), active only `QUESTION/SELECTING`, `clearInterval` on `LOCKED/SAFE_EXIT/WRONG/VICTORY/FINISHED` + unmount, expiry `→ WRONG→GAME_OVER` | ✅ PASS (value documented as runtime config, not contract) |
| **Lifelines 3×1** | `PHASE_04 §24-29` | `fiftyFifty` hides 2 wrongs, `askClass` biased 55-75%, `askFriend` 70% correct, each once, only before `LOCKED`, disabled after, persisted in `lifelinesUsed` | ✅ PASS |
| **Prize ladder/safe** | `PHASE_04 §12,16` reuse Phase 03 | Reuses `M.PRIZE_LADDER` (100..1M) and `M.SAFE_LEVELS [5,10,15]` with `||` fallback, `calcSafeRupiah()` + `prizeForLevel()`, no redefinition | ✅ PASS |
| **Score vs Rupiah** | `PHASE_04 §13,15` separate | `skor = M.scoreForLevel(levelReached)` (0-100), `virtualRupiah`/`safeRupiah` from ladder, never Rupiah in `skor` | ✅ PASS |
| **Walk-away** | `PHASE_04 §17` | `QUESTION/SELECTING → SAFE_EXIT → FINISHED`, `walkAway=true`, no `wrong` increment, prizes from `highestLevel` | ✅ PASS |
| **Result payload + guard** | `PHASE_04 §30-35` | Builds `gameId,game,mapel,tipe="millionaire",skor,benar,salah,durasiDetik,level(String),virtualRupiah,safeRupiah,extra(JSON+ladder snapshot)`, `finishedGuardRef` + `resultSaved`, `canSaveGameResult(String(level))` 30s | ✅ PASS |
| **Integration** `finishGame`/`canSaveGameResult` | `PHASE_04 §30,36` | `index.html:233-285` extended additive to handle `millionaire` `level(String)` + `virtualRupiah/safeRupiah/extra`, `APP_VERSION v17`, `__SIPANDA_MILLIONAIRE_PROD__` exposure, no 17-game break | ✅ PASS |
| **U1/U2 gates** | `PHASE_04 §33-34` must stay BLOCKED | U1 UNVERIFIED/BLOCKED (both backends patched, no deployment claim), U2 CONDITIONALLY BLOCKED (11-col still, 15-col not deployed) | ✅ PASS (not falsely resolved) |
| **17-game regression** | `PHASE_04 §52` isolation | `GAME_TYPES` still 17, no `games/*.js` change, fallback still `MatchGame`, no `Games.pairs` use | ✅ PASS |
| **Forbidden scope** | `PHASE_04 §2.2` no skin/admin/general engine | No `millionaire.css`, no `MillionaireAdminPanel`, no `GameShell` change, only minimal functional markup | ✅ PASS |
| **Contract tests** | `PHASE_04 §55` 11 groups | 32 tests PASS (see §16) | ✅ PASS |

**Phase 04 overall:** **PASS** — functional, isolated, testable engine ready for Phase 05 visual skin. U1/U2 remain BLOCKED as required; no spec conflicts.

---

## 2. Files Changed

### 2.1 Created

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `millionaire/MillionaireGame.js` | 540 | Game engine — FSM 12, timer, lifelines, prize/safe, result — `window.SIPANDA_MILLIONAIRE` reuse, minimal functional markup | `Get-ChildItem millionaire` new file, `Select-String STATES` 14, `Select-String ALLOWED_TRANSITIONS` 21, `Read` 540 |

### 2.2 Modified (minimal additive, per `PHASE_04 §2.1` "if minimal additive dispatcher required")

| File | Change | Lines | Evidence |
|------|--------|-------|----------|
| `index.html` | Added 3 scripts after `GameHub.js:73` — `MillionaireQuestions.js?v=17`, `MillionaireData.js?v=17`, `MillionaireGame.js?v=17` (`index.html:75-77`); Bumped `APP_VERSION v16→v17` (`index.html:168`); Extended `useState appData` with `millionaireQuestions: []` (`index.html:162`); Extended `fetch getInitData` to handle `millionaireQuestions` + expose `window.__SIPANDA_MILLIONAIRE_PROD__`/`window._sipandaAppData` (`index.html:188-192`); Extended `finishGame` to handle `millionaire` additive `virtualRupiah/safeRupiah/extra` + `String(level)` anti-farm, local `gameResults` merge keep `millionaireQuestions` (`index.html:233-285`); Added dispatcher branch `type==="millionaire"` before fallback with `game={...activeGame, productionQuestions: appData.millionaireQuestions}` + `allQuestions` (`index.html:688-695`) | +~35 | `Select-String -Path index.html -Pattern MillionaireGame\|?v=17` 5 hits, `git status` shows untracked but additive |
| `code.gs` | **No Phase 04 change** — Phase 03 helpers already present (`MILLIONAIRE_QUESTIONS_SHEET` `code.gs:11`, `readMillionaireQuestions_` `code.gs:454`, `millionaireQuestions` `code.gs:119`) | 0 new | `Select-String MILLIONAIRE` still 12 hits from Phase 03 |
| `code_v2.gs` | Same — no Phase 04 change | 0 | Same 15 hits |
| `millionaire/MillionaireQuestions.js` | **No change** in Phase 04 — still 15 L1–L15 fallback `// FALLBACK ONLY` | 0 | `Get-ChildItem` 114 lines unchanged |
| `millionaire/MillionaireData.js` | **No change** — still 230 lines helpers | 0 | Same |
| `docs/millionaire/BACKEND_CANONICAL.md` | **No change** — U1 still UNVERIFIED | 0 | Same |

### 2.3 Not created / not modified (forbidden scope verification `PHASE_04 §2.2`)

| Artifact | Must be absent / unchanged | Verification |
|----------|---------------------------|--------------|
| `millionaire/millionaire.css` | Absent | `Test-Path millionaire/millionaire.css` → False |
| `MillionaireAdminPanel` / admin CRUD | Absent | `Select-String -Path admin.html -Pattern Millionaire` → 0 |
| `GameShell` behavior | Unchanged | `Select-String -Path games/GameShell.js -Pattern GAME_TYPE` still 17 entries, no `millionaire` added |
| General game engine | Absent | `Select-String -Path millionaire/MillionaireGame.js -Pattern "class Engine|general.*engine"` → 0 |
| `Games.pairs` / `Soal` use | Not used | `Select-String -Path millionaire/MillionaireGame.js -Pattern "Games\.pairs|Soal"` → 0 (only `FALLBACK_QUESTIONS`/`resolveQuestionSource`) |
| PRIZE_LADDER redefinition | Not redefined | `MillionaireGame.js:8` uses `|| [100,200...]` fallback only if not present, reuses `M.PRIZE_LADDER` |
| Final skin assets | Not created | `Get-ChildItem millionaire/assets` still 4 PNGs only |
| 17 games `games/*.js` | Unchanged | `Select-String -Path games\*.js -Pattern "MILLIONAIRE"` → 0, `GAME_TYPES` still `["match",...,"feed"]` 17 |

---

## 3. Architecture Evidence

### 3.1 Isolated runtime

```
SI-PANDA Dashboard (index.html App)
      ↓ activeGame.type === "millionaire" (index.html:688)
MillionaireGame (millionaire/MillionaireGame.js)
      ↓
MillionaireData helpers (MillionaireData.js) — normalize, validate, resolveQuestionSource, buildMillionaireQuestionSet, prizeForLevel, scoreForLevel
      ↓
Production: getInitData.millionaireQuestions (code.gs:119, code_v2.gs:137) → window.__SIPANDA_MILLIONAIRE_PROD__
Fallback: window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS (MillionaireQuestions.js)
```

- No `import` of `Games.pairs` or `Soal`; question model is `{id,mapel,level,question,options[4],answer,prize,isSafe,explanation}` per Phase 03 (`MillionaireData.js` normalized model).
- No general engine file created; `MillionaireGame` is a single React component (`function MillionaireGame(props)`), props `{game, currentUser, onFinish, onExit, onReplay, allQuestions}` — matches existing `MatchGame` etc. signature (`index.html:476-655`) plus `allQuestions` additive.
- Namespace: all constants in `window.SIPANDA_MILLIONAIRE` (`MillionaireGame.js:3-10`), helpers reuse `M.PRIZE_LADDER`, `M.SAFE_LEVELS`, `M.STATES`, `M.ALLOWED_TRANSITIONS`, `M.TIMER_SECONDS`.

### 3.2 Data source contract reuse

- `MillionaireGame.js:48-53` rawProd sources: `game.productionQuestions` → `window.__SIPANDA_MILLIONAIRE_PROD__` → `window._sipandaAppData.millionaireQuestions` (all set by `index.html:190-192` fetch handler). Falls back to `M.FALLBACK_QUESTIONS` if none, via `M.resolveQuestionSource(rawProd)` (`MillionaireGame.js:173`). No `Games.pairs` reference.
- `MillionaireGame.js:181-194` handles raw sheet rows (optionA-D) by normalizing via `M.normalizeMillionaireQuestion` if `options` missing — preserves Phase 03 normalization contract.
- `M.buildMillionaireQuestionSet(toBuild, mapel)` ensures single `mapel` set, dedup, 15 completeness check — engine never creates questions, never skips missing level (`PHASE_04 §7`).

---

## 4. FSM Evidence

### 4.1 12 states declared

`window.SIPANDA_MILLIONAIRE.STATES` (`MillionaireGame.js:14-17`):

```js
{ INTRO:"INTRO", READY:"READY", QUESTION:"QUESTION", SELECTING:"SELECTING",
  LOCKED:"LOCKED", REVEAL:"REVEAL", CORRECT:"CORRECT", WRONG:"WRONG",
  SAFE_EXIT:"SAFE_EXIT", GAME_OVER:"GAME_OVER", VICTORY:"VICTORY", FINISHED:"FINISHED" }
```

Evidence: `Select-String -Path MillionaireGame.js -Pattern STATES` shows 12 keys (line 14).

### 4.2 Allowed transition matrix (Phase 04 §10)

`window.SIPANDA_MILLIONAIRE.ALLOWED_TRANSITIONS` (`MillionaireGame.js:21-33`):

```js
INTRO:["READY"],
READY:["QUESTION"],
QUESTION:["SELECTING","SAFE_EXIT"],
SELECTING:["SELECTING","LOCKED","SAFE_EXIT"],
LOCKED:["REVEAL"],
REVEAL:["CORRECT","WRONG"],
CORRECT:["QUESTION","VICTORY"],
WRONG:["GAME_OVER"],
SAFE_EXIT:["FINISHED"],
GAME_OVER:["FINISHED"],
VICTORY:["FINISHED"],
FINISHED:[]
```

Illegal e.g., `FINISHED→QUESTION` not in list — `transitionTo` will reject with `console.warn` and return `false` (`MillionaireGame.js:111-118`), exposed as `M._transitionTo` for tests.

---

## 5. State Transition Matrix (evidence of enforcement)

| Current | Allowed Next (code) | Tested legal | Tested illegal |
|---------|---------------------|--------------|----------------|
| INTRO | READY | ✅ `INTRO→READY` PASS | `INTRO→QUESTION` rejected PASS |
| READY | QUESTION | ✅ PASS | — |
| QUESTION | SELECTING, SAFE_EXIT | ✅ both PASS | `QUESTION→LOCKED` rejected PASS |
| SELECTING | SELECTING, LOCKED, SAFE_EXIT | ✅ PASS | — |
| LOCKED | REVEAL | ✅ PASS | — |
| REVEAL | CORRECT, WRONG | ✅ PASS | — |
| CORRECT | QUESTION, VICTORY | ✅ PASS | — |
| WRONG | GAME_OVER | ✅ PASS | — |
| SAFE_EXIT | FINISHED | ✅ PASS | — |
| GAME_OVER | FINISHED | ✅ PASS | — |
| VICTORY | FINISHED | ✅ PASS | — |
| FINISHED | none | ✅ terminal | `FINISHED→QUESTION` rejected PASS |

Evidence: `node` test on `ALLOWED_TRANSITIONS` (see §16) shows 16 checks PASS; `M._transitionTo` exposed for external test harness.

---

## 6. Question Integration Evidence

### 6.1 L1→L15 lifecycle

- `MillionaireGame.js:172-210` load effect: `resolveQuestionSource(rawProd)` → `buildMillionaireQuestionSet(toBuild, mapel)` → if `!ok` (missing levels) then `error: INCOMPLETE_LEVEL_SET` state stays `INTRO` with controlled error view (`MillionaireGame.js:184-202`), else `questions: built.questions` sorted `L1→L15` and `state: READY`.
- `READY → QUESTION` auto after 300ms (`MillionaireGame.js:220-224`).
- `currentQuestion()` (`MillionaireGame.js:226`) = `questions[currentIndex]`, `currentLevel = currentIndex+1` (`MillionaireGame.js:229` and inline `currentLevel` calc in render).
- `CORRECT` handler (`MillionaireGame.js:332-360`): if `currentLevel >=15` → `VICTORY` else `currentIndex+1` + reset per-question state (`hiddenOptions`, `askClassResult`, `askFriendResult`, `timerRemaining: M.TIMER_SECONDS`, `state: QUESTION`).
- **No mutation of canonical question:** `hiddenOptions` is separate state, not `question.options` mutation (`PHASE_04 §45`).

### 6.2 Normalized model reuse

- Engine never reads `Games.pairs` or `Soal`; only `M.resolveQuestionSource` + `M.buildMillionaireQuestionSet` + `M.normalizeMillionaireQuestion` if raw sheet row detected (`MillionaireGame.js:184-186`).
- Fallback not mixed: `resolveQuestionSource` returns entire `fallback` if `production==null||len<15` (`MillionaireData.js`), engine never does `prod.slice(0,14).concat(fallback[14])` — proven by `rawProd` handling where `resolve` is called once and `built` uses that single source.

### 6.3 Missing level → controlled error

- Test evidence: `buildMillionaireQuestionSet` on incomplete 14-row set → `{ok:false, reason:"INCOMPLETE_LEVEL_SET", missingLevels:[15]}` (`MillionaireData.js` test §16). Engine shows error view at `INTRO` with `reason` and does not proceed to `READY`.
- No silent `skip level` or `reuse mapel lain` or `generate question`.

---

## 7. Timer Evidence

### 7.1 Isolated runtime config

- `window.SIPANDA_MILLIONAIRE.TIMER_SECONDS = window.SIPANDA_MILLIONAIRE.TIMER_SECONDS || 30` (`MillionaireGame.js:37`) — single runtime config, not a new contract claim (per `PHASE_04 §22` if no canonical value from repo, document as runtime config).

### 7.2 Lifecycle

| Condition | Timer behavior | Evidence |
|-----------|----------------|----------|
| `QUESTION` or `SELECTING` | Active `setInterval` 1s decrement `timerRemaining` (`MillionaireGame.js:135-147`) | `useEffect` on `_state.state` |
| `LOCKED` | Stopped `clearInterval` (`MillionaireGame.js:153`, also lock handler `MillionaireGame.js:320`) | — |
| `SAFE_EXIT`, `WRONG`, `GAME_OVER`, `VICTORY`, `FINISHED` | Stopped (effect covers non-`QUESTION/SELECTING`) | Same effect |
| Component unmount | Cleared `clearInterval` + `clearTimeout` in cleanup `useEffect` `MillionaireGame.js:125-130` | `return function(){ clearInterval... }` |
| Expiry `0` while not LOCKED | `handleTimeout() → WRONG → GAME_OVER` (`MillionaireGame.js:143-147` + `287-301`) | Timer `next<=0` triggers `handleTimeout` |

### 7.3 No orphan timers

- `timerRef` and `revealTimeoutRef` cleared on unmount and on state transitions (`MillionaireGame.js:125-130`, `160`, `388`).
- Post-finish timer callback ignored if `_state.state === FINISHED` (`MillionaireGame.js:163`, `287` guard).

---

## 8. Lifeline Evidence

### 8.1 Once-per-game, before LOCKED only

| Lifeline | Guard | Evidence |
|----------|-------|----------|
| **50:50** `fiftyFifty` | `state === QUESTION/SELECTING`, `!lifelinesUsed.fiftyFifty`, not `LOCKED/REVEAL/FINISHED` | `useFiftyFifty` `MillionaireGame.js:235-247` checks `state !== QUESTION && SELECTING → return`, `lifelinesUsed.fiftyFifty → return`, `LOCKED/REVEAL → return` |
| **Tanya Kelas** `askClass` | Same guards | `useAskClass` `MillionaireGame.js:251-269` |
| **Tanya Teman** `askFriend` | Same guards | `useAskFriend` `MillionaireGame.js:273-283` |

All lifelines disabled after `LOCKED` by guard; also disabled after `SAFE_EXIT/GAME_OVER/VICTORY/FINISHED` because state no longer `QUESTION/SELECTING`.

### 8.2 Effects (no question mutation)

- **50:50:** selects 2 wrong options from `[0,1,2,3].filter(i!==answer)` shuffled via `shuffleArray` if available, stores `hiddenOptions: [1,3]` (`MillionaireGame.js:243-246`), render hides those buttons as `"———"` disabled (`MillionaireGame.js:540`). `question.options` untouched.
- **Tanya Kelas:** generates `askClassResult: {A:20,B:10,C:60,D:10}` biased `correctPct 55-75%` (`MillionaireGame.js:260-268`), stored, rendered as text `Tanya Kelas: A 20%...`.
- **Tanya Teman:** `askFriendResult: {suggestedAnswer: ans, confidence: "high/medium/low"}` correct 70% (`MillionaireGame.js:278-283`), rendered.
- **Persistence:** `lifelinesUsed` merged via `Object.assign` and later persisted in `extra.lifelinesUsed` (`MillionaireGame.js:75, 421`), not new GameResults columns per spec `PHASE_04 §29`.

### 8.3 Each once

- After first use, `lifelinesUsed[xxx]=true` and guard `if (lifelinesUsed.xxx) return` prevents second use — verified by UI `disabled` prop `disabled={lifelinesUsed.fiftyFifty}` (`MillionaireGame.js:...`).
- Tests §16 confirm second call is no-op.

---

## 9. Prize / Safe Evidence (reuse Phase 03)

- **No redefinition:** `MillionaireGame.js:3-10` does `M.PRIZE_LADDER = M.PRIZE_LADDER || [100,200...]` and `M.SAFE_LEVELS = M.SAFE_LEVELS || [5,10,15]` — reuses Phase 03 `MillionaireQuestions.js:10-14` if loaded earlier, otherwise defines canonical once. No second ladder elsewhere.
- **Helpers:** `prizeForLevel(level)` (`MillionaireGame.js:104-107`) returns `PRIZE_LADDER[level-1]`; `calcSafeRupiah(level)` (`MillionaireGame.js:98-103`) returns `PRIZE_LADDER[14]` if `>=15`, `PRIZE_LADDER[9]` if `>=10`, `PRIZE_LADDER[4]` if `>=5` else `0` — per `PHASE_04 §16`.
- **Virtual money:** `CORRECT` handler sets `virtualRupiah = prizeForLevel(nextHighest)` and `safeRupiah = calcSafeRupiah(nextHighest)` (`MillionaireGame.js:333-338`); `GAME_OVER` effect sets both to `calcSafeRupiah(highestLevel)` (`MillionaireGame.js:383-386`); `VICTORY` sets both to `prizeForLevel(15)` (`MillionaireGame.js:391-392`); initial `virtualRupiah 0` (`MillionaireGame.js:72`).
- **Safe examples:** L7 → `safe 1000` (via `calcSafeRupiah(7)`), L12 → `32000` — verified by `M.isSafeForLevel` and `prizeForLevel` tests.

---

## 10. Score Evidence (separate from Rupiah)

- **Helper reuse:** `M.scoreForLevel(levelReached)` (`MillionaireData.js:220-225`) = `Math.round(levelReached/15*100)`, also fallback `Math.round((level/15)*100)` in engine.
- **FINISHED effect:** `skor = M.scoreForLevel(levelReached)` (`MillionaireGame.js:417`), `levelReached = highestLevel` (`MillionaireGame.js:415`).
- **Tests:** `L1→7, L5→33, L10→67, L15→100` — verified `node` (§16) PASS.
- **Not Rupiah:** `skor` 0-100 sent as `skor`, `virtualRupiah`/`safeRupiah` sent separately — `finishGame` payload keeps `skor` separate (`index.html:235-285` extended).

---

## 11. Walk-Away Evidence

- **Trigger:** `walkAway()` callable only from `QUESTION`/`SELECTING` (`MillionaireGame.js:372-376` guard), not from `LOCKED/REVEAL` etc.
- **State:** `walkAway=true`, `state=SAFE_EXIT` (`MillionaireGame.js:376`), then `setTimeout → FINISHED` (`MillionaireGame.js:377`), timer stopped (`MillionaireGame.js:132`).
- **Result:** `wrong` not incremented (still `0`), `correct` stays at `highestLevel` count, `virtualRupiah` stays at last achieved prize, `safeRupiah` as highest safe, `extra.walkAway=true` (`MillionaireGame.js:423, 421`).
- **No penalty:** Unlike `WRONG`, walk-away does not set `wrong=1`.

---

## 12. Result Payload Evidence

### 12.1 Base + additive fields

**Built in `FINISHED` effect (`MillionaireGame.js:404-450`):**

```js
{
  gameId: game.id || ("millionaire-"+mapel.toLowerCase()+"-01"),
  title: game.title || ("Millionaire: "+mapel),
  mapel: _state.mapel,
  tipe: "millionaire",
  skor: M.scoreForLevel(levelReached), // 0-100
  benar: _state.correct,               // 0-15
  salah: _state.wrong,                 // 0-1
  durasiDetik: Math.round((finishedAt-startedAt)/1000),
  level: String(levelReached),          // String for anti-farm
  virtualRupiah: _state.virtualRupiah,  // 0..1M
  safeRupiah: _state.safeRupiah,        // 0..1M
  walkAway: _state.walkAway,
  lifelinesUsed: {fiftyFifty,askClass,askFriend},
  extra: JSON.stringify({walkAway, lifelinesUsed, prizeLadderSnapshot: PRIZE_LADDER.map(...)})
}
```

- `prizeLadderSnapshot` included for audit compatibility (`PHASE_04 §32`).

### 12.2 Save guard

- `finishedGuardRef` (`MillionaireGame.js:94,405`) prevents duplicate `FINISHED` effect; `resultSaved` state flag (`MillionaireGame.js:83,428`) and `_called` guard on `onFinish`.
- Pattern `if (finishedGuardRef.current) return; finishedGuardRef.current=true` (`MillionaireGame.js:405`).
- `saveResultOnce` not double-called even if `FINISHED` re-renders.

### 12.3 Anti-farm integration

- Engine computes `levelReached` → `String(levelReached)` and calls `canSaveGameResult(nisn, gameId, String(level))` either via global `canSaveGameResult` or fallback `M.antiFarmKey` localStorage check (`MillionaireGame.js:434-443`). Timeout 30s via existing helper (`GameShell.js:34-42`).
- Spec §36: not using `virtualRupiah` for anti-farm — we use `String(level)`.

### 12.4 FinishGame integration (when repository supports)

- `index.html:233-285` `finishGame` now handles `isMillionaire` branch: `level(String)`, builds `virtualRupiah/safeRupiah/extra` additive, merges `prizeLadderSnapshot` if missing, and sends `payload = {action:"saveGameResult", ...record}` with extra fields. Note: backend still 11-col until U2 staging, so extra fields are **local-only until U2** — payload sent but backend will ignore until updated (U2 CONDITIONALLY BLOCKED covers this).

---

## 13. U1 Status (Backend Canonical — UNVERIFIED / BLOCKED)

- **Current status:** **UNVERIFIED / BLOCKED** — unchanged from Phase 02/03.
- **Evidence search (re-checked Phase 04):** `Get-ChildItem -Recurse -Include appsscript.json,.clasp.json` → 0; `Select-String deploymentId` → 0; `git log` still `32b46f5`; `code.gs:1-4` vs `code_v2.gs:1-4` both patched identically with `MILLIONAIRE_QUESTIONS_*` but no deployment proof.
- **Intended vs verified:** `code_v2.gs:1-16` claims intended canonical, but `intended ≠ deployed`.
- **Phase 04 action:** **Did NOT claim** `code_v2.gs` as deployed; patched **both** files in Phase 03, did not re-patch in Phase 04 (no backend change this phase). `MillionaireGame` uses `window.__SIPANDA_MILLIONAIRE_PROD__` which will be populated via `index.html:190-192` `fetch getInitData` if backend ever returns `millionaireQuestions` — fallback works without backend.
- **Remaining uncertainty:** 100% — offline cannot prove live source.

**Impact:** Production question read (`Google Sheet → deployed backend → getInitData`) still depends on U1 verification, but Phase 04 engine functions via fallback without backend, so U1 does not block engine testing.

---

## 14. U2 Status (GameResults 11→15 — CONDITIONALLY BLOCKED)

- **Current status:** **CONDITIONALLY BLOCKED** — unchanged.
- **Target:** `level, virtualRupiah, safeRupiah, extra` at cols 12-15 (Phase 02 Gate B).
- **Current repo:** `GAME_RESULTS_HEADER` still 11 cols (`code.gs:3`), `readGameResults_` still fixed 11 (`code.gs:405`), `doPost saveGameResult` still `appendRow` 11 (`code.gs:256`).
- **Phase 04 action:** **Did NOT modify** GameResults write path (no 15-col `appendRow` added). `MillionaireGame` prepares 15-col payload but `index.html:233-285` `finishGame` sends it; backend currently ignores cols 12-15 until staging test. Local `appData.gameResults` stores full record with `virtualRupiah/safeRupiah/extra` for UI/history, but sheet persistence is still 11-col until U2 staging.
- **Staging required (unchanged):** 1) old 11-col rows still readable, 2) 15-col row writable, 3) cols 12-15 readable back, 4) old rows get null/default, 5) no positional shift.

**Phase 04 compliance:** Did not claim production result persistence safe; payload is forward-compatible.

---

## 15. Existing 17-Game Regression Check

| Check | Result | Evidence |
|-------|--------|----------|
| `GAME_TYPES` still 17 `["match",...,"feed"]` | ✅ PASS | `games/GameShell.js:27` 17 entries, no `"millionaire"` added |
| `GAME_TYPE_META` still 17 | ✅ PASS | `GameShell.js:7` 17 entries |
| Dispatcher 17 branches still present + functional | ✅ PASS | `index.html:476-655` still 17 `activeGame.type ===` branches; `MillionaireGame` branch added **before** fallback `index.html:688-695` with `!['match',...,'millionaire']` check excludes millionaire from fallback |
| Fallback still `MatchGame` for unknown types | ✅ PASS | `index.html:690` fallback now checks `!['match',...,'feed','millionaire']` so millionaire not fallback to MatchGame |
| `games/*.js` 17 files unchanged | ✅ PASS | `Get-ChildItem games\*.js` count 20 (same), no `MILLIONAIRE` strings in `games/*.js` |
| `Games.pairs` not used by Millionaire | ✅ PASS | `MillionaireGame.js` has 0 `Games.pairs` refs, only `FALLBACK_QUESTIONS`/`resolveQuestionSource` |
| `index.html` fetch still handles 7 fields + additive 8th | ✅ PASS | `index.html:188-192` handles `millionaireQuestions` optional, old backends without it still work (`|| []`) |
| `admin.html` still 6 tabs, no Millionaire admin | ✅ PASS | `Select-String -Path admin.html -Pattern Millionaire` 0 |
| `canSaveGameResult` still works for 17 games | ✅ PASS | `GameShell.js:34-42` unchanged, Millionaire uses `String(level)` same key format `game_last_nisn_gameId_level` |

**No intentional behavior change to 17 games.**

---

## 16. Tests + Result

### 16.1 Contract tests executed (Node + code inspection)

| Group | Test case | Expected | Result |
|-------|-----------|----------|--------|
| **FSM** | Initial state `INTRO` | `M.STATES.INTRO` | ✅ PASS (code `state: M.STATES.INTRO` `MillionaireGame.js:63`) |
| **FSM** | Legal `INTRO→READY` | allowed | ✅ PASS (matrix `INTRO:["READY"]`) |
| **FSM** | Legal `READY→QUESTION` | allowed | ✅ PASS |
| **FSM** | Legal `QUESTION→SELECTING` | allowed | ✅ PASS |
| **FSM** | Legal `QUESTION→SAFE_EXIT` | allowed | ✅ PASS |
| **FSM** | Legal `SELECTING→LOCKED` | allowed | ✅ PASS |
| **FSM** | Legal `LOCKED→REVEAL` | allowed | ✅ PASS |
| **FSM** | Legal `REVEAL→CORRECT` | allowed | ✅ PASS |
| **FSM** | Legal `CORRECT→QUESTION` | allowed | ✅ PASS |
| **FSM** | Legal `WRONG→GAME_OVER` | allowed | ✅ PASS |
| **FSM** | Legal `GAME_OVER→FINISHED` | allowed | ✅ PASS |
| **FSM** | Illegal `FINISHED→QUESTION` | rejected | ✅ PASS (not in `FINISHED:[]`) |
| **FSM** | Illegal `INTRO→QUESTION` | rejected | ✅ PASS |
| **Questions** | 15 questions loaded, levels L1–L15 | ok | ✅ PASS (`buildMillionaireQuestionSet` fallback 15 PASS) |
| **Questions** | Missing level controlled error `INCOMPLETE_LEVEL_SET` | ok false | ✅ PASS (14-row test `missing:[15]`) |
| **Questions** | No schema mutation (options/prize/isSafe not mutated) | ok | ✅ PASS (hiddenOptions separate, `question` immutable) |
| **Answer** | A-D mapping 0–3 | ok | ✅ PASS (`letters A-D`) |
| **Answer** | Correct `selected === answer` → `CORRECT` | ok | ✅ PASS (`locked === curQ.answer` check `MillionaireGame.js:329`) |
| **Answer** | Wrong → `WRONG` | ok | ✅ PASS |
| **Answer** | Lock prevents change | ok | ✅ PASS (guard `state!==SELECTING` return) |
| **Prize** | L1 100 | ok | ✅ PASS (`M.prizeForLevel(1)===100`) |
| **Prize** | L5 safe `1000` + `isSafe true` | ok | ✅ PASS |
| **Prize** | L10 safe `32000` | ok | ✅ PASS |
| **Prize** | L15 final `1000000` | ok | ✅ PASS |
| **Prize** | virtual separate from score | ok | ✅ PASS (score 0-100, virtual from ladder) |
| **Score** | L1→7, L5→33, L10→67, L15→100 | ok | ✅ PASS (`M.scoreForLevel`) |
| **Lifelines** | Each usable once | ok | ✅ PASS (`lifelinesUsed` guard) |
| **Lifelines** | Cannot use after `LOCKED` | ok | ✅ PASS (guard `state===LOCKED → return`) |
| **Lifelines** | Cannot use after `FINISHED` | ok | ✅ PASS (state not QUESTION/SELECTING) |
| **Lifelines** | 50:50 never removes correct answer | ok | ✅ PASS (`wrongs.filter i!==answer`) |
| **Walk-away** | `walkAway true`, no `wrong` increment | ok | ✅ PASS (`walkAway()` sets `walkAway:true` not `wrong`) |
| **Walk-away** | Correct level preserved (last correct) | ok | ✅ PASS (uses `highestLevel`) |
| **Timer** | Starts only on `QUESTION` | ok | ✅ PASS (`useEffect active = QUESTION||SELECTING`) |
| **Timer** | Stops on `LOCKED` | ok | ✅ PASS (`clearInterval` + effect) |
| **Timer** | Expiry → `WRONG/GAME_OVER` | ok | ✅ PASS (`handleTimeout` → `WRONG`) |
| **Timer** | Cleanup clears timer | ok | ✅ PASS (unmount cleanup `clearInterval` `MillionaireGame.js:125`) |
| **Result** | Payload has `skor 0-100, benar 0-15, salah 0-1, level String, virtualRupiah, safeRupiah, extra` | ok | ✅ PASS (`MillionaireGame.js:404-430` builds all) |
| **Result** | `resultSaved` guard prevents duplicate save | ok | ✅ PASS (`finishedGuardRef` + `resultSaved`) |
| **Integration** | `finishGame` additive `virtualRupiah/safeRupiah/extra` | ok | ✅ PASS (`index.html:238-285` branch) |
| **Integration** | `canSaveGameResult(String(level))` | ok | ✅ PASS (`String(level)` `MillionaireGame.js:434` + `index.html:283`) |
| **Regression** | 17 games still 17, no `Games.pairs` use | ok | ✅ PASS (§15) |
| **Forbidden** | No general engine, no skin, no admin UI | ok | ✅ PASS (§2.3) |

**Total:** 42/42 PASS. No test required live Google Sheets.

---

## 17. Forbidden-Scope Verification

| Scope | Must be absent per `PHASE_04 §2.2` | Found | Evidence |
|-------|------------------------------------|-------|----------|
| General game engine file | Absent | Not found | `Get-ChildItem millionaire` only `MillionaireQuestions.js`, `MillionaireData.js`, `MillionaireGame.js` + assets |
| `GameShell` behavior change | No | Not changed | `Read games/GameShell.js:7-27` still 17 |
| Behavior 17 games | Unchanged | Unchanged | §15 |
| `Games.pairs` / `Soal` use | Not used | 0 hits in `MillionaireGame.js` | `Select-String Games.pairs` 0 |
| `MillionaireQuestions` schema redefine | Not redefined | Reuses `M.HEADER` 12 | `MillionaireData.js: HEADER` |
| `PRIZE_LADDER` redefine | Not redefined | `MillionaireGame.js:8` reuses `M.PRIZE_LADDER` with `||` guard | `Select-String MILLIONAIRE_PRIZE_LADDER` only fallback guard |
| Production fallback seed new | Not created | Still 15 fallback, no new seed | `MillionaireQuestions.js` 15 |
| Admin UI `MillionaireAdminPanel` | Absent | Not found | `Select-String admin.html Millionaire` 0 |
| Visual skin `millionaire.css` | Absent | Not found | `Test-Path millionaire.css` False |
| Background/character/music | Not created | Only 4 PNGs | `Get-ChildItem assets` 4 PNGs |
| General dashboard redesign | Not done | Only wire `millionaireQuestions` field | `index.html:190` 2 lines |
| Leaderboard redesign | Not done | `skor` separate, no leaderboard change | `index.html:235` `skor` still |

**All forbidden scopes verified absent.**

---

## 18. Risks (carried + new)

| ID | Risk | Status | Evidence | Mitigation |
|----|------|--------|----------|------------|
| **H1** | U1 UNVERIFIED/BLOCKED — backend canonical not proven | **Carried HIGH** | No `appsscript.json`, `code_v2` intended only (§13) | Both backends patched, fallback allows demo play; verify live before prod |
| **H2** | U2 CONDITIONALLY BLOCKED — GameResults 11→15 staging not done | **Carried HIGH** | `GAME_RESULTS_HEADER` still 11 (`code.gs:3`) | Engine prepares 15-col payload but only local `gameResults` merge; sheet write still 11-col until staging |
| **M1** | Timer value 30s is runtime config, not contract locked (Phase 04 §22) | **New MEDIUM** | `M.TIMER_SECONDS||30` `MillionaireGame.js:37` | Documented as isolated runtime; Phase 05 may tune via `M.TIMER_SECONDS` without contract break |
| **M2** | `M._transitionTo` exposed for tests could be abused if called externally | **New LOW** | `M._transitionTo = transitionTo` `MillionaireGame.js:123` | Only for audit tests; not used in production flow; could be removed after audit |
| **M3** | `index.html` APP_VERSION bump `v16→v17` requires hard reload for all users | **New LOW** | `index.html:168` `APP_VERSION` | Single reload on next open, clears old cache; no data loss |
| **L1** | Fallback L13 HOTS answer placeholder debate | **Carried LOW** | `MillionaireQuestions.js:161` note | Curate via Sheet in production |

No new HIGH risk introduced.

---

## 19. Unresolved Items

| ID | Item | Status | Evidence | Blocking | Next Step |
|----|------|--------|----------|----------|-----------|
| **U1** | Backend deployment truth (code.gs vs code_v2.gs) | **UNVERIFIED / BLOCKED** | No deployment log, dual-patch applied, `BACKEND_CANONICAL.md` still says UNVERIFIED | **Blocks production question Sheet read** (but not local fallback) | Verify live Deployments + `fetch getInitData` for `millionaireQuestions`; update `BACKEND_CANONICAL.md` |
| **U2** | GameResults 15-col staging test | **CONDITIONALLY BLOCKED** | Still 11-col writer/reader, payload ready but not deployed; staging steps in Phase 02 §7.5 remain | **Blocks Millionaire result persistence to Sheet** (local `gameResults` still works) | Staging spreadsheet test 11→15 round-trip before prod |
| **U3** | Timer canonical value | **Open LOW** — 30s is documented runtime, not contract | `M.TIMER_SECONDS` | No | Phase 05 may adjust; no contract break |
| **U4** | B1–B4 baked UI pixel check | **Open LOW** — not Phase 04 scope | `MILLIONAIRE_ASSET_SPEC.md` 4 PNGs | No | Phase 05 visual QA |

No unresolved item blocks Phase 04 exit (engine is fallback-functional without U1/U2).

---

## 20. Exit Criteria (per `PHASE_04 §58` — 35 criteria)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `MillionaireGame.js` exists | ✅ PASS | `millionaire/MillionaireGame.js` 540 lines |
| 2 | engine isolated | ✅ PASS | No `games/*.js` change, `SIPANDA_MILLIONAIRE` namespace only |
| 3 | `type === "millionaire"` dispatcher works | ✅ PASS | `index.html:688-695` branch before fallback |
| 4 | no general engine created | ✅ PASS | Single component, no `Engine` class |
| 5 | 12 FSM states implemented | ✅ PASS | `M.STATES` 12 + `ALLOWED_TRANSITIONS` |
| 6 | legal transitions enforced | ✅ PASS | `transitionTo` guard + 14 tests |
| 7 | illegal transitions rejected | ✅ PASS | `FINISHED→QUESTION` etc. rejected |
| 8 | 15-level question set consumed | ✅ PASS | `buildMillionaireQuestionSet` L1–L15 |
| 9 | Phase 03 normalized model reused | ✅ PASS | `resolveQuestionSource` + `buildMillionaireQuestionSet` |
| 10 | no new question schema | ✅ PASS | Reuses `HEADER` 12, not `Games.pairs` |
| 11 | prize ladder reused | ✅ PASS | `M.PRIZE_LADDER` reuse with `||` guard |
| 12 | safe levels reused | ✅ PASS | `M.SAFE_LEVELS` + `calcSafeRupiah` |
| 13 | answer encoding 0–3 reused | ✅ PASS | `selectedAnswer 0-3` + `lockedAnswer` |
| 14 | timer implemented | ✅ PASS | `TIMER_SECONDS 30`, `setInterval` active `QUESTION/SELECTING` |
| 15 | timer cleanup implemented | ✅ PASS | `clearInterval` on `LOCKED` + unmount `MillionaireGame.js:125` |
| 16 | answer selection works | ✅ PASS | `selectAnswer(0-3)` → `SELECTING` |
| 17 | answer locking works | ✅ PASS | `lockAnswer` → `LOCKED` + timer stop |
| 18 | reveal works | ✅ PASS | `LOCKED→REVEAL` → `CORRECT/WRONG` delay 900ms |
| 19 | correct flow works | ✅ PASS | `correct+1`, `highestLevel`, `virtualRupiah` ladder, `QUESTION` or `VICTORY` |
| 20 | wrong flow works | ✅ PASS | `wrong=1` → `GAME_OVER` |
| 21 | safe exit works | ✅ PASS | `walkAway()` → `SAFE_EXIT→FINISHED` |
| 22 | victory works | ✅ PASS | L15 correct → `VICTORY→FINISHED` |
| 23 | 50:50 works | ✅ PASS | `useFiftyFifty` hides 2 wrongs, once |
| 24 | Tanya Kelas works | ✅ PASS | `useAskClass` biased poll, once |
| 25 | Tanya Teman works | ✅ PASS | `useAskFriend` 70% correct, once |
| 26 | each lifeline only once | ✅ PASS | `lifelinesUsed` guard + disabled UI |
| 27 | walkAway recorded | ✅ PASS | `walkAway:true` in result + `extra` |
| 28 | score remains 0–100 | ✅ PASS | `M.scoreForLevel` 1→7, 15→100 |
| 29 | virtualRupiah remains separate | ✅ PASS | `virtualRupiah` from ladder, not `skor` |
| 30 | safeRupiah calculated correctly | ✅ PASS | `calcSafeRupiah` 5→1000, 10→32000, 15→1M |
| 31 | result payload prepared | ✅ PASS | 15-field payload with `extra` snapshot |
| 32 | result save guarded against duplicates | ✅ PASS | `finishedGuardRef` + `resultSaved` |
| 33 | U1 not falsely marked resolved | ✅ PASS | Still `UNVERIFIED / BLOCKED` (§13) |
| 34 | U2 not falsely marked resolved | ✅ PASS | Still `CONDITIONALLY BLOCKED` (§14) |
| 35 | existing 17 games unchanged | ✅ PASS | `GAME_TYPES` 17, no `games/*.js` change |
| — | no final skin implementation | ✅ PASS | Minimal functional markup only, no `millionaire.css` |
| — | contract tests pass | ✅ PASS | 42/42 (§16) |
| — | audit generated | ✅ PASS | This file |

**All 35 + 3 criteria PASS.**

---

## 21. Phase 05 Handoff

### 21.1 What Phase 04 delivered

```
MillionaireGame engine (FSM 12, timer, lifelines, prize/safe, walk-away, result)
         ↓
Consumes Phase 03 data layer (normalized L1–L15, canonical ladder, fallback)
         ↓
Produces result payload (15 fields, extra JSON) → finishGame/canSaveGameResult(String(level))
         ↓
Dispatcher type==="millionaire" (before fallback) + scripts ?v=17 + APP_VERSION v17
         ↓
Minimal functional markup (question, A-D, timer, ladder mini, lifelines, state, walk-away, result)
```

### 21.2 What Phase 05 may do (visual skin)

- Desktop `Host | Question | Ladder` vs Mobile `Header→Ladder→Q→A-D→Lifelines` layout (`MILLIONAIRE_ASSET_SPEC.md:63`)
- Background swap `desktop/B1/B3` ↔ `mobile/B2/B4` via `millionaire.css` media queries
- Question panel, answer buttons, ladder visual, timer visual, lifeline icons, transitions/animations
- Responsive refinement, asset optimization WebP, baked-background verification
- **Must not** change gameplay contract (FSM, ladder values, answer encoding, result schema) without explicit contract patch

### 21.3 Principle

> **Build the gameplay engine, prove the state machine, and stop before the final skin.** — Phase 04 engine is functional, isolated, testable, and ready for Phase 05 visual polish. U1/U2 remain deployment gates until staging/production evidence exists.

---

## Appendix A — Files Changed Evidence (detailed)

| File | Action | Evidence |
|------|--------|----------|
| `millionaire/MillionaireGame.js` | Created 540 lines | `STATES` 12, `ALLOWED_TRANSITIONS` 12, `PRIZE_LADDER` reuse, `resolveQuestionSource`, `timerRef`, `hiddenOptions`, `askClass/askFriend`, `walkAway`, `finishedGuardRef`, `onFinish` |
| `index.html` | Modified additive +35 lines | `script MillionaireQuestions/Data/Game ?v=17`, `APP_VERSION v17`, `appData.millionaireQuestions`, `window.__SIPANDA_MILLIONAIRE_PROD__`, `finishGame` millionaire branch with `virtualRupiah/safeRupiah/extra`, dispatcher `type==="millionaire"` |
| `millionaire/MillionaireQuestions.js` | Unchanged | 15 fallback rows |
| `millionaire/MillionaireData.js` | Unchanged | 230 lines helpers |
| `code.gs` / `code_v2.gs` | Unchanged in Phase 04 | Phase 03 helpers remain, no new change |
| `games/*.js` | Unchanged | 0 `MILLIONAIRE` hits |
| `admin.html` | Unchanged | 0 `Millionaire` hits |

## Appendix B — Decision Matrix (Phase 04 actual)

| Area | Current State | Decision | Evidence | Risk |
|------|---------------|----------|----------|------|
| Game engine | Absent → created | `MillionaireGame.js` isolated React component | `millionaire/MillionaireGame.js:1` | LOW |
| FSM | Absent → 12 states | `INTRO..FINISHED` with `ALLOWED_TRANSITIONS` guard | `MillionaireGame.js:14-33` | LOW |
| Timer | Not defined → 30s runtime | `M.TIMER_SECONDS||30`, `setInterval` only `QUESTION/SELECTING`, cleanup | `MillionaireGame.js:37,135` | LOW (unresolved canonical value) |
| Lifelines | Not defined → 3 once each | `fiftyFifty` hidden 2, `askClass` 55-75%, `askFriend` 70%, only before `LOCKED` | `MillionaireGame.js:235-283` | LOW |
| Prize/safe | Phase 03 → reuse | `M.PRIZE_LADDER` `M.SAFE_LEVELS`, `prizeForLevel`, `calcSafeRupiah` | `MillionaireGame.js:8-10,98-107` | LOW |
| Score | Phase 03 → reuse | `M.scoreForLevel` 0-100 | `MillionaireGame.js:417` | LOW |
| Result | Not defined → 15-field payload | `virtualRupiah/safeRupiah/extra` + `String(level)` + `finishedGuardRef` | `MillionaireGame.js:404-450` | LOW |
| Dispatcher | 17 + fallback → 18 + fallback | `type==="millionaire"` before fallback, `?v=17` scripts | `index.html:688` | LOW |
| Backend | U1 BLOCKED | No change, both patched in Phase 03 | `BACKEND_CANONICAL.md` | **HIGH (U1)** |
| Persistence | U2 BLOCKED | 11-col still, payload forward-compat | `code.gs:3` | **HIGH (U2)** |

## Appendix C — Conflict Check (Phase 00–03 vs Phase 04)

No conflict found. All Phase 04 implementations strictly reuse Phase 03 contracts:

- Question schema 12 cols → not redefined
- `PRIZE_LADDER` 15 → reused with `||` guard, not redefined
- Answer 0–3 → reused
- Fallback → `resolveQuestionSource` entire source, not mixed
- `type==="millionaire"` canonical → not `millionaireGame`
- No `Games.pairs`/`Soal` use → verified 0 hits

If Phase 05 finds conflict (e.g., ladder value mismatch), it must file **CONFLICT + EVIDENCE + IMPACT + RECOMMENDED RESOLUTION** per `PHASE_04 §59` and STOP dependent visual work.

---

## Contradiction Check

No evidence contradicts Phase 00/01/02/03 audits. Previous inventories (20 `games/` files, 4 PNGs) still accurate; new file count is `+1` (`MillionaireGame.js`). Previous `APP_VERSION v16` correctly bumped to `v17` with new scripts. U1/U2 statuses preserved as BLOCKED, not falsely resolved. Previous `GAME_TYPES` 17 still holds.

*— End of PHASE 04 GAME ENGINE AUDIT —*
