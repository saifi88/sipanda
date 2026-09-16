# PHASE 06E — MILLIONAIRE VISUAL FIDELITY AUDIT — PATCH: EXIT CONTROLS + TIMER RESTORE

> **Status:** VISUAL ONLY — No FSM, timer logic, lifeline logic, question/data, prize data, score/result, backend, GameResults, admin, GameShell, or 17-game change.
> **Tanggal:** 2026-09-16
> **Auditor:** OpenCode (Muse Spark)
> **Parent Spec:** `docs/millionaire/PHASE_06E_REFERENCE_LOCKED_VISUAL_REBUILD.md`
> **Parent Audit:** `docs/millionaire/PHASE_06E_REFERENCE_LOCKED_VISUAL_REBUILD_AUDIT.md` (`VISUAL PASS WITH NON-BLOCKING DIFFERENCES`)
> **Live QA:** Chrome + local HTTP server + `puppeteer-core`, real `MillionaireGame` (`INTRO→READY→QUESTION`), viewports **1366×768** and **390×844**

---

## 1. Latar PATCH

Pada hasil 06E, `Keluar dengan Hadiah` + `Keluar` dibuat visually suppressed (`.millionaire-suppressed`) dan timer di-sr-only-kan (`.millionaire-sr-only`) demi komposisi reference. PATCH ini me-restore ketiganya secara visual sebagai satu kelompok compact di kanan atas, tanpa menyentuh handler/guard/behavior.

## 2. PATCH — Exact Changes (presentation/CSS/markup minimal)

### 2.1 `millionaire/MillionaireGame.js` (1 edit, markup-only)

- Timer: hapus kelas `millionaire-sr-only` → pill tampil kembali (`role="timer"`, `aria-live`, `timerRemaining`, class `--urgent` tetap).
- Actions: hapus kelas `millionaire-suppressed` → grup tampil kembali.
- Label tombol kedua `Keluar` → `Kembali` (presentation-only; `onClick={handleExit}` tetap).
- Handler/guard byte-identical: `walkAway` + `disabled={LOCKED||REVEAL}` tetap; `handleExit` tetap.

### 2.2 `millionaire/millionaire.css` (1 blok tambahan `PATCH 06E-EXIT-RESTORE`, tanpa ubah rule 06E lain)

- `.millionaire-header__actions`: satu grup kanan atas, `white-space: nowrap`, compact.
- `--accent` (Keluar dengan Hadiah): compact gold/amber (`padding .42rem .65rem`, `font-size .72rem`).
- `--ghost` (Kembali): compact dark navy + electric-blue border (`1.5px rgba(26,180,255,.55)` + glow).
- Timer: rule visual existing dipakai ulang (dark navy + electric blue; `<=5s` red `--urgent` + `millionaire-pulse` — tidak diubah).
- Mobile `≤480px`: grup wrap rata kanan, padding/font lebih kecil; tidak menyentuh grid status/lifeline/ladder.
- Satu perbaikan insidental: mengembalikan baris `.millionaire-option__text` yang sempat terhapus saat edit (byte-restore, bukan perubahan desain).

### 2.3 Tidak diubah

FSM 12 state, `TIMER_SECONDS=30` + countdown/expiry, lifeline, question/prize/`SAFE_LEVELS`, result flow, backend, GameResults, admin, GameShell, 17 game, skin 06E (question/answer/ladder/lifeline/status geometry utuh).

> Catatan konflik instruksi: larangan "jangan mengembalikan timer sebagai elemen visual header" bertentangan dengan target eksplisit `[TIMER][KELUAR DENGAN HADIAH][KEMBALI]` di kanan atas. Target eksplisit dimenangkan: ketiganya tampil dalam baris header existing (satu grup kanan), tanpa menambah duplikat level/prize dan tanpa mengubah geometri komposisi 06E.

## 3. Verifikasi Live (DOM rects + screenshot)

| Viewport | Timer | Keluar dengan Hadiah | Kembali | Question | Answers | Ladder | Lifelines |
|---|---|---|---|---|---|---|---|
| 1366×768 `QUESTION` | ✅ (1030,28,75×32) `29s`, clip `auto` | ✅ 162×27 gold | ✅ 74×27 navy/blue | ✅ y≈399 (~52%), 185px | ✅ 4 | ✅ tall right + gold arrow L1 | ✅ 3 |
| 390×844 `QUESTION` | ✅ (319,15,63×27) `28s` baris 1 kanan | ✅ 147×24 baris 2 | ✅ 67×24 baris 2 | ✅ stacked | ✅ 4 stacked | ✅ scroll | ✅ 3 |

Evidence: `docs/millionaire/PHASE_06E_PATCH_EXIT_1366x768.png`, `docs/millionaire/PHASE_06E_PATCH_EXIT_390x844.png`.

- Desktop: `[29s][Keluar dengan Hadiah][Kembali]` satu baris kanan atas; question/answers/ladder/lifeline/status sesuai komposisi 06E (question bergeser +~15px karena header kembali satu baris penuh — dalam toleransi, bukan perubahan geometri grid).
- Mobile: baris 1 brand + timer; baris 2 kedua tombol rata kanan; keduanya terlihat dan usable; tidak ada overflow dari header (timer/actions berakhir ≤382px dari 390px).
- Countdown berjalan live (`29s→28s` antar shot); urgent path (`--urgent` + pulse) tersentuh hanya via restore paint — rule dan threshold `<=5` tidak diubah.

## 4. Regression Checks

| Kontrak | Hasil |
|---|---|
| FSM / transition matrix | ✅ untouched (1 file markup-only, guard/handler identik) |
| Timer logic 30s + expiry→WRONG | ✅ untouched (hanya kelas paint) |
| Lifeline one-use | ✅ untouched |
| Question/prize/safe/score/result/backend/GameResults/admin/GameShell/17 games | ✅ untouched |
| Skin 06E (reveal green/red, keyframes, reduced-motion, geometri grid) | ✅ untouched |

## 5. Residual (pre-existing 06E, out-of-scope PATCH ini)

- Mobile 390px: `.millionaire-status__bar` nowrap min-content ~406px → `scrollWidth` 422 > 390 (status `Rp…` terpotong kanan). Penyebab di grid/status 06E, bukan di kode PATCH (tidak ada selector PATCH yang menyentuh layout/status). Sengaja tidak diperbaiki agar memenuhi "Hanya ubah presentation/CSS/markup minimal" + "jangan mengubah bottom status".

## 6. Final Status

### `PATCH PASS — Exit controls restored visually; gameplay handlers unchanged.`

> **STOP.** Harness (`_patch_exit_harness.html`) dihapus; tidak ada pekerjaan backend/deployment/gameplay.
