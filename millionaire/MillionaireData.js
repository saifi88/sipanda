// Millionaire Data Layer — normalization, validation, prize/safe, duplicate, missing-level, filter, selection, fallback
// DATA ONLY. No FSM, no timer, no lifeline UI, no ladder animation, no dashboard/admin UI.

window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {};

// --- Canonical prize ladder (index level-1) ---
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER = window.SIPANDA_MILLIONAIRE.PRIZE_LADDER || [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000
];
window.SIPANDA_MILLIONAIRE.SAFE_LEVELS = window.SIPANDA_MILLIONAIRE.SAFE_LEVELS || [5, 10, 15];

// --- Header (12 cols, exact order) ---
window.SIPANDA_MILLIONAIRE.HEADER = window.SIPANDA_MILLIONAIRE.HEADER || [
  "id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"
];

// --- MAPEL source of truth is window.MAPEL_LIST (from index.html). Fallback list for standalone tests ---
window.SIPANDA_MILLIONAIRE.MAPEL_LIST_FALLBACK = [
  "Pendidikan Pancasila","Bahasa Indonesia","Matematika","IPAS","Seni Rupa","Bahasa Jawa","Bahasa Inggris","Koding & AI"
];

// --- Helpers: prize / isSafe ---
window.SIPANDA_MILLIONAIRE.prizeForLevel = function(level) {
  var idx = Number(level) - 1;
  var ladder = window.SIPANDA_MILLIONAIRE.PRIZE_LADDER;
  if (idx < 0 || idx >= ladder.length) return null;
  return ladder[idx];
};

window.SIPANDA_MILLIONAIRE.isSafeForLevel = function(level) {
  return window.SIPANDA_MILLIONAIRE.SAFE_LEVELS.indexOf(Number(level)) !== -1;
};

// --- Helpers: boolean normalization (true/false/TRUE/FALSE/1/0) -> Boolean ---
window.SIPANDA_MILLIONAIRE.normalizeBoolean = function(value) {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  var s = String(value).trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return Boolean(value);
};

// --- Normalization: raw row (optionA-D) -> normalized model ---
window.SIPANDA_MILLIONAIRE.normalizeMillionaireQuestion = function(raw) {
  var id = String(raw.id || raw.ID || "").trim();
  var mapel = String(raw.mapel || raw.Mapel || "").trim();
  var level = Number(raw.level);
  var question = String(raw.question || raw.Question || "").trim();
  // Support both optionA-D and options[4] input
  var optionA = ("optionA" in raw) ? String(raw.optionA).trim() : (Array.isArray(raw.options) ? String(raw.options[0] || "").trim() : "");
  var optionB = ("optionB" in raw) ? String(raw.optionB).trim() : (Array.isArray(raw.options) ? String(raw.options[1] || "").trim() : "");
  var optionC = ("optionC" in raw) ? String(raw.optionC).trim() : (Array.isArray(raw.options) ? String(raw.options[2] || "").trim() : "");
  var optionD = ("optionD" in raw) ? String(raw.optionD).trim() : (Array.isArray(raw.options) ? String(raw.options[3] || "").trim() : "");
  var answer = parseInt(raw.answer, 10);
  var prizeRaw = raw.prize;
  var prize = (prizeRaw === "" || prizeRaw === null || prizeRaw === undefined) ? null : Number(prizeRaw);
  // Derive prize/isSafe canonically; keep raw isSafe for audit but override
  var canonicalPrize = window.SIPANDA_MILLIONAIRE.prizeForLevel(level);
  var prizeNorm = (prize === canonicalPrize) ? prize : canonicalPrize; // override mismatch per spec
  var isSafe = window.SIPANDA_MILLIONAIRE.isSafeForLevel(level);
  var explanation = String(raw.explanation || raw.Explanation || "").trim();
  return {
    id: id,
    mapel: mapel,
    level: level,
    question: question,
    options: [optionA, optionB, optionC, optionD],
    // keep optionA-D alias for backend compatibility
    optionA: optionA,
    optionB: optionB,
    optionC: optionC,
    optionD: optionD,
    answer: answer,
    prize: prizeNorm,
    isSafe: isSafe,
    explanation: explanation,
    _rawIsSafe: window.SIPANDA_MILLIONAIRE.normalizeBoolean(raw.isSafe),
    _rawPrize: prize
  };
};

