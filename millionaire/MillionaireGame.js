// MillionaireGame — Game Engine (Phase 04)
// Isolated module, data layer via window.SIPANDA_MILLIONAIRE (Phase 03), no final skin
// U1 = UNVERIFIED/BLOCKED (backend prod not claimed), U2 = CONDITIONALLY BLOCKED (GameResults 15-col not deployed)

window.SIPANDA_MILLIONAIRE = window.SIPANDA_MILLIONAIRE || {};

// Ensure ladder safe levels are available (reuse from Phase 03, do not redefine)
window.SIPANDA_MILLIONAIRE.PRIZE_LADDER = window.SIPANDA_MILLIONAIRE.PRIZE_LADDER || [
  100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000
];
window.SIPANDA_MILLIONAIRE.SAFE_LEVELS = window.SIPANDA_MILLIONAIRE.SAFE_LEVELS || [5,10,15];

// FSM 12 states
window.SIPANDA_MILLIONAIRE.STATES = {
  INTRO:"INTRO", READY:"READY", QUESTION:"QUESTION", SELECTING:"SELECTING",
  LOCKED:"LOCKED", REVEAL:"REVEAL", CORRECT:"CORRECT", WRONG:"WRONG",
  SAFE_EXIT:"SAFE_EXIT", GAME_OVER:"GAME_OVER", VICTORY:"VICTORY", FINISHED:"FINISHED"
};

// Allowed transition matrix (Phase 04 §10)
window.SIPANDA_MILLIONAIRE.ALLOWED_TRANSITIONS = {
  INTRO:["READY"],
  READY:["QUESTION"],
  QUESTION:["SELECTING","SAFE_EXIT"],
  SELECTING:["SELECTING","LOCKED","SAFE_EXIT"],
  LOCKED:["REVEAL"],
  REVEAL:["CORRECT","WRONG"],
  CORRECT:["QUESTION","VICTORY"],
  WRONG:["GAME_OVER"],
  SAFE_EXIT:["FINISHED"],
  GAME_OVER:["FINISHED"],
  VICTORY:["FINISHED"],
  FINISHED:[]
};

// Timer config — isolated runtime, not a contract lock (Phase 04 §22)
window.SIPANDA_MILLIONAIRE.TIMER_SECONDS = window.SIPANDA_MILLIONAIRE.TIMER_SECONDS || 30;

