# PHASE 06E — WALKAWAY FIX AUDIT (fungsi "Keluar dengan Hadiah")

> **Status:** LOGIC FIX MINIMAL — FSM/matrix/states tidak diubah; timer, lifeline, question engine, prize ladder, score, result payload, backend, GameResults, skin/layout, 17 game tidak diubah.
> **Tanggal:** 2026-09-16
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `docs/millionaire/PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `docs/millionaire/PHASE_04_GAME_ENGINE.md` (§9.9, §10, §17, §47–48) · `docs/millionaire/PHASE_06E_REFERENCE_LOCKED_VISUAL_REBUILD_AUDIT.md`
> **Live QA:** Chrome headless + local HTTP server + `puppeteer-core`, real `MillionaireGame` (fallback IPAS, `INTRO→READY→QUESTION` asli), 6 skenario klik nyata.

---

## 1. Root Cause (terbukti empiris, bukan tebakan)

**Bukan CSS/overlay/pointer-event.** Probe `elementFromPoint` pada titik tengah tombol: elemen teratas adalah `BUTTON.millionaire-btn--accent` itu sendiri, `disabled=false`, `pointer-events:auto`, `clip:auto`. Klik menembus normal — buktinya state berubah `QUESTION → SAFE_EXIT` dan timer berhenti.

**Akar masalah: guard `transitionTo()` menilai legalitas terhadap stale render snapshot.** `transitionTo` membaca `var cur = _state.state` dari closure render saat handler berjalan. Callback async (`setTimeout`) memanggil `transitionTo` tua tersebut:

| Jalur | Callback stale menilai | Matrix | Hasil |
|---|---|---|---|
| `walkAway` → `transitionTo(FINISHED)` sesudah 400ms | `QUESTION -> FINISHED` | ilegal (hanya `SAFE_EXIT -> FINISHED`) | ❌ ditolak, macet di `SAFE_EXIT` selamanya — layar identik + timer beku = "tidak merespons", payload tak pernah dibuat |
| `lockAnswer` → `transitionTo(REVEAL)` sesudah 200ms | `SELECTING -> REVEAL` | ilegal (hanya `LOCKED -> REVEAL`) | ❌ `REVEAL` terlewati (efek domino, lihat §5) |
| `lockAnswer` salah → `transitionTo(GAME_OVER)` sesudah 700ms | `SELECTING -> GAME_OVER` | ilegal (hanya `WRONG -> GAME_OVER`) | ❌ macet di `WRONG`, tak pernah `GAME_OVER`/`FINISHED` |

Evidence pra-fix (warn dari console): `illegal transition QUESTION -> FINISHED`, `SELECTING -> REVEAL`, `SELECTING -> GAME_OVER`.

## 2. File yang Diubah (satu file, 3 baris)

**`millionaire/MillionaireGame.js`** — hanya mekanik pembacaan state guard, bukan FSM:

1. Tambah mirror state komit:
   ```js
   var stateRef = React.useRef(_initial.state);
   React.useEffect(function(){ stateRef.current = _state.state; });
   ```
2. `transitionTo`: `var cur = _state.state;` → `var cur = stateRef.current;`

Badan `walkAway`, `lockAnswer`, `handleTimeout`, `selectAnswer`, matrix `ALLOWED_TRANSITIONS`, 12 states, timer, lifeline, question/prize/score/result — **nol perubahan**. Guard tetap menolak illegal transition sungguhan; kini ia menilai state komit yang benar.

## 3. Perubahan Minimal (dif konseptual)

```diff
+  var stateRef = React.useRef(_initial.state);
+  React.useEffect(function(){ stateRef.current = _state.state; });
   function transitionTo(next) {
-    var cur = _state.state;
+    var cur = stateRef.current;
```

## 4. Test QUESTION → SAFE_EXIT → FINISHED (V1, V2, V6 — PASS)

- **V1 walk-away di L1:** `QUESTION → SAFE_EXIT → FINISHED` + finished view; payload `walkAway:true`, `salah:0`, `benar:0`, `level:"0"`, `safeRupiah:0`, `virtualRupiah:0`; tombol walk-away hilang setelah FINISHED; `warns:[]`.
- **V2 walk-away di L6 (5 benar L1–L5):** `level:"5"`, `benar:5`, `salah:0`, `virtualRupiah:1000`, **`safeRupiah:1000`** (safe terakhir L5 — benar per Phase 04 §16), `skor:33`, `walkAway:true`; tidak lanjut ke soal berikutnya; `warns:[]`.
- **V6 walk-away dari SELECTING:** `SELECTING → SAFE_EXIT → FINISHED`, `walkAway:true`, `salah:0`; `warns:[]`.

## 5. Test Wrong Answer → GAME_OVER (V3 — PASS, efek domino yang ikut sembuh)

Pra-fix jalur ini macet di `WRONG` (defect sekelas yang sama). Pasca-fix satu titik: `LOCKED → REVEAL → WRONG → GAME_OVER → FINISHED` persis aturan 1 (termasuk `REVEAL` yang kini benar dilewati — perilaku FSM yang dimaksud spec, bukan state baru). Payload: `salah:1`, `benar:0`, `walkAway:false`, `safeRupiah:0`, `level:"0"`; tidak lanjut level; `warns:[]`.

## 6. Test Tombol Kembali (V5 — PASS, tidak terganggu)

Klik `Kembali` di QUESTION: `onExit` terpanggil (`exited:true`), `onFinish` tidak terpanggil (`finish:null`) — keluar/navigasi biasa, bukan walk-away, tanpa hadiah.

## 7. Regression

| Cek | Hasil |
|---|---|
| Jawaban benar L1 → L2 (V4) | ✅ PASS, `warns:[]` |
| Kembali (V5) | ✅ PASS |
| Zero `illegal transition` di semua 6 skenario pasca-fix | ✅ (pra-fix: 3 warn) |
| Timer (30s, berhenti di LOCKED/SAFE_EXIT, urgent paint) | ✅ untouched — tidak ada baris timer disentuh |
| Lifeline / question engine / ladder / score / result payload shape / backend / GameResults / skin-layout | ✅ untouched (satu file, 3 baris guard) |
| 17 game existing (`games/*.js`, `index.html` dispatcher) | ✅ untouched — mtime `games/*` 12–15 Sep (pra-sesi), tidak ada referensi `transitionTo` di luar `MillionaireGame.js` (grep kosong) |
| `M._transitionTo` exposure untuk test | ✅ dipertahankan |

## 8. File yang TIDAK Diubah

`millionaire/millionaire.css`, `millionaire/MillionaireData.js`, `millionaire/MillionaireQuestions.js`, `index.html`, `games/*` (17 game), `code.gs`, `code_v2.gs`, `admin.html`, seluruh `docs/millionaire/*` selain audit ini (dan audit PATCH EXIT sebelumnya).

## 9. Residual pre-existing (di luar scope, TIDAK disentuh)

`handleTimeout` (`QUESTION -> WRONG` saat timer 0) tetap ditolak guard karena matrix §10 tidak memiliki edge `QUESTION -> WRONG` (konflik Phase 04 §23 vs §10 — butuh keputusan matrix/FSM yang dilarang instruksi ini). Dilaporkan, tidak diperbaiki.

## 10. Final Status

### `WALKAWAY FIX PASS`

> **STOP setelah fix ini.** Harness (`_walkaway_harness.html`) dihapus; server QA dimatikan; tidak ada pekerjaan backend/deployment/skin/gameplay lain.
