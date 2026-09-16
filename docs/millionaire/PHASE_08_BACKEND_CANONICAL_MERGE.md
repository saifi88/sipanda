# PHASE 08 — BACKEND CANONICAL MERGE

**Project:** SI-PANDA v3 — Millionaire  
**Status:** SPECIFICATION / READY FOR IMPLEMENTATION

## 1. Tujuan

Menyatukan dua full-backend Apps Script:

- `code.gs`
- `code_v2.gs`

menjadi satu source backend canonical tanpa kehilangan fungsi existing maupun fungsi Millionaire.

Target repository:

```text
code.gs → SINGLE BACKEND SOURCE OF TRUTH
```

Phase ini adalah **backend consolidation**, bukan refactor fitur.

## 2. Latar Belakang

Audit sebelumnya menemukan `code.gs` dan `code_v2.gs` memiliki logika bisnis yang identik; perbedaan terutama komentar, dokumentasi, whitespace, dan penanda `[GAME-1]`–`[GAME-4]`.

`code_v2.gs` sebelumnya ditetapkan sebagai intended canonical, sedangkan `code.gs` sebagai backup. Namun deployment truth belum terbukti karena repository tidak memiliki `appsscript.json`, `.clasp.json`, deployment ID, atau bukti live deployment.

Karena itu Phase 08 harus membedakan:

1. repository canonical source;
2. deployment canonical source.

Jangan menganggap keduanya sama sebelum diverifikasi.

## 3. Prinsip Utama — NO FUNCTION LOSS

Semua fungsi yang ada pada `code.gs` atau `code_v2.gs` harus dipertahankan jika merupakan fungsi existing yang digunakan atau bagian backend SI-PANDA.

Jangan:

- menghapus fungsi karena dianggap lama;
- menghapus fungsi yang tampak redundant tanpa evidence;
- melakukan refactor besar;
- mengubah nama fungsi;
- mengubah parameter;
- mengubah response;
- mengubah schema;
- mengubah action `doPost`;
- mengubah behavior existing.

Jika dua fungsi benar-benar duplikat, pertahankan satu implementasi canonical setelah behavior keduanya dipastikan identik.

## 4. Mandatory Audit Before Merge

Sebelum mengubah file, lakukan inventory kedua file.

### 4.1 Function inventory

Inventaris seluruh function declaration dari kedua file.

Minimal verifikasi:

```text
doGet
doPost
getInitData
saveGameResult
readGames_
readGameResults_
getOrCreateSheet_
setupGameSheets
seedSampleGames
generateQuestionsFromImages
classifyGamePairs_
readMillionaireQuestions_
```

serta seluruh fungsi lain yang ditemukan.

### 4.2 Constant/schema inventory

Bandingkan:

```text
GAMES_SHEET
GAME_RESULTS_SHEET
GAMES_HEADER
GAME_RESULTS_HEADER
MILLIONAIRE_QUESTIONS_SHEET
MILLIONAIRE_QUESTIONS_HEADER
prize ladder
safe levels
```

Jangan menghapus constant yang masih digunakan.

### 4.3 Endpoint/action inventory

Bandingkan seluruh action `doGet` dan `doPost`. Pastikan tidak ada action yang hanya terdapat pada salah satu file.

### 4.4 Dependency inventory

Identifikasi fungsi yang dipanggil fungsi lain agar tidak ada dangling reference setelah merge.

## 5. Canonical Selection Rule

Jika audit membuktikan implementasi bisnis identik, gunakan:

```text
code.gs
```

sebagai canonical repository.

Jika ditemukan perbedaan behavior:

```text
JANGAN langsung memilih salah satu.
```

Dokumentasikan perbedaan dan status **BLOCKED** sampai ada evidence/keputusan.

## 6. Merge Strategy

Urutan wajib:

```text
Audit
 ↓
Inventory fungsi/schema/action
 ↓
Diff behavior
 ↓
Tentukan canonical implementation
 ↓
Pastikan code.gs memuat seluruh fungsi
 ↓
Static/syntax tests
 ↓
Deployment verification
 ↓
Live getInitData test
 ↓
Live doPost/saveGameResult test
 ↓
Baru archive/remove code_v2.gs
```

Jangan menghapus `code_v2.gs` sebelum langkah verifikasi selesai atau sebelum secara eksplisit dibuat sebagai backup offline.

## 7. Millionaire Preservation

Pastikan canonical `code.gs` tetap memiliki seluruh backend Millionaire:

```text
MILLIONAIRE_QUESTIONS_SHEET
MILLIONAIRE_QUESTIONS_HEADER
readMillionaireQuestions_
getInitData.millionaireQuestions
normalization/validation helpers yang memang berada di backend
```

Production source tetap:

```text
MillionaireQuestions
```

Jangan mengandalkan fallback frontend sebagai pengganti production backend.

## 8. Existing SI-PANDA Preservation

Canonical backend harus tetap mempertahankan seluruh fungsi existing, termasuk:

- `doGet`
- `doPost`
- `getInitData`
- settings
- students
- exams
- results
- materi
- Games
- GameResults
- game result saving/reading
- game sheet setup
- AI/utility helpers
- seluruh fungsi lain yang ditemukan saat inventory

Tidak boleh ada fungsi existing yang hilang akibat consolidation.

## 9. Schema Preservation

Phase 08 tidak mengubah schema existing.

Khusus:

```text
GAMES_HEADER
GAME_RESULTS_HEADER
```

tetap konsisten dengan behavior backend aktif sampai Phase U2 menangani ekstensi GameResults secara terpisah.

