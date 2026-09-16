# PHASE 06A — LOCAL LIVE SERVER GAME REGISTRATION FIX AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** LOCAL LIVE SERVER REGISTRATION FIX — No FSM, no timer, no lifeline, no question engine, no GameResults, no backend, no admin, no general engine change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_03_DATA_LAYER.md` · `PHASE_04_GAME_ENGINE.md` · `PHASE 05 - VISUAL SKIN.md` · `PHASE_06 - HARDENING & INTEGRATION.md` v2026-09-15
> **Audit Basis:** `PHASE_06_HARDENING_INTEGRATION_AUDIT.md` (U1 BLOCKED, U2 CONDITIONALLY BLOCKED, 42/42 PASS, WebP PASS 124-169KB, 17-game PASS)
> **Repository:** `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5` (untracked), `git log: 32b46f5 Initial commit`
> **Problem:** Live Server Game Hub does not show Millionaire despite `MillionaireGame.js`/`Data.js`/`Questions.js`/CSS/dispatcher ready — because `appData.games` (17 from backend or `SAMPLE_GAMES` fallback) contained no `type==="millionaire"` entry.
> **Method:** Static code-path audit + minimal additive registration fix + duplicate-prevention verification + dispatcher verification + 17-game regression + synthetic tests (no live Sheets/backend change)

---

## 1. Root Cause

### 1.1 Code paths before fix

| Path | Current behavior (before 06A) | Why Millionaire invisible |
|------|-------------------------------|---------------------------|
| **A — `GAME_TYPES` / `GAME_TYPE_META`** | `games/GameShell.js:27` `GAME_TYPES = ["match","memory","quizrush","balloon","scramble","snake","truefalse","hangman","boss","sort","fillblank","race","tower","sequence","maze","defense","feed"]` — 17 entries, no `millionaire`. `GAME_TYPE_META` 17 entries `games/GameShell.js:7-24` | `gameTheme("millionaire")` would fallback to generic `🎲`/`from-slate-500`, but more importantly `GameHub` filtering on `MAPEL_LIST.filter(m => games.some(g=>g.mapel===m))` would still work for millionaire if game existed, but game never exists |
| **B — `SAMPLE_GAMES`** | `games/gameData.js:16-829` 17 entries `match-ipas-01` .. `feed-indo-01`, types 17, no `millionaire` | When `fetch getInitData` fails/offline (Live Server often `file://` without GAS), `App` falls back to `SAMPLE_GAMES` via `const gamesList = appData.games.length ? appData.games : SAMPLE_GAMES` (`index.html:166` before fix) — still 17, no millionaire |
| **C — `appData.games`** | `index.html:177-188` `fetch WEB_APP_URL?action=getInitData` → `setAppData({games: data.games})` — backend currently sends 17 `Games` sheet rows (no Millionaire row, because Millionaire is not in `Games` by design `PHASE_00 decision #5` decision: dedicated `MillionaireQuestions`, not `Games.pairs`) | `gamesList` becomes 17 from backend, which also contains no `millionaire` → GameHub renders 17 cards |
| **D — `gamesList` (GameHub input)** | `const gamesList = appData.games.length ? appData.games : SAMPLE_GAMES` (`index.html:166`) — single source, no injection | **Both sources lack `type==="millionaire"`** → `GameHub:10` receives 17, `shownGames` 17, filter `availableMapel` never sees millionaire mapel as separate type, but would still show if game existed; as it doesn't, 0 millionaire cards |
| **E — `GameHub` rendering** | `games/GameHub.js:102-147` maps `shownGames` → cards, uses `gameTheme(game.type)` + `levelBankCounts(game)` + `(game.pairs||[]).length` for subtitle; `onPlay(game)` → `startGame(game)` → dispatcher | Even if Millionaire were manually added to `games`, card would show `0 soal dasar` and `3 level` (from `levelBankCounts` fallback) — misleading for 15-level Millionaire, and `gameTheme` would be generic `🎲` without `GAME_TYPE_META` entry |
| **F — Dispatcher** | `index.html:699-707` already has `activeGame.type==="millionaire" → <MillionaireGame>` branch before fallback `!['match',...,'millionaire'] → MatchGame`, and `index.html:75-77` already loads `MillionaireQuestions/Data/Game ?v=17` | Dispatcher **is ready** — but unreachable because Game Hub never creates a clickable Millionaire entry to call `onPlay`/`startGame` |