function MillionaireGame(props) {
  var game = props.game || {};
  var currentUser = props.currentUser || { name: "Pemain" };
  var onFinish = props.onFinish;
  var onExit = props.onExit;
  // onReplay provided by dispatcher: bumps gamePlayKey to remount
  var onReplay = props.onReplay;

  // Production questions may be injected via App (appData.millionaireQuestions) or via window
  // Fallback to window.SIPANDA_MILLIONAIRE.FALLBACK_QUESTIONS if production unavailable — no mixed patch
  var prodFromWindow = (typeof window !== "undefined" && window.__SIPANDA_MILLIONAIRE_PROD__) ? window.__SIPANDA_MILLIONAIRE_PROD__ : null;
  var prodFromGame = game.productionQuestions || game.allQuestions || props.allQuestions || prodFromWindow;
  // Also check global appData exposed as window._sipandaAppData if App sets it
  var prodFromAppData = (typeof window !== "undefined" && window._sipandaAppData && window._sipandaAppData.millionaireQuestions) ? window._sipandaAppData.millionaireQuestions : null;
  var rawProd = prodFromGame || prodFromAppData || prodFromWindow;

  // Data layer helpers (must exist)
  var M = window.SIPANDA_MILLIONAIRE;
  var PRIZE_LADDER = M.PRIZE_LADDER;
  var SAFE_LEVELS = M.SAFE_LEVELS;

  // State
  var _initial = React.useMemo(function(){
    return {
      state: M.STATES.INTRO,
      mapel: game.mapel || (typeof MAPEL_LIST !== "undefined" ? MAPEL_LIST[3] : "IPAS"),
      questions: [],
      currentIndex: 0,
      selectedAnswer: null,
      lockedAnswer: null,
      correct: 0,
      wrong: 0,
      highestLevel: 0,
      virtualRupiah: 0,
      safeRupiah: 0,
      walkAway: false,
      lifelinesUsed: { fiftyFifty:false, askClass:false, askFriend:false },
      hiddenOptions: [],
      askClassResult: null,
      askFriendResult: null,
      startedAt: null,
      finishedAt: null,
      durationDetik: 0,
      timerRemaining: M.TIMER_SECONDS,
      resultSaved: false,
      error: null
    };
  }, [game.mapel]);

  var _state, _setState;
  var tmp = React.useState(_initial);
  _state = tmp[0]; _setState = tmp[1];

  var timerRef = React.useRef(null);
  var revealTimeoutRef = React.useRef(null);
  var finishedGuardRef = React.useRef(false);
  var startedAtRef = React.useRef(null);

  // Fresh-state mirror for async transition guards (walk-away fix):
  // setTimeout callbacks must judge legality against committed state,
  // not the stale render snapshot captured when the handler ran.
  var stateRef = React.useRef(_initial.state);
  React.useEffect(function(){ stateRef.current = _state.state; });

  // Helper: safeRupiah from highestLevel
  function calcSafeRupiah(level) {
    var lv = Number(level);
    if (lv >= 15) return PRIZE_LADDER[14];
    if (lv >= 10) return PRIZE_LADDER[9];
    if (lv >= 5) return PRIZE_LADDER[4];
    return 0;
  }
  function prizeForLevel(level) {
    if (level <1 || level>15) return 0;
    return PRIZE_LADDER[level-1];
  }

  // Transition guard (reads committed state via stateRef so async
  // setTimeout callbacks cannot judge against a stale snapshot)
  function transitionTo(next) {
    var cur = stateRef.current;
    var allowed = M.ALLOWED_TRANSITIONS[cur] || [];
    if (allowed.indexOf(next) === -1) {
      // Illegal transition — log, do not crash
      try { console.warn("[Millionaire] illegal transition " + cur + " -> " + next); } catch(e){}
      return false;
    }
    _setState(function(s){ return Object.assign({}, s, { state: next }); });
    return true;
  }
  // Expose for tests (data layer isolation)
  M._transitionTo = transitionTo;

  // Cleanup timers on unmount or FINISHED
  React.useEffect(function(){
    return function(){
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null; }
    };
  }, []);

  // Timer lifecycle: active only on QUESTION / SELECTING (before LOCKED)
  React.useEffect(function(){
    var active = (_state.state === M.STATES.QUESTION || _state.state === M.STATES.SELECTING);
    if (active) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(function(){
        _setState(function(s){
          if (s.state !== M.STATES.QUESTION && s.state !== M.STATES.SELECTING) return s;
          var next = s.timerRemaining - 1;
          if (next <= 0) {
            // Timeout => WRONG -> GAME_OVER (Phase 04 §23)
            clearInterval(timerRef.current); timerRef.current = null;
            // Schedule expiry as wrong after state update
            setTimeout(function(){ handleTimeout(); }, 0);
            return Object.assign({}, s, { timerRemaining: 0 });
          }
          return Object.assign({}, s, { timerRemaining: next });
        });
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return function(){
      if (!active && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [_state.state]);

  // Also stop timer on LOCKED, SAFE_EXIT, WRONG, GAME_OVER, VICTORY, FINISHED — covered by effect above
  // Prevent state update after unmount
  React.useEffect(function(){
    if (_state.state === M.STATES.FINISHED && revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null;
    }
  }, [_state.state]);

  // PHASE 07 pre-game gate (local UI only — NOT an FSM state; FSM stays INTRO underneath).
  // Contestant identity comes from existing props.currentUser (backend Siswa: nisn+name).
  // Mapel list comes from the resolved MillionaireQuestions source (unique mapels).
  // NOTE: this block must stay ABOVE the load effect (deps read _pg during render).
  var _pg, _setPg;
  var pgtmp = React.useState({ show: true, selectedMapel: null });
  _pg = pgtmp[0]; _setPg = pgtmp[1];

  // Normalize raw sheet rows per-row (pre-game display only; load effect untouched).
  function normalizeForBuild(rows) {
    if (!rows || !rows.length || !M.normalizeMillionaireQuestion) return rows;
    return rows.map(function(r){
      if (r && r.options === undefined && r.optionA !== undefined) return M.normalizeMillionaireQuestion(r);
      return r;
    });
  }
  function checkMapelReady(rows, mapel) {
    if (M.buildMillionaireQuestionSet) {
      try {
        var b = M.buildMillionaireQuestionSet(rows, mapel);
        if (b && b.ok) return { ok: true };
        return { ok: false, missing: (b && b.missingLevels) || [] };
      } catch(e){ return { ok: false, missing: [] }; }
    }
    var present = {};
    rows.forEach(function(qq){ if (qq.mapel === mapel && qq.level >= 1 && qq.level <= 15) present[qq.level] = true; });
    var miss = [];
    for (var lv = 1; lv <= 15; lv++) if (!present[lv]) miss.push(lv);
    return miss.length ? { ok: false, missing: miss } : { ok: true };
  }
  var pregame = React.useMemo(function(){
    var resolve = M.resolveQuestionSource ? M.resolveQuestionSource(rawProd) : { source:"fallback", questions: M.FALLBACK_QUESTIONS, reason:"NO_HELPER" };
    var src = resolve.questions || [];
    var norm = normalizeForBuild(src);
    var seen = {}, uniq = [];
    norm.forEach(function(qq){ if (qq && qq.mapel && !seen[qq.mapel]) { seen[qq.mapel] = true; uniq.push(qq.mapel); } });
    var order = (typeof MAPEL_LIST !== "undefined" && Array.isArray(MAPEL_LIST) && MAPEL_LIST.length) ? MAPEL_LIST : [];
    uniq.sort(function(a,b){
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return ((ia===-1)?999:ia) - ((ib===-1)?999:ib);
    });
    var validity = {};
    uniq.forEach(function(mp){ validity[mp] = checkMapelReady(norm, mp); });
    return { resolve: resolve, mapels: uniq, validity: validity };
  }, [rawProd]);

  function chooseMapel(mp) {
    _setPg(function(p){ return Object.assign({}, p, { selectedMapel: mp }); });
  }
  function startPregame() {
    var mp = _pg.selectedMapel;
    if (!mp) return;
    var v = pregame.validity[mp];
    if (!v || !v.ok) return; // MULAI is disabled here anyway; double guard, no silent fallback
    _setState(function(s){ return Object.assign({}, s, { mapel: mp, error: null }); });
    _setPg(function(p){ return Object.assign({}, p, { show: false }); });
  }

  // Load question set on mount / when mapel changes / game replay / MULAI (gated by pre-game)
  React.useEffect(function(){
    if (_pg.show) return; // PHASE 07 pre-game gate: wait for contestant + valid mapel + MULAI
    // Reset to INTRO then load
    var mapel = _state.mapel;
    // Use Phase 03 helpers: resolveQuestionSource -> buildMillionaireQuestionSet
    var resolve = M.resolveQuestionSource ? M.resolveQuestionSource(rawProd) : { source:"fallback", questions: M.FALLBACK_QUESTIONS, reason:"NO_HELPER" };
    var sourceQuestions = resolve.questions;
    if (!sourceQuestions) {
      _setState(function(s){ return Object.assign({}, s, { state: M.STATES.INTRO, error: resolve.reason || "NO_VALID_SOURCE" }); });
      return;
    }
    // If resolve says production but we still need to filter by mapel and validate completeness, use build helper
    var built = null;
    if (M.buildMillionaireQuestionSet) {
      // All questions may be mixed mapels; build per mapel
      // If prod source is fallback already filtered, build will still work
      // Normalize if needed: fallback already normalized, prod may be raw sheet rows (optionA-D)
      // Ensure we have normalized objects: if raw has optionA, normalize
      var toBuild = sourceQuestions;
      // Detect raw sheet rows: has optionA but not options array
      // Normalize any raw that still has optionA-D but not options
      if (toBuild.length && toBuild[0].options === undefined && toBuild[0].optionA !== undefined) {
        toBuild = toBuild.map(function(r){ return M.normalizeMillionaireQuestion ? M.normalizeMillionaireQuestion(r) : r; });
      }
      built = M.buildMillionaireQuestionSet(toBuild, mapel);
    } else {
      // Fallback manual: filter + check
      var filtered = sourceQuestions.filter(function(q){ return q.mapel === mapel; });
      if (filtered.length < 15) built = { ok:false, reason:"INCOMPLETE_LEVEL_SET", missingLevels: [] };
      else built = { ok:true, questions: filtered.slice(0,15).sort(function(a,b){return a.level-b.level;}) };
    }

    if (!built || !built.ok) {
      _setState(function(s){ return Object.assign({}, s, { state: M.STATES.INTRO, error: built ? (built.reason + (built.missingLevels? " missing:"+built.missingLevels.join(","):"")) : "BUILD_FAILED" }); });
      return;
    }
    // Success: move to READY, store 15 ordered questions
    _setState(function(s){
      return Object.assign({}, s, {
        questions: built.questions,
        currentIndex: 0,
        state: M.STATES.READY,
        error: null,
        startedAt: Date.now(),
        timerRemaining: M.TIMER_SECONDS
      });
    });
    startedAtRef.current = Date.now();
  }, [game.mapel, game.id, _pg.show, _state.mapel]);

  // Auto READY -> QUESTION
  React.useEffect(function(){
    if (_state.state === M.STATES.READY) {
      var t = setTimeout(function(){ transitionTo(M.STATES.QUESTION); }, 300);
      return function(){ clearTimeout(t); };
    }
  }, [_state.state]);

  // Helper to get current question
  function currentQuestion() {
    if (!_state.questions || !_state.questions.length) return null;
    return _state.questions[_state.currentIndex] || null;
  }
  var q = currentQuestion();
  var currentLevel = _state.currentIndex + 1;

  // Lifeline: 50:50
  function useFiftyFifty() {
    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
    if (_state.lifelinesUsed.fiftyFifty) return;
    if (_state.state === M.STATES.LOCKED || _state.state === M.STATES.REVEAL) return;
    if (!q) return;
    var correct = q.answer;
    var wrongs = [0,1,2,3].filter(function(i){ return i !== correct; });
    // Shuffle wrongs, pick 2 to hide
    var shuffled = (typeof shuffleArray === "function" ? shuffleArray(wrongs.slice()) : wrongs.sort(function(){return Math.random()-0.5;}));
    var hidden = shuffled.slice(0,2);
    _setState(function(s){ return Object.assign({}, s, {
      hiddenOptions: hidden,
      lifelinesUsed: Object.assign({}, s.lifelinesUsed, { fiftyFifty:true })
    }); });
  }
  // Tanya Kelas: poll simulation
  function useAskClass() {
    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
    if (_state.lifelinesUsed.askClass) return;
    if (!q) return;
    var ans = q.answer;
    // Generate biased poll: correct 55-75%, rest 25-45 split
    var correctPct = 55 + Math.floor(Math.random()*20);
    var remaining = 100 - correctPct;
    var others = [0,1,2,3].filter(function(i){ return i!==ans; });
    // distribute remaining randomly among 3 others
    var a = Math.floor(Math.random()*remaining);
    var b = Math.floor(Math.random()*(remaining-a));
    var c = remaining - a - b;
    var vals = {}; vals[ans]=correctPct;
    vals[others[0]]=a; vals[others[1]]=b; vals[others[2]]=c;
    var result = { A: vals[0]||0, B: vals[1]||0, C: vals[2]||0, D: vals[3]||0 };
    _setState(function(s){ return Object.assign({}, s, {
      askClassResult: result,
      lifelinesUsed: Object.assign({}, s.lifelinesUsed, { askClass:true })
    }); });
  }
  // Tanya Teman
  function useAskFriend() {
    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
    if (_state.lifelinesUsed.askFriend) return;
    if (!q) return;
    var ans = q.answer;
    var isCorrect = Math.random() < 0.7;
    var suggested = isCorrect ? ans : ([0,1,2,3].filter(function(i){return i!==ans;})[Math.floor(Math.random()*3)]);
    var conf = isCorrect ? (Math.random()<0.5 ? "high":"medium") : "low";
    _setState(function(s){ return Object.assign({}, s, {
      askFriendResult: { suggestedAnswer: suggested, confidence: conf },
      lifelinesUsed: Object.assign({}, s.lifelinesUsed, { askFriend:true })
    }); });
  }

  function handleTimeout() {
    // Timer expiry fails the active question (Phase 04 §23):
    // QUESTION/SELECTING -> REVEAL -> WRONG -> GAME_OVER -> FINISHED.
    // No matrix change: REVEAL is entered via direct setState (same vehicle
    // lockAnswer uses for CORRECT/WRONG); WRONG via guarded transition.
    // Guard reads committed state so a stale snapshot cannot mis-judge.
    var cur = stateRef.current;
    if (cur !== M.STATES.QUESTION && cur !== M.STATES.SELECTING) return;
    _setState(function(s){
      if (s.state !== M.STATES.QUESTION && s.state !== M.STATES.SELECTING) return s;
      return Object.assign({}, s, { wrong: 1, state: M.STATES.REVEAL });
    });
    // Same 900ms reveal cadence as the lock flow; WRONG is legal from REVEAL,
    // then GAME_OVER (legal from WRONG, same 700ms cadence as the lock flow),
    // then FINISHED via the existing terminal-state effect.
    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null; }
    revealTimeoutRef.current = setTimeout(function(){
      transitionTo(M.STATES.WRONG);
      setTimeout(function(){ transitionTo(M.STATES.GAME_OVER); }, 700);
    }, 900);
  }

  function selectAnswer(idx) {
    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
    if (_state.hiddenOptions && _state.hiddenOptions.indexOf(idx) !== -1) return;
    if (idx <0 || idx>3) return;
    _setState(function(s){
      return Object.assign({}, s, { selectedAnswer: idx, state: M.STATES.SELECTING });
    });
  }

  function lockAnswer() {
    if (_state.state !== M.STATES.SELECTING) return;
    if (_state.selectedAnswer === null || _state.selectedAnswer === undefined) return;
    // Stop timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    var locked = _state.selectedAnswer;
    _setState(function(s){ return Object.assign({}, s, { lockedAnswer: locked, state: M.STATES.LOCKED }); });
    // Transition LOCKED -> REVEAL after micro delay
    setTimeout(function(){
      transitionTo(M.STATES.REVEAL);
      // After reveal short delay, decide CORRECT/WRONG
      revealTimeoutRef.current = setTimeout(function(){
        var curQ = currentQuestion();
        if (!curQ) return;
        var isCorrect = (locked === curQ.answer);
        if (isCorrect) {
          _setState(function(s){
            var nextHighest = s.currentIndex +1;
            var virt = prizeForLevel(nextHighest);
            var safe = calcSafeRupiah(nextHighest);
            return Object.assign({}, s, {
              correct: s.correct +1,
              highestLevel: nextHighest,
              virtualRupiah: virt,
              safeRupiah: safe,
              state: M.STATES.CORRECT
            });
          });
          // Decide next: if L15 -> VICTORY else QUESTION
          setTimeout(function(){
            if (currentLevel >= 15) {
              transitionTo(M.STATES.VICTORY);
            } else {
              // Next question: increment index, reset per-question state
              _setState(function(s){
                return Object.assign({}, s, {
                  currentIndex: s.currentIndex +1,
                  selectedAnswer: null,
                  lockedAnswer: null,
                  hiddenOptions: [],
                  askClassResult: null,
                  askFriendResult: null,
                  timerRemaining: M.TIMER_SECONDS,
                  state: M.STATES.QUESTION
                });
              });
            }
          }, 700);
        } else {
          _setState(function(s){
            return Object.assign({}, s, { wrong: 1, state: M.STATES.WRONG });
          });
          setTimeout(function(){ transitionTo(M.STATES.GAME_OVER); }, 700);
        }
      }, 900);
    }, 200);
  }

  function walkAway() {
    if (_state.state !== M.STATES.QUESTION && _state.state !== M.STATES.SELECTING) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    // virtualRupiah is last achieved prize (highestLevel), safeRupiah already calc
    _setState(function(s){ return Object.assign({}, s, { walkAway:true, state: M.STATES.SAFE_EXIT }); });
    setTimeout(function(){ transitionTo(M.STATES.FINISHED); }, 400);
  }

  // Handle GAME_OVER -> FINISHED, VICTORY -> FINISHED, SAFE_EXIT -> FINISHED already via walkAway
  React.useEffect(function(){
    if (_state.state === M.STATES.GAME_OVER) {
      // Compute safeRupiah if not yet, virtual = safe
      _setState(function(s){
        var safe = calcSafeRupiah(s.highestLevel);
        return Object.assign({}, s, { safeRupiah: safe, virtualRupiah: safe });
      });
      var t = setTimeout(function(){ transitionTo(M.STATES.FINISHED); }, 700);
      return function(){ clearTimeout(t); };
    }
    if (_state.state === M.STATES.VICTORY) {
      _setState(function(s){ return Object.assign({}, s, { virtualRupiah: prizeForLevel(15), safeRupiah: prizeForLevel(15), highestLevel:15, correct:15 }); });
      var t2 = setTimeout(function(){ transitionTo(M.STATES.FINISHED); }, 700);
      return function(){ clearTimeout(t2); };
    }
    if (_state.state === M.STATES.SAFE_EXIT) {
      // Already set walkAway, ensure timer stopped
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    }
  }, [_state.state]);

  // FINISHED -> build result payload + save guard
  React.useEffect(function(){
    if (_state.state !== M.STATES.FINISHED) return;
    if (finishedGuardRef.current) return;
    finishedGuardRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    var finishedAt = Date.now();
    var started = startedAtRef.current || finishedAt;
    var dur = Math.round((finishedAt - started)/1000);

    // Reuse Phase 03 helpers for score etc.
    var levelReached = _state.highestLevel;
    // If walkAway at QUESTION before correct, levelReached is last correct; if INTRO error, 0
    var skor = M.scoreForLevel ? M.scoreForLevel(levelReached) : Math.round((levelReached/15)*100);
    var benar = _state.correct;
    var salah = _state.wrong;
    // Ensure virtual/safe already set; if FINISHED from INTRO error, keep 0
    var virtualRupiah = _state.virtualRupiah || 0;
    var safeRupiah = _state.safeRupiah || calcSafeRupiah(levelReached);
    // If wrong after safe, virtual already set to safe via GAME_OVER effect
    // Build result payload additive fields
    var result = {
      gameId: game.id || ("millionaire-" + (_state.mapel||"IPAS").toLowerCase() + "-01"),
      title: game.title || ("Millionaire: " + (_state.mapel||"IPAS")),
      mapel: _state.mapel,
      type: "millionaire",
      skor: skor,
      benar: benar,
      salah: salah,
      durasiDetik: dur,
      level: String(levelReached),
      virtualRupiah: virtualRupiah,
      safeRupiah: safeRupiah,
      walkAway: _state.walkAway,
      lifelinesUsed: Object.assign({}, _state.lifelinesUsed),
      extra: JSON.stringify({
        walkAway: _state.walkAway,
        lifelinesUsed: Object.assign({}, _state.lifelinesUsed),
        prizeLadderSnapshot: PRIZE_LADDER.map(function(p,i){ return { level:i+1, prize:p, isSafe: SAFE_LEVELS.indexOf(i+1)!==-1 }; })
      })
    };
    // Phase 10C: NO local anti-farm pre-call here. App.finishGame() is the sole
    // owner of the canSaveGameResult gate; a pre-call would write the timestamp
    // and force the App gate to reject the same key (<30s), so POST never fired.
    // Call parent finishGame (which does the single canSaveGameResult check and POST saveGameResult)
    // But we must ensure we don't double-save if onFinish already handles it.
    // Our resultSaved guard prevents duplicate call to onFinish
    _setState(function(s){ return Object.assign({}, s, { resultSaved:true, durationDetik: dur, finishedAt: finishedAt }); });
    if (typeof onFinish === "function" && !finishedGuardRef.current._called) {
      finishedGuardRef.current._called = true;
      try { onFinish(result); } catch(e){ console.error("Millionaire onFinish error", e); }
      // Note: onFinish (App.finishGame) will internally check canSaveGameResult again and POST
      // Our extra fields virtualRupiah/safeRupiah/extra will be sent via finishGame's record extension if App supports it
      // If App's finishGame does not yet support extra, data will still be partially saved via old 11-col path — U2 BLOCKED covers this
    }
  }, [_state.state]);

  // Restart helper (used by onReplay prop which remounts via key)
  function handleExit() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; }
    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current=null; }
    if (typeof onExit === "function") onExit();
  }

  // Render — minimal functional markup, not final skin (Phase 04 §53)
  // Must prove: question, A-D, timer, ladder, lifeline, state, walk-away, result

  var isFinished = _state.state === M.STATES.FINISHED;
  var isIntro = _state.state === M.STATES.INTRO;
  var isReady = _state.state === M.STATES.READY;

  // PHASE 07 pre-game gate: contestant + mapel selection.
  // Local UI only — FSM stays INTRO underneath; no result/save/anti-farm here.
  if (_pg.show) {
    var studentName = (currentUser && (currentUser.name || currentUser.nama)) || "";
    var studentKelas = (currentUser && (currentUser.kelas || currentUser.class)) || "";
    var hasSource = !!(pregame.resolve && pregame.resolve.questions);
    var selValid = _pg.selectedMapel && pregame.validity[_pg.selectedMapel] && pregame.validity[_pg.selectedMapel].ok;
    var selMissing = (_pg.selectedMapel && pregame.validity[_pg.selectedMapel] && pregame.validity[_pg.selectedMapel].missing) || [];
    return (
      <div className="sipanda-millionaire" data-state={_state.state} data-mode="intro">
        <div className="millionaire-bg" aria-hidden="true"></div>
        <div className="millionaire-stage">
          <div className="millionaire-pregame">
            <div className="millionaire-card millionaire-fadeIn millionaire-pregame__card">
              <div className="millionaire-pregame__brand">SI-PANDA</div>
              <h2 className="millionaire-pregame__welcome">SELAMAT DATANG, KONTESTAN!</h2>
              <div className="millionaire-pregame__avatar" aria-hidden="true">{(studentName || "P").charAt(0).toUpperCase()}</div>
              <div className="millionaire-pregame__name">{studentName || "Pemain"}</div>
              <div className="millionaire-pregame__kelas">{studentKelas || "Kontestan SI-PANDA"}</div>
              {!currentUser && <p className="millionaire-pregame__error" role="alert">Data kontestan tidak ditemukan.</p>}
              {currentUser && !hasSource && <p className="millionaire-pregame__error" role="alert">Soal Millionaire belum tersedia.</p>}
              {currentUser && hasSource && <h3 className="millionaire-pregame__mapel-title">PILIH MATA PELAJARAN</h3>}
              {currentUser && hasSource && (
                <div className="millionaire-pregame__grid" role="listbox" aria-label="Pilih mata pelajaran" aria-orientation="vertical">
                  {pregame.mapels.map(function(mp){
                    var v = pregame.validity[mp];
                    var isSel = _pg.selectedMapel === mp;
                    var cls = "millionaire-pregame__mapel" + (isSel ? " millionaire-pregame__mapel--selected" : "") + ((v && v.ok) ? "" : " millionaire-pregame__mapel--invalid");
                    return (
                      <button key={mp} role="option" aria-selected={isSel} onClick={function(){ chooseMapel(mp); }} className={cls}>
                        <span className="millionaire-pregame__mapel-name">{mp}</span>
                        <span className={"millionaire-pregame__badge" + ((v && v.ok) ? " millionaire-pregame__badge--ready" : "")}>{(v && v.ok) ? "✓ L1–L15" : "Belum lengkap"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {_pg.selectedMapel && selValid && <p className="millionaire-pregame__ready" role="status">{_pg.selectedMapel} SIAP DIMAINKAN!</p>}
              {_pg.selectedMapel && !selValid && <p className="millionaire-pregame__error" role="alert">Soal untuk mata pelajaran ini belum lengkap. Silakan pilih mata pelajaran lain.{selMissing.length ? " (Kurang: L" + selMissing.join(", L") + ")" : ""}</p>}
              <div className="millionaire-pregame__actions">
                <button onClick={startPregame} disabled={!selValid} className="millionaire-btn millionaire-btn--accent millionaire-pregame__start">MULAI PERMAINAN</button>
                <button onClick={handleExit} className="millionaire-btn millionaire-btn--ghost">Kembali</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error view: incomplete set
  if (_state.error && isIntro) {
    return (
      <div className="sipanda-millionaire" data-state={_state.state} data-mode="intro">
        <div className="millionaire-bg" aria-hidden="true"></div>
        <div className="millionaire-stage">
          <div className="millionaire-intro">
            <div className="millionaire-card millionaire-fadeIn">
              <h2 className="font-black text-lg">Soal Millionaire belum siap</h2>
              <p className="text-sm text-slate-600 mt-2">Alasan: {_state.error}</p>
              <p className="text-xs text-slate-500 mt-2">Gunakan fallback atau lengkapi Sheet MillionaireQuestions (15 level, mapel {_state.mapel}).</p>
              <button onClick={handleExit} className="millionaire-btn millionaire-btn--primary mt-4 w-full">Kembali</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isIntro || isReady) {
    return (
      <div className="sipanda-millionaire" data-state={_state.state} data-mode="intro">
        <div className="millionaire-bg" aria-hidden="true"></div>
        <div className="millionaire-stage">
          <div className="millionaire-intro">
            <div className="millionaire-card millionaire-card--dark millionaire-fadeIn" style={{textAlign:"center"}}>
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-2xl font-black">Millionaire — {_state.mapel}</h2>
              <p className="text-sm text-slate-300 mt-2">15 level menuju Rp1.000.000</p>
              <p className="text-xs text-slate-400 mt-1">State: {_state.state}</p>
              {isReady ? <p className="text-xs text-emerald-300 mt-2">Memuat soal... siap ke level 1</p> : <p className="text-xs text-slate-400 mt-2">Menyiapkan set soal...</p>}
              <button onClick={handleExit} className="millionaire-btn millionaire-btn--ghost mt-6">Keluar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    var skor = M.scoreForLevel ? M.scoreForLevel(_state.highestLevel) : Math.round((_state.highestLevel/15)*100);
    return (
      <div className="sipanda-millionaire" data-state={_state.state} data-mode="gameplay">
        <div className="millionaire-bg" aria-hidden="true"></div>
        <div className="millionaire-stage">
          <div className="millionaire-finished">
            <div className="millionaire-card millionaire-fadeIn" style={{textAlign:"center"}}>
              <div className="text-4xl mb-2">{_state.highestLevel===15 ? "🏆" : _state.walkAway ? "🚪" : _state.wrong? "💔" : "🏁"}</div>
              <h2 className="text-xl font-black">{_state.highestLevel===15 ? "VICTORY!" : _state.walkAway ? "SAFE EXIT" : _state.wrong ? "GAME OVER" : "SELESAI"}</h2>
              <p className="text-xs text-slate-500">Level: {_state.highestLevel} / 15 • Benar: {_state.correct} • Salah: {_state.wrong}</p>
              <div className="grid grid-cols-3 gap-2 text-xs mt-4">
                <div className="bg-slate-50 rounded-xl p-3 border"><div className="font-black text-lg">{skor}</div><div>skor</div></div>
                <div className="bg-emerald-50 rounded-xl p-3 border"><div className="font-black text-lg">{_state.virtualRupiah}</div><div>Rupiah</div></div>
                <div className="bg-blue-50 rounded-xl p-3 border"><div className="font-black text-lg">{_state.safeRupiah}</div><div>safe</div></div>
              </div>
              <p className="text-xs text-slate-500 mt-3">Fifty:{_state.lifelinesUsed.fiftyFifty?"Y":"-"} Kelas:{_state.lifelinesUsed.askClass?"Y":"-"} Teman:{_state.lifelinesUsed.askFriend?"Y":"-"}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={handleExit} className="millionaire-btn millionaire-btn--primary flex-1">Keluar</button>
                {onReplay && <button onClick={onReplay} className="millionaire-btn millionaire-btn--accent flex-1">Main Lagi</button>}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Saved: {_state.resultSaved ? "yes" : "no"} • Durasi: {_state.durationDetik||0}s</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main gameplay view (QUESTION..VICTORY) — semantic classes for CSS, no logic change
  var letters = ["A","B","C","D"];
  var timerLow = _state.timerRemaining <= 5;
  return (
    <div className="sipanda-millionaire" data-state={_state.state} data-mode="gameplay">
      <div className="millionaire-bg" aria-hidden="true"></div>
      <div className="millionaire-stage">
        <header className="millionaire-header">
          <div className="millionaire-header__brand">
            <div className="millionaire-header__title">SI-PANDA</div>
            <div className="millionaire-header__meta">Zona Game · Millionaire<span className="millionaire-sr-only"> • {_state.mapel}</span></div>
          </div>
          <div className={`millionaire-timer ${timerLow ? "millionaire-timer--urgent" : ""}`} role="timer" aria-live="polite" aria-label="Sisa waktu">{_state.timerRemaining}s</div>
          <div className="millionaire-header__actions">
            <button onClick={walkAway} disabled={_state.state===M.STATES.LOCKED||_state.state===M.STATES.REVEAL} className="millionaire-btn millionaire-btn--accent" aria-label="Walk away">Keluar dengan Hadiah</button>
            <button onClick={handleExit} className="millionaire-btn millionaire-btn--ghost" aria-label="Kembali">Kembali</button>
          </div>
        </header>
        <div className="millionaire-layout">
          <div className="millionaire-stage-space" aria-hidden="true"></div>
          <div className="millionaire-question">
            <span className="millionaire-sr-only">Soal level {currentLevel} dari 15{q && q.isSafe ? ", level aman" : ""}. </span>
            <h3 className="millionaire-question__text">{q ? q.question : "Memuat..."}</h3>
            {q && q.explanation && (_state.state===M.STATES.REVEAL || _state.state===M.STATES.CORRECT || _state.state===M.STATES.WRONG) && <p className="millionaire-question__explanation">💡 {q.explanation}</p>}
          </div>
          <div className="millionaire-answers">
            {[0,1,2,3].map(function(idx){
              var isHidden = _state.hiddenOptions && _state.hiddenOptions.indexOf(idx)!==-1;
              var isSelected = _state.selectedAnswer===idx;
              var isLocked = _state.lockedAnswer===idx;
              var isCorrect = q && q.answer===idx && (_state.state===M.STATES.REVEAL||_state.state===M.STATES.CORRECT||_state.state===M.STATES.WRONG);
              var isWrongSel = isLocked && q && q.answer!==idx && (_state.state===M.STATES.REVEAL||_state.state===M.STATES.WRONG);
              var stateClass = isHidden ? "millionaire-option--hidden" : isWrongSel ? "millionaire-option--wrong" : isCorrect ? "millionaire-option--correct" : isLocked ? "millionaire-option--locked" : isSelected ? "millionaire-option--selected" : "";
              if (isHidden) return <button key={idx} disabled className="millionaire-option millionaire-option--hidden" aria-disabled="true">{letters[idx]}: ———</button>;
              return (
                <button key={idx} onClick={function(){ selectAnswer(idx); }} disabled={isHidden} aria-pressed={isSelected} className={`millionaire-option ${stateClass}`}>
                  <span className="millionaire-option__label">{letters[idx]}:</span>
                  <span className="millionaire-option__text">{q ? q.options[idx] : ""}</span>
                  {isLocked && <span aria-hidden="true" style={{color:"var(--gold)", fontSize:"0.85rem"}}> 🔒</span>}
                </button>
              );
            })}
          </div>
          <div className="millionaire-lifelines">
            <button onClick={useFiftyFifty} disabled={_state.lifelinesUsed.fiftyFifty || _state.state===M.STATES.LOCKED || _state.state===M.STATES.REVEAL || _state.state===M.STATES.FINISHED} className={`millionaire-lifeline ${_state.lifelinesUsed.fiftyFifty ? "millionaire-lifeline--used" : ""}`} aria-pressed={_state.lifelinesUsed.fiftyFifty} aria-label="Bantuan 50:50" title="50:50"><span className="millionaire-lifeline__glyph" aria-hidden="true">50:50</span></button>
            <button onClick={useAskClass} disabled={_state.lifelinesUsed.askClass || _state.state===M.STATES.LOCKED || _state.state===M.STATES.REVEAL} className={`millionaire-lifeline ${_state.lifelinesUsed.askClass ? "millionaire-lifeline--used" : ""} ${_state.askClassResult ? "millionaire-lifeline--active" : ""}`} aria-label="Tanya Kelas" title="Tanya Kelas"><svg className="millionaire-lifeline__glyph" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
            <button onClick={useAskFriend} disabled={_state.lifelinesUsed.askFriend || _state.state===M.STATES.LOCKED || _state.state===M.STATES.REVEAL} className={`millionaire-lifeline ${_state.lifelinesUsed.askFriend ? "millionaire-lifeline--used" : ""} ${_state.askFriendResult ? "millionaire-lifeline--active" : ""}`} aria-label="Tanya Teman" title="Tanya Teman"><svg className="millionaire-lifeline__glyph" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
          </div>
          <div className="millionaire-status millionaire-status--gamebar">
            <div className="millionaire-status__bar" role="status" aria-live="polite">
              <span>50:50 { _state.lifelinesUsed.fiftyFifty ? "✓" : "○"}</span>
              <span>Level {currentLevel} dari 15</span>
              <span><strong>Rp{(q ? q.prize : PRIZE_LADDER[currentLevel-1]).toLocaleString("id-ID")}</strong></span>
            </div>
            {(_state.state===M.STATES.SELECTING && _state.selectedAnswer!==null) && <button onClick={lockAnswer} className="millionaire-btn millionaire-btn--ghost millionaire-btn--lock">Kunci Jawaban</button>}
          </div>
          {_state.askClassResult && <div className="millionaire-card" style={{gridColumn:"1 / -1", fontSize:"0.82rem"}}>Tanya Kelas: A { _state.askClassResult.A}% B {_state.askClassResult.B}% C {_state.askClassResult.C}% D {_state.askClassResult.D}%</div>}
          {_state.askFriendResult && <div className="millionaire-card" style={{gridColumn:"1 / -1", fontSize:"0.82rem"}}>Tanya Teman: {letters[_state.askFriendResult.suggestedAnswer]} ({_state.askFriendResult.confidence})</div>}
          <div className="millionaire-ladder" role="list" aria-label="Prize ladder, 15 level">
            <div className="millionaire-ladder__list">
              {PRIZE_LADDER.slice().reverse().map(function(prize,i){
                var lv = 15 - i;
                var isCurrent = lv===currentLevel;
                var isSafe = SAFE_LEVELS.indexOf(lv)!==-1;
                var isReached = lv <= _state.highestLevel;
                var cls = "millionaire-ladder__item" + (isCurrent ? " millionaire-ladder__item--current" : "") + (isSafe ? " millionaire-ladder__item--safe" : "") + (isReached && !isCurrent ? " millionaire-ladder__item--reached" : "");
                return <div key={lv} role="listitem" aria-current={isCurrent ? "true" : undefined} className={cls}><span className="millionaire-ladder__num">{lv}</span><span className="millionaire-ladder__prize">Rp{prize.toLocaleString("id-ID")}</span><span aria-hidden="true" style={{minWidth:"12px", textAlign:"right"}}>{isCurrent ? "◀" : isReached ? "✓" : ""}</span></div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// U1/U2 note for audit: this engine never writes GameResults 15-col directly; it calls onFinish which via App.finishGame does canSaveGameResult(String(level)) and POST saveGameResult — U2 still CONDITIONALLY BLOCKED until staging test.

