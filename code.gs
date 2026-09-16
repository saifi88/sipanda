var GAMES_SHEET = "Games";
var GAME_RESULTS_SHEET = "GameResults";
var GAME_RESULTS_HEADER = ["waktu", "nisn", "nama", "gameId", "game", "mapel", "tipe", "skor", "benar", "salah", "durasiDetik", "level", "virtualRupiah", "safeRupiah", "extra"];
var GAMES_HEADER = ["id", "type", "mapel", "title", "duration", "isActive", "linkedExamId", "pairs"];
// Bonus-only linking: linkedExamId menghubungkan game latihan ke tugas formal (Soal.id).
// Skema 8 kolom; pembaca tetap kompatibel dengan skema lama 7 kolom (pairs di kolom 7).
// ---------------------------------------------------------------------------
// MILLIONAIRE DATA LAYER — Phase 03 (DATA ONLY, no gameplay)
// U1: applied to BOTH code.gs and code_v2.gs until canonical verified (PHASE_02 U1 BLOCKED)
// U2: GameResults 11→15 implemented backward-compatibly in Phase 10 (code only, not yet deployed)
// ---------------------------------------------------------------------------
var MILLIONAIRE_QUESTIONS_SHEET = "MillionaireQuestions";
var MILLIONAIRE_QUESTIONS_HEADER = ["id","mapel","level","question","optionA","optionB","optionC","optionD","answer","prize","isSafe","explanation"];
var MILLIONAIRE_PRIZE_LADDER = [100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
var MILLIONAIRE_SAFE_LEVELS = [5,10,15];

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e && e.parameter ? e.parameter.action : "";
  
  var queryParams = e && e.parameter ? e.parameter : {};
  var isAdminRoute = ('guru' in queryParams || 'admin' in queryParams);

  if (!action) {
    var template = HtmlService.createTemplateFromFile('index');
    template.isAdminRoute = isAdminRoute;
    return template.evaluate()
      .setTitle('SI-PANDA - SD Negeri 3 Wonorejo')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (action === "getInitData") {
    var settingsSheet = ss.getSheetByName("Pengaturan");
    var settingsObj = { schoolName: "SD Negeri", adminUser: "admin", adminPassHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9" };
    if (settingsSheet) {
      var sData = settingsSheet.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if(sData[i][0]) settingsObj[sData[i][0]] = sData[i][1];
      }
    }
    
    var siswaSheet = ss.getSheetByName("Siswa");
    var siswaList = [];
    if (siswaSheet) {
      var sRows = siswaSheet.getDataRange().getValues();
      siswaList = sRows.slice(1).filter(r => r[0]).map(r => ({ nisn: String(r[0]), name: String(r[1]) }));
    }
    
    var soalSheet = ss.getSheetByName("Soal");
    var examsMap = {};
    if (soalSheet) {
      var qRows = soalSheet.getDataRange().getValues();
      for (var i = 1; i < qRows.length; i++) {
        var row = qRows[i];
        if(!row[0]) continue;
        var exId = String(row[0]);
        if (!examsMap[exId]) {
          examsMap[exId] = {
            id: exId,
            title: String(row[1]),
            duration: Number(row[2]) || 30,
            isActive: String(row[3]).toLowerCase() === 'true',
            questions: []
          };
        }
        examsMap[exId].questions.push({
          id: Number(row[4]),
          text: String(row[5]),
          options: [String(row[6]), String(row[7]), String(row[8]), String(row[9])],
          answer: Number(row[10])
        });
      }
    }
    
    var hasilSheet = ss.getSheetByName("Hasil");
    var resultsList = [];
    if (hasilSheet) {
      var hRows = hasilSheet.getDataRange().getValues();
      resultsList = hRows.slice(1).filter(r => r[0]).map(r => ({
        waktu: r[0],
        nisn: String(r[1]),
        nama: r[2],
        ujian: r[3],
        nilai: r[4],
        catatan: String(r[5] || ""),
        pelanggaran: Number(r[6] || 0)
      }));
    }

    var materiSheet = ss.getSheetByName("Materi");
    var materiList = [];
    if (materiSheet) {
      var mRows = materiSheet.getDataRange().getValues();
      materiList = mRows.slice(1).filter(r => r[1]).map(r => ({
        mapel: String(r[0] || ""),
        judul: String(r[1] || ""),
        pdf: String(r[2] || ""),
        gambar: String(r[3] || ""),
        linkedExamId: String(r[4] || "")
      }));
    }
    
    // Millionaire additive field — does not rename/restructure existing 7 fields
    var millionaireQuestions = [];
    try {
      millionaireQuestions = readMillionaireQuestions_(ss);
    } catch (err) {
      Logger.log("readMillionaireQuestions_ error: " + err);
      millionaireQuestions = [];
    }

    var responseData = {
      settings: settingsObj,
      students: siswaList,
      exams: Object.values(examsMap),
      results: resultsList,
      materi: materiList,
      games: readGames_(ss),
      gameResults: readGameResults_(ss),
      millionaireQuestions: millionaireQuestions
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);
    
    // --- 1. PENILAIAN ESSAI OTOMATIS & PENYIMPANAN HASIL UJIAN ---
    if (data.action === "saveResult") {
      var sheet = ss.getSheetByName("Hasil");
      
      var finalNilai = Number(data.nilai) || 0; 
      var catatanGuruFinal = "";
      
      // Jika ada data jawaban esai dan daftar soal yang dikirimkan siswa
      if (data.jawabanEssay && data.questions) {
        var studentAnswers = JSON.parse(data.jawabanEssay);
        var essayScores = [];
        
        data.questions.forEach(function(q) {
          var opts = q.options;
          var isEssay = false;
          
          if (!opts || !Array.isArray(opts) || opts.length === 0) {
            isEssay = true;
          } else {
            var semuaKosong = opts.every(function(opt) { 
              return opt === undefined || opt === null || opt.toString().trim() === ''; 
            });
            if (semuaKosong) isEssay = true;
          }
          
          if (isEssay) {
            var studentAns = studentAnswers[q.id] || studentAnswers[q.q_id] || "";
            if (studentAns.trim() !== "" && studentAns !== "(Tidak dijawab)") {
              var evaluation = evaluateEssayWithAI(q.text, q.answer, studentAns);
              essayScores.push(Number(evaluation.score) || 0);
            } else {
              essayScores.push(0);
            }
          }
        });
        
        // Gabungkan nilai esai jika ada
        if (essayScores.length > 0) {
          var totalEssayScore = essayScores.reduce(function(a, b) { return a + b; }, 0);
          var avgEssayScore = Math.round(totalEssayScore / essayScores.length);
          
          var jumlahPG = Number(data.pgCount) || 0;
          var nilaiDasarPG = Number(data.nilai) || 0;

          if (jumlahPG > 0) {
            finalNilai = Math.round((nilaiDasarPG + avgEssayScore) / 2);
          } else {
            finalNilai = avgEssayScore; 
          }
        }
      }
      
      // Buat ulasan/komentar menyeluruh yang hangat dari AI berdasarkan nilai akhir
      catatanGuruFinal = generateOverallFeedbackWithAI(data.nama, data.ujian, finalNilai);
      
      if (sheet) {
        sheet.appendRow([
          data.waktu, 
          data.nisn, 
          data.nama, 
          data.ujian, 
          finalNilai,
          catatanGuruFinal, // Catatan bersih & memotivasi untuk siswa
          data.pelanggaran || 0, 
          data.jawabanEssay || ""
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", 
        score: finalNilai, 
        catatan: catatanGuruFinal
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- 2. UPDATE STATUS AKTIF/TIDAK UJIAN ---
    if (data.action === "updateExamStatus") {
      var sheet = ss.getSheetByName("Soal");
      if (sheet) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][0]) === String(data.examId)) sheet.getRange(i + 1, 4).setValue(data.isActive);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 3. UPDATE CATATAN GURU ---
    if (data.action === "updateCatatan") {
      var sheet = ss.getSheetByName("Hasil");
      if (sheet) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) {
          if (String(rows[i][1]) === String(data.nisn) && String(rows[i][3]) === String(data.ujian)) sheet.getRange(i + 1, 6).setValue(data.catatan);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 4. TAMBAH MATERI ---
    if (data.action === "addMateri") {
      var sheet = ss.getSheetByName("Materi");
      if (!sheet) {
        sheet = ss.insertSheet("Materi");
        sheet.appendRow(["mapel", "judul", "pdf", "gambar", "linkedExamId"]);
      } else {
        var headerVal = sheet.getRange(1, 5).getValue();
        if (!headerVal) {
          sheet.getRange(1, 5).setValue("linkedExamId");
        }
      }
      
      var linkedExamId = data.linkedExamId || "";
      sheet.appendRow([data.mapel, data.judul, data.pdf, data.gambar, linkedExamId]);
      
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 5. SIMPAN SOAL BARU KE SHEET SOAL ---
    if (data.action === "saveNewExam") {
      var sheet = ss.getSheetByName("Soal");
      if (sheet && data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(function(q) {
          sheet.appendRow([
            data.id, data.title, data.duration, data.isActive ? "TRUE" : "FALSE",
            q.q_id, q.text, q.options[0] || "", q.options[1] || "", q.options[2] || "", q.options[3] || "", q.answer
          ]);
        });
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 6. GENERATE SOAL AI DARI FOTO MATERI ---
    if (data.action === "generateAIQuestions") {
      var questionsResult = generateQuestionsFromImages(data.files, data.mapel);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        questions: questionsResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 7. SIMPAN HASIL GAME SISWA (BONUS, tidak memengaruhi nilai formal) ---
    // Phase 10: GameResults 11→15 backward-compatible. 11 kolom depan tidak berubah;
    // 4 kolom Millionaire di belakang diisi dari payload bila ada, "" bila tidak ada.
    // Tidak ada migrasi/penulisan ulang historical rows; tidak ada kalkulasi ulang nilai frontend.
    if (data.action === "saveGameResult") {
      var gameSheet = getOrCreateSheet_(ss, GAME_RESULTS_SHEET, GAME_RESULTS_HEADER, ["B"]);
      var levelVal = (data.level === undefined || data.level === null || data.level === "") ? "" : String(data.level);
      var vrVal = (data.virtualRupiah === undefined || data.virtualRupiah === null || data.virtualRupiah === "") ? "" : Number(data.virtualRupiah);
      if (vrVal !== "" && isNaN(vrVal)) vrVal = "";
      var srVal = (data.safeRupiah === undefined || data.safeRupiah === null || data.safeRupiah === "") ? "" : Number(data.safeRupiah);
      if (srVal !== "" && isNaN(srVal)) srVal = "";
      var extraVal = data.extra;
      if (extraVal === undefined || extraVal === null) {
        extraVal = "";
      } else if (typeof extraVal !== "string") {
        try { extraVal = JSON.stringify(extraVal); } catch (e) { extraVal = String(extraVal); }
      }
      gameSheet.appendRow([
        data.waktu || new Date().toLocaleString("id-ID"),
        String(data.nisn || ""),
        String(data.nama || ""),
        String(data.gameId || ""),
        String(data.game || ""),
        String(data.mapel || ""),
        String(data.tipe || "match"),
        Number(data.skor) || 0,
        Number(data.benar) || 0,
        Number(data.salah) || 0,
        Number(data.durasiDetik) || 0,
        levelVal,
        vrVal,
        srVal,
        extraVal
      ]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 8. SIMPAN / UPDATE GAME (dipakai panel Kelola Game) ---
    if (data.action === "saveGame") {
      var gSheet = getOrCreateSheet_(ss, GAMES_SHEET, GAMES_HEADER, ["A", "H"]);
      var gRows = gSheet.getDataRange().getValues();
      var foundRow = -1;
      for (var gi = 1; gi < gRows.length; gi++) {
        if (String(gRows[gi][0]) === String(data.game.id)) { foundRow = gi + 1; break; }
      }
      var gVals = [
        String(data.game.id || ""),
        String(data.game.type || "match"),
        String(data.game.mapel || ""),
        String(data.game.title || ""),
        Number(data.game.duration) || 3,
        data.game.isActive === false ? "FALSE" : "TRUE",
        String(data.game.linkedExamId || ""),
        typeof data.game.pairs === "string" ? data.game.pairs : JSON.stringify(data.game.pairs || [])
      ];
      if (foundRow > 0) {
        gSheet.getRange(foundRow, 1, 1, GAMES_HEADER.length).setValues([gVals]);
      } else {
        gSheet.appendRow(gVals);
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 9. TOGGLE STATUS GAME ---
    if (data.action === "toggleGameStatus") {
      var tSheet = ss.getSheetByName(GAMES_SHEET);
      if (tSheet) {
        var tRows = tSheet.getDataRange().getValues();
        for (var ti = 1; ti < tRows.length; ti++) {
          if (String(tRows[ti][0]) === String(data.gameId)) {
            tSheet.getRange(ti + 1, 6).setValue(data.isActive ? "TRUE" : "FALSE");
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 10. GENERATE PASANGAN GAME DARI MATERI (AI, per level) ---
    if (data.action === "generateGamePairs") {
      var pairsResult = generateGamePairsFromImages(data.files, data.mapel, data.gameType || "match", data.gameLevel || "sedang");
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        pairs: pairsResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 10b. BAGI 1 DAFTAR SOAL KE 3 BANK LEVEL (AI klasifikasi + fallback rata) ---
    if (data.action === "classifyGamePairs") {
      var splitResult = classifyGamePairs_((data.pairs || []), data.mapel);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        banks: splitResult
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------------------------------------------------------------------------
// FUNGSI PENDUKUNG GAME (BONUS-ONLY)
// ---------------------------------------------------------------------------
function getOrCreateSheet_(ss, name, header, textColumns) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    (textColumns || []).forEach(function(col) {
      sheet.getRange(col + ":" + col).setNumberFormat("@");
    });
  }
  return sheet;
}

function readGames_(ss) {
  var sheet = ss.getSheetByName(GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var lastCol = Math.min(sheet.getLastColumn(), GAMES_HEADER.length);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var games = [];
  rows.forEach(function(r) {
    if (!r[0]) return;
    var isActive = String(r[5]).trim().toLowerCase();
    if (isActive === "false" || isActive === "0" || isActive === "tidak") return;
    // Kompatibel skema lama (7 kolom, pairs di indeks 6) & baru (8 kolom, pairs di indeks 7)
    var pairsRaw = r.length >= 8 ? r[7] : r[6];
    var linkedExamId = r.length >= 8 ? String(r[6] || "") : "";
    // pairs: array (format lama, satu bank) ATAU objek {mudah,sedang,sulit}
    // (bank soal berbeda tiap level). Kolom Sheet tetap sama (JSON string).
    var pairs = [];
    try {
      var parsedPairs = JSON.parse(String(pairsRaw || "[]"));
      if (Array.isArray(parsedPairs)) {
        pairs = parsedPairs;
      } else if (parsedPairs && typeof parsedPairs === "object") {
        pairs = {
          mudah: Array.isArray(parsedPairs.mudah) ? parsedPairs.mudah : [],
          sedang: Array.isArray(parsedPairs.sedang) ? parsedPairs.sedang : [],
          sulit: Array.isArray(parsedPairs.sulit) ? parsedPairs.sulit : []
        };
        if (!pairs.mudah.length && !pairs.sedang.length && !pairs.sulit.length) return;
      } else {
        return;
      }
    } catch (err) {
      Logger.log("JSON pairs tidak valid untuk game " + r[0] + ": " + err);
      return;
    }
    if (Array.isArray(pairs) && pairs.length === 0) return;
    games.push({
      id: String(r[0]),
      type: String(r[1] || "match"),
      mapel: String(r[2] || ""),
      title: String(r[3] || ""),
      duration: Number(r[4]) || 3,
      linkedExamId: linkedExamId,
      pairs: pairs
    });
  });
  return games;
}

function readGameResults_(ss) {
  var sheet = ss.getSheetByName(GAME_RESULTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  // Phase 10 backward-compatible: baca hingga 15 kolom bila tersedia,
  // tetapi toleransi baris lama 11 kolom (kolom 12-15 → "").
  // Tidak ada migrasi/penulisan ulang; hanya pembacaan.
  var width = Math.min(Math.max(sheet.getLastColumn(), 11), GAME_RESULTS_HEADER.length);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  return rows.filter(function(r) { return r[1]; }).map(function(r) {
    var lvl = (r.length > 11 && r[11] !== undefined && r[11] !== null && String(r[11]) !== "") ? String(r[11]) : "";
    var vrRaw = (r.length > 12) ? r[12] : "";
    var vr = (vrRaw === undefined || vrRaw === null || vrRaw === "") ? "" : Number(vrRaw);
    if (vr !== "" && isNaN(vr)) vr = "";
    var srRaw = (r.length > 13) ? r[13] : "";
    var sr = (srRaw === undefined || srRaw === null || srRaw === "") ? "" : Number(srRaw);
    if (sr !== "" && isNaN(sr)) sr = "";
    var ex = (r.length > 14 && r[14] !== undefined && r[14] !== null) ? String(r[14]) : "";
    return {
      waktu: String(r[0] || ""),
      nisn: String(r[1]),
      nama: String(r[2] || ""),
      gameId: String(r[3] || ""),
      game: String(r[4] || ""),
      mapel: String(r[5] || ""),
      tipe: String(r[6] || "match"),
      skor: Number(r[7]) || 0,
      benar: Number(r[8]) || 0,
      salah: Number(r[9]) || 0,
      durasiDetik: Number(r[10]) || 0,
      level: lvl,
      virtualRupiah: vr,
      safeRupiah: sr,
      extra: ex
    };
  });
}

// ---------------------------------------------------------------------------
// MILLIONAIRE DATA LAYER — Phase 03 questions reader (read-only for questions)
// Phase 10: GameResults 11→15 write/read implemented backward-compatibly (see saveGameResult, readGameResults_)
// ---------------------------------------------------------------------------
function _millionaireNormalizeBoolean_(v) {
  if (v === true || v === 1 || v === "1") return true;
  if (v === false || v === 0 || v === "0") return false;
  var s = String(v).trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return Boolean(v);
}

function normalizeMillionaireQuestion_(raw) {
  var id = String(raw.id || "").trim();
  var mapel = String(raw.mapel || "").trim();
  var level = Number(raw.level);
  var question = String(raw.question || "").trim();
  var optionA = String(raw.optionA || "").trim();
  var optionB = String(raw.optionB || "").trim();
  var optionC = String(raw.optionC || "").trim();
  var optionD = String(raw.optionD || "").trim();
  var answer = parseInt(raw.answer, 10);
  var prizeRaw = raw.prize;
  var prize = (prizeRaw === "" || prizeRaw === null || prizeRaw === undefined) ? null : Number(prizeRaw);
  var canonicalPrize = (level >= 1 && level <= 15) ? MILLIONAIRE_PRIZE_LADDER[level - 1] : null;
  var prizeNorm = (prize === canonicalPrize) ? prize : canonicalPrize;
  var isSafe = MILLIONAIRE_SAFE_LEVELS.indexOf(level) !== -1;
  var explanation = String(raw.explanation || "").trim();
  return {
    id: id, mapel: mapel, level: level, question: question,
    optionA: optionA, optionB: optionB, optionC: optionC, optionD: optionD,
    options: [optionA, optionB, optionC, optionD],
    answer: answer, prize: prizeNorm, isSafe: isSafe, explanation: explanation,
    _rawPrize: prize, _rawIsSafe: _millionaireNormalizeBoolean_(raw.isSafe)
  };
}

function validateMillionaireQuestion_(q) {
  var errors = [];
  var MAPEL_LIST_CANON = ["Pendidikan Pancasila","Bahasa Indonesia","Matematika","IPAS","Seni Rupa","Bahasa Jawa","Bahasa Inggris","Koding & AI"];
  if (!q.id || !/^[A-Za-z0-9_-]+$/.test(q.id)) errors.push("INVALID_ID");
  if (MAPEL_LIST_CANON.indexOf(q.mapel) === -1) errors.push("INVALID_MAPEL");
  if (!Number.isInteger(q.level) || q.level < 1 || q.level > 15) errors.push("INVALID_LEVEL");
  if (!q.question) errors.push("EMPTY_QUESTION");
  else if (q.question.length > 200) errors.push("QUESTION_TOO_LONG");
  for (var i = 0; i < 4; i++) {
    if (!q.options[i]) errors.push("EMPTY_OPTION_" + i);
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push("INVALID_ANSWER");
  if (q.prize === null || q.prize !== MILLIONAIRE_PRIZE_LADDER[q.level - 1]) errors.push("PRIZE_MISMATCH");
  if (q.explanation && q.explanation.length > 500) errors.push("EXPLANATION_TOO_LONG");
  return { ok: errors.length === 0, errors: errors };
}

function readMillionaireQuestions_(ss) {
  var sheet = ss.getSheetByName(MILLIONAIRE_QUESTIONS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  // Validate header order (12 cols)
  var header = sheet.getRange(1, 1, 1, MILLIONAIRE_QUESTIONS_HEADER.length).getValues()[0].map(function(h){ return String(h).trim(); });
  for (var hi = 0; hi < MILLIONAIRE_QUESTIONS_HEADER.length; hi++) {
    if (header[hi] !== MILLIONAIRE_QUESTIONS_HEADER[hi]) {
      Logger.log("MillionaireQuestions header mismatch col " + (hi+1) + ": expected " + MILLIONAIRE_QUESTIONS_HEADER[hi] + " got " + header[hi]);
    }
  }
  var lastCol = Math.min(sheet.getLastColumn(), MILLIONAIRE_QUESTIONS_HEADER.length);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var out = [];
  var seenId = {};
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var raw = {
      id: row[0], mapel: row[1], level: row[2], question: row[3],
      optionA: row[4], optionB: row[5], optionC: row[6], optionD: row[7],
      answer: row[8], prize: row[9], isSafe: row[10], explanation: row[11]
    };
    if (!raw.id || String(raw.id).trim() === "") {
      Logger.log("Millionaire row " + (r+2) + " skipped: missing id");
      continue;
    }
    var norm = normalizeMillionaireQuestion_(raw);
    if (seenId[norm.id]) {
      Logger.log("Millionaire duplicate id rejected: " + norm.id + " row " + (r+2));
      continue;
    }
    var v = validateMillionaireQuestion_(norm);
    if (!v.ok) {
      if (v.errors.indexOf("PRIZE_MISMATCH") !== -1) {
        // Override already done in normalize, but still log and keep if other errors not present
        var otherErrors = v.errors.filter(function(e){ return e !== "PRIZE_MISMATCH"; });
        if (otherErrors.length > 0) {
          Logger.log("Millionaire row " + (r+2) + " id " + norm.id + " invalid: " + otherErrors.join(","));
          continue;
        }
        Logger.log("Millionaire row " + (r+2) + " id " + norm.id + " prize mismatch overridden to " + norm.prize);
      } else {
        Logger.log("Millionaire row " + (r+2) + " id " + norm.id + " invalid: " + v.errors.join(","));
        continue;
      }
    }
    seenId[norm.id] = true;
    out.push({
      id: norm.id, mapel: norm.mapel, level: norm.level, question: norm.question,
      optionA: norm.optionA, optionB: norm.optionB, optionC: norm.optionC, optionD: norm.optionD,
      answer: norm.answer, prize: norm.prize, isSafe: norm.isSafe, explanation: norm.explanation
    });
  }
  out.sort(function(a,b){
    if (a.mapel < b.mapel) return -1;
    if (a.mapel > b.mapel) return 1;
    if (a.level !== b.level) return a.level - b.level;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  return out;
}

// ---------------------------------------------------------------------------
// MILLIONAIRE SHEET SETUP — Phase 09 (AUTOMATIC QUESTIONS SHEET SETUP)
// Idempotent create-if-missing untuk sheet "MillionaireQuestions".
// - Tidak memasukkan soal demo/fallback ke spreadsheet (FALLBACK hanya di MillionaireQuestions.js).
// - Tidak mengubah GAME_RESULTS_HEADER / gameplay / frontend.
// - Dijalankan manual dari editor Apps Script: setupMillionaireQuestions()
// ---------------------------------------------------------------------------
function validateMillionaireQuestionsHeader_(headerRow) {
  var actual = (headerRow || []).map(function(h) { return String(h === null || h === undefined ? "" : h).trim(); });
  actual = actual.slice(0, MILLIONAIRE_QUESTIONS_HEADER.length);
  while (actual.length < MILLIONAIRE_QUESTIONS_HEADER.length) actual.push("");
  var mismatches = [];
  for (var i = 0; i < MILLIONAIRE_QUESTIONS_HEADER.length; i++) {
    if (actual[i] !== MILLIONAIRE_QUESTIONS_HEADER[i]) {
      mismatches.push({ col: i + 1, expected: MILLIONAIRE_QUESTIONS_HEADER[i], actual: actual[i] });
    }
  }
  return {
    ok: mismatches.length === 0,
    mismatches: mismatches,
    expected: MILLIONAIRE_QUESTIONS_HEADER.slice(),
    actual: actual
  };
}

function setupMillionaireQuestions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("setupMillionaireQuestions gagal: Spreadsheet aktif tidak ditemukan (SpreadsheetApp.getActiveSpreadsheet() == null). Buka file Spreadsheet SI-PANDA lalu jalankan fungsi ini dari editor Apps Script yang terikat (bound).");
  }
  var sheet = ss.getSheetByName(MILLIONAIRE_QUESTIONS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(MILLIONAIRE_QUESTIONS_SHEET);
    sheet.appendRow(MILLIONAIRE_QUESTIONS_HEADER);
    sheet.getRange(1, 1, 1, MILLIONAIRE_QUESTIONS_HEADER.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return { ok: true, sheet: MILLIONAIRE_QUESTIONS_SHEET, created: true, headerValid: true };
  }
  // Sheet sudah ada: jangan buat sheet baru. Jika sheet kosong total, aman tulis header.
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.appendRow(MILLIONAIRE_QUESTIONS_HEADER);
    sheet.getRange(1, 1, 1, MILLIONAIRE_QUESTIONS_HEADER.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return { ok: true, sheet: MILLIONAIRE_QUESTIONS_SHEET, created: false, headerValid: true };
  }
  var headerRow = sheet.getRange(1, 1, 1, MILLIONAIRE_QUESTIONS_HEADER.length).getValues()[0];
  var check = validateMillionaireQuestionsHeader_(headerRow);
  if (!check.ok) {
    var details = check.mismatches.map(function(m) {
      return "kolom " + m.col + ": expected \"" + m.expected + "\" got \"" + m.actual + "\"";
    }).join("; ");
    throw new Error(
      "setupMillionaireQuestions dibatalkan: header sheet \"" + MILLIONAIRE_QUESTIONS_SHEET + "\" tidak sesuai kontrak 12 kolom. " +
      "Mismatch [" + details + "]. " +
      "Expected [" + check.expected.join(",") + "]. " +
      "Actual [" + check.actual.join(",") + "]. " +
      "Data existing TIDAK diubah. Perbaiki header baris 1 secara manual sesuai urutan kontrak, lalu jalankan ulang fungsi ini."
    );
  }
  return { ok: true, sheet: MILLIONAIRE_QUESTIONS_SHEET, created: false, headerValid: true };
}

function setupGameSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var resultsSheet = ss.getSheetByName(GAME_RESULTS_SHEET);
  if (!resultsSheet) {
    getOrCreateSheet_(ss, GAME_RESULTS_SHEET, GAME_RESULTS_HEADER, ["B"]);
  }
  var gamesSheet = ss.getSheetByName(GAMES_SHEET);
  if (gamesSheet) {
    // Migrasi ringan: pastikan header kolom 7 = linkedExamId bila masih skema lama
    try {
      var h = gamesSheet.getRange(1, 1, 1, Math.max(7, gamesSheet.getLastColumn())).getValues()[0];
      if (String(h[6] || "").toLowerCase() !== "linkedexamid" && gamesSheet.getLastColumn() === 7) {
        gamesSheet.insertColumnAfter(6);
        gamesSheet.getRange(1, 7).setValue("linkedExamId");
      }
    } catch (e) {}
    // Jika sheet sudah ada TAPI masih kosong (hanya header), isi contoh game.
    if (gamesSheet.getLastRow() < 2) {
      seedSampleGames();
    }
    return;
  }
  gamesSheet = getOrCreateSheet_(ss, GAMES_SHEET, GAMES_HEADER, ["A", "H"]);
  seedSampleGames();
}

/**
 * Isi contoh game ke sheet Games. Aman dijalankan ulang: hanya menambah
 * ID yang belum ada, tidak menimpa atau menduplikasi data guru.
 * Jalankan manual dari editor Apps Script bila sheet Games masih kosong.
 */
function seedSampleGames() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var gamesSheet = getOrCreateSheet_(ss, GAMES_SHEET, GAMES_HEADER, ["A", "H"]);
  var existingIds = {};
  if (gamesSheet.getLastRow() > 1) {
    var idVals = gamesSheet.getRange(2, 1, gamesSheet.getLastRow() - 1, 1).getValues();
    idVals.forEach(function(r) { if (r[0]) existingIds[String(r[0])] = true; });
  }
  var sample = getSampleGames_();
  var added = 0;
  sample.forEach(function(row) {
    if (!existingIds[String(row[0])]) {
      gamesSheet.appendRow(row);
      added++;
    }
  });
  Logger.log("seedSampleGames: " + added + " contoh game ditambahkan.");
  return added;
}

/** Daftar contoh game (28 games, bank soal berbeda per level: mudah/sedang/sulit). */
function getSampleGames_() {
  return [
    ["match-ipas-01", "match", "IPAS", "Bagian Tumbuhan & Fungsinya", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Akar", right: "Menyerap air dari tanah" },
      { left: "Daun", right: "Tempat fotosintesis" },
      { left: "Bunga", right: "Alat perkembangbiakan" },
      { left: "Buah", right: "Melindungi biji" }
    ], sedang: [
      { left: "Batang", right: "Mengangkut air ke daun" },
      { left: "Klorofil", right: "Zat hijau daun" },
      { left: "Stomata", right: "Lubang pertukaran gas" },
      { left: "Biji", right: "Calon tumbuhan baru" },
      { left: "Kelopak bunga", right: "Menarik serangga" }
    ], sulit: [
      { left: "Hasil fotosintesis", right: "Gula dan oksigen" },
      { left: "Tumbuhan tanpa bunga berkembang biak dengan", right: "Spora" },
      { left: "Akar serabut contohnya pada", right: "Padi dan jagung" },
      { left: "Tumbuhan insektivora contohnya", right: "Kantong semar" },
      { left: "Fungsi rambut akar", right: "Memperluas penyerapan air" }
    ]})],
    ["match-mtk-01", "match", "Matematika", "Perkalian Cepat", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "2 × 7", right: "14" },
      { left: "3 × 4", right: "12" },
      { left: "5 × 5", right: "25" },
      { left: "10 × 6", right: "60" }
    ], sedang: [
      { left: "6 × 7", right: "42" },
      { left: "8 × 9", right: "72" },
      { left: "7 × 8", right: "56" },
      { left: "9 × 9", right: "81" },
      { left: "12 × 4", right: "48" }
    ], sulit: [
      { left: "13 × 6", right: "78" },
      { left: "15 × 7", right: "105" },
      { left: "12 × 12", right: "144" },
      { left: "25 × 8", right: "200" },
      { left: "11 × 14", right: "154" }
    ]})],
    ["match-eng-01", "match", "Bahasa Inggris", "Kosakata Benda Sehari-hari", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "Book", right: "Buku" },
      { left: "Dog", right: "Anjing" },
      { left: "Water", right: "Air" },
      { left: "Chair", right: "Kursi" }
    ], sedang: [
      { left: "Apple", right: "Apel" },
      { left: "Pencil", right: "Pensil" },
      { left: "Bird", right: "Burung" },
      { left: "Fish", right: "Ikan" },
      { left: "Door", right: "Pintu" }
    ], sulit: [
      { left: "Library", right: "Perpustakaan" },
      { left: "Butterfly", right: "Kupu-kupu" },
      { left: "Umbrella", right: "Payung" },
      { left: "Strawberry", right: "Stroberi" },
      { left: "Elephant", right: "Gajah" }
    ]})],
    ["match-jawa-01", "match", "Bahasa Jawa", "Angka dalam Bahasa Jawa", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "Siji", right: "Satu" },
      { left: "Loro", right: "Dua" },
      { left: "Telu", right: "Tiga" },
      { left: "Papat", right: "Empat" }
    ], sedang: [
      { left: "Lima", right: "Lima" },
      { left: "Enem", right: "Enam" },
      { left: "Pitu", right: "Tujuh" },
      { left: "Wolu", right: "Delapan" },
      { left: "Sanga", right: "Sembilan" }
    ], sulit: [
      { left: "Sepuluh", right: "Sepuluh" },
      { left: "Rolas", right: "Dua belas" },
      { left: "Selikur", right: "Dua puluh satu" },
      { left: "Telung puluh", right: "Tiga puluh" },
      { left: "Satus", right: "Seratus" }
    ]})],
    ["match-pancasila-01", "match", "Pendidikan Pancasila", "Sila-Sila Pancasila", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
      { left: "Sila ke-3", right: "Persatuan Indonesia" },
      { left: "Sila ke-5", right: "Keadilan sosial" },
      { left: "Lambang sila ke-1", right: "Bintang" }
    ], sedang: [
      { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
      { left: "Sila ke-4", right: "Kerakyatan yang dipimpin hikmat kebijaksanaan" },
      { left: "Lambang sila ke-2", right: "Rantai" },
      { left: "Lambang sila ke-3", right: "Pohon beringin" },
      { left: "Lambang sila ke-5", right: "Padi dan kapas" }
    ], sulit: [
      { left: "Lambang sila ke-4", right: "Kepala banteng" },
      { left: "Contoh sila ke-2 di sekolah", right: "Menolong teman yang jatuh" },
      { left: "Contoh sila ke-4 di kelas", right: "Musyawarah memilih ketua kelas" },
      { left: "Contoh sila ke-5 di rumah", right: "Berbagi tugas membersihkan rumah" },
      { left: "Dasar negara Indonesia", right: "Pancasila" }
    ]})],
    ["memory-ipas-01", "memory", "IPAS", "Memori: Planet Tata Surya", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Bumi", right: "Tempat tinggal kita" },
      { left: "Mars", right: "Planet merah" },
      { left: "Saturnus", right: "Planet bercincin" },
      { left: "Bulan", right: "Satelit Bumi" }
    ], sedang: [
      { left: "Merkurius", right: "Terdekat Matahari" },
      { left: "Venus", right: "Planet terpanas" },
      { left: "Jupiter", right: "Planet terbesar" },
      { left: "Neptunus", right: "Terjauh dari Matahari" },
      { left: "Uranus", right: "Berputar miring" }
    ], sulit: [
      { left: "Revolusi Bumi", right: "365 hari" },
      { left: "Rotasi Bumi", right: "24 jam" },
      { left: "Planet kerdil", right: "Pluto" },
      { left: "Sabuk asteroid", right: "Antara Mars dan Jupiter" },
      { left: "Satelit Jupiter terbesar", right: "Ganymede" }
    ]})],
    ["memory-eng-01", "memory", "Bahasa Inggris", "Memori: Warna & Animals", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "Red", right: "Merah" },
      { left: "Blue", right: "Biru" },
      { left: "Cat", right: "Kucing" },
      { left: "Fish", right: "Ikan" }
    ], sedang: [
      { left: "Green", right: "Hijau" },
      { left: "Yellow", right: "Kuning" },
      { left: "Bird", right: "Burung" },
      { left: "Dog", right: "Anjing" },
      { left: "Duck", right: "Bebek" }
    ], sulit: [
      { left: "Purple", right: "Ungu" },
      { left: "Orange", right: "Oranye" },
      { left: "Butterfly", right: "Kupu-kupu" },
      { left: "Rabbit", right: "Kelinci" },
      { left: "Turtle", right: "Kura-kura" }
    ]})],
    ["quizrush-mtk-01", "quizrush", "Matematika", "Kuis Cepat: Penjumlahan", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "5 + 7 = ...", right: "12" },
      { left: "9 + 6 = ...", right: "15" },
      { left: "10 + 10 = ...", right: "20" },
      { left: "8 + 5 = ...", right: "13" }
    ], sedang: [
      { left: "27 + 15 = ...", right: "42" },
      { left: "36 + 28 = ...", right: "64" },
      { left: "59 + 34 = ...", right: "93" },
      { left: "125 + 75 = ...", right: "200" },
      { left: "348 + 152 = ...", right: "500" }
    ], sulit: [
      { left: "1.250 + 3.750 = ...", right: "5.000" },
      { left: "2/4 + 1/4 = ...", right: "3/4" },
      { left: "0,5 + 0,75 = ...", right: "1,25" },
      { left: "999 + 1.001 = ...", right: "2.000" },
      { left: "45 + 55 + 100 = ...", right: "200" }
    ]})],
    ["quizrush-ipas-01", "quizrush", "IPAS", "Kuis Cepat: Tubuh Manusia", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "Organ untuk memompa darah?", right: "Jantung" },
      { left: "Organ untuk bernapas?", right: "Paru-paru" },
      { left: "Indra penglihat?", right: "Mata" },
      { left: "Penopang tubuh?", right: "Tulang" }
    ], sedang: [
      { left: "Tulang melindungi otak?", right: "Tengkorak" },
      { left: "Makanan dicerna pertama di?", right: "Mulut" },
      { left: "Indra pendengar?", right: "Telinga" },
      { left: "Otot menempel pada?", right: "Tulang" },
      { left: "Darah dipompa ke seluruh tubuh oleh?", right: "Jantung" }
    ], sulit: [
      { left: "Tempat penyerapan sari makanan?", right: "Usus halus" },
      { left: "Sel darah merah dibuat di?", right: "Sumsum tulang" },
      { left: "Organ penyaring darah?", right: "Ginjal" },
      { left: "Bagian otak pengatur keseimbangan?", right: "Otak kecil" },
      { left: "Vitamin untuk tulang?", right: "Vitamin D" }
    ]})],
    ["balloon-mtk-01", "balloon", "Matematika", "Balon Meletus: Perkalian", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "2 × 5 = ...", right: "10" },
      { left: "3 × 3 = ...", right: "9" },
      { left: "4 × 4 = ...", right: "16" },
      { left: "5 × 6 = ...", right: "30" }
    ], sedang: [
      { left: "4 × 5 = ...", right: "20" },
      { left: "3 × 9 = ...", right: "27" },
      { left: "6 × 6 = ...", right: "36" },
      { left: "8 × 7 = ...", right: "56" },
      { left: "7 × 4 = ...", right: "28" }
    ], sulit: [
      { left: "12 × 7 = ...", right: "84" },
      { left: "15 × 6 = ...", right: "90" },
      { left: "13 × 8 = ...", right: "104" },
      { left: "25 × 6 = ...", right: "150" },
      { left: "14 × 9 = ...", right: "126" }
    ]})],
    ["scramble-eng-01", "scramble", "Bahasa Inggris", "Acak Kata: Benda Sekitar", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Hewan yang menggonggong? 🐶", right: "DOG" },
      { left: "Hewan yang mengeong? 🐱", right: "CAT" },
      { left: "Benda untuk dibaca? 📖", right: "BOOK" },
      { left: "Buah berwarna merah? 🍎", right: "APPLE" }
    ], sedang: [
      { left: "Benda untuk menulis? ✏️", right: "PENCIL" },
      { left: "Benda untuk duduk? 🪑", right: "CHAIR" },
      { left: "Minuman paling sehat? 💧", right: "WATER" },
      { left: "Hewan yang bisa terbang? 🐦", right: "BIRD" },
      { left: "Benda pembuka pintu? 🚪", right: "DOOR" }
    ], sulit: [
      { left: "Tempat meminjam buku? 📚", right: "LIBRARY" },
      { left: "Benda pelindung dari hujan? ☂️", right: "UMBRELLA" },
      { left: "Hewan berbelalai? 🐘", right: "ELEPHANT" },
      { left: "Serangga bersayap indah? 🦋", right: "BUTTERFLY" },
      { left: "Benda untuk melihat waktu? ⌚", right: "WATCH" }
    ]})],
    ["snake-ipas-01", "snake", "IPAS", "Ular Tangga: Tata Surya", 5, "TRUE", "", JSON.stringify({mudah: [
      { left: "Planet tempat tinggal kita?", right: "Bumi" },
      { left: "Planet merah?", right: "Mars" },
      { left: "Satelit alami Bumi?", right: "Bulan" },
      { left: "Bintang terdekat Bumi?", right: "Matahari" }
    ], sedang: [
      { left: "Planet terdekat Matahari?", right: "Merkurius" },
      { left: "Planet terbesar?", right: "Jupiter" },
      { left: "Planet bercincin?", right: "Saturnus" },
      { left: "Planet terpanas?", right: "Venus" },
      { left: "Planet terjauh?", right: "Neptunus" }
    ], sulit: [
      { left: "Waktu revolusi Bumi?", right: "365 hari" },
      { left: "Planet kerdil?", right: "Pluto" },
      { left: "Satelit terbesar Jupiter?", right: "Ganymede" },
      { left: "Planet yang berputar miring?", right: "Uranus" },
      { left: "Sabuk asteroid terletak di antara?", right: "Mars dan Jupiter" }
    ]})],
    ["truefalse-ppkn-01", "truefalse", "Pendidikan Pancasila", "Benar atau Salah: Pancasila", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "Sila ke-1", right: "Ketuhanan Yang Maha Esa" },
      { left: "Sila ke-3", right: "Persatuan Indonesia" },
      { left: "Lambang sila ke-1", right: "Bintang" },
      { left: "Dasar negara kita", right: "Pancasila" }
    ], sedang: [
      { left: "Sila ke-2", right: "Kemanusiaan yang adil dan beradab" },
      { left: "Lambang sila ke-2", right: "Rantai" },
      { left: "Lambang sila ke-3", right: "Pohon beringin" },
      { left: "Lambang sila ke-5", right: "Padi dan kapas" },
      { left: "Sila ke-5", right: "Keadilan sosial bagi seluruh rakyat Indonesia" }
    ], sulit: [
      { left: "Lambang sila ke-4", right: "Kepala banteng" },
      { left: "Sila ke-4", right: "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan" },
      { left: "Pengamalan sila ke-2", right: "Menolong teman tanpa membedakan" },
      { left: "Pengamalan sila ke-4", right: "Musyawarah mufakat" },
      { left: "Jumlah sila Pancasila", right: "Lima" }
    ]})],
    ["hangman-eng-01", "hangman", "Bahasa Inggris", "Tebak Kata: Animals", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Hewan yang menggonggong 🐶", right: "DOG" },
      { left: "Hewan yang mengeong 🐱", right: "CAT" },
      { left: "Hewan yang berenang 🐟", right: "FISH" },
      { left: "Buah berwarna merah 🍎", right: "APPLE" }
    ], sedang: [
      { left: "Hewan yang bisa terbang 🐦", right: "BIRD" },
      { left: "Benda untuk dibaca 📖", right: "BOOK" },
      { left: "Hewan berleher panjang 🦒", right: "GIRAFFE" },
      { left: "Hewan melompat berkantung 🦘", right: "KANGAROO" },
      { left: "Serangga penghasil madu 🐝", right: "BEE" }
    ], sulit: [
      { left: "Hewan berbelalai 🐘", right: "ELEPHANT" },
      { left: "Hewan tercepat di darat 🐆", right: "CHEETAH" },
      { left: "Reptil berganti kulit 🐍", right: "SNAKE" },
      { left: "Hewan malam bermata besar 🦉", right: "OWL" },
      { left: "Ikan bergigi tajam 🦈", right: "SHARK" }
    ]})],
    ["boss-mtk-01", "boss", "Matematika", "Boss Battle: Perkalian Sakti", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "2 × 8 = ...", right: "16" },
      { left: "3 × 5 = ...", right: "15" },
      { left: "4 × 4 = ...", right: "16" },
      { left: "5 × 7 = ...", right: "35" }
    ], sedang: [
      { left: "7 × 8 = ...", right: "56" },
      { left: "9 × 7 = ...", right: "63" },
      { left: "8 × 8 = ...", right: "64" },
      { left: "6 × 7 = ...", right: "42" },
      { left: "5 × 8 = ...", right: "40" }
    ], sulit: [
      { left: "12 × 8 = ...", right: "96" },
      { left: "15 × 7 = ...", right: "105" },
      { left: "16 × 6 = ...", right: "96" },
      { left: "25 × 8 = ...", right: "200" },
      { left: "11 × 13 = ...", right: "143" }
    ]})],
    ["sort-ipas-01", "sort", "IPAS", "Sortir: Golongan Hewan", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Sapi", right: "Herbivora" },
      { left: "Kambing", right: "Herbivora" },
      { left: "Harimau", right: "Karnivora" },
      { left: "Singa", right: "Karnivora" }
    ], sedang: [
      { left: "Kelinci", right: "Herbivora" },
      { left: "Buaya", right: "Karnivora" },
      { left: "Ayam", right: "Omnivora" },
      { left: "Bebek", right: "Omnivora" },
      { left: "Beruang", right: "Omnivora" },
      { left: "Gajah", right: "Herbivora" }
    ], sulit: [
      { left: "Paus", right: "Mamalia" },
      { left: "Kelelawar", right: "Mamalia" },
      { left: "Elang", right: "Burung" },
      { left: "Kadal", right: "Reptil" },
      { left: "Katak", right: "Amfibi" },
      { left: "Hiu", right: "Ikan" }
    ]})],
    ["fillblank-indo-01", "fillblank", "Bahasa Indonesia", "Isian: Kata Baku & Imbuhan", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Lawan kata 'rajin' adalah ___", right: "malas" },
      { left: "Sinonim kata 'bahagia' adalah ___", right: "senang" },
      { left: "Kami ___ (main) bola di lapangan", right: "bermain" },
      { left: "Burung ___ (terbang) di langit", right: "terbang" }
    ], sedang: [
      { left: "Penulisan yang baku: ___ (apotik)", right: "apotek" },
      { left: "Ibu ___ (sapu) halaman setiap pagi", right: "menyapu" },
      { left: "Tulis nama dengan huruf kapital: ___ (budi santoso)", right: "Budi Santoso" },
      { left: "Ayah ___ (baca) koran pagi ini", right: "membaca" },
      { left: "Anak itu ___ (tulis) surat untuk gurunya", right: "menulis" }
    ], sulit: [
      { left: "Bentuk baku 'photo' adalah ___", right: "foto" },
      { left: "Imbuhan yang tepat: ___ (sedia) payung sebelum hujan", right: "menyediakan" },
      { left: "Kata ulang: anak-anak ___ (lari) di taman", right: "berlari-lari" },
      { left: "Penggunaan tanda baca: Hari Senin ___ Selasa libur", right: "koma" },
      { left: "Antonim kata 'abstrak' adalah ___", right: "konkret" }
    ]})],
    ["race-mtk-01", "race", "Matematika", "Balapan: Pengurangan Kilat", 2, "TRUE", "", JSON.stringify({mudah: [
      { left: "10 − 4 = ...", right: "6" },
      { left: "15 − 7 = ...", right: "8" },
      { left: "20 − 10 = ...", right: "10" },
      { left: "12 − 5 = ...", right: "7" }
    ], sedang: [
      { left: "20 − 9 = ...", right: "11" },
      { left: "30 − 12 = ...", right: "18" },
      { left: "25 − 8 = ...", right: "17" },
      { left: "40 − 15 = ...", right: "25" },
      { left: "50 − 23 = ...", right: "27" }
    ], sulit: [
      { left: "100 − 47 = ...", right: "53" },
      { left: "250 − 135 = ...", right: "115" },
      { left: "1.000 − 625 = ...", right: "375" },
      { left: "3/4 − 1/4 = ...", right: "2/4" },
      { left: "5,5 − 2,75 = ...", right: "2,75" }
    ]})],
    ["tower-mtk-01", "tower", "Matematika", "Menara Logika: Pola Bilangan", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "2, 4, 6, 8, ... (berikutnya?)", right: "10" },
      { left: "5, 10, 15, 20, ... (berikutnya?)", right: "25" },
      { left: "10 + 5 × 2 = ...", right: "20" },
      { left: "20 − 4 × 3 = ...", right: "8" }
    ], sedang: [
      { left: "2, 4, 8, 16, ... (berikutnya?)", right: "32" },
      { left: "3, 6, 12, 24, ... (berikutnya?)", right: "48" },
      { left: "1, 4, 9, 16, ... (berikutnya?)", right: "25" },
      { left: "81 : 9 + 6 × 2 = ...", right: "21" },
      { left: "(12 + 8) : 4 × 3 = ...", right: "15" }
    ], sulit: [
      { left: "1, 1, 2, 3, 5, 8, ... (berikutnya?)", right: "13" },
      { left: "2, 6, 12, 20, 30, ... (berikutnya?)", right: "42" },
      { left: "100 : (2 + 3) × 4 − 50 = ...", right: "30" },
      { left: "FPB dari 24 dan 36?", right: "12" },
      { left: "KPK dari 6 dan 8?", right: "24" }
    ]})],
    ["tower-ipas-01", "tower", "IPAS", "Menara Logika: Rantai Makanan", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Padi dimakan belalang, belalang dimakan ...", right: "Katak" },
      { left: "Katak dimakan ...", right: "Ular" },
      { left: "Hewan pemakan tumbuhan disebut ...", right: "Herbivora" },
      { left: "Hewan pemakan daging disebut ...", right: "Karnivora" }
    ], sedang: [
      { left: "Tumbuhan yang membuat makanan sendiri disebut ...", right: "Produsen" },
      { left: "Hewan pemakan tumbuhan dan hewan disebut ...", right: "Omnivora" },
      { left: "Pengurai sisa makhluk hidup contohnya ...", right: "Jamur" },
      { left: "Energi terbesar rantai makanan berasal dari ...", right: "Matahari" },
      { left: "Elang berperan sebagai ...", right: "Konsumen puncak" }
    ], sulit: [
      { left: "Jika katak punah, populasi belalang akan ...", right: "Bertambah" },
      { left: "Jika ular punah, populasi katak akan ...", right: "Bertambah" },
      { left: "Daur yang mengembalikan unsur hara ke tanah?", right: "Penguraian" },
      { left: "Simbiosis jamur dan alga (lichen) disebut ...", right: "Mutualisme" },
      { left: "Jaring-jaring makanan lebih ... dibanding rantai makanan", right: "Kompleks" }
    ]})],
    ["sequence-indo-01", "sequence", "Bahasa Indonesia", "Susun Kalimat: Fakta Seru", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Susun: kalimat tentang air", right: "Air mengalir ke laut" },
      { left: "Susun: kalimat tentang kucing", right: "Kucing minum susu pagi" },
      { left: "Susun: kalimat tentang sekolah", right: "Aku pergi ke sekolah" },
      { left: "Susun: kalimat tentang bunga", right: "Bunga mekar di pagi" }
    ], sedang: [
      { left: "Susun: kalimat tentang fotosintesis", right: "Daun membuat makanan saat ada cahaya" },
      { left: "Susun: kalimat tentang kupu-kupu", right: "Kupu kupu berasal dari kepompong yang indah" },
      { left: "Susun: kalimat tentang gotong royong", right: "Warga membersihkan lingkungan setiap hari Minggu" },
      { left: "Susun: kalimat tentang Pancasila", right: "Persatuan Indonesia adalah sila ketiga Pancasila" },
      { left: "Susun: kalimat tentang hujan", right: "Hujan turun membasahi sawah yang kering" }
    ], sulit: [
      { left: "Susun: kalimat tentang daur air", right: "Air menguap dari laut lalu turun sebagai hujan" },
      { left: "Susun: kalimat tentang pahlawan", right: "Pahlawan berjuang dengan gagah berani demi bangsa" },
      { left: "Susun: kalimat tentang perpustakaan", right: "Siswa membaca buku cerita dengan tertib di perpustakaan" },
      { left: "Susun: kalimat tentang kesehatan", right: "Olahraga teratur membuat tubuh sehat dan kuat" },
      { left: "Susun: kalimat tentang petani", right: "Petani menanam padi dengan tekun sejak pagi hari" }
    ]})],
    ["sequence-eng-01", "sequence", "Bahasa Inggris", "Arrange Words: Daily Sentences", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Arrange: greeting", right: "Good morning teacher" },
      { left: "Arrange: about cat", right: "The cat drinks milk" },
      { left: "Arrange: about book", right: "I read a book" },
      { left: "Arrange: about ball", right: "Kick the ball now" }
    ], sedang: [
      { left: "Arrange: about cat", right: "The cat drinks milk every morning" },
      { left: "Arrange: about school", right: "I go to school by bicycle" },
      { left: "Arrange: about bird", right: "The bird flies high in the sky" },
      { left: "Arrange: about mother", right: "My mother cooks delicious fried rice" }
    ], sulit: [
      { left: "Arrange: about library", right: "The students borrow interesting books from the library" },
      { left: "Arrange: about holiday", right: "We visited beautiful beaches during school holiday" },
      { left: "Arrange: about farmer", right: "The diligent farmer plants rice in the green field" },
      { left: "Arrange: about rain", right: "Heavy rain falls on the dry rice fields today" }
    ]})],
    ["maze-ipas-01", "maze", "IPAS", "Labirin Harta: Tata Surya", 4, "TRUE", "", JSON.stringify({mudah: [
      { left: "Planet tempat tinggal kita?", right: "Bumi" },
      { left: "Planet merah?", right: "Mars" },
      { left: "Satelit alami Bumi?", right: "Bulan" },
      { left: "Planet bercincin?", right: "Saturnus" }
    ], sedang: [
      { left: "Planet terdekat Matahari?", right: "Merkurius" },
      { left: "Planet terbesar?", right: "Jupiter" },
      { left: "Planet terpanas?", right: "Venus" },
      { left: "Planet terjauh?", right: "Neptunus" },
      { left: "Planet berputar miring?", right: "Uranus" }
    ], sulit: [
      { left: "Waktu satu revolusi Bumi?", right: "365 hari" },
      { left: "Planet kerdil?", right: "Pluto" },
      { left: "Satelit terbesar Jupiter?", right: "Ganymede" },
      { left: "Sabuk asteroid ada di antara?", right: "Mars dan Jupiter" },
      { left: "Satelit alami Mars?", right: "Phobos" }
    ]})],
    ["maze-mtk-01", "maze", "Matematika", "Labirin Harta: Operasi Hitung", 4, "TRUE", "", JSON.stringify({mudah: [
      { left: "7 + 8 = ...", right: "15" },
      { left: "20 − 9 = ...", right: "11" },
      { left: "3 × 4 = ...", right: "12" },
      { left: "20 : 4 = ...", right: "5" }
    ], sedang: [
      { left: "12 × 8 = ...", right: "96" },
      { left: "100 : 4 = ...", right: "25" },
      { left: "7 × 9 − 13 = ...", right: "50" },
      { left: "Keliling persegi sisi 9 cm?", right: "36 cm" },
      { left: "1/2 + 1/4 = ...", right: "3/4" }
    ], sulit: [
      { left: "FPB dari 12 dan 18?", right: "6" },
      { left: "KPK dari 4 dan 6?", right: "12" },
      { left: "Volume kubus sisi 5 cm?", right: "125 cm3" },
      { left: "15% dari 200?", right: "30" },
      { left: "(48 : 6) + (7 × 5) = ...", right: "43" }
    ]})],
    ["defense-indo-01", "defense", "Bahasa Indonesia", "Invasi Robot: Kata Baku", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Lawan kata 'rajin'?", right: "malas" },
      { left: "Sinonim 'bahagia'?", right: "senang" },
      { left: "Awal kalimat memakai huruf ...", right: "kapital" },
      { left: "Akhir kalimat berita memakai tanda ...", right: "titik" }
    ], sedang: [
      { left: "Bentuk baku dari 'apotik'?", right: "apotek" },
      { left: "Bentuk baku dari 'photo'?", right: "foto" },
      { left: "Bentuk baku dari 'ijin'?", right: "izin" },
      { left: "Bentuk baku dari 'karir'?", right: "karier" },
      { left: "Bentuk baku dari 'aktifitas'?", right: "aktivitas" }
    ], sulit: [
      { left: "Bentuk baku dari 'cidera'?", right: "cedera" },
      { left: "Bentuk baku dari 'resiko'?", right: "risiko" },
      { left: "Imbuhan 'me- + sapu' menjadi ...", right: "menyapu" },
      { left: "Imbuhan 'me- + tulis' menjadi ...", right: "menulis" },
      { left: "Kata ulang dari 'anak'?", right: "anak-anak" }
    ]})],
    ["defense-mtk-01", "defense", "Matematika", "Invasi Robot: Perkalian Kilat", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "2 × 9 = ...", right: "18" },
      { left: "3 × 6 = ...", right: "18" },
      { left: "4 × 5 = ...", right: "20" },
      { left: "10 × 10 = ...", right: "100" }
    ], sedang: [
      { left: "8 × 7 = ...", right: "56" },
      { left: "9 × 6 = ...", right: "54" },
      { left: "12 × 6 = ...", right: "72" },
      { left: "15 × 4 = ...", right: "60" },
      { left: "11 × 11 = ...", right: "121" }
    ], sulit: [
      { left: "13 × 7 = ...", right: "91" },
      { left: "16 × 5 = ...", right: "80" },
      { left: "12 × 12 = ...", right: "144" },
      { left: "25 × 12 = ...", right: "300" },
      { left: "99 × 9 = ...", right: "891" }
    ]})],
    ["feed-mtk-01", "feed", "Matematika", "Mochi Lapar: Berhitung", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "5 + 8 = ...", right: "13" },
      { left: "12 − 5 = ...", right: "7" },
      { left: "3 × 4 = ...", right: "12" },
      { left: "20 : 5 = ...", right: "4" }
    ], sedang: [
      { left: "25 + 37 = ...", right: "62" },
      { left: "50 − 18 = ...", right: "32" },
      { left: "7 × 8 = ...", right: "56" },
      { left: "72 : 8 = ...", right: "9" },
      { left: "100 − 45 + 5 = ...", right: "60" }
    ], sulit: [
      { left: "125 + 375 = ...", right: "500" },
      { left: "12 × 12 = ...", right: "144" },
      { left: "3/5 + 1/5 = ...", right: "4/5" },
      { left: "(20 + 30) : 5 = ...", right: "10" },
      { left: "10% dari 150?", right: "15" }
    ]})],
    ["feed-indo-01", "feed", "Bahasa Indonesia", "Mochi Lapar: Kata Seru", 3, "TRUE", "", JSON.stringify({mudah: [
      { left: "Lawan kata 'besar'?", right: "kecil" },
      { left: "Sinonim 'senang'?", right: "gembira" },
      { left: "Hewan bersuara 'meong'?", right: "kucing" },
      { left: "Warna bendera Indonesia?", right: "merah putih" }
    ], sedang: [
      { left: "Bentuk baku 'apotik'?", right: "apotek" },
      { left: "Sinonim 'pintar'?", right: "cerdas" },
      { left: "Antonim 'jujur'?", right: "bohong" },
      { left: "Awal kalimat memakai huruf ...", right: "kapital" },
      { left: "Penutup surat untuk guru?", right: "hormat saya" }
    ], sulit: [
      { left: "Imbuhan 'me- + masak'?", right: "memasak" },
      { left: "Bentuk baku 'resiko'?", right: "risiko" },
      { left: "Makna 'buah tangan'?", right: "oleh-oleh" },
      { left: "Lawan kata 'abstrak'?", right: "konkret" },
      { left: "Kalimat ajakan memakai tanda ...", right: "seru" }
    ]})]
  ];
}
/**
 * Instruksi format soal per tipe game (agar AI menghasilkan bank soal yang
 * akurat & ringkas seperti soal latihan konvensional, bukan kalimat panjang).
 */