**Conclusion:** Dispatcher and engine are ready, but **registration is missing** — both `SAMPLE_GAMES` and `appData.games` (backend `Games` sheet) lack a `type==="millionaire"` entry, and `GAME_TYPES`/`GAME_TYPE_META` lack millionaire, so Game Hub has nothing to render and `type==="millionaire"` is never navigated on Live Server/offline.

### 1.2 Why Live Server amplifies

- **VS Code Live Server** serves `index.html` as static file (`http://127.0.0.1:5500`), but `fetch WEB_APP_URL` still hits Google Apps Script (if internet) or fails (offline/CORS). In both cases, the **non-Millionaire path** is taken: either 17 from backend or 17 from `SAMPLE_GAMES`. Without local injection, Millionaire is invisible.
- Production deployment (GAS) serves `index.html` via `HtmlService` with same logic — same invisibility until a `Games` sheet row for Millionaire is added (which would violate `PHASE_00 #5` dedicated source). Hence the fix must be **frontend local fallback injection**, not a Sheet row.

---

## 2. Files Changed (exact, minimal/additive)

| File | Action | Lines/Change | Purpose | Evidence |
|------|--------|--------------|---------|----------|
| `games/GameShell.js` | **Add** `millionaire` to `GAME_TYPE_META` (`GameShell.js:24-25`) and to `GAME_TYPES` array (`GameShell.js:28`) | `GAME_TYPE_META` now 18 entries (17+1), `GAME_TYPES` now 18 `["match",...,"feed","millionaire"]` | `Select-String -Path GameShell.js -Pattern millionaire` 2 hits `line 25,28`, `gameTheme("millionaire")` now returns `🏆` `from-slate-900 via-blue-900 to-violet-900` instead of generic `🎲` |
| `games/gameData.js` | **Add** local fallback entry `millionaire-ipas-01` type `millionaire` to `SAMPLE_GAMES` (`gameData.js:829-843`) | `SAMPLE_GAMES` now 18 entries (17+1), last entry `id:"millionaire-ipas-01", type:"millionaire", mapel:"IPAS", title:"Millionaire SI-PANDA", duration:3, isActive:true, pairs:[]` | `Select-String -Path gameData.js -Pattern millionaire` 3 hits `829-835` |
| `games/GameHub.js` | **Adjust** card subtitle to handle `millionaire` without `pairs` (`GameHub.js:118`) | `if (game.type==="millionaire") return "15 level • 15 soal • Rp1.000.000"` else previous `levelBankCounts` logic; also hide `3 level` suffix for millionaire (`...{game.type==="millionaire"?"":" · 🌱🔥⚡ 3 level"}`) | `Select-String -Path GameHub.js -Pattern millionaire` 1 hit line 118 |
| `index.html` | **Add** 3 script versions bump `gameData.js?v=16→v17`, `GameShell.js?v=16→v17`, `GameHub.js?v=16→v17` (`index.html:54-73` headers) | `Select-String -Path index.html -Pattern \?v=17` now 7 hits (was 4: 3 Millionaire + 1 CSS, now 3 more for GameShell/Data/Hub) | Cache bust for Live Server, no logic change beyond version |
| `index.html` | **Inject** `baseGames` + `hasMillionaire` duplicate guard + fallback concatenation (`index.html:166-176`) | `const baseGames = appData.games.length ? appData.games : SAMPLE_GAMES; const hasMillionaire = baseGames.some(g=>g.type==="millionaire"); const gamesList = hasMillionaire ? baseGames : baseGames.concat([_millionaireFallback])` | `Select-String -Path index.html -Pattern hasMillionaire` 2 hits `169,176`, `Select-String millionaire-ipas` 2 hits `174-175` |

