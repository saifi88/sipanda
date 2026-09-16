# PHASE 04 — GAME ENGINE
## SI-PANDA v3 · Millionaire Game

> **Status:** READY FOR IMPLEMENTATION  
> **Scope:** Millionaire gameplay engine/runtime only  
> **Tanggal:** 2026-09-15  
> **Parent Specs:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_03_DATA_LAYER.md`  
> **Prerequisite:** Phase 03 Data Layer PASS  
> **Primary Output:** `millionaire/MillionaireGame.js`  
> **Required Audit:** `docs/millionaire/PHASE_04_GAME_ENGINE_AUDIT.md`

---

# 1. Tujuan

Phase 04 membangun **engine gameplay Millionaire** di atas data layer yang sudah dikunci pada Phase 03.

Engine harus mampu menjalankan satu sesi permainan Millionaire secara lengkap:

```text
INIT
  ↓
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
CORRECT / WRONG
  ↓
QUESTION berikutnya
  ↓
SAFE_EXIT / GAME_OVER / VICTORY
  ↓
FINISHED
```

Engine harus bersifat **isolated** dari 17 game SI-PANDA yang sudah ada.

Phase ini **bukan** fase visual skin.

---

# 2. Hard Boundary

## 2.1 BOLEH

Phase 04 boleh membuat atau mengubah:

- `millionaire/MillionaireGame.js`
- helper runtime yang benar-benar diperlukan oleh Millionaire
- integrasi dispatcher minimal agar `type === "millionaire"` dapat menjalankan game
- integrasi runtime dengan data layer Phase 03
- lifecycle permainan
- FSM
- timer
- answer selection
- answer locking
- reveal
- safe level
- walk-away
- lifeline runtime
- prize ladder runtime
- score calculation
- result payload preparation
- cleanup/unmount runtime
- audit dan contract tests Phase 04

## 2.2 DILARANG

Jangan membuat atau mengubah:

- general game engine
- `GameShell` behavior
- behavior 17 game existing
- `Games.pairs`
- existing `Soal` question source
- existing game question schema
- `MillionaireQuestions` schema
- `PRIZE_LADDER` baru
- production fallback seed baru
- admin UI
- Millionaire admin CRUD
- visual skin final
- background assets
- character assets
- music/audio system
- general dashboard redesign
- leaderboard redesign
- unrelated backend refactor

Jika perubahan pada existing file diperlukan, perubahan harus **minimal, additive, dan specifically justified untuk dispatcher/integrasi Millionaire**.

---

# 3. Prinsip Arsitektur

Millionaire memiliki runtime sendiri:

```text
SI-PANDA Dashboard
       ↓
activeGame.type === "millionaire"
       ↓
MillionaireGame
       ↓
MillionaireData
       ↓
Production / Fallback Question Set
```

Jangan membuat general-purpose engine hanya untuk mengakomodasi Millionaire.

Millionaire boleh menggunakan:

- existing `finishGame()`
- existing `canSaveGameResult()`
- existing `saveGameResult`
- existing dashboard/result infrastructure

tetapi lifecycle internal Millionaire tetap dikelola oleh `MillionaireGame`.

---

# 4. Entry Contract

Canonical game type:

```js
type === "millionaire"
```

Dispatcher harus memastikan:

```js
if (activeGame.type === "millionaire") {
    return <MillionaireGame ... />;
}
```

Branch Millionaire harus ditempatkan sebelum fallback existing game.

Jangan mengubah behavior branch 17 game existing.

---

# 5. Namespace

Runtime constants/helpers harus menggunakan namespace:

```js
window.SIPANDA_MILLIONAIRE
```

Contoh:

```js
window.SIPANDA_MILLIONAIRE =
    window.SIPANDA_MILLIONAIRE || {};
