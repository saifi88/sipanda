# PHASE 01 — ARCHITECTURE & CONTRACT
## SI-PANDA v3 — Millionaire Game

**Status:** DESIGN / ARCHITECTURE ONLY  
**Phase:** 01  
**Parent Specification:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md`  
**Validation Basis:** `PHASE_00_VALIDATION_REPORT.md`

---

## 1. TUJUAN PHASE

Phase 01 bertujuan mengunci arsitektur teknis dan kontrak integrasi game **Millionaire** ke dalam copy repository release SI-PANDA v3.

Phase ini **tidak melakukan implementasi fitur**.

Output Phase 01 harus menjawab secara konkret:

1. bagaimana Millionaire ditempatkan di repository;
2. bagaimana `MillionaireGame` berkomunikasi dengan SI-PANDA v3;
3. bagaimana sumber soal Millionaire dipisahkan;
4. bagaimana state machine Millionaire bekerja;
5. bagaimana prize ladder dan lifeline direpresentasikan;
6. bagaimana hasil game dikirim ke sistem hasil yang sudah ada;
7. bagaimana skor leaderboard dipisahkan dari virtual Rupiah;
8. bagaimana dashboard mengenali game type `millionaire`;
9. bagaimana backend canonical dipilih antara `code.gs` dan `code_v2.gs`;
10. bagaimana admin mengelola soal Millionaire;
11. bagaimana desktop/mobile menggunakan asset berbeda;
12. bagaimana namespace dan cache/versioning mencegah konflik dengan 17 game existing.

---

# 2. PRINSIP ARSITEKTUR

Arsitektur Millionaire harus mengikuti prinsip berikut.

### 2.1 Additive Integration

Millionaire ditambahkan ke SI-PANDA v3 secara **additive**.

Tidak boleh mengubah perilaku existing 17 game.

Existing game:

```text
match
memory
quizrush
balloon
scramble
snake
truefalse
hangman
boss
sort
fillblank
race
tower
sequence
maze
defense
feed
```

tetap berjalan dengan kontrak dan sumber data masing-masing.

---

### 2.2 Isolated Game Module

Millionaire memiliki module sendiri:

```text
millionaire/
├── MillionaireGame.js
├── MillionaireQuestions.js
├── millionaire.css
└── assets/
```

Tidak membuat general-purpose game engine baru.

Tidak memindahkan existing game ke engine baru.

---

### 2.3 Existing Infrastructure Reuse

Millionaire boleh menggunakan infrastruktur existing SI-PANDA jika kontraknya kompatibel, terutama:

- dashboard;
- game launcher/dispatcher;
- `finishGame()`;
- `canSaveGameResult()`;
- `saveGameResult`;
- `GameResults`;
- helper metadata/HUD yang aman.

Namun state internal Millionaire tetap berada di module Millionaire.

---

### 2.4 Dedicated Question Source

Soal Millionaire **tidak** menggunakan:

```text
Games.pairs
```

dan tidak menggunakan:

```text
Soal
```

sebagai sumber produksi.

Millionaire memiliki sumber data khusus:

```text
MillionaireQuestions
```

`MillionaireQuestions.js` hanya berfungsi sebagai:

```text
fallback / demo seed
```

bukan production source of truth.

---

# 3. REPOSITORY ARCHITECTURE

Struktur target:

```text
SI-PANDA-v3-MILLIONAIRE-DEV/
│
├── index.html
├── admin.html
├── code.gs
├── code_v2.gs
│
├── games/
│   ├── GameShell.js
│   ├── GameHub.js
│   ├── gameData.js
│   └── ... existing 17 games
│
├── millionaire/
│   ├── MillionaireGame.js
│   ├── MillionaireQuestions.js
│   ├── millionaire.css
│   │
│   └── assets/
│       ├── backgrounds/
│       │   ├── desktop/
│       │   └── mobile/
│       ├── characters/
│       ├── branding/
│       ├── icons/
│       └── effects/
│
└── docs/
    └── millionaire/
        ├── PHASE_00_MILLIONAIRE_MASTER_SPEC.md
        ├── PHASE_00_VALIDATION_REPORT.md
        ├── PHASE_01_ARCHITECTURE.md
        ├── PHASE_01_ARCHITECTURE_AUDIT.md
        ├── PHASE_02_DATA_CONTRACT.md
        └── ...
