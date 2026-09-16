# PHASE 02 — DATA CONTRACT
## SI-PANDA v3 — Millionaire Game

**Status:** DESIGN / DATA CONTRACT ONLY  
**Phase:** 02  
**Parent:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md`  
**Architecture Basis:** `PHASE_01_ARCHITECTURE.md`  
**Audit Basis:** `PHASE_01_ARCHITECTURE_AUDIT.md`

---

# 1. TUJUAN PHASE

Phase 02 bertujuan mengunci seluruh **data contract** Millionaire sebelum implementasi game engine dimulai.

Phase ini harus menghasilkan kontrak yang dapat digunakan secara konsisten oleh:

```text
Backend
   ↕
MillionaireQuestions sheet
   ↕
Question Reader
   ↕
MillionaireGame
   ↕
Result Payload
   ↕
GameResults
   ↕
Dashboard / Admin
```

Phase 02 **tidak mengimplementasikan gameplay**.

Tidak membuat:

```text
MillionaireGame.js
millionaire.css
MillionaireAdminPanel
```

selain jika diperlukan contoh schema/pseudocode dalam dokumen.

---

# 2. SUMBER KEPUTUSAN

Phase 02 wajib mengikuti keputusan Phase 01:

- D1 — isolated Millionaire module
- D2 — canonical `type: "millionaire"`
- D3 — `window.SIPANDA_MILLIONAIRE`
- D4 — dedicated `MillionaireQuestions`
- D5 — JS fallback
- D6 — question schema
- D7 — canonical prize ladder
- D8 — safe money
- D9 — score vs Rupiah
- D10 — 12-state FSM
- D11 — three lifelines
- D12 — additive GameResults
- D13 — existing result flow
- D14 — dashboard integration
- D15 — dedicated admin
- D16 — backend canonical
- D17 — script/version
- D18 — responsive/assets
- D19 — cache/version
- D20 — anti-farm

Phase 02 tidak boleh membuat keputusan yang bertentangan dengan keputusan tersebut tanpa mencatat alasan dan dampaknya.

---

# 3. PHASE 02 GATES

Sebelum data contract dianggap implementable, tiga gate harus diperiksa.

## Gate A — Backend Canonical

Audit U1 dari Phase 01 harus diselesaikan.

Target:

```text
code_v2.gs = canonical backend
code.gs = backup
```

namun status tersebut harus diverifikasi terhadap deployment aktual.

Jika deployment tidak dapat diverifikasi:

```text
STATUS = BLOCKED
```

untuk backend implementation.

Dokumen harus mencatat:

```text
canonical file
deployment evidence
verification date
remaining uncertainty
```

Jangan mengklaim deployment sudah canonical hanya berdasarkan nama `code_v2.gs`.

---

# 4. GATE B — GAME RESULTS COMPATIBILITY

Audit U2 harus diverifikasi.

Existing:

```text
11 columns
```

Target:

```text
15 columns
```

Existing columns tidak boleh berubah posisi.

## Existing

```text
1  waktu
2  nisn
3  nama
4  gameId
5  game
6  mapel
7  tipe
8  skor
9  benar
10 salah
11 durasiDetik
```

## Millionaire additive

```text
12 level
13 virtualRupiah
14 safeRupiah
15 extra
```

Tidak boleh menyisipkan column di antara column 1–11.

Phase 02 harus memastikan:

```text
existing 17 games
+
existing GameResults rows
+
new Millionaire rows
```

tetap kompatibel.

---

# 5. QUESTION SHEET CONTRACT

## 5.1 Canonical Sheet Name

Exact sheet name:

```text
MillionaireQuestions
```

Case-sensitive.

Constant:

```js
const MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";
```

Jika ditempatkan global, gunakan namespace:

```js
window.SIPANDA_MILLIONAIRE.MILLIONAIRE_QUESTIONS_SHEET
```

atau backend-local constant yang tidak collision-prone.

---

# 6. QUESTION SHEET HEADER

Canonical header:

```text
id
mapel
level
question
optionA
optionB
optionC
optionD
answer
prize
isSafe
explanation
```

Total:

```text
12 columns
```

Exact order:

```js
[
  "id",
  "mapel",
  "level",
  "question",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "answer",
  "prize",
  "isSafe",
  "explanation"
]
```

Urutan tidak boleh diubah tanpa versioned contract change.

---

# 7. QUESTION FIELD CONTRACT

| Field | Type | Required | Rule |
|---|---|---:|---|
| `id` | string | YES | unique, non-empty, trimmed |
| `mapel` | string | YES | exact match existing `MAPEL_LIST` |
| `level` | integer | YES | 1–15 |
| `question` | string | YES | non-empty, max 200 chars |
| `optionA` | string | YES | non-empty |
| `optionB` | string | YES | non-empty |
| `optionC` | string | YES | non-empty |
| `optionD` | string | YES | non-empty |
| `answer` | integer | YES | 0–3 |
| `prize` | number | YES | exactly equals canonical ladder |
| `isSafe` | boolean | YES | derived from level |
| `explanation` | string | NO | max 500 chars |

---

# 8. ID CONTRACT

Question ID:

```text
string
```

Canonical validation:

```regex
^[A-Za-z0-9_-]+$
```

Required:

- non-empty;
- trimmed;
- unique.

Recommended examples:

```text
mill-ipas-01-l01
mill-ipas-01-l02
mill-bindo-01-l01
```

ID tidak boleh menggunakan:

```text
space
slash
backslash
JSON
```

---

# 9. MAPEL CONTRACT

`mapel` harus menggunakan existing SI-PANDA `MAPEL_LIST`.

Millionaire tidak membuat daftar mapel baru.

Validation:

```text
exact match
```

Tidak boleh melakukan implicit fuzzy matching.

Contoh:

```text
"IPAS" ≠ "ipas"
```

jika existing `MAPEL_LIST` menggunakan `"IPAS"`.

Phase 02 harus mengambil daftar aktual dari repository sebagai source of truth.

---

# 10. LEVEL CONTRACT

Millionaire memiliki:

```text
1–15
```

dan bukan:

```text
mudah
sedang
sulit
```

Canonical:

```js
level: Number
```

Valid:

```text
1 <= level <= 15
```

Level harus integer.

Invalid:

```text
0
16
"sedang"
"7a"
null
```

harus ditolak.

---

# 11. QUESTION TEXT CONTRACT

`question`:

- required;
- non-empty setelah trim;
- maximum 200 characters.

Existing SI-PANDA content rendering dapat digunakan jika kompatibel.

Format khusus seperti:

```text
[GAMBAR:url]
```

boleh dipertahankan jika memang didukung oleh existing `renderContent`.

Namun Phase 02 tidak boleh menciptakan format media baru.

---

# 12. OPTIONS CONTRACT

Empat option wajib:

```text
optionA
optionB
optionC
optionD
```

Masing-masing:

```text
non-empty string
```

Frontend normalized representation:

```js
options: [
  optionA,
  optionB,
  optionC,
  optionD
]
```

Index:

```text
0 → A
1 → B
2 → C
3 → D
```

---

# 13. ANSWER CONTRACT

Canonical answer:

```text
integer 0–3
```

Mapping:

```text
0 = A
1 = B
2 = C
3 = D
```

Frontend tidak boleh mengubah mapping tersebut.

Backend harus melakukan normalization:

```js
Number.parseInt(value, 10)
```

kemudian validasi:

```text
Number.isInteger(answer)
&& answer >= 0
&& answer <= 3
```

---

# 14. PRIZE CONTRACT

Canonical prize ladder:

| Level | Prize | Safe |
|---:|---:|:---:|
| 1 | 100 | NO |
| 2 | 200 | NO |
| 3 | 300 | NO |
| 4 | 500 | NO |
| 5 | 1.000 | YES |
| 6 | 2.000 | NO |
| 7 | 4.000 | NO |
| 8 | 8.000 | NO |
| 9 | 16.000 | NO |
| 10 | 32.000 | YES |
| 11 | 64.000 | NO |
| 12 | 125.000 | NO |
| 13 | 250.000 | NO |
| 14 | 500.000 | NO |
| 15 | 1.000.000 | YES / FINAL |

Canonical frontend representation:

```js
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER
```

Tidak boleh ada ladder alternatif.

---

# 15. PRIZE VALIDATION

`prize` dari spreadsheet harus dibandingkan dengan:

```text
PRIZE_LADDER[level]
```

Canonical rule:

```text
sheet prize == canonical prize
```

Jika mismatch:

```text
row invalid
```

atau deterministic normalization sesuai implementation decision.

Phase 02 harus memilih satu behavior final.

**Recommended:**

```text
override with canonical ladder value
+ warning/log
```

Alasannya:

- prize merupakan derived value;
- level adalah source of truth;
- mencegah data spreadsheet merusak ladder gameplay.

Tidak boleh menerima arbitrary prize dari admin.

---

# 16. SAFE CONTRACT

Safe levels:

```text
5
10
15
```

Canonical calculation:

```js
safeRupiah =
  highestReachedSafePrize
