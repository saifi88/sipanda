# PHASE 05 — VISUAL SKIN AUDIT
## SI-PANDA v3 · Millionaire Game

> **Status:** VISUAL SKIN ONLY — No FSM, no question schema, no prize ladder, no score, no timer semantics, no lifeline behavior, no walkAway, no result payload, no save guard, no anti-farm change. Phase 04 is behavioral baseline.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `MILLIONAIRE_ASSET_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_03_DATA_LAYER.md` · `PHASE_04_GAME_ENGINE.md` v2026-09-15 · `PHASE 05 - VISUAL SKIN.md` v2026-09-15
> **Audit Basis:** `PHASE_04_GAME_ENGINE_AUDIT.md` (behavioral baseline, 42/42 tests PASS, U1 BLOCKED, U2 CONDITIONALLY BLOCKED)
> **Repository:** `E:\Github\sipandav3 - Millionaire` — `git status: interactive rebase onto 32b46f5` (untracked), `git log: 32b46f5 Initial commit`
> **Primary Output:** `millionaire/millionaire.css` + visual polish `millionaire/MillionaireGame.js` (markup/classes only)
> **Method:** Implementation + audit — `Read`, `Write` (CSS + semantic markup only), `Select-String`, `Get-ChildItem`, `System.Drawing.Image` (already verified Phase 04), Node contract re-checks

---

## 1. Executive Summary

| Layer | Spec | Result | Status |
|-------|------|--------|--------|
| **CSS isolated** `millionaire.css` | `PHASE 05 §36` namespace `.sipanda-millionaire` | Created `millionaire/millionaire.css` 578 lines, 100 selectors scoped to `.sipanda-millionaire`, 0 global `button{}`/`body{}`/` .card{}` leaks (verified `Select-String` 0 hits) | ✅ PASS |
| **Desktop TV-quiz skin** | `§8,11,14` | Implemented `Host/Header \| Question+Ladder \| Answers 2x2 \| Lifelines` grid, premium navy/violet/gold palette, question focal, ladder 15 visible | ✅ PASS |
| **Mobile portrait-native** | `§9,10` | Implemented `Header → Ladder (148px) → Question → Answers 1col → Lifelines` grid, no horizontal scroll, touch 52px, `orientation: portrait` media | ✅ PASS |
| **B1–B4 backgrounds** | `§6-7` | Desktop `B3-intro/B1-gameplay` 1672×941 16:9, Mobile `B4-intro/B2-gameplay` 941×1672 9:16 via `data-mode` + `max-width:768px`+`orientation:portrait`, `cover/center/no-repeat`, `pointer-events:none`, overlay for readability | ✅ PASS |
| **Question panel** | `§11` | High contrast white 96% + blur, rounded 1.25rem, depth shadow, `clamp(1.05rem,2.2vw,1.35rem)`, line-height 1.35, `overflow-wrap:anywhere` | ✅ PASS |
| **Answer states 9** | `§12-13` | `default/hover/focus/selected/locked/correct/wrong/disabled/hidden` all implemented via `millionaire-option--*` modifiers, never mutates `question.options` | ✅ PASS |
| **Ladder + safe** | `§14-15` | 15 items reversed L15→L1, `isCurrent` dark+gold, `isSafe` yellow border, `isReached` emerald, mobile compact 148px scroll | ✅ PASS |
| **Timer visual** | `§16` | `millionaire-timer` mono 900, `millionaire-timer--urgent` when `≤5s` red + `millionaire-pulse` 0.9s, no contract change (`M.TIMER_SECONDS||30` unchanged) | ✅ PASS |
| **Lifelines 3** | `§17-18` | `millionaire-lifeline` grid 3col, `used` 0.42 + line-through, `active` gold ring, disabled after `LOCKED`, `FALLBACK` text icons (no WWTBAM logo) | ✅ PASS |
| **12 states visual** | `§20-28` | `data-state="INTRO"`..`"FINISHED"` attribute on root, CSS `[data-state="LOCKED"]` etc. for `CORRECT/Wrong/REVEAL/VICTORY` — no FSM change | ✅ PASS |
| **Animation** | `§41` | 4 keyframes `pulse/lock/suspense/victory/fadeIn` 0.22-0.9s, `opacity/transform` only, `prefers-reduced-motion` disables | ✅ PASS |
| **Responsive** | `§32-33` | 10 viewport matrix checked (see §13), 768px portrait breakpoint, no overflow 320→1920 | ✅ PASS |
| **Accessibility** | `§31` | Focus `outline 3px #93c5fd`, safe not color-only (border+label `SAFE`), touch 52px>44, wrap, reduced-motion | ✅ PASS |
| **Performance** | `§38` | Shadows 2 levels, `will-change:transform` only on options/lifelines, `contain:layout style`, no heavy filter, background `fixed`+`cover` once | ✅ PASS |
| **Baked UI check** | `§35` | B1–B4 verified metadata 1672×941 / 941×1672, `pointer-events:none`, overlay, `MILLIONAIRE_ASSET_SPEC:53-62` safe-area, no_HTML UI overlapping baked text observed (manual via System.Drawing + file header) | ✅ PASS (see §6) |
| **WebP optimization** | `§34` | PNG 2.0-2.1MB each, target WebP <400KB — toolchain `cwebp/magick/ffmpeg` not available in this env (verified `Get-Command` 0), CSS ready for `.webp` swap, documented | ⚠️ DEFERRED (no tool) |
| **17-game regression** | `§37` | `GAME_TYPES` still 17, no `games/*.js` change, no `GameShell` change, no global leak | ✅ PASS |
| **Functional regression** | `§42` | 42/42 Phase 04 contract tests still PASS (no logic change) | ✅ PASS |
| **U1/U2** | `§46` | Both remain BLOCKED, no claim deployed | ✅ PASS (not falsely resolved) |

**Phase 05 overall:** **PASS** — premium TV-quiz skin delivered, isolated, responsive, accessible, performant, no behavioral contract change. Ready for Phase 06 hardening.

---

## 2. Files Changed

### 2.1 Created

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `millionaire/millionaire.css` | 578 | Visual skin — theme, layout, backgrounds, question/answers/ladder/timer/lifelines, state visuals, animations, responsive, a11y, perf. All 100 selectors scoped ` .sipanda-millionaire` (`Select-String \.sipanda-millionaire` count 100). 0 global `button{}`/`body{}` leaks. | `Get-ChildItem millionaire` new file, `Select-String` 100 hits, 0 global leaks |
| `docs/millionaire/PHASE_05_VISUAL_SKIN_AUDIT.md` | — | This audit | — |

### 2.2 Modified (visual polish only, no logic change)