```

Phase 01 harus memverifikasi struktur aktual repository development copy.

Jangan mengasumsikan struktur hanya berdasarkan master spec.

---

# 4. MODULE BOUNDARY

Millionaire harus memiliki boundary yang jelas.

## 4.1 Millionaire-owned

Module Millionaire bertanggung jawab atas:

- question selection;
- level;
- prize;
- safe level;
- answer selection;
- answer locking;
- answer reveal;
- lifeline;
- timer state;
- game state;
- walk-away;
- victory;
- wrong answer;
- internal scoring calculation;
- virtual Rupiah;
- Millionaire-specific UI.

---

## 4.2 SI-PANDA-owned

SI-PANDA tetap bertanggung jawab atas:

- student identity;
- dashboard;
- game registration/entry;
- global game metadata;
- result persistence;
- leaderboard infrastructure;
- navigation;
- authentication/session jika tersedia.

---

# 5. GAME TYPE CONTRACT

Millionaire harus dikenali sebagai:

```js
type: "millionaire"
```

Identifier tersebut harus menjadi canonical game type.

Tidak membuat variasi seperti:

```text
millionaireGame
millionaire-game
millionaire_v1
```

untuk runtime game type.

Jika repository memiliki enum/registry game type, Phase 01 harus menentukan lokasi canonical registry tersebut.

---

# 6. NAMESPACE STRATEGY

Karena SI-PANDA v3 menggunakan global browser namespace dan tidak memiliki build system modern, Millionaire wajib menghindari global collision.

Preferred strategy:

```js
window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {};
```

Semua constant, helper, configuration, dan internal state yang bersifat global harus berada di namespace tersebut.

Contoh:

```js
window.SIPANDA_MILLIONAIRE.CONFIG
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER
window.SIPANDA_MILLIONAIRE.STATES
window.SIPANDA_MILLIONAIRE.LIFELINES
```

Tidak boleh membuat global generik seperti:

```js
window.STATES
window.CONFIG
window.QUESTIONS
window.TIMER
window.LIFELINES
```

jika berpotensi bentrok dengan existing code.

Nama component/function lokal harus diverifikasi terhadap repository.

---

# 7. QUESTION DATA CONTRACT

Production question source harus menggunakan sheet:

```text
MillionaireQuestions
```

Canonical schema yang harus divalidasi:

| Field | Purpose |
|---|---|
| `id` | unique question ID |
| `mapel` | subject |
| `level` | Millionaire level 1–15 |
| `question` | question text |
| `optionA` | answer A |
| `optionB` | answer B |
| `optionC` | answer C |
| `optionD` | answer D |
| `answer` | correct option index 0–3 |
| `prize` | virtual Rupiah |
| `isSafe` | safe-level marker |
| `explanation` | post-answer explanation |

Phase 01 harus menentukan:

- canonical field names;
- type masing-masing field;
- valid range;
- required/optional status;
- normalization rule;
- invalid-row behavior;
- duplicate ID behavior;
- missing question behavior.

Jangan mengubah schema tanpa alasan yang terdokumentasi.

---

# 8. QUESTION SOURCE FLOW

Target flow:

```text
MillionaireGame
      │
      ▼
Millionaire Question Reader
      │
      ├── production source
      │       │
      │       ▼
      │   MillionaireQuestions sheet
      │
      └── fallback
              │
              ▼
      MillionaireQuestions.js
