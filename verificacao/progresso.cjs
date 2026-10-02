/* node verificacao/progresso.cjs — regressões das regras que afetam o progresso salvo. */
"use strict";
const assert = require("node:assert/strict");
const { applyAttempt, seedCompletedRound, validateBackup } = require("../progresso.js");
const DAY = 86400000;
const now = new Date(2026, 9, 2, 12).getTime();
const exercises = ["a", "b", "c", "d", "e", "f"].map(id => ({ id }));
let checks = 0;
function check(name, run) {
  run(); checks += 1; console.log("OK " + name);
}
const attempt = (record, fields = {}) => applyAttempt(record, { pass: true, helped: false, firstTry: true, variantSeed: "cases-a", roundId: "round-a", now, ...fields });
const oldRecord = { attempts: 4, passes: 3, helpedPasses: 1, mastery: 44, streak: 2, interval: 2, dueAt: now + 2 * DAY, lastAt: now - DAY };
function backup(version = 4) {
  return {
    app: "python-de-cabeca", version, exportedAt: new Date(now).toISOString(),
    state: { version, activeId: "a", lastMode: "practice",
      drafts: { a: { code: "print(3)", helped: false, confidence: null, result: { pass: true, rules: [], cases: [{ pass: true, got: "3", expected: "3", stdout: "" }], learning: { mastery: 19, dueAt: now + DAY, firstTry: true, helped: false, confidence: null, credit: true, reason: "fresh-practice" } },
        format: "write", variantSeed: 0, roundAttempts: 1, roundId: "round-a", challengeKey: "a-write-0", paperTranscribing: false, traceRows: [{ step: "1", variables: "x = 3", output: "3" }] } },
      exam: null, coach: null,
      learning: { records: { a: attempt({}) },
        attempts: [{ exerciseId: "a", title: "Exemplo", pass: true, helped: false, confidence: null, source: "practice", mastery: 19, at: now, credit: true, reason: "fresh-practice" }],
        mistakes: [{ id: "erro-a", exerciseId: "a", title: "Exemplo", category: "casos", categoryTitle: "Saída", tip: "Compare", detail: "", code: "print(2)", createdAt: now - 1000, resolvedAt: now }],
        sessions: [{ id: "treino-a", startedAt: now - 2000, finishedAt: now, count: 3 }],
        streak: { days: 2, lastDate: "2026-10-02" } }
    }
  };
}
function rejects(change, expression = /Backup inválido/) {
  const value = backup(); change(value); assert.throws(() => validateBackup(value, exercises), expression);
}

