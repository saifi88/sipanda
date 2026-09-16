# PHASE 06B --- MILLIONAIRE VISUAL SKIN REDESIGN

## SI-PANDA v3 · High-Fidelity Millionaire Game-Show UI

**Status:** VISUAL REDESIGN ONLY\
**Parent:** PHASE 06A --- LOCAL LIVE SERVER GAME REGISTRATION FIX\
**Scope:** `millionaire/millionaire.css` + minimal semantic markup
changes in `millionaire/MillionaireGame.js` only when required\
**Goal:** Replace the current generic card-based appearance with a
high-fidelity classic TV quiz / millionaire game-show skin.

------------------------------------------------------------------------

## 1. TUJUAN UTAMA

Tampilan Millionaire saat ini sudah berfungsi, tetapi secara visual
masih berupa panel putih/card UI generik.

Target baru harus terasa seperti **game-show studio premium klasik**,
dengan karakter visual:

-   latar studio gelap biru;
-   cahaya biru elektrik;
-   aksen emas;
-   panel pertanyaan berbentuk kapsul/hexagonal dengan ujung meruncing;
-   panel jawaban berbentuk kapsul/hexagonal;
-   prize ladder vertikal di sisi kanan;
-   lifeline berbentuk tombol oval;
-   typography putih tegas;
-   highlight aktif berwarna emas;
-   border bercahaya biru;
-   depth/glow/reflection;
-   komposisi layar seperti quiz show TV.

**Target visual: sangat mendekati referensi game-show klasik yang
menjadi inspirasi, tetapi JANGAN menyalin logo resmi, nama acara resmi,
musik, font proprietary, atau aset berhak cipta.**

Branding tetap: - SI-PANDA - Millionaire / Zona Game - slogan SI-PANDA
yang sudah ada bila tersedia.

------------------------------------------------------------------------

# 2. PRINSIP PENTING

### Jangan mengubah gameplay

JANGAN mengubah:

-   FSM 12 state;
-   question engine;
-   prize ladder;
-   safe levels;
-   timer;
-   lifelines;
-   walk-away;
-   score;
-   result payload;
-   `finishGame()`;
-   `canSaveGameResult()`;
-   dispatcher;
-   source `MillionaireQuestions`;
-   fallback question mechanism.

Perubahan hanya pada **presentasi visual dan markup semantik yang
diperlukan untuk styling**.

------------------------------------------------------------------------

# 3. TARGET DESKTOP

Gunakan desktop landscape sebagai layout utama.

Komposisi target:

``` text
┌────────────────────────────────────────────────────────────────────┐
│                     HEADER / STATUS                               │
│                                                                    │
│  LIFELINES                          SI-PANDA / STATUS              │
│                                                                    │
│                                                                    │
│             ┌───────────────────────────────────┐   ┌───────────┐  │
│             │                                   │   │ 15 Rp1M   │  │
│             │       QUESTION PANEL              │   │ 14 Rp500k │  │
│             │                                   │   │ 13 Rp250k │  │
│             └───────────────────────────────────┘   │ ...       │  │
│                                                     │ 10 SAFE   │  │
│             ┌─────────────────┐ ┌────────────────┐ │ ...       │  │
│             │ A: Jawaban      │ │ B: Jawaban     │ │ 5 SAFE    │  │
│             └─────────────────┘ └────────────────┘ │ ...       │  │
│             ┌─────────────────┐ ┌────────────────┐ │ 1 Rp100   │  │
│             │ C: Jawaban      │ │ D: Jawaban     │ └───────────┘  │
│             └─────────────────┘ └────────────────┘                │
│                                                                    │
│                 TIMER / LEVEL / PRIZE STATUS                       │
└────────────────────────────────────────────────────────────────────┘
```

### Proporsi

-   Prize ladder tetap berada di kanan.
-   Question panel berada di tengah kiri.
-   Answers berada di bawah question panel.
-   Lifelines berada di area atas/bawah yang tidak mengganggu question.
-   Background studio selalu terlihat di belakang UI.
-   Hindari panel putih besar yang menutupi studio.

------------------------------------------------------------------------

# 4. QUESTION PANEL --- PRIORITAS TERTINGGI

Question panel harus menjadi elemen visual utama.

### Bentuk

Jangan gunakan:

``` css
border-radius: 24px;
background: white;
```

sebagai tampilan utama.

Gunakan panel:

-   dark navy/black translucent;
-   border biru elektrik;
-   outer glow;
-   inner highlight;
-   ujung kiri dan kanan meruncing/pointed;
-   bentuk seperti kapsul/hexagonal TV quiz panel.

Jika diperlukan, gunakan pseudo-element:

``` css
::before
::after
```

untuk membuat ujung panel.

### Visual

Target:

``` text
       ◁──────────────────────────────────────▷
       │                                      │
       │     Planet terdekat dengan            │
       │          Matahari adalah?             │
       │                                      │
       ◁──────────────────────────────────────▷
```

-   background: sangat gelap;
-   text: putih;
-   accent: biru elektrik;
-   optional gold inner accent;
-   shadow/glow;
-   question centered;
-   font besar dan tegas;
-   tidak boleh terlihat seperti kartu dashboard.