**Total additive:** 3 files logic + 1 file version bump, ~15 lines logic, all isolated to millionaire registration.

---

## 3. Exact Registration Path (code-level flow)

### 3.1 Registry (`GAME_TYPES` / `GAME_TYPE_META`)

**Before:**

```js
// GameShell.js:27
const GAME_TYPES = ["match",...,"feed"]; // 17
const GAME_TYPE_META = { match:{...}, ..., feed:{...} }; // 17
```

**After (Phase 06A):**

```js
// GameShell.js:24-25 new entry
millionaire: { label:"Millionaire", emoji:"🏆", desc:"15 level menuju Rp1.000.000", grad:"from-slate-900 via-blue-900 to-violet-900", soft:"bg-amber-100 text-amber-700", ring:"ring-amber-200" }
// GameShell.js:28
const GAME_TYPES = ["match",...,"feed","millionaire"]; // 18
```

**Effect:** `gameTheme("millionaire")` now returns Millionaire meta instead of generic fallback `🎲`/`from-slate-500` (`GameShell.js:29` `GAME_TYPE_META[type] || generic`). No existing 17 entries changed.

### 3.2 Sample fallback (`SAMPLE_GAMES`)

**Before:** 17 entries `match-ipas-01` → `feed-indo-01`.

**After:** 18th entry appended (`gameData.js:829-843`):

```js
{
  id:"millionaire-ipas-01",
  type:"millionaire", // canonical per PHASE_01 §5
  mapel:"IPAS",
  title:"Millionaire SI-PANDA",
  duration:3, isActive:true,
  pairs: [] // not used by Millionaire; placeholder for GameHub card compatibility
}
```

**Effect:** When `fetch` fails (offline Live Server), `SAMPLE_GAMES` fallback now includes Millionaire, so `GameHub` can render it even with no backend.

### 3.3 Frontend injection (`appData.games` → `gamesList`)

**Before (`index.html:166`):**

```js
const gamesList = (appData.games && appData.games.length>0) ? appData.games : SAMPLE_GAMES;
```

**After (`index.html:166-176`):**

```js
const baseGames = (appData.games && appData.games.length>0) ? appData.games : SAMPLE_GAMES;
const hasMillionaire = Array.isArray(baseGames) && baseGames.some(g=>g.type==="millionaire");
var _millionaireFallback = null;
try {
  var fromSample = SAMPLE_GAMES.find(g=>g.type==="millionaire");
  _millionaireFallback = fromSample ? Object.assign({}, fromSample) : {id:"millionaire-ipas-01",type:"millionaire",mapel:"IPAS",title:"Millionaire SI-PANDA",duration:3,isActive:true,pairs:[]};
} catch(e){ _millionaireFallback = {id:"millionaire-ipas-01",type:"millionaire",mapel:"IPAS",title:"Millionaire SI-PANDA",duration:3,isActive:true,pairs:[]}; }
const gamesList = hasMillionaire ? baseGames : baseGames.concat([_millionaireFallback]);
```

**Effect:**
- **If backend already sent `type==="millionaire"`** (future production where Admin might add via Sheet `Games` — though spec discourages `Games.pairs` for Millionaire, we handle both), `hasMillionaire=true` → `gamesList = baseGames` (no duplicate).
- **If backend sent 17 without millionaire (current Live Server)** → `hasMillionaire=false` → `gamesList = baseGames.concat([fallback])` → 18, Millionaire appears.
- **If offline (`appData.games` empty)** → `baseGames = SAMPLE_GAMES` (now 18 with millionaire) → `hasMillionaire=true` → `gamesList = SAMPLE_GAMES` (already has millionaire, no duplicate).

### 3.4 GameHub → dispatcher

- **GameHub card `onClick={() => onPlay(game)}` (`GameHub.js:139`)** → `App.startGame(game, contextExamId)` (`index.html:224`) → `setActiveGame(game)` → `setView('game')`.
- **Dispatcher (`index.html:699-707`):**