```

Contoh:

```text
Reached level 4
safeRupiah = 0

Reached level 7
safeRupiah = 1.000

Reached level 12
safeRupiah = 32.000

Reached level 15
safeRupiah = 1.000.000
```

Jika salah:

```text
virtualRupiah = safeRupiah
```

sesuai state/game outcome.

---

# 17. isSafe CONTRACT

`isSafe` bukan source of truth.

Source of truth:

```text
level
```

Derived rule:

```js
isSafe = [5, 10, 15].includes(level)
```

Jika sheet berisi:

```text
level = 7
isSafe = TRUE
```

harus dinormalisasi menjadi:

```text
isSafe = FALSE
```

Jika:

```text
level = 10
isSafe = FALSE
```

harus dinormalisasi menjadi:

```text
isSafe = TRUE
```

---

# 18. EXPLANATION CONTRACT

`explanation`:

- optional;
- string;
- maximum 500 chars;
- digunakan setelah reveal;
- tidak menentukan correctness.

Empty:

```text
""
```

adalah valid.

---

# 19. NORMALIZED FRONTEND QUESTION MODEL

Production row:

```js
{
  id,
  mapel,
  level,
  question,
  optionA,
  optionB,
  optionC,
  optionD,
  answer,
  prize,
  isSafe,
  explanation
}
```

harus dinormalisasi menjadi:

```js
{
  id: String,
  mapel: String,
  level: Number,
  question: String,
  options: [String, String, String, String],
  answer: Number,
  prize: Number,
  isSafe: Boolean,
  explanation: String
}
```

MillionaireGame hanya mengonsumsi normalized model.

Game engine tidak boleh membaca spreadsheet-specific fields secara langsung jika normalization layer tersedia.

---

# 20. FALLBACK CONTRACT

Fallback source:

```text
millionaire/MillionaireQuestions.js
```

Namespace:

```js
window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS
```

Fallback wajib diberi marker:

```js
// FALLBACK ONLY
```

Minimum:

```text
15 rows
```

Ideal:

```text
1 row per level
```

Fallback bukan production source of truth.

---

# 21. FALLBACK TRIGGER

Production source digunakan jika valid dan lengkap.

Fallback dipakai ketika:

```text
fetch error
OR
production data unavailable
OR
production data tidak memiliki minimal 15 level valid
```

Target condition:

```js
productionQuestions == null
||
productionQuestions.length < 15
```

Fallback tidak boleh dipakai untuk menutup missing individual level secara diam-diam jika production dataset dianggap authoritative.

Jika level tertentu tidak tersedia:

```text
controlled error
```

bukan generate/random question.

---

# 22. QUESTION SET CONTRACT

Satu permainan Millionaire harus menggunakan satu question set yang konsisten.

Minimum requirement:

```text
level 1 → question
level 2 → question
...
level 15 → question
```

Tidak boleh:

```text
level 1 → 3 questions
level 2 → 0
level 3 → random source
```

kecuali future version secara eksplisit mengubah contract.

Jika tersedia lebih dari satu row untuk level/mapel yang sama, Phase 02 harus menentukan deterministic/random selection rule.

**Recommended Phase 02 rule:**

```text
random selection among valid rows
```

dengan syarat setiap level memiliki minimal satu row valid.

---

# 23. MAPEL + LEVEL KEY

Canonical logical key:

```text
mapel + level
```

Contoh:

```text
IPAS + 1
IPAS + 2
...
IPAS + 15
```

Question ID tetap unique secara global.

Game ID harus terpisah dari question ID.

---

# 24. BACKEND RESPONSE CONTRACT

Existing:

```text
getInitData
```

mengembalikan:

```js
{
  settings,
  students,
  exams,
  results,
  materi,
  games,
  gameResults
}
```

Millionaire menambahkan field:

```js
millionaireQuestions
```

sehingga menjadi:

```js
{
  settings,
  students,
  exams,
  results,
  materi,
  games,
  gameResults,
  millionaireQuestions
}
```

Penambahan bersifat additive.

Tidak boleh mengubah nama atau struktur existing seven fields.

---

# 25. `millionaireQuestions` RESPONSE FORMAT

Canonical backend response:

```js
millionaireQuestions: [
  {
    id,
    mapel,
    level,
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    answer,
    prize,
    isSafe,
    explanation
  }
]
```

Backend mengembalikan hanya row yang lolos validation.

Ordering:

```text
mapel ASC
level ASC
```

atau deterministic ordering lain yang didokumentasikan.

Frontend tetap wajib melakukan normalization.

---

# 26. BACKEND READ CONTRACT

Target helper:

```js
readMillionaireQuestions_(ss)
```

Responsibilities:

1. locate `MillionaireQuestions`;
2. create sheet only when explicitly required by setup/admin flow;
3. read header;
4. map rows;
5. normalize;
6. validate;
7. reject invalid rows;
8. normalize `isSafe`;
9. validate prize;
10. sort;
11. return JSON-safe objects.

`getInitData` harus tidak crash jika sheet belum tersedia.

Recommended:

```js
try {
  millionaireQuestions = readMillionaireQuestions_(ss);
} catch (err) {
  millionaireQuestions = [];
  Logger.log(err);
}
```

---

# 27. INVALID ROW CONTRACT

Invalid row tidak boleh menyebabkan seluruh `getInitData` gagal.

Invalid conditions:

```text
missing id
invalid id
invalid mapel
invalid level
empty question
empty option
invalid answer
invalid prize
```

Recommended behavior:

```text
skip row
Logger.log reason
continue
```

---

# 28. DUPLICATE ID CONTRACT

Question ID harus unique.

Jika duplicate:

**Recommended policy: reject duplicate rows and log warning.**

Jangan menggunakan:

```text
last row silently wins
```

karena dapat membuat perubahan admin sulit dilacak.

Phase 02 harus menetapkan deterministic implementation.

---

# 29. DUPLICATE MAPEL + LEVEL CONTRACT

Untuk satu `mapel + level`:

```text
minimum 1 valid question
```

Multiple questions boleh tersedia sebagai bank.

Jika multiple valid questions tersedia:

```text
selection policy = random
```

dengan syarat tidak mengubah canonical level/prize.

Jika hanya satu:

```text
use that question
```

---

# 30. MISSING LEVEL CONTRACT

Jika question set tidak memiliki level:

```text
1..15
```

maka set dianggap incomplete.

Contoh:

```text
1,2,3,4,5,6,7,8,9,10,11,12,13,14
```

tanpa 15:

```text
INCOMPLETE
```

Millionaire tidak boleh:

```text
auto-generate
reuse another mapel
skip level
```

Game harus menunjukkan controlled error.

---

# 31. RESULT CONTRACT

Existing GameResults tetap menjadi storage utama.

Existing 11 columns:

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

Millionaire additive:

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

---

# 32. RESULT FIELD DEFINITIONS

| Field | Millionaire meaning |
|---|---|
| `waktu` | completion timestamp |
| `nisn` | student identity |
| `nama` | student name |
| `gameId` | Millionaire game instance ID |
| `game` | display title |
| `mapel` | subject |
| `tipe` | `"millionaire"` |
| `skor` | normalized 0–100 |
| `benar` | number correct |
| `salah` | 0–1 |
| `durasiDetik` | elapsed game duration |
| `level` | last reached level 1–15 |
| `virtualRupiah` | achieved/ending virtual prize |
| `safeRupiah` | highest safe prize |
| `extra` | JSON detail |

---

# 33. SCORE CONTRACT

Millionaire `skor` harus tetap:

```text
0–100
```

dan tidak boleh menyimpan Rupiah.

Canonical candidate:

```js
Math.round((levelReached / 15) * 100)
```

Phase 02 harus lock this formula.

Examples:

```text
Level 1  → 7
Level 5  → 33
Level 10 → 67
Level 15 → 100
```

`skor` digunakan oleh existing leaderboard.

---

# 34. BENAR / SALAH CONTRACT

Maximum:

```text
benar = 15
salah = 1
```

Karena satu wrong answer mengakhiri permainan.

Walk-away:

```text
salah = 0
```

Victory:

```text
benar = 15
salah = 0
```

---

# 35. LEVEL RESULT CONTRACT

`level` berarti:

```text
highest level reached / current terminal level
```

bukan difficulty.

Valid:

```text
1–15
```

Untuk anti-farm:

```js
String(level)
```

harus digunakan sebagai canonical representation.

---

# 36. VIRTUAL RUPIAH CONTRACT

`virtualRupiah` tidak sama dengan `skor`.

Terminal examples:

### Wrong before safe

```text
levelReached = 4
virtualRupiah = 0
safeRupiah = 0
```

### Wrong after level 5

```text
levelReached = 7
virtualRupiah = 1.000
safeRupiah = 1.000
```

### Walk away level 8

```text
virtualRupiah = 8.000
safeRupiah = 1.000
walkAway = true
```

### Victory

```text
virtualRupiah = 1.000.000
safeRupiah = 1.000.000
```

---

# 37. WALK-AWAY CONTRACT

`walkAway`:

```text boolean
```

`true` hanya jika pemain memilih SAFE_EXIT.

Jika wrong:

```text
walkAway = false
```

Jika victory:

```text
walkAway = false
```

---

# 38. LIFELINE RESULT CONTRACT

Canonical:

```js
lifelinesUsed: {
  fiftyFifty: Boolean,
  askClass: Boolean,
  askFriend: Boolean
}
```

Persist ke:

```text
extra
```

Recommended JSON:

```js
JSON.stringify({
  walkAway,
  lifelinesUsed,
  prizeLadderSnapshot
})
```

---

# 39. PRIZE LADDER SNAPSHOT

`extra` boleh menyimpan snapshot ladder yang digunakan saat game selesai:

```js
prizeLadderSnapshot
```

Tujuan:

- audit;
- future compatibility;
- historical interpretation.

Snapshot tidak menggantikan canonical ladder runtime.

---

# 40. EXTRA JSON CONTRACT

Canonical structure:

```js
{
  walkAway: Boolean,
  lifelinesUsed: {
    fiftyFifty: Boolean,
    askClass: Boolean,
    askFriend: Boolean
  },
  prizeLadderSnapshot: [
    {
      level: 1,
      prize: 100,
      isSafe: false
    }
  ]
}
```

Serialized:

```js
JSON.stringify(extra)
```

Jika JSON invalid saat read:

```text
ignore extra
```

dan jangan membuat seluruh result row invalid.

---

# 41. RESULT WRITE CONTRACT

Existing flow:

```text
MillionaireGame
      ↓
