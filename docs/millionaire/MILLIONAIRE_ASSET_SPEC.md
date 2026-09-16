# MILLIONAIRE ASSET SPEC

## Master background set

- B1 — Desktop Gameplay
- B2 — Mobile Gameplay
- B3 — Desktop Intro
- B4 — Mobile Intro

The current source files may remain JPG during design. Final production
assets can be optimized to WebP after visual approval.

## Target repository

``` text
millionaire/
└── assets/
    └── backgrounds/
        ├── desktop/
        │   ├── stage-gameplay.webp
        │   └── stage-intro.webp
        └── mobile/
            ├── stage-gameplay.webp
            └── stage-intro.webp
```

## B1 — Desktop Gameplay

16:9. Active gameplay. Keep visual space for question UI, answer UI,
host area, and prize ladder. No baked dynamic UI.

## B2 — Mobile Gameplay

9:16. Smartphone portrait. Portrait-native composition, not a desktop
crop. Keep the central area visually calm for question and answer UI.

## B3 — Desktop Intro

16:9. Opening screen. Branding may be prominent. Dynamic Start/player UI
remains HTML.

## B4 — Mobile Intro

9:16. Opening screen. Portrait-native. Leave room for HTML Start/player
UI.

## Visual direction

Deep navy, electric blue, purple depth, gold accents, soft white/cyan
highlights. Premium cinematic TV game-show atmosphere, modern and
suitable for upper-elementary students.

## Background rules

- Background provides atmosphere only.
- Question, answers, ladder, lifelines, timer, score, and game-state UI
  are HTML/CSS/JS.
- Background must never block touch/pointer interaction.
- Avoid dense detail behind the main UI.
- Avoid unnecessary baked-in text.
- Host/characters remain separate assets.

## Responsive layout

Desktop: Host \| Question \| Prize Ladder; then answers and lifelines.
Mobile: Header → Level/Prize → Question → A/B/C/D → Lifelines.

## Production optimization

After approval: verify dimensions, use native target ratios, convert to
WebP, compress for web, and record final dimensions/file sizes.