### State

Pertahankan seluruh state existing:

-   default
-   selected
-   locked
-   correct
-   wrong
-   disabled
-   hidden

Tetapi visualnya harus tetap menggunakan desain panel TV quiz.

------------------------------------------------------------------------

# 5. ANSWER PANELS --- PRIORITAS TERTINGGI

Empat jawaban harus menggunakan bentuk yang sama dengan question panel.

Layout desktop:

``` text
┌──────────────────────────┐    ┌──────────────────────────┐
│ A:  Merkurius            │    │ B:  Venus                │
└──────────────────────────┘    └──────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ C:  Bumi                 │    │ D:  Mars                 │
└──────────────────────────┘    └──────────────────────────┘
```

### Bentuk

-   dark navy;
-   border biru;
-   glowing border;
-   pointed/hexagonal ends;
-   tidak menggunakan white card;
-   answer label A/B/C/D berwarna emas;
-   answer text putih.

### State visual

**Default** - dark navy; - blue border; - subtle glow.

**Hover** - blue glow lebih kuat; - sedikit brightness; - transform
ringan.

**Focus** - visible focus ring.

**Selected** - gold/amber accent; - stronger blue/gold glow.

**Locked** - visibly locked; - jangan terlihat disabled total.

**Correct** - gold/green success treatment tetap mempertahankan bentuk
panel.

**Wrong** - red/crimson glow tetapi tetap dark.

**Disabled** - reduced opacity.

**Hidden (50:50)** - benar-benar visually suppressed, tidak mengubah
question data.

------------------------------------------------------------------------

# 6. PRIZE LADDER --- PRIORITAS TERTINGGI

Prize ladder harus terlihat seperti **panel hadiah vertikal game show**,
bukan sidebar putih.

Posisi: - kanan desktop; - tinggi hampir sepanjang area gameplay; - dark
navy/black; - border biru/gold; - slight perspective/depth; - inner
glow.

Isi tetap menggunakan canonical:

1.  Rp100
2.  Rp200
3.  Rp300
4.  Rp500
5.  Rp1.000 SAFE
6.  Rp2.000
7.  Rp4.000
8.  Rp8.000
9.  Rp16.000
10. Rp32.000 SAFE
11. Rp64.000
12. Rp125.000
13. Rp250.000
14. Rp500.000
15. Rp1.000.000 FINAL

### Jangan mengubah data ladder.

Hanya ubah styling.

### Current level

Current level harus menjadi highlight utama:

``` text
        10   Rp32.000   SAFE
      ╔══════════════════════╗
      ║   GOLD / AMBER       ║
      ╚══════════════════════╝
```

Gunakan: - gold/amber; - stronger glow; - high contrast; - slight
scale/pulse.

### Safe level

Level 5, 10, 15 harus visually distinguishable.

------------------------------------------------------------------------

# 7. LIFELINES

Lifeline tidak lagi berupa white rectangular buttons.

Target:

``` text
      ╭────────╮    ╭────────╮    ╭────────╮
      │ 50:50  │    │  CLASS │    │ FRIEND │
      ╰────────╯    ╰────────╯    ╰────────╯
```

Visual: - dark background; - blue border; - circular/oval; - blue
glow; - white/gold icon/text.

Tetap gunakan tiga lifeline existing:

-   50:50
-   Tanya Kelas
-   Tanya Teman

Jangan mengubah perilaku satu kali penggunaan.

Used state: - dimmed; - visibly consumed; - no pointer interaction.

------------------------------------------------------------------------

# 8. HEADER / STATUS

Header jangan menjadi white dashboard bar.

Gunakan dark translucent top bar dengan:

-   SI-PANDA;
-   mapel;
-   level;
-   virtual prize;
-   timer.

Contoh:

``` text
SI-PANDA • MILLIONAIRE
IPAS • LEVEL 1/15
Rp100                                      30s
```

Timer: - normal: blue/white; - \<= 5 detik: red/orange urgent; - tetap
menggunakan runtime timer existing.

------------------------------------------------------------------------

# 9. BACKGROUND

Pertahankan background studio existing Phase 05.

Gunakan: - desktop background untuk desktop; - mobile background untuk
mobile; - WebP utama + PNG fallback jika sudah tersedia.

Background harus terlihat sebagai **studio**, bukan wallpaper yang
ditutup panel putih.

Tambahkan overlay gradient/translucency jika diperlukan agar UI terbaca.

JANGAN mengganti aset background tanpa kebutuhan.

------------------------------------------------------------------------

# 10. BRANDING

Gunakan branding SI-PANDA yang sudah ada.

Boleh menampilkan:

``` text
SI-PANDA
Zona Game • Millionaire
```

Jangan menggunakan: - logo resmi Who Wants to Be a Millionaire; -
nama/logo resmi acara sebagai branding produk; - asset resmi; - musik
resmi; - copy visual yang mengklaim sebagai produk resmi.

Target adalah **visual language game-show klasik**, bukan penyalinan
branding resmi.

------------------------------------------------------------------------

# 11. MOBILE PORTRAIT