```

Gunakan namespace yang sudah dibuat Phase 03.

Jangan membuat namespace global baru jika tidak diperlukan.

---

# 6. Data Source Contract

Engine **tidak boleh membuat question schema sendiri**.

Gunakan data layer Phase 03:

```js
window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS
```

dan production response:

```js
initData.millionaireQuestions
```

Question model yang diterima engine:

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

`answer`:

```text
0 = A
1 = B
2 = C
3 = D
```

---

# 7. Question Set Loading

Engine harus meminta satu set:

```text
15 questions
L1 → L15
```

untuk `mapel` aktif.

Gunakan helper Phase 03:

```js
resolveQuestionSource()
buildMillionaireQuestionSet()
```

Engine tidak boleh:

- membuat pertanyaan baru
- mengambil pertanyaan dari `Games.pairs`
- mengambil pertanyaan dari `Soal`
- mencampur production dan fallback per level
- melewati level yang hilang
- mengganti level yang hilang dengan level mapel lain

Jika set tidak lengkap:

```js
{
    ok: false,
    reason: "INCOMPLETE_LEVEL_SET",
    missingLevels: [...]
}
```

harus diperlakukan sebagai controlled error.

---

# 8. Runtime State Machine

Engine WAJIB menggunakan 12 state berikut:

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

Jangan menambah state alternatif yang mengubah contract tanpa audit.

---

# 9. State Semantics

## 9.1 INTRO

Tujuan:

- menampilkan entry state
- game belum berjalan
- belum ada timer aktif
- belum ada jawaban aktif

Allowed transition:

```text
INTRO → READY
```

---

## 9.2 READY

Tujuan:

- question set sudah siap
- permainan siap dimulai

Allowed:

```text
READY → QUESTION
```

Timer belum berjalan sebelum QUESTION aktif.

---

## 9.3 QUESTION

Tujuan:

- menampilkan soal aktif
- menampilkan pilihan A–D
- menampilkan prize level
- mengaktifkan timer
- mengizinkan lifeline

Question aktif:

```js
questions[currentIndex]
```

Level harus:

```js
currentIndex + 1
```

---

## 9.4 SELECTING

Tujuan:

- player memilih salah satu option
- selection belum final
- player masih dapat membatalkan selection sebelum lock

State:

```js
selectedAnswer = 0 | 1 | 2 | 3
```

Tidak boleh dianggap benar/salah sebelum LOCKED → REVEAL.

---

## 9.5 LOCKED

Tujuan:

- jawaban telah dikunci
- input answer tidak boleh berubah
- timer harus dihentikan
- lifeline tidak dapat digunakan lagi untuk question tersebut

Transition:

```text
LOCKED → REVEAL
```

---

## 9.6 REVEAL

Engine membandingkan:

```js
selectedAnswer === question.answer
```

Engine kemudian menentukan:

```text
REVEAL → CORRECT
REVEAL → WRONG
```

Tidak boleh langsung melompat ke final result tanpa state CORRECT/WRONG.

---

## 9.7 CORRECT

Jika jawaban benar:

- increment `correct`
- update highest reached level
- tentukan apakah level berikutnya tersedia
- jika level 15 → VICTORY
- selain itu → QUESTION berikutnya

Transition:

```text
CORRECT → QUESTION
CORRECT → VICTORY
```

---

## 9.8 WRONG

Jika jawaban salah:

- increment `wrong`
- game berhenti
- hitung safe money sesuai contract
- lanjut ke GAME_OVER

```text
WRONG → GAME_OVER
```

`wrong` maksimum normal:

```text
1
```

---

## 9.9 SAFE_EXIT

State untuk walk-away setelah player memilih keluar secara sukarela.

```text
QUESTION → SAFE_EXIT
```

Tidak ada pertanyaan baru setelah SAFE_EXIT.

---

## 9.10 GAME_OVER

Terminal gameplay state untuk kegagalan.

```text
WRONG → GAME_OVER
```

GAME_OVER kemudian dapat menuju:

```text
GAME_OVER → FINISHED
```

---

## 9.11 VICTORY

Terminal success state:

```text
level 15 answered correctly
```

Prize:

```text
Rp1.000.000
```

Transition:

```text
VICTORY → FINISHED
```

---

## 9.12 FINISHED

Final lifecycle state.

Setelah FINISHED:

- timer tidak boleh aktif
- answer tidak dapat dipilih
- lifeline tidak dapat digunakan
- state tidak dapat kembali ke QUESTION
- result persistence hanya boleh diproses sekali

---

# 10. Allowed State Transition Matrix

| Current | Allowed Next |
|---|---|
| INTRO | READY |
| READY | QUESTION |
| QUESTION | SELECTING, SAFE_EXIT |
| SELECTING | SELECTING, LOCKED, SAFE_EXIT |
| LOCKED | REVEAL |
| REVEAL | CORRECT, WRONG |
| CORRECT | QUESTION, VICTORY |
| WRONG | GAME_OVER |
| SAFE_EXIT | FINISHED |
| GAME_OVER | FINISHED |
| VICTORY | FINISHED |
| FINISHED | none |

Illegal transition harus ditolak.

Contoh:

```text
FINISHED → QUESTION
```

tidak boleh terjadi.

---

# 11. Runtime State Model

Minimal runtime state:

```js
{
    state: "INTRO",

    mapel: null,

    questions: [],

    currentIndex: 0,
    currentLevel: 0,

    selectedAnswer: null,

    correct: 0,
    wrong: 0,

    highestLevel: 0,

    virtualRupiah: 0,
    safeRupiah: 0,

    walkAway: false,

    lifelinesUsed: {
        fiftyFifty: false,
        askClass: false,
        askFriend: false
    },

    startedAt: null,
    finishedAt: null,
    durationDetik: 0,

    timerRemaining: null,

    resultSaved: false
}
```

Nama internal boleh berbeda jika diperlukan, tetapi semantics harus sama.

---

# 12. Prize Ladder

Gunakan **satu-satunya canonical ladder** dari Phase 03:

```js
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER
```

15 level:

| Level | Virtual Rupiah | Safe |
|---:|---:|:---:|
| 1 | Rp100 | No |
| 2 | Rp200 | No |
| 3 | Rp300 | No |
| 4 | Rp500 | No |
| 5 | Rp1.000 | **YES** |
| 6 | Rp2.000 | No |
| 7 | Rp4.000 | No |
| 8 | Rp8.000 | No |
| 9 | Rp16.000 | No |
| 10 | Rp32.000 | **YES** |
| 11 | Rp64.000 | No |
| 12 | Rp125.000 | No |
| 13 | Rp250.000 | No |
| 14 | Rp500.000 | No |
| 15 | Rp1.000.000 | **YES / FINAL** |

Engine tidak boleh mendefinisikan ladder kedua.

---

# 13. Virtual Money

`virtualRupiah` berbeda dari leaderboard `skor`.

Virtual money:

```js
virtualRupiah = prize reached
```

Leaderboard score tetap:

```text
0–100
```

Jangan menggunakan Rupiah sebagai `skor`.

---

# 14. Level Semantics

Level aktif:

```js
currentLevel = currentIndex + 1
```

Highest reached level:

```text
level 1–15
```

Engine harus menyimpan level terminal/highest yang dicapai.

Tidak boleh menghasilkan:

```text
level = "Rp32.000"
```

Level tetap numeric secara runtime.

Saat membentuk anti-farm key/result contract, gunakan:

```js
String(level)
```

---

# 15. Score

Canonical score:

```js
Math.round((levelReached / 15) * 100)
```

Score:

```text
0–100
```

Score tidak menggantikan:

- virtualRupiah
- safeRupiah

Ketiganya merupakan nilai berbeda.

---

# 16. Safe Money

Safe levels:

```text
5
10
15
```

Safe money harus berasal dari safe level tertinggi yang telah benar-benar dicapai.

Contoh:

```text
menang sampai L7
→ safeRupiah = Rp1.000
```

```text
menang sampai L12
→ safeRupiah = Rp32.000
```

```text
walk away pada L13
→ safeRupiah = Rp32.000
```

Engine tidak boleh menganggap level yang belum berhasil dijawab sebagai safe money.

---

# 17. Walk Away

Player boleh memilih keluar dari permainan saat question aktif.

Flow:

```text
QUESTION
    ↓
