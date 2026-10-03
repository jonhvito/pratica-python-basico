/* Cenários regressivos do percurso, diagnóstico e treino adaptativo. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const planning = require("../planejamento.js");
const progress = require("../progresso.js");
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const filename of ["exercicios.js", "curriculo.js", "professor.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), sandbox, { filename });
}
const exercises = JSON.parse(JSON.stringify(sandbox.window.EXERCISES));
const units = JSON.parse(JSON.stringify(sandbox.window.CURRICULUM.units));
const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
const now = Date.UTC(2026, 9, 2, 15), day = 86400000;
let checks = 0;
function test(name, fn) {
  try { fn(); checks += 1; }
  catch (error) { error.message = name + ": " + error.message; throw error; }
}
function record(overrides = {}) {
  return { attempts: 1, passes: 1, helpedPasses: 0, mastery: 60, lastAt: now - day * 2, dueAt: now + day, ...overrides };
}
function completedDiagnostic(overrides = {}) {
  let diagnostic;
  for (const exercise of planning.diagnosticExercises(exercises, units)) {
    diagnostic = planning.recordDiagnostic(diagnostic, exercise, overrides[exercise.id] || { pass: true, helped: false }, { now, sessionId: "triagem-1" });
  }
  return diagnostic;
}

test("cada atividade tem exatamente uma posição pedagógica", () => {
  const ids = Object.values(planning.sequence).flat();
  assert.equal(ids.length, 136);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), exercises.map(exercise => exercise.id).sort());
  for (const [unitId, sequence] of Object.entries(planning.sequence)) {
    for (const id of sequence) assert.equal(byId.get(id).unit, unitId, id);
  }
});

test("ordem mantém fundamentos antes das integrações sem alterar o catálogo", () => {
  const original = JSON.stringify(exercises);
  const ordered = planning.orderExercises(exercises, units);
  assert.equal(ordered[0].id, "logica-sequencia");
  assert.equal(ordered.filter(exercise => exercise.unit === "numeros")[0].id, "num-tipos");
  assert.equal(ordered.filter(exercise => exercise.unit === "numeros").at(-1).id, "curso-serie-exp");
  assert.equal(ordered.filter(exercise => exercise.unit === "funcoes")[0].id, "func-chamada");
  assert.equal(JSON.stringify(exercises), original);
  assert.equal(ordered.length, 136);
});

test("novos identificadores permanecem acessíveis após a sequência conhecida", () => {
  const extended = [...exercises, { id: "nova-logica", unit: "logica", kind: "choice" }];
  const ordered = planning.orderExercises(extended, units);
  assert.equal(ordered.filter(exercise => exercise.unit === "logica").at(-1).id, "nova-logica");
});

test("pré-requisitos apontam para IDs conhecidos e não formam ciclos", () => {
  function visit(id, ancestors = []) {
    assert(byId.has(id), id);
    assert(!ancestors.includes(id), "ciclo: " + ancestors.concat(id).join(" → "));
    for (const prerequisite of planning.prerequisites[id] || []) visit(prerequisite, ancestors.concat(id));
  }
  Object.keys(planning.prerequisites).forEach(id => visit(id));
});

test("o diagnóstico combina onze unidades com seis tarefas de escrita", () => {
  const selected = planning.diagnosticExercises(exercises, units);
  assert.equal(selected.length, 11);
  assert.equal(new Set(selected.map(exercise => exercise.unit)).size, 11);
  assert(selected.filter(exercise => ["program", "function"].includes(exercise.kind)).length >= 3);
  assert(selected.some(exercise => exercise.kind === "order"));
  assert(selected.some(exercise => exercise.kind === "trace"));
});

test("formatos invisíveis de escolha, ordenação e leitura não geram apoio", () => {
  for (const exercise of exercises.filter(exercise => ["choice", "order", "trace"].includes(exercise.kind))) {
    for (const format of ["write", "fade", "bug", "recall", "paper"]) {
      assert.equal(planning.safeFormat(exercise, format), "write", exercise.id);
      assert.equal(planning.usesFormatSupport(exercise, format), false, exercise.id);
    }
  }
  assert.equal(planning.usesFormatSupport(byId.get("sintaxe-corrigir"), "fade"), true);
  assert.equal(planning.usesFormatSupport(byId.get("sintaxe-corrigir"), "paper"), false);
  assert.equal(planning.safeFormat(byId.get("ola"), "inventado"), "write");
});

test("primeira resposta do diagnóstico não vira acerto por repetição", () => {
  const exercise = byId.get("sintaxe-corrigir");
  const first = planning.recordDiagnostic(null, exercise, { pass: false }, { now, sessionId: "d1" });
  const retry = planning.recordDiagnostic(first, exercise, { pass: true }, { now: now + 1000, sessionId: "d1" });
  assert.equal(retry.answers[exercise.id].pass, false);
  assert.equal(retry.answers[exercise.id].at, now);
  const next = planning.recordDiagnostic(first, exercise, { pass: true }, { now: now + day, sessionId: "d2" });
  assert.equal(next.answers[exercise.id].pass, true);
  assert.equal(next.sessionId, "d2");
  assert.equal(first.answers[exercise.id].pass, false);
});

test("diagnóstico parcial conserva o início do percurso", () => {
  const diagnostic = planning.recordDiagnostic(null, byId.get("logica-sequencia"), { pass: true }, { now, sessionId: "d1" });
  assert.equal(planning.summarizeDiagnostic(diagnostic, exercises, units).completed, false);
  assert.equal(planning.focusUnit(units, exercises, { diagnostic }).id, "logica");
});

test("diagnóstico perfeito avança provisoriamente sem fabricar consolidação", () => {
  const diagnostic = completedDiagnostic(), learning = { records: {}, diagnostic };
  const summary = planning.summarizeDiagnostic(diagnostic, exercises, units);
  assert.equal(summary.completed, true);
  assert.equal(summary.independent, 11);
  assert.equal(summary.suggestedUnitId, "depuracao");
  assert.equal(planning.focusUnit(units, exercises, learning).id, "depuracao");
  assert.equal(planning.unitStats("logica", exercises, learning).complete, false);
  assert.equal(planning.unitStats("logica", exercises, learning).attempted, 0);
  assert.equal(planning.selectSession(exercises, units, learning, { now })[0].exercise.unit, "depuracao");
});

test("diagnóstico apoiado mantém foco na primeira lacuna", () => {
  const diagnostic = completedDiagnostic({ "var-reatribuicao": { pass: true, helped: true } });
  assert.equal(planning.focusUnit(units, exercises, { diagnostic }).id, "variaveis");
  const failed = completedDiagnostic({ "sintaxe-corrigir": { pass: false }, "cond-faixa": { pass: false } });
  assert.equal(planning.focusUnit(units, exercises, { diagnostic: failed }).id, "sintaxe");
});

test("cobertura e autonomia respondem a perguntas diferentes", () => {
  const learning = { records: { "logica-sequencia": record({ mastery: 80 }) } };
  const result = planning.unitStats("logica", exercises, learning);
  assert.equal(result.coverage, 11);
  assert.equal(result.autonomy, 80);
  assert.equal(result.independent, 1);
  assert.equal(result.complete, false);
  const skill = planning.skillStats("logica", exercises, learning);
  assert.equal(skill.autonomy, 80);
  assert(skill.coverage < 100);
  assert.equal(planning.stats([], learning).complete, false);
});

test("acertos só com apoio não consolidam uma unidade", () => {
  const records = Object.fromEntries(planning.sequence.logica.slice(0, 5).map(id => [id, record({ mastery: 80, helpedPasses: 1 })]));
  const result = planning.unitStats("logica", exercises, { records });
  assert.equal(result.autonomy, 80);
  assert.equal(result.independent, 0);
  assert.equal(result.complete, false);
  for (const id of planning.sequence.logica.slice(0, 3)) records[id].helpedPasses = 0;
  assert.equal(planning.unitStats("logica", exercises, { records }).complete, true);
});

test("iniciante recebe cinco fundamentos, sem integrações avançadas", () => {
  const selected = planning.selectSession(exercises, units, {}, { now });
  assert.equal(selected.length, 5);
  assert(selected.every(item => item.exercise.unit === "logica"));
  assert.equal(selected[0].exercise.id, "logica-sequencia");
  assert(new Set(selected.map(item => item.exercise.kind)).size >= 2);
  const numbers = planning.selectSession(exercises, units, {}, { now, onlyUnit: "numeros" });
  assert.equal(numbers.length, 5);
  assert(!numbers.some(item => item.exercise.id === "curso-serie-exp"));
  assert.equal(numbers[0].exercise.id, "num-tipos");
});

test("atividade avançada exige fundamentos sem removê-la da prática livre", () => {
  const exercise = byId.get("curso-serie-exp");
  assert(planning.missingPrerequisites(exercise, exercises, units, {}).includes("soma_ate"));
  const records = Object.fromEntries(planning.prerequisites[exercise.id].map(id => [id, record()]));
  assert.deepEqual(planning.missingPrerequisites(exercise, exercises, units, { records }), []);
  assert(byId.has(exercise.id));
  const assisted = { records: { ...records, soma_ate: record({ helpedPasses: 1 }) } };
  assert(planning.missingPrerequisites(exercise, exercises, units, assisted).includes("soma_ate"));
  const triage = { diagnostic: completedDiagnostic() };
  assert(planning.missingPrerequisites(exercise, exercises, units, triage).includes("curso-math"));
  assert(!planning.missingPrerequisites(exercise, exercises, units, triage).includes("num-precedencia"));
});

test("treino reserva revisão, recuperação e avanço sem duplicar exercícios", () => {
  const records = {
    "logica-sequencia": record({ dueAt: now - day }),
    "logica-processamento": record({ dueAt: now - day * 2 }),
    "logica-contador": record({ dueAt: now - day * 3 }),
    "logica-estado": record({ passes: 0, mastery: 10 })
  };
  const learning = { records, mistakes: [{ exerciseId: "logica-estado", resolvedAt: null }] };
  const selected = planning.selectSession(exercises, units, learning, { now });
  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map(item => item.exercise.id)).size, 5);
  assert.equal(selected.filter(item => item.category === "review").length, 2);
  assert.equal(selected.filter(item => item.category === "recovery").length, 1);
  assert.equal(selected.filter(item => item.category === "new").length, 2);
});

test("cem registros do mesmo erro pesam tanto quanto um", () => {
  const learning = { records: { "logica-estado": record({ passes: 0, mastery: 10 }) }, mistakes: [{ exerciseId: "logica-estado", resolvedAt: null }] };
  const repeated = { ...learning, mistakes: Array.from({ length: 100 }, () => ({ ...learning.mistakes[0] })) };
  const first = planning.rankedExercises(exercises, units, learning, { now });
  const second = planning.rankedExercises(exercises, units, repeated, { now });
  assert.deepEqual(first.map(item => [item.exercise.id, item.priority]), second.map(item => [item.exercise.id, item.priority]));
});

test("revisão futura e acerto do mesmo dia cedem lugar ao avanço", () => {
  const records = Object.fromEntries(planning.sequence.logica.slice(0, 5).map(id => [id, record({ mastery: 80, lastAt: now - 1000 })]));
  const selected = planning.selectSession(exercises, units, { records }, { now });
  assert(selected.some(item => item.exercise.unit === "sintaxe"));
  assert(!selected.some(item => item.category === "review"));
  const before = planning.rankedExercises(exercises, units, { records: { ola: record({ dueAt: now + 1000 }) } }, { now });
  const after = planning.rankedExercises(exercises, units, { records: { ola: record({ dueAt: now + 1000 }) } }, { now: now + 1000 });
  assert.notEqual(before.find(item => item.exercise.id === "ola").category, "review");
  assert.equal(after.find(item => item.exercise.id === "ola").category, "review");
});

test("planejamento é determinístico e não modifica aprendizagem", () => {
  const learning = { records: { "logica-sequencia": record() }, diagnostic: completedDiagnostic(), mistakes: [] };
  const original = JSON.stringify(learning);
  assert.deepEqual(planning.selectSession(exercises, units, learning, { now }), planning.selectSession(exercises, units, learning, { now }));
  assert.equal(JSON.stringify(learning), original);
  assert.throws(() => planning.selectSession(exercises, units, learning, { now: NaN }), /Horário/);
});

test("planejamento preserva regras de crédito da mesma rodada e do mesmo dia", () => {
  const first = progress.applyAttempt({}, { now, pass: true, helped: false, roundId: "a", variantSeed: 0 });
  const sameRound = progress.applyAttempt(first, { now: now + 1000, pass: true, helped: false, roundId: "a", variantSeed: 0 });
  const sameDay = progress.applyAttempt(first, { now: now + 2000, pass: true, helped: false, roundId: "b", variantSeed: 0 });
  assert.equal(sameRound.mastery, first.mastery);
  assert.equal(sameDay.mastery, first.mastery);
  const original = JSON.stringify(first);
  planning.selectSession(exercises, units, { records: { "logica-sequencia": first } }, { now });
  assert.equal(JSON.stringify(first), original);
});

console.log(checks + " verificações de planejamento passaram; 136 atividades e 11 unidades.");