function gameTypeFormatInstr_(type) {
  var t = String(type || "match").toLowerCase();
  if (t === "scramble" || t === "hangman") {
    return "right WAJIB satu kata tanpa spasi (huruf A-Z, 3-12 huruf, tanpa angka/simbol), " +
      "left = petunjuk singkat maks 10 kata (boleh tambah 1 emoji).";
  }
  if (t === "sort") {
    return "right = label KATEGORI singkat (1-2 kata, dipakai berulang untuk beberapa benda), " +
      "left = nama benda/contoh (1-3 kata). Buat 3-4 kategori, tiap kategori 2-3 benda.";
  }
  if (t === "fillblank") {
    return "left = SATU kalimat rumpang berisi tepat satu '___' (maks 15 kata), " +
      "right = jawaban tepat (1-3 kata).";
  }
  if (t === "sequence") {
    return "left = perintah singkat maks 8 kata (contoh: 'Susun: kalimat tentang air'), " +
      "right = kalimat BENAR yang utuh, 4-9 kata (kata-katanya akan diacak oleh game).";
  }
  return "left = pertanyaan/istilah singkat (maks 12 kata), " +
    "right = jawaban singkat dan pasti (maks 5 kata). Hindari kalimat bertele-tele.";
}

function countWords_(s) {
  var t = String(s || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/**
 * Filter & validasi hasil AI: buang yang kosong/duplikat/kepanjangan/tak sesuai
 * format tipe. Gagal (< 4 soal layak) → lempar error agar guru generate ulang.
 */
function sanitizeGamePairs_(arr, type) {
  var t = String(type || "match").toLowerCase();
  if (!Array.isArray(arr)) throw new Error("Format AI tidak valid, coba generate ulang.");
  var seenLeft = {};
  var seenRight = {};
  var out = [];
  arr.forEach(function(p) {
    if (!p) return;
    var left = String(p.left || "").replace(/\s+/g, " ").trim();
    var right = String(p.right || "").replace(/\s+/g, " ").trim();
    if (!left || !right) return;
    if (left.toLowerCase() === right.toLowerCase()) return;
    var lk = left.toLowerCase();
    if (seenLeft[lk]) return;
    if (t === "scramble" || t === "hangman") {
      var w = right.toUpperCase();
      if (!/^[A-Z]{3,12}$/.test(w)) return;
      right = w;
    } else if (t === "sort") {
      if (countWords_(right) > 3 || countWords_(left) > 4) return;
    } else if (t === "fillblank") {
      if (left.indexOf("___") < 0 || countWords_(left) > 18 || countWords_(right) > 4) return;
    } else if (t === "sequence") {
      var wc = countWords_(right);
      if (wc < 3 || wc > 12 || countWords_(left) > 10) return;
    } else {
      if (countWords_(left) > 12 || countWords_(right) > 5) return;
      var rk = right.toLowerCase();
      if (seenRight[rk]) return; // jawaban pengecoh harus unik
      seenRight[rk] = true;
    }
    seenLeft[lk] = true;
    out.push({ left: left, right: right });
  });
  out = out.slice(0, 8);
  if (out.length < 4) throw new Error("AI menghasilkan kurang dari 4 soal yang layak, coba generate ulang.");
  return out;
}

/**
 * Bagi satu daftar soal ke 3 bank level (mudah/sedang/sulit) memakai AI.
 * Input: array [{left,right}]. Output: {mudah:[...], sedang:[...], sulit:[...]}.
 * Tanpa API key / AI gagal → fallback bagi rata berurutan (seimbang).
 */
function classifyGamePairs_(pairs, mapel) {
  var seen = {};
  var clean = (Array.isArray(pairs) ? pairs : []).map(function(p) {
    return {
      left: String((p || {}).left || "").replace(/\s+/g, " ").trim(),
      right: String((p || {}).right || "").replace(/\s+/g, " ").trim()
    };
  }).filter(function(p) {
    if (!p.left || !p.right || p.left.toLowerCase() === p.right.toLowerCase()) return false;
    var k = p.left.toLowerCase() + "||" + p.right.toLowerCase();
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
  if (clean.length < 3) throw new Error("Minimal 3 soal untuk dibagi ke 3 level.");
  var fallback = function() {
    var n = Math.ceil(clean.length / 3);
    return { mudah: clean.slice(0, n), sedang: clean.slice(n, n * 2), sulit: clean.slice(n * 2) };
  };
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) return fallback();
  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
    var lines = clean.map(function(p, i) { return (i + 1) + ". " + p.left + " => " + p.right; }).join("\n");
    var prompt = "Anda guru SD kelas 6 (Kurikulum Merdeka Fase C, mapel " + (mapel || "Umum") + "). " +
      "Klasifikasikan tiap soal bernomor berikut ke TEPAT SATU level: mudah (ingatan dasar/fakta), " +
      "sedang (pemahaman/penerapan), sulit (HOTS/analisis/multi-langkah). Bagi SEIMBANG: tiap level terisi, " +
      "selisih jumlah antar level maksimal 2. Jawab HANYA JSON valid memakai nomor soal (mulai dari 1): " +
      "{\"mudah\": [...], \"sedang\": [...], \"sulit\": [...]}.\n\n" + lines;
    var payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
    var response = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true });
    var jr = JSON.parse(response.getContentText());
    if (jr.error) return fallback();
    var cls = JSON.parse(jr.candidates[0].content.parts[0].text);
    var pick = function(arr) {
      var out = [];
      (Array.isArray(arr) ? arr : []).forEach(function(n) {
        var i = Number(n) - 1;
        if (i >= 0 && i < clean.length && out.indexOf(clean[i]) < 0) out.push(clean[i]);
      });
      return out;
    };
    var res = { mudah: pick(cls.mudah), sedang: pick(cls.sedang), sulit: pick(cls.sulit) };
    var used = {};
    [res.mudah, res.sedang, res.sulit].forEach(function(a) { a.forEach(function(p) { used[clean.indexOf(p)] = true; }); });
    var rest = clean.filter(function(_, i) { return !used[i]; });
    ["mudah", "sedang", "sulit"].forEach(function(k) { if (res[k].length === 0 && rest.length) res[k].push(rest.shift()); });
    while (rest.length) {
      var target = res.mudah.length <= res.sedang.length
        ? (res.mudah.length <= res.sulit.length ? "mudah" : "sulit")
        : (res.sedang.length <= res.sulit.length ? "sedang" : "sulit");
      res[target].push(rest.shift());
    }
    return res;
  } catch (err) { return fallback(); }
}

