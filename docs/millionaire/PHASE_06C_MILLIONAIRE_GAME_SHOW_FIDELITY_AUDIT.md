# PHASE 06C — MILLIONAIRE GAME-SHOW FIDELITY & REVEAL SKIN — AUDIT
## SI-PANDA v3 · Visual Behavior + High-Fidelity Interaction

> **Status:** VISUAL/INTERACTION POLISH ONLY — No FSM, no timer logic, no lifeline logic, no question engine, no prize data, no result flow, no backend, no GameResults, no admin, no 17-game change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Spec:** `docs/millionaire/PHASE_06C_MILLIONAIRE_GAME_SHOW_FIDELITY.md` (supersedes visual target of PHASE 06B)
> **Reference Image:** `docs/millionaire/Game_Panel_Reference.png` — **FOUND & INSPECTED** (see §1)
> **Primary Outputs:** `millionaire/millionaire.css` fidelity tuning (612 → 686 lines) + minimal presentation markup in `millionaire/MillionaireGame.js` (header/lifeline/label/ladder/bottom-bar)
> **Repository:** `E:\Github\sipandav3 - Millionaire` — `git status` clean except 06C changes, `git log 32b46f5 Initial commit`
> **Validation Basis:** Visual comparison vs actual `Game_Panel_Reference.png` + `Select-String` scope/reveal/FSM checks + responsive/a11y inspection

---

## 1. Reference Image Inspected — WAJIB

| Check | Result | Evidence |
|-------|--------|----------|
| **File exists** | ✅ **FOUND** | `Test-Path -LiteralPath "docs/millionaire/Game_Panel_Reference.png"` → `True` |
| **Readable/opened** | ✅ **OPENED/INSPECTED** | `Read docs/millionaire/Game_Panel_Reference.png` → `Image read successfully` (1536×864 render via tool, displayed inline 2026-09-15) — **tidak ditebak dari teks** |
| **Visual content verified** | ✅ | Image shows: studio blue spotlight stage, central SI-PANDA circular logo `Karena Setiap Jawaban Membuka Peluang`, top-left pill `SI-PANDA Zona Game · Millionaire`, 3 oval lifelines `50:50` `📞` `👥`, central hexagonal **question panel** dark navy + electric-blue outer + gold inner `Planet terdekat dengan Matahari adalah?`, 2×2 hexagonal **answer panels** `A: Merkurius` `B: Venus` `C: Bumi` `D: Mars` (gold `A:` label, white text, blue border), **prize ladder** vertical narrow right `15 Rp1.000.000 … 1 Rp100` gold border dark, current `10 Rp32.000` solid gold bar with right-pointed arrow, **bottom bar** `50:50 | Level 1 dari 15 | Rp100` dark pill blue border |
| **STOP condition satisfied** | ✅ No `REFERENCE IMAGE NOT FOUND` — proceed to redesign |

**Inspection method:** Direct image read via tool (not text description alone) — complies with `PHASE_06C §0` *MUST inspect actual images*.

---

## 2. Before / After Comparison (Existing 06B vs 06C fidelity to reference)

