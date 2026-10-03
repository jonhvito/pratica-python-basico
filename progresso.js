/* Regras de progresso e de backup, sem dependências da interface. */
(function (root) {
  "use strict";

  const DAY = 86400000;
  const INTERVALS = [1, 1, 3, 7, 15, 30];
  const FORMATS = ["write", "fade", "bug", "recall", "paper"];
  const MODES = ["practice", "coach", "exam"];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  const finite = number => typeof number === "number" && Number.isFinite(number);
  const count = number => Number.isSafeInteger(number) && number >= 0;
  const stamp = number => finite(number) && number >= 0 && number <= 8640000000000000;
  const dayKey = timestamp => {
    const date = new Date(timestamp);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };

  function applyAttempt(previous = {}, options = {}) {
    const now = options.now === undefined ? Date.now() : options.now;
    if (!stamp(now)) throw new Error("Horário da tentativa inválido.");
    const pass = options.pass === true;
    const roundId = String(options.roundId || "legacy-round");
    const variantKey = String(options.variantSeed ?? 0);
    const record = {
      ...previous,
      attempts: (count(previous.attempts) ? previous.attempts : 0) + 1,
      passes: (count(previous.passes) ? previous.passes : 0) + (pass ? 1 : 0),
      helpedPasses: count(previous.helpedPasses) ? previous.helpedPasses : 0,
      mastery: finite(previous.mastery) ? clamp(previous.mastery, 0, 100) : 0,
      streak: count(previous.streak) ? previous.streak : 0,
      interval: count(previous.interval) ? clamp(previous.interval, 0, 5) : 0,
      dueAt: stamp(previous.dueAt) ? previous.dueAt : null,
      lastAt: now,
      lastCreditAt: stamp(previous.lastCreditAt) ? previous.lastCreditAt : null,
      roundHistory: Array.isArray(previous.roundHistory) ? previous.roundHistory.map(item => ({ ...item })) : [],
      creditHistory: Array.isArray(previous.creditHistory) ? previous.creditHistory.map(item => ({ ...item })) : [],
      credit: false,
      reason: "round-completed"
    };
    let round = record.roundHistory.find(item => item.id === roundId);
    if (!round) {
      round = { id: roundId, helped: false, completed: false, failed: false, credited: false, at: now };
      record.roundHistory.push(round);
    }
    round.helped = round.helped || options.helped === true;
    if (pass && round.helped) record.helpedPasses += 1;
    // Toda rodada concluída fica encerrada, inclusive se atingiu um limite diário.
    if (round.completed) return record;

    if (!pass) {
      record.reason = round.failed ? "failure-already-recorded" : "retry-needed";
      if (!round.failed) {
        record.mastery = Math.max(0, record.mastery - 7);
        record.streak = 0;
        record.interval = 0;
        record.dueAt = Math.min(record.dueAt ?? Infinity, now + 15 * 60000);
        round.failed = true;
      }
      record.roundHistory = record.roundHistory.slice(-100);
      return record;
    }

    round.completed = true;
    round.at = now;
    const todayCredits = record.creditHistory.filter(item => dayKey(item.at) === dayKey(now));
    const independentToday = todayCredits.filter(item => !item.helped);
    const sameVariantToday = todayCredits.some(item => item.variantKey === variantKey && (round.helped || !item.helped));
    const dueReview = record.dueAt !== null && record.dueAt <= now;
    let gain = 0;
    if (sameVariantToday) {
      record.reason = "variant-already-practiced-today";
    } else if (round.helped) {
      const helpedGainToday = todayCredits.filter(item => item.helped).reduce((sum, item) => sum + item.gain, 0);
      gain = Math.max(0, Math.min(7 - helpedGainToday, 35 - record.mastery));
      record.reason = "assisted-practice";
      // Apoio prepara uma recuperação próxima, sem fabricar domínio independente.
      record.interval = Math.min(record.interval, 1);
      record.dueAt = Math.min(record.dueAt ?? Infinity, now + DAY);
      record.credit = gain > 0;
    } else if (independentToday.length >= 2) {
      record.reason = "daily-practice-limit";
    } else {
      const firstIndependent = record.creditHistory.every(item => item.helped) &&
        (previous.passes || 0) <= (previous.helpedPasses || 0);
      gain = independentToday.length || (!dueReview && !firstIndependent) ? 7 : options.firstTry === true ? 19 : 12;
      record.reason = dueReview ? "spaced-review" : independentToday.length ? "new-variation" : "fresh-practice";
      record.streak += 1;
      if (dueReview || firstIndependent || record.dueAt === null) {
        record.interval = Math.min(record.interval + 1, 5);
        record.dueAt = now + INTERVALS[record.interval] * DAY;
      }
      record.credit = true;
    }
    if (record.credit) {
      gain = Math.min(gain, 100 - record.mastery);
      record.mastery += gain;
      record.lastCreditAt = now;
      round.credited = true;
      record.creditHistory.push({ roundId, variantKey, at: now, gain, helped: round.helped });
    }
    record.roundHistory = record.roundHistory.slice(-100);
    record.creditHistory = record.creditHistory.slice(-100);
    return record;
  }

  function seedCompletedRound(previous = {}, options = {}) {
    const now = options.now === undefined ? Date.now() : options.now;
    if (!stamp(now)) throw new Error("Horário da rodada salva inválido.");
    const roundId = String(options.roundId || "legacy-round");
    const variantKey = String(options.variantSeed ?? 0);
    const at = stamp(previous.lastAt) ? previous.lastAt : now;
    const record = {
      ...previous,
      roundHistory: Array.isArray(previous.roundHistory) ? previous.roundHistory.map(item => ({ ...item })) : [],
      creditHistory: Array.isArray(previous.creditHistory) ? previous.creditHistory.map(item => ({ ...item })) : []
    };
    let round = record.roundHistory.find(item => item.id === roundId);
    // Uma rodada já registrada conserva sua classificação e seu crédito original.
    if (round?.completed) return record;
    if (!round) {
      round = { id: roundId, helped: options.helped === true, completed: true, failed: false, credited: true, at };
      record.roundHistory.push(round);
    } else {
      round.completed = true;
      round.helped = round.helped || options.helped === true;
    }
    // O crédito anterior não é recalculado; esta entrada apenas impede recontagem.
    if (!record.creditHistory.some(item => item.roundId === roundId ||
      (item.variantKey === variantKey && dayKey(item.at) === dayKey(at) && (round.helped || !item.helped)))) {
      record.creditHistory.push({ roundId, variantKey, at, gain: 0, helped: round.helped });
    }
    record.roundHistory = record.roundHistory.slice(-100);
    record.creditHistory = record.creditHistory.slice(-100);
    return record;
  }

  function resolvesMistake(previous = {}, updated = {}, options = {}, mistake = {}) {
    if (options.pass !== true || options.helped === true || typeof options.roundId !== "string" || !count(options.variantSeed)) return false;
    const seed = mistake.variantSeed === undefined ? 0 : mistake.variantSeed;
    if (!count(seed) || options.variantSeed !== seed) return false;
    const before = previous.roundHistory?.find(round => round.id === options.roundId);
    const after = updated.roundHistory?.find(round => round.id === options.roundId);
    // Resolver um erro não depende de crédito: os limites diários continuam protegendo o domínio.
    return before?.completed !== true && after?.completed === true && after.helped === false;
  }

  function invalid(path, detail) { throw new Error("Backup inválido em " + path + ": " + detail + "."); }
  function object(value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid(path, "esperado um objeto");
    return value;
  }
  function array(value, path) { if (!Array.isArray(value)) invalid(path, "esperada uma lista"); return value; }
  function string(value, path) { if (typeof value !== "string") invalid(path, "esperado texto"); return value; }
  function reflection(value, path) {
    const text = string(value, path);
    if (text.length > 8000) invalid(path, "texto maior que 8.000 caracteres");
    return text;
  }
  function boolean(value, path) { if (typeof value !== "boolean") invalid(path, "esperado verdadeiro ou falso"); return value; }
  function numeric(value, path, min = 0, max = Infinity, integer = false) {
    if (!finite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) invalid(path, "número fora do intervalo permitido");
    return value;
  }
  function timestamp(value, path, nullable = true) {
    if (value === null && nullable) return null;
    if (!stamp(value)) invalid(path, "data ou horário inválido");
    return value;
  }
  function enumeration(value, path, choices, nullable = false) {
    if (value === null && nullable) return null;
    if (!choices.includes(value)) invalid(path, "valor não reconhecido");
    return value;
  }
  function optional(source, target, key, path, check) {
    if (own(source, key)) target[key] = check(source[key], path + "." + key);
  }
  function inspectJSON(value, path = "arquivo", depth = 0, seen = new Set()) {
    if (depth > 60) invalid(path, "estrutura profunda demais");
    if (typeof value === "number" && !finite(value)) invalid(path, "número não finito");
    if (value === null || typeof value !== "object") {
      if (!["string", "number", "boolean"].includes(typeof value) && value !== null) invalid(path, "valor não compatível com JSON");
      return;
    }
    if (seen.has(value)) invalid(path, "referência circular");
    if (!Array.isArray(value)) object(value, path);
    seen.add(value);
    for (const key of Object.keys(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) invalid(path, "chave reservada");
      inspectJSON(value[key], path + "." + key, depth + 1, seen);
    }
    seen.delete(value);
  }
  function errorValue(value, path) {
    const source = object(value, path), clean = {};
    for (const key of ["kind", "message"]) optional(source, clean, key, path, string);
    optional(source, clean, "line", path, (item, field) => item === null ? null : numeric(item, field, 1, Infinity, true));
    optional(source, clean, "context", path, (item, field) => enumeration(item, field, ["code", "arguments"]));
    return clean;
  }
  function resultValue(value, path) {
    if (value === null) return null;
    const source = object(value, path), clean = {};
    optional(source, clean, "pass", path, boolean);
    clean.cases = array(source.cases, path + ".cases").map((item, index) => {
      const field = path + ".cases[" + index + "]", current = object(item, field);
      const test = { pass: boolean(current.pass, field + ".pass") };
      for (const key of ["got", "expected", "stdout"]) optional(current, test, key, field, string);
      for (const key of ["gotTruncated", "expectedTruncated"]) optional(current, test, key, field, boolean);
      for (const key of ["gotLength", "expectedLength"]) optional(current, test, key, field, (number, location) => numeric(number, location, 0, Infinity, true));
      for (const key of ["got", "expected"]) if (own(test, key) && own(test, key + "Length")) {
        const length = Array.from(test[key]).length;
        const total = test[key + "Length"];
        if (total < length || (test[key + "Truncated"] === true && total <= length) || (test[key + "Truncated"] === false && total !== length)) invalid(field, "comprimento e abreviação do resultado inconsistentes");
      }
      optional(current, test, "changed", field, boolean);
      optional(current, test, "error", field, errorValue);
      return test;
    });
    optional(source, clean, "rules", path, (items, field) => array(items, field).map((item, index) => string(item, field + "[" + index + "]")));
    optional(source, clean, "error", path, errorValue);
    optional(source, clean, "learningDiagnosis", path, (item, field) => {
      const diagnosis = object(item, field), result = {};
      for (const key of ["key", "title", "tip", "detail"]) optional(diagnosis, result, key, field, string);
      return result;
    });
    optional(source, clean, "learning", path, (item, field) => {
      const learning = object(item, field), result = {};
      optional(learning, result, "mastery", field, (number, location) => numeric(number, location, 0, 100));
      optional(learning, result, "dueAt", field, timestamp);
      for (const key of ["firstTry", "helped", "credit"]) optional(learning, result, key, field, boolean);
      optional(learning, result, "confidence", field, (number, location) => enumeration(number, location, [1, 2, 3], true));
      optional(learning, result, "reason", field, string);
      return result;
    });
    return clean;
  }
  function draftValue(value, path) {
    const source = object(value, path), clean = {};
    for (const key of ["code", "challengeKey", "roundId"]) optional(source, clean, key, path, string);
    optional(source, clean, "reflection", path, reflection);
    for (const key of ["experimentInput", "experimentPrediction"]) optional(source, clean, key, path, reflection);
    optional(source, clean, "hintsLevel", path, (item, field) => numeric(item, field, 0, 3, true));
    for (const key of ["helped", "paperTranscribing"]) optional(source, clean, key, path, boolean);
    optional(source, clean, "result", path, resultValue);
    optional(source, clean, "confidence", path, (item, field) => enumeration(item, field, [1, 2, 3], true));
    optional(source, clean, "format", path, (item, field) => enumeration(item, field, FORMATS));
    for (const key of ["variantSeed", "roundAttempts"]) optional(source, clean, key, path, (item, field) => numeric(item, field, 0, Infinity, true));
    optional(source, clean, "traceRows", path, (items, field) => array(items, field).map((item, index) => {
      const rowPath = field + "[" + index + "]", row = object(item, rowPath), result = {};
      for (const key of ["step", "variables", "output"]) optional(row, result, key, rowPath, string);
      return result;
    }));
    return clean;
  }
  function recordValue(value, path) {
    const source = object(value, path), clean = { attempts: 0, passes: 0, mastery: 0, streak: 0, interval: 0, dueAt: null, lastAt: null, helpedPasses: 0 };
    for (const key of ["attempts", "passes", "streak", "helpedPasses"]) optional(source, clean, key, path, (item, field) => numeric(item, field, 0, Infinity, true));
    optional(source, clean, "mastery", path, (item, field) => numeric(item, field, 0, 100));
    optional(source, clean, "interval", path, (item, field) => numeric(item, field, 0, 5, true));
    for (const key of ["dueAt", "lastAt", "lastCreditAt"]) optional(source, clean, key, path, timestamp);
    optional(source, clean, "credit", path, boolean);
    optional(source, clean, "reason", path, string);
    optional(source, clean, "roundHistory", path, (items, field) => array(items, field).map((item, index) => {
      const rowPath = field + "[" + index + "]", row = object(item, rowPath);
      const result = { id: string(row.id, rowPath + ".id"), at: timestamp(row.at, rowPath + ".at", false) };
      for (const key of ["helped", "completed", "failed", "credited"]) result[key] = boolean(row[key], rowPath + "." + key);
      return result;
    }));
    optional(source, clean, "creditHistory", path, (items, field) => array(items, field).map((item, index) => {
      const rowPath = field + "[" + index + "]", row = object(item, rowPath);
      return { roundId: string(row.roundId, rowPath + ".roundId"), variantKey: string(row.variantKey, rowPath + ".variantKey"), at: timestamp(row.at, rowPath + ".at", false), gain: numeric(row.gain, rowPath + ".gain", 0, 100), helped: boolean(row.helped, rowPath + ".helped") };
    }));
    if ((clean.passes ?? 0) > (clean.attempts ?? Infinity) || (clean.helpedPasses ?? 0) > (clean.passes ?? Infinity)) invalid(path, "contadores de acertos inconsistentes");
    return clean;
  }

  function validateBackup(payload, exercises) {
    inspectJSON(payload);
    object(payload, "arquivo");
    const wrapped = own(payload, "state");
    const source = object(wrapped ? payload.state : payload, "estado");
    const version = own(payload, "version") ? payload.version : own(source, "version") ? source.version : 1;
    enumeration(version, "versão", [1, 2, 3, 4]);
    if (own(source, "version")) {
      enumeration(source.version, "estado.version", [1, 2, 3, 4]);
      if (wrapped && own(payload, "version") && source.version !== payload.version) invalid("versão", "metadados e estado têm versões diferentes");
    }
    if (wrapped && payload.app !== "python-de-cabeca") invalid("app", "este arquivo pertence a outro aplicativo");
    if (own(payload, "app") && payload.app !== "python-de-cabeca") invalid("app", "aplicativo não reconhecido");
    if (own(payload, "exportedAt")) {
      const exportedAt = string(payload.exportedAt, "exportedAt");
      if (!/^\d{4}-\d{2}-\d{2}T/.test(exportedAt) || !stamp(Date.parse(exportedAt))) invalid("exportedAt", "data de exportação inválida");
    }
    if (!own(source, "drafts")) invalid("rascunhos", "campo ausente");
    const known = new Set(exercises.map(exercise => typeof exercise === "string" ? exercise : exercise.id));
    if (!known.size) throw new Error("Nenhum exercício disponível para conferir o backup.");
    const warnings = [], ignored = new Set();
    const keepId = id => {
      string(id, "identificador do exercício");
      if (known.has(id)) return true;
      ignored.add(id); return false;
    };
    const idMap = (value, path, check) => {
      const map = object(value, path), result = {};
      for (const [id, item] of Object.entries(map)) if (keepId(id)) result[id] = check(item, path + "." + id);
      return result;
    };
    const clean = { version: 4, activeId: [...known][0], drafts: idMap(source.drafts, "rascunhos", draftValue), exam: null, coach: null,
      learning: { records: {}, attempts: [], mistakes: [], sessions: [], streak: { days: 0, lastDate: null } } };
    if (own(source, "activeId") && keepId(source.activeId)) clean.activeId = source.activeId;
    optional(source, clean, "lastMode", "estado", (item, field) => enumeration(item, field, MODES));

    function sessionValue(value, path, coach) {
      if (value === null) return null;
      const session = object(value, path), ids = array(session.ids, path + ".ids");
      ids.forEach(id => string(id, path + ".ids"));
      if (new Set(ids).size !== ids.length || (coach ? ids.length < 3 || ids.length > 12 : ids.length !== 6)) invalid(path + ".ids", "quantidade ou duplicação de exercícios inválida");
      const available = ids.filter(keepId);
      const result = { ids: available };
      optional(session, result, "activeId", path, string);
      if (result.activeId && !available.includes(result.activeId)) { keepId(result.activeId); result.activeId = available[0]; }
      for (const key of ["startedAt", "finishedAt"]) optional(session, result, key, path, (item, field) => timestamp(item, field, key === "finishedAt"));
      if (!own(session, "startedAt")) invalid(path + ".startedAt", "campo ausente");
      if (result.finishedAt !== null && result.finishedAt !== undefined && result.finishedAt < result.startedAt) invalid(path, "término anterior ao início");
      if (!own(session, "answers")) invalid(path + ".answers", "campo ausente");
      for (const [key, check] of [["answers", string], ["results", resultValue], ["variants", (item, field) => numeric(item, field, 0, Infinity, true)]]) {
        optional(session, result, key, path, (map, field) => idMap(map, field, check));
      }
      if (coach) {
        for (const key of ["id", "type"]) optional(session, result, key, path, string);
        optional(session, result, "unitId", path, (item, field) => item === null ? null : string(item, field));
        for (const [key, check] of [["helped", boolean], ["paperTranscribing", boolean], ["confidence", (item, field) => enumeration(item, field, [1, 2, 3], true)], ["formats", (item, field) => enumeration(item, field, FORMATS)], ["prepared", string], ["roundIds", string], ["roundAttempts", (item, field) => numeric(item, field, 0, Infinity, true)]]) {
          optional(session, result, key, path, (map, field) => idMap(map, field, check));
        }
      } else optional(session, result, "course", path, boolean);
      if (available.length !== ids.length && (coach ? available.length < 3 : true)) {
        warnings.push("A sessão " + (coach ? "de treino" : "de desafio") + " foi descartada porque inclui exercícios indisponíveis.");
        return null;
      }
      return result;
    }
    if (own(source, "exam")) clean.exam = sessionValue(source.exam, "desafio", false);
    if (own(source, "coach")) clean.coach = sessionValue(source.coach, "treino", true);
    if (own(source, "learning")) {
      const learning = object(source.learning, "aprendizagem");
      optional(learning, clean.learning, "records", "aprendizagem", (map, field) => idMap(map, field, recordValue));
      optional(learning, clean.learning, "diagnostic", "aprendizagem", (item, field) => {
        if (item === null) return null;
        const diagnostic = object(item, field);
        const result = { sessionId: string(diagnostic.sessionId, field + ".sessionId"), startedAt: timestamp(diagnostic.startedAt, field + ".startedAt", false) };
        result.answers = idMap(diagnostic.answers, field + ".answers", (answer, location) => {
          const current = object(answer, location);
          const response = { pass: boolean(current.pass, location + ".pass"), helped: boolean(current.helped, location + ".helped"), at: timestamp(current.at, location + ".at", false) };
          if (response.at < result.startedAt) invalid(location + ".at", "resposta anterior ao início do diagnóstico");
          return response;
        });
        return result;
      });
      for (const kind of ["attempts", "mistakes"]) if (own(learning, kind)) {
        clean.learning[kind] = array(learning[kind], "aprendizagem." + kind).flatMap((item, index) => {
          const path = "aprendizagem." + kind + "[" + index + "]", row = object(item, path);
          if (!keepId(row.exerciseId)) return [];
          const result = { exerciseId: row.exerciseId };
          for (const key of kind === "attempts" ? ["title", "source", "reason", "roundId"] : ["id", "title", "category", "categoryTitle", "tip", "detail", "code"]) optional(row, result, key, path, string);
          if (kind === "attempts") {
            result.pass = boolean(row.pass, path + ".pass");
            result.at = timestamp(row.at, path + ".at", false);
            for (const key of ["helped", "credit"]) optional(row, result, key, path, boolean);
            optional(row, result, "confidence", path, (number, field) => enumeration(number, field, [1, 2, 3], true));
            optional(row, result, "mastery", path, (number, field) => numeric(number, field, 0, 100));
          } else {
            result.createdAt = timestamp(row.createdAt, path + ".createdAt", false);
            optional(row, result, "variantSeed", path, (item, field) => numeric(item, field, 0, Infinity, true));
            optional(row, result, "result", path, resultValue);
            optional(row, result, "reflection", path, reflection);
            optional(row, result, "resolvedAt", path, timestamp);
            if (result.resolvedAt !== null && result.resolvedAt !== undefined && result.resolvedAt < result.createdAt) invalid(path, "resolução anterior ao erro");
          }
          return [result];
        });
      }
      optional(learning, clean.learning, "sessions", "aprendizagem", (items, field) => array(items, field).map((item, index) => {
        const path = field + "[" + index + "]", row = object(item, path), result = {};
        optional(row, result, "id", path, string);
        result.startedAt = timestamp(row.startedAt, path + ".startedAt", false);
        result.finishedAt = timestamp(row.finishedAt, path + ".finishedAt", false);
        result.count = numeric(row.count, path + ".count", 0, Infinity, true);
        if (result.finishedAt < result.startedAt) invalid(path, "término anterior ao início");
        return result;
      }));
      optional(learning, clean.learning, "streak", "aprendizagem", (item, field) => {
        const streak = object(item, field), result = { days: numeric(streak.days, field + ".days", 0, Infinity, true), lastDate: streak.lastDate };
        if (result.lastDate !== null) {
          string(result.lastDate, field + ".lastDate");
          const parsed = Date.parse(result.lastDate + "T12:00:00Z");
          if (!/^\d{4}-\d{2}-\d{2}$/.test(result.lastDate) || !stamp(parsed) || new Date(parsed).toISOString().slice(0, 10) !== result.lastDate) invalid(field + ".lastDate", "data inválida");
        }
        return result;
      });
    }
    if (ignored.size) warnings.push(ignored.size + " exercício(s) indisponível(is) foram ignorados.");
    const summary = { version, drafts: Object.values(clean.drafts).filter(draft => draft.code?.trim()).length,
      results: Object.values(clean.drafts).filter(draft => draft.result).length, attempts: clean.learning.attempts.length,
      records: Object.keys(clean.learning.records).length, mistakes: clean.learning.mistakes.length,
      sessions: clean.learning.sessions.length, ignoredIds: ignored.size, coach: !!clean.coach, exam: !!clean.exam };
    return { state: clean, summary, warnings };
  }

  const api = Object.freeze({ applyAttempt, seedCompletedRound, resolvesMistake, validateBackup });
  root.PROGRESS_ENGINE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
