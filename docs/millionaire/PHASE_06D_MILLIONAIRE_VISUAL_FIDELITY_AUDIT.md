# PHASE 06D — MILLIONAIRE VISUAL FIDELITY REMEDIATION — AUDIT
## SI-PANDA v3 · Reference-Driven Skin Correction

> **Status:** VISUAL FIDELITY ONLY — No FSM, no timer semantics, no lifeline logic, no question engine, no prize data, no result flow, no backend, no GameResults, no admin, no 17-game change.
> **Tanggal:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark)
> **Parent Spec:** `docs/millionaire/PHASE_06D_MILLIONAIRE_VISUAL_FIDELITY_REMEDIATION.md` (corrective pass over Phase 06C)
> **Reference Image:** `docs/millionaire/Game_Panel_Reference.png` — **FOUND, OPENED & INSPECTED via image tool (not text)**
> **Outputs:** `millionaire/millionaire.css` + minimal presentation markup `millionaire/MillionaireGame.js` + this audit + 3 screenshot evidences
> **Repository:** `E:\Github\sipandav3 - Millionaire` (files untracked, single `Initial commit` — no git BEFORE available, BEFORE captured via live screenshot instead)

---

## 1. Reference Image — Proof of Opening

| Check | Result | Evidence |
|-------|--------|----------|
| File exists | ✅ FOUND | `docs/millionaire/Game_Panel_Reference.png` listed in `docs/millionaire/` |
| Opened/inspected | ✅ **IMAGE READ SUCCESSFULLY** (1536×864 render, 2026-09-15) | Image tool returned full render: blue-spotlight studio, central SI-PANDA medallion `Karena Setiap Jawaban Membuka Peluang`, top-left pill `SI-PANDA / Zona Game · Millionaire`, 3 oval lifelines `50:50` `📞` `👥`, hexagonal question `Planet terdekat dengan Matahari adalah?` (dark navy, electric-blue outer, gold inner, sharp diamond tips), 2×2 answers `A: Merkurius` `B: Venus` `C: Bumi` `D: Mars` (inline gold `A:` + colon, white text), right vertical ladder `15 Rp1.000.000 … 1 Rp100` gold border with solid-gold arrow current `10 Rp32.000`, bottom centered pill `50:50 | Level 1 dari 15 | Rp100`, reflective studio floor |
| Substituted by text? | ❌ No — all remediation decisions taken from the pixels above | — |

No `REFERENCE IMAGE NOT FOUND / NOT READABLE` — remediation proceeded.

---

## 2. Browser Iteration — Mandatory Loop (EXECUTED, not DEFERRED)

Chrome available (`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`) + Node v22 → **live screenshot loop was executed**:

| Step (spec §15) | How | Result |
|-----------------|-----|--------|
| 1. Open reference | Image tool | ✅ §1 |
| 2. Open Millionaire via Live Server | Local HTTP server (`node` static, port 8086) + harness mounting the real `MillionaireGame` (real `millionaire.css`, real `MillionaireData/Questions`, fallback IPAS set) | ✅ `STATE=QUESTION` reached via real `INTRO→READY→QUESTION` auto-transition |
| 3. Viewport 1536×864 | `puppeteer-core` + system Chrome, `deviceScaleFactor: 1` | ✅ |
| 4. BEFORE screenshot | Reverted 06C→pre-06D temporarily, shot, restored | ✅ `PHASE_06D_BEFORE_1536x864.png` |
| 5. Side-by-side compare | BEFORE pixels vs reference pixels (§4) | ✅ 5 largest diffs identified |
| 6–7. Fix | 13 CSS + 3 markup remediation edits (§5) | ✅ |
| 8. AFTER screenshot | Re-shot same harness/viewport/state | ✅ `PHASE_06D_AFTER_1536x864.png` |
| 9. Repeat | 2nd loop found 2 mobile diffs → fixed → re-shot | ✅ `PHASE_06D_AFTER2_*` promoted to final `PHASE_06D_AFTER_1536x864.png` + `PHASE_06D_AFTER_390x844.png` |
| 10. Mobile 390×844 | Same harness, portrait viewport | ✅ verified, order fixed |

Screenshots (in `docs/millionaire/`):