SAFE_EXIT
    ↓
FINISHED
```

Saat walk-away:

```js
walkAway = true
```

Tidak ada increment `correct`.

Tidak ada `wrong`.

Virtual prize mengikuti level terakhir yang telah berhasil dicapai.

Safe prize mengikuti safe level tertinggi yang telah dicapai.

---

# 18. Answer Selection

Selection hanya valid untuk:

```text
0, 1, 2, 3
```

Representasi:

```text
0 → A
1 → B
2 → C
3 → D
```

Saat SELECTING:

```js
selectedAnswer = index
```

Saat LOCKED:

```js
lockedAnswer = selectedAnswer
```

Setelah LOCKED:

- selection tidak dapat berubah
- click option harus diabaikan
- timer berhenti

---

# 19. Correct Answer

Correct:

```js
selectedAnswer === question.answer
```

Jika benar:

```text
correct += 1
highestLevel = currentLevel
virtualRupiah = question.prize
```

Kemudian:

```text
L1–L14 → next question
L15 → VICTORY
```

---

# 20. Wrong Answer

Jika salah:

```text
wrong += 1
```

Jangan menambah correct.

Virtual money tidak boleh dianggap sebagai prize level yang belum berhasil.

Game:

```text
WRONG → GAME_OVER
```

---

# 21. Timer

Timer merupakan bagian engine, bukan UI.

Timer harus:

- aktif hanya pada QUESTION
- berhenti saat LOCKED
- berhenti pada SAFE_EXIT
- berhenti pada WRONG
- berhenti pada VICTORY
- berhenti pada FINISHED
- dibersihkan saat component unmount

Jangan meninggalkan:

```js
setInterval()
setTimeout()
```

yang aktif setelah game selesai.

---

# 22. Timer Duration

Durasi timer per level **harus mengikuti nilai yang sudah ditentukan/diterima dari konfigurasi game**.

Jangan mengarang nilai baru jika konfigurasi existing belum memberikan angka canonical.

Jika Phase 01/00 tidak memberikan angka timer yang dapat diverifikasi dari repository, implementasikan timer sebagai konfigurasi runtime yang terisolasi dan dokumentasikan unresolved value di audit.

Jangan diam-diam mengunci angka baru sebagai contract.

---

# 23. Timer Expiry

Jika timer mencapai:

```text
0
```

dan answer belum LOCKED:

```text
QUESTION → WRONG → GAME_OVER
```

Timer expiry dianggap kegagalan question.

Tidak boleh:

```text
timer 0 → auto-correct
timer 0 → next question
```

---

# 24. Lifelines

Tiga lifeline canonical:

```text
50:50
Tanya Kelas
Tanya Teman
```

Masing-masing hanya dapat digunakan satu kali per game.

Runtime:

```js
lifelinesUsed: {
    fiftyFifty: false,
    askClass: false,
    askFriend: false
}
```

---

# 25. Lifeline 50:50

Saat digunakan:

- hanya dapat digunakan pada QUESTION/SELECTING sebelum LOCKED
- hanya sekali
- dua option salah harus dieliminasi
- answer benar tidak boleh dieliminasi

Engine menyimpan state elimination untuk question aktif.

Contoh:

```js
hiddenOptions: [1, 3]
```

Jangan mengubah `question.options`.

Lifeline hanya mengubah presentation state.

---

# 26. Tanya Kelas

Saat digunakan:

- hanya sekali per game
- hanya sebelum LOCKED
- tidak mengubah `question.answer`
- menghasilkan data bantuan untuk UI

Engine boleh menyediakan hasil terstruktur seperti:

```js
{
    A: 20,
    B: 10,
    C: 60,
    D: 10
}
```

Nilai tersebut merupakan simulation/runtime aid.

Jangan mengubah canonical question answer.

---

# 27. Tanya Teman

Saat digunakan:

- hanya sekali per game
- hanya sebelum LOCKED
- menghasilkan bantuan tekstual/structured suggestion
- tidak mengubah canonical answer

Contoh internal result:

```js
{
    suggestedAnswer: 2,
    confidence: "medium"
}
```

UI bebas menentukan bagaimana bantuan tersebut ditampilkan.

---

# 28. Lifeline Lock Rules

Setelah:

```text
LOCKED
```

semua lifeline harus disabled untuk question tersebut.

Setelah game selesai:

```text
SAFE_EXIT
GAME_OVER
VICTORY
FINISHED
```

semua lifeline disabled.

---

# 29. Lifeline Persistence

Lifeline usage disimpan dalam result:

```js
extra: {
    walkAway,
    lifelinesUsed: {
        fiftyFifty,
        askClass,
        askFriend
    }
}
```

Jangan membuat kolom GameResults baru untuk setiap lifeline.

---

# 30. Result Payload

Engine harus mempersiapkan result menggunakan existing result flow:

```text
MillionaireGame
    ↓