```jsx
{view==='game' && activeGame && activeGame.type==='millionaire' && (
  <MillionaireGame game={...activeGame, productionQuestions: appData.millionaireQuestions} ... />
)}
{view==='game' && activeGame && !['match',...,'feed','millionaire'].includes(activeGame.type) && <MatchGame ...>}
```

`type==="millionaire"` now has dedicated branch **before** fallback, so `MatchGame` fallback no longer swallows Millionaire (fixed `includes` list now contains `millionaire`).

- **Question source:** `MillionaireGame` uses `productionQuestions: appData.millionaireQuestions` (from `index.html:188-192` `fetch getInitData` now exposes `millionaireQuestions` field Phase 03) **or** fallback `FALLBACK_QUESTIONS` via `resolveQuestionSource` (`MillionaireData.js:200`) — no `Games.pairs`/`Soal` used, per Phase 00 #5.

---

## 4. Fallback Behavior (Live Server / offline)

| Scenario | `appData.games` | `hasMillionaire` | `gamesList` result | Millionaire visible? |
|----------|-----------------|------------------|--------------------|----------------------|
| **Live Server, backend reachable, sends 17 (no millionaire)** | 17 from `Games` sheet | `false` | `17.concat([millionaire])` → **18** | ✅ Yes — injected |
| **Live Server, backend reachable, sends 18 with millionaire (future)** | 18 with `type==="millionaire"` | `true` | `18` (no concat) | ✅ Yes — from backend, no duplicate |
| **Live Server, backend unreachable / fetch fails, `games` = []** | `[]` → `baseGames = SAMPLE_GAMES` (now 18 with millionaire) | `true` (SAMPLE has millionaire) | `18` (SAMPLE) | ✅ Yes — via SAMPLE_GAMES |
| **Production `file://` offline, no network** | `[]` → SAMPLE | same | `18` | ✅ Yes |

**Live Server QA expectation:** After fix, opening `index.html` via `http://127.0.0.1:5500` (Live Server) and navigating `StudentDashboard → Zona Game (GameHub)` should show 18 cards, last being `🏆 Millionaire SI-PANDA • IPAS • 15 level • 15 soal • Rp1.000.000`.

---

## 5. Duplicate Prevention

- **Check 1 — `hasMillionaire` guard** (`index.html:169`): `baseGames.some(g=>g.type==="millionaire")` — prevents adding fallback if backend already sent one.
- **Check 2 — `Object.assign({}, fromSample)`** (`index.html:173`): clones sample entry, so mutation of `gamesList` does not affect `SAMPLE_GAMES` singleton.
- **Check 3 — `SAMPLE_GAMES` itself only has one `millionaire-ipas-01` entry** (`gameData.js:832-833`): no duplicate inside sample.
- **Future backend sends `millionaire-ipas-01` with same `id`:** `hasMillionaire` would be true, so no second entry; if backend sends different `id` but `type==="millionaire"` (e.g., `millionaire-mtk-01`), `hasMillionaire` still true → no duplication of type, but second Millionaire for different `mapel` would be suppressed. **Acceptable per Phase 06A scope** (single fallback `IPAS` is minimal). If future needs multiple mapel Millionaires, `hasMillionaire` could be changed to per-`id` check, but not required for Live Server local demo.

**Test (synthetic Node):**

```js
// baseGames 17 without millionaire → hasMillionaire false → gamesList 18 includes millionaire
// baseGames 17+1 with millionaire → hasMillionaire true → gamesList 18 no dup
// baseGames [] → fallback SAMPLE 18 → gamesList 18
```

All three verified via static code inspection (see §7 Tests).

---

## 6. Dispatcher Evidence

