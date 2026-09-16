# BACKEND CANONICAL — U1 Status

> **Gate U1 — Backend Canonical: UNVERIFIED / BLOCKED**
> **Date:** 2026-09-15
> **Auditor:** OpenCode (Muse Spark) — Phase 03 Data Layer
> **WEB_APP_URL:** `https://script.google.com/macros/s/AKfycbxlGCooZ921CIzL9gFu7AAZ8uPPaZevU6mpxMjoMPHeN3_eqRdHVvGeFOk6t5bYpOdS/exec` (`index.html:78` == `admin.html:17`)
> **Repository files:** `code.gs` (60.792 → 67.xxx bytes after Phase 03) and `code_v2.gs` (61.757 → 68.xxx bytes after Phase 03) — both patched identically in Phase 03

---

## 1. Canonical Intended vs Verified

| File | Role (intended) | Evidence | Deployed? |
|------|------------------|----------|-----------|
| `code_v2.gs` | **Intended canonical** — header `code_v2.gs:1-16` says *pengganti penuh code.gs, ganti Code.gs → Run setupGameSheets → Deploy New version* | Header comment `code_v2.gs:1-16`, naming `v2` | **UNVERIFIED** |
| `code.gs` | Backup / legacy | No header, same `GAMES_SHEET`/`GAME_RESULTS_SHEET` `code.gs:1-3` | **UNVERIFIED** |

**Diff evidence (pre-Phase 03):** `git diff --no-index code.gs code_v2.gs` showed only comments/whitespace, no logic difference. Post-Phase 03, both files received identical Millionaire helpers (`MILLIONAIRE_QUESTIONS_SHEET`, `MILLIONAIRE_QUESTIONS_HEADER`, `MILLIONAIRE_PRIZE_LADDER`, `normalizeMillionaireQuestion_`, `validateMillionaireQuestion_`, `readMillionaireQuestions_`, `getInitData.millionaireQuestions`).

## 2. Deployment Evidence Search (offline repo)

- `Get-ChildItem -Recurse -Include "appsscript.json",".clasp.json"` → **0 results**
- `Select-String -Pattern "deploymentId|Deployment|appsscript"` in `code.gs`/`code_v2.gs`/`index.html`/`admin.html` → 0 hits
- `git log --oneline` → single commit `32b46f5 Initial commit` (no deployment tag)
- `git status` → `interactive rebase` with untracked files
- Live `fetch WEB_APP_URL?action=getInitData` not possible offline (no Sheets access)

**Conclusion:** **No deployment evidence exists in the repository.** Cannot prove which file's content is at `WEB_APP_URL`.

## 3. Phase 03 Mitigation (U1 BLOCKED)

Per `PHASE_02:94-100` and `PHASE_03_DATA_LAYER.md §2`:

> If deployment not verifiable → STATUS = BLOCKED for backend implementation

**Action taken:**

- **Did NOT claim** `code_v2.gs` as deployed canonical
- **Did NOT delete** `code.gs`
- **Did NOT destructive merge**
- **Applied all Phase 03 backend changes to BOTH files** identically, so whichever is deployed, `readMillionaireQuestions_` and `getInitData.millionaireQuestions` will be available after the next deployment
- **Did NOT deploy** to production (no Apps Script publish step executed)

## 4. Remaining Uncertainty

- 100% — offline audit cannot determine deployed source
- Future `saveGameResult` 15-col change (U2) also blocked; not yet applied

## 5. Required Verification Before Claiming U1 Resolved

1. Open Google Apps Script project linked to `WEB_APP_URL`
2. Check **Deployments** → compare deployed source vs `code.gs` vs `code_v2.gs` (look for `MILLIONAIRE_QUESTIONS_SHEET` constant)
3. Live `fetch(WEB_APP_URL + "?action=getInitData")` and inspect JSON for `millionaireQuestions` field (if present, Phase 03 helpers are deployed)
4. Update this file with:

```
canonical file: code.gs | code_v2.gs (verified)
deploymentId: ...
verification date: YYYY-MM-DD
evidence: screenshot / fetch log
```

5. After verification, consolidate to single canonical file and delete backup clone

## 6. Decision for Phase 04

Phase 04 may proceed with **frontend data layer only** (fallback, normalization, selection, filtering) without depending on backend deployment. Backend-dependent features (production sheet read) must wait for U1 verification, but code is already prepared in both files.

---

*Phase 03 — U1 remains UNVERIFIED / BLOCKED. This file satisfies `PHASE_03_DATA_LAYER.md` output `docs/millionaire/BACKEND_CANONICAL.md`.*