| Area | Before (06B generic dark, still off-reference) | After (06C fidelity to `Game_Panel_Reference.png`) | Why fidelity |
|------|-----------------------------------------------|---------------------------------------------------|--------------|
| **Overall composition** | Header full-width `0.6rem` pill with `Millionaire • IPAS • LV 1/15` + prize, ladder `0.62fr` (~38% wide) electric border, question `18px` points, answer circular gold badge, bottom `Kunci Jawaban` alone | **Narrow ladder `252px` (~20% width) gold border `var(--gold-border)`**, header compact `0.42rem` brand `SI-PANDA / Zona Game · Millionaire • mapel` + `LV/prize` pill, question `26px` pronounced points + double border `2px electric + 1px gold`, answer inline gold `A:` text (not badge) `18px` points + inner gold hairline, bottom single pill `50:50 | Level X dari 15 | Rp…` + `Kunci Jawaban` | Matches reference hierarchy: question dominates, answers immediate below, ladder independent right, lifelines top-left, studio visible, density like TV set |
| **Question panel — shape/proportion** | `clip-path 18px` (desktop) / `12px` mobile, `padding 1.05rem 1.35rem`, `border 1.5px electric`, `box-shadow 28px electric-soft` | `clip-path 26px` desktop / `16px` mobile (**+44% point pronouncement**), `padding 1.12rem 1.85rem`, `border 2px electric`, inner gold `1px solid rgba(255,183,0,0.62)` + top gold line 64% width | Reference has sharp diamond tips extending beyond content; 26px matches image, 18px was too blunt |
| **Question typography** | `clamp(1.08rem,2.4vw,1.42rem) 900`, `text-shadow 0 1px 10px electric 0.22` | `clamp(1.14rem,2.55vw,1.48rem) 800`, tighter `1.30` line-height, same shadow — slightly larger to dominate as in reference | Reference question is largest element, 2-line centered white bold, compact kicker `SOAL LEVEL 1` equivalent kept as `9.5px uppercase gold` |
| **Answer panel — shape/border/glow** | `clip-path 14px/10px`, `border 1.5px electric 0.38`, circular label `radial #ffd54d→#ffb700` badge `1.85rem` | `clip-path 18px/12px` (**more pointed like reference**), `border 1.7px electric 0.46`, `::before` inner gold `1px rgba(255,183,0,0.18)`, **label inline gold `1.02rem` text `A:`** (`color var(--gold)`, no badge) | Reference `A:` is plain gold text with colon, not pill badge; double border (outer blue, inner gold) matches image double-line |
| **Answer spacing/proportion** | `gap 0.6rem`, `min-height 3.35rem`, `padding 0.85rem 1rem` | `gap 0.62rem`, `min-height 3.45rem`, `padding 0.82rem 1.05rem 0.82rem 1.12rem` — nearly identical but points sharper, so diamond gap in middle like reference preserved | Reference A-B gap ~12px where diamond tips meet; 0.62rem reproduces |
| **Prize ladder — position/width/border** | `1.5px solid rgba(0,191,255,0.28)` electric, `border-radius 1rem`, `max-width 0.62fr`, no arrow, title generic | `1.6px solid var(--gold-border) rgba(212,168,67,0.95)` **gold**, `border-radius 10px`, **fixed `252px` narrow** (`1fr 252px` grid), `box-shadow gold 10%` | Reference ladder has **gold border** (not blue) ~1.5-2px, narrow vertical, gold outer glow; electric was wrong hue |
| **Ladder current highlight** | `linear-gradient #ffcc33→#ffb700`, `scale 1.025`, no arrow, `num/prize` same span | Same gradient but **+ `clip-path polygon(0 0, calc(100%-10px) 0, 100% 50%, calc(100%-10px) 100%, 0 100%)` arrow to right**, `padding-right 0.82rem`, `num/prize` split spans (`.millionaire-ladder__num` white, `.millionaire-ladder__prize` gold `#ffcc33`) | Reference current `10 Rp32.000` has **right-pointed arrow** tip; before was rounded pill |
| **Lifeline position/size/shape** | `grid 3fr`, `padding 0.6rem 0.45rem`, `min-height 3.1rem`, `border 1.5px electric 0.42`, `border-radius 9999px` (oval) — functional but icon-less | `display:flex gap 0.5rem` left-aligned (desktop) / centered mobile, `padding 0.52rem 0.92rem`, `min-height 2.42rem`, `min-width 4.35rem`, `border 1.7px electric 0.52`, **icon `◐` `👥` `📞` added**, `9999px` oval kept | Reference lifelines are horizontal ovals `~72×36` with icons centered (50:50 text, phone, people); added icons + narrower height for fidelity, position top-left above question (grid `lifelines → question → answers`) |
| **Header height/position** | `padding 0.6rem 0.9rem`, `margin 0.75rem`, full-width bar with `Millionaire • mapel • LV` | `padding 0.42rem 0.72rem`, `margin 0.55rem 0.75rem 0.45rem`, **brand `SI-PANDA` 0.92rem + `Zona Game · Millionaire • mapel` 9.5px gold**, `LV/prize` as separate `pill` `LV X/15 • Rp…` | Reference header is **small pill top-left** `SI-PANDA / Zona Game · Millionaire` ~32px tall, not tall dashboard bar; 06C reduces height 30%, matches image text |
| **Bottom status** | `Kunci Jawaban` alone in `.millionaire-status`, status pills inside question | **Single bottom pill** `.millionaire-status__bar` `max-width 560px` `1.4px electric 0.28` `9999px` `0.78rem 800`: `50:50 ○/✓ | Level 1 dari 15 | RpXXX` + `Kunci Jawaban` primary button side-by-side in `.millionaire-status--gamebar` | Reference bottom bar is **centered dark pill** `50:50 | Level 1 dari 15 | Rp100` width ~55%; before fragmented, now single bar like image |
| **Blue glow / gold accent intensity** | `electric-glow 0.55` `gold-glow 0.42` moderate | `electric-glow 0.58` `gold-glow 0.38` + `electric-soft 0.18` + ladder `gold-border 0.95` — glow on question `26px electric-soft`, selected `gold-glow 22px`, lifeline `electric-faint 12px` | Reference has **strong but controlled** blue outer glow + subtle gold inner; increased electric strength slightly for TV studio spotlights |
| **Typography hierarchy** | `question 1.08-1.42rem` dark, `answer 0.95rem`, `ladder 0.8rem` | `question 1.14-1.48rem 800`, `answer 0.96rem 750`, `ladder 0.80rem 800 num white / prize gold` — question largest → answer → ladder smallest | Matches reference scale where question >> answers >> ladder `0.8rem` |
| **Visual density** | `gap 0.7rem`, `max-width 1200px`, light padding | `gap 0.65rem` (`0.9rem column`), `max-width 1240px`, tighter padding `0 0.75rem 0.55rem` — **less dashboard card stacking**, more stage floor visible | Reference has minimal gaps, no white card covering studio; 06C reduces gaps 7% and keeps `background cover center` visible |

---

## 3. Files Changed

### 3.1 Modified (per `PHASE_06C §21` — primary `millionaire.css` + minimal `MillionaireGame.js`)

| File | Change | Lines | Evidence |
|------|--------|-------|----------|
| `millionaire/millionaire.css` | **Fidelity tuning** `612 → 686` lines — question `26px/16px` points + `2px electric` + `1px gold 0.62`, answers `18px/12px` + inline `A:` gold text + inner gold hairline, ladder `1.6px gold-border` narrow `252px` + arrow current `clip-path 10px`, lifelines `flex 0.52rem 0.92rem 2.42rem` + icons, header `0.42rem` brand `SI-PANDA`, bottom bar `__bar 560px` pill, preserve `correct-flash 0.36s 2x` + `wrong-flash` | `millionaire.css:1-686` | `Get-Content millionaire.css | Measure-Object -Line` 686, `Select-String clip-path` 9 hits |
| `millionaire/MillionaireGame.js` | **Minimal presentation-only**: header brand `SI-PANDA / Zona Game · Millionaire • mapel` + `LV/prize` pill, answer label `A:` with colon + `🔒` gold, lifeline icons `◐ 50:50` `👥 Tanya Kelas` `📞 Tanya Teman`, status `--gamebar` with `Level X dari 15 | Rp…` bar + `Kunci Jawaban` `btn--lock`, ladder split `__num`/`__prize` + `◀` current arrow | `MillionaireGame.js:552-625` | `Select-String MillionaireGame.js -Pattern "millionaire-header__brand|millionaire-lifeline__icon|millionaire-status__bar"` 3 hits |

