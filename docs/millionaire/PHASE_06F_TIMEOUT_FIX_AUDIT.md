# PHASE 06F — TIMEOUT FIX AUDIT (timeout gameplay timer 0)

> **Status:** LOGIC FIX MINIMAL — Matrix/states tidak diubah; timer duration/semantics, walk-away, lifeline, question engine, prize ladder, score formula, result payload, backend/GameResults, skin/CSS, 17 game tidak diubah.
> **Tanggal:** 2026-09-16
> **Auditor:** OpenCode (Muse Spark)
> **Parent Specs:** `docs/millionaire/PHASE_04_GAME_ENGINE.md` (§10, §21–23, §47) · `docs/millionaire/PHASE_06E_WALKAWAY_FIX_AUDIT.md` (fix `stateRef` pendahulu)
> **Live QA:** Chrome headless + local HTTP server + `puppeteer-core`, real `MillionaireGame` (fallback IPAS). Timer dipadatkan ke 3s **hanya di harness** (`TIMER_SECONDS=3` pre-mount) agar timeout terpicu alami; kode timer tidak diubah.

---

## 1. Root Cause

`handleTimeout()` versi lama melakukan `transitionTo(WRONG)` langsung dari `QUESTION/SELECTING` — edge yang tidak ada di `ALLOWED_TRANSITIONS` (hanya `LOCKED->REVEAL`, `REVEAL->WRONG`, `WRONG->GAME_OVER`). Guard menolak (`illegal transition QUESTION -> WRONG`), game macet saat timer 0: interval sudah di-clear pemanggil, `wrong` ter-set, tetapi state tak pernah maju dan payload tak pernah dibuat.

## 2. File yang Diubah (satu file, fungsi `handleTimeout` saja)

**`millionaire/MillionaireGame.js`** — `handleTimeout()` ditulis ulang minimal:

```diff
   function handleTimeout() {
-    // Only if still in QUESTION/SELECTING
-    _setState(function(s){
-      if (s.state !== M.STATES.QUESTION && s.state !== M.STATES.SELECTING) return s;
-      return s;
-    });
-    // Transition to WRONG -> GAME_OVER
-    // Use state snapshot
-    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
-    _setState(function(s){
-      // Do not change if already finished
-      if (s.state === M.STATES.FINISHED) return s;
-      return Object.assign({}, s, { wrong: 1 });
-    });
-    transitionTo(M.STATES.WRONG);
-    // Next effect will handle WRONG -> GAME_OVER
+    // Timer expiry fails the active question (Phase 04 §23):
+    // QUESTION/SELECTING -> REVEAL -> WRONG -> GAME_OVER -> FINISHED.
+    // No matrix change: REVEAL is entered via direct setState (same vehicle
+    // lockAnswer uses for CORRECT/WRONG); WRONG via guarded transition.
+    // Guard reads committed state so a stale snapshot cannot mis-judge.
+    var cur = stateRef.current;
+    if (cur !== M.STATES.QUESTION && cur !== M.STATES.SELECTING) return;
+    _setState(function(s){
+      if (s.state !== M.STATES.QUESTION && s.state !== M.STATES.SELECTING) return s;
+      return Object.assign({}, s, { wrong: 1, state: M.STATES.REVEAL });
+    });
+    // Same 900ms reveal cadence as the lock flow; WRONG is legal from REVEAL,
+    // then GAME_OVER (legal from WRONG, same 700ms cadence as the lock flow),
+    // then FINISHED via the existing terminal-state effect.
+    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null; }
+    revealTimeoutRef.current = setTimeout(function(){
+      transitionTo(M.STATES.WRONG);
+      setTimeout(function(){ transitionTo(M.STATES.GAME_OVER); }, 700);
+    }, 900);
   }
```

Catatan: iterasi pertama fix ini hanya menjadwalkan `WRONG` dan terbukti empiris berhenti di `WRONG` — karena tidak ada efek yang memindahkan `WRONG->GAME_OVER` (itu milik timeout 700ms alur lock). Kabel 700ms `GAME_OVER` yang ditambahkan adalah cermin persis alur lock salah, bukan logika baru.

## 3. FSM Timeout Path (existing, kini dapat dilalui)

```text
QUESTION (timer 0, interval di-clear pemanggil — tak diubah)
  → REVEAL (direct setState + wrong=1; menghapus no-op setState lama)
  → WRONG  (transitionTo, legal dari REVEAL; 900ms cadence lock flow)
  → GAME_OVER (transitionTo, legal dari WRONG; 700ms cadence lock flow)
  → FINISHED (efek terminal existing: safe calc + payload + onFinish)
```

Tidak ada state baru, tidak ada edge matrix baru, tidak ada perubahan durasi/semantik timer (30s produksi utuh; `TIMER_SECONDS=3` hanya milik harness).

## 4. Hasil Test (11 poin VALIDASI)

| # | Validasi | Hasil |
|---|---|---|
| 1 | Timer 0 di QUESTION → tidak macet | ✅ seq `QUESTION→REVEAL→WRONG→GAME_OVER→FINISHED` |
| 2 | Timeout → WRONG → GAME_OVER → FINISHED | ✅ + finished view |
| 3 | `salah === 1` | ✅ (`benar:0`) |
| 4 | `walkAway === false` | ✅ |
| 5 | Tidak lanjut level | ✅ `level:"0"`, status bar hilang (FINISHED) |
| 6 | Efek wrong muncul | ✅ state melewati `REVEAL`+`WRONG` (hook CSS `[data-state]`); screenshot `PHASE_06F_TIMEOUT_WRONG.png`: timer merah `0s` urgent + jawaban benar hijau terungkap + penjelasan tampil (CSS tak disentuh) |
| 7 | Result payload terbentuk | ✅ full fields (`gameId/mapel/tipe/skor/benar/salah/durasiDetik/level/virtualRupiah:0/safeRupiah:0/extra+ladder snapshot`) via flow existing |
| 8 | Benar L1 → L2 | ✅ PASS |
| 9 | Walk-away L1 | ✅ PASS (`walkAway:true`, `salah:0`, FINISHED) |
| 10 | Kembali | ✅ PASS (`exited:true`, `finish:null`) |
| 11 | Nol illegal transition skenario timeout | ✅ `warns:[]` di semua 5 skenario |

## 5. Regression Walk-Away — PASS (§4 #9; payload `walkAway:true/salah:0`, FINISHED, tanpa warn)

## 6. Regression Wrong Answer (lock) — PASS (FINISHED, `salah:1`, `walkAway:false`, tanpa warn)

## 7. Regression 17 Game — PASS

`games/*` untouched (mtime terbaru 15-Sep, pra-sesi); tidak ada referensi `handleTimeout`/`SIPANDA_MILLIONAIRE` di `index.html`/`games/*` (grep kosong); `M._transitionTo` exposure dipertahankan.

## 8. File yang TIDAK Diubah

`ALLOWED_TRANSITIONS` + 12 states, interval/countdown/durasi timer, `walkAway`, lifeline, question engine/data, prize ladder, score formula, result payload builder, backend (`code.gs`/`code_v2.gs`), GameResults, `millionaire/millionaire.css`, `index.html`, `games/*` (17 game), `admin.html`.

## 9. Final Status

### `TIMEOUT FIX PASS`

> **STOP setelah timeout fix.** Harness (`_timeout_harness.html`) dihapus; server QA dimatikan; evidence screenshot `docs/millionaire/PHASE_06F_TIMEOUT_WRONG.png` dipertahankan.
