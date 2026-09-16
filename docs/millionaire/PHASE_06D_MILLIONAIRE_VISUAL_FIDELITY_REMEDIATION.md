# PHASE 06D — MILLIONAIRE VISUAL FIDELITY REMEDIATION
## SI-PANDA v3 · Reference-Driven Skin Correction

> STATUS: VISUAL FIDELITY ONLY.
> DO NOT change FSM, question engine, prize data, score, timer semantics, lifeline behavior, result flow, backend, GameResults, admin, or the 17 existing games.

## 0. CRITICAL PROBLEM

The previous Phase 06C audit says `docs/millionaire/Game_Panel_Reference.png` was found and inspected, but the current rendered game still does not visually match the reference closely enough.

Therefore this is a corrective visual pass.

The actual browser rendering is the authority:

REFERENCE IMAGE → inspect image → inspect DOM/CSS → implement → Chrome screenshot → compare → adjust → repeat.

Do not declare visual completion merely because CSS values look plausible.

## 1. MANDATORY REFERENCE

Open and inspect:

`docs/millionaire/Game_Panel_Reference.png`

If it cannot be found or opened:
STOP and report `REFERENCE IMAGE NOT FOUND / NOT READABLE`.

Do not substitute textual descriptions for the image.

## 2. TARGET COMPOSITION

The target is a TV game-show composition, not a dashboard.

Visual hierarchy:
1. studio background
2. compact top branding/header
3. lifelines upper-left
4. large central-left question panel
5. four answer panels immediately below
6. narrow prize ladder on the right
7. centered bottom status bar
8. visible studio floor

The studio must remain visible behind the UI.

## 3. HEADER

The current screenshot still reads too much like a web-app navbar.

Target:
- compact dark translucent pill near top-left;
- branding area approximately 240–260px wide and 32–38px high;
- electric-blue border;
- rounded capsule;
- `SI-PANDA` prominent;
- `ZONA GAME · MILLIONAIRE · IPAS` secondary gold text;
- timer/actions on the right without making the whole header look like a large dashboard card.

Do not only reduce padding. Correct the visible geometry. Minimal presentation-only markup changes are allowed if required.

## 4. LIFELINES

Target:
- three compact horizontal ovals;
- upper-left cluster;
- about 34–40px high;
- dark navy fill;
- electric-blue border/glow;
- gold/white text;
- subtle icons.

Order:
`50:50 | Tanya Kelas | Tanya Teman`

Keep existing one-use behavior unchanged.

## 5. QUESTION PANEL

Target:
- central-left and dominant;
- wide horizontal dark-navy panel;
- strong electric-blue outer edge;
- thin warm-gold inner accent;
- pronounced pointed/diamond ends;
- NOT a normal rounded rectangle;
- centered white question text;
- question is the largest gameplay text;
- approximately 90–110px high at 1536×864 reference scale.

Visual form:

          ┌───────────────────────────────┐
       ┌──┘                               └──┐
       │          QUESTION TEXT             │
       └──┐                               ┌──┘
          └───────────────────────────────┘

The pointed ends must be clearly visible.

## 6. ANSWER PANELS

Same design language as question.

Target:
- desktop 2×2;
- horizontal pointed/hexagonal panels;
- dark navy;
- electric-blue outer border;
- subtle gold inner accent;
- no circular gold badges;
- labels are inline `A:`, `B:`, `C:`, `D:`;
- labels gold and bold, about 16–18px;
- answer text white and bold;
- panels not excessively tall;
- narrow intentional center gap.

Do not turn them into ordinary rounded cards.

## 7. REVEAL — PRESERVE

The existing green/red reveal is already correct. Do not regress it.

Correct:
dark navy → locked gold → green flash → stable green.

Wrong:
dark navy → locked gold → red flash → stable red.

When wrong, the correct answer must also be identifiable in green.

Preserve:
`correct-flash: 0.36s × 2`
`wrong-flash: 0.36s × 2`

Do not change FSM or gameplay timers to solve visual issues.

## 8. PRIZE LADDER

Target:
- narrow right-aligned vertical panel;
- approximately 252px at desktop;
- dark navy/black translucent;
- warm-gold border;
- about 10px radius;
- internally scrollable;
- all 15 levels accessible.

Desktop layout target:
`grid-template-columns: minmax(0,1fr) 252px`

Current level:
- strongest gold/amber highlight;
- right-pointed arrow/chevron;
- not a rounded gold pill.

Safe levels 5, 10, 15 remain visibly special.

Do not redefine prize data.

## 9. BOTTOM STATUS