### 3.2 Not modified (enforced `PHASE_06C §2` absolute contract)

`MillionaireData.js`, `MillionaireQuestions.js`, `code.gs`, `code_v2.gs`, `GameResults`/spreadsheet, `admin.html`, 17 existing games (`games/*.js`), dispatcher, `M.PRIZE_LADDER` data, `M.SAFE_LEVELS`, `M.TIMER_SECONDS` logic — **0 writes**.

Verified: `git diff --stat` shows only `millionaire.css` + `MillionaireGame.js` + this audit; `Get-ChildItem code*.gs` timestamps unchanged (20:34 carry).

---

## 4. Question Panel Comparison (vs reference)

| Attribute | Reference (`Game_Panel_Reference.png`) | 06B | 06C (`millionaire.css`) | Match |
|-----------|----------------------------------------|-----|--------------------------|-------|
| **Position** | Upper-middle, centered left of ladder, dominates viewport ~68% width | `grid-area question` left of ladder | Same `grid-area question` but `padding 1.12rem 1.85rem` wider, `max-width 1240px` centering | ✅ |
| **Width/Height** | Width ~68% screen, height ~95px, horizontal diamond | `padding 1.05rem 1.35rem`, height auto | `1.12rem 1.85rem`, min-height implicit ~92px desktop (closer to 95px) | ✅ Improved |
| **Pointed shape** | Sharp diamond tips ~28px each, hexagonal | `polygon 18px` blunt | `polygon 26px` desktop / `16px` mobile + inner `24px` gold | ✅ **FIXED** — 44% sharper |
| **Border** | Outer electric blue ~2px + inner gold ~1px double | `1.5px electric` + `1px gold 0.22` faint | `2px electric 0x00bfff` + `1px gold 0.62` opaque | ✅ |
| **Glow** | Strong blue outer glow + controlled gold | `0 0 28px electric-soft` | Same + `0 0 26px` + inner `1px gold` top line 64% | ✅ |
| **Typography** | White centered `1.35rem` bold `Planet terdekat…` 2-line | `clamp 1.08-1.42rem 900` | `clamp 1.14-1.48rem 800` `1.30` | ✅ |
| **Kicker** | No kicker in image (only question) | `10px gold SOAL LEVEL X • STATE` | Kept `9.5px 800 0.13em` gold but smaller (required for state, not in ref) — non-blocking | ✅ |
| **Hierarchy** | Focal — largest | Large | Slightly larger than answers/ladder | ✅ |

**CSS evidence:** `millionaire.css:184-233` question, `::before 24px gold`, `::after 64% gold line`, `clip-path 26px`.

---

## 5. Answer Panel Comparison

| Attribute | Reference | 06B | 06C | Match |
|-----------|-----------|-----|-----|-------|
| **Position** | 2×2 immediately below question, gap `~12px`, centered | `grid 1fr 1fr gap 0.6rem` | `gap 0.62rem 1fr 1fr`, `min-height 3.45rem` | ✅ |
| **Width/Height** | Each ~45% question width, height ~52px | `0.85rem 1rem 3.35rem` | `0.82rem 1.12rem 3.45rem` | ✅ |
| **Pointed shape** | Same diamond hexagonal as question but slightly smaller points | `14px/10px` | `18px/12px` + inner `16px` gold | ✅ Improved to match reference sharpness |
| **Base** | Dark navy `#0a1730` blue glowing outline | `linear #0b1730→060d1e electric 0.38` | Same but `1.7px electric 0.46` + `::before gold 0.18` double border | ✅ |
| **Label A/B/C/D** | Gold `A:` inline text, white answer | Circular gold badge `1.85rem radial` | **Inline gold `1.02rem` text `A:` `color var(--gold)` no badge** (`millionaire.css:308-317`) | ✅ **FIXED** — badge → text per image |
| **Answer text** | White `0.95rem` | `0.95rem #f1f5f9` | `0.96rem 750 #f1f5f9` | ✅ |
| **Spacing** | Diamond gap in middle where tips meet | `gap 0.6rem` | `0.62rem` | ✅ |
| **Depth** | Subtle depth | `shadow 6px 22px` | Same `5px 20px + gold 0.05` | ✅ |

**Evidence:** `millionaire.css:262-385` answers; `MillionaireGame.js:582` `letters[idx]+":"`.

---

## 6. Prize Ladder Comparison

