# PHASE 03 — DATA LAYER PROVISIONING
## SI-PANDA v3 · Millionaire Game

**Status:** READY FOR IMPLEMENTATION  
**Scope:** Data layer only  
**Parent:** `PHASE_00_MILLIONAIRE_MASTER_SPEC.md` · `PHASE_01_ARCHITECTURE.md` · `PHASE_02_DATA_CONTRACT.md` · `PHASE_02_DATA_CONTRACT_AUDIT.md`

---

## 0. TUJUAN

Phase 03 mengimplementasikan **data layer Millionaire** berdasarkan seluruh contract yang telah dikunci pada Phase 02.

Phase ini bertanggung jawab agar Millionaire memiliki:

1. fallback question bank;
2. production question reader;
3. `getInitData.millionaireQuestions`;
4. normalization question;
5. validation question;
6. filtering berdasarkan `mapel`;
7. pemilihan satu soal untuk setiap level 1–15;
8. fallback policy;
9. prize/isSafe derivation;
10. contract tests/audit terhadap data layer.

Phase ini **BUKAN** implementasi gameplay.

---

# 1. HARD BOUNDARY

## 1.1 BOLEH

Phase 03 boleh membuat atau mengubah:

- `millionaire/MillionaireQuestions.js`
- backend helper yang diperlukan untuk membaca `MillionaireQuestions`;
- additive `getInitData.millionaireQuestions`;
- helper normalization/validation Millionaire;
- helper question selection;
- contract test;
- data-layer documentation;
- audit `.md`;
- provisioning sheet helper jika memang diperlukan.

## 1.2 DILARANG

Jangan membuat atau mengubah:

- `MillionaireGame.js` sebagai gameplay engine;
- FSM runtime;
- state `INTRO` sampai `FINISHED` runtime;
- timer gameplay;
- lifeline UI/logic runtime;
- prize ladder animation;
- question reveal animation;
- dashboard UI;
- admin UI;
- `MillionaireAdminPanel`;
- perubahan behavior 17 game existing;
- general game engine;
- `Games.pairs`;
- existing `Soal`;
- production gameplay scoring flow;
- visual skin implementation;
- background/asset redesign.

**STOP jika pekerjaan mulai membutuhkan implementasi gameplay.**

---

# 2. CURRENT GATES

Phase 02 menetapkan dua unresolved gate.

## U1 — Backend Canonical

Status:

**BLOCKED / UNVERIFIED**

`code_v2.gs` adalah intended canonical berdasarkan header-nya, tetapi deployment truth belum dapat dibuktikan dari repository.

Tidak ada:

- `appsscript.json`;
- deployment ID;
- deployment metadata;
- live Apps Script execution evidence.

Karena itu:

- jangan mengklaim `code_v2.gs` sebagai deployed canonical;
- jangan menghapus `code.gs`;
- jangan melakukan destructive merge;
- backend change harus mengikuti evidence aktual;
- jika backend implementation dilakukan sebelum U1 resolved, perubahan harus konsisten pada kedua file sesuai Phase 02 mitigation.

Evidence verification yang diperlukan:

1. buka Apps Script project yang terkait `WEB_APP_URL`;
2. cek Deployments;
3. bandingkan deployed source dengan `code.gs` dan `code_v2.gs`;
4. lakukan live `getInitData`;
5. catat hasil pada `docs/millionaire/BACKEND_CANONICAL.md`.

## U2 — GameResults Compatibility

Status:

**CONDITIONALLY BLOCKED**

Contract target:

```text
1-11 existing fields
12 level
13 virtualRupiah
14 safeRupiah
15 extra
```

Existing reader masih fixed 11-column.

Phase 03 **tidak boleh menganggap production result write sudah aman** sebelum staging test 11→15 selesai.

Required staging evidence:

- existing 11-column rows tetap terbaca;
- Millionaire 15-column row dapat ditulis;
- field 12–15 dapat dibaca kembali;
- old rows mendapatkan null/default pada field baru;
- tidak ada perubahan posisi field 1–11.

---

# 3. CANONICAL QUESTION SOURCE

## 3.1 Production

Production source:

```text
Google Sheet → MillionaireQuestions
```

Exact sheet name:

```text
MillionaireQuestions
```

Exact header:

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

Urutan kolom immutable tanpa perubahan contract version.

---

# 4. FALLBACK QUESTION SOURCE

File:

```text
millionaire/MillionaireQuestions.js
```

Namespace:

```js
window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS
```

File harus diberi marker:

```js
// FALLBACK ONLY
```

Fallback:

- bukan production source of truth;
- bukan pengganti Google Sheet;
- tidak boleh digunakan untuk silently patch satu level production yang hilang;
- minimal 15 valid questions;
- idealnya satu question untuk setiap level 1–15.

Minimum structure:

```js
window.SIPANDA_MILLIONAIRE =
  window.SIPANDA_MILLIONAIRE || {};

window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS = [
  // 15 valid normalized-compatible rows
];
```

---

# 5. FALLBACK TRIGGER

Fallback digunakan jika:

```text
productionQuestions == null
OR
productionQuestions.length < 15
OR
production fetch unavailable/error
```

Fallback tidak boleh digunakan untuk silently melengkapi sebagian dataset production.

Contoh:

```text
Production:
L1 ✓
L2 ✓
L3 ✓
...
L14 ✓
L15 ✗
```

Jangan:

```text
Production L1-L14 + fallback L15
```

Sebaliknya:

```text
fallback entire question source
```

atau controlled error sesuai konteks loading.

Tujuan:

**hindari mixed-source question set yang sulit diaudit.**

---

# 6. QUESTION SCHEMA

Raw production row:

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

Normalized frontend model:

```js
{
  id: String,
  mapel: String,
  level: Number,
  question: String,
  options: [
    String,
    String,
    String,
    String
  ],
  answer: Number,
  prize: Number,
  isSafe: Boolean,
  explanation: String
}
```

`MillionaireGame` pada Phase 04 hanya akan mengonsumsi normalized model.

---

# 7. NORMALIZATION

Implement helper yang deterministic.

Recommended logical helper:

```js
normalizeMillionaireQuestion_(row)
```

Normalization:

| Field | Rule |
|---|---|
| id | `String(value).trim()` |
| mapel | `String(value).trim()` |
| level | `Number(value)` |
| question | `String(value).trim()` |
| optionA-D | `String(value).trim()` |
| answer | `parseInt(value, 10)` |
| prize | `Number(value)` |
| isSafe | normalize boolean |
| explanation | `String(value || "").trim()` |

Boolean normalization harus mendukung contract:

```text
true
false
TRUE
FALSE
"true"
"false"
1
0
```

---

# 8. VALIDATION

Recommended helper:

```js
validateMillionaireQuestion_(question)
```

Question valid jika:

### ID

- non-empty;
- unique;
- regex:

```regex
^[A-Za-z0-9_-]+$
```

### Mapel

Harus exact match terhadap existing `MAPEL_LIST`.

Tidak boleh:

```js
toLowerCase()
```

atau fuzzy matching.

### Level

Harus:

```text
integer 1–15
```

Tidak boleh:

```text
0
16
"sedang"
"7a"
null
```

### Question

- non-empty setelah trim;
- maximum 200 characters.

### Options

A–D semuanya:

- required;
- non-empty setelah trim.

### Answer

Harus integer:

```text
0 = A
1 = B
2 = C
3 = D
```

### Prize

Harus konsisten dengan canonical ladder.

### isSafe

Tidak boleh menjadi source of truth.

Derive:

```js
isSafe = [5, 10, 15].includes(level);
```

### Explanation

Optional:

- empty string valid;
- maximum 500 characters.

---

# 9. CANONICAL PRIZE LADDER

Gunakan satu canonical ladder:

```js
[
  100,
  200,
  300,
  500,
  1000,
  2000,
  4000,
  8000,
  16000,
  32000,
  64000,
  125000,
  250000,
  500000,
  1000000
]
```

Index:

```text
level 1 → index 0
level 15 → index 14
```

Safe levels:

```js
[5, 10, 15]
```

Jika sheet berisi prize yang tidak sesuai level:

```text
override → canonical ladder value
log warning
```

Jangan memperlakukan `prize` spreadsheet sebagai source of truth.

---

# 10. `isSafe` DERIVATION

Canonical:

```js
isSafe = [5, 10, 15].includes(level);
```

Contoh:

```text
L5  → true
L7  → false
L10 → true
L15 → true
```

Jika sheet mengatakan:

```text
level=7
isSafe=true
```

normalized result harus:

```text
isSafe=false
```

Jika:

```text
level=10
isSafe=false
```

normalized result harus:

```text
isSafe=true
```

---

# 11. DUPLICATE POLICY

## 11.1 Duplicate ID

`id` global unique.

Jika duplicate:

```text
reject duplicate row
Logger.log warning
continue
```

Bukan:

```text
last wins
```

## 11.2 Duplicate mapel + level

Multiple questions diperbolehkan.

Logical key:

```text
mapel + level
```

Contoh:

```text
IPAS + 7
```

boleh memiliki beberapa question.

Jika beberapa valid question tersedia:

```text
random selection among valid rows
```

Jika hanya satu:

```text
use that question
```

---

# 12. MISSING LEVEL POLICY

Setiap game harus memiliki question:

```text
level 1
level 2
...
level 15
```

Tidak boleh:

- generate question;
- reuse level lain;
- skip level;
- mixed production/fallback per level.

Jika dataset production tidak memiliki seluruh level 1–15:

```text
INCOMPLETE
```

Loading layer harus menghasilkan controlled behavior.

Fallback policy mengikuti Section 5.

---

# 13. PRODUCTION READER

Implement:

```js
readMillionaireQuestions_(ss)
```

Responsibilities:

1. locate `MillionaireQuestions`;
2. read header;
3. validate header;
4. read rows;
5. normalize rows;
6. validate rows;
7. reject invalid rows;
8. reject duplicate IDs;
9. derive prize;
10. derive `isSafe`;
11. preserve explanation;
12. return JSON-safe objects;
13. deterministic ordering.

Suggested output:

```js
[
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

Recommended deterministic ordering:

```text
mapel ASC
level ASC
id ASC
```

Jika implementation memilih ordering berbeda, documentasikan secara eksplisit.

---

# 14. MISSING SHEET BEHAVIOR

Jika `MillionaireQuestions` belum ada:

```text
readMillionaireQuestions_() → []
```

Jangan membuat sheet otomatis hanya karena `getInitData()` dipanggil.

Sheet creation harus terjadi hanya melalui explicit setup/provisioning action.

`getInitData()` tidak boleh crash hanya karena sheet belum ada.

Recommended:

```js
try {
  millionaireQuestions = readMillionaireQuestions_(ss);
} catch (err) {
  Logger.log(err);
  millionaireQuestions = [];
}
```

---

# 15. `getInitData` CONTRACT

Existing seven fields tidak boleh berubah:

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

Tambahkan field ke-8:

```js
millionaireQuestions
```

Target:

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

Tidak boleh:

- rename existing field;
- remove field;
- restructure existing data;
- replace `games`;
- replace `gameResults`.

---

# 16. FRONTEND QUESTION LOADING

Phase 03 boleh menyiapkan helper loading/normalization.

Logical flow:

```text
getInitData
    ↓
millionaireQuestions
    ↓
validate availability
    ↓
normalize
    ↓
filter by mapel
    ↓
group by level
    ↓
select one valid question per level
    ↓
ordered L1 → L15
```

Input:

```text
selected mapel
```

Output:

```js
[
  questionLevel1,
  questionLevel2,
  ...
  questionLevel15
]
```

---

# 17. QUESTION SELECTION

For each:

```text
mapel + level
```

collect valid questions.

If:

```text
count = 1
```

use the only question.

If:

```text
count > 1
```

randomize among valid candidates.

Do not randomize the level order.

Correct:

```text
L1 → L2 → L3 → ... → L15
```

Incorrect:

```text
L7 → L2 → L11 → ...
```

---

# 18. GAME SET INTEGRITY

Before Phase 04 consumes a set, data layer should be able to establish:

```text
exactly 15 levels
level 1–15 all present
each selected question valid
each selected prize canonical
each selected isSafe derived
```

Recommended helper:

```js
buildMillionaireQuestionSet_(questions, mapel)
```

Expected result:

```js
{
  ok: true,
  questions: [15 normalized questions]
}
```

Controlled failure:

```js
{
  ok: false,
  reason: "INCOMPLETE_LEVEL_SET",
  missingLevels: [...]
}
```

Do not throw an uncontrolled UI/runtime error.

---

# 19. SHEET PROVISIONING

If provisioning helper is implemented in this phase:

```js
const MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";