function generateGamePairsFromImages(fileDataArray, mataPelajaran, gameType, gameLevel) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY belum disetel.");
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  var level = String(gameLevel || "sedang").toLowerCase();
  var levelInstr = "pemahaman dan penerapan konsep (soal penerapan setara latihan konvensional, bukan sekadar hafalan)";
  if (level === "mudah") levelInstr = "ingatan dasar (istilah, fakta, dan hafalan sederhana seperti kuis buku paket)";
  if (level === "sulit") levelInstr = "HOTS setara soal olimpiade mini: analisis, pola, dan soal multi-langkah yang menantang";
  var contentsParts = [{
    text: "Anda adalah guru SD kelas 6 penyusun soal Kurikulum Merdeka (Fase C). " +
      "Dari materi " + (mataPelajaran || "Umum") + " ini buatkan 6-8 pasangan soal untuk game edukasi " +
      "LEVEL " + level + " dengan fokus " + levelInstr + ". " +
      "ATURAN FORMAT (wajib dipatuhi): " + gameTypeFormatInstr_(gameType) + " " +
      "Soal harus akurat, singkat seperti soal latihan di buku paket, dan jawabannya pasti/tunggal. " +
      "Hasil HANYA JSON valid array: [{\"left\": \"...\", \"right\": \"...\"}]"
  }];
  if (fileDataArray && Array.isArray(fileDataArray)) {
    fileDataArray.forEach(function(file) {
      contentsParts.push({ inline_data: { mime_type: file.mimeType, data: file.base64 } });
    });
  }
  var payload = { contents: [{ parts: contentsParts }], generationConfig: { responseMimeType: "application/json" } };
  var response = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true });
  var jsonResponse = JSON.parse(response.getContentText());
  if (jsonResponse.error) throw new Error("Gemini API Error: " + jsonResponse.error.message);
  var parsed = JSON.parse(jsonResponse.candidates[0].content.parts[0].text);
  return sanitizeGamePairs_(parsed, gameType);
}