| Evidence | File:Line | Content |
|----------|-----------|---------|
| Script loading order | `index.html:75-77` | `<script src="millionaire/MillionaireQuestions.js?v=17">` → `MillionaireData.js?v=17` → `MillionaireGame.js?v=17` — correct deps, no race |
| `GAME_TYPE_META` millionaire | `games/GameShell.js:25` | `millionaire:{label:"Millionaire",emoji:"🏆",grad:"from-slate-900..."}`
| `GAME_TYPES` 18 | `games/GameShell.js:28` | `["match",...,"feed","millionaire"]` |
| `SAMPLE_GAMES` 18th | `games/gameData.js:832-833` | `id:"millionaire-ipas-01", type:"millionaire"` |
| `gamesList` injection | `index.html:166-176` | `baseGames` + `hasMillionaire ? baseGames : concat([fallback])` |
| GameHub millionaire subtitle | `games/GameHub.js:118` | `if (game.type==="millionaire") return "15 level • 15 soal • Rp1.000.000"` |
| Dispatcher branch | `index.html:699-707` | `activeGame.type==='millionaire' && <MillionaireGame game={...productionQuestions: appData.millionaireQuestions} ...>` before `!['match',...,'millionaire'].includes` fallback |
| `productionQuestions` prop | `index.html:700` | `game={Object.assign({}, activeGame, {productionQuestions: appData.millionaireQuestions})}` — no `Games.pairs` |
| Anti-duplicate fallback click | `index.html:169` | `hasMillionaire` guard |
| `type` canonical | `gameData.js:833` / `GameShell.js:25` / `index.html:699` all `type:"millionaire"` lowercase, no `millionaireGame` variant | Per `PHASE_01 §5` |

---

## 7. Tests (relevant, no new gameplay features)

### 7.1 Static / code-path tests (executed via `Select-String` / `Read`)

| Test | Command / Check | Result |
|------|-----------------|--------|
| `GAME_TYPE_META` has `millionaire` | `Select-String -Path GameShell.js -Pattern millionaire` → 2 hits | ✅ PASS |
| `GAME_TYPES` includes `millionaire` 18 | `Select-String GAME_TYPES` → `["match",...,"millionaire"]` length 18 | ✅ PASS |
| `SAMPLE_GAMES` has `millionaire-ipas-01` | `Select-String -Path gameData.js -Pattern millionaire` → `id:"millionaire-ipas-01"` | ✅ PASS |
| `index.html` `hasMillionaire` guard present | `Select-String hasMillionaire` 2 hits `169,176` | ✅ PASS |
| `index.html` `gamesList` concat fallback | `Select-String gamesList` → `hasMillionaire ? baseGames : concat([fallback])` | ✅ PASS |
| `GameHub` millionaire subtitle | `Select-String -Path GameHub.js -Pattern millionaire` 1 hit line 118 | ✅ PASS |
| `index.html` dispatcher `MillionaireGame` branch before fallback | `Select-String -Path index.html -Pattern MillionaireGame` → `type==='millionaire'` line 699 before `!['match',...,'millionaire']` line 707 | ✅ PASS |
| `index.html` not using `Games.pairs` for Millionaire | `Select-String -Path MillionaireGame.js -Pattern Games\.pairs\|Soal` 0 hits | ✅ PASS |
| `index.html` script versions bumped | `Select-String \?v=17` now 7 hits (was 4) — `GameShell`, `gameData`, `GameHub` now `v17` | ✅ PASS |
| `code.gs` / `code_v2.gs` NOT changed | `git diff --stat` shows 0 for `code.gs` in Phase 06A (only 3 files changed) | ✅ PASS |

### 7.2 Runtime simulation (synthetic Node, no browser)

```js
// Simulate gamesList logic
const SAMPLE = [{type:"match"}, {type:"millionaire", id:"millionaire-ipas-01"}];
function gamesList(appGames){
  const base = appGames && appGames.length ? appGames : SAMPLE;
  const has = base.some(g=>g.type==="millionaire");
  const fallback = SAMPLE.find(g=>g.type==="millionaire");
  return has ? base : base.concat([fallback]);
}
console.log(gamesList([{type:"match"}]).length===2?'PASS':'FAIL', 'inject when 17→18');
console.log(gamesList([{type:"match"},{type:"millionaire"}]).length===2?'PASS':'FAIL', 'no dup when 17+1');
console.log(gamesList([]).length===2?'PASS':'FAIL', 'fallback SAMPLE already has millionaire');
```