finishGame()
    ↓
canSaveGameResult()
    ↓
saveGameResult
```

Result base fields tetap:

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
```

Millionaire additive fields:

```text
level
virtualRupiah
safeRupiah
extra
```

---

# 31. Result Field Mapping

| Field | Value |
|---|---|
| `gameId` | canonical Millionaire game ID |
| `game` | Millionaire game name |
| `mapel` | active mapel |
| `tipe` | `millionaire` |
| `skor` | normalized 0–100 |
| `benar` | 0–15 |
| `salah` | 0–1 |
| `durasiDetik` | actual elapsed duration |
| `level` | highest reached/terminal level |
| `virtualRupiah` | prize actually reached |
| `safeRupiah` | highest achieved safe prize |
| `extra` | JSON metadata |

---

# 32. `extra` Contract

Minimum:

```js
{
    walkAway: false,

    lifelinesUsed: {
        fiftyFifty: false,
        askClass: false,
        askFriend: false
    },

    prizeLadderSnapshot: [...]
}
```

`prizeLadderSnapshot` digunakan untuk audit compatibility.

Jangan menyimpan seluruh question bank ke `extra`.

Jangan menyimpan unnecessary PII.

---

# 33. U2 Gate — GameResults

**U2 tetap BLOCKED.**

Phase 04 boleh:

- membentuk payload
- menguji payload secara lokal
- membuat helper adapter terisolasi
- menyiapkan mapping

Phase 04 **tidak boleh mengklaim production result persistence aman** sebelum staging test U2 selesai.

Staging harus membuktikan:

1. existing 11-column rows tetap terbaca;
2. 15-column Millionaire row dapat ditulis;
3. columns 12–15 dapat dibaca;
4. old rows tidak rusak;
5. tidak ada positional shift.

Phase 04 tidak boleh melakukan destructive migration.

---

# 34. U1 Gate — Backend Canonical

**U1 tetap UNVERIFIED/BLOCKED.**

Phase 04 tidak boleh mengklaim bahwa:

```text
code.gs
```

atau:

```text
code_v2.gs
```

sudah pasti merupakan source production yang deployed.

Production question loading:

```text
Google Sheet
    ↓
deployed backend
    ↓
getInitData
```

masih bergantung pada verifikasi U1.

Fallback harus tetap memungkinkan local/demo runtime.

---

# 35. Result Save Guard

Result tidak boleh tersimpan dua kali dari satu session.

Gunakan:

```js
resultSaved
```

sebagai runtime guard.

Pattern:

```js
if (resultSaved) return;
resultSaved = true;
```

Jika save gagal:

- game state tetap FINISHED
- jangan mengulang game
- jangan memicu infinite retry
- audit/log error secara controlled

---

# 36. Anti-Farm

Gunakan existing contract:

```js
canSaveGameResult(nisn, gameId, level)
```

Anti-farm key:

```js
game_last_${nisn}_${gameId}_${String(level)}
```

Window:

```text
30 seconds
```

Jangan menggunakan virtualRupiah sebagai pengganti level untuk anti-farm.

---

# 37. Game ID

Gunakan canonical Millionaire game ID yang diberikan oleh active game configuration.

Recommended pattern:

```text
millionaire-{mapel}-01
```

Jika repository existing memiliki `id` berbeda, **jangan mengganti data existing secara otomatis**.

Gunakan active game's actual ID dan dokumentasikan mapping jika berbeda.

---

# 38. Duration

Engine menyimpan:

```js
startedAt
finishedAt
durationDetik
```

Duration harus dihitung dari actual gameplay session.

Jangan memasukkan waktu:

- sebelum READY
- setelah FINISHED

jika lifecycle repository menentukan gameplay duration secara terpisah.

---

# 39. Restart / New Game

Setelah:

```text
FINISHED
```

restart harus membuat state baru.

Jangan menggunakan object state lama secara mutable.

New session harus reset:

```text
currentIndex
selectedAnswer
correct
wrong
highestLevel
virtualRupiah
safeRupiah
walkAway
lifelinesUsed
timer
resultSaved
```

---

# 40. Cleanup

Saat component unmount:

- clear interval
- clear timeout
- cancel pending timer callback
- remove event listeners yang dibuat engine
- hentikan result callback yang tidak relevan

Tidak boleh terjadi state update setelah component sudah unmount.

---

# 41. React Integration

Stack existing:

```text
React 18 UMD
ReactDOM 18
Babel Standalone
Tailwind CDN
```

Millionaire harus mengikuti stack tersebut.

Jangan menambahkan:

- npm
- bundler
- Vite
- Webpack
- ESBuild pipeline
- dependency manager

kecuali repository memang sudah menggunakannya.

---

# 42. Script Loading

`MillionaireData.js` harus tersedia sebelum:

```text
MillionaireGame.js
```

Runtime loading harus konsisten dengan existing script architecture.

Jika menambah script:

- gunakan cache/version convention existing
- update version hanya jika memang diperlukan
- jangan membuat duplicate script loading

---

# 43. Error States

Engine harus menangani minimal:

### A. Question source unavailable

```text
fallback → continue
```

jika fallback valid.

### B. Question set incomplete

```text
controlled error
```

dengan:

```js
reason: "INCOMPLETE_LEVEL_SET"
```

### C. Invalid answer

Jangan crash.

### D. Invalid current question

Stop controlled gameplay dan jangan save corrupted result.

### E. Result save failure

Game tetap FINISHED.

### F. Timer callback after finish

Ignore callback.

---

# 44. No Silent Recovery

Dilarang:

```text
missing L8
→ pakai L7 lagi
```

atau:

```text
missing L15
→ ambil L15 mapel lain
```

atau:

```text
invalid question
→ generate question baru
```

atau:

```text
answer invalid
→ random answer
```

Semua harus menjadi controlled failure.

---

# 45. Question Immutability

Canonical question:

```js
question.options
question.answer
question.prize
question.isSafe
```

tidak boleh dimodifikasi selama gameplay.

Runtime-only state harus berada di luar object question:

```js
selectedAnswer
hiddenOptions
lifelineResults
lockedAnswer
```

---

# 46. Determinism

Question selection antar duplicate `mapel + level` mengikuti helper Phase 03.

Engine tidak boleh melakukan randomisasi ulang setelah question set dibangun.

Urutan final wajib:

```text
L1
L2
L3
...
L15
```

---

# 47. Game Completion Rules

## Victory

```text
L15 correct
```

hasil:

```text
state = VICTORY
level = 15
virtualRupiah = 1.000.000
safeRupiah = 1.000.000
```

kemudian:

```text
FINISHED
```

## Wrong

```text
wrong answer
```

hasil:

```text
state = GAME_OVER
```

safe money berdasarkan safe level tertinggi yang telah dicapai.

## Walk Away