// ---------------------------------------------------------------------------
// FUNGSI PENDUKUNG AI: GENERATE SOAL DARI FOTO MATERI
// ---------------------------------------------------------------------------
function generateQuestionsFromImages(fileDataArray, mataPelajaran) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY belum disetel.");

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var contentsParts = [{
    text: "Anda adalah penyusun kurikulum SD kelas 6. Analisis dokumen materi " + (mataPelajaran || "Umum") + 
          " ini dan buatkan 30 soal pilihan ganda berkualitas tinggi sesuai Kurikulum Merdeka/Fase C. " +
          "Soal harus berupa kalimat pernyataan rumpang berakhiran titik-titik (...), memiliki 4 opsi (A,B,C,D). " +
          "Hasil harus HANYA dalam format JSON valid array: " +
          "[{\"text\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"answer\": 0}]"
  }];

  if (fileDataArray && Array.isArray(fileDataArray)) {
    fileDataArray.forEach(function(file) {
      contentsParts.push({ inline_data: { mime_type: file.mimeType, data: file.base64 } });
    });
  }

  var payload = {
    contents: [{ parts: contentsParts }],
    generationConfig: { responseMimeType: "application/json" }
  };

  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  var jsonResponse = JSON.parse(response.getContentText());
  if (jsonResponse.error) throw new Error("Gemini API Error: " + jsonResponse.error.message);

  return JSON.parse(jsonResponse.candidates[0].content.parts[0].text);
}

