# PHASE 05 — VISUAL SKIN
## SI-PANDA v3 — Millionaire Game

**Status:** DRAFT FOR IMPLEMENTATION  
**Phase:** 05  
**Scope:** Visual Skin, Responsive UX, Animation, Asset Integration  
**Dependency:** Phase 00–04 PASS  
**Primary Output:** `millionaire/millionaire.css` + visual refinement pada `millionaire/MillionaireGame.js` bila diperlukan  
**Required Audit:** `docs/millionaire/PHASE_05_VISUAL_SKIN_AUDIT.md`

---

# 1. Tujuan

Phase 05 bertujuan mengubah functional game engine hasil Phase 04 menjadi pengalaman permainan kuis bergaya **TV game show / quiz millionaire** yang terasa premium, dramatis, jelas, dan nyaman dimainkan siswa.

Fokus utama:

1. visual skin;
2. responsive layout;
3. penggunaan background B1–B4;
4. question panel;
5. answer buttons A–D;
6. prize ladder;
7. timer;
8. lifeline controls;
9. state feedback;
10. transition/animation;
11. mobile-native UX;
12. visual polish.

Phase ini **tidak boleh mengubah gameplay contract**.

---

# 2. Prinsip Utama

## 2.1 Visual boleh berubah, logic tidak

Phase 05 boleh mengubah:

- warna;
- typography;
- spacing;
- border;
- shadow;
- gradient;
- background;
- shape;
- icon presentation;
- animation;
- transition;
- responsive layout;
- visual hierarchy.

Phase 05 tidak boleh mengubah:

- FSM;
- state names;
- transition rules;
- question schema;
- answer encoding;
- prize ladder;
- safe levels;
- score formula;
- virtual Rupiah semantics;
- result payload;
- lifeline semantics;
- timer contract;
- source question selection;
- anti-farm behavior.

---

# 3. Referensi Implementasi

WAJIB membaca sebelum coding:

```text
docs/millionaire/PHASE_00_MILLIONAIRE_MASTER_SPEC.md
docs/millionaire/PHASE_00_VALIDATION_REPORT.md
docs/millionaire/PHASE_01_ARCHITECTURE.md
docs/millionaire/PHASE_01_ARCHITECTURE_AUDIT.md
docs/millionaire/PHASE_02_DATA_CONTRACT.md
docs/millionaire/PHASE_02_DATA_CONTRACT_AUDIT.md
docs/millionaire/PHASE_03_DATA_LAYER.md
docs/millionaire/PHASE_03_DATA_LAYER_AUDIT.md
docs/millionaire/PHASE_04_GAME_ENGINE.md
docs/millionaire/PHASE_04_GAME_ENGINE_AUDIT.md
```

Phase 04 adalah behavioral baseline.

Jika terdapat konflik antara visual implementation dan Phase 00–04:

> **Phase 00–04 menang.**

Jangan melakukan silent reconciliation.

---

# 4. File Scope

## 4.1 Primary

```text
millionaire/millionaire.css
```

CSS menjadi lokasi utama untuk:

- visual theme;
- layout;
- responsive behavior;
- animation;
- transitions;
- background positioning;
- visual state classes.

## 4.2 Secondary

```text
millionaire/MillionaireGame.js
```

Hanya boleh disentuh apabila diperlukan untuk:

- menambahkan semantic class;
- menambahkan wrapper visual;
- menambahkan `data-state`;
- memperbaiki markup agar CSS dapat bekerja.

Tidak boleh mengubah behavior engine.

## 4.3 Assets

```text
millionaire/assets/
├── backgrounds/
│   ├── desktop/
│   │   ├── B1-gameplay.png
│   │   └── B3-intro.png
│   └── mobile/
│       ├── B2-gameplay.png
│       └── B4-intro.png
├── characters/
├── branding/
├── icons/
└── effects/
```

Asset baru hanya ditambahkan bila benar-benar diperlukan.