**Phase 08 bukan fase migrasi GameResults 11 → 15.**

## 10. Deployment Truth

Repository tidak cukup untuk menentukan deployment aktif hanya dari nama file.

OpenCode harus memverifikasi project Apps Script yang terkait dengan:

```text
WEB_APP_URL
```

Jika akses deployment tidak tersedia:

```text
STATUS = BLOCKED / UNVERIFIED
```

Jangan mengklaim deployment berhasil.

## 11. Live Verification

Jika akses Apps Script tersedia, lakukan minimal:

### Test A — getInitData

```text
WEB_APP_URL?action=getInitData
```

Pastikan:

- response valid;
- field existing tetap tersedia;
- `games` tersedia;
- `gameResults` tersedia;
- `millionaireQuestions` tersedia jika production sheet sudah ada.

### Test B — existing game compatibility

Pastikan backend masih membaca data game existing.

### Test C — Millionaire

Pastikan production question source dapat dibaca jika sheet tersedia.

### Test D — saveGameResult

Jika U2 belum dimigrasikan, jangan memaksakan perubahan schema Phase 08. Dokumentasikan bahwa Millionaire additive fields masih menunggu U2.

## 12. `code_v2.gs` Handling

Setelah canonical `code.gs` terverifikasi:

Preferred:

```text
code_v2.gs → archive/remove from active backend source
```

Jika historical backup diperlukan:

```text
docs/millionaire/archive/code_v2_pre_merge.gs
```

boleh dibuat.

Backup tidak boleh dianggap sebagai active Apps Script source.

Jika OpenCode tidak yakin aman menghapus:

```text
JANGAN HAPUS.
```

Tetapkan `PASS_WITH_RESIDUAL` dan dokumentasikan alasannya.

## 13. File Scope

### Primary

```text
code.gs
code_v2.gs
```

### Documentation

```text
docs/millionaire/PHASE_08_BACKEND_CANONICAL_MERGE_AUDIT.md
docs/millionaire/BACKEND_CANONICAL.md
```

### Jangan ubah

```text
millionaire/MillionaireGame.js
millionaire/millionaire.css
MillionaireData.js
MillionaireQuestions.js
index.html
admin.html
games/*
```

kecuali audit menemukan dependency yang benar-benar diperlukan.

Phase 08 bukan fase frontend/gameplay.

## 14. Regression Requirements

### Backend

- [ ] Semua function inventory preserved
- [ ] Semua `doGet` behavior preserved
- [ ] Semua `doPost` action preserved
- [ ] Semua schema existing preserved
- [ ] Millionaire reader preserved
- [ ] `getInitData` preserved
- [ ] Games preserved
- [ ] GameResults preserved
- [ ] AI/utility functions preserved
- [ ] no dangling references
- [ ] no duplicate active full backend

### Frontend compatibility

Tanpa mengubah frontend, pastikan:

- [ ] Game Hub tetap bekerja
- [ ] 17 game existing tidak regresi
- [ ] Millionaire tetap dapat membaca source yang tersedia

### Deployment

- [ ] canonical deployment identity verified, atau
- [ ] BLOCKED/UNVERIFIED jika evidence tidak tersedia.

## 15. Acceptance Criteria

Phase 08 PASS jika:

1. `code.gs` menjadi satu canonical full backend repository.
2. Tidak ada fungsi existing yang hilang.
3. Tidak ada action `doGet`/`doPost` yang hilang.
4. Tidak ada perubahan behavior yang tidak direncanakan.
5. Fungsi Millionaire backend tetap tersedia.
6. Tidak ada dua full backend aktif yang membingungkan.
7. Syntax/static validation PASS.
8. Deployment identity dapat dibuktikan, atau status BLOCKED dinyatakan jujur jika akses tidak tersedia.
9. Audit report lengkap dibuat.

## 16. Hard Stop Conditions

OpenCode harus STOP / BLOCKED jika:

- ditemukan perbedaan behavior yang tidak dapat dijelaskan;
- salah satu file memiliki fungsi yang tidak ada pada file lain dan belum diputuskan;
- deployment aktif tidak dapat diverifikasi dan tindakan berisiko;
- merge berpotensi menghapus fungsi existing;
- diperlukan perubahan frontend/gameplay untuk menyelesaikan consolidation.

Jangan melakukan speculative refactor.

## 17. Audit Report Requirement

Buat:

```text
docs/millionaire/PHASE_08_BACKEND_CANONICAL_MERGE_AUDIT.md
```

Minimal berisi:

```text
Status
Tanggal
Auditor

1. File comparison
2. Function inventory
3. Constant/schema comparison
4. doGet/doPost action comparison
5. Behavior differences
6. Canonical decision
7. Merge changes
8. code_v2 handling
9. Static/syntax test
10. Live deployment verification
11. Regression test
12. Residual risks
13. Final status
```

Gunakan status:

```text
PASS
PASS_WITH_RESIDUAL
BLOCKED / UNVERIFIED
```

Jangan menulis PASS jika evidence belum tersedia.

## 18. Final Lock

### Canonical repository target

```text
code.gs
```

### Canonical deployment target

```text
Google Apps Script project → verified deployment → WEB_APP_URL
```

### Non-canonical

```text
code_v2.gs
```

`code_v2.gs` hanya boleh dihapus/diarsipkan setelah canonical merge dan deployment verification memenuhi acceptance criteria.

**PHASE 08 = BACKEND CONSOLIDATION ONLY.**

Tidak ada perubahan gameplay, visual, frontend, FSM, timer, lifeline, scoring, atau 17 game existing.

**STATUS: READY FOR IMPLEMENTATION**