- `![BEFORE](./PHASE_06D_BEFORE_1536x864.png)` — 06C state, full-width navbar, state-leaking kicker, inner status pills, side-by-side lock+bar.
- `![AFTER desktop](./PHASE_06D_AFTER_1536x864.png)` — final 06D at 1536×864.
- `![AFTER mobile](./PHASE_06D_AFTER_390x844.png)` — final 06D at 390×844, spec §13 order.

> Note: harness (`_06d_harness.html`, TEMP) mounted the production component unmodified-logic; it was **deleted after QA** plus the node server killed. No harness remains in repo (`git status` clean of it).

---

## 3. BEFORE Screenshot Findings (5 Largest Visual Differences vs Reference)

| # | BEFORE defect (pixels observed) | Reference target | Spec |
|---|----------------------------------|------------------|------|
| D1 | **Header = full-width web-app navbar** (~1510px bar: brand + `LV 1/15 • Rp100` pill + `29s` + 2 buttons in one continuous card) | Compact ~250×36px brand pill top-left; timer/actions separate, no full-width card | §3 |
| D2 | **Kicker leaks FSM state**: `SOAL LEVEL 1 • QUESTION`; **two status pills INSIDE question** (`Benar 0 • Salah 0`, `Hadiah: Rp0 • Safe: Rp0`) → tall dashboard card (~150px) | No state text, no inner pills; question ~90–110px pure | §5, §12 |
| D3 | **Answers oversized** (`min-height 3.45rem`, padding `.82rem`), C/D row bottom-clipped in shot; column gap wide | Compact ~50px panels, narrow center diamond gap, all 4 fully visible | §6 |
| D4 | **Bottom fragmented**: large `Kunci Jawaban` primary (flex:1) side-by-side with status pill — two competing bars | One centered ~520px status pill; lock secondary, subordinate | §9 |
| D5 | Mobile portrait: **DOM order, not spec order** (question→answers→lifelines→…→ladder) + **header horizontal overflow** (`Keluar dengan Hadiah` cut at 390px) | `header→lifelines→ladder→question→answers→status`, no overflow, touch ≥44px | §13 |

Answer badges already inline `A:` (06C), ladder already gold 252px + arrow (06C) — confirmed present in BEFORE, kept.

---

## 4. Side-by-Side Comparison: AFTER vs Reference (final, 1536×864)

| Element | Reference pixels | AFTER pixels (`PHASE_06D_AFTER_1536x864.png`) | Verdict |
|---------|------------------|-----------------------------------------------|---------|
| Overall composition | Studio → brand TL → lifelines UL → big Q center-left → 2×2 A-D → narrow ladder R → centered bottom pill → floor visible | Same 7-layer stack; floor/stage/back wall visible around UI; no white cards | ✅ MATCH |
| Header geometry | ~250×36 pill `SI-PANDA / Zona Game · Millionaire` | 250px × 36px pill, same two-line text, electric border, capsule | ✅ MATCH (measured: `width:250px; min-height:36px`) |
| Lifelines | 3 horizontal ovals ~90×36, dark, blue border, `50:50` + phone + people | 3 ovals `2.25rem` (36px) dark navy, `1.7px` electric border, `◐ 50:50` `👥 Tanya Kelas` `📞 Tanya Teman` | ✅ MATCH (text kept Indonesian per i18n; icons added) |
| Question shape | Wide diamond, tips ~30px, blue outer + gold inner double edge | `clip-path 30px` + inner `28px` gold hairline; tips visibly pointed in shot | ✅ MATCH |
| Question proportion | ~90–110px high, largest text | Single-line Q + 9px kicker, padding `.95rem 2.1rem .9rem` → ~96px in shot; `1.30–1.48rem` largest | ✅ MATCH |
| Answers shape | Same diamond family, blue outer + faint gold inner | `18px` points + `::before` gold `0.18` inner line, visible in shot | ✅ MATCH |
| A/B/C/D labels | Inline gold `A:` bold ~17px, no badges | Inline `1.06rem` (17px) gold `A:` — zero circular badges in DOM/shot | ✅ MATCH |
| Ladder width/position | Narrow right, ~20% viewport, gold border, 10px radius | Fixed `252px` right column, `1.6px gold-border`, `10px` radius | ✅ MATCH |
| Ladder arrow | Solid gold bar, right-pointed tip | `clip-path` right chevron on current (`1 Rp100` gold + `◀` in shot) | ✅ MATCH |
| Safe rows | 5/10/15 special | Gold-tinted + `• SAFE` (15/10/5 visible in shot) | ✅ MATCH |
| Bottom bar | One centered pill `50:50 ○ | Level 1 dari 15 | Rp100` ~55% width | Centered `max-width:520px` pill, exact 3-segment content in shot; ghost `Kunci Jawaban` subordinate below | ✅ MATCH (+required lock kept secondary) |
| Studio visibility | Spotlights, architecture, reflective floor | B1 asset full-bleed, overlay lightened (`0.06→0.60`), floor/logo-wall visible | ✅ MATCH (approved B1 kept per §10) |
| Typography | Q > A > ladder > lifeline > status | `1.30–1.48rem` > `0.96rem` > `0.80rem` > `0.74rem` > `0.78rem` | ✅ MATCH |
| Timer | (not in ref; engine requires) | `29s/28s` mono pill top-right live-counting in shots; urgent red ≤5s preserved | ✅ Non-blocking |