```

Production source harus menjadi source of truth.

`MillionaireQuestions.js` hanya fallback/demo.

Fallback tidak boleh diam-diam menggantikan production source ketika production data tersedia.

Phase 01 harus menentukan:

- backend function untuk membaca sheet;
- response format;
- filtering by mapel;
- filtering by level;
- active/valid question handling;
- caching policy;
- fallback trigger.

---

# 9. PRIZE LADDER CONTRACT

Millionaire menggunakan 15 level berikut:

| Level | Prize | Safe |
|---:|---:|:---:|
| 1 | Rp100 | |
| 2 | Rp200 | |
| 3 | Rp300 | |
| 4 | Rp500 | |
| 5 | Rp1.000 | ✓ |
| 6 | Rp2.000 | |
| 7 | Rp4.000 | |
| 8 | Rp8.000 | |
| 9 | Rp16.000 | |
| 10 | Rp32.000 | ✓ |
| 11 | Rp64.000 | |
| 12 | Rp125.000 | |
| 13 | Rp250.000 | |
| 14 | Rp500.000 | |
| 15 | Rp1.000.000 | ✓ FINAL |

Prize ladder harus memiliki satu canonical representation.

Tidak boleh terdapat beberapa ladder yang berbeda antara:

- frontend;
- backend;
- admin;
- result calculation.

Jika `prize` berasal dari question row, Phase 01 harus menentukan apakah nilai tersebut divalidasi terhadap canonical ladder atau dianggap authoritative.

---

# 10. SAFE MONEY CONTRACT

Safe levels:

```text
Level 5  → Rp1.000
Level 10 → Rp32.000
Level 15 → Rp1.000.000 FINAL
```

Konsep:

```text
virtualRupiah
safeRupiah
```

harus dipisahkan.

Jika pemain salah setelah mencapai safe level, hasil virtual prize tidak boleh kembali ke nol.

Phase 01 harus menetapkan formula:

```text
safeRupiah = highest reached safe prize
```

dan kondisi game-over/wrong answer.

---

# 11. SCORE CONTRACT

Virtual Rupiah **bukan** leaderboard score.

Field:

```text
skor
```

tetap merupakan normalized leaderboard score sesuai kontrak SI-PANDA existing.

Millionaire boleh memiliki:

```text
virtualRupiah
safeRupiah
```

sebagai metric tambahan.

Target result concept:

```js
{
  gameId,
  title,
  mapel,
  type: "millionaire",
  skor,
  benar,
  salah,
  durasiDetik,
  level,
  virtualRupiah,
  safeRupiah,
  walkAway,
  lifelinesUsed
}
```

Phase 01 harus memeriksa kontrak aktual `GameResults` dan menentukan strategi additive terbaik tanpa merusak 11 kolom existing.

---

# 12. STATE MACHINE CONTRACT

Millionaire menggunakan state berikut:

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

State machine harus explicit.

Target conceptual flow:

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
  ├── CORRECT
  │      ├── next level → QUESTION
  │      └── level 15 → VICTORY
  │
  └── WRONG
         ├── GAME_OVER
         └── result calculation

SELECTING
  ├── lifeline
  ├── answer selection
  └── walk away → SAFE_EXIT

SAFE_EXIT
  ↓
FINISHED

GAME_OVER
  ↓
FINISHED

VICTORY
  ↓
FINISHED
```

Phase 01 harus mendefinisikan:

- allowed transitions;
- forbidden transitions;
- state entry/exit;
- state data;
- timer behavior;
- answer lock behavior;
- result submission point;
- prevention of duplicate finish/save.

---

# 13. LIFELINE CONTRACT

Three lifelines:

```text
50:50
Tanya Kelas
Tanya Teman
```

Each can be used once per game.

Canonical state:

```js
lifelines: {
  fiftyFifty: false,
  askClass: false,
  askFriend: false
}
```

Phase 01 harus menentukan:

- when lifeline can be activated;
- whether lifeline is allowed before answer lock;
- effect on options/question;
- whether usage is persisted;
- how usage is represented in result;
- duplicate activation prevention.