Jangan menggunakan:

- logo resmi Who Wants To Be A Millionaire;
- trademark resmi;
- screenshot acara;
- karakter berlisensi;
- musik resmi;
- audio resmi;
- asset yang melanggar hak cipta.

Target estetika adalah **inspired-by TV quiz show**, bukan reproduksi resmi.

---

# 5. Visual Direction

Target visual:

**premium educational TV quiz show**

Karakter visual:

- dramatis;
- fokus;
- elegan;
- modern;
- mudah dibaca;
- tidak terlalu ramai;
- cocok untuk siswa;
- terasa seperti permainan besar;
- tetap sesuai identitas SI-PANDA.

Hindari:

- UI seperti dashboard admin;
- tampilan terlalu flat;
- terlalu banyak warna;
- teks kecil;
- decorative elements yang mengganggu soal;
- efek berlebihan;
- layout yang menyerupai halaman form biasa.

---

# 6. Background System

Empat background yang sudah tersedia menjadi dasar visual.

## Desktop

### Intro

```text
B3-intro.png
```

Digunakan pada:

- INTRO;
- READY;
- halaman pembuka game.

### Gameplay

```text
B1-gameplay.png
```

Digunakan pada:

- QUESTION;
- SELECTING;
- LOCKED;
- REVEAL;
- CORRECT;
- WRONG;
- SAFE_EXIT;
- GAME_OVER;
- VICTORY;
- FINISHED.

## Mobile

### Intro

```text
B4-intro.png
```

Digunakan pada intro/ready.

### Gameplay

```text
B2-gameplay.png
```

Digunakan pada gameplay.

---

# 7. Background Rendering

Gunakan background sebagai atmosphere layer.

Background tidak boleh menjadi tempat untuk meletakkan UI dinamis.

Semua elemen dinamis tetap HTML/CSS:

- question;
- options;
- ladder;
- timer;
- lifelines;
- score;
- feedback.

Rekomendasi:

```css
background-size: cover;
background-position: center;
background-repeat: no-repeat;
```

Namun positioning harus diverifikasi secara visual terhadap komposisi asli B1–B4.

---

# 8. Desktop Layout

Target utama:

```text
┌───────────────────────────────────────────────┐
│                  HOST / HEADER                │
├───────────────────────────────┬───────────────┤
│                               │               │
│        QUESTION PANEL         │  PRIZE LADDER │
│                               │               │
│                               │               │
├───────────────────────────────┤               │
│                               │               │
│       A             B         │               │
│       C             D         │               │
│                               │               │
├───────────────────────────────┴───────────────┤
│       50:50   TANYA KELAS   TANYA TEMAN       │
└───────────────────────────────────────────────┘
```

Prioritas visual:

1. question;
2. answer options;
3. timer;
4. prize ladder;
5. lifelines;
6. secondary metadata.

Question harus menjadi focal point.

---

# 9. Mobile Layout

Mobile harus **portrait-native**.

Jangan hanya mengecilkan desktop.

Target:

```text
┌─────────────────────┐
│       HEADER        │
├─────────────────────┤
│    PRIZE / LEVEL    │
├─────────────────────┤
│                     │
│      QUESTION       │
│                     │
├─────────────────────┤
│         A           │
├─────────────────────┤
│         B           │
├─────────────────────┤
│         C           │
├─────────────────────┤
│         D           │
├─────────────────────┤
│   TIMER / STATUS    │
├─────────────────────┤
│ 50:50  KELAS  TEMAN │
└─────────────────────┘
```

Urutan informasi harus tetap mudah dipahami tanpa horizontal scrolling.

---

# 10. Mobile Rules

WAJIB:

- tidak ada horizontal scroll;
- answer button cukup besar untuk touch;
- touch target nyaman;
- question tidak terpotong;
- option text dapat wrap;
- ladder tidak mengambil terlalu banyak viewport;
- lifelines mudah disentuh;
- timer selalu terlihat;
- tombol tidak saling bertabrakan;
- safe-level indicator mudah terlihat.