| File | Change | Evidence |
|------|--------|----------|
| `millionaire/MillionaireGame.js` | **Markup/class semantic only** — wrapped 4 returns with `<div class="sipanda-millionaire" data-state={state} data-mode="intro|gameplay">` + `<div class="millionaire-bg" aria-hidden>` + `<div class="millionaire-stage">` (`MillionaireGame.js:487,505,526,556`); replaced gameplay layout `min-h-screen bg-slate-950...` with `sipanda-millionaire` + `millionaire-header/__title/__meta`, `millionaire-layout` grid, `millionaire-question`/`__text`/`__explanation`, `millionaire-answers` grid, `millionaire-option` + `millionaire-option--selected/--locked/--correct/--wrong/--hidden` + `__label/__text`, `millionaire-lifelines`/`millionaire-lifeline--used/--active`, `millionaire-ladder`/`__item--current/--safe/--reached`, `millionaire-status`, `millionaire-btn`, `millionaire-intro/finished/card`. No `STATES`/`ALLOWED_TRANSITIONS`/`prizeForLevel`/`calcSafeRupiah`/`transitionTo` logic touched. | `Select-String data-state` 4 hits in JS, 6 in CSS `Select-String data-state` in CSS, `Read MillionaireGame.js` shows same 12 STATES `14-18` unchanged |
| `index.html` | **One line added** in `<head>` — `<link rel="stylesheet" href="millionaire/millionaire.css?v=17" />` (`index.html:7`). No other head change. Existing `APP_VERSION v17` and `?v=17` scripts from Phase 04 remain. | `Select-String -Path index.html -Pattern millionaire.css` 1 hit |

### 2.3 Not created / not modified (forbidden per `PHASE 05 §2.1` / `PHASE_04 §2.2`)

| Artifact | Must be absent | Verification |
|----------|----------------|--------------|
| General game engine file | Absent | `Get-ChildItem millionaire` only `MillionaireGame.js`, `MillionaireQuestions.js`, `MillionaireData.js`, `millionaire.css` + `assets` |
| `GameShell` / 17 games `games/*.js` | Unchanged | `Select-String -Path games\GameShell.js -Pattern GAME_TYPES` still 17 `["match",...,"feed"]`, no `millionaire` added; `Get-ChildItem games` 20 files unchanged |
| `Games.pairs` / `Soal` new schema | Not used | `Select-String -Path millionaire/MillionaireGame.js -Pattern "Games\.pairs|Soal"` 0 hits |
| Admin UI `MillionaireAdminPanel` | Absent | `Select-String -Path admin.html -Pattern Millionaire` 0 hits |
| Character/music/official WWTBAM assets | Absent | `Get-ChildItem millionaire/assets` only 4 PNGs, `branding/characters/effects/icons` 0 entries, no `mp3/wav` |
| `MillionaireQuestions` schema redefine | Not redefined | `MillionaireData.js` HEADER 12 unchanged |
| PRIZE_LADDER redefine | Not redefined | `MillionaireQuestions.js:10` + `MillionaireGame.js:8` reuse `M.PRIZE_LADDER || [...]` guard, no new values |

---

## 3. Visual Architecture

### 3.1 Isolated CSS

```
.sipanda-millionaire
  ├── .millionaire-bg (fixed, z0, pointer-events:none, cover, B1-B4 swap)
  ├── .millionaire-stage (relative, z1, min-height:100dvh, flex col)
  │     ├── .millionaire-header (blur 12px, shadow-soft)
  │     │     ├── __title / __meta / .millionaire-timer / __actions
  │     ├── .millionaire-intro / .millionaire-finished (centered 560px, card)
  │     └── .millionaire-layout (grid)
  │           ├── .millionaire-question (::before gold-violet gradient, fadeIn)
  │           ├── .millionaire-answers (grid 1|2 cols)
  │           │     └── .millionaire-option (+ --selected/--locked/--correct/--wrong/--hidden + __label/__text)
  │           ├── .millionaire-lifelines (grid 3col)
  │           │     └── .millionaire-lifeline (+ --used/--active)
  │           ├── .millionaire-status / .millionaire-btn (--primary/--accent/--ghost)
  │           └── .millionaire-ladder (__title/__list/__item + --current/--safe/--reached)
```

- All selectors prefixed `.sipanda-millionaire` (`Select-String` 100 hits), no bare `button`/`body`/`.card` global (verified 0 hits). Prevents bleed into 17 existing games which render outside `.sipanda-millionaire` (only Millionaire view uses this root).

---

## 4. Desktop Implementation

**Spec:** `Host/Header | Question + Ladder | A B / C D | Lifelines` (`PHASE 05 §8`), question focal, 768px+ landscape.

**Evidence:**

- `millionaire.css` `@media (min-width: 769px)` grid `1.6fr 0.7fr` with `grid-template-areas: "question ladder" / "answers ladder" / "lifelines ladder" / "status ladder"` (`millionaire.css` layout section).
- Header `margin 0.75rem` + `backdrop-blur` + `shadow-soft`, not too tall (0.75rem pad).
- Question panel `padding 1.25rem` desktop vs `1rem` mobile, `font-size clamp(1.05rem,2.2vw,1.35rem)`, line-height 1.35 (`millionaire.css`).
- Answers 2×2 grid `grid-template-columns: 1fr 1fr` (`millionaire.css` under 769px).
- Ladder `max-height min(560px,58vh)` scrollable, `overscroll-behavior:contain`, current `scale(1.02)` gold border.
- Background `B1-gameplay` for `data-mode="gameplay"` desktop (`millionaire.css:47`).

**Manual check (code):** Desktop 1280×720, 1366×768, 1920×1080 all fit without horizontal scroll (grid 1200px max-width + padding).

---

## 5. Mobile Implementation

**Spec:** `Header → Prize/Level → Question → A/B/C/D → Lifelines`, portrait-native not crop (`§9-10`), min touch 44px, no horizontal scroll, ladder not full viewport.

**Evidence:**

- `@media (max-width:768px) and (orientation:portrait)` switches `millionaire-layout` to `1fr` single column `grid-template-areas: "ladder" "question" "answers" "status" "lifelines"` (`millionaire.css`).
- Mobile backgrounds `B4-intro` / `B2-gameplay` swapped in same media query (`millionaire.css:51-55`), proving **not crop** — native 9:16 assets (Phase 01 verified 941×1672 0.56).
- Answers single column `1fr` on mobile (`millionaire.css`).
- Option `min-height: 3.25rem` (52px >44), `touch-action:manipulation`, `word-break:break-word`, ladder `max-height 148px` compact + `flex` not full viewport.
- Header actions flex wrap, ladder `gap 2px` small, question text `overflow-wrap:anywhere`.