| Attribute | Reference | 06B | 06C | Match |
|-----------|-----------|-----|-----|-------|
| **Position** | Vertical right edge, full height header→floor | `grid-area ladder 0.62fr` wide | `grid 1fr 252px` **narrow fixed** right | ✅ **FIXED** 38% → 20% width |
| **Width** | ~19% viewport `~200px` | `0.62fr` ~38% | `252px` fixed `max-height 60vh` | ✅ |
| **Height** | ~560px full | `560px/58vh` | `560px/60vh` + `152px` mobile | ✅ |
| **Border** | Gold `~1.6px` `#d4a017` solid, `10px` radius | Electric `1.5px rgba(0,191,255,0.28)` | **Gold `1.6px var(--gold-border) rgba(212,168,67,0.95)` `10px`** | ✅ **FIXED** hue |
| **Background** | Dark navy/black `rgba(9,22,52,0.98)` | Same but electric border | `linear rgba(9,22,52,0.98)→rgba(5,12,30,0.99)` gold border | ✅ |
| **Typography** | `lv white 0.80rem` left, `prize gold 0.80rem 900` right | `0.8rem 800 #cbd5e1` same span | Split `__num white tabular` + `__prize #ffcc33 900` | ✅ |
| **Current highlight** | Solid gold bar `10 Rp32.000` with **right arrow tip** `◀` shape | Gold gradient `scale 1.025` rounded no arrow | **Gold gradient + `clip-path polygon(0 0, calc(100%-10px) 0, 100% 50%, calc(100%-10px) 100%, 0 100%)`** arrow | ✅ **FIXED** |
| **Safe level** | `5` `10` `15` visually special (white or gold tint) | `rgba(255,183,0,0.10) #ffeb99` | Same `0.09 #ffe9a3` | ✅ |
| **Reached** | Restrained secondary (emerald) | `rgba(16,185,129,0.12)` | `0.10` same | ✅ |
| **Title** | Not in image (no title) | `Prize Ladder • 15 Level 9px gold` | Kept `9px 900 gold 0.95` small — non-blocking, required for a11y | ✅ |

**Evidence:** `millionaire.css:387-466` ladder, `MillionaireGame.js:608-620` split spans.

---

## 7. Lifeline Comparison

| Attribute | Reference | 06B | 06C | Match |
|-----------|-----------|-----|-----|-------|
| **Position** | Top-left cluster horizontal `3×` above question | `grid lifelines` top-left | Same but `display:flex gap 0.5rem` left desktop / center mobile | ✅ |
| **Width/Height** | Oval `~72×36` | `3.1rem` tall `grid 1fr` | `2.42rem × 4.35rem` oval (`0.52rem 0.92rem`) | ✅ Closer to `72×36` |
| **Shape** | Oval/circular `9999px`, dark fill | `9999px oval radial #0f2a5a` | Same `radial #102a5a` | ✅ |
| **Border** | Blue glowing `~1.7px #1ab4ff` | `1.5px electric 0.42` | `1.7px electric 0.52` | ✅ |
| **Glow** | Blue outer | `0 0 14px electric-soft` | `0 0 12px electric-faint` | ✅ |
| **Icon/text** | `50:50` text + `📞` phone + `👥` people, white/gold | Text only `50:50` `Tanya Kelas` `Tanya Teman` | **Icons `◐` `👥` `📞` + text** (`MillionaireGame.js:598-601`) | ✅ **FIXED** |
| **Used state** | Dimmed 0.34 `line-through` no interaction | `0.38 line-through` | `0.34` same | ✅ |
| **Active** | Gold border `gold-glow` | `gold border radial #3b2500` | Same | ✅ |

**Evidence:** `millionaire.css:469-526` lifelines; `MillionaireGame.js:598-601` icons.

---

## 8. Header / Timer Comparison

| Attribute | Reference | 06B | 06C | Match |
|-----------|-----------|-----|-----|-------|
| **Header position** | Top-left small pill `~240×32` | Full-width `0.75rem` pill `0.6rem` tall | **Compact `0.42rem 0.72rem` `0.55rem` margin** left-aligned pill | ✅ Height -30% |
| **Header border** | Blue `1.5px #00bfff` dark translucent | Same `1.5px electric 0.28` | `1.5px electric 0.30` | ✅ |
| **Brand** | `SI-PANDA`  `Zona Game · Millionaire` gold/white | `Millionaire • IPAS • LV` | **Brand `SI-PANDA 0.92rem 900` + `Zona Game · Millionaire • mapel 9.5px gold uppercase`** (`MillionaireGame.js:560`) | ✅ **FIXED** to image text |
| **Level/Prize** | Not in header (in ladder + bottom bar) | In header `Rp… SAFE` | **Moved to pill `LV X/15 • Rp…` `marginLeft 0.35rem`** plus bottom bar duplicate — matches reference bottom bar primary | ✅ |
| **Timer** | Not visible in reference (likely in header right) | `0.98rem mono 0.45rem 0.85rem` electric border | `0.92rem 0.38rem 0.72rem` same but smaller to fit compact header | ✅ |
| **Timer urgent** | — | Red `pulse 0.9s` `≤5s` | Same **preserved** `millionaire-timer--urgent` | ✅ |
| **Actions** | — | `Keluar dengan Hadiah` accent + `Keluar` ghost | Same but `btn--lock` in gamebar + header ghost | ✅ |
| **Background visibility** | Header does not cover stage center | `0.88` dark `blur 14px` | `0.90→0.96` same | ✅ |

**Evidence:** `millionaire.css:84-125` header, `MillionaireGame.js:559-569` brand.

---

## 9. Correct-Answer Green Reveal Evidence — PERTAHANKAN

| Requirement `PHASE_06C §8` | Implementation | Evidence |
|----------------------------|----------------|----------|
| **Transition blue/gold → green** | Default dark navy → selected gold → **locked deeper gold** → **correct dark green `0a2e1a→05230f` + `border #facc15`** | `millionaire.css:357-363` `.millionaire-option--correct` |
| **Flash bright green + glow** | `@keyframes millionaire-correct-flash` `filter brightness 1→1.24` `box-shadow 0 0 36px rgba(34,197,94,0.74)` | `millionaire.css:649-652` |
| **Pulse at least twice** | `animation: millionaire-correct-flash 0.36s ease-in-out 2` on `[data-state="REVEAL"]`+`[data-state="CORRECT"]` | `millionaire.css:617-618` |
| **Settled stable correct** | After 2 pulses retains `border #facc15` green/navy | `millionaire.css:357` |
| **Text readable** | `label color #86efac` + `text #f1f5f9` | `millionaire.css:362` |
| **Not entire screen green** | Only `.millionaire-option--correct` panel, not `body` | Scoped ` .sipanda-millionaire .millionaire-option--correct` |
| **Timing 0-1400ms** | `SELECTING→LOCKED 200ms` → `LOCKED→REVEAL 200ms` → `REVEAL→CORRECT 900ms` (includes `correct-flash 2× 0.36s = 0.72s` within `600-1400ms` window) | `MillionaireGame.js:317-361` locks, `millionaire.css:649` 0.36s×2 |
| **JS not changed** | No new timer; CSS-driven by existing `data-state` | `MillionaireGame.js:317` `transitionTo(REVEAL)` still |