Gunakan:

```css
min-height
clamp()
max-width
flex
grid
```

secukupnya untuk responsive behavior.

Jangan mengunci ukuran menggunakan pixel secara berlebihan.

---

# 11. Question Panel

Question panel harus menjadi pusat perhatian.

Karakter:

- high contrast;
- readable;
- premium;
- rounded/structured;
- memiliki visual depth;
- tidak terlalu transparan sehingga background mengganggu readability.

Question text harus:

- mudah dibaca;
- memiliki line-height cukup;
- responsif;
- tidak overflow.

Desktop dapat menggunakan panel lebih besar.

Mobile harus menggunakan panel yang lebih compact namun tetap nyaman.

---

# 12. Answer Buttons

Empat jawaban harus memiliki identitas visual yang jelas:

```text
A
B
C
D
```

Setiap button minimal mempunyai state:

```text
default
hover
focus
selected
locked
correct
wrong
disabled
hidden
```

### Default

Menunjukkan pilihan yang tersedia.

### Selected

Menunjukkan pilihan yang dipilih siswa sebelum lock.

### Locked

Menunjukkan jawaban telah dikunci.

### Correct

Menunjukkan jawaban benar setelah reveal.

### Wrong

Menunjukkan jawaban salah setelah reveal.

### Hidden

Dipakai oleh 50:50.

Button hidden tidak boleh mengubah question data.

---

# 13. Answer Animation

Animation harus mendukung pemahaman state.

Contoh:

```text
SELECTING
    ↓
selected highlight
    ↓
LOCKED
    ↓
brief lock transition
    ↓
REVEAL
    ↓
correct / wrong emphasis
```

Hindari:

- animasi panjang;
- looping animation;
- flashing ekstrem;
- efek yang mengganggu keterbacaan.

Gunakan transition singkat dan konsisten.

---

# 14. Prize Ladder

Prize ladder harus terasa seperti bagian penting dari game show.

Desktop:

- berada di panel kanan;
- seluruh 15 level dapat dipahami;
- current level sangat jelas;
- safe level memiliki visual distinction.

Mobile:

- tidak boleh mengambil seluruh layar;
- dapat menggunakan compact vertical list;
- current level harus tetap jelas;
- safe levels tetap mudah dikenali.

Data ladder **WAJIB berasal dari runtime contract**.

Jangan membuat ladder baru di CSS/JS yang dapat menyebabkan mismatch.

---

# 15. Current Level

Current level harus mempunyai visual emphasis.

Contoh hierarchy:

```text
15  Rp1.000.000
14  Rp500.000
13  Rp250.000
12  Rp125.000
11  Rp64.000
10  Rp32.000   SAFE
...
```

Current level:

- lebih terang;
- lebih menonjol;
- memiliki border/glow/scale ringan;
- tetap readable.

Safe level:

- memiliki indikator khusus;
- tidak bergantung hanya pada warna.

---

# 16. Timer

Timer adalah UI visual dari runtime timer Phase 04.

Phase 05 tidak boleh mengubah nilai canonical timer.

Phase 04 saat ini menggunakan:

```js
M.TIMER_SECONDS || 30
```

Nilai 30 detik merupakan **runtime configuration**, bukan kontrak canonical yang boleh diubah secara diam-diam.

Visual timer boleh:

- progress ring;
- progress bar;
- countdown number;
- urgency state.

Contoh visual:

```text
30
29
28
...
10
09
08
...
01
00
```

Timer harus memiliki visual urgency ketika waktu menipis.

Jangan menggunakan flashing ekstrem.

---

# 17. Lifelines

Tiga lifeline:

```text
50:50
Tanya Kelas
Tanya Teman
```

Masing-masing:

- mudah dikenali;
- memiliki icon/label;
- memiliki active state;
- disabled state;
- used state.

Setelah digunakan:

```text
used
```

harus terlihat jelas.

Lifeline tidak boleh dapat digunakan setelah answer locked.

Behavior tetap berasal dari Phase 04.

---

# 18. Lifeline Icon

Jika asset icon belum tersedia, gunakan CSS/simple text treatment yang konsisten.

Jangan mengimpor asset resmi acara.

Target:

```text
┌─────────┐
│  50:50  │
└─────────┘

┌─────────┐
│  KELAS  │
└─────────┘

┌─────────┐
│  TEMAN  │
└─────────┘
```

Mobile harus tetap readable.

---

# 19. Header / Host Area

Header harus menyediakan konteks game:

- title;
- mapel;
- level;
- optional player information;
- status.

Jangan membuat header terlalu tinggi.

Pada mobile header harus compact.

Jika karakter/host visual ditambahkan, karakter menjadi dekoratif.

Host tidak boleh menutupi:

- question;
- options;
- timer;
- ladder.

---

# 20. State Visual Mapping

Visual state tidak boleh membuat state baru.

Gunakan state engine Phase 04.

| Runtime State | Visual Treatment |
|---|---|
| INTRO | cinematic intro |
| READY | ready/start emphasis |
| QUESTION | neutral gameplay |
| SELECTING | active answer selection |
| LOCKED | locked-answer emphasis |
| REVEAL | suspense/reveal |
| CORRECT | success |
| WRONG | failure |
| SAFE_EXIT | safe exit |
| GAME_OVER | game over |
| VICTORY | final victory |
| FINISHED | completion/result |

CSS boleh menggunakan:

```text
[data-state="INTRO"]
[data-state="QUESTION"]
[data-state="LOCKED"]
...
```

Tetapi jangan mengubah FSM.

---

# 21. Intro Experience

INTRO harus terasa berbeda dari gameplay.

Gunakan:

```text
B3-intro.png
B4-intro.png
```

Desktop dan mobile harus memiliki komposisi masing-masing.

Intro dapat memiliki:

- title;
- subtitle;
- mapel;
- player;
- start CTA;
- decorative motion.

Animation harus ringan dan dapat dilewati/berakhir secara jelas.

---

# 22. Ready Experience

READY harus menjadi jembatan antara intro dan gameplay.

CTA utama:

```text
MULAI
```

atau label yang sudah digunakan oleh engine.

CTA harus:

- sangat jelas;
- touch-friendly;
- memiliki focus state;
- tidak tertutup background.

Jangan mengubah event/transition engine hanya demi styling.

---

# 23. Reveal Experience

REVEAL adalah titik dramatik utama.

Prioritas:

1. selected answer;
2. correct answer;
3. question;
4. explanation jika tersedia;
5. prize/result feedback.

Gunakan animation pendek:

```text
selected
→ lock
→ suspense
→ reveal
→ outcome
```

Jangan menambahkan delay gameplay yang mengubah contract tanpa persetujuan Phase berikutnya.

---

# 24. Correct State

Correct answer dapat menggunakan:

- glow;
- pulse ringan;
- icon;
- status label;
- prize progression emphasis.

Tidak boleh menggunakan efek visual yang membuat teks sulit dibaca.

---

# 25. Wrong State

Wrong answer harus sangat jelas.

Tampilkan:

- selected wrong;
- correct answer;
- final status;
- safe prize jika relevan.

Jangan menghapus evidence jawaban terlalu cepat.

---

# 26. Safe Exit

SAFE_EXIT harus membedakan:

```text
walk away
```

dari:

```text
wrong answer
```

Visual harus menunjukkan bahwa siswa keluar dengan hadiah yang sudah diamankan.

Tidak boleh mengubah:

```text
wrong
```

counter.

---

# 27. Game Over

GAME_OVER harus:

- jelas;
- tidak ambigu;
- menunjukkan hasil;
- menunjukkan virtual Rupiah;
- menunjukkan level;
- menyediakan completion CTA sesuai engine.

---

# 28. Victory

VICTORY adalah level 15.

Harus memiliki visual paling kuat.

Elemen dapat mencakup:

- final prize;
- level 15;
- celebratory effect;
- success message.

Tetap hindari penggunaan official branding.

---

# 29. Finished / Result

FINISHED harus tetap kompatibel dengan existing SI-PANDA result flow.

Visual result boleh menampilkan:

```text
Level
Hadiah Virtual
Safe Prize
Skor
Benar
Salah
```

Tetapi jangan membuat result schema baru.

---

# 30. Typography

Prioritas:

1. readability;
2. hierarchy;
3. contrast;
4. responsive sizing.

Gunakan font stack yang tersedia secara aman.

Jangan mengandalkan font eksternal yang dapat menyebabkan game gagal tampil ketika jaringan terbatas, kecuali repository memang sudah menggunakannya.

---

# 31. Accessibility

Minimal:

- readable contrast;
- visible focus;
- button tidak hanya dibedakan dengan warna;
- safe state tidak hanya mengandalkan warna;
- text dapat wrap;
- touch target cukup besar;
- reduced-motion consideration.

Jika:

```css
@media (prefers-reduced-motion: reduce)
```

digunakan, animation harus dikurangi tanpa menghilangkan informasi state.

---

# 32. Responsive Breakpoints

Implementasi bebas memilih breakpoint yang sesuai hasil visual.

Minimal harus diuji pada:

```text
320 × 568
360 × 800
390 × 844
412 × 915
768 × 1024
1024 × 768
1280 × 720
1366 × 768
1440 × 900
1920 × 1080
```

Prioritas utama:

- mobile portrait;
- desktop landscape.

---

# 33. Orientation

Portrait:

```text
native mobile layout
```

Landscape:

```text
desktop/tablet adaptation
```

Jangan membuat mobile landscape memaksa layout desktop secara rusak.

Tidak boleh terjadi:

- horizontal overflow;
- clipped button;
- clipped question;
- ladder keluar viewport;
- timer tertutup;
- lifeline overlap.

---

# 34. Background Asset Optimization

B1–B4 saat ini adalah PNG native.

Phase 05 harus melakukan optimasi final jika toolchain tersedia.

Target:

```text
WebP
< 400 KB / image
```

Tetap pertahankan:

- komposisi;
- rasio;
- kualitas visual;
- readability UI.

Jangan mengganti background dengan gambar lain tanpa alasan.

---

# 35. Baked UI Verification

B1–B4 sebelumnya memiliki kemungkinan elemen visual baked-in.

WAJIB melakukan visual inspection.

Periksa:

- apakah ada panel UI yang sudah menyatu dengan background;
- apakah HTML UI bertumpuk dengan baked UI;
- apakah current layout cocok dengan safe area background;
- apakah question panel bertabrakan dengan komposisi background;
- apakah mobile crop menghasilkan overlap.

Jika ditemukan conflict:

```text
CONFLICT
+ evidence
+ affected viewport
+ recommended resolution
```

Jangan diam-diam menghapus bagian background.

---

# 36. CSS Architecture

Gunakan namespace:

```css
.sipanda-millionaire
```

Contoh:

```css
.sipanda-millionaire .millionaire-question {}
.sipanda-millionaire .millionaire-option {}
.sipanda-millionaire .millionaire-ladder {}
.sipanda-millionaire .millionaire-lifeline {}
```

Hindari global selector seperti:

```css
button {}
body {}
.card {}
.container {}
```

yang berpotensi mengubah 17 game existing.

---

# 37. Existing SI-PANDA Safety

Phase 05 wajib menjaga:

- 17 game existing;
- GameShell;
- dashboard;
- admin;
- global layout;
- existing button styles;
- existing result system.