Lifeline tidak boleh membuat answer langsung otomatis terkunci kecuali memang ditentukan oleh master spec.

---

# 14. TIMER CONTRACT

Phase 01 harus mengaudit timer existing SI-PANDA sebelum menentukan implementasi Millionaire.

Timer Millionaire harus:

- memiliki lifecycle jelas;
- berhenti ketika game tidak aktif;
- tidak double-start;
- tidak terus berjalan setelah answer locked;
- tidak menyebabkan duplicate state transition;
- tidak menyebabkan duplicate result submission.

Jika timer timeout merupakan bagian dari gameplay, timeout harus memiliki transition state yang jelas.

Phase 01 tidak boleh mengimplementasikan timer; hanya menetapkan kontraknya.

---

# 15. RESULT INTEGRATION CONTRACT

Target result flow:

```text
Millionaire
   ↓
finishGame()
   ↓
canSaveGameResult()
   ↓
saveGameResult()
   ↓
GameResults
```

Phase 01 harus memverifikasi apakah flow aktual repository benar-benar sama.

Millionaire tidak boleh membuat result storage baru tanpa kebutuhan arsitektural yang kuat.

Existing fields harus dipertahankan.

Additional Millionaire data dapat menggunakan:

### Option A — additive columns

atau

### Option B — dedicated detail payload

Phase 01 harus memilih satu berdasarkan kondisi repository aktual.

Pilihan harus mempertimbangkan:

- backward compatibility;
- dashboard compatibility;
- Apps Script implementation;
- spreadsheet stability;
- ease of reporting;
- future Millionaire expansion.

---

# 16. DASHBOARD INTEGRATION

Dashboard existing tetap menjadi entry point.

Target:

```text
Dashboard
   ↓
Game selection
   ↓
type === "millionaire"
   ↓
MillionaireGame
```

Millionaire tidak membuat dashboard terpisah untuk siswa.

Phase 01 harus menentukan:

- registry/dispatcher location;
- metadata format;
- game title;
- subject;
- active/inactive behavior;
- launcher behavior;
- result return behavior.

Existing games harus tetap menggunakan dispatcher mereka tanpa perubahan perilaku.

---

# 17. ADMIN ARCHITECTURE

Millionaire question management harus dipisahkan dari admin existing 17 games.

Target:

```text
Admin
├── Existing Game Admin
└── Millionaire Question Admin
```

Millionaire admin bertanggung jawab terhadap:

- create question;
- edit question;
- delete/deactivate question;
- level;
- answer;
- prize validation;
- safe flag;
- explanation;
- mapel.

Production source tetap:

```text
MillionaireQuestions
```

Phase 01 harus menentukan apakah implementasi paling tepat berupa:

- dedicated admin tab;
- dedicated panel;
- dedicated route/view;
- atau extension terisolasi dari admin existing.

Jangan memasukkan question Millionaire ke `Games.pairs`.

---

# 18. BACKEND CANONICAL SOURCE

Repository memiliki:

```text
code.gs
code_v2.gs
```

Phase 01 **wajib memeriksa deployment/source-of-truth aktual**.

Tidak boleh mengasumsikan `code_v2.gs` otomatis canonical hanya karena namanya `v2`.

Audit harus menentukan:

1. file mana yang saat ini menjadi source deployment;
2. apakah keduanya memiliki function overlap;
3. apakah keduanya memiliki schema berbeda;
4. bagaimana deployment Apps Script menggunakannya;
5. apakah Millionaire backend helper harus masuk ke salah satu file;
6. apakah diperlukan canonicalization sebelum Phase 02.

Jika status deployment tidak dapat diverifikasi dari repository, tuliskan sebagai unresolved architecture risk.

Jangan melakukan perubahan backend pada Phase 01.

---

# 19. RESPONSIVE ARCHITECTURE

Millionaire memiliki dua composition mode.

### Desktop

```text
landscape
```

Menggunakan:

```text
millionaire/assets/backgrounds/desktop/
```

### Mobile

```text
portrait-native
```

Menggunakan:

```text
millionaire/assets/backgrounds/mobile/
```

Mobile **bukan crop desktop**.

Background hanya berfungsi sebagai visual atmosphere.

Dynamic UI tetap berupa:

```text
HTML
CSS
JS
```

Dynamic elements:

- question;
- options A–D;
- prize ladder;
- timer;
- lifelines;
- score/prize;
- state feedback.

Phase 01 harus menentukan responsive breakpoint/strategy berdasarkan struktur existing SI-PANDA.

---

# 20. ASSET CONTRACT

Asset gameplay:

```text
desktop/stage-gameplay
mobile/stage-gameplay
```

Asset intro:

```text
desktop/stage-intro
mobile/stage-intro
```

Phase 01 harus memeriksa:

- actual filename;
- actual extension;
- pixel dimensions;
- file size;
- transparency jika ada;
- browser compatibility;
- loading strategy.

Jangan menganggap asset JPG/PNG/WebP berdasarkan nama saja.

Asset B1–B4 harus diverifikasi secara pixel-level dari repository development copy.

---

# 21. SCRIPT LOADING CONTRACT

Repository menggunakan:

- React 18 UMD;
- ReactDOM 18;
- Babel standalone;
- Tailwind CDN;
- `<script type="text/babel" src="...">`.

Phase 01 harus menentukan:

1. posisi loading `MillionaireGame.js`;
2. posisi loading `millionaire.css`;
3. dependency terhadap existing globals;
4. dependency ordering;
5. apakah module dapat dimuat tanpa mengganggu 17 game.

Tidak boleh memperkenalkan build tooling baru pada Phase 01.

---

# 22. CACHE / VERSION CONTRACT

Karena aplikasi menggunakan deployment web dan browser caching, Millionaire harus memiliki strategi versioning yang kompatibel dengan existing repository.

Phase 01 harus mengaudit:

- existing asset cache-busting;
- script query version;
- CSS version;
- `WEB_APP_URL`;
- duplicate URL declarations;
- deployment version assumptions.

Setiap strategi baru harus additive dan tidak merusak existing cache behavior.

---

# 23. SECURITY / DATA VALIDATION

Question data dari backend harus dianggap untrusted input.

Minimal validation contract:

```text
id valid
level 1–15
question non-empty
A-D non-empty
answer 0–3
prize valid
safe flag valid
```

Frontend tidak boleh bergantung pada `answer` dari UI state yang dapat dimanipulasi secara trivial tanpa validasi sesuai arsitektur backend yang tersedia.

Phase 01 harus mencatat batas keamanan realistis dari aplikasi Apps Script/browser.

---

# 24. ANTI-FARM / RESULT INTEGRITY

Millionaire harus mengikuti prinsip anti-farming existing SI-PANDA sejauh kompatibel.

Phase 01 wajib memetakan:

```text
Millionaire result
        ↓
existing anti-farm mechanism
        ↓
GameResults
```

Jika existing anti-farm bergantung pada `gameId`, `type`, atau field tertentu, Millionaire harus memiliki mapping yang jelas.

Jangan mengubah anti-farm global hanya untuk Millionaire tanpa alasan.

---

# 25. ERROR / FALLBACK CONTRACT

Phase 01 harus menentukan perilaku untuk:

### Backend unavailable

```text
show controlled error
```

### No production questions

```text
fallback/demo policy
```

### Invalid question row

```text
skip/reject according to contract
```

### Missing level

```text
do not silently invent question
```

### Duplicate question ID

```text
deterministic handling
```

### Result save failure

```text
game completion must not corrupt state
```

Error handling harus memiliki state/UX yang jelas.

---

# 26. PROHIBITED ARCHITECTURAL CHANGES

Phase 01 tidak boleh:

- rewrite existing 17 games;
- mengganti GameShell secara global;
- membuat general game engine baru;
- mencampur question Millionaire dengan `Games.pairs`;
- mencampur question Millionaire dengan `Soal`;
- mengganti leaderboard architecture;
- mengganti dashboard architecture secara besar;
- menghapus `code.gs`/`code_v2.gs`;
- mengganti React version;
- menambahkan build system;
- memasukkan official Who Wants to Be a Millionaire assets;
- memasukkan copyrighted music/logo.

---

# 27. REQUIRED PHASE 01 AUDIT OUTPUT

OpenCode harus menghasilkan:

```text
docs/millionaire/PHASE_01_ARCHITECTURE_AUDIT.md
```

Laporan minimal harus memiliki:

```text
1. Repository Architecture Findings
2. Existing Integration Points
3. Backend Source-of-Truth Finding
4. Question Source Finding
5. Result Contract Finding
6. Game Dispatcher Finding
7. Namespace Collision Finding
8. Responsive/Asset Finding
9. Admin Architecture Finding
10. Cache/Version Finding
11. Risks
12. Decisions
13. Unresolved Items
14. Recommendation for Phase 02
```

---

# 28. DECISION MATRIX

OpenCode harus mengisi matrix berikut berdasarkan repository aktual:

| Area | Current State | Decision | Evidence | Risk |
|---|---|---|---|---|
| Game dispatcher | TBD | TBD | repository | TBD |
| Question source | TBD | Dedicated sheet | repository/spec | TBD |
| Fallback questions | TBD | JS fallback | spec | Low |
| Result storage | TBD | Existing GameResults | repository | TBD |
| Score | TBD | normalized `skor` | spec/repository | TBD |
| Virtual prize | TBD | separate metric | spec | Low |
| Backend canonical | TBD | TBD | deployment audit | HIGH if unresolved |
| Namespace | TBD | `SIPANDA_MILLIONAIRE` | architecture | Low |
| Admin | TBD | dedicated Millionaire admin | spec | Medium |
| Desktop layout | TBD | native desktop | asset spec | Low |
| Mobile layout | TBD | native portrait | asset spec | Medium |
| Cache/version | TBD | TBD | repository | Medium |

---

# 29. PHASE 01 EXIT CRITERIA

Phase 01 dianggap selesai hanya jika:

- [ ] repository architecture telah diverifikasi;
- [ ] Millionaire module boundary terkunci;
- [ ] canonical `type: "millionaire"` terkunci;
- [ ] namespace strategy terkunci;
- [ ] question schema terkunci;
- [ ] dedicated question source terkunci;
- [ ] fallback policy terkunci;
- [ ] prize ladder terkunci;
- [ ] safe-money contract terkunci;
- [ ] score vs Rupiah contract terkunci;
- [ ] FSM 12 state terdefinisi;
- [ ] lifeline contract terdefinisi;
- [ ] result integration strategy dipilih;
- [ ] dashboard integration point ditemukan;
- [ ] admin architecture dipilih;
- [ ] `code.gs` vs `code_v2.gs` canonical status diaudit;
- [ ] responsive architecture diverifikasi;
- [ ] B1–B4 asset metadata diverifikasi;
- [ ] namespace collision audit dilakukan;
- [ ] cache/version strategy ditemukan;
- [ ] unresolved risks dicatat;
- [ ] tidak ada production code yang diubah sebagai bagian dari Phase 01.

---

# 30. PHASE 02 HANDOFF

Phase 01 harus menghasilkan cukup informasi agar Phase 02 dapat langsung menyusun:

```text
PHASE_02_DATA_CONTRACT.md
```

tanpa perlu mengulang audit repository dari awal.

Phase 02 akan menggunakan keputusan Phase 01 untuk mengunci:

- MillionaireQuestions schema;
- backend response contract;
- frontend question model;
- result payload;
- validation rules;
- data normalization;
- sheet contract.

**Phase 01 tidak melakukan implementasi.**

---

## END OF PHASE 01 ARCHITECTURE SPEC