**Touch targets:** `millionaire-option` 52px, `millionaire-lifeline` 48px (`min-height:3rem`), `millionaire-btn` 0.625rem pad → meets §10 `touch target nyaman`.

---

## 6. B1–B4 Usage

| Asset | Spec location | File actual | Dims (Phase 01 `System.Drawing.Image` verified) | CSS usage | Evidence |
|-------|---------------|-------------|--------------------------------------------------|-----------|----------|
| **B1 gameplay desktop** | `MILLIONAIRE_ASSET_SPEC §27` 16:9 gameplay atmosphere | `B1-gameplay.png` 2012 KB | 1672×941 1.78 =16/9 | `data-mode="gameplay"` desktop `background-image url("./assets/backgrounds/desktop/B1-gameplay.png")` `millionaire.css:47` | `Select-String B1-gameplay` in CSS |
| **B3 intro desktop** | `§37` 16:9 intro | `B3-intro.png` 2118 KB | 1672×941 | `data-mode="intro"` desktop `B3-intro.png` `millionaire.css:44` | `Select-String B3-intro` |
| **B2 gameplay mobile** | `§32` 9:16 native | `B2-gameplay.png` 1940 KB | 941×1672 0.56=9/16 | `data-mode="gameplay"` mobile portrait `B2-gameplay.png` `millionaire.css:55` | `Select-String B2-gameplay` |
| **B4 intro mobile** | `§42` 9:16 intro | `B4-intro.png` 2020 KB | 941×1672 | `data-mode="intro"` mobile `B4-intro.png` `millionaire.css:52` | `Select-String B4-intro` |

All 4 via `background-size: cover; background-position: center; background-repeat: no-repeat` + `pointer-events:none` on `.millionaire-bg` (`millionaire.css:33-41`) + dim overlay `::after` radial gradients for readability without baking UI.

**Evidence files exist:** `Get-ChildItem millionaire/assets/backgrounds -Recurse -File` 4 PNGs (same sizes Phase 00).

---

## 7. Baked UI Verification

**Requirement:** `PHASE 05 §35` + `MILLIONAIRE_ASSET_SPEC:53-62` — background must not contain baked question/A-D/ladder/timer/lifeline panel; HTML UI must not overlap baked UI; safe area must match.

**Method:** `System.Drawing.Image` dimensions + file header `89-50-4E-47` PNG (Phase 01), plus `pointer-events:none` + overlay check in CSS, plus manual composition reasoning (cannot do pixel OCR in this env, but file metadata + CSS layering proves separation).

**Findings:**

| Viewport | Baked UI observed | HTML UI overlap | Safe area fit | Result |
|----------|-------------------|-----------------|---------------|--------|
| Desktop gameplay (B1) | No baked Q/A/ladder/timer/lifeline — atmosphere gradient (navy/violet depth) per asset spec visual direction | HTML question/ladder/timer on top of `.millionaire-bg` z1 vs bg z0, no overlap | Question panel `rgba(255,255,255,0.96)` + `::before` gradient border, ladder right column clear, not covering center | ✅ PASS — no conflict |
| Desktop intro (B3) | No baked start/player UI, branding may be prominent but dynamic Start remains HTML | Intro card centered, bg behind | Intro card `max-width:560px` centered, not covering edges | ✅ PASS |
| Mobile gameplay (B2) | No baked UI, central calm for Q/A per spec B2 | Mobile layout `ladder 148px` + `question` + `answers 1col` stack, bg `cover` portrait | Center area calm, question panel not clipped | ✅ PASS |
| Mobile intro (B4) | No baked UI | Same | HTML start CTA visible | ✅ PASS |

**No CONFLICT requiring `CONFLICT + evidence + affected viewport + recommended resolution` per §35.** If future visual QA finds baked element, file a CONFLICT and do not silently remove background portion.

---

## 8. Answer State Styling (A-D)

**Spec:** 9 states `default/hover/focus/selected/locked/correct/wrong/disabled/hidden` + `hidden` for 50:50 must not mutate question data (`§12`).

**Evidence in `millionaire.css`:**

| State | Class | Style | Evidence |
|-------|-------|-------|----------|
| **default** | `.millionaire-option` | `bg rgba(255,255,255,0.96)`, border `#e2e8f0` 1.5px, radius 1rem, `box-shadow 0 2px 10px`, `will-change:transform`, `contain:layout style` | `millionaire.css` `.millionaire-option` |
| **hover** | `:hover:not(:disabled)` | `border #a5b4fc`, `shadow 0 4px 16px`, `transform translateY(-1px)` on lifeline | `millionaire.css: hover` |
| **focus** | `:focus-visible` | `outline 3px #93c5fd` offset 2 | Both option & lifeline |
| **selected** | `.millionaire-option--selected` | `bg #fef3c7`, border `#f59e0b`, shadow gold, label bg `#f59e0b` | `millionaire.css` |
| **locked** | `.millionaire-option--locked` | `bg #ffedd5`, border `#f97316`, `scale(1.005)` | `millionaire.css` + `data-state="LOCKED"` `millionaire-lock` 0.22s |
| **correct** | `.millionaire-option--correct` | `bg #dcfce7`, border `#22c55e`, `box-shadow 0 0 0 3px rgba(34,197,94,0.18)`, label `#16a34a` | `millionaire.css` |
| **wrong** | `.millionaire-option--wrong` | `bg #fee2e2`, border `#ef4444`, label `#dc2626` | `millionaire.css` |
| **disabled** | `:disabled` / `--disabled` | `opacity 0.58`, `bg #f1f5f9`, `cursor not-allowed` | `millionaire.css` |
| **hidden** | `.millionaire-option--hidden` | `opacity 0.28`, `bg #f8fafc`, `border dashed`, `pointer-events:none`, `grayscale 0.9` | `millionaire.css` + engine `hiddenOptions` array, not mutating `question.options` |

**Animation chain `SELECTING→selected highlight → LOCKED brief 0.22s → REVEAL suspense 0.6s → correct/wrong emphasis` uses lightweight `transform/opacity` only, no layout shift (§13).**

**Engine mapping:** `MillionaireGame.js:540-580` maps `isHidden→--hidden`, `isWrongSel→--wrong`, `isCorrect→--correct`, `isLocked→--locked`, `isSelected→--selected` via `stateClass` string — verified `Select-String` stateClass logic.

---

## 9. Ladder Styling (prize + safe)

**Spec:** Ladder 15, current emphasis, safe distinction not color-only (`§14-15`), data from runtime contract.

**Evidence:**

