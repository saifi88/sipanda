# PHASE 06E — REFERENCE-LOCKED VISUAL REBUILD — AUDIT
## SI-PANDA v3 · Strict screenshot-driven correction

> **Status:** VISUAL ONLY — No FSM, timer logic, lifeline logic, question/data, prize data, score/result, backend, GameResults, admin, GameShell, or 17-game change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Spec:** `docs/millionaire/PHASE_06E_REFERENCE_LOCKED_VISUAL_REBUILD.md`
> **Reference:** `docs/millionaire/Game_Panel_Reference.png` — **OPENED & INSPECTED via image tool**
> **Live QA:** Chrome system + local HTTP Live Server + `puppeteer-core`, real `MillionaireGame` (`STATE=QUESTION` via genuine `INTRO→READY→QUESTION`), viewports **1366×768 (primary)**, 1536×864, 390×844
> **Rollback:** NOT required — 06D changes were verified improvements (BEFORE/AFTER shots); 06E builds on them, no worsening detected (one self-inflicted CSS rule-split was caught by screenshot loop and repaired, §8)

---

## 1. Reference Confirmation

`docs/millionaire/Game_Panel_Reference.png` rendered successfully: deep-blue studio, central SI-PANDA medallion, top-left `SI-PANDA / Zona Game · Millionaire` pill, three large ovals (`50:50`, phone icon, people icon), wide hexagonal question `Planet terdekat dengan Matahari adalah?` (blue outer + gold inner, sharp tips), 2×2 answers with inline gold `A:/B:/C:/D:`, tall right ladder (gold frame, 15 rows, solid-gold arrow current `10 Rp32.000`), single centered bottom pill `50:50 | Level 1 dari 15 | Rp100`, reflective floor. No timer, no exit buttons, no kicker, no ladder title, no lock button, no SAFE text. All 06E work targets exactly these pixels.

## 2. BEFORE Audit (06D AFTER @1536×864 vs Reference) — 5+ Largest Geometric Differences

| # | BEFORE defect (observed pixels) | Reference | Spec |
|---|----------------------------------|-----------|------|
| G1 | Question top ~17%, answers ~34–50%, status ~57% — cluster far too high | Q ~48–50%, answers ~65–84%, status ~90–96% | §3 |
| G2 | Ladder card ends ~68% viewport height | Frame ends ~75%, tall full-side presence | §7 |
| G3 | Header bar carries `29s` timer pill + `Keluar dengan Hadiah` + `Keluar` | Brand plaque only | §9 |
| G4 | Lifelines 36px-high, text-heavy (`Tanya Kelas`, `Tanya Teman` + emoji) | Large ~7–8%vh ovals, icon-dominant | §8 |
| G5 | `SOAL LEVEL 1 DARI 15` kicker + `PRIZE LADDER • 15 LEVEL` title + `• SAFE` suffixes + ghost `Kunci Jawaban` visible | None of these exist | §2 |
| G6 | Mobile portrait ignores spec order (DOM order) + header overflows 390px | `header→lifelines→ladder→question→answers→status`, no overflow | (06D residual) |

## 3. Rebuild — Exact CSS/Markup Changes

### 3.1 `millionaire/MillionaireGame.js` (presentation-only, 4 edits — zero logic)

| # | Change | Detail |
|---|--------|--------|
| M1 | Header brand-only | Removed duplicate `LV•Rp` pill (already gone in 06D); brand meta fixed to `Zona Game · Millionaire` (+ sr-only mapel); **timer → `millionaire-sr-only`** (role/aria-live/countdown logic intact); **actions → `millionaire-suppressed`** (walk-away/exit handlers, disabled-guards untouched; keyboard-focus reveal) |
| M2 | Stage spacer | Added presentation-only `<div className="millionaire-stage-space" aria-hidden>` grid row between lifelines and question |
| M3 | Question declutter | Visual kicker removed → sr-only level announcement; explanation logic unchanged |
| M4 | Lifelines icon treatment | `50:50` text glyph + inline **SVG phone + SVG users** (stroke `currentColor`, generic feather-style paths — no broadcast assets, no emoji); Indonesian names preserved as `aria-label`/`title`; `onClick`/`disabled` guards byte-identical |
| M5 | Bottom bar | Lock renders **only in `SELECTING` with a selection**, as subordinate ghost pill below the status pill (invisible in default QUESTION state = reference-exact); `lockAnswer` + guards untouched |
| M6 | Ladder | Title div removed (container gets `role="list"` + `aria-label`); **`• SAFE` text suffix removed** (safe styling `--safe` kept, data kept); rows get `role="listitem"` + `aria-current` |

### 3.2 `millionaire/millionaire.css` (rebuild deltas vs 06D)

