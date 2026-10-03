/* Planejamento pedagógico puro: evidência, percurso e sessões sem dependências. */
(function (root) {
  "use strict";

  const DAY = 86400000;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const clamp = value => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const timestamp = value => Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
  const clock = options => {
    const now = options?.now === undefined ? Date.now() : options.now;
    if (!timestamp(now)) throw new Error("Horário do planejamento inválido.");
    return now;
  };

  // A ordem é deliberada, não a ordem alfabética dos identificadores.
  // Atividades de integração ficam depois dos fundamentos da própria unidade.
  const SEQUENCE = Object.freeze({
    logica: ["logica-sequencia", "logica-processamento", "logica-media", "logica-estado", "logica-contador", "logica-verdade", "logica-caminho", "logica-parada", "logica-limites"],
    sintaxe: ["ola", "sintaxe-corrigir", "sintaxe-identificador", "sintaxe-keyword", "sintaxe-comentario", "sintaxe-igual", "sintaxe-dois-pontos", "sintaxe-indentacao", "sintaxe-bloco"],
    variaveis: ["var-atribuicao", "var-reatribuicao", "var-tipo", "var-dinamica", "var-multipla", "var-case", "var-del", "var-troca", "curso-isinstance", "var-referencia", "curso-identidade"],
    numeros: ["num-tipos", "num-divisao", "num-floor-mod", "num-precedencia", "num-conversao", "media", "divisao", "num-temperatura", "num-cientifica", "curso-math", "curso-serie-exp"],
    strings: ["str-aspas", "str-indices", "str-slicing", "str-fstring", "curso-formatacao", "str-inverter", "str-normalizar", "str-substituir", "str-contar", "curso-palindromo", "vogais", "str-iniciais"],
    entrada: ["io-print", "io-input-str", "io-fluxo", "io-saudacao", "io-idade-futura", "dobro", "io-area"],
    condicoes: ["cond-bool", "sinal", "maior_dois", "cond-faixa", "aprovado", "cond-aninhada", "cond-vogal", "cond-bissexto-simples", "cond-triangulo", "curso-tarifa", "curso-emprestimo"],
    lacos: ["loop-range-zero", "loop-range-step", "contagem", "tabuada", "loop-while-regressiva", "soma_ate", "loop-soma-pares", "loop-conta-espacos", "curso-break-continue", "loop-aninhado", "curso-enumerate", "curso-zip", "curso-turtle", "curso-fatorial", "loop-primeiro-negativo", "curso-primos"],
    listas: ["lista-indices", "mesa_lista", "curso-copia-sort", "curso-tupla", "curso-tupla-mutacao", "curso-desempacotamento", "curso-dict-get", "curso-dict-items", "curso-set-vazio", "curso-conjuntos", "lista-recorte", "soma", "pares", "media_lista", "maior", "menor", "busca", "filtra_pares", "curso-unicos", "curso-frequencias", "curso-compreensao", "curso-compreensao-if", "curso-quadrados-pares", "curso-compreensao-aninhada", "curso-medias-filiais"],
    funcoes: ["func-chamada", "func-parametro", "dobro_funcao", "classifica", "func-escopo", "func-padrao", "func-primeiro-par", "mesa_return", "func-composicao", "curso-args", "curso-media-args", "curso-kwargs", "curso-expandir-args", "curso-padrao-mutavel", "curso-lambda-map", "curso-reduce"],
    depuracao: ["debug-syntax", "debug-name", "debug-type", "debug-index", "debug-casos", "mesa_range", "mesa_acumulador", "debug-infinito", "debug-divisao"]
  });
  Object.values(SEQUENCE).forEach(Object.freeze);

  // São pistas para recomendações. Nenhuma destas regras bloqueia a prática livre.
  const PREREQUISITES = Object.freeze({
    "var-referencia": ["lista-indices"], "curso-identidade": ["var-referencia", "curso-copia-sort"],
    "curso-isinstance": ["var-tipo", "curso-tupla", "curso-dict-get"],
    "curso-serie-exp": ["num-precedencia", "curso-math", "soma_ate", "dobro_funcao"],
    "str-inverter": ["str-slicing", "dobro_funcao"], "str-normalizar": ["str-aspas", "dobro_funcao"],
    "str-substituir": ["str-aspas", "dobro_funcao"], "str-contar": ["str-aspas", "dobro_funcao"],
    "curso-palindromo": ["str-slicing", "str-normalizar"], "vogais": ["loop-range-zero", "cond-vogal"],
    "str-iniciais": ["str-indices", "loop-range-zero", "dobro_funcao"],
    "curso-tarifa": ["cond-faixa", "dobro_funcao"], "curso-emprestimo": ["cond-faixa", "dobro_funcao"],
    "loop-aninhado": ["contagem"], "curso-enumerate": ["contagem", "lista-indices"],
    "curso-zip": ["contagem", "lista-indices"], "curso-fatorial": ["soma_ate", "dobro_funcao"],
    "loop-primeiro-negativo": ["curso-break-continue", "lista-indices", "dobro_funcao"],
    "curso-primos": ["loop-aninhado", "curso-break-continue", "lista-indices", "dobro_funcao"],
    "curso-dict-items": ["curso-dict-get", "contagem"], "curso-desempacotamento": ["curso-tupla"],
    "lista-recorte": ["lista-indices", "str-slicing", "dobro_funcao"], "soma": ["soma_ate", "dobro_funcao"],
    "pares": ["loop-soma-pares", "dobro_funcao"], "media_lista": ["soma", "dobro_funcao"],
    "maior": ["maior_dois", "contagem", "dobro_funcao"], "menor": ["maior_dois", "contagem", "dobro_funcao"],
    "busca": ["cond-faixa", "contagem", "dobro_funcao"], "filtra_pares": ["loop-soma-pares", "dobro_funcao"],
    "curso-unicos": ["curso-conjuntos", "dobro_funcao"], "curso-frequencias": ["curso-dict-get", "soma_ate", "dobro_funcao"],
    "curso-compreensao": ["loop-soma-pares", "lista-indices"], "curso-compreensao-if": ["curso-compreensao"],
    "curso-quadrados-pares": ["curso-compreensao", "dobro_funcao"],
    "curso-compreensao-aninhada": ["curso-compreensao", "loop-aninhado"],
    "curso-medias-filiais": ["curso-dict-items", "loop-aninhado", "media_lista"],
    "func-composicao": ["dobro_funcao", "classifica"], "func-primeiro-par": ["dobro_funcao", "contagem"],
    "mesa_return": ["dobro_funcao", "soma_ate"], "curso-args": ["func-parametro", "dobro_funcao", "curso-tupla"],
    "curso-media-args": ["curso-args"], "curso-kwargs": ["func-parametro", "dobro_funcao", "curso-dict-get"],
    "curso-expandir-args": ["curso-args", "curso-kwargs"], "curso-padrao-mutavel": ["func-padrao", "var-referencia"],
    "curso-lambda-map": ["dobro_funcao", "lista-indices"], "curso-reduce": ["curso-lambda-map", "soma_ate"],
    "mesa_range": ["contagem"], "mesa_acumulador": ["soma_ate"], "debug-infinito": ["loop-while-regressiva"],
    "debug-divisao": ["num-divisao", "cond-faixa", "dobro_funcao"]
  });
  Object.values(PREREQUISITES).forEach(Object.freeze);

  const DIAGNOSTIC_IDS = Object.freeze(["logica-sequencia", "sintaxe-corrigir", "var-reatribuicao", "num-precedencia", "str-slicing", "io-idade-futura", "cond-faixa", "contagem", "lista-indices", "dobro_funcao", "debug-divisao"]);
  const MICRO_KINDS = new Set(["choice", "order", "trace"]);
  const FORMATS = new Set(["write", "bug", "fade", "recall", "paper"]);

  function orderExercises(exercises, units) {
    const unitOrder = new Map((units || []).map(unit => [unit.id, unit.order]));
    const index = new Map(Object.values(SEQUENCE).flat().map((id, position) => [id, position]));
    return exercises.slice().sort((a, b) => (unitOrder.get(a.unit) ?? 999) - (unitOrder.get(b.unit) ?? 999)
      || (index.get(a.id) ?? 9999) - (index.get(b.id) ?? 9999) || a.id.localeCompare(b.id, "pt-BR"));
  }

  function safeFormat(exercise, requested = "write") {
    return MICRO_KINDS.has(exercise?.kind) || !FORMATS.has(requested) ? "write" : requested;
  }

  function usesFormatSupport(exercise, format) {
    return ["fade", "bug", "recall"].includes(safeFormat(exercise, format));
  }

  function diagnosticExercises(exercises, units) {
    const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
    // A seleção intencional mantém escrita, leitura e decomposição, uma por unidade.
    return (units || Object.keys(SEQUENCE).map(id => ({ id }))).map(unit => {
      const explicit = DIAGNOSTIC_IDS.map(id => byId.get(id)).find(exercise => exercise?.unit === unit.id);
      return explicit || orderExercises(exercises.filter(exercise => exercise.unit === unit.id), units)[0];
    }).filter(Boolean);
  }

  function independent(record) {
    return Math.max(0, (record?.passes || 0) - (record?.helpedPasses || 0)) > 0;
  }

  function stats(exercises, learning = {}) {
    const records = learning.records || {};
    const attempted = exercises.filter(exercise => (records[exercise.id]?.attempts || 0) > 0);
    const autonomous = attempted.filter(exercise => independent(records[exercise.id]));
    const autonomy = attempted.length ? Math.round(attempted.reduce((sum, exercise) => sum + clamp(records[exercise.id]?.mastery), 0) / attempted.length) : 0;
    const total = exercises.length, target = Math.min(5, total);
    return {
      total, attempted: attempted.length, coverage: total ? Math.round(attempted.length / total * 100) : 0,
      autonomy, independent: autonomous.length, target,
      // Compatibilidade da integração; a interface deve nomear o indicador como autonomia.
      mastery: autonomy,
      complete: target > 0 && attempted.length >= target && autonomy >= 55 && autonomous.length >= Math.min(3, target)
    };
  }

  function unitStats(unitId, exercises, learning) {
    return stats(exercises.filter(exercise => exercise.unit === unitId), learning);
  }

  function skillStats(skillId, exercises, learning) {
    return stats(exercises.filter(exercise => (exercise.skills || [exercise.unit]).includes(skillId)), learning);
  }

  function recordDiagnostic(previous, exercise, attempt, options = {}) {
    const now = clock(options), sessionId = String(options.sessionId || previous?.sessionId || "diagnostic");
    const current = previous?.sessionId === sessionId ? previous : { sessionId, startedAt: now, answers: {} };
    if (own(current.answers || {}, exercise.id)) return current;
    return { ...current, answers: { ...current.answers, [exercise.id]: { pass: attempt.pass === true, helped: attempt.helped === true, at: now } } };
  }

  function summarizeDiagnostic(diagnostic, exercises, units) {
    const expected = diagnosticExercises(exercises, units), answers = diagnostic?.answers || {};
    const rows = expected.map(exercise => ({ exerciseId: exercise.id, unitId: exercise.unit, answered: own(answers, exercise.id),
      independent: answers[exercise.id]?.pass === true && answers[exercise.id]?.helped !== true }));
    const completed = rows.length > 0 && rows.every(row => row.answered);
    return { completed, answered: rows.filter(row => row.answered).length, total: rows.length,
      independent: rows.filter(row => row.independent).length, rows,
      suggestedUnitId: completed ? (rows.find(row => !row.independent) || rows[rows.length - 1]).unitId : null };
  }

  function diagnosticEvidence(unitId, exercises, units, learning) {
    const diagnostic = summarizeDiagnostic(learning?.diagnostic, exercises, units);
    return diagnostic.completed && diagnostic.rows.some(row => row.unitId === unitId && row.independent);
  }

  function focusUnit(units, exercises, learning = {}) {
    const ordered = units.slice().sort((a, b) => a.order - b.order);
    return ordered.find(unit => !unitStats(unit.id, exercises, learning).complete && !diagnosticEvidence(unit.id, exercises, ordered, learning)) || ordered[ordered.length - 1];
  }

  function missingPrerequisites(exercise, exercises, units, learning = {}) {
    const byId = new Map(exercises.map(item => [item.id, item]));
    const diagnostic = summarizeDiagnostic(learning.diagnostic, exercises, units);
    return (PREREQUISITES[exercise.id] || []).filter(id => {
      const required = byId.get(id);
      if (!required) return true;
      const record = learning.records?.[id];
      return !(independent(record) && clamp(record.mastery) >= 20)
        && !unitStats(required.unit, exercises, learning).complete
        // Uma triagem de precedência não comprova importação de módulos, por exemplo.
        && !(diagnostic.completed && diagnostic.rows.some(row => row.exerciseId === id && row.independent));
    });
  }

  function recommendationReason(exercise, learning = {}, options = {}) {
    const now = clock(options), record = learning.records?.[exercise.id] || {};
    if (timestamp(record.dueAt) && record.dueAt <= now) return "revisão agendada";
    if ((learning.mistakes || []).some(item => item.exerciseId === exercise.id && !item.resolvedAt)) return "erro para recuperar";
    if (!record.attempts) return "próximo fundamento do percurso";
    if (!independent(record)) return "prática para resolver sem apoio";
    return "prática para fortalecer a autonomia";
  }

  function rankedExercises(exercises, units, learning = {}, options = {}) {
    const now = clock(options), focus = focusUnit(units, exercises, learning);
    const mistakes = new Set((learning.mistakes || []).filter(item => !item.resolvedAt).map(item => item.exerciseId));
    const ordered = orderExercises(exercises, units), unitById = new Map(units.map(unit => [unit.id, unit]));
    const unitPositions = new Map();
    return ordered.flatMap(exercise => {
      const position = unitPositions.get(exercise.unit) || 0;
      unitPositions.set(exercise.unit, position + 1);
      if (options.onlyUnit && exercise.unit !== options.onlyUnit) return [];
      const record = learning.records?.[exercise.id] || {}, attempted = (record.attempts || 0) > 0;
      // Recuperações reais continuam acessíveis; as barreiras só orientam conteúdo novo.
      if (!attempted && missingPrerequisites(exercise, exercises, units, learning).length) return [];
      const unit = unitById.get(exercise.unit);
      if (!attempted && !options.onlyUnit && unit?.order > focus?.order) return [];
      const due = attempted && timestamp(record.dueAt) && record.dueAt <= now;
      const recovery = mistakes.has(exercise.id) || attempted && !independent(record);
      const category = due ? "review" : recovery ? "recovery" : attempted ? "practice" : "new";
      let priority = attempted ? 100 - clamp(record.mastery) : 120 - position * 3;
      if (due) priority += 260 + Math.min(60, (now - record.dueAt) / DAY * 5);
      if (mistakes.has(exercise.id)) priority += 100; // Um erro ou cem têm o mesmo peso.
      if (exercise.unit === focus?.id) priority += 140;
      else if (!attempted) priority -= Math.max(0, (focus?.order || 0) - (unit?.order || 0)) * 15;
      // Repetir acertos no mesmo dia não deve ocupar as vagas de avanço ou revisão futura.
      if (attempted && !due && !recovery && timestamp(record.lastAt) && now - record.lastAt < DAY) priority -= 150;
      return [{ exercise, priority, category, reason: recommendationReason(exercise, learning, { now }) }];
    }).sort((a, b) => b.priority - a.priority);
  }

  function selectSession(exercises, units, learning = {}, options = {}) {
    const count = Math.max(1, Math.min(12, options.count || 5));
    const ranked = rankedExercises(exercises, units, learning, options), selected = [], used = new Set();
    function choose(category) {
      const eligible = ranked.filter(item => !used.has(item.exercise.id) && (!category || item.category === category));
      if (!eligible.length || selected.length >= count) return false;
      const skills = new Set(selected.flatMap(item => item.exercise.skills || [item.exercise.unit]));
      const kinds = new Set(selected.map(item => item.exercise.kind));
      const score = item => item.priority + (!kinds.has(item.exercise.kind) ? 12 : 0)
        + (item.exercise.skills || [item.exercise.unit]).filter(skill => !skills.has(skill)).length * 6;
      // Diversidade desempata fundamentos próximos; não pula níveis inteiros da trilha.
      const item = eligible.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best, eligible[0]);
      selected.push(item); used.add(item.exercise.id); return true;
    }
    // Cotas são tetos quando há outras necessidades; vagas ausentes são reaproveitadas.
    for (let i = 0; i < Math.min(2, count); i += 1) choose("review");
    choose("recovery");
    for (let i = 0; i < Math.min(2, count); i += 1) choose("new");
    while (selected.length < count && choose(null)) { /* completa sem duplicar */ }
    return selected;
  }

  const api = Object.freeze({ sequence: SEQUENCE, prerequisites: PREREQUISITES, diagnosticIds: DIAGNOSTIC_IDS,
    orderExercises, safeFormat, usesFormatSupport, diagnosticExercises, stats, unitStats, skillStats,
    recordDiagnostic, summarizeDiagnostic, focusUnit, missingPrerequisites, recommendationReason, rankedExercises, selectSession });
  root.PLANNING_ENGINE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