Reference target is one compact centered pill:

`50:50 ✓/○ | Level 1 dari 15 | Rp100`

Characteristics:
- centered;
- dark navy;
- electric-blue border;
- rounded capsule;
- about 50–60% of main gameplay width;
- compact.

`Kunci Jawaban`, if required by the existing engine, must remain visually secondary and must not destroy the reference composition.

## 10. BACKGROUND

Keep approved B1/B2/B3/B4 WebP assets.

The studio must remain the environmental layer:
- deep blue;
- visible spotlights;
- stage architecture;
- gold accents;
- reflective floor;
- translucent UI overlays.

Do not make the game look like opaque cards placed over a wallpaper.

## 11. TYPOGRAPHY

Hierarchy:
QUESTION > ANSWER > LADDER > LIFELINE > STATUS.

Question: bold, centered, white, approximately 1.30–1.48rem desktop.
Answers: approximately 0.95–1.00rem, bold, white.
Ladder: approximately 0.78–0.82rem.

Do not change global application typography.

## 12. REMOVE GENERIC WEB-APP SIGNALS

Compare the current screenshot against the reference and correct:
- oversized navbar;
- excessive rounded cards;
- circular answer badges;
- excessive padding;
- oversized ladder;
- blunt question shape;
- rectangular answer appearance;
- fragmented status controls;
- UI covering too much studio floor;
- inconsistent spacing;
- weak game-show hierarchy.

## 13. RESPONSIVE

Primary desktop:
`1536×864`

Also:
`1366×768`, `1440×900`, `1280×720`, `1024×768`

Mobile:
`390×844`, `375×812`, `430×932`, `412×915`

Portrait order:
header → lifelines → ladder → question → answers → bottom status.

No horizontal scrolling. Touch targets ≥44px.

## 14. ALLOWED FILES

Allowed:
- `millionaire/millionaire.css`
- minimal presentation-only markup in `millionaire/MillionaireGame.js`

Do NOT modify:
- `MillionaireData.js`
- `MillionaireQuestions.js`
- `code.gs`
- `code_v2.gs`
- `admin.html`
- `GameResults`
- `Soal`
- `Games`
- existing 17 game files
- GameShell behavior
- FSM
- timer semantics
- lifeline logic
- result logic

No new game engine.

## 15. MANDATORY BROWSER ITERATION

If Chrome/Live Server is available:

1. Open the reference image.
2. Open Millionaire through Live Server.
3. Set viewport to 1536×864.
4. Take a screenshot.
5. Compare side-by-side with `Game_Panel_Reference.png`.
6. Identify the five largest visual differences.
7. Fix them.
8. Screenshot again.
9. Repeat until remaining differences are minor.
10. Repeat at mobile 390×844.

Do not stop at static CSS inspection.

If browser screenshot QA is unavailable:
`VISUAL QA DEFERRED`

Never claim visual PASS without live screenshot comparison.

## 16. ACCEPTANCE CHECKLIST

- [ ] reference image actually opened
- [ ] current browser rendering compared against it
- [ ] compact header geometry matches
- [ ] lifelines match position/size/shape
- [ ] question width/height/points match
- [ ] answer panels match shape/spacing
- [ ] inline A/B/C/D labels
- [ ] ladder narrow/right/gold
- [ ] current-level arrow
- [ ] safe rows
- [ ] studio background visible
- [ ] studio floor visible
- [ ] centered bottom status pill
- [ ] green reveal preserved
- [ ] red reveal preserved
- [ ] mobile layout checked
- [ ] no horizontal overflow
- [ ] no existing game regression

## 17. AUDIT OUTPUT

Create/update:

`docs/millionaire/PHASE_06D_MILLIONAIRE_VISUAL_FIDELITY_AUDIT.md`

Include:
- reference image path and proof it was opened;
- before screenshot;
- after screenshot;
- exact visual changes;
- viewport(s);
- side-by-side comparison findings;
- remaining differences;
- files changed;
- regression checks;
- confirmation green/red reveal was preserved;
- final status.

Allowed statuses:
`VISUAL PASS`
`VISUAL PASS WITH NON-BLOCKING DIFFERENCES`
`VISUAL QA DEFERRED`
`BLOCKED`

## 18. FINAL DIRECTIVE

DO NOT redesign from imagination.

DO NOT treat the current screenshot as the target.

DO NOT treat plausible CSS values as proof.

The target is exactly:
`docs/millionaire/Game_Panel_Reference.png`

Make the rendered game visually converge toward that image while preserving all existing Millionaire gameplay behavior.

STOP after this visual remediation.