// ---------------------------------------------------------------------------
// FUNGSI PENILAIAN ESSAI DI BALIK LAYAR (BERDASARKAN KUNCI JAWABAN)
// ---------------------------------------------------------------------------
function evaluateEssayWithAI(questionText, answerKey, studentAnswer) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  
  // Normalisasi jawaban siswa ke huruf kecil untuk pengecekan kata
  var cleanAnswer = (studentAnswer || "").toLowerCase().trim();
  
  // DAFTAR KATA PENGAMAN: Jika siswa menjawab tidak tahu, kosong, atau ngasal
  var kataPengecualian = ["tidak tahu", "tdk tau", "nggak tau", "ngak tau", "ga tau", "gk tau", "ga tahu", "-", "?", "entahlah", "gak ngerti"];
  var adalahJawabanKosongAtauTidakTahu = kataPengecualian.some(function(kata) {
    return cleanAnswer === kata || cleanAnswer.includes(kata);
  });

  // Jika terdeteksi menjawab tidak tahu / kosong, langsung berikan nilai 0 secara instan!
  if (cleanAnswer === "" || adalahJawabanKosongAtauTidakTahu) {
    return {
      score: 0,
      feedback: "Jawaban tidak ada."
    };
  }

  if (!apiKey) return { score: 70, feedback: "Dinilai otomatis oleh SIPANDA." };

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var promptText = "Nilailah jawaban esai siswa kelas 6 SD ini secara objektif berdasarkan kunci jawaban.\n\n" +
                   "- Pertanyaan: " + questionText + "\n" +
                   "- Kunci Jawaban: " + answerKey + "\n" +
                   "- Jawaban Siswa: " + studentAnswer + "\n\n" +
                   "Berikan skor angka 0-100 dan catatan singkat.\n" +
                   "FORMAT OUTPUT HANYA JSON VALID:\n" +
                   "{\"score\": 85, \"feedback\": \"Bagus\"}";

  var payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var jsonResponse = JSON.parse(response.getContentText());
    return JSON.parse(jsonResponse.candidates[0].content.parts[0].text);
  } catch (error) {
    return { score: 50, feedback: "Koreksi otomatis oleh SIPANDA" };
  }
}

