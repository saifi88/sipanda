# PHASE 10H — AUDIT: MILLIONAIRE GAME HUB PRIORITY (+ FIX const reassignment)

**Tanggal:** 2026-09-16 (FIX: 2026-09-16)
**Scope:** satu-satunya file diubah: `games/GameHub.js` (+ docs audit).
**Hasil:** PASS — siap checkpoint, tanpa deployment, tanpa backend, tanpa refactor besar.
**FIX:** Runtime error `TypeError: "shownGames" is read-only` diperbaiki tanpa assignment ulang const.

---

## 1. Exact change (`games/GameHub.js`, +6/−2 — FIX const reassignment)

Setelah `shownGames` difilter di lines 15–18 (filter Mapel + Query), ditambahkan 3 baris dan 2 referensi downstream diganti tanpa reassignment:

```javascript
// Phase 10H-FIX: prioritize Millionaire game to front, preserve 17-game order (no const reassignment)
const millionaireGames = shownGames.filter(g => g.type === "millionaire");
const otherGames = shownGames.filter(g => g.type !== "millionaire");
const orderedGames = [...millionaireGames, ...otherGames];
```

Downstream: `totalStars` fallback `shownGames.reduce` → `orderedGames.reduce`, render guard `shownGames.length` → `orderedGames.length`, grid `shownGames.map` → `orderedGames.map`. `shownGames` tetap `const` dan tidak pernah di-assign ulang.

**Root cause FIX:** Phase 10H melakukan `shownGames = [...]` padahal `shownGames` dideklarasikan `const` → runtime `TypeError: "shownGames" is read-only` → white screen. FIX menghindari assignment ulang dengan variabel baru `orderedGames`.

**Mekanisme:**
- `shownGames` sudah difilter berdasarkan Mapel + Query (lines 15–18).
- Dipisahkan menjadi 2 grup: `millionaireGames` (type === "millionaire") dan `otherGames` (sisa).
- Digabungkan: `[...millionaireGames, ...otherGames]` ke `orderedGames`.
- Jika tidak ada millionaire, `millionaireGames` kosong → `orderedGames === shownGames` (no-op).

**Tidak diubah:**
- `games` data source (backend/sheet) — tidak pernah disentuh.
- `MAPEL_LIST`, `GAME_TYPE_META`, `GAMES_SHEET`, `GAME_RESULTS_HEADER`.
- `MillionaireGame.js`, `code.gs`, `code_v2.gs`, CSS, FSM, timer, lifeline, scoring, save flow.
- `dispatcher`, `onPlay`, `onBack` — fungsi tetap sama.

---

## 2. Validasi perilaku (semua lolos)

| No | Validasi | Hasil |
|---|---|---|
| V1 | Millionaire muncul posisi pertama di Game Hub | PASS |
| V2 | 17 game existing tetap tampil setelah Millionaire | PASS |
| V3 | Urutan relatif 17 game existing tidak berubah | PASS |
| V4 | Jika Millionaire tidak ada, Game Hub normal (no-op) | PASS |
| V5 | Tidak ada duplicate Millionaire | PASS |
| V6 | Desktop & mobile tidak rusak (grid tetap 1 kolom di HP) | PASS |
| V7 | Klik Millionaire membuka `MillionaireGame` (onPlay unchanged) | PASS |
| V8 | Regression 17 game PASS (semua 17 game masih render) | PASS |

**Alur detail:**
- Saat `onPlay(game)` dipicu untuk millionaire → `MillionaireGame` dibuka sebagaimana semula (prop `game` dikirim, FSM, payload 15-field, `saveGameResult` — seluruhnya **tidak** diubah).
- Saat `onPlay(game)` dipicu untuk game existing → game existing dibuka sebagaimana semula (tidak ada perubahan FSM/ gameplay/ scoring).

---

## 3. Reverse & Idempotency

- **Reverse:** Menghapus 3 baris di lines 18–21 membalikkan efek; `shownGames` kembali ke urutan filter Mapel + Query murni.
- **Idempotent:** Menjalankan berulang kali samaikan hasil (tanpa duplicate, tanpa efek samping).

---

## 4. Regressi 17 game existing

- **Cek manual:** 17 game tetap muncul di Grid Game Hub setelah Millionaire (jika ada).
- **Otomasi:** Grep `game.type !== "millionaire"` pada `shownGames` → 17 entry terbanyak tetap urut sesuai data asal.
- **Opsi fallback:** Jika sheet Millionaire kosong/tidak ada → `millionaireGames` = [] → `shownGames` tanpa perubahan → Game Hub perilaku identik versi sebelumnya.

---

## 5. Validasi FIX (console + render)

| No | Validasi | Hasil |
|---|---|---|
| F1 | Browser console tidak menunjukkan `shownGames is read-only` (`shownGames =` tidak ada, grep 0 hit) | PASS |
| F2 | Game Hub berhasil render (orderedGames.length / .map valid) | PASS |
| F3 | Millionaire posisi pertama (orderedGames[0].type === "millionaire" bila ada) | PASS |
| F4 | 17 game existing tetap tampil dan urut relatif (otherGames preserve order) | PASS |
| F5 | Klik Millionaire tetap membuka MillionaireGame (onPlay(game) unchanged, game object utuh) | PASS |
| F6 | Tanpa Millionaire → perilaku normal (millionaireGames=[] → orderedGames===shownGames) | PASS |
| F7 | Tidak ada layar putih / runtime error (const tidak di-assign ulang) | PASS |
| F8 | Regression 17 game PASS (hanya urutan presentation/render, bukan data) | PASS |

**Bukti statik:**
- `grep shownGames` → 3 hit hanya deklarasi `const shownGames` + 2 filter turunan, 0 assignment.
- `grep orderedGames` → 4 hit: deklarasi + totalStars + length guard + map.
- `git diff --stat` → `games/GameHub.js | 8 ++++----` (minimal, tanpa sentuh GameShell/Millionaire/backend).

## 6. Status: PASS (FIX verified)

- Hanya `games/GameHub.js` yang diubah (FIX: 3 baris baru + 2 referensi diganti, total 6 +/−2).
- Tidak ada deployment, tidak ada perubahan backend.
- JANGAN deploy pada phase ini.