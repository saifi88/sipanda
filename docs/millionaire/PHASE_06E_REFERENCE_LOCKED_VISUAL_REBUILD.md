# PHASE 06E — REFERENCE-LOCKED MILLIONAIRE VISUAL REBUILD
## SI-PANDA v3 · Strict screenshot-driven correction

> PURPOSE: Make the Millionaire rendered skin visually converge to `Game_Panel_Reference.png`.
> This phase is VISUAL ONLY. Do not change gameplay logic.

## 0. IMPORTANT: PREVIOUS 06C/06D DID NOT GO FAR ENOUGH

The supplied current screenshot is still visibly different from the supplied reference.

Reference image:
`docs/millionaire/Game_Panel_Reference.png`

Current screenshot:
1366×768

Reference:
1672×941

The previous implementation improved individual components, but the **global composition is still wrong**:
- question/answers are far too high;
- prize ladder is too short;
- header contains UI absent from the reference;
- lifelines are too small and text-heavy;
- bottom status is too high;
- extra `Kunci Jawaban` is visible;
- current UI leaves a large empty/incorrect central composition instead of reproducing the reference's stage-centered arrangement.

Therefore this is a **rebuild of presentation geometry**, not another small CSS tuning pass.

---

# 1. VISUAL SOURCE OF TRUTH

Open BOTH:

1. `docs/millionaire/Game_Panel_Reference.png`
2. the current Millionaire page through VS Code Live Server in Chrome.

The reference image is authoritative.

Do NOT infer the target from the current screenshot.

If the reference cannot be opened:
STOP with:
`REFERENCE IMAGE NOT FOUND / NOT READABLE`

If Live Server/Chrome is unavailable:
STOP with:
`LIVE BROWSER QA UNAVAILABLE`
Do not claim visual PASS.

---

# 2. FIRST: REMOVE NON-REFERENCE UI

The following visible UI elements are NOT present in the reference and must NOT remain visible in the final game-show composition:

### REMOVE/HIDE VISUALLY

- timer pill in the top-right;
- `Keluar dengan Hadiah` visible button;
- `Keluar` visible button;
- `SOAL LEVEL X DARI 15` kicker inside the question panel;
- `PRIZE LADDER · 15 LEVEL` title;
- `SAFE` text in ladder rows if it materially changes the reference appearance;
- `Kunci Jawaban` visible button/text below the game;
- duplicate level/prize information in the top header;
- any application/dashboard-like pill that is not represented in the reference.

IMPORTANT:
This means **presentation only**. Do not delete or change the underlying walk-away/lock/timer/gameplay functions. If a control is required by existing logic, keep the logic but visually suppress it or move it to a non-obtrusive accessible mechanism without changing behavior.

Do not add replacement UI.

---

# 3. GLOBAL COMPOSITION — THIS IS THE MAIN FIX

The current page is wrong because the whole gameplay block is vertically positioned too high.

At the reference aspect ratio, the central gameplay cluster sits in the **lower-middle of the studio**, leaving the central SI-PANDA stage/logo visible above it.

Target vertical hierarchy:

```text
TOP
│
├── compact SI-PANDA brand
├── lifelines
│
├── large visible studio/logo area
│
├── QUESTION PANEL
├── ANSWERS 2×2
├── BOTTOM STATUS
│
└── reflective studio floor
```

Do NOT place the question directly beneath the header.

Do NOT place the question in the upper third.

The question should begin approximately around **48–50% of viewport height** in the 1672×941 reference.

The answer rows occupy approximately **65–84%** of reference height.

The bottom status is approximately **90–96%** of reference height.

The central studio logo must remain visible above the question.

---

# 4. REFERENCE NORMALIZED GEOMETRY

Use normalized proportions, not fixed pixel assumptions from the 1672×941 image.

Approximate reference geometry:

### Header brand
- left: ~1–2% viewport width
- top: ~1–2%
- width: ~10–11%
- height: ~8–9%

### Lifelines
- left: ~4%
- top: ~10–20%
- three ovals in one horizontal row
- each approximately 7–9% viewport width
- height approximately 7–8% viewport height

### Prize ladder
- right: ~4–5%
- top: ~5–6%
- width: ~19–20% viewport width
- bottom: ~75%
- tall panel, not a short card

### Question
- left/right central area excluding ladder
- top: ~48%
- width: ~65–67% viewport width
- height: ~18–19% viewport height
- centered text
- large horizontal pointed hexagonal silhouette

### Answers
- top: ~65%
- two columns
- two rows
- width of main game area
- each row ~7–8% viewport height
- narrow vertical spacing
- pointed ends meeting toward the center

### Bottom status
- centered
- top: ~90%
- width: ~50–55% viewport width
- height: ~6–7% viewport height

These are visual targets. Validate them against the actual reference screenshot, not only these numbers.

---

# 5. QUESTION PANEL — REBUILD SHAPE AND POSITION

The question panel must be:

- BELOW the central SI-PANDA stage/logo;
- wide;
- horizontally centered in the main game area;
- approximately 65–67% viewport width;
- approximately 18–19% viewport height;
- dark navy;
- electric-blue outer edge;
- warm-gold inner edge;
- very pronounced left and right pointed ends.

It must resemble the reference silhouette:

```text
                 ______________________
             ___/                      \___
           _/                              \_
          <          QUESTION TEXT           >
           \_                              _/
             \___                      ___/
                 \______________________
```

The current 06C shape is still too shallow/upper-positioned.

The panel should visually overlap the stage-floor transition area in the same way as the reference.

Question text:
- white;
- bold;
- centered;
- approximately 1.3–1.5rem;
- two-line wrapping should follow reference width.

Do not add visual clutter inside it.

---

# 6. ANSWERS — REBUILD POSITION AND PROPORTION