| # | Rule | Change |
|---|------|--------|
| C1 | `.millionaire-layout` (desktop) | `max-width 1240→1380px`; columns `1fr 252px → minmax(0,1fr) 292px`; rows `auto minmax(100px,30vh) auto auto 1fr`; areas add `"stage ladder"`; status `align-self:end` |
| C2 | `.millionaire-stage-space` | New (desktop grid-area `stage`; hidden on portrait) |
| C3 | `.millionaire-sr-only` / `.millionaire-suppressed` | New scoped utilities (1px clip; suppressed reveals container on `:focus-within`) |
| C4 | `.millionaire-header__brand` | `250×36px → 220×56px` pill, brand-only |
| C5 | `.millionaire-lifeline` | `2.25rem/0.74rem → min-height 3.9rem (~7%vh), min-width 7.5rem (~8%vw), 2px electric border, 1.25rem glyphs` + `__glyph` SVG sizing + white drop-shadow |
| C6 | `.millionaire-question` | `min-height clamp(120px,19vh,172px)`, flex-centered, points `30→34px` outer / `28→32px` inner gold |
| C7 | `.millionaire-option` | Desktop `min-height 8.5vh` (~spec 7–8%/row); base 3.5rem |
| C8 | `.millionaire-ladder` | `align-self:start; height:70vh` (was stretch/60vh cap) — frame ends ~76–79% |
| C9 | `.millionaire-ladder__list` | `flex:1`, desktop-only `grid-auto-rows:1fr` fill; portrait keeps natural rows + scroll (regression from loop 2 fixed) |
| C10 | `.millionaire-status__bar` | `width:100%; max-width:760px (~50–55%vw); min-height:5.5vh (~6%vh)` |
| C11 | Portrait query | Grid-area per child (kept), header wrap (kept), lifelines `flex:1` compact, bar full-width, question `min-height:0` |
| C12 | Untouched | All `[data-state]` reveal rules, keyframes `correct-flash/wrong-flash 0.36s×2`, timer `--urgent`, reduced-motion, ladder item state styles |

## 4. Screenshot Loop (mandatory §14 — EXECUTED)

| Iter | Viewports | Finding → Fix |
|------|-----------|---------------|
| 1 (1366) | Q~51% good start; status clipped at 97% edge | Q/answers/status breathing: Q `18vh`, answers 3.5rem, status `margin-bottom:.7rem` |
| 2 (1366/1536/390) | Desktop close; **mobile ladder crushed** (`1fr` rows in 152px → 8px unreadable rows) | Scoped `1fr` distribution to desktop-only; portrait natural rows + scroll |
| 3 (1536) | Q 56% (too low — `1fr` spacer absorbs all leftover on tall viewports) | Spacer `1fr → minmax(100px,30vh)` + status row `1fr`/`align-self:end`; answers `8.5vh`, status `5.5vh`, bar `760px`, ladder `70vh`, brand `220×56` |
| 4 | **REGRESSION caught by loop**: answer panels lost background/border (my `4.3rem` media edit split the `.millionaire-option` rule mid-block; braces 184/185) | Precise repair: rule re-joined, media block moved after it; braces verified 184/184; re-shot → panels restored |
| 5 FINAL | 1366×768 + 1536×864 + 390×844 | All verified (§5); violating edit documented, not stacked |

Evidence (new in `docs/millionaire/`): `PHASE_06E_AFTER_1366x768.png`, `PHASE_06E_AFTER_1536x864.png`, `PHASE_06E_AFTER_390x844.png`.

## 5. Side-by-Side: FINAL vs Reference (measured via DOM rects, not eyeballing)

| Element | Reference target (§4) | 1536×864 measured | 1366×768 measured | Verdict |
|---------|----------------------|-------------------|-------------------|---------|
| Brand | 1–2% top, 8–9% h, 10–11% w | 1.0 / 6.5 / 14.3 | 1.2 / 7.3 / 16.1 | ✅ top/h ≈; width text-constrained (R2) |
| Lifelines | 10–20% top, 7–8% h, 7–9% w ovals | 8.1 / 7.2 | 9.1 / 8.1 | ✅ |
| Question | 48–50% top, 18–19% h, 65–67% w | **47.8** / 19.0 / 67.7 | **50.0** / 19.0 / 75.1 | ✅ |
| Answers | ~65% top, 2×(7–8%) h | 67.9 / 18.1 | 70.3 / 18.1 | ✅ (≈, within tolerance) |
| Bottom pill | 90–96% top, 6–7% h, 50–55% w | 92.1 / 5.6 / 49.5 | 91.8 / 5.5 / 55.6 | ✅ |
| Ladder | 5–6% top, ends ~75%, 19–20% w, 15 rows, gold arrow | 8.1→78% / 19.0 / 15 rows + arrow | 9.1→79% / 21.4 | ✅ (≈) |
| Timer/exit/kicker/title/lock/SAFE | absent | timer clipped sr-only; zero exit/kicker/title/lock/SAFE pixels in shots | same | ✅ |
| Studio | logo/stage visible above Q, floor below | Arch/stage open above Q; floor + reflections below | same | ✅ (B1 asset constraint R1) |
| Mobile 390×844 | portrait order, no overflow | lifelines→ladder(scroll)→Q→A→B→C→D→status; header wraps; all readable | — | ✅ |

