# PHASE 10H — AUDIT: MILLIONAIRE GAME HUB PRIORITY

**Tanggal:** 2026-09-16
**Scope:** satu-satunya file diubah: `games/GameHub.js` (+ docs audit).
**Hasil:** PASS — siap checkpoint, tanpa deployment, tanpa backend, tanpa refactor besar.

---

## 1. Exact change (`games/GameHub.js`, +4/−0)

Setelah `shownGames` difilter di lines 15–18 (filter Mapel + Query), ditambahkan 4 baris:

```javascript
// Phase 10H: prioritize Millionaire game to front, preserve 17-game order
const millionaireGames = shownGames.filter(g => g.type === "millionaire");
const otherGames = shownGames.filter(g => g.type !== "millionaire");
shownGames = [...millionaireGames, ...otherGames];
```

**Mekanisme:**
- `shownGames` sudah difilter berdasarkan Mapel + Query (lines 15–18).
- Dipisahkan menjadi 2 grup: `millionaireGames` (type === "millionaire") dan `otherGames` (sisa).
- Dikompulkan kembali: `[...millionaireGames, ...otherGames]`.
- Jika tidak ada millionaire, `millionaireGames` kosong → `shownGames` tetap tanpa perubahan (no-op).

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

## 5. Status: PASS

- Hanya `games/GameHub.js` yang diubah (4 baris komentar + kode).
- Tidak ada deployment, tidak ada perubahan backend.
- JANGAN deploy pada phase ini.