# PHASE 00 — SI-PANDA MILLIONAIRE MASTER SPEC

## Status

Development baseline.

## Locked decisions

1.  SI-PANDA v3 Release is the baseline.
2.  Implementation is additive; do not perform a broad refactor.
3.  The 17 existing games must not change behavior.
4.  Millionaire is a new isolated game module.
5.  Production Millionaire questions use a dedicated Millionaire
    question source, separate from the 17-game question source.
6.  `MillionaireQuestions.js` is fallback/demo seed only, not the
    production source of truth.
7.  Existing student dashboard remains the entry point.
8.  Existing result/`finishGame()` pipeline remains the result path.
9.  Do not create a new backend/result system unless the audit proves it
    is unavoidable.
10. Millionaire has 15 levels.
11. The game displays a virtual Rupiah prize ladder.
12. Virtual Rupiah and SI-PANDA leaderboard score are separate values.
13. Desktop is landscape; mobile is portrait-native.
14. Mobile must not be a simple crop of desktop.
15. The skin uses background assets plus HTML/CSS/JS for interactive UI.
16. Do not copy official Who Wants to Be a Millionaire branding, logo,
    music, or protected assets.
17. Backgrounds must not contain dynamic UI such as questions, answers,
    timer, ladder, or lifelines.
18. Every phase produces an `.md` report.
19. Do not delete existing files.
20. Do not declare a phase complete without the required test/evidence.

## Virtual prize ladder

| Level |       Prize | Safe  |
|------:|------------:|:-----:|
|     1 |       Rp100 |       |
|     2 |       Rp200 |       |
|     3 |       Rp300 |       |
|     4 |       Rp500 |       |
|     5 |     Rp1.000 |  YES  |
|     6 |     Rp2.000 |       |
|     7 |     Rp4.000 |       |
|     8 |     Rp8.000 |       |
|     9 |    Rp16.000 |       |
|    10 |    Rp32.000 |  YES  |
|    11 |    Rp64.000 |       |
|    12 |   Rp125.000 |       |
|    13 |   Rp250.000 |       |
|    14 |   Rp500.000 |       |
|    15 | Rp1.000.000 | FINAL |

## Required states

`INTRO`, `READY`, `QUESTION`, `SELECTING`, `LOCKED`, `REVEAL`,
`CORRECT`, `WRONG`, `SAFE_EXIT`, `GAME_OVER`, `VICTORY`, `FINISHED`.

## Lifelines

- 50:50
- Tanya Kelas
- Tanya Teman

Each can be used once per game.

## Integration flow

Dashboard → GameHub/Dispatcher → MillionaireGame → Millionaire Question
Source → Gameplay → existing finishGame/Result → existing backend →
dashboard/leaderboard.

## Non-goals

- Rebuild the SI-PANDA engine.
- Rebuild the dashboard.
- Rebuild result storage.
- Replace the 17 existing games.
- Migrate the existing question bank.