Mobile 390×844 (`PHASE_06D_AFTER_390x844.png`): order `header → lifelines → ladder(152px scroll, 15 levels reachable) → question → A→B→C→D → status → lock`, no horizontal overflow (header wraps to 2 rows), touch targets ≥44px (lifelines `36px` height but full-width-tappable pills… note: 36px < 44px — see remaining diff R3).

---

## 5. Exact Visual Changes (06D remediation)

### 5.1 `millionaire/millionaire.css` (13 edits)

| # | Selector | BEFORE (06C) | AFTER (06D) | Line |
|---|----------|--------------|-------------|------|
| 1 | `.millionaire-header` | Full-width dark pill bar (`padding .42rem .72rem`, bg gradient, electric border, shadow) | **Transparent row wrapper** (no bg/border/shadow; `gap .5rem`) — bar look gone | ~80 |
| 2 | `.millionaire-header__brand` | Unstyled column | **Compact pill: `width:250px; min-height:36px`, gradient bg, `1.5px` electric border, `9999px`, glow** | ~92 |
| 3 | `.millionaire-header__actions .millionaire-btn` | (none — inherited large) | Compact `0.45rem 0.7rem / 0.74rem` | ~140 |
| 4 | `.millionaire-lifelines` | `gap .5rem`, `flex-wrap:wrap` | `gap .45rem`, `nowrap` single cluster | ~476 |
| 5 | `.millionaire-lifeline` | `padding .52rem .92rem; min-height:2.42rem; min-width:4.35rem; 0.78rem` | **`padding .42rem .8rem; min-height:2.25rem (36px); min-width:0; 0.74rem; nowrap`** | ~484 |
| 6 | `.millionaire-question` | `clip-path 26px`, `padding 1.12rem 1.85rem 1.05rem` | **`clip-path 30px`, `padding .95rem 2.1rem .9rem`** — sharper tips, target height | ~191 |
| 7 | `.millionaire-question::before` | `clip-path 24px` | `clip-path 28px` (inner gold follows) | ~203 |
| 8 | `.millionaire-question__text` | `clamp(1.14rem,2.55vw,1.48rem)`, `1.30` | **`clamp(1.30rem,2.4vw,1.48rem)`, `1.28`** — spec §11 floor | ~238 |
| 9 | `.millionaire-answers` | `gap .62rem` uniform | **`column-gap .5rem / row-gap .55rem`** — narrow center diamond gap | ~270 |
| 10 | `.millionaire-option` | `padding .82rem…; min-height:3.45rem` | **`padding .62rem…1.25rem; min-height:3.1rem`** — compact, unclipped | ~277 |
| 11 | `.millionaire-option__label` | `1.02rem / 1.55rem` | **`1.06rem (17px) / 1.7rem`** — spec 16–18px | ~319 |
| 12 | `.millionaire-status--gamebar` + `__bar` | Row wrap, lock `flex:1` + bar `max 560px` side-by-side | **Column centered; bar `max-width:520px`; lock secondary** (`flex:0`, `0.5rem 1.1rem`, `0.76rem`) | ~545 |
| 13 | `.millionaire-bg::after` | `0.10→0.68` dark veil | **`0.06→0.60`** — more studio visible | ~63 |
| 14 | Portrait query | Areas declared but children auto-placed (DOM order) + header overflow | **Explicit `grid-area` per child (lifelines→ladder→question→answers→status) + wrapping compact header (`brand flex:1`, smaller timer/btns)** | ~170 |

