# PHASE 10A — AUDIT: GAME RESULTS PHYSICAL SCHEMA MIGRATION (11 → 15, HEADER ONLY)

**Tanggal:** 2026-09-16
**Scope audit:** `code.gs` (fungsi baru), harness, regresi repo
**Hasil:** PASS — siap checkpoint, tanpa deployment

---

## 1. File yang berubah

- `code.gs` — **74 insertions, 0 deletions**. Hanya penambahan:
  - `classifyGameResultsSchema_(headerRow, lastCol)` — helper klasifikasi murni
    (tanpa efek samping): `"canonical15"` | `"legacy11"` | `"mismatch"`.
  - `setupGameResultsSchema()` — migrasi fisik header-only, manual-run.
- Tidak ada baris existing yang diubah/dihapus (0 deletions).
- Tidak tersentuh: `code_v2.gs`, `millionaire/*`, `games/*`, `index.html`,
  `admin.html`, `docs` lain. `git diff --name-only` → hanya `code.gs`
  (+ file audit ini sebagai untracked baru).

## 2. Header sebelum / sesudah

- Source of truth tidak berubah: `GAME_RESULTS_HEADER` tetap 15 kolom Phase 10,
  `GAME_RESULTS_SHEET` tetap `"GameResults"` (gagal bila berbeda → STOP).
- Kasus legacy 11 (`waktu…durasiDetik`, lastCol ≤ 11 atau kolom 12+ kosong):
  SEBELUM `[11 nama]` → SESUDAH `[11 nama + level,virtualRupiah,safeRupiah,extra]`
  = canonical 15. Sel 1–11 tidak ditulis ulang.
- Kasus canonical 15: SEBELUM == SESUDAH (NO-OP, 0 writes).
- Kasus mismatch/parsial/kosong/hilang: tidak ada SEBELUM→SESUDAH (throw).

## 3. Hasil test idempotency — PASS

Harness `phase10a_test.js` (mengeksekusi `code.gs` asli via eval, mock
`SpreadsheetApp`): **pass 30 / fail 0**.

- T1: sheet 11 kolom → `{ok:true, sheet:"GameResults", migrated:true, headerValid:true}`,
  header menjadi canonical 15.
- T2: run ke-2 dan ke-3 → `{migrated:false, headerValid:true}`, snapshot sheet
  byte-identical, tidak ada kolom baru.
- T3: sheet canonical 15 (baris lama 11 + baris baru 15) → NO-OP, untouched.
- T8: sheet melebar 15 via data Phase 10 tetapi header masih 11 nama →
  `migrated:true` (dilengkapi 4 nama), run ulang NO-OP.
- T9: grid longgar (maxCols 26) → 0× `insertColumnAfter`, tetap `migrated:true`.

## 4. Hasil preservation data — PASS

- T1: 2 baris historis 11 kolom byte-identical sesudah migrasi (isi + lebar 11).
- T8: baris lama 11 + baris Millionaire 15 untouched (header saja dilengkapi).
- T4/T5: header salah total maupun parsial (`...durasiDetik,level` setengah) →
  throw diagnostik (`"bukan schema lama 11 kolom dan bukan canonical 15 kolom"`
  + `"TIDAK diubah"`), snapshot sheet identik.
- T6 (sheet hilang → `"tidak ditemukan"`, tanpa membuat sheet) dan T7
  (sheet kosong → STOP `"kosong"`): tidak ada tulis apa pun.
- Mekanisme tulis terbatas pada baris 1 kolom 12–15
  (`setValues([GAME_RESULTS_HEADER.slice(11)])` + bold); guard
  `while (getMaxColumns() < 15) insertColumnAfter(...)` hanya melebarkan grid
  kosong di ujung (tidak menggeser data). Tidak ada `appendRow`/rewrite historis.

## 5. Hasil regression — PASS

- T10: 25/25 fungsi ada (23 Phase 03–10 + 2 baru), `setupGameResultsSchema`
  tepat 1 definisi & callable; T11: reader Phase 10 tetap membaca baris 11+15.
- Re-run harness Phase 10 (`phase10_test.js`) terhadap `code.gs` terbaru:
  **pass 30 / fail 0** — write path, reader, dan `getInitData` tidak berubah perilaku.
- 17 game existing + Millionaire backend tidak tersentuh (diff hanya `code.gs`;
  tidak ada edit `games/`, `millionaire/`, `index.html`, `admin.html`).
- `code_v2.gs` utuh (tidak tercantum di diff).
- `node --check` (via salinan `.js` byte-identical): OK.

## 6. Status: PASS

Exit criteria terpenuhi: syntax OK, migrasi 11→15 terbukti, NO-OP 15 terbukti,
mismatch STOP tanpa perubahan, data historis utuh, idempoten, tanpa regresi.

Residual: fungsi ini kode-saja (belum dijalankan terhadap spreadsheet produksi —
JANGAN DEPLOY pada phase ini); operator menjalankannya manual dari editor Apps
Script terikat dan memverifikasi header L–O sebelum deployment Phase 10.