Mobile bukan crop dari desktop.

Urutan:

``` text
HEADER
↓
PRIZE LADDER compact
↓
QUESTION
↓
A
↓
B
↓
C
↓
D
↓
LIFELINES
```

Prize ladder boleh menjadi horizontal/compact collapsible visual jika
ruang sangat sempit, tetapi seluruh 15 level harus tetap dapat
diakses/dibaca.

Prioritas mobile:

1.  question;
2.  answers;
3.  current prize;
4.  timer;
5.  lifelines.

Tidak boleh ada: - horizontal overflow; - question terpotong; - answer
text terpotong; - prize ladder keluar viewport.

------------------------------------------------------------------------

# 12. TYPOGRAPHY

Gunakan font yang tersedia dari stack project/system.

Target: - bold geometric/sans; - white main text; - gold labels; - high
contrast; - question lebih besar daripada answer; - prize ladder compact
tetapi readable.

Jangan menambahkan font eksternal jika tidak diperlukan.

------------------------------------------------------------------------

# 13. ANIMATION

Gunakan animasi ringan:

-   question entrance;
-   answer hover;
-   current prize pulse;
-   correct reveal;
-   wrong reveal;
-   timer urgency;
-   lifeline activation.

Jangan membuat animasi mengganggu gameplay.

Wajib mendukung:

``` css
@media (prefers-reduced-motion: reduce)
```

------------------------------------------------------------------------

# 14. RESPONSIVE BREAKPOINT

Audit minimal:

-   1366×768
-   1440×900
-   1536×864
-   1280×720
-   1024×768
-   768×1024
-   430×932
-   412×915
-   390×844
-   375×812

Target: - desktop landscape; - tablet; - mobile portrait.

------------------------------------------------------------------------

# 15. IMPLEMENTATION CONSTRAINTS

Prioritas file:

``` text
millionaire/millionaire.css
```

Markup `MillionaireGame.js` boleh diubah **hanya jika CSS membutuhkan
semantic wrapper/class/data-state**.

JANGAN: - membuat engine baru; - mengubah game logic; - mengubah data
model; - mengubah question source; - mengubah backend; - mengubah Apps
Script; - mengubah GameResults; - mengubah 17 game existing; - mengubah
admin; - menambahkan dependency berat.

Semua selector harus scoped:

``` css
.sipanda-millionaire ...
```

Tidak boleh ada global styling leak.

------------------------------------------------------------------------

# 16. DEFINITION OF DONE

Phase 06B dianggap berhasil jika:

-   [ ] White generic card appearance sudah hilang dari gameplay utama.
-   [ ] Question panel memiliki visual dark blue + electric blue + gold,
    pointed/hexagonal.
-   [ ] Answer panels menggunakan visual yang sama.
-   [ ] Prize ladder menjadi dark game-show ladder dengan current/safe
    highlight.
-   [ ] Lifelines menjadi oval/TV-game-show controls.
-   [ ] Header/status menyatu dengan tema studio.
-   [ ] Background studio tetap terlihat.
-   [ ] Semua 9 answer states tetap berfungsi secara visual.
-   [ ] Semua 12 FSM states tetap dapat divisualkan.
-   [ ] Timer visual tetap berfungsi.
-   [ ] Mobile portrait tetap usable.
-   [ ] Tidak ada horizontal overflow.
-   [ ] `prefers-reduced-motion` tetap didukung.
-   [ ] 17 game existing tidak berubah.
-   [ ] Millionaire gameplay behavior tidak berubah.
-   [ ] No backend files changed.
-   [ ] No question/data contract changed.
-   [ ] No official WWTBAM branding/assets copied.

------------------------------------------------------------------------

# 17. VALIDATION

Setelah implementasi:

1.  static CSS audit;
2.  selector scope audit;
3.  ensure no global CSS leak;
4.  verify MillionaireGame markup/data-state remains compatible;
5.  verify FSM/engine files unchanged;
6.  verify 17-game files unchanged;
7.  verify no backend files changed;
8.  verify responsive rules;
9.  verify answer states;
10. verify prize ladder states;
11. verify lifeline states;
12. verify reduced-motion.

Jika browser/headless browser tersedia, lakukan screenshot QA.

Jika tidak tersedia, jangan klaim browser PASS. Tandai manual browser QA
sebagai DEFERRED.

------------------------------------------------------------------------

# 18. REQUIRED OUTPUT

Buat:

``` text
docs/millionaire/PHASE_06B_VISUAL_SKIN_REDESIGN_AUDIT.md
```

Audit wajib memuat:

-   before/after visual rationale;
-   files changed;
-   exact CSS/markup changes;
-   question panel evidence;
-   answer panel evidence;
-   prize ladder evidence;
-   lifeline evidence;
-   header/timer evidence;
-   responsive evidence;
-   animation/reduced-motion evidence;
-   selector isolation;
-   17-game regression;
-   Millionaire engine regression;
-   files explicitly NOT changed;
-   browser QA status;
-   unresolved issues;
-   handoff.

**STOP setelah PHASE 06B selesai.**

Do not proceed to backend/U1/U2 in this phase.