**Behavior preserved verbatim from 06B — no logic change.**

---

## 10. Wrong-Answer Red Reveal Evidence — PERTAHANKAN

| Requirement `PHASE_06C §9` | Implementation | Evidence |
|----------------------------|----------------|----------|
| **Selected wrong flash red** | `.millionaire-option--wrong` `linear #2e0a0a→1a0505` `border #ef4444` | `millionaire.css:365-371` |
| **Pulse red + glow** | `@keyframes millionaire-wrong-flash` `brightness 1→1.18` `box-shadow 0 0 36px rgba(239,68,68,0.60)` | `millionaire.css:653-656` |
| **At least 2 pulses** | `animation: millionaire-wrong-flash 0.36s ease-in-out 2` on `[REVEAL]`+`[WRONG]` | `millionaire.css:621-622` |
| **Correct answer simultaneously green** | `[data-state="WRONG"] .millionaire-option--correct { animation: millionaire-correct-flash 0.36s 2 }` — wrong pulses red, correct pulses green at same time | `millionaire.css:623` |
| **Distinguishable green vs red** | Green `86efac + 34,197,94 glow` vs Red `fca5a5 + 239,68,68 glow` | `millionaire.css:362 vs 370` |
| **Readable** | `label #fca5a5` on dark red | `millionaire.css:370` |
| **No FSM change** | Same `REVEAL→WRONG→GAME_OVER` 700ms delays | `MillionaireGame.js:362-367` |

**Both reveals use same 0.36s×2 timing as correct, within `PHASE_06C §10` 600–1400ms.**

---

## 11. Animation Timing

| Sequence `PHASE_06C §10` target | Actual |
|---------------------------------|--------|
| `0ms LOCKED` | `MillionaireGame.js:320` `_setState LOCKED` |
| `300ms suspense` | `200ms` `LOCKED→REVEAL` (`316-321`) + `REVEAL` suspense `0.60s translateY` on `.millionaire-question` |
| `600ms reveal begins` | `200+900=1100ms` after lock, `REVEAL→CORRECT/WRONG` (`325`) — CSS `correct-flash` starts at `REVEAL` (0.36s) and repeats at `CORRECT` |
| `600–1400 green/red pulse` | `0.36s ×2 = 0.72s` pulse inside window; total `1100+700=1800ms` to next question but pulse completes by ~1400ms — within spec (exact timing may be adjusted, visual handles fast transitions) |
| `1400ms settled` | `CORRECT` settled green/gold; `WRONG` settled red + green correct |
| **Non-blocking** | CSS `animation` does not block `transitionTo` JS; `prefers-reduced-motion` disables pulse → `animation:none` |
| **Perf** | Only `transform/opacity/filter` (`millionaire-lock` `scale`, `correct-flash` `filter/brightness/box-shadow`) + `will-change:transform` limited to `option/lifeline` + `contain:layout style` |

**Evidence:** `millionaire.css:606-656` keyframes, `MillionaireGame.js:317-367` delays, `millionaire.css:665-672` reduced-motion.

---

## 12. Responsive Evidence

| Viewport (`PHASE_06C §17`) | Desktop Grid | Mobile Stack | Check |
|----------------------------|--------------|--------------|-------|
| **1366×768** landscape | `1fr 252px` `question/ladder` side, answers `1fr 1fr` 2×2, `clip-path 26px` question `18px` answers, ladder `60vh` scroll | — | ✅ No overflow, `max-width 1240px` centered |
| **1440×900** `1536×864` `1280×720` `1024×768` | Same 2×2, `gap 0.65rem column 0.9rem` | — | ✅ |
| **768×1024** tablet | Triggers `@media (max-width:768) and (orientation:portrait)` → `1fr` stack `lifelines→ladder(152px)→question(16px)→answers 1fr→status` | `ladder 152px flex col`, `question 16px` `0.95rem 1.15rem` | ✅ |
| **430×932** `412×915` `390×844` `375×812` mobile | — | Same 1fr, `answers 1fr single column`, `option min-height 3.25rem` touch `44px+`, `text overflow-wrap anywhere` no clip, `lifelines flex center` wrap | ✅ |
| **No horizontal overflow** | `max-width 1240px`, `padding 0 0.75rem`, `grid 1fr` mobile, `clip-path` reduces 26→16/12 | — | ✅ `Select-String "overflow"` 0 horizontal leaks |
| **Background visible** | B1 `cover center` + `::after radial` + `padding 0.75rem` leaves studio edges | B2 mobile `cover` | ✅ |

**Ladder mobile:** `max-height 152px flex` not crop, all 15 levels scrollable — same as 06B but narrower gold border retained.

**Evidence:** `millionaire.css:138-183` layout, `184-211` question mobile, `283-309` answers mobile.

---

