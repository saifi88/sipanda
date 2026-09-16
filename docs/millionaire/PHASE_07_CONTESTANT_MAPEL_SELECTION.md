# PHASE 07 — CONTESTANT & MAPEL SELECTION

**Project:** SI-PANDA v3 — Millionaire  
**Document:** `docs/millionaire/PHASE_07_CONTESTANT_MAPEL_SELECTION.md`  
**Status:** SPECIFICATION / READY FOR IMPLEMENTATION  
**Phase:** 07

---

## 1. Tujuan

Menambahkan pengalaman pra-permainan Millionaire:

```text
Game Hub
   ↓
Millionaire
   ↓
WELCOME / CONTESTANT SCREEN
   ↓
PILIH MATA PELAJARAN
   ↓
VALIDASI SOAL
   ↓
INTRO
   ↓
READY
   ↓
QUESTION
   ↓
GAMEPLAY EXISTING
```

Fitur ini adalah **pre-game gate**, bukan game engine baru.

---

## 2. Prinsip Utama — ENGINE LOCK

Gameplay engine yang telah lolos QA desktop dan HP dianggap **frozen**.

Jangan mengubah:

- `ALLOWED_TRANSITIONS`
- 12 state existing
- timer 30 detik
- sistem lifeline
- prize ladder
- scoring
- walk-away
- timeout handling
- result builder
- `finishGame()`
- `canSaveGameResult()`
- backend
- 17 game existing

---

## 3. Pre-Game Flow

Saat `MillionaireGame` dibuka:

```text
MillionaireGame mounted
        ↓
ambil current student
        ↓
ambil MillionaireQuestions
        ↓
tampilkan Contestant Screen
        ↓
student memilih mapel
        ↓
validasi L1–L15
        ↓
buildQuestionSet(mapel)
        ↓
gameReady = true
        ↓
INTRO
```

Tidak perlu menambahkan state baru ke FSM.

Gunakan state/UI lokal untuk fase pra-permainan.

---

## 4. Informasi Kontestan

Nama siswa diambil dari data siswa yang sudah digunakan SI-PANDA.

Jangan meminta siswa mengisi nama lagi.

Informasi minimum yang ditampilkan:

```text
Nama Siswa
Kelas
```

NISN digunakan secara internal dan tidak perlu ditampilkan sebagai elemen utama UI.

Contoh:

```text
SELAMAT DATANG, KONTESTAN!

        👤

    NAMA SISWA
      KELAS VI
```

Nama harus menggunakan data aktual siswa yang sedang login.

---

## 5. Pemilihan Mata Pelajaran

Mapel **tidak dibuat sebagai daftar hard-coded baru**.

Sumber:

```text
MillionaireQuestions
        ↓
mapel unik
        ↓
filter mapel valid
        ↓
tampilkan kartu mapel
```

Jumlah kartu mengikuti mapel yang tersedia.

Jangan menampilkan mapel yang tidak mempunyai dataset Millionaire yang valid.

---

## 6. Validasi 15 Level

Setelah mapel dipilih, sistem memeriksa ketersediaan:

```text
L1  ✓
L2  ✓
L3  ✓
L4  ✓
L5  ✓
L6  ✓
L7  ✓
L8  ✓
L9  ✓
L10 ✓
L11 ✓
L12 ✓
L13 ✓
L14 ✓
L15 ✓
```

Syarat mulai:

```text
15 level tersedia
+
setiap level memiliki minimal 1 soal valid
```

### Jika lengkap

Tampilkan feedback singkat:

> **[MAPEL] SIAP DIMAINKAN!**

Kemudian:

```text
START
 ↓
INTRO
```

### Jika tidak lengkap

Jangan memulai permainan.

Tampilkan:

> **Soal untuk mata pelajaran ini belum lengkap.**

dan:

> **Silakan pilih mata pelajaran lain.**

Tidak boleh:

- mengambil soal dari mapel lain;
- mengisi level kosong dengan fallback secara diam-diam;
- melewati level;
- membuat soal otomatis.

---

## 7. Question Set

Setelah validasi berhasil:

```js
buildQuestionSet(selectedMapel)
```

Question set mengikuti kontrak:

```js
{
  id,
  mapel,
  level,
  question,
  options: [A, B, C, D],
  answer,
  prize,
  isSafe,
  explanation
}
```

Jika terdapat beberapa soal pada mapel dan level yang sama, pilih secara random dari soal valid pada level tersebut.

Aturan ini mengikuti keputusan Phase 02/03.

---

## 8. Tombol UI

### Contestant Screen

Minimal:

```text
[ PILIH MATA PELAJARAN ]
```

Setelah mapel dipilih:

```text
[ MULAI PERMAINAN ]
```

Tombol mulai:

- disabled sebelum mapel valid dipilih;
- enabled setelah L1–L15 valid;
- tidak boleh memulai jika validasi gagal.

Tambahkan:

```text
[ KEMBALI ]
```

untuk kembali ke Game Hub.

---

## 9. Desktop Layout

Target visual:

```text
┌──────────────────────────────────────────────────────┐
│                  SI-PANDA                            │
│                                                      │
│              SELAMAT DATANG!                        │
│                                                      │
│               👤 KONTESTAN                           │
│              NAMA SISWA                              │
│                 KELAS VI                             │
│                                                      │
│          PILIH MATA PELAJARAN                       │
│                                                      │
│       [ IPAS ]       [ MATEMATIKA ]                 │
│                                                      │
│       [ B. IND ]     [ B. INGGRIS ]                 │
│                                                      │
│              [ MULAI PERMAINAN ]                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Tetap menggunakan visual language Millionaire yang sudah ada.

---

## 10. Mobile Layout

Mobile adalah **portrait-native**.

Jangan mengecilkan layout desktop.

Contoh:

```text
┌─────────────────────┐
│     SI-PANDA        │
│                     │
│ SELAMAT DATANG!     │
│                     │
│       👤            │
│  NAMA SISWA         │
│     KELAS VI        │
│                     │
│ PILIH MAPEL         │
│                     │
│ ┌─────────────────┐ │
│ │      IPAS       │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │   MATEMATIKA    │ │
│ └─────────────────┘ │
│                     │
│ [ MULAI PERMAINAN ] │
│                     │
│      KEMBALI        │
└─────────────────────┘
```

Kartu mapel harus mudah disentuh.

Target touch area minimal sekitar **44 px**.

---

## 11. Visual Direction

Gunakan visual language Millionaire yang sudah lolos QA:

- studio gelap;
- panel glass/dark;
- accent neon;
- highlight emas untuk prize;
- glow secukupnya;
- rounded cards;
- typography kuat;
- animasi ringan.

Jangan memasukkan:

- logo resmi acara TV;
- aset resmi;
- musik resmi;
- branding resmi;
- elemen yang membuat aplikasi terlihat sebagai produk resmi acara tersebut.

---

## 12. State/UI Separation

Pre-game UI harus dipisahkan dari FSM gameplay.

Contoh state UI lokal:

```js
const [selectedMapel, setSelectedMapel] = useState(null);
const [gameReady, setGameReady] = useState(false);
const [validationError, setValidationError] = useState("");
```

FSM tetap hanya menggunakan 12 state existing:

```text
INTRO
READY
QUESTION
SELECTING
LOCKED
REVEAL
CORRECT
WRONG
SAFE_EXIT
GAME_OVER
VICTORY
FINISHED
```

**Jangan menambahkan:**

```text
CONTESTANT_SELECT
MAPEL_SELECT
```

ke `ALLOWED_TRANSITIONS`.

---

## 13. Kembali

Pada pre-game:

```text
KEMBALI
```

langsung kembali ke Game Hub.

Tidak boleh:

- membuat result;
- memanggil `finishGame()`;
- menyimpan skor;
- memicu anti-farm.

Karena permainan belum dimulai.

---

## 14. Error Handling

Jika data siswa tidak tersedia:

> **Data kontestan tidak ditemukan.**

Jika `MillionaireQuestions` kosong:

> **Soal Millionaire belum tersedia.**

Jika mapel memiliki level tidak lengkap:

> **Soal untuk mata pelajaran ini belum lengkap.**

Error harus controlled dan tidak menyebabkan halaman blank/crash.

---

## 15. Fallback

Fallback `MillionaireQuestions.js` tetap mengikuti aturan Phase 03:

```text
production valid
      ↓