const MILLIONAIRE_QUESTIONS_HEADER = [
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
];
```

Use existing `getOrCreateSheet_` pattern where compatible.

Formatting contract:

```text
id          → text
level       → integer
answer      → integer
prize       → #,##0
isSafe      → boolean/text-compatible
```

Freeze header row.

Do not seed production demo questions automatically.

---

# 20. NO PRODUCTION SEED

Important:

`MillionaireQuestions.js` is fallback only.

Do not automatically insert fallback questions into:

```text
MillionaireQuestions
```

during:

```text
getInitData
```

or ordinary application startup.

Production data must remain explicitly managed.

---

# 21. GAME RESULTS

Phase 03 may prepare the data contract/helper needed for future result integration, but must respect U2.

Target GameResults schema:

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

Existing columns 1–11 remain unchanged.

Do not insert new columns in the middle.

Do not deploy Millionaire result writes while U2 remains unverified.

---

# 22. SCORE

Score remains separate from virtual Rupiah.

Canonical:

```js
Math.round((levelReached / 15) * 100)
```

Examples:

```text
L1  → 7
L5  → 33
L10 → 67
L15 → 100
```

Phase 03 only documents/prepares this contract.

Do not implement gameplay scoring flow.

---

# 23. ANTI-FARM

Reuse existing:

```js
canSaveGameResult(nisn, gameId, level)
```

Millionaire level must be converted to string:

```js
String(level)
```

Canonical key:

```text
game_last_${nisn}_${gameId}_${String(level)}
```

Timeout:

```text
30 seconds
```

Do not create a second global anti-farm mechanism.

---

# 24. FALLBACK DATA REQUIREMENT

`MillionaireQuestions.js` must contain at least:

```text
15 valid questions
```

with:

```text
L1
L2
L3
L4
L5
L6
L7
L8
L9
L10
L11
L12
L13
L14
L15
```

For fallback data:

- valid schema;
- valid answer 0–3;
- canonical prize;
- canonical safe status;
- valid mapel;
- unique IDs;
- no production-sheet dependency.

Fallback questions should be clearly identifiable as development/demo data.

---

# 25. BACKEND FILE HANDLING

Until U1 is verified:

```text
code_v2.gs = intended canonical
code.gs    = backup
```

Do not silently select one as deployed truth.

If backend helper must be added before U1 verification:

- keep both files logically synchronized;
- document that deployment status remains unverified;
- do not claim production deployment.

After live verification, future phase may consolidate to one canonical source.

---

# 26. CACHE / VERSION

Existing application uses:

```text
APP_VERSION v16
script ?v=16
sipanda_version localStorage
```

Phase 03 should not perform unrelated cache changes.

If adding new script loading requires version bump:

```text
v16 → v17
```

must be done consistently.

Do not introduce arbitrary cache-busting schemes.

---

# 27. SCRIPT LOADING

If `MillionaireQuestions.js` is loaded by the main application:

- load before any code that consumes `FALLBACK_QUESTIONS`;
- use existing `<script type="text/babel" src="...">` pattern where applicable;
- do not introduce a build system;
- do not introduce ES module architecture inconsistent with existing app.

The fallback namespace must exist before its first consumer.

---

# 28. ERROR HANDLING

Data-layer errors must be controlled.

Examples:

```text
MISSING_SHEET
INVALID_HEADER
INVALID_ROW
DUPLICATE_ID
INCOMPLETE_LEVEL_SET
INVALID_MAPEL
INVALID_LEVEL
INVALID_ANSWER
PRIZE_MISMATCH
```

Invalid rows:

```text
log + skip
```

Fatal dataset incompleteness:

```text
return controlled failure
```

Never:

```text
silent generate
silent reuse
silent skip level
silent mix fallback with production
```

---

# 29. CONTRACT TESTS

Phase 03 should create lightweight tests or audit checks covering:

### Schema

- 12 headers exact;
- header order exact.

### Validation

- valid ID;
- invalid ID;
- valid mapel;
- invalid mapel;
- level 1;
- level 15;
- level 0 rejected;
- level 16 rejected;
- answer 0;
- answer 3;
- answer 4 rejected.

### Prize

- L1 = 100;
- L5 = 1000;
- L10 = 32000;
- L15 = 1000000.

### Safe

- L5 true;
- L10 true;
- L15 true;
- L7 false.

### Duplicate

- duplicate ID rejected;
- multiple mapel+level allowed.

### Completeness

- L1–L15 complete;
- missing level detected.

### Normalization

- numeric strings normalized;
- boolean variants normalized;
- whitespace trimmed.

### Fallback

- 15 fallback rows;
- all levels present;
- fallback marker exists.

---

# 30. SECURITY BOUNDARY

Question data is not trusted merely because it came from the browser.

Phase 03 should validate:

```text
level 1–15
answer 0–3
score 0–100
benar 0–15
salah 0–1
virtualRupiah >= 0
safeRupiah >= 0
```

However:

**Phase 03 does not introduce server-side answer grading.**

Backend remains data/result validation layer.

---

# 31. EXISTING GAME ISOLATION

Do not alter behavior of the existing 17 games.

Specifically:

- do not change `Games.pairs`;
- do not alter existing difficulty semantics;
- do not alter `GAME_DIFFICULTY`;
- do not replace `calcChallengeScore`;
- do not change existing `finishGame()` behavior except an additive Millionaire-compatible hook if explicitly required and proven safe;
- do not change existing game IDs;
- do not migrate existing questions.

Millionaire is an additive isolated module.

---

# 32. REQUIRED OUTPUT FILES

Phase 03 must produce:

```text
millionaire/MillionaireQuestions.js
```

and, if implementation requires it:

```text
docs/millionaire/BACKEND_CANONICAL.md
```

plus mandatory:

```text
docs/millionaire/PHASE_03_DATA_LAYER_AUDIT.md
```

No gameplay files should be created.

---

# 33. PHASE 03 AUDIT REQUIREMENTS

`PHASE_03_DATA_LAYER_AUDIT.md` must report:

## A. Files changed

Exact list.

## B. Question source

- production source;
- fallback source;
- sheet name;
- header.

## C. Normalization

Evidence that every field follows contract.

## D. Validation

Evidence for invalid/valid rows.

## E. Duplicate policy

Evidence for duplicate ID and mapel+level behavior.

## F. Completeness

Evidence for 15-level question-set construction.

## G. Fallback

Evidence for fallback trigger and no mixed-source patching.

## H. Backend

Explicit U1 status.

## I. GameResults

Explicit U2 status.

## J. Existing games

Evidence that 17 existing game behavior was not intentionally changed.

## K. Tests

List test cases and result.

## L. Risks

New or unresolved risks.

## M. Exit criteria

Pass/fail for every criterion.

## N. Handoff

Clear boundary into Phase 04.

---

# 34. EXIT CRITERIA

Phase 03 PASS only if:

- [ ] `MillionaireQuestions.js` exists;
- [ ] fallback marker exists;
- [ ] fallback has ≥15 valid questions;
- [ ] fallback levels 1–15 complete;
- [ ] `MillionaireQuestions` contract implemented;
- [ ] exact 12-column header preserved;
- [ ] normalization implemented;
- [ ] validation implemented;
- [ ] prize derived from level;
- [ ] isSafe derived from level;
- [ ] duplicate ID policy implemented;
- [ ] duplicate mapel+level policy implemented;
- [ ] missing level detected;
- [ ] `readMillionaireQuestions_` implemented if backend path is unblocked;
- [ ] `getInitData.millionaireQuestions` additive;
- [ ] missing sheet does not crash `getInitData`;
- [ ] frontend normalized model established;
- [ ] one question per level selection established;
- [ ] fallback trigger established;
- [ ] no mixed production/fallback level patching;
- [ ] no production seed insertion;
- [ ] no gameplay engine created;
- [ ] no FSM runtime created;
- [ ] no timer created;
- [ ] no lifeline UI created;
- [ ] no dashboard UI created;
- [ ] no admin UI created;
- [ ] no existing 17-game behavior intentionally changed;
- [ ] U1 status explicitly documented;
- [ ] U2 status explicitly documented;
- [ ] audit report generated.

---

# 35. BLOCKING RULE

If repository behavior conflicts with:

```text
PHASE_00
PHASE_01
PHASE_02
```

do not silently resolve the conflict.

Record:

```text
CONFLICT
EVIDENCE
IMPACT
RECOMMENDED RESOLUTION
```

Then stop the dependent implementation.

---

# 36. PHASE 04 HANDOFF

If Phase 03 passes, Phase 04 receives:

```text
normalized question bank
        ↓
15-level question set
        ↓
canonical prize/safe data
        ↓
controlled loading/fallback result
```

Phase 04 may then implement:

- `MillionaireGame.js`;
- FSM;
- timer;
- question display;
- answer selection;
- locking;
- reveal;
- correct/wrong;
- safe exit;
- victory;
- lifelines;
- prize ladder runtime;
- result completion.

Phase 04 must consume the data contract produced here.

It must **not redefine**:

- question schema;
- prize ladder;
- safe levels;
- answer encoding;
- fallback source;
- GameResults schema.

---

# 37. FINAL PHASE 03 PRINCIPLE

> **Provision the data layer, prove the contract, and stop before gameplay.**

Millionaire must have a deterministic and auditable question pipeline before any gameplay state machine is introduced.

**END — PHASE 03 DATA LAYER**