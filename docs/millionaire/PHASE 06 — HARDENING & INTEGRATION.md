# PHASE 06 — HARDENING & INTEGRATION
## SI-PANDA v3 — Millionaire Game

**Status:** DRAFT FOR IMPLEMENTATION  
**Phase:** 06  
**Scope:** Hardening, Backend Verification, Production Integration, Final QA  
**Dependency:** Phase 00–05 PASS  
**Primary Goal:** Membuktikan Millionaire siap diintegrasikan secara production-safe  
**Required Audit:** `docs/millionaire/PHASE_06_HARDENING_INTEGRATION_AUDIT.md`

---

# 1. Tujuan

Phase 06 adalah fase **hardening dan integration validation**.

Tidak ada fitur gameplay baru yang dirancang pada fase ini.

Tujuan utama:

1. menyelesaikan/verifikasi U1 backend canonical;
2. menyelesaikan/verifikasi U2 GameResults 11→15;
3. membuktikan production question flow;
4. membuktikan result round-trip;
5. melakukan final E2E gameplay test;
6. melakukan real-browser/device visual QA;
7. menyelesaikan optimasi WebP jika tool tersedia;
8. memeriksa cache/version;
9. memeriksa anti-farm;
10. menghapus exposure test-only bila aman;
11. melakukan regression terhadap 17 game;
12. menghasilkan keputusan final readiness.

---

# 2. Baseline yang Dikunci

Phase 04:

- FSM 12 state;
- question lifecycle L1→L15;
- timer runtime;
- 3 lifelines;
- walk-away;
- prize ladder;
- score;
- result payload;
- save guard.

Phase 05:

- visual skin;
- responsive layout;
- B1–B4;
- answer states;
- ladder;
- timer visual;
- lifeline visual;
- state visual;
- accessibility;
- isolated CSS.

Phase 05 audit menyatakan:

```text
42/42 functional tests PASS
17-game regression PASS
Visual Skin PASS
U1 BLOCKED
U2 CONDITIONALLY BLOCKED
WebP DEFERRED
Real-device QA DEFERRED
```

Phase 06 wajib mempertahankan baseline tersebut.

---

# 3. Hard Gate Policy

Phase 06 memiliki dua gate utama.

## U1 — Backend Canonical

Harus dibuktikan backend yang benar-benar digunakan oleh deployment menyediakan:

```text
getInitData
→ millionaireQuestions
```

Tidak cukup dengan:

- membaca `code.gs`;
- membaca `code_v2.gs`;
- melihat header file;
- mengasumsikan `code_v2.gs` deployed.

Harus ada evidence deployment/live endpoint.

---

# 4. U1 Verification

## 4.1 Tujuan

Menentukan dengan evidence:

> Backend mana yang canonical untuk aplikasi yang sedang digunakan.

## 4.2 Required Evidence

Minimal:

```text
deployment identity
deployment URL
live getInitData response
millionaireQuestions field
question count
question validity
```

Jika tersedia:

```text
deploymentId
version
timestamp
```

juga dicatat.

## 4.3 Acceptance

U1 PASS hanya jika live response membuktikan:

```js
data.millionaireQuestions
```

tersedia dan dapat diproses oleh frontend.

Minimal harus tersedia bank valid sesuai contract.

---

# 5. U1 Conflict Rule

Jika:

```text
code.gs ≠ deployed backend
```

atau:

```text
code_v2.gs ≠ deployed backend
```

atau deployment tidak dapat diverifikasi:

```text
U1 = BLOCKED
```

Jangan menebak canonical backend.

Audit wajib mencatat:

```text
CONFLICT
Evidence
Impact
Recommended Resolution
```

---

# 6. Backend Canonical Documentation

Setelah U1 PASS, update:

```text
docs/millionaire/BACKEND_CANONICAL.md
```

Dokumentasi minimal:

```text
canonical file
deploymentId
deployment URL/reference
verified date
getInitData evidence
millionaireQuestions evidence
```

Jika deployment tidak dapat diverifikasi, jangan mengubah status menjadi PASS.

---

# 7. U2 — GameResults 11→15

U2 adalah gate kedua.

Current baseline:

```text
existing GameResults = 11 columns
Millionaire result contract = 15 columns
```

Phase 06 harus membuktikan compatibility.

---

# 8. U2 Required Schema

Existing first 11 columns tidak boleh berubah.

Kolom baru hanya append:

```text
level
virtualRupiah
safeRupiah
extra
```

Total:

```text
15 columns
```

Urutan canonical:

```text
waktu
nisn
nama
gameId
game
mapel
tipe
skor
benar
salah
durasiDetik
level
virtualRupiah
safeRupiah
extra
```

---

# 9. U2 Backward Compatibility

Reader harus tetap mampu membaca:

```text
11 columns
12 columns
13 columns
14 columns
15 columns
```

Data lama 11-col:

- tidak boleh crash;
- tidak boleh menggeser field;
- field baru boleh kosong/default.

Data baru 15-col:

- harus dapat ditulis;
- harus dapat dibaca kembali;
- field 12–15 harus tetap berada pada posisi canonical.

---

# 10. U2 Staging Test

WAJIB melakukan staging round-trip.

### Test A — Existing

Masukkan/read:

```text
11-column GameResults row
```

Expected:

```text
PASS
```

### Test B — Millionaire

Write:

```text
15-column result
```

Expected:

```text
PASS
```

### Test C — Readback

Read kembali row Millionaire.

Expected:

```text
level
virtualRupiah
safeRupiah
extra
```

tetap benar.

### Test D — Existing game

Save/read result game existing.

Expected:

```text
PASS
```

Tidak boleh regression terhadap existing result flow.

---

# 11. U2 Failure Policy

Jika backend masih:

```text
GAME_RESULTS_HEADER = 11
```

dan write path masih 11:

```text
U2 = BLOCKED
```

Jangan menyatakan payload frontend sebagai bukti storage compatibility.

---

# 12. Production Question Flow

Setelah U1 PASS, lakukan integration test:

```text
live getInitData
        ↓
millionaireQuestions
        ↓
resolveQuestionSource
        ↓
buildMillionaireQuestionSet
        ↓
L1 → L15
```

WAJIB membuktikan:

- production source digunakan;
- fallback tidak dicampur;
- 15 level tersedia;
- setiap level valid;
- mapel filtering tetap bekerja;
- random selection tetap bekerja jika multiple rows tersedia.

---

# 13. Production vs Fallback Test

Lakukan minimal dua skenario.

## Scenario A — Production Available

Expected:

```text
source = production
fallback = not mixed
```

## Scenario B — Production unavailable/invalid

Expected:

```text
source = entire fallback bank
```

Tidak boleh:

```text
production L1-L8
+
fallback L9-L15
```

Mixed source tetap dilarang.

---

# 14. Question Contract Validation

Production questions harus memenuhi:

```text
id
mapel
level 1–15
question
optionA-D
answer 0–3
prize
isSafe
explanation
```

Verifikasi:

- duplicate ID;
- duplicate mapel+level;
- invalid answer;
- invalid level;
- invalid prize;
- invalid safe;
- missing level.

Duplicate mapel+level tetap diperbolehkan.

---

# 15. Prize Ladder Verification

Gunakan canonical:

```text
1   Rp100
2   Rp200
3   Rp300
4   Rp500
5   Rp1.000 SAFE
6   Rp2.000
7   Rp4.000
8   Rp8.000
9   Rp16.000
10  Rp32.000 SAFE
11  Rp64.000
12  Rp125.000
13  Rp250.000
14  Rp500.000
15  Rp1.000.000 FINAL
```

Phase 06 tidak boleh membuat ladder alternatif.

Verifikasi:

```text
M.PRIZE_LADDER
M.SAFE_LEVELS
MillionaireQuestions.js
MillionaireData.js
MillionaireGame.js
```

harus konsisten.

---

# 16. Phase 04 Hardening

Review `MillionaireGame.js` untuk test-only exposure.

Khusus:

```js
M._transitionTo
```

Jika hanya diperlukan untuk test:

- evaluasi apakah aman dihapus;
- hapus hanya jika seluruh test tetap PASS;
- jangan mengubah transition behavior.

Jika dipertahankan:

- dokumentasikan alasan;
- tandai sebagai intentional test/debug exposure.

---

# 17. Timer Verification

Current runtime configuration:

```js
M.TIMER_SECONDS || 30
```

Phase 06 harus:

- memastikan timer tetap berjalan;
- memastikan cleanup;
- memastikan timeout → WRONG;
- memastikan lock menghentikan timer;
- memastikan unmount/end menghentikan timer;
- memastikan tidak ada duplicate interval.

**Jangan mengubah nilai 30 detik secara diam-diam.**