gunakan production

production unavailable / invalid
      ↓
gunakan FALLBACK_QUESTIONS
```

Pre-game bekerja terhadap **resolved question source**, bukan memaksa membaca sheet secara langsung.

Jangan mengubah aturan fallback yang sudah dikunci.

---

## 16. File Scope

### File yang boleh diubah

```text
millionaire/MillionaireGame.js
millionaire/millionaire.css
```

Jika helper kecil benar-benar diperlukan:

```text
millionaire/MillionaireData.js
```

### File yang tidak boleh disentuh

Jangan mengubah perilaku:

```text
games/
```

dan jangan menyentuh:

```text
17 existing games
GameShell
GameHub
gameData
backend
GameResults
```

kecuali ditemukan kebutuhan integrasi yang benar-benar tidak dapat diselesaikan dari boundary Millionaire.

---

## 17. Regression Requirement

### Millionaire

- [ ] Contestant screen muncul
- [ ] Nama siswa benar
- [ ] Kelas benar
- [ ] daftar mapel muncul
- [ ] mapel dapat dipilih
- [ ] mapel tidak valid ditolak
- [ ] dataset L1–L15 tervalidasi
- [ ] Start hanya aktif setelah valid
- [ ] INTRO tetap berjalan
- [ ] READY tetap berjalan
- [ ] QUESTION tetap berjalan
- [ ] timer tetap 30 detik
- [ ] lifeline tetap bekerja
- [ ] walk-away tetap bekerja
- [ ] timeout tetap bekerja
- [ ] wrong answer tetap bekerja
- [ ] correct answer tetap bekerja
- [ ] result tetap terbentuk

### Existing games

Semua **17 game existing harus tetap dapat dibuka dan dimainkan** tanpa perubahan perilaku.

---

## 18. Acceptance Criteria

Phase 07 dianggap PASS apabila:

> **Siswa membuka Millionaire → melihat dirinya sebagai kontestan → memilih mapel → sistem memastikan tersedia 15 level → menekan Mulai → masuk ke INTRO → gameplay existing berjalan tanpa perubahan.**

Dan:

> **Tidak ada regresi pada engine Millionaire yang sebelumnya sudah lolos QA desktop + HP.**

---

# 19. Implementation Guardrails

Implementasi harus bersifat **additive dan minimal**.

Sebelum mengubah kode:

1. baca `MillionaireGame.js` versi saat ini;
2. identifikasi jalur mount dan inisialisasi;
3. identifikasi bagaimana current student tersedia;
4. identifikasi fungsi `resolveQuestionSource`;
5. identifikasi `buildMillionaireQuestionSet`;
6. jangan membuat sumber data siswa kedua;
7. jangan membuat sumber daftar mapel kedua;
8. jangan menduplikasi FSM.

Jika struktur aktual berbeda dari asumsi dokumen ini, **ikuti struktur kode aktual dan pertahankan kontrak yang telah dikunci**, bukan membuat refactor besar.

---

# 20. Definition of Done

Phase 07 selesai jika:

- pre-game screen tampil;
- identitas kontestan berasal dari session/data siswa existing;
- mapel berasal dari resolved MillionaireQuestions;
- mapel tanpa 15 level valid tidak dapat dimulai;
- mapel valid menghasilkan question set L1–L15;
- tombol Kembali bekerja;
- INTRO existing tetap menjadi pintu masuk gameplay;
- FSM 12 state tidak berubah;
- timer/lifeline/timeout/walk-away tidak regresi;
- desktop dan HP tetap responsive;
- 17 game existing tidak berubah perilakunya;
- audit/report Phase 07 tersedia.

---

## 21. LOCK

**Keputusan Phase 07:**

> **Contestant + Mapel Selection adalah pre-game UI, bukan state baru dalam FSM.**

Tujuan utamanya adalah meningkatkan pengalaman Millionaire menjadi lebih menyerupai sebuah **game-show experience**, sambil mempertahankan engine gameplay yang telah tervalidasi.

**STATUS: READY FOR IMPLEMENTATION**