// --- Validation per PHASE_02 §250-265 + §378-442 ---
window.SIPANDA_MILLIONAIRE.validateMillionaireQuestion = function(q) {
  var errors = [];
  var mapelList = (typeof MAPEL_LIST !== "undefined" && Array.isArray(MAPEL_LIST) && MAPEL_LIST.length) ? MAPEL_LIST : window.SIPANDA_MILLIONAIRE.MAPEL_LIST_FALLBACK;

  if (!q.id || !/^[A-Za-z0-9_-]+$/.test(q.id)) errors.push("INVALID_ID");
  if (mapelList.indexOf(q.mapel) === -1) errors.push("INVALID_MAPEL");
  if (!Number.isInteger(q.level) || q.level < 1 || q.level > 15) errors.push("INVALID_LEVEL");
  if (!q.question || q.question.length === 0) errors.push("EMPTY_QUESTION");
  if (q.question && q.question.length > 200) errors.push("QUESTION_TOO_LONG");
  for (var i = 0; i < 4; i++) {
    if (!q.options[i] || String(q.options[i]).trim().length === 0) errors.push("EMPTY_OPTION_" + i);
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push("INVALID_ANSWER");
  var canonicalPrize = window.SIPANDA_MILLIONAIRE.prizeForLevel(q.level);
  if (canonicalPrize === null) errors.push("PRIZE_NO_LADDER");
  else if (q.prize !== canonicalPrize) errors.push("PRIZE_MISMATCH"); // caller may override; we still flag
  // isSafe is derived, so no INVALID_ISSAFE — mismatch is normalized, not invalid
  if (q.explanation && q.explanation.length > 500) errors.push("EXPLANATION_TOO_LONG");

  return { ok: errors.length === 0, errors: errors };
};

// --- Duplicate handling ---
window.SIPANDA_MILLIONAIRE.checkDuplicateIds = function(questions) {
  var seen = {};
  var duplicates = [];
  var unique = [];
  for (var i = 0; i < questions.length; i++) {
    var id = questions[i].id;
    if (seen[id]) {
      duplicates.push(questions[i]);
    } else {
      seen[id] = true;
      unique.push(questions[i]);
    }
  }
  // Policy: reject duplicate rows (not last-wins)
  return { unique: unique, duplicates: duplicates, hasDuplicate: duplicates.length > 0 };
};

// --- Missing-level detection ---
window.SIPANDA_MILLIONAIRE.missingLevelsForMapel = function(questions, mapel) {
  var mapelList = (typeof MAPEL_LIST !== "undefined" && Array.isArray(MAPEL_LIST) && MAPEL_LIST.length) ? MAPEL_LIST : window.SIPANDA_MILLIONAIRE.MAPEL_LIST_FALLBACK;
  // Filter by mapel first if provided
  var filtered = mapel ? questions.filter(function(q){ return q.mapel === mapel; }) : questions;
  var present = {};
  for (var i = 0; i < filtered.length; i++) present[filtered[i].level] = true;
  var missing = [];
  for (var lv = 1; lv <= 15; lv++) if (!present[lv]) missing.push(lv);
  return { ok: missing.length === 0, missing: missing };
};

// --- Filter by mapel ---
window.SIPANDA_MILLIONAIRE.filterByMapel = function(questions, mapel) {
  if (!mapel) return questions.slice();
  return questions.filter(function(q){ return q.mapel === mapel; });
};

// --- Group by level (mapel+level key) ---
window.SIPANDA_MILLIONAIRE.groupByLevel = function(questions) {
  var groups = {};
  for (var i = 0; i < questions.length; i++) {
    var lv = questions[i].level;
    if (!groups[lv]) groups[lv] = [];
    groups[lv].push(questions[i]);
  }
  return groups; // {1:[...],2:[...],...}
};

// --- Selection: 1 question per level L1-L15, deterministic level order, random among candidates per level ---
window.SIPANDA_MILLIONAIRE.selectOnePerLevel = function(questions) {
  // Assumes questions already filtered to one mapel and validated
  var groups = window.SIPANDA_MILLIONAIRE.groupByLevel(questions);
  var selected = [];
  var missing = [];
  for (var lv = 1; lv <= 15; lv++) {
    var candidates = groups[lv] || [];
    if (candidates.length === 0) { missing.push(lv); continue; }
    if (candidates.length === 1) selected.push(candidates[0]);
    else {
      // random among valid rows (spec recommended)
      var idx = Math.floor(Math.random() * candidates.length);
      selected.push(candidates[idx]);
    }
  }
  if (missing.length > 0) {
    return { ok: false, reason: "INCOMPLETE_LEVEL_SET", missingLevels: missing };
  }
  // Ensure order L1->L15
  selected.sort(function(a,b){ return a.level - b.level; });
  return { ok: true, questions: selected };
};

// --- Build full question set for a mapel (validation + dedup + completeness) ---
window.SIPANDA_MILLIONAIRE.buildMillionaireQuestionSet = function(allQuestions, mapel) {
  var filtered = window.SIPANDA_MILLIONAIRE.filterByMapel(allQuestions, mapel);
  // Normalize already assumed; validate
  var valid = [];
  var invalid = [];
  for (var i = 0; i < filtered.length; i++) {
    var v = window.SIPANDA_MILLIONAIRE.validateMillionaireQuestion(filtered[i]);
    if (v.ok) valid.push(filtered[i]);
    else invalid.push({ question: filtered[i], errors: v.errors });
  }
  // Duplicate id check among valid
  var dedup = window.SIPANDA_MILLIONAIRE.checkDuplicateIds(valid);
  if (dedup.hasDuplicate) {
    // Reject duplicates: keep unique only, report
    valid = dedup.unique;
  }
  var sel = window.SIPANDA_MILLIONAIRE.selectOnePerLevel(valid);
  if (!sel.ok) return { ok: false, reason: sel.reason, missingLevels: sel.missingLevels, invalid: invalid, duplicates: dedup.duplicates };
  return { ok: true, questions: sel.questions, invalid: invalid, duplicates: dedup.duplicates };
};

// --- Fallback policy (no mixed patch) ---
window.SIPANDA_MILLIONAIRE.resolveQuestionSource = function(productionQuestions) {
  // Returns { source: "production"|"fallback"|"error", questions: [...]|null, reason }
  var fallback = window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS || [];
  var prod = productionQuestions;
  var isProdUnavailable = (prod == null) || !Array.isArray(prod);
  var isProdIncomplete = Array.isArray(prod) && prod.length < 15;
  // Also treat fetch error as unavailable (caller passes null)
  if (isProdUnavailable || isProdIncomplete) {
    // Do not patch: if production would be considered but is incomplete, use entire fallback
    if (fallback && fallback.length >= 15) {
      return { source: "fallback", questions: fallback, reason: isProdUnavailable ? "PRODUCTION_UNAVAILABLE" : "PRODUCTION_INCOMPLETE" };
    }
    return { source: "error", questions: null, reason: "NO_VALID_SOURCE" };
  }
  // Also need per-mapel completeness? The game will call buildMillionaireQuestionSet per mapel later.
  // At source level, we have at least 15 rows globally, so consider production valid.
  return { source: "production", questions: prod, reason: "OK" };
};

// --- Score helper (separate from virtualRupiah) ---
window.SIPANDA_MILLIONAIRE.scoreForLevel = function(levelReached) {
  var lv = Number(levelReached);
  if (!Number.isFinite(lv) || lv < 0) return 0;
  if (lv > 15) lv = 15;
  return Math.round((lv / 15) * 100);
};

// --- Anti-farm key helper ---
window.SIPANDA_MILLIONAIRE.antiFarmKey = function(nisn, gameId, level) {
  return "game_last_" + String(nisn) + "_" + String(gameId) + "_" + String(level);
};
