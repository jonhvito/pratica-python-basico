(function () {
  "use strict";

  const engine = window.LEARNING_ENGINE;
  const curriculum = window.CURRICULUM;
  const planning = window.PLANNING_ENGINE;
  const exercises = planning.orderExercises(window.EXERCISES, curriculum.units);
  const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
  const $ = id => document.getElementById(id);
  const storageKey = "python-de-cabeca-v1";
  const storage = window.STORAGE_ENGINE.create({ storage: () => window.localStorage, exercises });
  const loadedStorage = storage.load();
  let lastStorageResult = null;
  let saveTimer = null;
  const day = 24 * 60 * 60 * 1000;
  const formats = {
    write: ["Escrever do zero", "Recupere a solução de memória, sem apoio inicial."],
    fade: ["Completar o código", "Algumas linhas desapareceram. Reconstrua o raciocínio."],
    bug: ["Caça ao bug", "O código está quase certo. Encontre a falha antes de reescrever tudo."],
    recall: ["Reconstrução", "Observe uma solução por alguns segundos e reescreva de memória."],
    paper: ["No papel", "Resolva longe da tela e transcreva somente quando terminar."]
  };
  const errorTips = {
    SyntaxError: "Confira dois-pontos, parênteses, aspas e == nas comparações.",
    IndentationError: "Confira o recuo: 4 espaços por bloco. if, for, while e def abrem um bloco.",
    TabError: "Evite misturar tabs e espaços. Use 4 espaços por nível de recuo.",
    NameError: "Confira o nome da função e das variáveis. Uma variável precisa existir antes de ser usada.",
    TypeError: "Confira os tipos. input() retorna texto; converta com int() ou float() para calcular.",
    ValueError: "Confira se o texto pode ser convertido. Use ponto para os decimais, como 7.5.",
    IndexError: "O primeiro índice é 0 e o último é len(lista) - 1. A lista pode estar vazia.",
    ZeroDivisionError: "Confira se o divisor é zero. Para uma lista vazia, trate o caso antes de calcular a média.",
    EOFError: "Cada input() consome uma entrada. Confira quantas entradas o enunciado pede.",
    AttributeError: "Confira o nome do método e o tipo do valor. append() altera a lista e devolve None."
  };

  let storageAvailable = true;
  let mode = "practice";
  let busy = false;
  let cancelled = false;
  let escapeTab = false;
  let paperStartedAt = null;
  let recallTimer = null;
  let unitFilter = "all";
  let searchQuery = "";
  let statusFilter = "all";
  let pendingImport = null;
  let importRequest = 0;
  let state = loadState();
  const codeEditor = window.CodeEditor.attach($("answer"), { gutter: $("line-numbers"), status: $("editor-status") });
  const studyWorkbench = window.STUDY_WORKBENCH.create({
    engine, getExercise: currentExercise, getDraft: () => draft(activeId()), getAnswer: () => answerFor(activeId()),
    getMode: () => mode, isSubmitted: () => !!state.exam?.finishedAt, isBusy: () => busy,
    save, scheduleSave, markHelp, setBusy, appendError, pyRepr
  });

  function newRoundId() { return globalThis.crypto?.randomUUID?.() || Date.now() + "-" + Math.random().toString(36).slice(2); }
  function setMode(value) { mode = value; state.lastMode = value; }

  function emptyLearning() {
    return { records: {}, attempts: [], mistakes: [], sessions: [], streak: { days: 0, lastDate: null } };
  }

  function initialState() {
    return { version: 4, lastMode: "practice", activeId: exercises[0].id, drafts: {}, exam: null, coach: null, learning: emptyLearning() };
  }

  function validResult(result) {
    return result && typeof result === "object" && Array.isArray(result.cases) &&
      result.cases.every(item => item && typeof item.pass === "boolean") ? result : null;
  }

  function normalizeDraft(value, exercise) {
    return {
      code: typeof value?.code === "string" ? value.code : "",
      reflection: typeof value?.reflection === "string" ? value.reflection.slice(0, 8000) : "",
      hintsLevel: Number.isInteger(value?.hintsLevel) ? Math.max(0, Math.min(3, value.hintsLevel)) : 0,
      ...(typeof value?.experimentInput === "string" ? { experimentInput: value.experimentInput.slice(0, 8000) } : {}),
      ...(typeof value?.experimentPrediction === "string" ? { experimentPrediction: value.experimentPrediction.slice(0, 8000) } : {}),
      helped: !!value?.helped,
      result: validResult(value?.result),
      confidence: [1, 2, 3].includes(value?.confidence) ? value.confidence : null,
      format: planning.safeFormat(exercise, value?.format),
      variantSeed: Number.isInteger(value?.variantSeed) && value.variantSeed >= 0 ? value.variantSeed : 0,
      roundAttempts: Number.isInteger(value?.roundAttempts) ? value.roundAttempts : 0,
      roundId: typeof value?.roundId === "string" && value.roundId ? value.roundId : newRoundId(),
      challengeKey: typeof value?.challengeKey === "string" ? value.challengeKey : "",
      paperTranscribing: !!value?.paperTranscribing,
      traceRows: Array.isArray(value?.traceRows) ? value.traceRows.slice(0, 30) : []
    };
  }

  function normalizeLearning(value) {
    const clean = emptyLearning();
    if (!value || typeof value !== "object") return clean;
    clean.records = value.records && typeof value.records === "object" ? value.records : {};
    clean.attempts = Array.isArray(value.attempts) ? value.attempts.slice(-400) : [];
    clean.mistakes = Array.isArray(value.mistakes) ? value.mistakes.filter(item => byId.has(item.exerciseId)).slice(-120) : [];
    clean.sessions = Array.isArray(value.sessions) ? value.sessions.slice(-100) : [];
    clean.streak = value.streak && typeof value.streak === "object" ? value.streak : clean.streak;
    if (value.diagnostic && typeof value.diagnostic.sessionId === "string" && Number.isFinite(value.diagnostic.startedAt)) {
      const answers = Object.entries(value.diagnostic.answers || {}).filter(([id, answer]) => byId.has(id)
        && answer && typeof answer.pass === "boolean" && typeof answer.helped === "boolean" && Number.isFinite(answer.at));
      clean.diagnostic = { sessionId: value.diagnostic.sessionId, startedAt: value.diagnostic.startedAt,
        answers: Object.fromEntries(answers.map(([id, answer]) => [id, { pass: answer.pass, helped: answer.helped, at: answer.at }])) };
    }
    return clean;
  }

  function validExam(exam) {
    return exam && Array.isArray(exam.ids) && exam.ids.length === 6 && new Set(exam.ids).size === 6 &&
      exam.ids.every(id => byId.has(id)) && Number.isFinite(exam.startedAt) && exam.answers && typeof exam.answers === "object";
  }

  function normalizeExam(exam) {
    if (!validExam(exam)) return null;
    const ids = exam.ids;
    const normalized = {
      ids,
      activeId: ids.includes(exam.activeId) ? exam.activeId : ids[0],
      startedAt: exam.startedAt,
      course: exam.course === true,
      finishedAt: Number.isFinite(exam.finishedAt) ? exam.finishedAt : null,
      answers: Object.fromEntries(ids.map(id => [id, typeof exam.answers[id] === "string" ? exam.answers[id] : ""])),
      results: Object.fromEntries(ids.map(id => [id, validResult(exam.results?.[id])])),
      variants: Object.fromEntries(ids.map(id => [id, Number.isInteger(exam.variants?.[id]) ? exam.variants[id] : 0]))
    };
    if (normalized.finishedAt && !ids.every(id => normalized.results[id])) normalized.finishedAt = null;
    return normalized;
  }

  function validCoach(coach) {
    return coach && Array.isArray(coach.ids) && coach.ids.length >= 3 && coach.ids.every(id => byId.has(id));
  }

  function normalizeCoach(coach) {
    if (!validCoach(coach)) return null;
    const ids = [...new Set(coach.ids)].slice(0, 12);
    return {
      id: coach.id || String(Date.now()), ids, type: coach.type || "adaptive", unitId: coach.unitId || null,
      activeId: ids.includes(coach.activeId) ? coach.activeId : ids[0],
      startedAt: Number.isFinite(coach.startedAt) ? coach.startedAt : Date.now(),
      finishedAt: Number.isFinite(coach.finishedAt) ? coach.finishedAt : null,
      answers: Object.fromEntries(ids.map(id => [id, typeof coach.answers?.[id] === "string" ? coach.answers[id] : ""])),
      results: Object.fromEntries(ids.map(id => [id, validResult(coach.results?.[id])])),
      helped: Object.fromEntries(ids.map(id => [id, !!coach.helped?.[id]])),
      confidence: Object.fromEntries(ids.map(id => [id, [1, 2, 3].includes(coach.confidence?.[id]) ? coach.confidence[id] : null])),
      formats: Object.fromEntries(ids.map(id => [id, coach.type === "diagnostic" ? "write" : planning.safeFormat(byId.get(id), coach.formats?.[id])])),
      variants: Object.fromEntries(ids.map(id => [id, Number.isInteger(coach.variants?.[id]) ? coach.variants[id] : 0])),
      prepared: Object.fromEntries(ids.map(id => [id, typeof coach.prepared?.[id] === "string" ? coach.prepared[id] : ""])),
      paperTranscribing: Object.fromEntries(ids.map(id => [id, !!coach.paperTranscribing?.[id]])),
      roundIds: Object.fromEntries(ids.map(id => [id, typeof coach.roundIds?.[id] === "string" ? coach.roundIds[id] : newRoundId()])),
      roundAttempts: Object.fromEntries(ids.map(id => [id, Number.isInteger(coach.roundAttempts?.[id]) && coach.roundAttempts[id] >= 0 ? coach.roundAttempts[id] : 0]))
    };
  }

  function loadState() {
    const fresh = initialState();
    try {
      const saved = loadedStorage.state;
      if (!saved || typeof saved !== "object") return fresh;
      if (byId.has(saved.activeId)) fresh.activeId = saved.activeId;
      if (["practice", "coach", "exam"].includes(saved.lastMode)) fresh.lastMode = saved.lastMode;
      for (const exercise of exercises) fresh.drafts[exercise.id] = normalizeDraft(saved.drafts?.[exercise.id], exercise);
      fresh.exam = normalizeExam(saved.exam);
      fresh.coach = normalizeCoach(saved.coach);
      fresh.learning = normalizeLearning(saved.learning);
      const preserveSolvedRound = (id, result, roundId, variantSeed, helped) => {
        const record = fresh.learning.records[id];
        if (!result?.pass || !record) return;
        const exercise = engine.materialize(byId.get(id), variantSeed);
        fresh.learning.records[id] = window.PROGRESS_ENGINE.seedCompletedRound(record, {
          roundId, variantSeed: exerciseSignature(exercise), helped: result.learning?.helped ?? helped, now: Date.now()
        });
      };
      for (const exercise of exercises) {
        const item = fresh.drafts[exercise.id];
        preserveSolvedRound(exercise.id, item.result, item.roundId, item.variantSeed, item.helped || planning.usesFormatSupport(exercise, item.format));
      }
      if (fresh.coach) for (const id of fresh.coach.ids) {
        preserveSolvedRound(id, fresh.coach.results[id], fresh.coach.roundIds[id], fresh.coach.variants[id], fresh.coach.helped[id] || planning.usesFormatSupport(byId.get(id), fresh.coach.formats[id]));
      }
      if (fresh.exam) for (const id of fresh.exam.ids) {
        preserveSolvedRound(id, fresh.exam.results[id], "exam-" + fresh.exam.startedAt + "-" + id, fresh.exam.variants[id], false);
      }
      return fresh;
    } catch (_) {
      storageAvailable = false;
      return fresh;
    }
  }

  function save() {
    clearTimeout(saveTimer); saveTimer = null;
    state.version = 4;
    lastStorageResult = storage.save(state);
    storageAvailable = lastStorageResult.ok;
    renderStorageStatus();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
    if (storageAvailable) $("storage-status").textContent = "Alterações em memória; salvando em instantes…";
  }

  function renderStorageStatus() {
    const issue = lastStorageResult && (!lastStorageResult.ok || lastStorageResult.message);
    const message = issue ? lastStorageResult.message : "Progresso e rascunhos salvos neste navegador.";
    $("storage-status").textContent = message;
    $("storage-notice").hidden = !issue;
    $("storage-notice-text").textContent = message + (storageAvailable ? "" : " As alterações desta aba continuam disponíveis para exportação.");
    $("export-original").hidden = storage.exportOriginal() === null || loadedStorage.writable;
    $("export-archive").hidden = storage.exportArchive() === null;
    $("recover-valid").hidden = !loadedStorage.recovery;
    $("reload-progress").hidden = lastStorageResult?.status !== "conflict";
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function normal(text) { return text.replace(/\r\n/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").replace(/\n+$/, ""); }
  function dateKey(timestamp = Date.now()) { return new Date(timestamp).toLocaleDateString("sv-SE"); }
  function formatDate(timestamp) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(timestamp)); }
  function formatTime(timestamp) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)); }
  function pyRepr(value) {
    if (value === null) return "None";
    if (typeof value === "boolean") return value ? "True" : "False";
    if (Array.isArray(value)) return "[" + value.map(pyRepr).join(", ") + "]";
    return JSON.stringify(value);
  }

  function draft(id) {
    if (!state.drafts[id]) state.drafts[id] = normalizeDraft(null, byId.get(id));
    return state.drafts[id];
  }

  function activeId() {
    if (mode === "exam") return state.exam.activeId;
    if (mode === "coach") return state.coach.activeId;
    return state.activeId;
  }

  function baseExercise() { return byId.get(activeId()); }
  function currentList() {
    if (mode === "exam") return state.exam.ids.map(id => byId.get(id));
    if (mode === "coach") return state.coach.ids.map(id => byId.get(id));
    const query = searchText(searchQuery.trim());
    const now = Date.now();
    return exercises.filter(exercise => {
      if (unitFilter !== "all" && exercise.unit !== unitFilter) return false;
      const record = recordFor(exercise.id);
      if (statusFilter === "unseen" && record.attempts) return false;
      if (statusFilter === "mistakes" && !state.learning.mistakes.some(item => item.exerciseId === exercise.id && !item.resolvedAt)) return false;
      if (statusFilter === "due" && !(record.attempts && record.dueAt && record.dueAt <= now)) return false;
      if (!query) return true;
      const unit = curriculum.unitById[exercise.unit];
      const skills = engine.skillsFor(exercise.id).map(id => engine.skills.find(skill => skill.id === id)?.name || id);
      return searchText([exercise.title, exercise.prompt, unit.title, ...unit.concepts, ...skills].join(" ")).includes(query);
    });
  }

  function searchText(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"); }

  function clearExerciseFilters() {
    unitFilter = "all"; searchQuery = ""; statusFilter = "all";
    $("unit-filter").value = "all"; $("exercise-search").value = ""; $("exercise-status-filter").value = "all";
  }

  function applyExerciseFilters() {
    if (busy || mode !== "practice") return;
    const list = currentList();
    if (list.length && !list.some(exercise => exercise.id === state.activeId)) navigate(list[0].id, false);
    else { save(); render(); }
  }

  function renderContinueStudy() {
    const savedMode = state.lastMode;
    const diagnosticDone = savedMode === "coach" && state.coach?.type === "diagnostic" && state.coach.finishedAt
      && planning.summarizeDiagnostic(state.learning.diagnostic, exercises, curriculum.units).completed;
    const resumeCoach = savedMode === "coach" && state.coach && !state.coach.finishedAt;
    const resumeExam = savedMode === "exam" && state.exam && !state.exam.finishedAt;
    const id = resumeCoach ? state.coach.activeId : resumeExam ? state.exam.activeId : state.activeId;
    const hasActivity = state.learning.attempts.length || Object.values(state.drafts).some(item => item.code.trim()) || resumeCoach || resumeExam;
    $("continue-study-button").textContent = diagnosticDone ? "Montar treino recomendado" : hasActivity ? "Continuar de onde parei" : "Começar a aprender";
    $("continue-study-text").textContent = diagnosticDone ? "Diagnóstico guardado. Próximo passo sugerido: " + focusUnit().title + ". Confirme essa estimativa na prática."
      : hasActivity
      ? (resumeCoach ? "Sua sessão está guardada: " : resumeExam ? "Seu desafio está guardado: " : "Último exercício: ") + byId.get(id).title + "."
      : "Comece pelos fundamentos ou faça o diagnóstico para encontrar seu ponto de partida.";
  }

  function continueStudy() {
    if (busy) return;
    if (state.lastMode === "coach" && state.coach?.type === "diagnostic" && state.coach.finishedAt) {
      startCoach(true); $("exercise-title").focus(); return;
    }
    if (state.lastMode === "coach" && state.coach && !state.coach.finishedAt) setMode("coach");
    else if (state.lastMode === "exam" && state.exam && !state.exam.finishedAt) setMode("exam");
    else { setMode("practice"); clearExerciseFilters(); }
    prepareCurrentChallenge(); save(); render();
    $("exercise-title").focus();
  }

  function roundIdFor(id) {
    if (mode === "exam") return "exam-" + state.exam.startedAt + "-" + id;
    if (mode === "coach") return state.coach.roundIds[id];
    return draft(id).roundId;
  }

  function restartRound(id) {
    if (mode === "coach") { state.coach.roundIds[id] = newRoundId(); state.coach.roundAttempts[id] = 0; state.coach.helped[id] = false; }
    else { draft(id).roundId = newRoundId(); draft(id).roundAttempts = 0; draft(id).helped = false; }
  }

  function variantSeedFor(id) {
    if (mode === "exam") return state.exam.variants[id] || 0;
    if (mode === "coach") return state.coach.variants[id] || 0;
    return draft(id).variantSeed;
  }

  function currentExercise() {
    const base = baseExercise();
    return engine.materialize(base, variantSeedFor(base.id));
  }

  function answerFor(id) {
    if (mode === "exam") return state.exam.answers[id];
    if (mode === "coach") return state.coach.answers[id];
    return draft(id).code;
  }

  function setAnswer(id, code) {
    if (mode === "exam") state.exam.answers[id] = code;
    else if (mode === "coach") state.coach.answers[id] = code;
    else draft(id).code = code;
  }

  function resultFor(id) {
    if (mode === "exam") return state.exam.finishedAt ? state.exam.results[id] : null;
    if (mode === "coach") return state.coach.results[id];
    return draft(id).result;
  }

  function setResult(id, result) {
    if (mode === "coach") state.coach.results[id] = result;
    else draft(id).result = result;
  }

  function helpedFor(id) {
    if (mode === "exam") return false;
    return (mode === "coach" ? state.coach.helped[id] : draft(id).helped) || planning.usesFormatSupport(byId.get(id), formatFor(id));
  }
  function markHelp() {
    if (mode === "exam") return;
    if (mode === "coach") state.coach.helped[activeId()] = true;
    else draft(activeId()).helped = true;
    save();
    renderState();
  }
  function confidenceFor(id) { return mode === "coach" ? state.coach.confidence[id] : draft(id).confidence; }
  function setConfidence(value) {
    if (busy) return;
    if (mode === "coach") state.coach.confidence[activeId()] = value;
    else draft(activeId()).confidence = value;
    save(); renderConfidence();
  }
  function formatFor(id) {
    if (mode === "exam" || isDiagnostic()) return "write";
    return planning.safeFormat(byId.get(id), mode === "coach" ? state.coach.formats[id] : draft(id).format);
  }
  function isPaperTranscribing(id) {
    return mode === "coach" ? state.coach.paperTranscribing[id] : draft(id).paperTranscribing;
  }
  function setPaperTranscribing(id, value) {
    if (mode === "coach") state.coach.paperTranscribing[id] = value;
    else draft(id).paperTranscribing = value;
  }

  function recordFor(id, create = false) {
    const existing = state.learning.records[id];
    if (existing || !create) return existing || { attempts: 0, passes: 0, mastery: 0, streak: 0, interval: 0, dueAt: null, lastAt: null, helpedPasses: 0 };
    return (state.learning.records[id] = { attempts: 0, passes: 0, mastery: 0, streak: 0, interval: 0, dueAt: null, lastAt: null, helpedPasses: 0 });
  }

  function updateStudyStreak(timestamp) {
    const today = dateKey(timestamp);
    const streak = state.learning.streak;
    if (streak.lastDate === today) return;
    const yesterday = dateKey(timestamp - day);
    streak.days = streak.lastDate === yesterday ? (streak.days || 0) + 1 : 1;
    streak.lastDate = today;
  }

  function recordAttempt(exercise, result, code, options = {}) {
    const timestamp = Date.now();
    const record = recordFor(exercise.id, true);
    const previousRecord = { ...record };
    const helped = !!options.helped;
    const confidence = options.confidence || null;
    const pass = !!result.pass;
    const firstTry = (options.roundAttempts || 0) === 0;
    const variantKey = exerciseSignature(exercise);
    const updated = window.PROGRESS_ENGINE.applyAttempt(record, {
      pass, helped, firstTry, variantSeed: variantKey, roundId: options.roundId || roundIdFor(exercise.id), now: timestamp
    });
    Object.assign(record, updated);
    if (pass) {
      state.learning.mistakes.forEach(item => {
        if (item.exerciseId === exercise.id && !item.resolvedAt && window.PROGRESS_ENGINE.resolvesMistake(previousRecord, updated, {
          pass, helped, roundId: options.roundId || roundIdFor(exercise.id), variantSeed: variantSeedFor(exercise.id)
        }, item)) item.resolvedAt = timestamp;
      });
    } else {
      const diagnosed = engine.diagnosis(result, exercise, code);
      state.learning.mistakes.push({
        id: timestamp + "-" + exercise.id,
        exerciseId: exercise.id,
        title: exercise.title,
        category: diagnosed.key,
        categoryTitle: diagnosed.title,
        tip: diagnosed.tip,
        detail: diagnosed.detail,
        code: String(code).slice(0, 5000),
        variantSeed: variantSeedFor(exercise.id),
        result: JSON.parse(JSON.stringify(result)),
        reflection: "",
        createdAt: timestamp,
        resolvedAt: null
      });
      state.learning.mistakes = state.learning.mistakes.slice(-120);
      result.learningDiagnosis = diagnosed;
    }
    const creditMessages = {
      "round-completed": "Esta tentativa já foi concluída. Verificar novamente não aumenta o domínio nem adia a revisão.",
      "variant-already-practiced-today": "Você já praticou esta variação hoje. Retome na revisão agendada para testar a memória após um intervalo.",
      "daily-practice-limit": "O ganho de domínio de hoje já foi registrado. Você pode continuar praticando; a revisão mantém a data prevista.",
      "assisted-practice": "A tentativa usou apoio. Uma revisão sem consulta vai ajudar a demonstrar autonomia."
    };
    result.learning = { mastery: record.mastery, dueAt: record.dueAt, firstTry, helped, confidence, credit: updated.credit, reason: creditMessages[updated.reason] || "A prática ficou registrada; o domínio e a revisão foram mantidos." };
    state.learning.attempts.push({ exerciseId: exercise.id, title: exercise.title, pass, helped, confidence, source: options.source || mode, mastery: record.mastery, credit: updated.credit, reason: updated.reason, roundId: options.roundId || roundIdFor(exercise.id), at: timestamp });
    state.learning.attempts = state.learning.attempts.slice(-400);
    if (options.diagnosticSessionId) {
      state.learning.diagnostic = planning.recordDiagnostic(state.learning.diagnostic, exercise, { pass, helped }, {
        sessionId: options.diagnosticSessionId, now: timestamp
      });
    }
    updateStudyStreak(timestamp);
    return record;
  }

  function exerciseSignature(exercise) { return JSON.stringify({ kind: exercise.kind, cases: exercise.cases, answer: exercise.answer }); }

  function masteryStatus(value) {
    if (value >= 80) return "Consolidado";
    if (value >= 55) return "Faço sozinho";
    if (value >= 25) return "Com ajuda";
    return value > 0 ? "Em construção" : "Não visto";
  }

  function skillScore(skillId) {
    return planning.skillStats(skillId, exercises, state.learning).autonomy;
  }

  function unitStats(unitId) {
    return planning.unitStats(unitId, exercises, state.learning);
  }

  function focusUnit() {
    return planning.focusUnit(curriculum.units, exercises, state.learning);
  }

  function unitUnlocked(unit) {
    if (!unit.prerequisites.length) return true;
    return unit.prerequisites.every(id => unitStats(id).complete) || unit.order <= focusUnit().order;
  }

  function dueExercises() {
    const now = Date.now();
    return exercises.filter(exercise => {
      const record = recordFor(exercise.id);
      return record.attempts && record.dueAt && record.dueAt <= now;
    });
  }

  function recommendationReason(exercise) {
    return planning.recommendationReason(exercise, state.learning, { now: Date.now() });
  }

  function rankedExercises(onlyUnit = null) {
    return planning.rankedExercises(exercises, curriculum.units, state.learning, { now: Date.now(), onlyUnit });
  }

  function buildCoachSession(options = {}) {
    const now = Date.now();
    const selected = options.diagnostic ? planning.diagnosticExercises(exercises, curriculum.units)
      : planning.selectSession(exercises, curriculum.units, state.learning, { now, onlyUnit: options.unitId || null }).map(item => item.exercise);
    const ids = [...new Set(selected.map(exercise => exercise.id))];
    const formatCycle = ["write", "bug", "fade", "write", "paper"];
    const formatsById = {};
    ids.forEach((id, index) => {
      const exercise = byId.get(id);
      let format = options.diagnostic ? "write" : planning.safeFormat(exercise, formatCycle[index] || "write");
      if (format === "bug" && !engine.bugFor(exercise)) format = "fade";
      formatsById[id] = planning.safeFormat(exercise, format);
    });
    const baseSeed = Number(dateKey().replaceAll("-", ""));
    state.coach = normalizeCoach({
      id: newRoundId(), type: options.diagnostic ? "diagnostic" : options.unitId ? "unit" : "adaptive", unitId: options.unitId || null,
      ids, activeId: ids[0], startedAt: now, answers: {}, results: {}, helped: {}, confidence: {},
      formats: formatsById, variants: Object.fromEntries(ids.map((id, index) => [id, baseSeed + index])), prepared: {}, paperTranscribing: {}
    });
    if (options.diagnostic) state.learning.diagnostic = { sessionId: state.coach.id, startedAt: now, answers: {} };
    save();
  }

  function startCoach(force = false) {
    if (busy) return;
    if (!force && state.coach && !state.coach.finishedAt && state.coach.type !== "adaptive" && !canReplaceCoach()) return;
    if (force || !state.coach || state.coach.finishedAt || state.coach.type !== "adaptive") buildCoachSession();
    setMode("coach");
    prepareCurrentChallenge();
    save(); render();
  }

  function startUnit(unitId) {
    if (busy || !canReplaceCoach()) return;
    buildCoachSession({ unitId });
    setMode("coach"); prepareCurrentChallenge(); save(); render();
  }

  function startDiagnostic() {
    if (busy || !canReplaceCoach()) return;
    buildCoachSession({ diagnostic: true });
    setMode("coach"); prepareCurrentChallenge(); save(); render();
  }

  function canReplaceCoach() {
    const recordedDiagnostic = state.coach?.type === "diagnostic" && state.learning.diagnostic?.sessionId === state.coach.id
      && Object.keys(state.learning.diagnostic.answers).length > 0;
    return !state.coach || !!state.coach.finishedAt || !recordedDiagnostic && !Object.values(state.coach.answers).some(answer => answer.trim())
      || window.confirm("Iniciar outra sessão substituirá as respostas da sessão em andamento. Continuar?");
  }

  function finishCoachIfNeeded() {
    if (!state.coach || state.coach.finishedAt) return;
    const complete = state.coach.type === "diagnostic" ? state.coach.ids.every(id => diagnosticAnswer(id))
      : state.coach.ids.every(id => state.coach.results[id]?.pass);
    if (complete) {
      state.coach.finishedAt = Date.now();
      state.learning.sessions.push({ id: state.coach.id, startedAt: state.coach.startedAt, finishedAt: state.coach.finishedAt, count: state.coach.ids.length });
      state.learning.sessions = state.learning.sessions.slice(-100);
    }
  }

  function nextCoachItem() {
    if (busy) return;
    if (isDiagnostic() && !diagnosticAnswer(activeId())) {
      // Guardar um rascunho sem correção registra uma lacuna, sem tirar pontuação.
      state.learning.diagnostic = planning.recordDiagnostic(state.learning.diagnostic, baseExercise(), { pass: false, helped: helpedFor(activeId()) }, {
        sessionId: state.coach.id, now: Date.now()
      });
      finishCoachIfNeeded();
    }
    const currentIndex = state.coach.ids.indexOf(activeId());
    const order = [...state.coach.ids.slice(currentIndex + 1), ...state.coach.ids.slice(0, currentIndex + 1)];
    const next = order.find(id => isDiagnostic() ? !diagnosticAnswer(id) : !state.coach.results[id]?.pass);
    if (next) navigate(next);
    else { finishCoachIfNeeded(); save(); render(); }
  }

  function isDiagnostic() { return mode === "coach" && state.coach?.type === "diagnostic"; }

  function diagnosticAnswer(id) {
    if (state.learning.diagnostic?.sessionId !== state.coach?.id) return null;
    return state.learning.diagnostic.answers[id] || null;
  }

  function recordInput() {
    const exercise = currentExercise();
    setAnswer(exercise.id, $("answer").value);
    if (mode === "coach") state.coach.results[exercise.id] = null;
    else if (mode === "practice") draft(exercise.id).result = null;
    scheduleSave();
    $("feedback").hidden = true;
    studyWorkbench.invalidate();
    codeEditor.sync({ codeMode: ["program", "function"].includes(exercise.kind), errorLine: null });
    renderNavigation(); renderState();
    renderCoachPanel();
  }

  function renderState() {
    const exercise = currentExercise();
    const result = resultFor(exercise.id);
    let label = answerFor(exercise.id).trim() ? "Em andamento" : "Para tentar";
    if (mode === "exam" && !state.exam.finishedAt) label = answerFor(exercise.id).trim() ? "Resposta guardada" : "Em branco";
    else if (result?.pass) label = (result.learning?.helped ?? helpedFor(exercise.id)) ? "Resolvido com apoio" : "Resolvido";
    else if (result) label = "Para revisar";
    $("exercise-state").textContent = label;
    $("exercise-state").className = "tag" + (result?.pass ? " success" : result ? " warning" : "");
  }

  function renderNavigation() {
    const list = currentList();
    const nav = $("exercise-list");
    const scrollPosition = nav.scrollTop;
    nav.replaceChildren();
    let group = "";
    list.forEach((exercise, index) => {
      if (mode === "practice" && exercise.group !== group) {
        group = exercise.group;
        nav.append(element("h3", group, "group-title"));
      }
      const button = element("button", undefined, "exercise-link");
      button.type = "button"; button.disabled = busy;
      button.setAttribute("aria-current", String(exercise.id === activeId()));
      const result = resultFor(exercise.id);
      const answered = answerFor(exercise.id).trim();
      const diagnostic = isDiagnostic() ? diagnosticAnswer(exercise.id) : null;
      const independent = diagnostic?.pass && !diagnostic.helped;
      const mark = isDiagnostic() ? diagnostic ? independent ? "✓" : "↺" : answered ? "·" : ""
        : result?.pass ? "✓" : result ? "↺" : answered ? "·" : "";
      button.setAttribute("aria-label", exercise.title + (isDiagnostic() ? diagnostic ? independent ? ", primeira resposta sem apoio" : ", lacuna registrada" : ""
        : result?.pass ? ", resolvido" : result ? ", para revisar" : ""));
      button.append(element("span", String(index + 1).padStart(2, "0"), "exercise-number"), element("span", exercise.title), element("span", mark, "exercise-mark"));
      button.onclick = () => navigate(exercise.id);
      nav.append(button);
    });
    nav.scrollTop = scrollPosition;
    $("exercise-empty").hidden = mode !== "practice" || list.length > 0;
    const selected = nav.querySelector('[aria-current="true"]');
    if (selected) {
      const navBounds = nav.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      if (selectedBounds.bottom > navBounds.bottom) nav.scrollTop += selectedBounds.bottom - navBounds.bottom;
      else if (selectedBounds.top < navBounds.top) nav.scrollTop -= navBounds.top - selectedBounds.top;
    }
    const done = list.filter(exercise => isDiagnostic() ? diagnosticAnswer(exercise.id)
      : mode === "exam" && !state.exam.finishedAt ? answerFor(exercise.id).trim() : resultFor(exercise.id)?.pass).length;
    $("progress-label").textContent = isDiagnostic() ? "Primeiras respostas guardadas" : mode === "exam" && !state.exam.finishedAt ? "Questões preenchidas" : mode === "coach" ? "Etapas resolvidas" : "Exercícios resolvidos";
    $("progress-count").textContent = done + " / " + list.length;
    $("progress").max = list.length; $("progress").value = done;
    $("progress").setAttribute("aria-label", $("progress-label").textContent);
  }

  function navigate(id, focus = true) {
    if (busy) return;
    if (mode === "exam") state.exam.activeId = id;
    else if (mode === "coach") state.coach.activeId = id;
    else state.activeId = id;
    paperStartedAt = null;
    prepareCurrentChallenge();
    save(); render();
    if (focus) {
      if (window.matchMedia("(max-width: 800px)").matches) $("exercise-catalog").open = false;
      $("exercise-title").focus();
    }
  }

  function renderExample(exercise) {
    const container = $("example");
    container.replaceChildren(); container.hidden = !["program", "function"].includes(exercise.kind);
    if (container.hidden) return;
    const example = exercise.cases[0];
    const input = exercise.kind === "function" ? exercise.fn + "(" + example.args.map(pyRepr).join(", ") + ")" : example.inputs.join("\n") || "Sem entrada";
    const output = exercise.kind === "function" ? pyRepr(example.expected) : example.expected;
    [[exercise.kind === "function" ? "EXEMPLO DE CHAMADA" : "EXEMPLO DE ENTRADA", input], [exercise.kind === "function" ? "RETORNO ESPERADO" : "SAÍDA ESPERADA", output]].forEach(([label, value]) => {
      const block = element("div");
      block.append(element("span", label, "example-label"), element("pre", value)); container.append(block);
    });
  }

  function selectChoice(value) {
    if (busy) return;
    const restoreFocus = $("choice-options").contains(document.activeElement);
    setAnswer(activeId(), value); setResult(activeId(), null); save(); renderChoice(currentExercise()); renderNavigation(); renderState(); renderCoachPanel();
    if (restoreFocus) [...$("choice-options").querySelectorAll("button")].find(button => button.dataset.value === value)?.focus();
    $("selection-status").textContent = "Alternativa " + String.fromCharCode(65 + Number(value)) + " selecionada.";
  }

  function renderChoice(exercise) {
    const panel = $("choice-panel"); panel.hidden = exercise.kind !== "choice";
    const container = $("choice-options"); container.replaceChildren();
    if (panel.hidden) return;
    exercise.options.forEach((option, index) => {
      const button = element("button", undefined, "choice-option"); button.type = "button";
      button.dataset.value = option.value;
      button.setAttribute("aria-pressed", String(answerFor(exercise.id) === option.value));
      const content = element(option.label.includes("\n") ? "code" : "span", option.label, "choice-text");
      button.append(element("span", String.fromCharCode(65 + index), "choice-letter"), content);
      button.onclick = () => selectChoice(option.value); container.append(button);
    });
  }

  function shuffledOrder(exercise) {
    if (exercise.lines.length < 2) return exercise.lines.slice();
    const offset = Math.abs([...exercise.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)) % (exercise.lines.length - 1) + 1;
    return [...exercise.lines.slice(offset), ...exercise.lines.slice(0, offset)];
  }

  function orderValues(exercise) {
    return answerFor(exercise.id).trim() ? answerFor(exercise.id).split("\n") : shuffledOrder(exercise);
  }

  function moveOrderLine(index, direction) {
    if (busy) return;
    const exercise = currentExercise(); const lines = orderValues(exercise); const target = index + direction;
    if (target < 0 || target >= lines.length) return;
    [lines[index], lines[target]] = [lines[target], lines[index]];
    setAnswer(exercise.id, lines.join("\n")); setResult(exercise.id, null); save(); renderOrder(exercise); renderNavigation(); renderState(); renderCoachPanel();
    const row = $("order-lines").children[target];
    const buttons = [...row.querySelectorAll("button")];
    (buttons.find(button => !button.disabled) || row).focus();
    $("selection-status").textContent = "Etapa movida para a posição " + (target + 1) + ".";
  }

  function renderOrder(exercise) {
    const panel = $("order-panel"); panel.hidden = exercise.kind !== "order";
    const list = $("order-lines"); list.replaceChildren();
    if (panel.hidden) return;
    orderValues(exercise).forEach((line, index, lines) => {
      const item = document.createElement("li"); const code = element("code", line); const actions = element("span", undefined, "order-actions");
      const up = element("button", "↑", "icon-button"); const down = element("button", "↓", "icon-button");
      up.type = down.type = "button"; up.disabled = index === 0; down.disabled = index === lines.length - 1;
      up.setAttribute("aria-label", "Mover etapa " + (index + 1) + " para cima"); down.setAttribute("aria-label", "Mover etapa " + (index + 1) + " para baixo");
      up.onclick = () => moveOrderLine(index, -1); down.onclick = () => moveOrderLine(index, 1);
      actions.append(up, down); item.append(code, actions); list.append(item);
    });
  }

  function renderSkills(exercise) {
    const container = $("skill-chips"); container.replaceChildren();
    engine.skillsFor(exercise.id).forEach(skillId => {
      const skill = engine.skills.find(item => item.id === skillId);
      if (skill) container.append(element("span", skill.name, "skill-chip"));
    });
    const seed = variantSeedFor(exercise.id);
    $("variant-label").hidden = !seed || exercise.variantSeed === undefined;
    $("variant-label").textContent = seed ? "Variação " + String(seed).slice(-3) : "";
    const prerequisites = planning.missingPrerequisites(exercise, exercises, curriculum.units, state.learning);
    $("exercise-prerequisites").hidden = !prerequisites.length || isDiagnostic();
    $("exercise-prerequisites").textContent = "Para preparar esta atividade, pratique: "
      + prerequisites.map(id => byId.get(id)?.title || id).join("; ") + ". Você pode abrir qualquer atividade na prática livre.";
  }

  function challengeKey(id, format) { return format + ":" + variantSeedFor(id); }

  function preparedKey(id) {
    return mode === "coach" ? state.coach.prepared[id] : draft(id).challengeKey;
  }

  function setPreparedKey(id, value) {
    if (mode === "coach") state.coach.prepared[id] = value;
    else draft(id).challengeKey = value;
  }

  function prepareCurrentChallenge(force = false) {
    if (mode === "exam") return;
    const exercise = currentExercise();
    if (["choice", "order"].includes(exercise.kind)) return;
    const format = formatFor(exercise.id);
    const key = challengeKey(exercise.id, format);
    if (!force && preparedKey(exercise.id) === key) return;
    if (format === "bug") {
      const challenge = engine.bugFor(exercise);
      if (challenge) setAnswer(exercise.id, challenge.code);
    } else if (format === "fade") {
      setAnswer(exercise.id, engine.fadedCode(exercise.solution, variantSeedFor(exercise.id) || Date.now()));
    } else if (force && format === "write") setAnswer(exercise.id, "");
    setPreparedKey(exercise.id, key);
    setResult(exercise.id, null);
  }

  function startRecall() {
    const exercise = currentExercise();
    clearInterval(recallTimer);
    $("recall-code").textContent = exercise.solution;
    let seconds = 20;
    $("recall-clock").textContent = seconds;
    $("recall-dialog").showModal();
    recallTimer = setInterval(() => {
      seconds -= 1; $("recall-clock").textContent = seconds;
      if (seconds <= 0) hideRecall();
    }, 1000);
  }

  function hideRecall() {
    clearInterval(recallTimer); recallTimer = null;
    if ($("recall-dialog").open) $("recall-dialog").close();
    setAnswer(activeId(), ""); setResult(activeId(), null);
    setPreparedKey(activeId(), challengeKey(activeId(), "recall"));
    save(); render(); $("answer").focus();
  }

  function applyFormat(format, userInitiated = true) {
    if (busy) return;
    if (isDiagnostic()) return;
    const exercise = baseExercise();
    if (["choice", "order"].includes(exercise.kind)) return;
    if (exercise.kind === "trace" && format !== "write") {
      window.alert("Este exercício já é um teste de mesa. Use a tabela para acompanhar os valores."); return;
    }
    format = planning.safeFormat(exercise, format);
    if (format === "bug" && !engine.bugFor(exercise)) format = "fade";
    const oldFormat = formatFor(exercise.id);
    const willReplace = ["bug", "fade", "recall"].includes(format);
    if (userInitiated && oldFormat !== format && willReplace && answerFor(exercise.id).trim() && !window.confirm("Trocar a forma de treino substituirá a resposta atual. Continuar?")) return;
    if (mode === "coach") state.coach.formats[exercise.id] = format;
    else draft(exercise.id).format = format;
    if (format === "paper") { setPaperTranscribing(exercise.id, false); paperStartedAt = Date.now(); }
    if (format === "recall") startRecall();
    else prepareCurrentChallenge(willReplace || oldFormat !== format);
    save(); render();
  }

  function renderFormats(exercise) {
    const exam = mode === "exam";
    const micro = ["choice", "order"].includes(exercise.kind);
    const format = formatFor(exercise.id);
    $("format-tools").hidden = exam || micro || isDiagnostic();
    document.querySelectorAll(".format-button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.format === format));
      button.disabled = busy || exercise.kind === "trace" && button.dataset.format !== "write";
    });
    const descriptor = formats[format] || formats.write;
    $("format-title").textContent = descriptor[0]; $("format-description").textContent = descriptor[1];
    const challenge = format === "bug" ? engine.bugFor(exercise) : null;
    $("challenge-note").hidden = !challenge && format !== "fade" && format !== "recall";
    $("challenge-note").textContent = challenge ? "Pista do defeito: " + challenge.briefing : format === "fade" ? "Preencha os trechos marcados sem abrir a solução." : format === "recall" ? "A solução já foi escondida. Reconstrua o que conseguiu guardar." : "";
    const paperWaiting = !micro && format === "paper" && !isPaperTranscribing(exercise.id);
    $("paper-panel").hidden = !paperWaiting;
    $("editor-wrap").hidden = paperWaiting || micro;
    $("confidence-field").hidden = exam || paperWaiting;
    $("answer-actions").hidden = paperWaiting;
    if (paperWaiting && !paperStartedAt) paperStartedAt = Date.now();
  }

  function renderConfidence() {
    const confidence = mode === "exam" ? null : confidenceFor(activeId());
    document.querySelectorAll("[data-confidence]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.confidence) === confidence)));
  }

  function renderTraceRows(exercise) {
    const visible = exercise.kind === "trace" && mode !== "exam";
    $("trace-workbench").hidden = !visible;
    if (!visible) return;
    const rows = draft(exercise.id).traceRows;
    if (!rows.length) rows.push({ step: "", variables: "", output: "" });
    const body = $("trace-rows"); body.replaceChildren();
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      ["step", "variables", "output"].forEach(field => {
        const td = document.createElement("td"); const input = document.createElement("input");
        const names = { step: "Linha ou etapa", variables: "Variáveis", output: "Saída" };
        input.value = row[field] || ""; input.setAttribute("aria-label", names[field] + " da etapa " + (index + 1));
        input.addEventListener("input", () => { row[field] = input.value; scheduleSave(); });
        input.addEventListener("blur", save);
        td.append(input); tr.append(td);
      });
      const action = document.createElement("td"); const remove = element("button", "×", "icon-button");
      remove.type = "button"; remove.setAttribute("aria-label", "Remover etapa " + (index + 1));
      remove.onclick = () => { rows.splice(index, 1); save(); renderTraceRows(exercise); };
      action.append(remove); tr.append(action); body.append(tr);
    });
  }

  function renderCoachPanel() {
    const coach = mode === "coach";
    $("coach-panel").hidden = !coach;
    if (!coach) return;
    const diagnostic = isDiagnostic();
    const done = state.coach.ids.filter(id => diagnostic ? diagnosticAnswer(id) : state.coach.results[id]?.pass).length;
    const complete = diagnostic ? !!state.coach.finishedAt || done === state.coach.ids.length : done === state.coach.ids.length;
    const unit = state.coach.unitId ? curriculum.unitById[state.coach.unitId] : null;
    const sessionName = state.coach.type === "course" ? "Revisão de fundamentos" : state.coach.type === "diagnostic" ? "Diagnóstico da trilha" : unit ? "Treino · " + unit.short : "Seu treino do dia";
    $("coach-title").textContent = complete ? sessionName + " concluído" : sessionName;
    if (complete) $("coach-description").textContent = diagnostic
      ? "Diagnóstico guardado. Acertos, erros e respostas ainda não conhecidas ajudam a escolher o próximo passo."
      : "Você fechou a sequência. As revisões futuras já foram agendadas.";
    else if (diagnostic) $("coach-description").textContent = "11 atividades: 6 de escrita, 4 de leitura e 1 de ordenação. Verifique a primeira resposta ou marque Não sei ainda. Você pode continuar após um erro.";
    else if (state.coach.type === "course") $("coach-description").textContent = "12 questões para conectar estruturas, laços e funções e identificar o que merece mais prática.";
    else if (unit) $("coach-description").textContent = unit.description;
    else $("coach-description").textContent = "Questão atual: " + recommendationReason(baseExercise()) + ".";
    $("coach-progress").textContent = done + " de " + state.coach.ids.length + (diagnostic ? " guardadas" : "");
    $("finish-coach-item").hidden = complete || !diagnostic && !resultFor(activeId())?.pass;
    $("finish-coach-item").textContent = diagnostic ? diagnosticAnswer(activeId()) || resultFor(activeId()) ? "Guardar e continuar" : "Não sei ainda" : "Próxima questão";
    $("new-coach").textContent = diagnostic ? complete ? "Montar treino recomendado" : "Recomeçar diagnóstico" : complete ? "Nova sessão" : "Remontar treino";
    $("diagnostic-summary").hidden = !diagnostic || !complete;
    if (diagnostic && complete) {
      const summary = planning.summarizeDiagnostic(state.learning.diagnostic, exercises, curriculum.units);
      $("diagnostic-summary").textContent = summary.completed ? summary.independent + " de " + summary.total
        + " primeiras respostas corretas sem apoio. Próximo passo sugerido: " + focusUnit().title
        + ". Esta estimativa é provisória: uma questão por unidade não comprova consolidação. Corrigir depois continua sendo prática e preserva a primeira resposta."
        : "Esta sessão anterior não guardou as primeiras respostas. Seu progresso foi preservado; faça um novo diagnóstico para obter uma estimativa de ponto de partida.";
    }
  }

  function render() {
    const exercise = currentExercise();
    const exam = mode === "exam";
    const submitted = exam && !!state.exam.finishedAt;
    const list = currentList();
    const index = list.findIndex(item => item.id === exercise.id);
    $("coach-mode").setAttribute("aria-pressed", String(mode === "coach"));
    $("practice-mode").setAttribute("aria-pressed", String(mode === "practice"));
    $("exam-mode").setAttribute("aria-pressed", String(exam));
    $("exam-panel").hidden = !exam; renderCoachPanel();
    const coachNote = state.coach?.type === "diagnostic" ? "O diagnóstico guarda a primeira resposta. Errar ou marcar Não sei ainda permite continuar e indica o que praticar." : state.coach?.type === "unit" ? "Sessão focada em uma unidade da trilha." : "A sessão reserva espaço para revisão, recuperação de erros e avanço.";
    $("sidebar-note").textContent = exam ? (submitted ? "Correção liberada. Revise cada questão." : "Escreva as 6 respostas antes de corrigir.") : mode === "coach" ? coachNote : "Escolha livre ou deixe o treino do dia decidir por você.";
    const unit = curriculum.unitById[exercise.unit];
    $("exercise-meta").textContent = (exam ? "QUESTÃO " + (index + 1) + " · " : mode === "coach" ? "ETAPA " + (index + 1) + " · " : "") + String(unit.order).padStart(2, "0") + " · " + unit.title;
    $("exercise-title").textContent = exercise.title; $("exercise-prompt").textContent = exercise.prompt; $("exercise-rule").textContent = exercise.rule;
    renderSkills(exercise); renderExample(exercise);
    $("trace").hidden = exercise.kind !== "trace"; $("trace-code").textContent = exercise.code || "";
    renderChoice(exercise); renderOrder(exercise);
    $("answer-label").textContent = exercise.kind === "trace" ? "A saída que você prevê" : "Seu código";
    $("editor-type").textContent = exercise.kind === "trace" ? "Teste de mesa" : "Python 3";
    $("answer").value = answerFor(exercise.id);
    $("answer").placeholder = exercise.kind === "trace" ? "Escreva a saída, uma linha por vez…" : "Comece aqui, de memória…";
    $("answer").disabled = busy || submitted;
    $("editor-help").textContent = exercise.kind === "trace" ? "Escreva uma linha para cada saída prevista · Ctrl+Enter = verificar" : exam ? "Enter mantém o recuo · Use 4 espaços por bloco · A correção aparece ao concluir." : "Tab = 4 espaços · Enter mantém o recuo · Esc e depois Tab = sair do campo · Ctrl+Enter = verificar";
    renderFormats(exercise); renderConfidence(); renderTraceRows(exercise);
    $("runtime-status").hidden = ["choice", "order"].includes(exercise.kind);
    $("unit-filter").disabled = mode !== "practice";
    $("exercise-search").disabled = busy || mode !== "practice";
    $("exercise-status-filter").disabled = busy || mode !== "practice";
    $("check-button").hidden = exam; $("skeleton-button").hidden = exam || !["program", "function"].includes(exercise.kind) || formatFor(exercise.id) !== "write";
    $("retry-button").hidden = exam; $("new-variant").hidden = exam || !["program", "function"].includes(exercise.kind) || engine.materialize(exercise, 1) === exercise;
    $("study-tools").hidden = exam && !submitted;
    $("hint-details").open = false; $("solution-details").open = false;
    $("solution-code").textContent = exercise.solution; $("solution-note").textContent = exercise.note;
    studyWorkbench.render();
    $("reference-button").disabled = busy || (exam && !submitted);
    $("print-button").textContent = exam ? "Imprimir desafio" : "Imprimir exercício";
    $("position").textContent = index < 0 ? "Exercício aberto fora do filtro" : (index + 1) + " de " + list.length;
    $("previous-button").disabled = busy || index <= 0; $("next-button").disabled = busy || index < 0 || index === list.length - 1;
    $("finish-exam").hidden = submitted;
    if (exam) {
      $("exam-title").textContent = submitted ? "Simulado corrigido" : state.exam.course ? "Desafio de integração · 6 questões" : "Simulado de 6 questões";
      $("exam-description").textContent = submitted ? "Abra as questões para ver os testes e as soluções. O tempo abaixo é o total até a entrega." : "Sem dicas e sem correção entre questões. O relógio mede seu tempo; não há limite.";
      $("exam-summary").hidden = !submitted;
      if (submitted) {
        const count = state.exam.ids.filter(id => state.exam.results[id]?.pass).length;
        $("exam-summary").textContent = count + "/6 questões corretas. " + (count === 6 ? "Agora repita no papel, sem consultar." : "As dificuldades também entraram no seu treino recomendado.");
      }
    }
    renderNavigation(); renderState(); renderFeedback(resultFor(exercise.id), exercise); updateClocks(); updateMistakeBadge(); renderContinueStudy();
  }

  function appendError(container, error) {
    container.append(element("p", error.kind + (error.line ? " · linha " + error.line : ""), "error-text"));
    container.append(element("pre", error.message));
    if (errorTips[error.kind]) container.append(element("p", errorTips[error.kind]));
  }

  function renderFeedback(result, exercise) {
    const container = $("feedback"); container.replaceChildren(); container.hidden = !result;
    const errorLine = result?.error?.line || result?.cases?.find(item => !item.pass && item.error?.line)?.error.line || null;
    codeEditor.sync({ codeMode: ["program", "function"].includes(exercise.kind), errorLine });
    if (!result) return;
    container.append(element("h3", result.pass ? "Passou. Agora tente repetir de memória." : "Ainda tem algo para ajustar.", result.pass ? "success-text" : "error-text"));
    if (result.error) appendError(container, result.error);
    if (result.rules?.length) result.rules.forEach(rule => container.append(element("p", rule, "error-text")));
    const results = result.cases || [];
    if (results.length) container.append(element("p", results.filter(item => item.pass).length + "/" + results.length + " casos passaram."));
    results.forEach((item, index) => {
      const details = element("details"); details.open = !item.pass;
      details.append(element("summary", (item.pass ? "✓" : "↺") + " Caso " + (index + 1)));
      if (["program", "function"].includes(exercise.kind)) {
        const test = exercise.cases[index];
        const input = exercise.kind === "function" ? exercise.fn + "(" + test.args.map(pyRepr).join(", ") + ")" : test.inputs.join("\n") || "Sem entrada";
        details.append(element("pre", (exercise.kind === "function" ? "Chamada: " : "Entrada:\n") + input));
      }
      if (item.error) appendError(details, item.error);
      else {
        details.append(window.CodeEditor.comparison(item.expected, item.got, item));
        if (item.got === "None" && !item.pass && exercise.kind === "function") details.append(element("p", "A função devolveu None. Faltou return? print() não devolve o resultado."));
        if (item.changed) details.append(element("p", "A lista recebida foi alterada. Crie outra lista para devolver."));
        if (item.stdout) details.append(element("pre", "Seu print mostrou (não é o retorno):\n" + item.stdout));
      }
      container.append(details);
    });
    if (!result.pass && result.learningDiagnosis) {
      const insight = element("section", undefined, "feedback-insight");
      insight.append(element("strong", result.learningDiagnosis.title), element("p", result.learningDiagnosis.tip));
      if (result.learningDiagnosis.detail) insight.append(element("p", result.learningDiagnosis.detail, "small muted"));
      container.append(insight);
    }
    if (result.learning) {
      if (result.pass) container.append(element("p", "Domínio deste exercício: " + result.learning.mastery + "%" + (result.learning.dueAt ? " · próxima revisão em " + formatDate(result.learning.dueAt) : "") + ".", "learning-note"));
      if (result.pass && result.learning.credit === false) container.append(element("p", result.learning.reason, "learning-note"));
      if (result.learning.confidence === 3 && !result.pass) container.append(element("p", "Você marcou “tenho certeza”, mas o teste falhou. Ótimo sinal para revisar: havia uma falsa sensação de domínio.", "calibration-note"));
      if (result.learning.confidence === 1 && result.pass) container.append(element("p", "Você acertou mesmo inseguro. Sua compreensão está à frente da sua confiança.", "calibration-note"));
    }
    if (result.pass && (result.learning?.helped ?? helpedFor(exercise.id))) container.append(element("p", "Você usou apoio nesta tentativa. Refazer sem consulta consolida melhor."));
  }

  function setBusy(value) {
    busy = value;
    studyWorkbench.setBusy(value);
    document.querySelectorAll("[data-project]").forEach(button => { button.disabled = value; });
    ["check-button", "skeleton-button", "retry-button", "new-variant", "practice-mode", "coach-mode", "exam-mode", "finish-exam", "new-exam", "print-button", "new-coach", "continue-study-button", "daily-study-button", "diagnostic-study-button", "course-review-button", "course-exam-button", "clear-exercise-filters", "curriculum-button", "learning-button", "mistakes-button", "finish-coach-item", "clear-data", "confirm-import", "add-trace-row", "paper-transcribe"].forEach(id => { if ($(id)) $(id).disabled = value; });
    document.querySelectorAll(".format-button, [data-confidence], .choice-option, #order-lines button").forEach(button => { button.disabled = value; });
    if (!value) { renderFormats(currentExercise()); renderOrder(currentExercise()); }
    $("unit-filter").disabled = value || mode !== "practice";
    $("exercise-search").disabled = value || mode !== "practice";
    $("exercise-status-filter").disabled = value || mode !== "practice";
    $("stop-button").hidden = !value; $("answer").disabled = value || (mode === "exam" && !!state.exam.finishedAt);
    $("reference-button").disabled = value || (mode === "exam" && !state.exam.finishedAt);
    renderNavigation();
  }

  async function grade(exercise, code) {
    if (!code.trim()) return { pass: false, cases: [], error: { kind: "Resposta em branco", message: "Escreva sua resposta antes de conferir." } };
    if (exercise.kind === "choice") {
      const selected = exercise.options.find(option => option.value === code);
      const expected = exercise.options.find(option => option.value === exercise.answer);
      const pass = code === exercise.answer;
      return { pass, cases: [{ pass, got: selected?.label || code, expected: expected?.label || exercise.answer }] };
    }
    if (exercise.kind === "order") {
      const pass = normal(code) === normal(exercise.answer);
      return { pass, cases: [{ pass, got: normal(code), expected: exercise.answer }] };
    }
    if (exercise.kind === "trace") {
      const pass = normal(code) === normal(exercise.answer);
      return { pass, cases: [{ pass, got: normal(code), expected: exercise.answer }] };
    }
    return window.PythonRunner.run(exercise, code);
  }

  async function checkAnswer() {
    if (busy || mode === "exam") return;
    const exercise = currentExercise(); const code = answerFor(exercise.id);
    const submittedMode = mode;
    const submission = {
      source: mode, roundId: roundIdFor(exercise.id), helped: helpedFor(exercise.id), confidence: confidenceFor(exercise.id),
      roundAttempts: mode === "practice" ? draft(exercise.id).roundAttempts : state.coach.roundAttempts[exercise.id],
      diagnosticSessionId: isDiagnostic() ? state.coach.id : null
    };
    setBusy(true); $("check-button").textContent = "Verificando…"; $("feedback").hidden = true;
    try {
      const result = await grade(exercise, code);
      if (mode !== submittedMode || activeId() !== exercise.id || roundIdFor(exercise.id) !== submission.roundId) throw new Error("A resposta mudou durante a correção. Verifique novamente para corrigir a tentativa atual.");
      recordAttempt(exercise, result, code, { ...submission, helped: submission.helped || helpedFor(exercise.id) });
      setResult(exercise.id, result);
      if (mode === "practice") draft(exercise.id).roundAttempts += 1;
      else state.coach.roundAttempts[exercise.id] += 1;
      if (mode === "coach") finishCoachIfNeeded();
      save(); renderFeedback(result, exercise); renderContinueStudy();
    } catch (error) {
      $("feedback").replaceChildren(element("p", error.message, "error-text")); $("feedback").hidden = false;
    } finally {
      setBusy(false); $("check-button").textContent = "Verificar resposta"; renderState(); renderNavigation(); renderCoachPanel(); updateMistakeBadge();
    }
  }

  function createExam(course = false) {
    if (busy) return;
    const codeExercises = exercises.filter(exercise => ["program", "function"].includes(exercise.kind));
    const focusOrder = focusUnit().order;
    const visibleOrder = Math.max(5, focusOrder + 2);
    const eligibleUnits = curriculum.units.filter(unit => unit.order <= visibleOrder);
    const ids = [];
    const choose = pool => pool[Math.floor(Math.random() * pool.length)];
    if (course) window.COURSE_REVIEW.examPools.forEach(pool => ids.push(choose(pool)));
    else eligibleUnits.forEach(unit => {
      const pool = codeExercises.filter(exercise => exercise.unit === unit.id && !ids.includes(exercise.id));
      if (pool.length && ids.length < 6) ids.push(choose(pool).id);
    });
    const remaining = codeExercises.filter(exercise => !ids.includes(exercise.id));
    while (ids.length < 6 && remaining.length) {
      const picked = choose(remaining); ids.push(picked.id); remaining.splice(remaining.indexOf(picked), 1);
    }
    state.exam = normalizeExam({ ids, course, activeId: ids[0], answers: {}, results: {}, variants: Object.fromEntries(ids.map(id => [id, Date.now() % 100000 + ids.indexOf(id)])), startedAt: Date.now(), finishedAt: null });
    save();
  }

  async function finishExam() {
    if (busy || state.exam.finishedAt) return;
    const blanks = state.exam.ids.filter(id => !state.exam.answers[id].trim()).length;
    if (!window.confirm("Entregar as 6 respostas e liberar a correção?" + (blanks ? " Há " + blanks + " questão(ões) em branco." : ""))) return;
    const submittedAt = Date.now(); cancelled = false; setBusy(true); state.exam.results = {}; $("exam-summary").hidden = false;
    try {
      for (const [index, id] of state.exam.ids.entries()) {
        if (cancelled) throw new Error("Correção interrompida. Suas respostas estão guardadas; você pode entregar novamente.");
        $("exam-summary").textContent = "Corrigindo questão " + (index + 1) + " de 6…";
        const exercise = engine.materialize(byId.get(id), state.exam.variants[id]);
        const result = await grade(exercise, state.exam.answers[id]);
        state.exam.results[id] = result;
        recordAttempt(exercise, result, state.exam.answers[id], { source: "exam", helped: false, confidence: null, roundAttempts: 0, roundId: "exam-" + state.exam.startedAt + "-" + id });
      }
      state.exam.finishedAt = submittedAt; save(); render();
    } catch (error) {
      state.exam.results = {}; save(); $("exam-summary").textContent = error.message + " O simulado ainda não foi entregue.";
    } finally { setBusy(false); }
  }

  function updateClocks() {
    if (mode === "exam") {
      const seconds = Math.max(0, Math.floor(((state.exam.finishedAt || Date.now()) - state.exam.startedAt) / 1000));
      $("exam-clock").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    }
    if (!$("paper-panel").hidden && paperStartedAt) {
      const seconds = Math.max(0, Math.floor((Date.now() - paperStartedAt) / 1000));
      $("paper-clock").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    }
  }

  function buildPrintSheet() {
    const sheet = $("print-sheet"); sheet.replaceChildren();
    const heading = element("div", undefined, "print-heading");
    heading.append(element("h1", "Python, de cabeça."), element("p", "Nome: ____________________________________    Data: ____/____/______"), element("p", "Escreva à mão, sem consulta. Confira nomes, dois-pontos, recuos e a posição do return.")); sheet.append(heading);
    const selected = mode === "exam" ? currentList() : [currentExercise()];
    selected.forEach((exercise, index) => {
      const block = element("article", undefined, "print-exercise");
      block.append(element("h2", (index + 1) + ". " + exercise.title), element("p", exercise.prompt), element("p", exercise.rule));
      if (exercise.kind === "trace") block.append(element("pre", exercise.code));
      else if (["program", "function"].includes(exercise.kind)) {
        const test = exercise.cases[0];
        const input = exercise.kind === "function" ? exercise.fn + "(" + test.args.map(pyRepr).join(", ") + ")" : test.inputs.join(", ") || "sem entrada";
        block.append(element("pre", "Exemplo: " + input + " → " + (exercise.kind === "function" ? pyRepr(test.expected) : test.expected.replace(/\n/g, " / "))));
      } else if (exercise.kind === "choice") exercise.options.forEach((option, optionIndex) => block.append(element("p", String.fromCharCode(65 + optionIndex) + ") " + option.label)));
      else if (exercise.kind === "order") block.append(element("p", "Numere as etapas na ordem correta:"), ...shuffledOrder(exercise).map(line => element("p", "(   ) " + line)));
      const lines = element("div", undefined, "writing-lines"); for (let i = 0; i < 9; i++) lines.append(element("span"));
      block.append(lines); sheet.append(block);
    });
  }

  function updateMistakeBadge() {
    const count = state.learning.mistakes.filter(item => !item.resolvedAt).length;
    $("mistakes-count").hidden = !count; $("mistakes-count").textContent = count;
  }

  function openUnit(unitId) {
    if (busy) return;
    unitFilter = unitId;
    $("unit-filter").value = unitId;
    setMode("practice");
    searchQuery = ""; statusFilter = "all"; $("exercise-search").value = ""; $("exercise-status-filter").value = "all";
    const first = exercises.find(exercise => exercise.unit === unitId);
    if (first) state.activeId = first.id;
    if ($("curriculum-dialog").open) $("curriculum-dialog").close();
    save(); render();
    $("exercise-title").focus({ preventScroll: true });
  }

  function renderCurriculum() {
    const focus = focusUnit();
    const focusStats = unitStats(focus.id);
    const diagnostic = planning.summarizeDiagnostic(state.learning.diagnostic, exercises, curriculum.units);
    const recommendation = $("current-unit-card"); recommendation.replaceChildren();
    const recommendationText = element("div");
    recommendationText.append(
      element("p", "UNIDADE RECOMENDADA · " + String(focus.order).padStart(2, "0"), "eyebrow"),
      element("h3", focus.title),
      element("p", focus.description + " " + focusStats.attempted + " de " + focusStats.total + " atividades praticadas; "
        + focusStats.independent + " com acerto sem apoio.")
    );
    if (diagnostic.completed && !focusStats.complete) recommendationText.append(element("p",
      "O diagnóstico também orienta este ponto de partida. A estimativa é provisória e será confirmada em mais atividades e revisões.", "small muted"));
    const recommendationButton = element("button", "Treinar esta unidade", "primary"); recommendationButton.type = "button";
    recommendationButton.onclick = () => { $("curriculum-dialog").close(); startUnit(focus.id); };
    recommendation.append(recommendationText, recommendationButton);

    const list = $("curriculum-list"); list.replaceChildren();
    curriculum.units.forEach(unit => {
      const stats = unitStats(unit.id); const unlocked = unitUnlocked(unit);
      const provisional = diagnostic.completed && diagnostic.rows.some(row => row.unitId === unit.id && row.independent) && !stats.complete;
      const card = element("article", undefined, "curriculum-card" + (stats.complete ? " complete" : unit.id === focus.id ? " current" : ""));
      card.dataset.unit = unit.id;
      const heading = element("div", undefined, "curriculum-card-heading");
      const title = element("div");
      title.append(element("span", String(unit.order).padStart(2, "0"), "curriculum-number"), element("h3", unit.title));
      const status = stats.complete ? "Consolidação inicial" : unit.id === focus.id ? "Em foco" : provisional ? "Estimativa do diagnóstico" : unlocked ? "Disponível" : "Preparar fundamentos";
      heading.append(title, element("span", status, "curriculum-status"));
      const measures = element("div", undefined, "learning-measures");
      [["Cobertura", stats.coverage], ["Indicador de autonomia", stats.autonomy]].forEach(([label, value]) => {
        const measure = element("div"); const meter = element("div", undefined, "unit-meter");
        const fill = element("span"); fill.style.width = value + "%"; meter.append(fill); meter.setAttribute("aria-hidden", "true");
        measure.append(element("span", label + ": " + value + "%", "small"), meter); measures.append(measure);
      });
      const concepts = element("ul", undefined, "concept-list"); unit.concepts.forEach(concept => concepts.append(element("li", concept)));
      const prerequisites = unit.prerequisites.length
        ? "Pré-requisitos: " + unit.prerequisites.map(id => curriculum.unitById[id].short).join(" + ")
        : "Ponto de partida: nenhum pré-requisito.";
      const actions = element("div", undefined, "curriculum-card-actions");
      const open = element("button", "Ver " + stats.total + " exercícios", "quiet curriculum-open"); open.type = "button"; open.onclick = () => openUnit(unit.id);
      const train = element("button", "Treinar 5 etapas", "quiet curriculum-train"); train.type = "button"; train.onclick = () => { $("curriculum-dialog").close(); startUnit(unit.id); };
      actions.append(open, train);
      card.append(heading, element("p", unit.description, "curriculum-description"), concepts, measures,
        element("p", stats.attempted + "/" + stats.total + " atividades praticadas · " + stats.independent + " com acerto sem apoio. Meta inicial: "
          + stats.target + " práticas, ao menos " + Math.min(3, stats.target) + " acertos sem apoio e indicador de 55%. " + prerequisites, "small muted"), actions);
      list.append(card);
    });
  }

  function populateUnitFilter() {
    curriculum.units.forEach(unit => {
      const option = element("option", String(unit.order).padStart(2, "0") + " · " + unit.short);
      option.value = unit.id; $("unit-filter").append(option);
    });
    $("unit-filter").value = unitFilter;
  }

  function renderLearningDashboard() {
    const attempts = state.learning.attempts; const passes = attempts.filter(item => item.pass).length;
    const overall = planning.stats(exercises, state.learning);
    const stats = [
      [String(attempts.length), "tentativas registradas"],
      [overall.coverage + "%", "cobertura do catálogo"],
      [overall.autonomy + "%", "indicador de autonomia"],
      [String(overall.independent), "atividades com acerto sem apoio"],
      [attempts.length ? Math.round(passes / attempts.length * 100) + "%" : "—", "taxa de acerto"],
      [String(state.learning.streak.days || 0), "dias na sequência"]
    ];
    const statsContainer = $("learning-stats"); statsContainer.replaceChildren();
    stats.forEach(([value, label]) => { const card = element("div", undefined, "stat-card"); card.append(element("strong", value), element("span", label)); statsContainer.append(card); });
    const recommendation = planning.selectSession(exercises, curriculum.units, state.learning, { now: Date.now() })[0]?.exercise || exercises[0];
    $("recommendation-title").textContent = recommendation.title;
    $("recommendation-text").textContent = "Comece por " + recommendationReason(recommendation)
      + ". Cinco atividades reservam espaço para revisões, recuperação de erros e conteúdo novo, conforme seu histórico. Erros repetidos na mesma atividade têm peso limitado.";
    const due = dueExercises().length; $("due-summary").textContent = due ? due + " revisão(ões) vencida(s)" : "Revisões em dia";
    const map = $("skill-map"); map.replaceChildren();
    engine.skills.forEach(skill => {
      const evidence = planning.skillStats(skill.id, exercises, state.learning); const card = element("article", undefined, "skill-card");
      const top = element("div", undefined, "skill-card-heading"); top.append(element("strong", skill.name), element("span", evidence.autonomy + "%"));
      const meter = element("div", undefined, "mastery-meter"); const fill = element("span"); fill.style.width = evidence.autonomy + "%"; meter.append(fill); meter.setAttribute("aria-hidden", "true");
      card.append(top, meter, element("p", "Indicador de autonomia entre as atividades praticadas."),
        element("p", "Cobertura: " + evidence.attempted + "/" + evidence.total + " (" + evidence.coverage + "%) · " + evidence.independent + " com acerto sem apoio."),
        element("p", skill.description)); map.append(card);
    });
    const activity = $("recent-activity"); activity.replaceChildren();
    const recent = attempts.slice(-8).reverse();
    if (!recent.length) activity.append(element("p", "Ainda não há tentativas. Seu primeiro acerto já começa a montar este painel.", "empty-state"));
    recent.forEach(item => {
      const row = element("div", undefined, "activity-row");
      row.append(element("span", item.pass ? "✓" : "↺", item.pass ? "success-text" : "error-text"), element("strong", item.title), element("span", item.pass ? "Acertou" : "Revisar"), element("time", formatTime(item.at))); activity.append(row);
    });
  }

  function renderMistakes() {
    const unresolved = state.learning.mistakes.filter(item => !item.resolvedAt).reverse();
    const patterns = new Map();
    unresolved.forEach(item => patterns.set(item.categoryTitle, (patterns.get(item.categoryTitle) || 0) + 1));
    const patternContainer = $("mistake-patterns"); patternContainer.replaceChildren();
    if (!patterns.size) patternContainer.append(element("p", "Nenhum erro pendente. Quando algo falhar, o diagnóstico aparecerá aqui.", "empty-state"));
    [...patterns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([title, count]) => {
      const card = element("div", undefined, "pattern-card"); card.append(element("strong", String(count)), element("span", title)); patternContainer.append(card);
    });
    const list = $("mistake-list"); list.replaceChildren();
    unresolved.slice(0, 40).forEach(item => {
      const details = element("details", undefined, "mistake-entry");
      const summary = element("summary"); summary.append(element("strong", item.title), element("span", item.categoryTitle + " · " + formatTime(item.createdAt))); details.append(summary);
      details.append(element("p", item.tip));
      if (item.detail) details.append(element("p", item.detail, "small muted"));
      if (item.code) details.append(element("pre", item.code));
      const label = element("label", "Qual era sua hipótese? Que caso confirma a correção?");
      const note = element("textarea"); note.id = "mistake-note-" + item.id; note.maxLength = 8000; note.rows = 3;
      note.value = item.reflection || ""; label.htmlFor = note.id;
      note.oninput = () => { item.reflection = note.value; scheduleSave(); }; note.onblur = save;
      details.append(label, note);
      function recoverError(fromMemory) {
        if (busy) return;
        $("mistakes-dialog").close(); setMode("practice"); clearExerciseFilters();
        const target = draft(item.exerciseId);
        target.variantSeed = item.variantSeed || 0; target.format = "write"; target.code = fromMemory ? "" : item.code || "";
        target.result = null; target.challengeKey = ""; target.hintsLevel = 0;
        restartRound(item.exerciseId); navigate(item.exerciseId);
      }
      const retry = element("button", "Investigar este erro", "primary"); retry.type = "button"; retry.onclick = () => recoverError(false);
      const recall = element("button", "Refazer sem consulta", "quiet"); recall.type = "button"; recall.onclick = () => recoverError(true);
      details.append(retry, recall); list.append(details);
    });
  }

  function exportData() {
    if (saveTimer !== null) save();
    const payload = { app: "python-de-cabeca", exportedAt: new Date().toISOString(), version: 4, state: storage.exportState(state) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "python-de-cabeca-backup-" + dateKey() + ".json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); $("data-status").textContent = "Backup exportado. Guarde o arquivo em um local seguro.";
  }

  async function importData(file) {
    const request = ++importRequest;
    pendingImport = null; $("import-preview").hidden = true;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("O backup excede o limite de 5 MB.");
      const payload = JSON.parse(await file.text());
      if (request !== importRequest) return;
      pendingImport = window.PROGRESS_ENGINE.validateBackup(payload, exercises);
      const imported = pendingImport.state;
      const drafts = Object.values(imported.drafts || {}).filter(item => item.code?.trim()).length;
      const attempts = imported.learning?.attempts?.length || 0;
      const mistakes = imported.learning?.mistakes?.filter(item => !item.resolvedAt).length || 0;
      $("import-summary").textContent = drafts + " rascunho(s), " + attempts + " tentativa(s) no histórico e " + mistakes + " erro(s) pendente(s).";
      $("import-warning").textContent = ["A importação substitui o progresso atual deste navegador. Exporte uma cópia antes de continuar.", ...(pendingImport.warnings || [])].join(" ");
      $("import-preview").hidden = false;
      $("data-status").textContent = "Backup validado. Confira o resumo antes de importar.";
    } catch (error) {
      if (request === importRequest) $("data-status").textContent = "Não foi possível importar: " + error.message;
    } finally { if (request === importRequest) $("import-data").value = ""; }
  }

  function cancelImport() {
    importRequest += 1; pendingImport = null; $("import-preview").hidden = true; $("import-data").value = "";
  }

  function confirmImport() {
    if (!pendingImport || busy) return;
    clearTimeout(saveTimer); saveTimer = null;
    const result = storage.replace(pendingImport.state);
    if (result.ok) window.location.reload();
    else { lastStorageResult = result; renderStorageStatus(); $("data-status").textContent = result.message; }
  }

  function resetCurrent() {
    if (busy || mode === "exam") return;
    const id = activeId();
    if (answerFor(id).trim() && !window.confirm("Apagar esta resposta e tentar novamente do zero?")) return;
    if (mode === "coach") {
      state.coach.answers[id] = ""; state.coach.results[id] = null; state.coach.helped[id] = false; state.coach.confidence[id] = null; state.coach.prepared[id] = ""; state.coach.paperTranscribing[id] = false;
    } else {
      const previous = draft(id);
      state.drafts[id] = normalizeDraft({ variantSeed: previous.variantSeed, format: previous.format,
        reflection: previous.reflection, experimentInput: previous.experimentInput, experimentPrediction: previous.experimentPrediction }, byId.get(id));
    }
    restartRound(id);
    prepareCurrentChallenge(); save(); render(); if (!$("editor-wrap").hidden) $("answer").focus();
  }

  function nextVariant() {
    if (busy || mode === "exam") return;
    const id = activeId();
    if (answerFor(id).trim() && !window.confirm("Gerar outra variação e apagar a resposta atual?")) return;
    if (mode === "coach") { state.coach.variants[id] += 1; state.coach.answers[id] = ""; state.coach.results[id] = null; state.coach.prepared[id] = ""; }
    else { draft(id).variantSeed += 1; draft(id).code = ""; draft(id).result = null; draft(id).challengeKey = ""; draft(id).roundAttempts = 0; }
    restartRound(id);
    prepareCurrentChallenge(); save(); render();
  }

  $("answer").addEventListener("input", recordInput);
  $("answer").addEventListener("blur", () => { if (saveTimer !== null) save(); });
  $("answer").addEventListener("keydown", event => {
    if (event.key === "Escape") { escapeTab = true; return; }
    if (event.key === "Tab" && escapeTab) { escapeTab = false; return; }
    escapeTab = false;
    if (event.key === "Tab" && !event.shiftKey && !$("answer").disabled) {
      event.preventDefault(); const field = $("answer"); field.setRangeText("    ", field.selectionStart, field.selectionEnd, "end"); recordInput();
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && mode !== "exam") { event.preventDefault(); checkAnswer(); }
  });
  $("check-button").onclick = checkAnswer;
  $("stop-button").onclick = () => { cancelled = true; window.PythonRunner.stop(); };
  $("skeleton-button").onclick = () => {
    if (answerFor(activeId()).trim() && !window.confirm("Substituir o rascunho pelo começo sugerido?")) return;
    setAnswer(activeId(), currentExercise().starter); setResult(activeId(), null); markHelp(); save(); render(); $("answer").focus();
  };
  $("retry-button").onclick = resetCurrent; $("new-variant").onclick = nextVariant;
  $("solution-details").addEventListener("toggle", () => { if ($("solution-details").open) markHelp(); });
  document.querySelectorAll("[data-project]").forEach(button => button.onclick = () => {
    if (busy) return;
    setMode("practice"); clearExerciseFilters(); navigate(button.dataset.project);
    $("project-details").open = true; $("project-details").scrollIntoView({ block: "start", behavior: "smooth" });
  });
  document.querySelectorAll(".format-button").forEach(button => button.onclick = () => applyFormat(button.dataset.format));
  document.querySelectorAll("[data-confidence]").forEach(button => button.onclick = () => setConfidence(Number(button.dataset.confidence)));
  $("paper-print").onclick = () => { buildPrintSheet(); window.print(); };
  $("paper-transcribe").onclick = () => { setPaperTranscribing(activeId(), true); save(); render(); $("answer").focus(); };
  $("add-trace-row").onclick = () => { draft(activeId()).traceRows.push({ step: "", variables: "", output: "" }); save(); renderTraceRows(currentExercise()); };
  $("hide-recall").onclick = hideRecall;
  $("reference-button").onclick = () => { markHelp(); $("reference-dialog").showModal(); };
  $("close-reference").onclick = () => $("reference-dialog").close();
  $("learning-button").onclick = () => { renderLearningDashboard(); $("learning-dialog").showModal(); };
  $("close-learning").onclick = () => $("learning-dialog").close();
  $("mistakes-button").onclick = () => { renderMistakes(); $("mistakes-dialog").showModal(); };
  $("close-mistakes").onclick = () => $("mistakes-dialog").close();
  $("data-button").onclick = () => { renderStorageStatus(); $("data-status").textContent = lastStorageResult?.message || ""; $("data-dialog").showModal(); };
  $("open-storage-data").onclick = () => $("data-button").click();
  function exportRecovery(raw, name) {
    if (raw === null) return;
    const url = URL.createObjectURL(new Blob([raw], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = name + "-" + dateKey() + ".txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("data-status").textContent = "Conteúdo exportado sem modificações para recuperação.";
  }
  $("export-original").onclick = () => exportRecovery(storage.exportOriginal(), "python-de-cabeca-original");
  $("export-archive").onclick = () => exportRecovery(storage.exportArchive(), "python-de-cabeca-recuperacao");
  $("recover-valid").onclick = () => {
    const result = storage.recover();
    if (result.ok) window.location.reload();
    else $("data-status").textContent = result.message;
  };
  $("reload-progress").onclick = () => { if (window.confirm("Recarregar descarta as alterações que estão somente nesta aba. Exporte-as antes, se precisar. Continuar?")) window.location.reload(); };
  $("close-data").onclick = () => $("data-dialog").close();
  $("data-dialog").addEventListener("close", cancelImport);
  $("export-data").onclick = exportData;
  $("import-data").addEventListener("change", event => { if (event.target.files[0]) importData(event.target.files[0]); });
  $("confirm-import").onclick = confirmImport;
  $("cancel-import").onclick = () => { cancelImport(); $("data-status").textContent = "Importação cancelada. Seu progresso foi mantido."; };
  $("export-before-import").onclick = exportData;
  $("clear-data").onclick = () => {
    if (!window.confirm("Apagar rascunhos, histórico, erros e domínio deste navegador? Arquivos de recuperação anteriores serão preservados em Dados e backup.")) return;
    clearTimeout(saveTimer); saveTimer = null;
    const result = storage.clear();
    if (result.ok) window.location.reload();
    else $("data-status").textContent = result.message;
  };
  $("start-recommended").onclick = () => { $("learning-dialog").close(); startCoach(false); };
  $("curriculum-button").onclick = () => { renderCurriculum(); $("curriculum-dialog").showModal(); };
  $("close-curriculum").onclick = () => $("curriculum-dialog").close();
  $("start-diagnostic").onclick = () => { $("curriculum-dialog").close(); startDiagnostic(); };
  $("unit-filter").addEventListener("change", event => {
    unitFilter = event.target.value;
    applyExerciseFilters();
  });
  $("exercise-search").addEventListener("input", event => { searchQuery = event.target.value; applyExerciseFilters(); });
  $("exercise-status-filter").addEventListener("change", event => { statusFilter = event.target.value; applyExerciseFilters(); });
  $("clear-exercise-filters").onclick = () => { clearExerciseFilters(); applyExerciseFilters(); };
  $("continue-study-button").onclick = continueStudy;
  $("daily-study-button").onclick = () => { if (!busy) { startCoach(false); $("exercise-title").focus(); } };
  $("diagnostic-study-button").onclick = () => { if (!busy) { startDiagnostic(); $("exercise-title").focus(); } };
  $("coach-mode").onclick = () => startCoach(false);
  $("practice-mode").onclick = () => { setMode("practice"); save(); render(); };
  $("exam-mode").onclick = () => { if (!state.exam) createExam(); setMode("exam"); save(); render(); };
  $("new-coach").onclick = () => {
    if (isDiagnostic() && !state.coach.finishedAt) { startDiagnostic(); return; }
    if (state.coach && !state.coach.finishedAt && !window.confirm("Remontar a sessão atual com novas prioridades?")) return;
    startCoach(true);
  };
  $("finish-coach-item").onclick = nextCoachItem;
  $("new-exam").onclick = () => { if (!window.confirm("Gerar outro simulado? As respostas do simulado atual serão substituídas.")) return; createExam(state.exam?.course); render(); };
  $("course-exam-button").onclick = () => {
    if (busy) return;
    if (state.exam && !state.exam.finishedAt && !window.confirm("Substituir o simulado atual por um desafio de integração?")) return;
    createExam(true); setMode("exam"); save(); render();
  };
  $("course-review-button").onclick = () => {
    if (busy) return;
    if (state.coach && !state.coach.finishedAt && !window.confirm("Substituir a sessão atual pela revisão de fundamentos?")) return;
    state.coach = normalizeCoach({ type: "course", ids: window.COURSE_REVIEW.reviewIds.slice(), activeId: window.COURSE_REVIEW.reviewIds[0], startedAt: Date.now(), finishedAt: null, answers: {}, results: {}, variants: {} });
    setMode("coach"); save(); render();
  };
  $("finish-exam").onclick = finishExam;
  $("previous-button").onclick = () => { const list = currentList(); const index = list.findIndex(item => item.id === activeId()); if (index > 0) navigate(list[index - 1].id); };
  $("next-button").onclick = () => { const list = currentList(); const index = list.findIndex(item => item.id === activeId()); if (index >= 0 && list[index + 1]) navigate(list[index + 1].id); };
  $("print-button").onclick = () => { buildPrintSheet(); window.print(); };
  window.addEventListener("beforeprint", buildPrintSheet);
  window.PythonRunner.setStatus(message => { $("runtime-status").textContent = message; });
  const mobileLayout = window.matchMedia("(max-width: 800px)");
  $("exercise-catalog").open = !mobileLayout.matches;
  mobileLayout.addEventListener("change", event => { $("exercise-catalog").open = !event.matches; });
  function renderConnection() {
    $("connection-status").hidden = navigator.onLine;
    $("connection-status").textContent = "Sem internet: alternativas, ordenação e leitura de código continuam funcionando. Programas podem ser corrigidos se Python já foi carregado nesta aba.";
  }
  window.addEventListener("online", renderConnection);
  window.addEventListener("offline", renderConnection);
  window.addEventListener("storage", event => {
    if (event.key === storageKey || event.key === null) {
      const check = storage.check();
      if (!check.ok) { lastStorageResult = check; renderStorageStatus(); }
    }
  });
  window.addEventListener("pagehide", () => { if (saveTimer !== null) save(); });
  renderConnection();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(() => {});
  setInterval(updateClocks, 1000);
  populateUnitFilter();
  render(); save();
})();