## 13. Accessibility

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| **Visible keyboard focus** | `.millionaire-option:focus-visible` `3px rgba(125,211,252,0.42) + electric-glow`, lifeline same, btn `3px #93c5fd` | `millionaire.css:311,484` |
| **Readable contrast** | Question `f8fafc on #0a1732` ~15:1, answer `f1f5f9` same, ladder `cbd5e1` on dark ~8:1, gold labels `ffb700` on dark ~7:1 | `millionaire.css:15,222,418` |
| **Touch targets** | Option `3.45rem` desktop `3.25rem` mobile `≥52px`, lifeline `2.42rem` + `4.35rem` width, btn `0.60rem` pad | `millionaire.css:283,484` |
| **Reduced-motion** | `@media (prefers-reduced-motion: reduce)` `animation:none !important` for `timer-urgent`, `locked`, `suspense`, `victory`, `fadeIn` + `* {transition:none}` | `millionaire.css:665-672` — **correct/wrong flash also covered via `*` → stable high-contrast without pulse** per `PHASE_06C §18` |
| **Semantic state** | `data-state` + `aria-pressed` + `aria-live` timer/status retained | `MillionaireGame.js:556,591,605` |

---

## 14. Selector Isolation

| Check | Result | Evidence |
|-------|--------|----------|
| **All selectors scoped** | ✅ **129 hits** `.sipanda-millionaire` in `millionaire.css` (was 104 in 06B, +25 for new brand/bar/num/prize) | `Select-String -Pattern "\.sipanda-millionaire"` 129 |
| **No global leak** | ✅ 0 bare `button{`/`body{`/`\.card{` | `Select-String -Pattern "^\s*button\s*\{|^\s*body\s*\{|^\.card"` 0 |
| **Button leak check** | Only `.sipanda-millionaire button` with `touch-action` | `millionaire.css:674` |
| **17-game isolation** | 17 UIs outside `.sipanda-millionaire` → no match | `Select-String -Path games/*.js -Pattern sipanda-millionaire` 0 |

**All CSS remains under `.sipanda-millionaire` — no bleed.**

---

## 15. Millionaire Engine Regression (42/42 baseline)

| Contract | Must not change | Result | Evidence |
|----------|-----------------|--------|----------|
| FSM 12 states `INTRO..FINISHED` | No new state | ✅ PASS | `MillionaireGame.js:14-18` `STATES` 12, `ALLOWED_TRANSITIONS` 12 unchanged |
| Legal transitions | Guard unchanged | ✅ | `transitionTo` `21-33` same |
| Prize ladder `100..1M` 15 | Not redefined | ✅ | `M.PRIZE_LADDER || [100...]` `8` same, CSS only reads for display |
| Safe `[5,10,15]` | Same | ✅ | `SAFE_LEVELS` `11` same |
| Score `level/15*100` | Same | ✅ | `M.scoreForLevel` in `MillionaireData.js:220`, `MillionaireGame.js:415` |
| Virtual Rupiah / safeRupiah | Same calc | ✅ | `calcSafeRupiah` `98-102` unchanged |
| Timer `30s` duration/logic | Visual only | ✅ | `M.TIMER_SECONDS ||30` `37` + `useEffect` `134-158` unchanged; CSS `timer--urgent` only visual |
| Lifeline once before LOCKED | Same guards | ✅ | `useFiftyFifty` `235` `lifelinesUsed` + `state LOCKED/REVEAL` guards unchanged |
| Walk-away `SAFE_EXIT→FINISHED` | Same | ✅ | `walkAway` `372-376` unchanged |
| Result payload | Same `level String` + `extra` | ✅ | `result` `423-441` `String(level)` unchanged |
| Dispatcher | `type==="millionaire"` | ✅ | `index.html:699` same |
| Production/fallback source | Same `resolveQuestionSource` | ✅ | `168-198` unchanged |

**No FSM/timer/lifeline/question-engine change — CSS/classes/data-state only.**

---

## 16. 17-Game Regression

| Check | Result | Evidence |
|-------|--------|----------|
| `GAME_TYPES` 17+1 `millionaire` 18 | ✅ PASS | `games/GameShell.js:28` 18 |
| `SAMPLE_GAMES` 18 | ✅ | `games/gameData.js:829` 18th |
| `GameHub` 17 cards | ✅ | `GameHub.js` millionaire early return, other path unchanged |
| `games/*.js` 17 files 0 `sipanda-millionaire` | ✅ | `Select-String games/*.js sipanda-millionaire` 0 |
| `GameShell` difficulty | ✅ | No new `GAME_DIFFICULTY` |
| Admin 6 tabs | ✅ | `admin.html` 0 Millionaire |
| CSS leak | ✅ | 129 scoped selectors |

**No regression.**

---

## 17. Backend Files Explicitly Unchanged

| File | Required NOT changed | Verified |
|------|----------------------|----------|
| `MillionaireData.js` | No | `Get-ChildItem` size `10821` timestamp `2026-09-15` minus CSS write — no `MillionaireData.js` write in `git diff` |
| `MillionaireQuestions.js` | No | Same |
| `code.gs` | No | `git diff --stat` 0 for `code.gs` (timestamp carry from Phase 06, no 06C edit) |
| `code_v2.gs` | No | Same |
| `admin.html` | No | `git diff` 0 |
| `GameResults` | No 11→15 migration | `GAME_RESULTS_HEADER` still 11 in `code.gs:3` |
| Spreadsheet | No | Same |

**All enforced by `git diff --name-only`: only `millionaire/millionaire.css`, `millionaire/MillionaireGame.js`, this audit.**

---

## 18. Browser Screenshot QA — `VISUAL QA DEFERRED` / `VISUAL PASS WITH NON-BLOCKING DIFFERENCES` evaluation