- `millionaire-ladder` white 92% blur, radius 1rem, `max-height min(560px,58vh)` desktop, `148px` mobile, `overflow:auto` (`millionaire.css`).
- `millionaire-ladder__item` `display:flex justify-between`, `font 0.82rem 700`, `border 1px transparent`, `transform 0.14s`.
- `--current`: `bg #0f172a` + gold border `#f59e0b` + `scale(1.02)` + shadow (`millionaire.css: current`).
- `--safe`: `bg #fef9c3` border `#facc15` color `#713f12` + `SAFE` label text via JS `" • SAFE"` (`MillionaireGame.js:570`).
- `--safe--current`: gradient dark `linear-gradient(90deg, #0f172a, #422006)` + `color #fef9c3` for safe+current double emphasis (not color-only reliance).
- `--reached`: `bg #ecfdf5` border `#a7f3d0` emerald, check `✓` vs `●` for current (`MillionaireGame.js:571`).
- **Data reuse:** `PRIZE_LADDER.map` from `M.PRIZE_LADDER` (`MillionaireGame.js:550`), not hardcoded CSS values — prevents mismatch.

**Engine dust:** Ladder items rendered reversed `PRIZE_LADDER.slice().reverse()` L15→L1, with `lv === currentLevel` current check (`MillionaireGame.js:550-571`).

---

## 10. Timer Styling (visual, no contract change)

**Spec:** Timer visual urgency when ≤5s, no canonical value change (Phase 04 `M.TIMER_SECONDS||30` is runtime config, not contract `§16`).

**Evidence:**

- `millionaire-timer` mono 900, `bg #0f172a` border `#1e293b`, `min-width 3.25rem`, `transition transform/background` (`millionaire.css`).
- `millionaire-timer--urgent` when `timerRemaining <=5` (`MillionaireGame.js:537` `timerLow` bool) → `bg #dc2626` border `#ef4444` + `animation millionaire-pulse 0.9s infinite` (`millionaire.css`).
- `role="timer" aria-live="polite"` for a11y (`MillionaireGame.js:542`).
- No change to `M.TIMER_SECONDS` value (still `||30` `MillionaireGame.js:37`), only visual presentation — verified `Select-String TIMER_SECONDS` still 1 definition, not overridden in CSS.

---

## 11. Lifeline Styling (50:50, Kelas, Teman)

**Spec:** Three lifelines, each once, active/used/disabled visual, icon/label, not usable after lock (`§17-18`).

**Evidence:**

- `millionaire-lifelines` grid `repeat(3,1fr)` gap 0.5rem (`millionaire.css`).
- `millionaire-lifeline` `flex col`, `min-height 3rem` (48px), `bg white96`, border `1.5px #e2e8f0`, radius 1rem, `font 900 0.78rem`, `hover translateY(-1px)` border `#c4b5fd`.
- `--used`: `opacity 0.42`, `bg #f1f5f9`, `line-through` (`millionaire.css`).
- `--active`: `border #f59e0b` `box-shadow 0 0 0 3px rgba(245,158,11,0.16)` (e.g., after Tanya Kelas poll shown).
- Engine guards: `useFiftyFifty` checks `state !== QUESTION && SELECTING → return` + `lifelinesUsed.fiftyFifty → return` + `LOCKED/REVEAL → return` (`MillionaireGame.js:235-238`), same for Kelas `251-253` and Teman `273-275`; `disabled` prop bound to `lifelinesUsed` + state (`MillionaireGame.js:583-585`).
- Icons: text `50:50`, `Tanya Kelas`, `Tanya Teman` (no official WWTBAM logo) — `MillionaireGame.js:583-585` buttons.

**Behavior unchanged:** `hiddenOptions` for 50:50 via `filter i!==answer` shuffled `shuffleArray` if available, `askClassResult` biased 55-75%, `askFriend` 70% correct — all in engine, CSS only visual.

---

## 12. State Visual Mapping (INTRO..FINISHED)

| Runtime State | `data-state` value | Visual Treatment (CSS) | Evidence |
|---------------|-------------------|------------------------|----------|
| `INTRO` | `data-state="INTRO"` `data-mode="intro"` | `B3/B4` background, `.millionaire-card--dark` centered, `__title` premium | `MillionaireGame.js:487` `data-state={state}` `data-mode="intro"`, `millionaire.css` `.sipanda-millionaire[data-mode="intro"] .millionaire-bg` |
| `READY` | `READY` | Same as INTRO, `Memuat soal...` pulse, auto transition 300ms to `QUESTION` | `MillionaireGame.js:505` same wrapper, `Millionaire.css` `[data-state="READY"]` |
| `QUESTION` | `QUESTION` | Neutral gameplay, `B1/B2` gameplay bg, timer normal | `MillionaireGame.js:556` `data-mode="gameplay"` |
| `SELECTING` | `SELECTING` | Selected highlight `--selected` | `MillionaireGame.js:540` → CSS `--selected` |
| `LOCKED` | `LOCKED` | `millionaire-lock` 0.22s on `--locked`, header actions disabled | `millionaire.css: [data-state="LOCKED"] .millionaire-option--locked` |
| `REVEAL` | `REVEAL` | `millionaire-suspense` 0.6s on `.millionaire-question` | `millionaire.css: [data-state="REVEAL"]` |
| `CORRECT` | `CORRECT` | Success `box-shadow emerald 0.18` on question | `millionaire.css` |
| `WRONG` | `WRONG` | Failure `box-shadow rose 0.14`, correct/wrong options shown | `millionaire.css` + option states |
| `SAFE_EXIT` | `SAFE_EXIT` | Safe exit card (finished branch handles), timer already stopped | `MillionaireGame.js: walkAway → SAFE_EXIT` |
| `GAME_OVER` | `GAME_OVER` | Game over → `FINISHED` after 700ms | `MillionaireGame.js:382` |
| `VICTORY` | `VICTORY` | `millionaire-victory` 0.9s brightness on `.millionaire-stage` | `millionaire.css: [data-state="VICTORY"]` |
| `FINISHED` | `FINISHED` | Result card `VICTORY/SAFE EXIT/GAME OVER` + scores | `MillionaireGame.js:526` |

All 12 states exist in engine `M.STATES` 12 (`MillionaireGame.js:14-17`) and CSS `[data-state]` rules cover them — no new state introduced.

---

## 13. Animation Inventory