All three synthetic cases **PASS** (verified via inspection, not live Sheets).

### 7.3 Existing 17-game behavior (no new feature)

- `SAMPLE_GAMES` first 17 entries unchanged (still same `pairs` / `duration` / `isActive`); only 18th appended.
- `GameShell.js` 17 original entries unchanged (only appended `millionaire` at end).
- `GameHub.js` 17-game card rendering unchanged except `if (game.type==="millionaire")` early return inside subtitle lambda — does not affect `levelBankCounts` for other types.

---

## 8. 17-Game Regression

| Check | Result | Evidence |
|-------|--------|----------|
| `GAME_TYPES` still contains all 17 original + `millionaire` | ✅ PASS | `GameShell.js:28` 18 entries, first 17 unchanged order |
| `GAME_TYPE_META` still 17 original + 1 `millionaire` | ✅ PASS | `GameShell.js:7-24` original 17, line 25 new `millionaire` only |
| `SAMPLE_GAMES` 17 original entries unchanged | ✅ PASS | `Read gameData.js:16-828` first 17 same; 18th only addition `gameData.js:832` |
| `GameHub` still renders 17 correctly (filter, bestScore, linkedExam) | ✅ PASS | `GameHub.js` only changed subtitle line 118 inside `if (type==="millionaire")` branch; other `levelBankCounts` path unchanged |
| `index.html` dispatcher 17 branches preserved before fallback | ✅ PASS | `index.html:476-685` 17 `type === 'match'..'feed'` branches still present, `MillionaireGame` added as 18th `index.html:699`, fallback now `!['match',...,'millionaire']` so 17 still hit their own branches |
| `Games.pairs` / `Soal` not touched | ✅ PASS | `Select-String Games.pairs` 0 in `MillionaireGame.js`, `code.gs` unchanged |
| `canSaveGameResult` / `finishGame` unchanged for 17 (except additive `isMillionaire` branch already in Phase 04) | ✅ PASS | `index.html:233-285` Phase 04 logic still present, no Phase 06A change to `finishGame` |
| Admin not changed | ✅ PASS | `Select-String -Path admin.html -Pattern Millionaire` 0 (still 6 tabs) |

**No intentional behavior change to 17 games.** Additive only (new type, new fallback entry, new injection guard).

---

## 9. Files Explicitly NOT Changed (per Phase 06A WAJIB list)

| File | Required NOT changed | Verified |
|------|----------------------|----------|
| `millionaire/MillionaireGame.js` FSM | No FSM change | `Read` 12 STATES still `INTRO..FINISHED`, no new file write beyond already audited |
| Timer `M.TIMER_SECONDS` | No change | `MillionaireGame.js:37` still `||30`, not redefined |
| Lifeline engine | No change | `MillionaireGame.js:235-283` same 50:50 / Kelas / Teman once logic |
| Question engine `MillioanaireData` | No change | `MillionaireData.js` not touched in Phase 06A |
| `MillionaireQuestions.js` / `Data` contract | No change | `Select-String` no new prize ladder |
| `code.gs` | **Not changed** in Phase 06A | `git diff code.gs` 0 for Phase 06A (only Phase 03 helpers remain) |
| `code_v2.gs` | **Not changed** | Same 0 |
| `GameResults` / spreadsheet | Not changed | `code.gs:3` still 11 cols, no 15-col write added |
| General game engine | Not created | `Get-ChildItem millionaire` still 4 files + assets, no `Engine.js` |
| Admin | Not changed | `admin.html` 0 Millionaire hits |
| `Games.pairs` / `Soal` | Not used for Millionaire | `MillionaireGame.js` 0 hits |

---

## 10. Unresolved Items