```text
walkAway = true
state = SAFE_EXIT
```

tidak ada penalty `wrong`.

---

# 48. State Transition Guard

Implementasikan transition helper terisolasi, misalnya:

```js
transitionTo(nextState)
```

Helper harus:

1. memeriksa current state;
2. memeriksa allowed transition;
3. menolak illegal transition;
4. melakukan side effect minimum;
5. menjaga timer lifecycle.

Illegal transition harus menghasilkan controlled error/log.

---

# 49. Suggested Internal API

Implementasi boleh menggunakan API seperti:

```js
createInitialState()
loadQuestionSet()
startGame()
startQuestion()
selectAnswer(index)
lockAnswer()
revealAnswer()
handleCorrect()
handleWrong()
useFiftyFifty()
useAskClass()
useAskFriend()
walkAway()
handleTimeout()
finishGameSession()
buildResultPayload()
saveResultOnce()
cleanup()
```

Nama boleh berbeda.

Semantics tidak boleh berbeda.

---

# 50. React Component Contract

Minimum:

```jsx
function MillionaireGame(props) {
    ...
}
```

Props minimal harus menyediakan context yang dibutuhkan existing dashboard/game dispatcher, seperti:

```text
game
student
initData
onFinish / finishGame
```

Gunakan actual repository contract sebagai evidence.

Jangan mengarang props yang tidak tersedia.

---

# 51. Dashboard Integration

Phase 04 boleh menambahkan branch dispatcher minimal:

```text
activeGame.type === "millionaire"
```

Tetapi jangan melakukan redesign dashboard.

Tidak boleh menambahkan:

- banner baru
- card redesign
- leaderboard redesign
- navigation overhaul

Dashboard hanya perlu dapat membuka game.

---

# 52. Existing 17 Games Isolation Test

Setelah integration:

- semua 17 `GAME_TYPES` tetap ada;
- semua branch existing tetap berjalan;
- `MatchGame` fallback tetap fallback;
- tidak ada perubahan pada `games/*.js`;
- `Games.pairs` tidak digunakan Millionaire.

Audit harus menunjukkan evidence.

---

# 53. Visual Boundary

Phase 04 boleh menggunakan **minimal functional markup** untuk membuktikan gameplay.

Namun:

- jangan mengembangkan final skin;
- jangan membuat polished visual;
- jangan mengoptimalkan background;
- jangan membuat character;
- jangan membuat animation-heavy visual.

Visual final menjadi fase terpisah.

Functional UI minimum hanya diperlukan untuk membuktikan:

```text
question
A-D
timer
ladder
lifeline
state
walk-away
result
```

---

# 54. Responsive Boundary

Engine harus tidak mengunci gameplay pada ukuran desktop tertentu.

State/data logic harus device-independent.

Minimal functional layout harus dapat berjalan pada:

```text
desktop landscape
mobile portrait
```

Tetapi pixel-perfect responsive skin bukan target Phase 04.

---

# 55. Contract Tests

Minimal test coverage:

### State

- initial state = INTRO
- legal transitions
- illegal transitions rejected
- FINISHED terminal

### Questions

- 15 questions loaded
- levels L1–L15
- no question schema mutation
- missing level controlled error

### Answer

- A–D mapping
- correct answer
- wrong answer
- lock prevents change

### Prize

- L1 prize
- L5 safe
- L10 safe
- L15 final
- virtual money separated from score

### Score

- L1 → expected normalized score
- L5
- L10
- L15 → 100

### Lifelines

- each usable once
- cannot use after lock
- cannot use after finish
- 50:50 never removes correct answer

### Walk Away

- walkAway true
- no wrong increment
- correct level preserved

### Timer

- timer starts only on QUESTION
- stops on LOCKED
- expiry → WRONG/GAME_OVER
- cleanup clears timer

### Result

- payload has required fields
- `skor` 0–100
- `benar` 0–15
- `salah` 0–1
- `level`
- `virtualRupiah`
- `safeRupiah`
- `extra`
- result save only once

---