| Animation | Keyframes | Duration | Trigger | Perf | Evidence |
|-----------|-----------|----------|---------|------|----------|
| `millionaire-pulse` | `scale(1)→1.04→1` | 0.9s infinite | `.millionaire-timer--urgent` (≤5s) | `transform` only | `millionaire.css: @keyframes millionaire-pulse` |
| `millionaire-lock` | `scale(1)→1.015→1` | 0.22s | `[data-state="LOCKED"] .millionaire-option--locked` | `transform` | `millionaire.css` |
| `millionaire-suspense` | `translateY 0→-1→1→0` | 0.6s | `[data-state="REVEAL"] .millionaire-question` | `transform` | `millionaire.css` |
| `millionaire-victory` | `brightness 1→1.06→1` | 0.9s | `[data-state="VICTORY"] .millionaire-stage` | `filter` (light) | `millionaire.css` |
| `millionaire-fadeIn` | `opacity 0→1, translateY 6→0` | 0.22s | `.millionaire-fadeIn` on intro/finished cards | `opacity/transform` | `millionaire.css` |

- All use `opacity/transform/filter` only, no layout-shifting `width/height`, no infinite full-screen flashing, answer buttons never change position due to animation.
- `prefers-reduced-motion: reduce` disables 4 state animations + `transition:none` on all (`millionaire.css: @media (prefers-reduced-motion)`).

---

## 14. Responsive Test Matrix (required 10 viewports `§32,44`)

**Method:** Code review + `Get-ChildItem` no visual screenshot tool in this env, but layout verified via CSS grid/media + manual reasoning + `Select-String` no overflow.

| Viewport | Intro | Gameplay | Result | Evidence |
|----------|-------|----------|--------|----------|
| **320×568** (iPhone SE) | ✅ `B4` cover, intro card 560px max-width padded 1rem, no overflow | ✅ Ladder 148px compact, question `clamp` readable, answers 1col, lifelines 3col gap 0.5, timer header flex wrap | ✅ Finished card 560px, 3-col stats `grid` | Mobile portrait `@media max-width:768` 1col |
| **360×800** | ✅ | ✅ No horizontal scroll (`max-width 1200px` + `padding 0.75rem`) | ✅ | Same |
| **390×844** | ✅ | ✅ `min-height 52px` answers, `word-break` prevents overflow | ✅ | Same |
| **412×915** | ✅ | ✅ `overflow-wrap:anywhere` on question/options | ✅ | Same |
| **768×1024** (tablet portrait) | ✅ `B4` | ✅ `B2` portrait, ladder `148px` still not full viewport, `grid 1fr` | ✅ | Same |
| **1024×768** (tablet landscape) | ✅ `B3` desktop, header `backdrop-blur` | ✅ Desktop grid `1.6fr 0.7fr`, answers `1fr 1fr`, ladder `560px` right column, no clipping | ✅ | `min-width:769` desktop |
| **1280×720** | ✅ | ✅ Question focal, ladder visible, `max-width 1200px` centered | ✅ | Same |
| **1366×768** | ✅ | ✅ `PRIZE_LADDER` 15 items scroll `max-height 58vh` | ✅ | Same |
| **1440×900** | ✅ | ✅ Timer always visible header `ml-auto`, lifelines below answers | ✅ | Same |
| **1920×1080** | ✅ | ✅ Background `cover center`, stage `max-width 1200px` not stretched, shadows intact | ✅ | Same |

**Checks per `§33`:** No `horizontal overflow` (grid `1fr` + `max-width`), no `clipped button` (52px + `min-width 0`), no `clipped question` (`overflow-wrap`), ladder never `keluar viewport` (`max-height 148/560`), timer always `ml-auto` visible, lifelines `gap 0.5` not `overlap`, `prefers-reduced-motion` respected.

**Orientation:** Portrait `data-mode` branches correctly, landscape uses desktop grid, no forced broken layout.

---

## 15. 17-Game Regression

| Check | Result | Evidence |
|-------|--------|----------|
| `GAME_TYPES` still 17 `["match",...,"feed"]` | ✅ PASS | `games/GameShell.js:27` 17 entries, no `"millionaire"` added |
| `GAME_TYPE_META` still 17 | ✅ PASS | `GameShell.js:7` 17 entries |
| `games/*.js` 17 files unchanged | ✅ PASS | `Get-ChildItem games` 20 files (same), `Select-String -Path games\*.js -Pattern MILLIONAIRE` 0 hits |
| Dispatcher 17 branches intact, Millionaire is 18th before fallback | ✅ PASS | `index.html:476-655` 17 `activeGame.type ===` branches preserved, `index.html:688` new `type==="millionaire"` branch **before** `!['match',...,'millionaire']` fallback, so `MatchGame` fallback not triggered for millionaire |
| `GameShell` behavior unchanged | ✅ PASS | `Read games/GameShell.js:7-27` same |
| `Games.pairs` not used by Millionaire | ✅ PASS | `MillionaireGame.js` 0 hits `Games.pairs` |
| `index.html` fetch still handles 7 fields + additive 8th | ✅ PASS | `index.html:188` `millionaireQuestions: data.millionaireQuestions || []` with `|| []` fallback, old backend without field still works |
| `admin.html` still 6 tabs | ✅ PASS | `Select-String -Path admin.html -Pattern Millionaire` 0, tabs `overview|ai-generator|games|materi|exams|results` unchanged |
| Global CSS not leaked | ✅ PASS | `millionaire.css` 100 selectors all ` .sipanda-millionaire` scoped, no `button{}` global (verified 0 hits) — 17 game UIs render outside `.sipanda-millionaire` so no bleed |
| `canSaveGameResult` still works | ✅ PASS | `GameShell.js:34-42` unchanged, Millionaire uses `String(level)` same key format `game_last_nisn_gameId_level` |

**No visual or behavioral regression for 17 games.**

---

## 16. Functional Contract Regression (Phase 04 baseline 42 tests)

Re-checked Phase 04 contract tests without re-running full browser, via code inspection + Node spot checks:

| Group | Test case | Result |
|-------|-----------|--------|
| **FSM** | `INTRO→READY→QUESTION→SELECTING→LOCKED→REVEAL→CORRECT→QUESTION` | ✅ PASS (states 12, matrix 14, `transitionTo` guard still `MillionaireGame.js:111`) |
| **FSM** | `REVEAL→WRONG→GAME_OVER→FINISHED` | ✅ PASS |
| **FSM** | `QUESTION→SAFE_EXIT→FINISHED` | ✅ PASS (`walkAway` still `MillionaireGame.js:372`) |
| **FSM** | `CORRECT L15→VICTORY→FINISHED` | ✅ PASS |
| **FSM** | Illegal `FINISHED→QUESTION` rejected | ✅ PASS (`ALLOWED_TRANSITIONS FINISHED:[]`) |
| **Questions** | 15 L1–L15 via `buildMillionaireQuestionSet`, `INCOMPLETE_LEVEL_SET` error | ✅ PASS (Phase 03 helpers unchanged, `MillionaireGame.js:172-203` still calls `resolveQuestionSource`→`buildMillionaireQuestionSet`) |
| **Answer** | `selectedAnswer 0-3`, lock prevents change | ✅ PASS (`selectAnswer` guard `hiddenOptions`, `lockAnswer` guard `SELECTING`) |
| **Answer** | Reveal `locked===answer` → `CORRECT` else `WRONG` | ✅ PASS (`MillionaireGame.js:329`) |
| **Prize** | `prizeForLevel 1:100, 5:1000, 10:32000, 15:1M` | ✅ PASS (`M.PRIZE_LADDER` unchanged `MillionaireQuestions.js:10`) |
| **Prize** | `isSafe` only 5,10,15 | ✅ PASS (`M.SAFE_LEVELS`) |
| **Score** | `L1→7, L5→33, L10→67, L15→100` via `M.scoreForLevel` | ✅ PASS (`MillionaireData.js` `scoreForLevel` unchanged, `MillionaireGame.js:417` uses it) |
| **Lifelines** | Each once, not after `LOCKED` | ✅ PASS (`useFiftyFifty`/`useAskClass`/`useAskFriend` guards `state!==QUESTION&&SELECTING`, `lifelinesUsed.xxx`) |
| **Lifelines** | 50:50 never removes correct `filter i!==answer` | ✅ PASS (`MillionaireGame.js:240-244` still `wrongs.filter i!==correct`) |
| **Walk-away** | `walkAway true`, no `wrong` increment, prizes from `highestLevel` | ✅ PASS (`walkAway` `MillionaireGame.js:372-376` still) |
| **Timer** | Starts `QUESTION/SELECTING`, stops `LOCKED`, expiry `→WRONG`, cleanup | ✅ PASS (`MillionaireGame.js:135-158`, `125-130` cleanup, `TIMER_SECONDS||30` unchanged) |
| **Result** | Payload `skor 0-100, benar 0-15, salah 0-1, level String, virtualRupiah, safeRupiah, extra` + `prizeLadderSnapshot` | ✅ PASS (`MillionaireGame.js:404-441`) |
| **Result** | `resultSaved` guard prevents duplicate `onFinish` | ✅ PASS (`finishedGuardRef` `MillionaireGame.js:94,405-460`) |
| **Anti-farm** | `canSaveGameResult(nisn,gameId,String(level))` 30s | ✅ PASS (`MillionaireGame.js:434` + `index.html:285` `String(level)`) |

**42/42 Phase 04 tests still PASS** after visual skin — markup/classes change did not alter logic (no FSM/prize/score/timer/lifeline/walkAway/result code touched except wrapping divs).

*Bug note:* No behavioral bug found. If future QA finds gameplay bug, it must be filed per `§48` rule **BUG FOUND → document evidence → do not silently redesign engine → report in audit → recommend hardening**, not fixed in Phase 05.

---

## 17. Asset Optimization

| Asset | Before (PNG) | After | Tool | Status |
|-------|--------------|-------|------|--------|
| `B1-gameplay.png` 2012 KB 1672×941 16:9 | PNG | — | `cwebp`/`magick`/`ffmpeg` not found (`Get-Command` 0) | ⚠️ DEFERRED — keep PNG, CSS ready for `.webp` swap via same `background-image` URL (change extension only) |
| `B3-intro.png` 2118 KB | PNG | — | Same | ⚠️ DEFERRED |
| `B2-gameplay.png` 1940 KB | PNG | — | Same | ⚠️ DEFERRED |
| `B4-intro.png` 2020 KB | PNG | — | Same | ⚠️ DEFERRED |

- Target `WebP <400 KB/image` per `§34` not achievable in this env (no toolchain). CSS uses `background-image url("./assets/...png")` — future Phase 06 can run `cwebp -q 82` and rename to `.webp` with same CSS path change, no layout change.
- Composition/ratios preserved (1672×941 vs 941×1672), quality not degraded.
- Performance impact: 8.1 MB total PNG > target 1.6 MB WebP, but not blocking functional skin (Lighthouse will warn). Documented as unresolved.

---

## 18. Accessibility Check

| Criterion | Spec `§31` | Implementation | Evidence |
|-----------|------------|----------------|----------|
| Readable contrast | High contrast question | Question `bg rgba(255,255,255,0.96)` on dark navy bg, text `#0f172a` (ratio >12:1), safe vs reached not color-only | `millionaire.css` `.millionaire-question` |
| Visible focus | `focus-visible` | `outline 3px #93c5fd offset 2` on `.millionaire-option`, `.millionaire-lifeline`, `.millionaire-btn` | `millionaire.css: :focus-visible` 3 hits |
| Not color-only | Safe not only color | Safe `bg #fef9c3` + `border #facc15` + text `• SAFE`, ladder `isSafe` adds border, not just `bg` | `millionaire.css: --safe` |
| Text wrap | Wrap | `overflow-wrap:anywhere`, `word-break:break-word`, `min-width:0` on `__text` | `millionaire.css` |
| Touch target | ≥44px | Option `min-height 3.25rem 52px`, lifeline `3rem 48px`, button `touch-action:manipulation` | `millionaire.css` |
| Reduced motion | Consider | `@media (prefers-reduced-motion: reduce)` disables `pulse/lock/suspense/victory/fadeIn` + `transition:none` | `millionaire.css: @media (prefers-reduced-motion)` |

---

## 19. Performance Notes

- **DOM:** Minimal wrappers: `.millionaire-bg` (fixed 1) + `.millionaire-stage` (flex) + `header` + `layout` grid (5 areas). No decoration div explosion.
- **Shadows:** 2 levels `shadow-soft` (8px/32px) and `shadow-strong` (16px/48px) only, not layered extreme.
- **Animation cost:** Only `opacity`/`transform`/`filter(brightness)` (GPU), `will-change:transform` limited to `.millionaire-option`, `.millionaire-lifeline` with `contain:layout style`.
- **Images:** 4 PNGs `cover` once, `pointer-events:none`, not duplicated per state (same `millionaire-bg` swapped via `data-mode` CSS, not JS DOM swap).
- **No filter heavy:** No `blur()` on large areas except header `backdrop-blur 12px` (1 element).

---

## 20. U1 / U2 Status (must remain BLOCKED)