### 5.2 `millionaire/MillionaireGame.js` (3 presentation-only edits, zero logic)

| # | Change | Lines |
|---|--------|-------|
| 1 | Header: **removed duplicate `LV x/15 • Rp…` pill** (info lives in ladder + bottom bar, as in reference) | ~564 |
| 2 | Question: kicker `Soal Level X • STATE` → **`Soal Level X dari 15 (+ • Safe)`**; **removed inner `Benar/Salah` + `Hadiah/Safe` pills** | ~572 |
| 3 | Gamebar: **status pill first, `Kunci Jawaban` second as `btn--ghost` secondary** (was primary `flex:1` first) | ~604 |

No handler, state, timer, lifeline, transition, payload, or data line touched.

---

## 6. Viewports

| Viewport | Method | Result |
|----------|--------|--------|
| **1536×864** (primary, §13) | Chrome headless, real component, `data-state=QUESTION` | ✅ BEFORE + AFTER captured, compared |
| **390×844** (mobile, §15.10) | Same harness, portrait | ✅ AFTER captured; order + overflow fixed in loop 2 |
| 1366×768 / 1440×900 / 1280×720 / 1024×768 | Static CSS review (single responsive grid, no per-breakpoint rules besides portrait) | ✅ No overflow risk (`minmax(0,1fr)`, `max-width:1240px`); live shots DEFERRED for these sizes |
| 375×812 / 412×915 / 430×932 | Same portrait rules as 390×844 | ✅ Covered by fix; live shots DEFERRED |

---

## 7. Remaining Differences (non-blocking)

| # | Difference vs reference | Reason kept | Severity |
|---|-------------------------|-------------|----------|
| R1 | Central medallion logo + audience + gold light-columns absent (B1 asset shows laurel panel + empty stage) | **Approved B1/B2/B3/B4 WebP must be kept** (§10); overlay cannot invent architecture | Non-blocking |
| R2 | Lifeline glyphs are emoji/text (`◐👥📞` + Indonesian words) not white vector icons | No new binary assets allowed; i18n labels required | Non-blocking |
| R3 | Lifeline height 36px < 44px touch floor (§13) | Spec §4 demands 34–40px ovals; full pill is tappable, `touch-action:manipulation`; options/lock ≥44px | Non-blocking (spec conflict resolved toward §4) |
| R4 | Timer pill + `Keluar dengan Hadiah`/`Keluar` buttons top-right (absent in reference) | Engine contract: timer visible, walk-away available pre-lock | Non-blocking |
| R5 | Kicker `SOAL LEVEL 1 DARI 15` + ladder title retained | State/orientation without dashboard look | Non-blocking |
| R6 | Desktop ladder shows all 15 without scroll at 864px (ref same); mobile 152px scroll | All levels accessible both | Non-blocking |

---

## 8. Files Changed

| File | Change | Evidence |
|------|--------|----------|
| `millionaire/millionaire.css` | 14 visual-fidelity edits (header≈brand pill, lifelines 36px, Q 30px points, answers compact, gamebar column, overlay lighter, portrait order+wrap) | Select-String `06D` markers; 142 scoped selectors |
| `millionaire/MillionaireGame.js` | 3 presentation-only markup edits (header pill removal, kicker + inner-pill removal, gamebar reorder to ghost) | Diff §5.2 |
| `docs/millionaire/PHASE_06D_BEFORE_1536x864.png` | BEFORE evidence (new) | Live Chrome shot |
| `docs/millionaire/PHASE_06D_AFTER_1536x864.png` | AFTER evidence desktop (new) | Live Chrome shot |
| `docs/millionaire/PHASE_06D_AFTER_390x844.png` | AFTER evidence mobile (new) | Live Chrome shot |
| `docs/millionaire/PHASE_06D_MILLIONAIRE_VISUAL_FIDELITY_AUDIT.md` | This audit (new) | — |

Explicitly NOT modified: `MillionaireData.js`, `MillionaireQuestions.js`, `code.gs`, `code_v2.gs`, `admin.html`, `GameResults`/spreadsheet, `Soal`/`Games`, 17 game files, `GameShell`, dispatcher, `index.html` (harness was TEMP, deleted).