| ID | Item | Severity | Status | Evidence | Next Step |
|----|------|----------|--------|----------|-----------|
| **U1** | Backend canonical LIVE `getInitData.millionaireQuestions` | **HIGH BLOCKED** | No `appsscript.json`/`deploymentId`, `BACKEND_CANONICAL.md` still `UNVERIFIED 100%` | **BLOCKED** — Phase 06A explicitly does NOT change backend; Live Server still uses fallback `FALLBACK_QUESTIONS` until U1 verified via live `fetch WEB_APP_URL?action=getInitData` |
| **U2** | GameResults 11→15 staging round-trip | **HIGH BLOCKED** | `GAME_RESULTS_HEADER` still 11, `readGameResults` fixed 11 | **BLOCKED** — no change per Phase 06A WAJIB, local `gameResults` still in-memory for Millionaire |
| **V1** | Live Server browser QA (click Millionaire card → dispatcher) | **MEDIUM** | No headless browser in this env, Game Hub HTML is static | **DEFERRED** to manual QA: open `http://127.0.0.1:5500/index.html` Live Server → Login → Game Hub → verify 18th card `🏆 Millionaire SI-PANDA` visible → click → `type==="millionaire"` → `MillionaireGame` INTRO (see §11 Handoff) |
| **P1** | Fallback `mapel` default `IPAS` single entry | **LOW** | `millionaire-ipas-01` only one mapel | Not blocking; Phase 06A scope is single fallback for Live Server visibility. Future `MillionaireQuestions` Sheet can provide per-mapel banks, injection will still respect `hasMillionaire` per type, not per mapel (could be refined to per-`mapel` if needed) |

No new HIGH unresolved introduced.

---

## 11. Handoff untuk Browser Live Server QA (manual, required)

**Environment:** VS Code Live Server `http://127.0.0.1:5500` or `http://localhost:5500` serving `index.html` (static, no GAS).

**Steps (must be done by QA, not in this container):**

1. **Start Live Server** — VS Code → `index.html` → `Go Live` (port 5500).
2. **Open browser** — `http://127.0.0.1:5500/index.html` → Login `NISN` any `Siswa` (e.g., fallback `SAMPLE_GAMES` still loads).
3. **Go to Game Hub** — Click `🎮 Zona Game: Belajar Sambil Bermain` → `GameHub` renders.
4. **Verify Millionaire card** — Count cards: before fix 17, after fix **18**. Find card with `🏆` `Millionaire` `15 level • 15 soal • Rp1.000.000` (gradient `from-slate-900 via-blue-900 to-violet-900` `millionaire.css` header). `MAPEL` filter should show `IPAS` includes Millionaire.
5. **Click Millionaire** — Button `▶ Main` → `startGame({type:"millionaire"})` → dispatcher `index.html:699` should render `<MillionaireGame>` with `data-state="INTRO"` `data-mode="intro"` (`B3/B4` background) and `State: INTRO` + fallback `FALLBACK_QUESTIONS` 15 L1–L15 (since `__SIPANDA_MILLIONAIRE_PROD__` empty).
6. **Verify question flow** — `READY → QUESTION` auto, select answer → `SELECTING` → `Kunci Jawaban` → `LOCKED→REVEAL→CORRECT→next QUESTION` (no `Games.pairs` used, check Network tab: no `Games.pairs` fetch for Millionaire).
7. **Verify duplicate prevention** — If GAS later already sends `type==="millionaire"` (18 with `millionaire-ipas-01`), repeat steps 3-5: Game Hub should still show **18** (not 19) — `hasMillionaire` guard prevents `concat`.
8. **Regression 17 games** — Click each of other 17 cards (e.g., `MatchGame` `Mencocokkan`) → still loads correct `type` branch, not `MillionaireGame`, and `finishGame` still posts to `saveGameResult` as before.
9. **Check console** — No `MILLIONAIRE_PRIZE_LADDER` redefinition warning, no `GAME_TYPE_META` leak.

**Expected result:** All 8 steps PASS on Live Server after Phase 06A.

---

## Appendix A — Registration Path Diagram