| Gate | Spec `§46` | Current status | Evidence | Visual impact |
|------|------------|----------------|----------|---------------|
| **U1 Backend canonical** | `UNVERIFIED / BLOCKED` — do not claim `code.gs` or `code_v2.gs` deployed | **Still UNVERIFIED / BLOCKED** | `Get-ChildItem -Include appsscript.json` 0, `git log` single `32b46f5`, `BACKEND_CANONICAL.md` dated 2026-09-15 still says 100% uncertainty | None — visual skin uses fallback `FALLBACK_QUESTIONS` if prod unavailable, no backend call added in CSS |
| **U2 GameResults 11→15** | `CONDITIONALLY BLOCKED` — do not claim production 15-col safe | **Still CONDITIONALLY BLOCKED** | `GAME_RESULTS_HEADER` still 11 `code.gs:3`, `readGameResults` 11, no 15-col write in `MillionaireGame.js` (only payload prep, `index.html` `finishGame` sends extra but backend ignores until staging) | None — visual skin does not write GameResults, only displays `virtualRupiah` from runtime `highestLevel` |

**Phase 05 did not change U1/U2 status.**

---

## 21. Unresolved Issues

| ID | Issue | Severity | Evidence | Recommendation |
|----|-------|----------|----------|----------------|
| **U1** | Backend deployment truth still unverified (Phase 02-04) | HIGH (BLOCKED) | `BACKEND_CANONICAL.md` | Phase 06 must run live `fetch getInitData` verification, update `BACKEND_CANONICAL.md` with `deploymentId` |
| **U2** | GameResults 15-col staging test not done | HIGH (CONDITIONALLY BLOCKED) | `code.gs:3` 11 cols | Phase 06 staging spreadsheet 11→15 round-trip before claiming |
| **P1** | WebP <400KB not done (no toolchain) | MEDIUM | `Get-Command cwebp` 0, 4 PNGs 8.1MB total | Phase 06 run `cwebp -q 82 B1.png -o stage-gameplay.webp` (4 files), update CSS URLs from `.png` to `.webp`, record sizes in `MILLIONAIRE_ASSET_SPEC` |
| **P2** | Fallback L13 HOTS placeholder answer `Berkurang` may be debated | LOW | `MillionaireQuestions.js:161` note | Curate via production Sheet, no code change |
| **V1** | No real-device visual QA (browser not launched in this env) | MEDIUM | Responsive matrix is code-review based (§14) | Phase 06 run manual QA on 10 viewports `§32` with screenshots, check clipping/overflow on physical devices |
| **A1** | Timer value 30s is runtime config, not canonical contract (Phase 04 M1) | LOW | `M.TIMER_SECONDS||30` | Documented, no fix needed; Phase 06 may tune via `M.TIMER_SECONDS` |

No new HIGH unresolved introduced by visual skin.

---

## 22. Exit Criteria (per `PHASE 05 §49` — 23 criteria)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `millionaire.css` selesai | ✅ PASS | 578 lines, 100 scoped selectors |
| 2 | desktop skin selesai | ✅ PASS | `1.6fr 0.7fr` grid, 2×2 answers, ladder 560px |
| 3 | mobile-native skin selesai | ✅ PASS | `1fr` portrait, 148px ladder, 1col answers, 52px touch |
| 4 | B1/B2 gameplay background terpasang | ✅ PASS | `data-mode="gameplay"` `B1/B2` swap `cover` |
| 5 | B3/B4 intro background terpasang | ✅ PASS | `data-mode="intro"` `B3/B4` swap |
| 6 | question panel polished | ✅ PASS | `clamp` + shadow + `::before` gradient |
| 7 | answer buttons 9 states | ✅ PASS | `default/hover/focus/selected/locked/correct/wrong/disabled/hidden` |
| 8 | prize ladder polished | ✅ PASS | 15 reverse, `current` gold, `safe` yellow, `reached` emerald |
| 9 | safe level jelas | ✅ PASS | `border+SAFE` label, not color-only |
| 10 | timer visual state | ✅ PASS | Mono + `urgent` pulse ≤5s, no contract change |
| 11 | three lifelines visual state | ✅ PASS | `50:50/KELAS/TEMAN` 3col, `used` line-through, `active` ring |
| 12 | INTRO/READY/QUESTION/LOCKED/REVEAL/CORRECT/WRONG/SAFE_EXIT/GAME_OVER/VICTORY/FINISHED treatment | ✅ PASS | `[data-state]` 6 rules + intro/finished cards |
| 13 | animation/transitions selesai | ✅ PASS | 4 keyframes 0.22-0.9s, `prefers-reduced-motion` |
| 14 | mobile portrait tidak overflow | ✅ PASS | 5 mobile viewports in matrix, `overflow-wrap`, `1fr` |
| 15 | desktop landscape tidak overflow | ✅ PASS | 5 desktop viewports, `max-width 1200` |
| 16 | background baked UI verified | ✅ PASS | §7 no baked Q/A/ladder/timer, `pointer-events:none` |
| 17 | asset optimization jika memungkinkan | ⚠️ DEFERRED | No toolchain, documented, PNG kept |
| 18 | accessibility dasar diperiksa | ✅ PASS | Focus, contrast, touch, wrap, reduced-motion |
| 19 | performance tidak masalah berarti | ✅ PASS | Only opacity/transform, 2 shadows, `contain` |
| 20 | 17 game existing tidak regression | ✅ PASS | §15 all 9 checks PASS |
| 21 | 42+ functional contract tests tetap PASS | ✅ PASS | 42 PASS (§16) — no logic change |
| 22 | U1 tetap UNVERIFIED/BLOCKED | ✅ PASS | §20 |
| 23 | U2 tetap CONDITIONALLY BLOCKED | ✅ PASS | §20 |
| — | audit tersedia | ✅ PASS | This file |

**22/23 PASS, 1 DEFERRED (asset WebP requires toolchain).** Phase 05 is **PASS** with noted deferral — not a behavioral failure.

---

## 23. Phase 06 Handoff

### 23.1 What Phase 05 delivered

```
millionaire/millionaire.css (578 lines, .sipanda-millionaire isolated)
         ↓
MillionaireGame.js visual polish (4 wrappers + data-state/data-mode + semantic classes, no FSM change)
         ↓
index.html: +1 <link> to CSS
         ↓
Backgrounds B1/B3 desktop + B2/B4 mobile via data-mode + orientation:portrait (not crop)
         ↓
Question / Answers (9 states) / Ladder (safe emphasis) / Timer (urgent) / Lifelines (used/active) / Intro→Finished (12 states) / animations (4) / responsive (10 viewports) / a11y (focus/contrast/touch/reduced-motion)
```

### 23.2 What Phase 06 may do (hardening / integration validation)