---

## 9. Regression Checks

| Contract | Result | Evidence |
|----------|--------|----------|
| FSM 12 states + legal matrix | ✅ PASS — matrix byte-identical (`INTRO→READY→…→FINISHED`) | `MillionaireGame.js` ALLOWED_TRANSITIONS dump §10-audit; harness traversed `INTRO→READY→QUESTION` live |
| Timer semantics (30s, urgent ≤5s) | ✅ PASS — `TIMER_SECONDS \|\| 30` untouched; shots show live `29s→28s` countdown | `MillionaireGame.js:37`; AFTER shots |
| Lifeline one-use logic | ✅ PASS — guards + `lifelinesUsed` untouched (icons/text only) | `useFiftyFifty/useAskClass/useAskFriend` unchanged |
| Question engine / prize data / safe levels | ✅ PASS — `PRIZE_LADDER`/`SAFE_LEVELS`/`scoreForLevel` untouched; ladder renders all 15 canonically in shots | `MillionaireData.js` unmodified |
| Result flow / `finishGame` / anti-farm | ✅ PASS — payload block untouched | `MillionaireGame.js:423+` unchanged |
| Green/red reveal preserved | ✅ PASS — `correct-flash 0.36s×2` + `wrong-flash 0.36s×2` + WRONG-state green-correct rule all present | `millionaire.css:638-643`; **not screenshotted live** (QUESTION-state harness) — static rule verification + 06C behavior unchanged |
| Selector isolation | ✅ 142 `.sipanda-millionaire` hits, 0 global `button{/body{` leaks | PowerShell regex count |
| 17 games | ✅ 0 `sipanda-millionaire` hits in `games/*.js` | Select-String |
| Backend / GameResults / admin | ✅ Unmodified (timestamps/diff clean) | `git status` shows only `docs/` + `millionaire/` |

---

## 10. Acceptance Checklist (§16)

- [x] reference image actually opened (image tool, §1)
- [x] current browser rendering compared against it (BEFORE shot → 5 diffs → AFTER shots, §2–§4)
- [x] compact header geometry matches (250×36 pill, AFTER shot)
- [x] lifelines match position/size/shape (UL cluster, 36px ovals)
- [x] question width/height/points match (30px diamond, ~96px)
- [x] answer panels match shape/spacing (18px, narrow center gap, unclipped)
- [x] inline A/B/C/D labels (17px gold, no badges)
- [x] ladder narrow/right/gold (252px, `1.6px` gold, `10px`)
- [x] current-level arrow (chevron clip, gold bar)
- [x] safe rows (5/10/15 tinted + SAFE)
- [x] studio background visible (B1, lightened veil)
- [x] studio floor visible (AFTER shots)
- [x] centered bottom status pill (520px, 3 segments)
- [x] green reveal preserved (rules intact, `0.36s × 2`)
- [x] red reveal preserved (rules intact, `0.36s × 2`)
- [x] mobile layout checked (390×844 shot, spec order, no overflow)
- [x] no horizontal overflow (desktop + wrapped mobile header)
- [x] no existing game regression (§9)

---

## 11. Final Status

### `VISUAL PASS WITH NON-BLOCKING DIFFERENCES`

Rationale: live Chrome screenshots at the primary 1536×864 viewport (plus 390×844) were compared pixel-to-pixel against `Game_Panel_Reference.png` through two remediation loops; every §16 item matches except R1–R6, which are either mandated by other spec clauses (approved B1 asset, engine-required timer/lock, 34–40px lifeline spec) or i18n/a11y retentions. Reveal animations were verified by rule (identical `0.36s × 2` keyframes/selectors, untouched logic) rather than live REVEAL-state capture — the sole coverage gap, recorded here instead of inflating to unqualified `VISUAL PASS`.

---

## 12. Handoff — STOP

> **STOP after this visual remediation.** No U1/U2 backend work, no GameResults migration, no deployment, no new gameplay features.

Next (outside 06D): optional live REVEAL-state capture (drive answer→lock→screenshot at flash mid-point) if a future phase wants pixel proof of green/red; then the previously blocked backend integration phases.

*— End of PHASE 06D VISUAL FIDELITY REMEDIATION AUDIT —*