The answer panels must start immediately below the question.

Target:
- 2×2;
- same pointed silhouette family as question;
- dark navy;
- strong electric-blue outline;
- thin gold accent;
- no circular badges;
- inline gold `A:` / `B:` / `C:` / `D:`;
- white answer text.

The current screenshot has the right basic shape but the entire answer group is too high and too small relative to the reference.

Move and scale the whole group together.

Do not independently optimize each card while leaving global composition wrong.

---

# 7. PRIZE LADDER — TALL, NOT SHORT

This is a major mismatch in the current screenshot.

Reference ladder:
- tall;
- right side;
- approximately 19–20% viewport width;
- begins near top;
- extends down to roughly 75% viewport height;
- gold outer frame;
- dark interior;
- 15 rows clearly visible/accessible;
- current level is a solid gold horizontal arrow.

Do NOT use a short `max-height: 60vh` card if it makes the ladder visually end halfway down the screen.

At the reference viewport, the ladder should visually dominate the full right-side vertical area.

The ladder may remain internally scrollable, but its **outer frame** must be tall.

Do not add a large title above the rows.

---

# 8. LIFELINES — MATCH REFERENCE ICON TREATMENT

The reference shows three large, clean oval controls:

```text
50:50      [PHONE ICON]      [PEOPLE ICON]
```

Target:
- large oval outlines;
- blue glowing border;
- dark center;
- minimal text;
- icons visually dominant for phone/people;
- no small dashboard-style buttons.

If Indonesian labels are retained for accessibility, they must not dominate the visible shape.

Do not use emoji if they render unlike the reference. Prefer existing icon/font mechanism or simple CSS/icon glyphs that visually resemble the reference.

Keep functionality unchanged.

---

# 9. HEADER — BRAND ONLY

The reference header is a small brand plaque.

Visible target:

```text
SI-PANDA
Zona Game · Millionaire
```

Do NOT show:
- timer;
- level;
- prize;
- walk-away button;
- exit button.

Those elements are not part of the reference composition.

Again: hide visually only; do not alter gameplay functions.

---

# 10. CENTRAL STAGE MUST REMAIN VISIBLE

This is critical.

The reference has the large SI-PANDA circular stage/logo clearly visible above the question.

The gameplay UI must NOT cover it.

Therefore:
- do not move the question upward;
- do not enlarge the question until it covers the logo;
- do not add opaque containers behind the entire game;
- preserve background transparency.

The studio itself supplies much of the visual identity.

---

# 11. BOTTOM STATUS

Reference has ONE compact status pill:

```text
50:50              Level 1 dari 15              Rp100
```

It is centered below the answer grid.

Target:
- approximately 50–55% viewport width;
- compact;
- dark navy;
- blue border;
- rounded capsule;
- visually separated from answers;
- no `Kunci Jawaban` attached;
- no duplicate controls.

If lock functionality requires a control, preserve the underlying behavior without showing an additional prominent button in the reference area.

---

# 12. COLORS

Stay with:
- deep navy;
- electric blue;
- warm gold;
- white.

Correct/wrong:
- GREEN flash remains unchanged;
- RED flash remains unchanged.

Do not modify reveal animation timing.

---

# 13. NO GLOBAL / EXISTING-GAME CHANGES

Allowed:
- `millionaire/millionaire.css`
- minimal presentation-only markup in `millionaire/MillionaireGame.js`

Forbidden:
- FSM changes;
- timer logic changes;
- lifeline logic changes;
- question/data changes;
- prize data changes;
- score/result changes;
- backend changes;
- GameResults changes;
- admin changes;
- GameShell behavior changes;
- any of the 17 existing game files.

---

# 14. MANDATORY LIVE SCREENSHOT LOOP

Use VS Code Live Server + Chrome.

Primary:
`1366×768`

Also:
`1536×864`
`390×844`

For desktop:

1. open reference;
2. open Live Server;
3. screenshot current page;
4. compare side-by-side;
5. identify the five largest geometric differences;
6. fix them;
7. screenshot again;
8. repeat.

The comparison MUST focus on:
- vertical position;
- width;
- height;
- relative spacing;
- ladder height;
- question location;
- answer location;
- bottom bar location;
- header/lifeline placement.

Only after geometry matches, tune colors/glows.

---

# 15. HARD ACCEPTANCE RULE

Do NOT declare PASS because:
- CSS contains the expected values;
- `clip-path` exists;
- selectors are scoped;
- static inspection looks plausible.

PASS requires a live screenshot comparison.

If the result is still visibly different from the reference after reasonable iterations:
report:

`VISUAL FIDELITY NOT ACHIEVED`

Do not force a PASS.

---

# 16. ROLLBACK SAFETY

If OpenCode cannot improve the rendered result toward the reference:

1. STOP.
2. Do not make additional speculative CSS changes.
3. Do not modify gameplay logic.
4. Report the exact remaining mismatches.
5. Preserve the last known-good implementation rather than stacking more visual patches.

If the current 06D changes make the result worse, rollback the 06D visual changes before stopping.

---

# 17. AUDIT OUTPUT

Create:

`docs/millionaire/PHASE_06E_REFERENCE_LOCKED_VISUAL_REBUILD_AUDIT.md`

Include:
- reference image path;
- confirmation it was opened;
- current screenshot dimensions;
- before/after screenshots if available;
- side-by-side comparison;
- major geometric differences;
- exact CSS/markup changes;
- confirmation that green/red reveal was preserved;
- files changed;
- regression checks;
- final status.

Allowed statuses:
- `VISUAL PASS`
- `VISUAL PASS WITH NON-BLOCKING DIFFERENCES`
- `VISUAL QA DEFERRED`
- `VISUAL FIDELITY NOT ACHIEVED`
- `BLOCKED`

STOP after this phase.