// ---------------------------------------------------------------------------
// FUNGSI KOMENTAR MENYELURUH BERDASARKAN NILAI AKHIR (WALI KELAS AI)
// ---------------------------------------------------------------------------
function generateOverallFeedbackWithAI(studentName, examTitle, finalScore) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) return finalScore >= 75 ? "Kerja bagus, pertahankan prestasimu!" : "Tetap semangat belajar, kamu pasti bisa lebih baik!";

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var promptText = "Anda adalah seorang guru wali kelas 6 SD yang ramah, hangat, dan memotivasi.\n\n" +
                   "TUGAS:\n" +
                   "Berikan satu kalimat apresiasi dan motivasi singkat (maksimal 15-20 kata) dalam bahasa Indonesia untuk siswa bernama " + studentName + " yang baru saja menyelesaikan ujian '" + examTitle + "' dengan nilai akhir " + finalScore + " (skala 100).\n\n" +
                   "ATURAN:\n" +
                   "- Jika nilai >= 90: Berikan pujian istimewa yang membanggakan.\n" +
                   "- Jika nilai 75-89: Berikan apresiasi yang baik dan dorongan agar lebih teliti.\n" +
                   "- Jika nilai < 75: Berikan kata-kata penyemangat yang lembut agar tidak patah semangat.\n" +
                   "- Hasilkan teks komentarnya saja secara langsung tanpa tanda kutip dan tanpa format markdown.";

  var payload = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var jsonResponse = JSON.parse(response.getContentText());
    if (jsonResponse.candidates && jsonResponse.candidates[0]) {
      return jsonResponse.candidates[0].content.parts[0].text.trim();
    }
  } catch (err) {
    Logger.log("Gagal membuat komentar menyeluruh: " + err.toString());
  }

  return finalScore >= 75 ? "Kerja bagus, pertahankan prestasimu!" : "Tetap semangat belajar, kamu pasti bisa lebih baik!";
}

function pancingIzin() {
  UrlFetchApp.fetch("https://www.google.com");
}