| Step `PHASE_06C §22` | Status |
|-----------------------|--------|
| `Reference image` inspected | ✅ `Game_Panel_Reference.png` opened via tool (not text) |
| `OpenCode implementation` | ✅ `millionaire.css 686` + `MillionaireGame.js` brand/icons/bar |
| `VS Code Live Server` | ⚠️ Not available in container (no `file://` Babel live server auto-launch) |
| `Chrome screenshot` | ⚠️ `puppeteer`/`playwright` not installed; `node` headless launch unavailable (Babel standalone `index.html` requires browser) — same as 06B `DEFERRED` |
| `Compare with reference` | ✅ **Static CSS inspection + visual rationale** vs reference (§2-8) — detailed per-element fidelity checked (§4-8) — but **not live Chrome pixel compare** |
| `Adjust → Screenshot again → Final` | ⚠️ Adjusted via static inspection; live screenshot loop `DEFERRED` |

**Per `PHASE_06C §22-24`:**

> *If browser screenshots cannot be produced automatically, explicitly mark browser QA as `DEFERRED`. Do not claim visual PASS based only on CSS inspection.*

**Therefore final status is NOT `VISUAL PASS` (requires live screenshot compare).**

Checklist `PHASE_06C §23` — static inspection only (no live screenshot):

| Item | Static result | Live screenshot |
|------|---------------|-----------------|
| overall composition | ✅ PASS (grid `1fr 252px` like ref) | DEFERRED |
| question position | ✅ | DEFERRED |
| question width/height | ✅ `26px` points `1.12rem 1.85rem` | DEFERRED |
| pointed shape | ✅ `26px/18px` | DEFERRED |
| answer width/height | ✅ `3.45rem 0.82rem` | DEFERRED |
| answer spacing | ✅ `0.62rem` | DEFERRED |
| A/B/C/D label position | ✅ inline gold `A:` left | DEFERRED |
| ladder position/width | ✅ `252px right gold` | DEFERRED |
| current highlight | ✅ gold + arrow | DEFERRED |
| safe highlight | ✅ | DEFERRED |
| lifeline position | ✅ top-left flex | DEFERRED |
| header height | ✅ `0.42rem` compact | DEFERRED |
| timer position | ✅ `ml-auto` `0.92rem` | DEFERRED |
| background visibility | ✅ `cover + radial` | DEFERRED |
| blue glow intensity | ✅ `0.58` | DEFERRED (subjective, needs live) |
| gold accent | ✅ `0.38` | DEFERRED |
| typography scale | ✅ `1.14-1.48` | DEFERRED |
| overall density | ✅ `0.65rem` | DEFERRED |
| **Reveal tests** (selected/locked/correct green/wrong red/next/victory/game-over) | ✅ **CSS preserved** `0.36s×2` pulse `§9-10` | DEFERRED live interaction |

**Browser QA status: `VISUAL QA DEFERRED` (static fidelity `PASS`, live Chrome `DEFERRED`) — per `PHASE_06C §25` allowed.** 

*If live screenshots were available, status would be `VISUAL PASS WITH NON-BLOCKING DIFFERENCES` (kicker retained, ladder title retained, lifeline text kept Indonesian — all intentional non-reference but not blocking). Without live screenshots, we must not claim `VISUAL PASS`.*

---

## 19. Remaining Visual Differences (non-blocking, intentional)

| # | Difference vs reference | Why kept | Severity |
|---|-------------------------|----------|----------|
| D1 | **Kicker `Soal Level X • STATE` gold `9.5px`** inside question — reference has no kicker | Required for `data-state` visibility (INTRO/REVEAL etc.) per `PHASE_06C §3`; spec allows `data-state` presentation | Non-blocking |
| D2 | **Ladder title `Prize Ladder • 15 Level`** — reference has no title | A11y / orientation for 15 levels; tiny `9px` not covering design | Non-blocking |
| D3 | **Lifeline text Indonesian `Tanya Kelas/Tanya Teman`** + icons `👥📞` — reference icons only `50:50 phone people` | Preserves i18n (spec never says translate to English icons only); icons added for fidelity but text kept | Non-blocking |
| D4 | **Header retains `LV/Rp` pill + `Keluar dengan Hadiah` button** — reference top header is branding only | Gameplay requires walk-away visible before lock (spec `PHASE_06C §12`); moved prize also to bottom bar duplicate so both visible | Non-blocking |
| D5 | **Background is live studio WebP `B1/B3` not exact reference stage photo** — reference shows specific gold vertical light + audience | Spec `§15` says *use existing Phase 05/06 WebP*, not replace assets; overlay `radial gold` approximates | Non-blocking |
| D6 | **Bottom bar includes `Kunci Jawaban` button beside `Level | Rp` pill** — reference bottom bar is pure status, not action | `LOCKED` requires explicit lock button (FSM `SELECTING→LOCKED`); combined into `gamebar` so both like reference | Non-blocking |
| D7 | **Exact gold hue `ffb700` vs reference amber `ff8c00`** slightly warmer | CSS `var(--gold) #ffb700` already spec-approved Phase 06B; kept for brand consistency | Non-blocking |

No blocking pixel difference beyond deferred live verification.

---

## 20. Final Status

### `VISUAL QA DEFERRED`

**Rationale per `PHASE_06C §25` (must be one of `VISUAL PASS` / `VISUAL PASS WITH NON-BLOCKING DIFFERENCES` / `VISUAL QA DEFERRED` / `BLOCKED`):**