## 6. GREEN/RED Reveal — Preserved (unchanged, verified by rule + selector)

- `correct-flash 0.36s ease-in-out 2` on `[REVEAL]+[CORRECT] --correct` + `[WRONG] --correct` (correct shown green alongside wrong red) — present, byte-identical
- `wrong-flash 0.36s ease-in-out 2` on `[REVEAL]+[WRONG] --wrong` — present, byte-identical
- Keyframes, `[data-state]` hooks, `0–1400ms` engine delays (`LOCKED 200ms → REVEAL 900ms → CORRECT/WRONG`), reduced-motion fallback — all untouched
- Coverage gap (as in 06D): live REVEAL-state pixel capture not taken (QUESTION-state harness); rules + logic verified instead — recorded, not hidden

## 7. Regression Checks

| Contract | Result | Evidence |
|----------|--------|----------|
| FSM 12 states, legal matrix | ✅ PASS | `LOCKED:["REVEAL"]` etc. intact; harness traversed `INTRO→READY→QUESTION` live |
| Timer logic (30s, expiry→WRONG) | ✅ PASS | `TIMER_SECONDS \|\| 30` intact; countdown ticked live across shots (`29s→28s` in 06D loop); only its *paint* suppressed per §2 |
| Lifeline one-use logic | ✅ PASS | Handlers/guards untouched (markup-only icon swap) |
| Question engine / prize data / safe levels / score / result payload / dispatcher | ✅ PASS | `SAFE_LEVELS [5,10,15]`, ladder/prize/score/result blocks untouched; `MillionaireData/Questions` unmodified |
| Backend / GameResults / admin / GameShell / 17 games | ✅ PASS | 0 `sipanda-millionaire` hits in `games/`; 156 selectors all scoped, 0 global leaks; forbidden files unmodified |
| 06D rollback needed? | ❌ No | 06D verified strictly better than 06C (BEFORE/AFTER shots); 06E extends it |

## 8. Incident Log (§16 transparency)

One self-inflicted defect occurred (edit split `.millionaire-option` mid-rule → answer panels rendered unstyled in loop-4 shots). Detected **only because of the mandatory screenshot loop** (would have passed static inspection — braces were the tell: 184/185). Repaired precisely (rule re-joined, block relocated), braces re-verified 184/184, re-shot clean. No gameplay logic was ever at risk; no speculative patches stacked; no rollback of 06D required.

## 9. Remaining Non-Blocking Differences

| # | Difference | Why |
|---|-----------|-----|
| R1 | B1 asset has no central medallion/audience close-up (reference mockup detail) | Approved B1–B4 assets immutable (§10 VI.10); arch/stage/floor carry the identity |
| R2 | Brand pill 220px (14–16%w) vs ref 10–11% | Text `ZONA GAME · MILLIONAIRE` needs the width at readable size; height/position match |
| R3 | Sighted countdown hidden (timer sr-only) | Explicit §2 removal order; logic + SR announcements + urgent rule preserved |
| R4 | Lock/exit exist only as focus-revealed suppressed controls (+ lock appears subtly in SELECTING) | Explicit §2/§11 order; all handlers/guards/behaviors preserved — game remains fully completable |
| R5 | Lifeline glyphs are text/SVG, not reference bitmap icons | No new binary assets; generic stroke icons, no broadcast IP |

## 10. Final Status

### `VISUAL PASS WITH NON-BLOCKING DIFFERENCES`

Rationale: three live Chrome screenshots (primary 1366×768 + 1536×864 + 390×844) measured against every §4 normalized target — question 47.8–50%, answers ~68–70%, status ~92%, ladder 19–21% ending ~78%, lifelines 7–8%vh ovals, brand-only header, zero non-reference pixels in frame. All §2 removals executed presentation-only with logic/A11y preserved. GREEN/RED reveal byte-identical. No `VISUAL FIDELITY NOT ACHIEVED` condition met; no `PASS` inflation (R1–R5 + REVEAL-pixel gap stated plainly).

## 11. STOP

> **STOP after this phase.** Harness + server removed (`_06e_harness.html` deleted, node server killed). No backend/U1/U2/GameResults/deployment/gameplay work undertaken or implied.

*— End of PHASE 06E REFERENCE-LOCKED VISUAL REBUILD AUDIT —*