Jika ingin mengubah canonical duration:

```text
separate decision/change
```

bukan silent hardening.

---

# 18. Lifeline Verification

Test:

```text
50:50
Tanya Kelas
Tanya Teman
```

Masing-masing:

- hanya sekali;
- hanya sebelum LOCKED;
- tidak mengubah answer;
- tidak mengubah question schema;
- tidak dapat digunakan setelah lock.

50:50:

```text
2 wrong options hidden
correct option retained
```

---

# 19. Walk-Away Verification

Test:

```text
QUESTION
→ SAFE_EXIT
→ FINISHED
```

Expected:

```text
walkAway = true
wrong = unchanged
virtualRupiah = current safe/prize semantics
```

Tidak boleh dianggap sebagai wrong answer.

---

# 20. Score Verification

Score tetap:

```js
Math.round((levelReached / 15) * 100)
```

Boundary:

```text
0 ≤ score ≤ 100
```

Sample:

```text
L1  → 7
L5  → 33
L10 → 67
L15 → 100
```

Virtual Rupiah tetap terpisah dari score.

---

# 21. Result Payload Verification

Canonical Millionaire payload:

```text
gameId
title/game
mapel
tipe
skor
benar
salah
durasiDetik
level
virtualRupiah
safeRupiah
walkAway
lifelinesUsed
extra
```

`extra` minimal memuat:

```js
{
  walkAway,
  lifelinesUsed,
  prizeLadderSnapshot
}
```

Pastikan:

```text
level = String(level)
```

untuk anti-farm compatibility.

---

# 22. Result Save Flow

Expected:

```text
MillionaireGame
      ↓
finishGame()
      ↓
canSaveGameResult()
      ↓
saveGameResult
      ↓
GameResults
```

Tidak boleh membuat parallel result persistence mechanism.

`resultSaved` guard tetap wajib mencegah duplicate submission.

---

# 23. Anti-Farm Verification

Canonical key:

```text
game_last_${nisn}_${gameId}_${String(level)}
```

Cooldown:

```text
30 seconds
```

Test:

1. first save;
2. immediate duplicate;
3. same level;
4. different level;
5. existing game;
6. Millionaire.

Expected:

- first accepted;
- duplicate blocked according to existing guard;
- level type consistent.

---

# 24. Real Browser QA

Phase 05 visual matrix sebelumnya masih code-review based.

Phase 06 harus melakukan actual browser/device QA jika environment memungkinkan.

Minimal:

```text
320×568
360×800
390×844
412×915
768×1024
1024×768
1280×720
1366×768
1440×900
1920×1080
```

Periksa secara nyata:

- clipping;
- overflow;
- text wrap;
- answer buttons;
- ladder;
- timer;
- lifelines;
- background crop;
- intro;
- finished state;
- touch interaction.

Jika environment tidak mendukung real browser:

```text
DEFERRED
```

bukan PASS palsu.

---

# 25. Physical Mobile QA

Jika perangkat fisik tersedia, minimal cek:

- Android Chrome;
- iOS Safari atau equivalent mobile browser;
- portrait;
- rotate orientation;
- safe-area/notch;
- viewport height;
- keyboard interaction jika ada;
- touch latency.

Tidak wajib mengklaim semua perangkat jika tidak benar-benar diuji.

---

# 26. WebP Optimization

Jika toolchain tersedia:

convert:

```text
B1-gameplay.png → B1-gameplay.webp
B2-gameplay.png → B2-gameplay.webp
B3-intro.png    → B3-intro.webp
B4-intro.png    → B4-intro.webp
```

Target:

```text
<400 KB/image
```

Quality dapat menggunakan sekitar:

```text
q82
```

sebagai starting point.

Setelah conversion:

- verify dimensions;
- verify visual quality;
- verify CSS paths;
- verify browser loading;
- record final file sizes.

Jika toolchain tidak tersedia:

```text
DEFERRED
```

dan jangan mengklaim optimization PASS.

---

# 27. Cache / Version Validation

Verify:

```text
APP_VERSION = v17
millionaire.css?v=17
MillionaireQuestions.js?v=17
MillionaireData.js?v=17
MillionaireGame.js?v=17
```

Pastikan:

- CSS loaded;
- JS loaded;
- stale cache tidak mempertahankan old MillionaireGame;
- existing cache logic tetap bekerja.

Jangan membuat cache mechanism baru.

---

# 28. Script Loading Order

Verify dependency order:

```text
MillionaireQuestions.js
        ↓
MillionaireData.js
        ↓
MillionaireGame.js
```

Dispatcher harus hanya menjalankan Millionaire setelah dependency tersedia.

No race condition.

---

# 29. Backend Failure UX

Test:

- backend timeout;
- `millionaireQuestions` absent;
- invalid production data;
- incomplete level set;
- malformed row.

Expected:

- controlled fallback/error behavior sesuai Phase 03;
- no crash;
- no mixed source;
- no silent question generation.

---

# 30. Existing 17-Game Regression

WAJIB memastikan:

```text
GAME_TYPES = 17 existing types
```

Millionaire tetap additive.

Check:

- dashboard;
- GameShell;
- all 17 games;
- Games.pairs;
- existing results;
- admin;
- global CSS;
- dispatcher.

Tidak boleh ada perubahan behavior existing.

---

# 31. Security / Input Hardening

Review:

- question text rendering;
- option rendering;
- explanation rendering;
- `extra` JSON;
- mapel;
- level;
- answer;
- prize.

Jangan menggunakan unsafe HTML rendering untuk production question content kecuali memang sudah menjadi repository convention dan telah diverifikasi aman.

Question data harus diperlakukan sebagai data, bukan executable markup.

---

# 32. Error Logging

Backend invalid rows harus:

- skipped;
- logged;
- tidak crash seluruh init.

Frontend controlled errors harus:

- identifiable;
- tidak silently continue ke level yang hilang;
- tidak membuat soal baru.

Audit mencatat error code yang ditemukan.

---

# 33. Full E2E Acceptance

WAJIB menjalankan:

```text
INTRO
 ↓
READY
 ↓
QUESTION
 ↓
SELECTING
 ↓
LOCKED
 ↓
REVEAL
 ↓
CORRECT
 ↓
QUESTION
 ↓
...
 ↓
L15
 ↓
VICTORY
 ↓
FINISHED
```

Selain itu:

### Wrong

```text
REVEAL
→ WRONG
→ GAME_OVER
→ FINISHED
```

### Walk-away

```text
QUESTION
→ SAFE_EXIT
→ FINISHED
```

### Timeout

```text
QUESTION/SELECTING
→ timer 0
→ WRONG
→ GAME_OVER
```

### Lifelines

Semua tiga diuji.

### Result

Pastikan persistence sesuai U2.

---

# 34. Regression Test Count

Baseline:

```text
42/42 PASS
```

Phase 06 harus mempertahankan seluruh baseline.

Jika test baru ditambahkan:

```text
42 + N
```

harus dicatat jumlah sebenarnya.

Jangan mengubah angka test untuk membuat PASS terlihat lebih baik.

---

# 35. Production Readiness Decision

Phase 06 menghasilkan satu status:

## READY

Jika:

```text
U1 PASS
U2 PASS
E2E PASS
17-game regression PASS
security/cache PASS
critical visual QA PASS
```

## READY WITH NON-BLOCKING DEFERRED ITEMS

Jika:

- U1 PASS;
- U2 PASS;
- E2E PASS;
- hanya item non-critical seperti WebP/physical-device QA yang belum tersedia.

## BLOCKED

Jika salah satu:

```text
U1 FAIL/BLOCKED
U2 FAIL/BLOCKED
production question flow FAIL
result round-trip FAIL
critical gameplay regression
existing 17-game regression
critical security issue
```

---

# 36. No False PASS

Dilarang menyatakan PASS berdasarkan:

- code inspection saja untuk live deployment;
- asumsi deployment;
- frontend payload saja;
- local fallback;
- simulated GameResults;
- unverified screenshot;
- unrun device test.

Jika evidence tidak tersedia:

```text
UNVERIFIED
```

atau:

```text
DEFERRED
```

sesuai sifat item.

---

# 37. Change Control

Phase 06 bukan izin untuk redesign.

Jika perubahan code diperlukan:

1. identify issue;
2. classify severity;
3. identify affected contract;
4. make smallest safe patch;
5. rerun affected tests;
6. rerun full regression;
7. document patch.

Jika perubahan menyentuh locked contract:

```text
STOP
```

dan buat change proposal terpisah.

---

# 38. Forbidden Changes

Jangan:

- menambah state;
- mengubah state transition;
- mengubah prize ladder;
- mengubah score formula;
- mengubah answer encoding;
- mengubah timer semantics tanpa decision;
- mengubah lifeline semantics;
- mengubah walkAway semantics;
- membuat general game engine;
- mengubah 17 game;
- membuat parallel result system;
- mencampur fallback + production;
- menggunakan official WWTBAM branding/assets.

---

# 39. Required Documentation Updates

Jika berhasil:

```text
docs/millionaire/BACKEND_CANONICAL.md
```

harus diperbarui bila U1 terverifikasi.

Jika schema backend berubah:

Dokumentasikan:

```text
old
→ migration
→ new
→ compatibility
```

Audit utama:

```text
docs/millionaire/PHASE_06_HARDENING_INTEGRATION_AUDIT.md
```

---

# 40. Required Audit Content

Audit Phase 06 wajib berisi:

1. execution date;
2. repository/git state;
3. files changed;
4. U1 evidence;
5. canonical backend decision;
6. U2 schema evidence;
7. U2 11→15 round-trip;
8. production question source;
9. fallback test;
10. question validation;
11. prize ladder verification;
12. FSM regression;
13. timer regression;
14. lifeline regression;
15. walk-away regression;
16. result payload;
17. result persistence;
18. anti-farm;
19. cache/version;
20. script loading;
21. browser QA;
22. physical-device QA if available;
23. WebP result;
24. security review;
25. 17-game regression;
26. final test count;
27. unresolved/deferred items;
28. production readiness decision;
29. Phase 06 exit criteria;
30. final handoff.

---

# 41. Exit Criteria

Phase 06 PASS hanya jika semua critical gates terpenuhi.

## Backend

- [ ] U1 verified live;
- [ ] canonical backend documented;
- [ ] `millionaireQuestions` available live.

## GameResults

- [ ] U2 verified;
- [ ] 11-col old rows readable;
- [ ] 15-col Millionaire rows writable;
- [ ] 15-col rows readable back;
- [ ] existing game result remains compatible.

## Gameplay

- [ ] 42/42 baseline tests PASS;
- [ ] E2E normal path PASS;
- [ ] wrong path PASS;
- [ ] timeout PASS;
- [ ] walk-away PASS;
- [ ] victory PASS;
- [ ] all 3 lifelines PASS.

## Integration

- [ ] production question source PASS;
- [ ] fallback behavior PASS;
- [ ] no mixed source;
- [ ] mapel filtering PASS;
- [ ] missing-level handling PASS.

## Persistence

- [ ] result payload correct;
- [ ] save guard PASS;
- [ ] anti-farm PASS;
- [ ] GameResults round-trip PASS.

## Visual / Device

- [ ] browser QA performed where possible;
- [ ] mobile portrait QA;
- [ ] desktop landscape QA;
- [ ] no critical overflow/clipping;
- [ ] B1–B4 load correctly;
- [ ] WebP completed or explicitly deferred.

## Regression

- [ ] all 17 existing games PASS;
- [ ] GameShell unchanged behavior;
- [ ] admin unchanged;
- [ ] no global CSS regression.

## Security / Performance

- [ ] data rendered safely;
- [ ] no unsafe HTML injection introduced;
- [ ] cache/version verified;
- [ ] no duplicate timer/interval;
- [ ] no critical console/runtime errors.

---

# 42. Final Status Template

Audit wajib menutup dengan:

```text
PHASE 06 STATUS:
[READY / READY WITH NON-BLOCKING DEFERRED ITEMS / BLOCKED]

U1:
[PASS / BLOCKED]

U2:
[PASS / BLOCKED]

E2E:
[PASS / FAIL]

17-GAME REGRESSION:
[PASS / FAIL]

CRITICAL ISSUES:
[...]

NON-BLOCKING DEFERRED:
[...]

PRODUCTION READINESS:
[READY / NOT READY]
```

---

# 43. Phase 07 Handoff

Jika Phase 06 = READY:

Millionaire dianggap siap untuk:

- final acceptance;
- release packaging;
- production rollout;
- operational monitoring.

Jika Phase 06 = BLOCKED:

Jangan membuat Phase 07 release.

Buat remediation patch yang spesifik terhadap gate yang gagal.

---

# 44. Prinsip Penutup

> **Phase 05 membuat Millionaire terlihat siap. Phase 06 harus membuktikan bahwa Millionaire benar-benar siap.**

Tidak ada asumsi untuk:

- deployment;
- database;
- persistence;
- browser;
- production question source.

Semua critical claim harus memiliki evidence.