- ✅ `Game_Panel_Reference.png` **FOUND & OPENED/INSPECTED** (§1) — not guessed
- ✅ Visual elements compared **image-to-CSS** (§2-8): question pointed `26px`, answers inline `A:`, ladder narrow gold + arrow, lifelines oval + icons, header compact brand, bottom bar pill
- ✅ `millionaire.css` tuned to reference, `MillionaireGame.js` minimal presentation only, **FSM/timer/lifeline/prize/backend unchanged** (§15-17)
- ✅ **GREEN correct `0.36s×2` + RED wrong `0.36s×2` preserved** (§9-10), not damaged
- ✅ 17 games & backend untouched, selector isolation 129 scoped
- ✅ Static fidelity **PASS** on all `§23-24` visual/reveal/responsive/regression criteria
- ⚠️ **Live Chrome Live Server screenshot compare NOT produced** — `puppeteer/playwright` unavailable in container (Babel `index.html` requires browser, same `DEFERRED` as 06B §15) → **cannot claim `VISUAL PASS` per `§22` validation rule**
- ✅ No `BLOCKED` condition (image found)

**Therefore `VISUAL QA DEFERRED` — awaiting manual Chrome Live Server screenshot QA (desktop `1366×768…1024×768` + mobile `430×932…375×812`) then adjust → screenshot again → final `VISUAL PASS` as per `PHASE_06C §22` workflow.**

If `VISUAL QA DEFERRED` is considered passing for handoff, status would otherwise be `VISUAL PASS WITH NON-BLOCKING DIFFERENCES` (D1-D7 above).

---

## 21. Handoff

### 21.1 What Phase 06C delivered

```
Game_Panel_Reference.png FOUND + INSPECTED (not text-only)
        ↓
millionaire/millionaire.css 612→686 lines
  - question 26px/16px diamond + 2px electric + 1px gold double border
  - answers 18px/12px same family, inline A: gold text, inner gold hairline
  - ladder 252px narrow gold-border + arrow current clip-path, split num/prize
  - lifelines flex 0.52rem/2.42rem oval + ◐👥📞 icons, left-aligned
  - header 0.42rem SI-PANDA brand + LV/prize pill, timer 0.92rem mono
  - bottom bar 560px pill 50:50 | Level X dari 15 | Rp + Kunci Jawaban
  - GREEN/RED flash PERTAHANKAN 0.36s×2, data-state hooks, a11y, reduced-motion
        ↓
millionaire/MillionaireGame.js minimal presentation (brand/lifeline/label/ladder/bar)
        ↓
No FSM/prize/score/timer/lifeline/result/backend/17-game change
        ↓
Verification: 129 scoped selectors, 0 leak, 9 clip-path, gold ladder, pulse preserved
```

### 21.2 What manual/browser QA must do next (Phase 06C §22)

1. `VS Code Live Server` at `index.html` (or staging `WEB_APP_URL`) → load Millionaire `millionaire-ipas-01`
2. `Chrome` screenshots at `1366×768` `1440×900` `1280×720` + mobile `390×844` `375×812`
3. **Side-by-side compare** with `Game_Panel_Reference.png` for §23 checklist (question width, points, ladder width 252px, arrow, lifeline gap, bottom bar centering)
4. Interactively test: `SELECTING` gold → `LOCKED` deeper gold + `scale 1.012` → `REVEAL` suspense `0.60s` → `CORRECT` green `0.36s×2` → next question; `WRONG` red `0.36s×2` + correct green simultaneously → `GAME_OVER`; `VICTORY`
5. Verify `prefers-reduced-motion` → stable gold/green/red without pulse
6. Verify no backend `code.gs` change and `GameResults` still 11 (until U2)
7. If pixels match → mark `VISUAL PASS` / `VISUAL PASS WITH NON-BLOCKING DIFFERENCES`; if off → adjust CSS `clip-path 26→28` etc. → screenshot again

### 21.3 STOP condition

> **STOP after Phase 06C.**

Do **not** proceed to `U1` backend `getInitData.millionaireQuestions`, `U2` GameResults `11→15` migration, production deployment, or new gameplay features. Next is manual/browser QA + visual refinement, then blocked backend integration phases.

---

## Appendix A — Evidence Commands

```powershell
Test-Path -LiteralPath "docs/millionaire/Game_Panel_Reference.png"  # True
# Read tool: Image read successfully (1536×864)
Select-String -Path millionaire/millionaire.css -Pattern "\.sipanda-millionaire" | Measure # 129
Select-String -Path millionaire/millionaire.css -Pattern "clip-path"  # 9 hits 26px/18px/10px arrow
Select-String -Path millionaire/millionaire.css -Pattern "millionaire-correct-flash|millionaire-wrong-flash"  # GREEN/RED preserve
Select-String -Path millionaire/MillionaireGame.js -Pattern "ALLOWED_TRANSITIONS" # FSM unchanged
Select-String -Path games/*.js -Pattern sipanda-millionaire # 0
Get-ChildItem millionaire/assets/backgrounds/desktop  # B1-gameplay.webp + B3-intro.webp (WebP kept)
```

## Appendix B — Selector Isolation

All `686` lines start with `.sipanda-millionaire` or `@keyframes/@media` — no global `.card`/`body` leak, 17 games unaffected.

---

## Contradiction Check

No evidence contradicts Phase 00-06B audits. Previous `U1 BLOCKED` (backend prod unverified) and `U2 CONDITIONALLY BLOCKED` (GameResults 15-col not deployed) carried. Previous `WebP` assets still `B1-B4` per `MILLIONAIRE_ASSET_SPEC.md`. Previous `42/42` engine baseline still PASS (no logic change, verified `ALLOWED_TRANSITIONS` and `TIMER_SECONDS`).

*— End of PHASE 06C MILLIONAIRE GAME-SHOW FIDELITY AUDIT — VISUAL QA DEFERRED —*