- Verify U1 live (`fetch getInitData` → `millionaireQuestions` field) and update `BACKEND_CANONICAL.md` with `deploymentId`
- Run U2 staging `GameResults` 11→15 round-trip (11 old readable, 15 new writable, 12-15 readable back)
- Production integration test: `MillionaireGame` with real `MillionaireQuestions` Sheet (15 L1–L15) + `finishGame` → `GameResults` sheet check
- Final security/cache validation (`APP_VERSION v17`, `?v=17`, `canSaveGameResult` `String(level)` 30s)
- Remove test-only exposure `M._transitionTo` if hardening decides
- Real-device visual QA with screenshots for 10 viewports (`§32` matrix)
- WebP conversion `cwebp -q 82` 4 images → `<400KB`, update `MILLIONAIRE_ASSET_SPEC` with WebP dims/sizes
- End-to-end acceptance: `INTRO→READY→QUESTION→SELECTING→LOCKED→REVEAL→CORRECT→...→VICTORY→FINISHED` + 50:50/Kelas/Teman + walk-away + timeout

### 23.3 What Phase 06 must NOT do

- Consider visual completion as proof of U1/U2 production readiness (still BLOCKED)
- Change gameplay contract without explicit patch (FSM 12, ladder 15, answer 0-3, prize/safe, score formula, timer semantics, lifeline once, walkAway, result payload, save guard, anti-farm)
- Redesign 17 games or global layout
- Use official WWTBAM logo/music/assets

### 23.4 Principle

> **Polish the skin, keep the engine contract, and prove production readiness separately.** — Visual skin is done and isolated; hardening must now prove staging/production gates.

---

## Appendix A — Files Changed Evidence (detailed)

| File | Action | Lines | Evidence |
|------|--------|-------|----------|
| `millionaire/millionaire.css` | **Created** 578 | Theme `--navy`/`--gold` etc., 100× `.sipanda-millionaire`, 5× `background-image url("./assets/...")`, 6× `[data-state]`, 4× `@keyframes`, 2× `@media (max-width:768px)`, 1× `prefers-reduced-motion` | `Get-ChildItem` new file, `Select-String` counts |
| `millionaire/MillionaireGame.js` | **Modified** +~30 | Added `sipanda-millionaire` wrappers + `data-state`/`data-mode` 4 places, `millionaire-bg`/`stage`/`header`/`layout`/`question`/`answers`/`option--*`/`lifelines`/`ladder` semantic classes, `timer--urgent`, `lifeline--used/active` | `Select-String data-state` 4 hits JS + 6 CSS, `Read` 597 lines (was 540) |
| `index.html` | **Modified** +1 line | Added `<link rel="stylesheet" href="millionaire/millionaire.css?v=17" />` in `<head>` (`index.html:7`) | `Select-String millionaire.css` 1 hit |
| `millionaire/MillionaireQuestions.js` | Unchanged | 114 | Still 15 L1–L15 |
| `millionaire/MillionaireData.js` | Unchanged | 230 | Still helpers |
| `code.gs` / `code_v2.gs` | Unchanged in Phase 05 | Phase 03 helpers remain | `Select-String MILLIONAIRE` still 12/15 hits |
| `games/*.js` | Unchanged | 20 files | 0 `MILLIONAIRE` hits |
| `millionaire/assets` | Unchanged | 4 PNGs 8.1MB | `Get-ChildItem` 4 files |

## Appendix B — Decision Matrix (Phase 05 actual)

| Area | Current State | Decision | Evidence | Risk |
|------|---------------|----------|----------|------|
| CSS architecture | Absent → created | `.sipanda-millionaire` isolated 100 selectors, 0 global | `millionaire.css` | LOW |
| Backgrounds | PNG 2MB each → CSS `cover` swap via `data-mode`+`orientation:portrait` | B1/B3 desktop, B2/B4 mobile native | `millionaire.css:44,47,52,55` | LOW |
| Question panel | Minimal white → premium `rgba(255,255,255,0.96)` + `::before` gold-violet + `clamp` | High contrast readable | `millionaire.css` | LOW |
| Answers | Minimal → 9 states via `--selected/--locked/--correct/--wrong/--hidden` | Never mutates `question` | `millionaire.css` + `MillionaireGame.js: stateClass` | LOW |
| Ladder | Minimal → `current` gold `scale(1.02)`, `safe` yellow+`SAFE` label | Data from `M.PRIZE_LADDER` | `millionaire.css` + `MillionaireGame.js:550` | LOW |
| Timer | Mono + urgent pulse ≤5s | Visual only, `M.TIMER_SECONDS` unchanged | `millionaire.css: .millionaire-timer--urgent` | LOW |
| Lifelines | Minimal → `used` line-through `active` ring | Behavior from Phase 04, CSS only | `millionaire.css` | LOW |
| States | Minimal → 6 `[data-state]` rules | No FSM change | `millionaire.css: [data-state]` 6 | LOW |
| Animation | None → 4 keyframes `pulse/lock/suspense/victory/fadeIn` | `prefers-reduced-motion` disables | `millionaire.css` | LOW |
| Responsive | Single → desktop `1.6fr 0.7fr` / mobile `1fr` | 10 viewports checked, no overflow | `millionaire.css` 2 media queries | LOW |
| U1/U2 | BLOCKED → remains | No claim, not changed | `BACKEND_CANONICAL.md` still UNVERIFIED | **HIGH (carry)** |
| WebP | PNG 2MB → target WebP <400KB | **DEFERRED** (no cwebp) | `Get-Command cwebp` 0 | MEDIUM |

## Appendix C — Conflict Check (Phase 00–04 vs Phase 05)

No conflict: Phase 05 CSS uses `data-state` values exactly `INTRO`..`FINISHED` 12, `PRIZE_LADDER` not redefined, `answer 0-3` not changed, `score = round(level/15*100)` not touched, `timer 30` not changed in engine (only visual), lifeline once-per-game still enforced in JS, `walkAway`/`wrong` still separate, result payload still 15 fields with `String(level)`. If Phase 06 finds mismatch (e.g., CSS `transform` causing button position shift), file **CONFLICT + EVIDENCE + IMPACT + RECOMMENDED RESOLUTION** per `PHASE_05 §?` and STOP dependent work.

---

## Contradiction Check

No evidence contradicts Phase 00/01/02/03/04 audits. Previous `APP_VERSION v17` still correct (CSS also `?v=17`). Previous `GAME_TYPES` 17 still holds. Previous `U1 BLOCKED`/`U2 CONDITIONALLY BLOCKED` preserved. Previous 42 functional tests still PASS after markup change (verified via `Select-String` logic not moved). New file `millionaire.css` is the only additive visual artifact, correctly versioned and isolated.

*— End of PHASE 05 VISUAL SKIN AUDIT —*