# 56. Required Audit

OpenCode wajib menghasilkan:

```text
docs/millionaire/PHASE_04_GAME_ENGINE_AUDIT.md
```

Audit minimal harus berisi:

1. executive summary;
2. files changed;
3. architecture evidence;
4. FSM evidence;
5. state transition matrix;
6. question integration evidence;
7. timer evidence;
8. lifeline evidence;
9. prize/safe evidence;
10. score evidence;
11. walk-away evidence;
12. result payload evidence;
13. U1 status;
14. U2 status;
15. existing 17-game regression check;
16. tests + result;
17. forbidden-scope verification;
18. risks;
19. unresolved items;
20. exit criteria;
21. Phase 05 handoff.

---

# 57. U1/U2 Status in Audit

Audit **WAJIB** tetap menyatakan:

```text
U1 = UNVERIFIED / BLOCKED
U2 = CONDITIONALLY BLOCKED
```

kecuali OpenCode memperoleh evidence baru yang benar-benar membuktikan status tersebut berubah.

Jangan mengubah status hanya karena code lokal sudah tersedia.

---

# 58. Phase 04 Exit Criteria

Phase 04 dianggap PASS jika:

- [ ] `MillionaireGame.js` exists;
- [ ] engine isolated;
- [ ] `type === "millionaire"` dispatcher works;
- [ ] no general engine created;
- [ ] 12 FSM states implemented;
- [ ] legal transitions enforced;
- [ ] illegal transitions rejected;
- [ ] 15-level question set consumed;
- [ ] Phase 03 normalized model reused;
- [ ] no new question schema;
- [ ] prize ladder reused;
- [ ] safe levels reused;
- [ ] answer encoding 0–3 reused;
- [ ] timer implemented;
- [ ] timer cleanup implemented;
- [ ] answer selection works;
- [ ] answer locking works;
- [ ] reveal works;
- [ ] correct flow works;
- [ ] wrong flow works;
- [ ] safe exit works;
- [ ] victory works;
- [ ] 50:50 works;
- [ ] Tanya Kelas works;
- [ ] Tanya Teman works;
- [ ] each lifeline only once;
- [ ] walkAway recorded;
- [ ] score remains 0–100;
- [ ] virtualRupiah remains separate;
- [ ] safeRupiah calculated correctly;
- [ ] result payload prepared;
- [ ] result save guarded against duplicates;
- [ ] U1 not falsely marked resolved;
- [ ] U2 not falsely marked resolved;
- [ ] existing 17 games unchanged;
- [ ] no final skin implementation;
- [ ] contract tests pass;
- [ ] audit generated.

---

# 59. Failure Rule

Jika repository aktual bertentangan dengan Phase 00–03:

```text
CONFLICT
+ EVIDENCE
+ IMPACT
+ RECOMMENDED RESOLUTION
```

Kemudian:

```text
STOP DEPENDENT IMPLEMENTATION
```

Jangan melakukan silent reconciliation.

---

# 60. Phase 05 Handoff

Setelah Phase 04 PASS, handoff ke Phase 05 adalah **VISUAL SKIN / UX POLISH**.

Phase 05 dapat menangani:

- Millionaire visual atmosphere;
- desktop background;
- mobile background;
- question panel;
- answer buttons;
- prize ladder visual;
- lifeline visual;
- timer visual;
- transitions;
- animations;
- responsive layout refinement;
- visual states;
- asset optimization;
- baked-background verification;
- final mobile/desktop QA.

Phase 05 **tidak boleh mengubah gameplay contract** Phase 04 tanpa explicit contract patch.

---

# 61. Final Principle

> **Build the gameplay engine, prove the state machine, and stop before the final skin.**

Phase 04 harus menghasilkan gameplay Millionaire yang fungsional, predictable, isolated, testable, dan siap menerima visual skin pada fase berikutnya.

U1 dan U2 tetap menjadi deployment/persistence gates sampai evidence production/staging benar-benar tersedia.

---

# END — PHASE 04 GAME ENGINE