Millionaire CSS harus terisolasi.

Tidak boleh ada global visual regression.

---

# 38. Performance

Game harus tetap ringan.

Hindari:

- animation berlebihan;
- shadow bertingkat ekstrem;
- filter berat;
- DOM decoration berlebihan;
- image duplication;
- background loading berulang.

Gunakan:

```text
opacity
transform
transition
```

untuk animation bila memungkinkan.

---

# 39. Browser Compatibility

Pertahankan compatibility dengan environment SI-PANDA v3:

- React 18 UMD;
- ReactDOM 18;
- Babel standalone;
- Tailwind CDN;
- browser modern yang umum digunakan siswa.

Jangan menambahkan build system.

Jangan menambahkan dependency npm.

---

# 40. Cache / Versioning

Phase 05 harus menjaga cache-busting.

Jika:

```text
millionaire.css?v=17
MillionaireGame.js?v=17
```

digunakan, perubahan asset/CSS harus menghasilkan version bump yang konsisten dengan repository.

Jangan membuat cache strategy baru.

Jangan menghapus existing reload logic.

---

# 41. Animation Rules

Animation harus:

- singkat;
- purposeful;
- state-aware;
- tidak menghalangi input;
- tidak menyebabkan layout shift;
- tidak mengubah gameplay timing secara tidak sengaja.

Dilarang:

- infinite animation pada seluruh screen;
- full-screen flashing;
- animation yang membuat answer button berpindah posisi;
- animation yang mengubah ukuran layout secara ekstrem.

---

# 42. Functional Contract Freeze

Phase 05 dianggap gagal jika perubahan visual menyebabkan perubahan terhadap:

```text
question source
answer
level
prize
safe level
score
timer semantics
lifeline behavior
walkAway
wrong count
result payload
save guard
anti-farm
FSM
```

Semua harus dibandingkan dengan Phase 04 baseline.

---

# 43. Required Regression Tests

Minimal lakukan:

## Functional smoke

```text
INTRO
→ READY
→ QUESTION
→ SELECTING
→ LOCKED
→ REVEAL
→ CORRECT
→ QUESTION
```

## Wrong

```text
QUESTION
→ SELECTING
→ LOCKED
→ REVEAL
→ WRONG
→ GAME_OVER
→ FINISHED
```

## Walk away

```text
QUESTION
→ SAFE_EXIT
→ FINISHED
```

## Lifelines

Pastikan:

```text
50:50
Tanya Kelas
Tanya Teman
```

masing-masing tetap sekali per game.

## Victory

```text
L1 → ... → L15
```

## Regression

Semua 17 game existing tetap dapat dimuat dan behavior dasarnya tidak berubah.

---

# 44. Visual QA Matrix

Wajib melakukan visual check:

| Viewport | Intro | Gameplay | Result |
|---|---:|---:|---:|
| 320×568 | ✓ | ✓ | ✓ |
| 360×800 | ✓ | ✓ | ✓ |
| 390×844 | ✓ | ✓ | ✓ |
| 412×915 | ✓ | ✓ | ✓ |
| 768×1024 | ✓ | ✓ | ✓ |
| 1024×768 | ✓ | ✓ | ✓ |
| 1280×720 | ✓ | ✓ | ✓ |
| 1366×768 | ✓ | ✓ | ✓ |
| 1440×900 | ✓ | ✓ | ✓ |
| 1920×1080 | ✓ | ✓ | ✓ |

Periksa:

- clipping;
- overflow;
- text wrapping;
- button size;
- ladder visibility;
- timer;
- lifeline;
- background composition;
- state styling.

---

# 45. Required Audit

OpenCode wajib membuat:

```text
docs/millionaire/PHASE_05_VISUAL_SKIN_AUDIT.md
```

Audit harus memuat:

1. files changed;
2. visual architecture;
3. desktop implementation;
4. mobile implementation;
5. B1–B4 usage;
6. baked UI verification;
7. answer state styling;
8. ladder styling;
9. timer styling;
10. lifeline styling;
11. state visual mapping;
12. animation inventory;
13. responsive test matrix;
14. 17-game regression;
15. functional contract regression;
16. asset optimization;
17. accessibility check;
18. performance notes;
19. unresolved issues;
20. exit criteria;
21. Phase 06 recommendation.

---

# 46. U1 / U2 Status

Phase 05 tidak boleh mengklaim menyelesaikan:

### U1

Backend canonical deployment truth.

Status tetap:

```text
UNVERIFIED / BLOCKED
```

### U2

GameResults 11 → 15 production compatibility.

Status tetap:

```text
CONDITIONALLY BLOCKED
```

Visual implementation tidak boleh mengubah status tersebut.

---

# 47. Known Phase 04 Hardening Notes

Phase 04 audit mencatat:

### H1 — U1

Backend canonical belum diverifikasi.

### H2 — U2

GameResults production masih perlu staging verification.

### M1 — Timer

30 detik adalah runtime configuration, bukan canonical contract.

### M2 — `_transitionTo`

Expose untuk test dan dapat dipertimbangkan untuk di-hardening setelah behavior tervalidasi.

### M3 — APP_VERSION

Phase 04 sudah menaikkan version dari v16 ke v17.

### L1 — Fallback question

Terdapat catatan mengenai placeholder HOTS pada fallback question L13.

Phase 05 **tidak perlu memperbaiki item tersebut**, kecuali perubahan benar-benar diperlukan untuk visual QA. Jangan memperluas scope.

---

# 48. Critical Phase 05 Rule

**JANGAN MEMPERBAIKI GAMEPLAY SAAT MENGERJAKAN VISUAL.**

Jika ditemukan bug behavioral:

```text
BUG FOUND
→ document evidence
→ do not silently redesign engine
→ report in audit
→ recommend hardening/follow-up phase
```

Visual phase harus tetap terisolasi.

---

# 49. Exit Criteria

Phase 05 PASS jika:

- [ ] `millionaire.css` selesai;
- [ ] desktop skin selesai;
- [ ] mobile-native skin selesai;
- [ ] B1/B2 gameplay background terpasang;
- [ ] B3/B4 intro background terpasang;
- [ ] question panel polished;
- [ ] answer buttons memiliki state visual lengkap;
- [ ] prize ladder polished;
- [ ] safe level jelas;
- [ ] timer memiliki visual state;
- [ ] tiga lifeline memiliki visual state;
- [ ] INTRO/READY/QUESTION/LOCKED/REVEAL/CORRECT/WRONG/SAFE_EXIT/GAME_OVER/VICTORY/FINISHED memiliki visual treatment;
- [ ] animation/transitions selesai;
- [ ] mobile portrait tidak overflow;
- [ ] desktop landscape tidak overflow;
- [ ] background baked UI telah diverifikasi;
- [ ] asset optimization dilakukan bila memungkinkan;
- [ ] accessibility dasar diperiksa;
- [ ] performance tidak menunjukkan masalah berarti;
- [ ] 17 game existing tidak mengalami regression;
- [ ] 42+ functional contract tests Phase 04 tetap PASS;
- [ ] U1 tetap UNVERIFIED/BLOCKED;
- [ ] U2 tetap CONDITIONALLY BLOCKED;
- [ ] audit Phase 05 tersedia.

---

# 50. Handoff Phase 06

Jika Phase 05 PASS, handoff berikutnya adalah **hardening / integration validation**, bukan penambahan fitur gameplay baru.

Phase 06 dapat menangani:

- backend canonical verification U1;
- GameResults 15-column staging U2;
- production integration;
- final security/cache validation;
- removal of test-only exposure;
- final end-to-end acceptance.

Phase 06 tidak boleh menganggap visual completion sebagai bukti backend production readiness.