check("Verificar repetidamente conserva domínio, sequência e revisão", () => {
  const initial = attempt({});
  let current = initial;
  for (let index = 1; index < 100; index++) current = attempt(current, { now: now + index * 60000 });
  assert.equal(current.mastery, 19);
  assert.equal(current.streak, 1);
  assert.equal(current.interval, 1);
  assert.equal(current.dueAt, initial.dueAt);
  assert.equal(current.credit, false);
  assert.equal(current.attempts, 100);
  // Uma resposta ainda aberta não se transforma em revisão pela passagem do tempo.
  const delayed = attempt(current, { now: initial.dueAt + DAY });
  assert.equal(delayed.mastery, current.mastery);
  assert.equal(delayed.dueAt, current.dueAt);
});
check("Nova rodada da mesma variação tem limite diário e conserva a data", () => {
  const initial = attempt({});
  const reset = attempt(initial, { roundId: "reset-a" });
  assert.equal(reset.credit, false);
  assert.equal(reset.reason, "variant-already-practiced-today");
  assert.equal(reset.mastery, initial.mastery);
  assert.equal(reset.dueAt, initial.dueAt);
});
check("Variação real distinta dá crédito pequeno, sem adiar a revisão", () => {
  const initial = attempt({});
  const distinct = attempt(initial, { roundId: "round-b", variantSeed: "cases-b" });
  assert.equal(distinct.mastery, 26);
  assert.equal(distinct.credit, true);
  assert.equal(distinct.dueAt, initial.dueAt);
  const third = attempt(distinct, { roundId: "round-c", variantSeed: "cases-c" });
  assert.equal(third.credit, false);
  assert.equal(third.mastery, 26);
});
check("Revisão vencida exige rodada nova e aumenta o intervalo", () => {
  const initial = attempt({});
  const review = attempt(initial, { roundId: "review-a", now: initial.dueAt + 60000 });
  assert.equal(review.credit, true);
  assert.equal(review.reason, "spaced-review");
  assert.equal(review.mastery, 38);
  assert.equal(review.interval, 2);
  assert.equal(review.dueAt, initial.dueAt + 60000 + 3 * DAY);
});
check("Ajuda não transforma a mesma rodada em evidência independente", () => {
  const assisted = attempt({}, { helped: true });
  assert.equal(assisted.mastery, 7);
  assert.equal(assisted.streak, 0);
  const repeated = attempt(assisted, { helped: false, now: now + 1000 });
  assert.equal(repeated.credit, false);
  assert.equal(repeated.mastery, 7);
  const fresh = attempt(assisted, { roundId: "fresh-unassisted" });
  assert.equal(fresh.credit, true);
  assert.equal(fresh.mastery, 26);
  assert.equal(fresh.streak, 1);
});
check("Domínio com ajuda é limitado e preserva valores legados", () => {
  let record = {};
  for (let index = 0; index < 12; index++) record = attempt(record, { helped: true, roundId: "help-" + index, now: now + index * DAY });
  assert.equal(record.mastery, 35);
  const existing = attempt(oldRecord, { helped: true });
  assert.equal(existing.mastery, oldRecord.mastery);
  assert.ok(existing.dueAt <= now + DAY);
  assert.ok(existing.interval <= 1);
  assert.deepEqual(oldRecord, { attempts: 4, passes: 3, helpedPasses: 1, mastery: 44, streak: 2, interval: 2, dueAt: now + 2 * DAY, lastAt: now - DAY });
});
check("Erro repetido aplica uma única penalidade sem adiar recuperação", () => {
  const first = attempt(oldRecord, { pass: false });
  const second = attempt(first, { pass: false, now: now + 60000 });
  assert.equal(first.mastery, 37);
  assert.equal(second.mastery, first.mastery);
  assert.equal(second.dueAt, first.dueAt);
  assert.equal(first.dueAt, now + 15 * 60000);
  const copied = JSON.parse(JSON.stringify(first));
  attempt(first, { helped: true });
  assert.deepEqual(first, copied);
});
check("Falha que já usou ajuda permanece assistida ao ser corrigida", () => {
  const failed = attempt({}, { pass: false, helped: true });
  const corrected = attempt(failed, { helped: false, firstTry: false });
  assert.equal(corrected.mastery, 7);
  assert.equal(corrected.streak, 0);
  assert.equal(corrected.helpedPasses, 1);
});
check("Valores legados não desaparecem em prática antecipada", () => {
  const updated = attempt(oldRecord);
  assert.equal(updated.mastery, 51);
  assert.equal(updated.dueAt, oldRecord.dueAt);
  assert.equal(updated.interval, oldRecord.interval);
});
check("Resposta salva antes da atualização não recebe crédito ao ser conferida de novo", () => {
  const legacy = { ...oldRecord, lastAt: now, dueAt: now - 1000 };
  const copy = structuredClone(legacy);
  const restored = seedCompletedRound(legacy, { roundId: "loaded-a", variantSeed: "cases-a", helped: false, now });
  const checkedAgain = attempt(restored, { roundId: "loaded-a", now: now + 2000 });
  assert.equal(checkedAgain.credit, false);
  for (const key of ["mastery", "streak", "interval", "dueAt"]) assert.equal(checkedAgain[key], legacy[key]);
  assert.equal(restored.attempts, legacy.attempts);
  assert.equal(restored.passes, legacy.passes);
  assert.deepEqual(legacy, copy);
});
check("Crédito legado bloqueia a mesma variação no dia e permite revisão futura", () => {
  const restored = seedCompletedRound({ ...oldRecord, lastAt: now }, { roundId: "loaded-a", variantSeed: "cases-a", now });
  const reset = attempt(restored, { roundId: "reset-after-load" });
  assert.equal(reset.credit, false);
  assert.equal(reset.mastery, oldRecord.mastery);
  assert.equal(reset.dueAt, oldRecord.dueAt);
  const later = attempt(restored, { roundId: "review-after-load", now: oldRecord.dueAt });
  assert.equal(later.credit, true);
  assert.equal(later.reason, "spaced-review");
  assert.equal(later.interval, 3);
  assert.equal(later.dueAt, oldRecord.dueAt + 7 * DAY);
});
check("Restauração é idempotente e respeita crédito atual já registrado", () => {
  const initial = attempt({});
  const restored = seedCompletedRound(initial, { roundId: "round-a", variantSeed: "cases-a", helped: true, now });
  assert.deepEqual(restored, initial);
  const legacy = seedCompletedRound(oldRecord, { roundId: "loaded-a", variantSeed: "cases-a", now });
  assert.deepEqual(seedCompletedRound(legacy, { roundId: "loaded-a", variantSeed: "cases-a", now }), legacy);
});
check("Rodada legada com ajuda exige nova recuperação independente", () => {
  const legacy = { ...oldRecord, mastery: 21, lastAt: now, helpedPasses: 3 };
  const restored = seedCompletedRound(legacy, { roundId: "loaded-help", variantSeed: "cases-a", helped: true, now });
  const copied = attempt(restored, { roundId: "loaded-help", helped: false });
  assert.equal(copied.credit, false);
  const fresh = attempt(restored, { roundId: "new-independent", helped: false });
  assert.equal(fresh.credit, true);
  assert.equal(fresh.mastery, 40);
  const validated = backup();
  validated.state.learning.records.a = restored;
  assert.deepEqual(validateBackup(validated, exercises).state.learning.records.a, restored);
});
check("Histórico legado de domínio independente não volta a ser um primeiro acerto", () => {
  const legacy = { ...oldRecord, lastAt: now };
  const restored = seedCompletedRound(legacy, { roundId: "loaded-help", variantSeed: "cases-a", helped: true, now });
  const fresh = attempt(restored, { roundId: "new-independent", helped: false });
  assert.equal(fresh.mastery, legacy.mastery + 7);
  assert.equal(fresh.interval, legacy.interval);
  assert.equal(fresh.dueAt, legacy.dueAt);
});
check("Backup atual preserva o histórico e não modifica o arquivo de entrada", () => {
  const original = backup(), copy = structuredClone(original);
  const result = validateBackup(original, exercises);
  assert.deepEqual(original, copy);
  assert.equal(result.summary.drafts, 1);
  assert.equal(result.summary.attempts, 1);
  assert.equal(result.summary.records, 1);
  assert.deepEqual(result.state.learning.records.a, original.state.learning.records.a);
  assert.equal(result.state.drafts.a.roundId, "round-a");
  result.state.drafts.a.traceRows[0].step = "alterado";
  assert.equal(original.state.drafts.a.traceRows[0].step, "1");
});
check("Versões 1 a 4 e rascunhos da primeira versão são aceitos", () => {
  for (const version of [1, 2, 3, 4]) assert.equal(validateBackup(backup(version), exercises).summary.version, version);
  const legacy = validateBackup({ activeId: "b", drafts: { b: { code: "x = 1", helped: false, result: null } }, exam: null }, exercises);
  assert.equal(legacy.summary.version, 1);
  assert.equal(legacy.state.version, 4);
  assert.equal(legacy.state.activeId, "b");
  assert.equal(legacy.state.learning.attempts.length, 0);
});
check("Exercícios desconhecidos são ignorados com contagem e aviso", () => {
  const value = backup();
  value.state.activeId = "removed";
  value.state.drafts.removed = { code: "old" };
  value.state.learning.records.removed = { mastery: 20 };
  value.state.learning.attempts.push({ exerciseId: "removed" });
  const result = validateBackup(value, exercises);
  assert.equal(result.summary.ignoredIds, 1);
  assert.equal(result.state.activeId, "a");
  assert.equal(result.summary.attempts, 1);
  assert.equal(result.state.drafts.removed, undefined);
  assert.ok(result.warnings.some(text => text.includes("ignorados")));
});
check("Metadados, versões novas, horários e contadores inválidos são rejeitados", () => {
  rejects(value => value.app = "other");
  rejects(value => value.version = 5);
  rejects(value => value.state.version = 3);
  rejects(value => value.exportedAt = "amanhã");
  rejects(value => value.state.learning.records.a.mastery = Infinity);
  rejects(value => value.state.learning.records.a.interval = -1);
  rejects(value => value.state.learning.records.a.attempts = -2);
  rejects(value => value.state.learning.records.a.dueAt = "2026-10-02");
  rejects(value => value.state.learning.attempts[0].at = null);
  rejects(value => value.state.learning.records.a.passes = 400);
  rejects(value => value.state.learning.streak.lastDate = "2026-02-30");
});
check("Rascunhos, resultados e listas são conferidos antes da substituição", () => {
  rejects(value => value.state.drafts.a.code = 10);
  rejects(value => value.state.drafts.a.helped = "false");
  rejects(value => value.state.drafts.a.roundAttempts = -1);
  rejects(value => value.state.drafts.a.result.cases[0].pass = "yes");
  rejects(value => value.state.drafts.a.result.cases[0].error = { line: -2 });
  rejects(value => value.state.drafts.a.traceRows = ["invalid"]);
  rejects(value => value.state.learning.records = []);
  rejects(value => value.state.learning.mistakes = {});
  rejects(value => value.state.learning.mistakes[0].resolvedAt = now - DAY);
  rejects(value => value.state.learning.sessions[0].count = -1);
  rejects(value => value.state.learning.sessions[0].finishedAt = now - DAY);
  rejects(value => value.state.lastMode = "unknown");
});
check("Sessões e mapas de rodadas são preservados e verificados", () => {
  const value = backup();
  value.state.coach = { id: "c1", type: "adaptive", ids: ["a", "b", "c"], activeId: "a", startedAt: now, finishedAt: null,
    answers: { a: "print(3)", b: "", c: "" }, results: { a: value.state.drafts.a.result, b: null, c: null },
    helped: { a: false }, confidence: { a: 1 }, formats: { a: "write" }, variants: { a: 0 }, prepared: { a: "" },
    paperTranscribing: { a: false }, roundIds: { a: "coach-a" }, roundAttempts: { a: 2 }, unitId: null };
  value.state.exam = { ids: exercises.map(exercise => exercise.id), activeId: "f", startedAt: now, finishedAt: null, course: false,
    answers: {}, results: {}, variants: {} };
  const result = validateBackup(value, exercises);
  assert.equal(result.state.coach.roundIds.a, "coach-a");
  assert.equal(result.state.coach.roundAttempts.a, 2);
  assert.equal(result.summary.exam, true);
  value.state.coach.roundAttempts.a = -1;
  assert.throws(() => validateBackup(value, exercises), /roundAttempts/);
});
check("Sessão com exercício removido é descartada com aviso", () => {
  const value = backup();
  value.state.exam = { ids: ["a", "b", "c", "d", "e", "removed"], activeId: "a", startedAt: now, finishedAt: null, answers: {}, results: {} };
  const result = validateBackup(value, exercises);
  assert.equal(result.state.exam, null);
  assert.equal(result.summary.ignoredIds, 1);
  assert.ok(result.warnings.some(text => text.includes("descartada")));
});
check("Objetos malformados e chaves reservadas não entram no progresso", () => {
  assert.throws(() => validateBackup(JSON.parse('{"drafts":{"__proto__":{"code":"x"}}}'), exercises), /reservada/);
  assert.throws(() => validateBackup([], exercises), /objeto/);
  rejects(value => value.state.learning.records.a.creditHistory[0].gain = NaN);
  const circular = backup(); circular.state.loop = circular;
  assert.throws(() => validateBackup(circular, exercises), /circular/);
});
console.log(checks + " verificações de progresso e backup passaram.");