finishGame()
      ↓
canSaveGameResult()
      ↓
POST saveGameResult
      ↓
GameResults
```

Tidak membuat:

```text
saveMillionaireResult
```

sebagai storage system terpisah kecuali implementation audit membuktikan existing endpoint tidak dapat menerima additive payload.

---

# 42. RESULT BACKWARD COMPATIBILITY

Existing rows:

```text
11 columns
```

must remain readable.

Millionaire rows:

```text
15 columns
```

must remain readable.

Reader harus mendukung:

```text
11 <= columns <= 15
```

Tanpa menggeser index existing.

---

# 43. GAME RESULTS READER CONTRACT

Existing reader saat ini menggunakan fixed 11-column width.

Phase 02 implementation specification:

```text
reader must detect available columns
```

dan memetakan:

```text
1–11 = existing
12 = level
13 = virtualRupiah
14 = safeRupiah
15 = extra
```

Jika kolom 12–15 tidak ada:

```text
null/default
```

bukan error.

---

# 44. RESULT WRITE NORMALIZATION

Before POST:

```text
level = String(level)
skor = Number(skor)
benar = Number(benar)
salah = Number(salah)
durasiDetik = Number(durasiDetik)
virtualRupiah = Number(virtualRupiah)
safeRupiah = Number(safeRupiah)
walkAway = Boolean(walkAway)
```

Server harus melakukan defensive validation.

---

# 45. ANTI-FARM CONTRACT

Existing helper:

```js
canSaveGameResult(nisn, gameId, level)
```

digunakan kembali.

Canonical Millionaire key:

```text
game_last_${nisn}_${gameId}_${String(level)}
```

Timeout:

```text
30 seconds
```

Tidak membuat anti-farm global baru.

---

# 46. ANTI-FARM SEMANTICS

Millionaire level numeric:

```text
1–15
```

must be converted:

```js
String(level)
```

before calling:

```js
canSaveGameResult()
```

Contoh:

```text
level 7
→ "7"
```

bukan:

```text
"sedang"
```

---

# 47. GAME ID CONTRACT

Millionaire game ID harus deterministic.

Recommended:

```text
millionaire-{mapel}-01
```

Contoh:

```text
millionaire-IPAS-01
```

Game ID tidak boleh berubah setiap replay.

Replay harus menghasilkan same game definition ID tetapi result record baru sesuai anti-farm policy.

---

# 48. TYPE CONTRACT

Canonical:

```text
type = "millionaire"
```

Result:

```text
tipe = "millionaire"
```

Tidak boleh:

```text
Millionaire
millionaireGame
millionaire-game
MILLIONAIRE
```

sebagai runtime canonical value.

---

# 49. ADMIN WRITE CONTRACT

Admin actions yang akan dibutuhkan Phase 08:

```text
getMillionaireQuestions
saveMillionaireQuestion
toggleMillionaireQuestionActive
deleteMillionaireQuestion
```

Phase 02 hanya mendefinisikan data contract.

Tidak mengimplementasikan action tersebut.

---

# 50. ADMIN DERIVED FIELDS

Admin harus memperlakukan:

```text
prize
isSafe
```

sebagai derived/validated fields.

Level adalah input utama.

Contoh:

```text
level = 10
→ prize = 32000
→ isSafe = true
```

Admin tidak boleh bebas memasukkan:

```text
level = 10
prize = 50000
isSafe = false
```

---

# 51. SHEET INITIALIZATION CONTRACT

Canonical setup:

```text
MillionaireQuestions
```

dengan header 12 columns.

Sheet setup harus:

- create if missing;
- write canonical header;
- freeze header row;
- set appropriate number/text formats;
- apply validation where appropriate.

Namun setup tidak boleh otomatis membuat demo questions sebagai production data tanpa explicit seed action.

---

# 52. DATA VALIDATION

Recommended spreadsheet validation:

### mapel

```text
existing MAPEL_LIST
```

### level

```text
1–15
```

### answer

```text
0–3
```

### isSafe

```text
TRUE/FALSE
```

### prize

```text
derived / protected
```

Phase 02 harus mendokumentasikan validation implementation.

---

# 53. NUMBER FORMAT

Recommended:

```text
level → 0
answer → 0
prize → #,##0
isSafe → text/boolean compatible
```

`id`, `nisn`-like identifiers must remain text.

No currency symbol needs to be stored in the numeric sheet value.

Display formatting:

```text
Rp1.000
Rp32.000
Rp1.000.000
```

dilakukan frontend/UI.

---

# 54. DATA NORMALIZATION RULES

Input dari Google Sheets dapat berupa:

```text
string
number
boolean
empty
```

Normalization:

```text
id         → String(value).trim()
mapel      → String(value).trim()
level      → Number(value)
question   → String(value).trim()
optionA-D  → String(value).trim()
answer     → parseInt(value, 10)
prize      → Number(value)
isSafe     → normalizeBoolean(value)
explanation→ String(value || "").trim()
```

---

# 55. BOOLEAN NORMALIZATION

Accepted:

```text
true
false
TRUE
FALSE
"true"
"false"
"TRUE"
"FALSE"
1
0
```

Canonical output:

```text
Boolean
```

Unexpected values harus:

```text
normalize/reject deterministically
```

dan dicatat.

---

# 56. DATA SECURITY CONTRACT

Question answer key adalah data game.

Frontend browser tidak dapat dianggap trusted environment.

Namun Phase 02 tidak memperkenalkan backend grading system baru.

Contract:

- backend validates question structure;
- frontend uses canonical normalized question;
- result submission validates numeric ranges;
- malformed result payload tidak boleh merusak sheet;
- existing Apps Script security model tetap digunakan.

---

# 57. RESULT RANGE VALIDATION

Server-side result validation:

```text
tipe === "millionaire"
```

maka:

```text
level: 1–15
skor: 0–100
benar: 0–15
salah: 0–1
virtualRupiah >= 0
safeRupiah >= 0
```

dan:

```text
virtualRupiah/safeRupiah
```

harus compatible dengan canonical ladder.

---

# 58. IMPOSSIBLE RESULT CONDITIONS

Reject or sanitize:

```text
level > 15
level < 1
skor > 100
skor < 0
benar > 15
salah > 1
virtualRupiah < 0
safeRupiah < 0
```

Also invalid:

```text
safeRupiah > virtualRupiah
```

when outcome semantics do not permit it.

Final policy harus ditentukan secara eksplisit di implementation phase.

---

# 59. CONTRACT BETWEEN PHASE 02 AND PHASE 04

Phase 04 Game Engine boleh mengasumsikan:

```text
questions are normalized
levels are 1–15
options length = 4
answer = 0–3
prize comes from canonical ladder
isSafe derived from level
```

Game engine tidak perlu memahami raw Google Sheets representation.

---

# 60. CONTRACT BETWEEN PHASE 02 AND PHASE 08

Phase 08 Admin boleh mengasumsikan:

```text
sheet name = MillionaireQuestions
header = canonical 12 columns
level = 1–15
answer = 0–3
prize derived from level
isSafe derived from level
```

Admin implementation tidak boleh menciptakan schema baru.

---

# 61. CONTRACT BETWEEN PHASE 02 AND PHASE 07

Dashboard/result layer boleh mengasumsikan:

```text
type = millionaire
skor = 0–100
virtualRupiah = separate
safeRupiah = separate
extra = JSON
```

Leaderboard existing tetap menggunakan:

```text
skor
```

bukan:

```text
virtualRupiah
```

---

# 62. FINAL DATA CONTRACT

Canonical Millionaire question:

```js
{
  id: "mill-ipas-01-l01",
  mapel: "IPAS",
  level: 1,
  question: "...",
  options: [
    "...",
    "...",
    "...",
    "..."
  ],
  answer: 0,
  prize: 100,
  isSafe: false,
  explanation: "..."
}
```

Canonical result:

```js
{
  gameId: "millionaire-IPAS-01",
  game: "Millionaire: IPAS [Lv 7]",
  mapel: "IPAS",
  tipe: "millionaire",
  skor: 47,
  benar: 7,
  salah: 1,
  durasiDetik: 180,
  level: "7",
  virtualRupiah: 1000,
  safeRupiah: 1000,
  extra: JSON.stringify({
    walkAway: false,
    lifelinesUsed: {
      fiftyFifty: true,
      askClass: false,
      askFriend: true
    },
    prizeLadderSnapshot: []
  })
}
```

---

# 63. PHASE 02 IMPLEMENTATION BOUNDARY

Phase 02 boleh mengimplementasikan hanya jika diperlukan untuk membuktikan contract:

```text
sheet initialization helper
question read/normalize helper
result schema helper
validation helper
```

Tetapi tidak boleh mengimplementasikan:

```text
gameplay UI
FSM runtime
lifeline UI
timer
prize ladder animation
dashboard visual
admin UI
```

---

# 64. REQUIRED AUDIT OUTPUT

Phase 02 wajib menghasilkan:

```text
docs/millionaire/PHASE_02_DATA_CONTRACT_AUDIT.md
```

Laporan minimal:

```text
1. Contract Verification
2. Backend Canonical Verification
3. MillionaireQuestions Sheet Contract
4. Question Normalization
5. Validation Rules
6. getInitData Contract
7. GameResults Compatibility
8. Result Payload Contract
9. Anti-Farm Contract
10. Admin Contract
11. Risks
12. Decisions
13. Unresolved Items
14. Phase 03 Recommendation
```

---

# 65. REQUIRED DECISION MATRIX

Audit wajib mengisi:

| Area | Current State | Contract Decision | Evidence | Status |
|---|---|---|---|---|
| Backend canonical | TBD | `code_v2.gs` if verified | repo/deployment | REQUIRED |
| Question sheet | absent | `MillionaireQuestions` | Phase 01 | LOCKED |
| Header | absent | 12 columns | Phase 01 | LOCKED |
| Question model | absent | normalized object | this document | LOCKED |
| Prize | absent | canonical ladder | Phase 00/01 | LOCKED |
| isSafe | absent | derived from level | Phase 01 | LOCKED |
| getInitData | 7 fields | + `millionaireQuestions` | Phase 01 | LOCKED |
| GameResults | 11 cols | +4 at end | Phase 01 | LOCKED |
| Score | 0–100 | normalized level score | Phase 01 | LOCKED |
| Anti-farm | existing | String(level), 30s | Phase 01 | LOCKED |
| Admin | absent | dedicated panel | Phase 01 | LOCKED |

---

# 66. PHASE 02 EXIT CRITERIA

Phase 02 complete hanya jika:

- [ ] backend canonical status verified or explicitly blocked;
- [ ] U1 resolved/documented;
- [ ] U2 GameResults compatibility verified/documented;
- [ ] `MillionaireQuestions` exact name locked;
- [ ] 12-column header locked;
- [ ] all question field types locked;
- [ ] mapel validation locked;
- [ ] level 1–15 validation locked;
- [ ] answer 0–3 locked;
- [ ] prize canonical validation locked;
- [ ] `isSafe` derived from level;
- [ ] normalization rules locked;
- [ ] duplicate ID policy locked;
- [ ] duplicate mapel+level policy locked;
- [ ] missing level policy locked;
- [ ] fallback contract locked;
- [ ] `getInitData.millionaireQuestions` contract locked;
- [ ] normalized frontend question model locked;
- [ ] 15-column GameResults contract locked;
- [ ] backward compatibility strategy locked;
- [ ] result payload locked;
- [ ] score formula locked;
- [ ] virtualRupiah/safeRupiah semantics locked;
- [ ] `extra` JSON contract locked;
- [ ] anti-farm key mapping locked;
- [ ] admin write contract locked;
- [ ] validation/security boundaries documented;
- [ ] Phase 03 handoff documented;
- [ ] no gameplay implementation performed.

---

# 67. PHASE 03 HANDOFF

Phase 03 akan menggunakan contract ini untuk:

```text
MillionaireQuestions.js
MillionaireQuestions production reader
question bank loading
fallback seed
question selection rules
```

Phase 03 **belum** mengimplementasikan full gameplay engine.

Full gameplay dimulai pada:

```text
PHASE 04 — GAME ENGINE
```

---

# 68. STOP CONDITION

Jika terdapat konflik antara:

```text
repository actual behavior
Phase 00 Master Spec
Phase 01 Architecture
Phase 02 Data Contract
```

jangan diam-diam memilih salah satu.

Catat:

```text
CONFLICT
EVIDENCE
IMPACT
RECOMMENDED RESOLUTION
```

dan hentikan implementation pada bagian yang bergantung pada conflict tersebut.

---

## END OF PHASE 02 DATA CONTRACT