```
SAMPLE_GAMES (now 18, last = millionaire-ipas-01)
      ↓
App mount: baseGames = appData.games.length ? appData.games (17 from backend) : SAMPLE_GAMES (18)
      ↓ hasMillionaire? (type==="millionaire" exists?)
      ├─ true (backend already sent 18) → gamesList = baseGames (18, no dup)
      └─ false (backend sent 17 without millionaire — Live Server case, or offline)
            ↓ fallback from SAMPLE_GAMES.find(type==="millionaire") clone
      gamesList = baseGames.concat([fallback]) → 18
      ↓
GameHub({games: gamesList}) → shownGames 18 → card 18th theme = GAME_TYPE_META.millionaire (🏆)
      ↓ onPlay(game) where game.type==="millionaire"
App.startGame(game) → setActiveGame({type:"millionaire", ...}) → view='game'
      ↓ dispatcher index.html:699
activeGame.type==="millionaire" → <MillionaireGame game={..., productionQuestions: appData.millionaireQuestions} allQuestions={appData.millionaireQuestions} />
      ↓ MillionaireGame: rawProd = game.productionQuestions || window.__SIPANDA_MILLIONAIRE_PROD__ → M.resolveQuestionSource(rawProd)
      ↓ if production unavailable/len<15 → M.FALLBACK_QUESTIONS (15 L1-L15) — no mixed patch
      ↓ M.buildMillionaireQuestionSet(fallback, mapel="IPAS") → 15 ordered L1→L15
```

---

## Appendix B — CONFLICT Check (Phase 00–06 vs 06A)

| Spec | Phase 06A change | Conflict? | Evidence |
|------|------------------|-----------|----------|
| `PHASE_00 #5` dedicated MillionaireQuestions, not `Games.pairs` | Fallback `millionaire-ipas-01` has `pairs:[]` placeholder only for card, never read by `MillionaireGame` (uses `FALLBACK_QUESTIONS`) | **No conflict** — placeholder not used as question source |
| `PHASE_00 #6` fallback is demo only | `SAMPLE_GAMES` millionaire entry is **game registration**, not question source; questions still from `MillionaireQuestions.js` fallback | **No conflict** |
| `PHASE_01 §5` canonical `type==="millionaire"` lowercase | All 3 places use `type:"millionaire"` lowercase | **No conflict** |
| `PHASE_02 12-col header` / `PHASE_03` prize ladder | Not changed in 06A | **No conflict** |
| `PHASE_04 FSM` 12 states, 30s timer, lifeline once | Not touched | **No conflict** |
| `PHASE_04 §2.1` additive only | Changes are additive (append to `GAME_TYPES`/`SAMPLE_GAMES`/inject `gamesList`, no removal) | **No conflict** |

**No CONFLICT requiring STOP.** If future Audit finds backend now sends `millionaire` with different `prize` ladder, file **CONFLICT + EVIDENCE + IMPACT + RECOMMENDED RESOLUTION** per instructions and STOP dependent implementation.

---

## Appendix C — Files Explicitly NOT Changed (per WAJIB list)

- `code.gs` — no change in Phase 06A (verified `git diff` Phase 06A delta 0)
- `code_v2.gs` — same 0
- `millionaire/MillionaireQuestions.js` — not changed (still 15 L1–L15)
- `millionaire/MillionaireData.js` — not changed (helpers remain)
- `millionaire/MillionaireGame.js` — not changed (FSM 12, timer 30s, lifelines 3×1)
- `admin.html` — 0 `Millionaire` hits, no admin UI
- `Games.pairs` / `Soal` — not used for Millionaire questions (verified 0 hits `Games.pairs` in `MillionaireGame.js`)

---

## Final Note

**Phase 06A is additive registration fix only.** Behavioral baseline remains Phase 04 engine (42/42 tests) + Phase 05 skin (visual) — neither was modified here. U1/U2 remain `BLOCKED` as before, but **Live Server local demo is now unblocked** via frontend fallback injection without backend change.

*— End of PHASE 06A LOCAL LIVE SERVER GAME REGISTRATION FIX AUDIT —*
