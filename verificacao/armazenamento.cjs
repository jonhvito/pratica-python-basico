/* node verificacao/armazenamento.cjs — persistência e recuperação com Web Storage simulado. */
"use strict";
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const { create, key } = require("../armazenamento.js");
const progressEngine = require("../progresso.js");
const exercises = ["a", "b", "c", "d", "e", "f"].map(id => ({ id }));
let checks = 0;
function check(name, run) { run(); checks += 1; console.log("OK " + name); }
function quota() { const error = new Error("Limite de armazenamento atingido"); error.name = "QuotaExceededError"; return error; }
function simulated(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data, deniedReads: false, deniedWrites: false, deniedRemovals: false, rejectKey: null, beforeSet: null,
    getItem(name) { if (this.deniedReads) throw new Error("Leitura bloqueada"); return data.has(name) ? data.get(name) : null; },
    setItem(name, value) {
      if (this.deniedWrites || this.rejectKey === name) throw quota();
      if (this.beforeSet) this.beforeSet(name, value);
      data.set(name, String(value));
    },
    removeItem(name) { if (this.deniedRemovals) throw new Error("Remoção bloqueada"); data.delete(name); }
  };
}
function state(version = 4) {
  return { version, lastMode: "practice", activeId: "a", drafts: { a: { code: "", helped: false, result: null, format: "write", traceRows: [] } },
    exam: null, coach: null, learning: { records: {}, attempts: [], mistakes: [], sessions: [], streak: { days: 0, lastDate: null } } };
}
const store = storage => create({ storage, exercises, progressEngine });

check("Módulo funciona no navegador sem require ou instalação", () => {
  const context = { window: { PROGRESS_ENGINE: progressEngine } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../armazenamento.js"), "utf8"), context);
  assert.equal(context.window.STORAGE_ENGINE.key, key);
  assert.equal(context.window.STORAGE_ENGINE.create({ storage: simulated(), exercises }).load().status, "empty");
});
check("Estado vazio é distinto de falha e a primeira gravação cria snapshot válido", () => {
  const memory = simulated(), disk = store(memory), loaded = disk.load();
  assert.equal(loaded.status, "empty"); assert.equal(loaded.raw, null); assert.equal(loaded.writable, true);
  assert.equal(disk.save(state()).ok, true);
  assert.deepEqual(JSON.parse(memory.getItem(key)), state());
  assert.deepEqual(JSON.parse(memory.getItem(disk.keys.snapshot)), state());
});
check("JSON truncado permanece intacto apesar do salvamento automático", () => {
  const raw = '{"version":4,"drafts":', memory = simulated({ [key]: raw }), disk = store(memory);
  const loaded = disk.load();
  assert.equal(loaded.status, "corrupt"); assert.equal(loaded.writable, false); assert.equal(loaded.raw, raw);
  assert.equal(disk.save(state()).ok, false); assert.equal(memory.getItem(key), raw); assert.equal(disk.exportOriginal(), raw);
  assert.equal(memory.data.size, 1);
});
check("Versão futura não é tratada como estado vazio nem substituída", () => {
  const raw = JSON.stringify({ version: 5, drafts: {}, newFeature: { answer: 42 } });
  const memory = simulated({ [key]: raw }), disk = store(memory);
  assert.equal(disk.load().status, "future"); assert.equal(disk.save(state()).status, "future");
  assert.equal(memory.getItem(key), raw); assert.equal(disk.exportOriginal(), raw);
});
check("Estruturas, contadores e versões incompatíveis são protegidos", () => {
  const invalidStates = [null, [], {}, { version: 4, drafts: [] }, { version: 4, drafts: { a: { code: 10 } } },
    { ...state(), learning: { records: { a: { attempts: 0, passes: 1 } } } }];
  for (const invalid of invalidStates) {
    const raw = JSON.stringify(invalid), memory = simulated({ [key]: raw }), disk = store(memory);
    assert.equal(disk.load().status, "corrupt"); assert.equal(disk.save(state()).ok, false); assert.equal(memory.getItem(key), raw);
  }
});
check("Backups das versões 1 a 4 e rascunhos vazios continuam aceitos", () => {
  for (const version of [1, 2, 3, 4]) {
    const source = state(version), raw = JSON.stringify(source), memory = simulated({ [key]: raw }), disk = store(memory);
    assert.equal(disk.load().status, "ready");
    const wrapped = { app: "python-de-cabeca", version, state: source };
    assert.equal(disk.replace(wrapped.state).ok, true);
    assert.equal(JSON.parse(memory.getItem(key)).version, 4); assert.equal(JSON.parse(memory.getItem(key)).drafts.a.code, "");
  }
  const legacy = { activeId: "b", drafts: { b: { code: "" } }, exam: null };
  assert.equal(store(simulated({ [key]: JSON.stringify(legacy) })).load().status, "ready");
});
check("Leitura inacessível nunca permite uma gravação cega", () => {
  const memory = simulated({ [key]: JSON.stringify(state()) }); memory.deniedReads = true;
  const disk = store(memory); assert.equal(disk.load().status, "unavailable");
  memory.deniedReads = false;
  assert.equal(disk.save(state()).status, "unavailable");
  assert.equal(disk.load().status, "ready");
  const blockedGetter = create({ storage: () => { throw new Error("SecurityError"); }, exercises });
  assert.equal(blockedGetter.load().status, "unavailable"); assert.equal(blockedGetter.save(state()).ok, false);
});
check("Quota na gravação principal conserva estado e snapshot anteriores", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state());
  const before = memory.getItem(key), snapshot = memory.getItem(disk.keys.snapshot), next = state(); next.drafts.a.code = "print(2)";
  memory.rejectKey = key;
  assert.equal(disk.save(next).status, "quota"); assert.equal(memory.getItem(key), before);
  assert.equal(memory.getItem(disk.keys.snapshot), snapshot);
  memory.rejectKey = null; assert.equal(disk.save(next).ok, true);
  assert.equal(store(memory).load().state.drafts.a.code, "print(2)");
});
check("Quota ao proteger o primeiro estado existente bloqueia sua substituição", () => {
  const raw = JSON.stringify(state()), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  memory.rejectKey = disk.keys.snapshot;
  const next = state(); next.drafts.a.code = "print(1)";
  assert.equal(disk.save(next).status, "quota"); assert.equal(memory.getItem(key), raw);
});
check("Falha ao atualizar snapshot é informada sem negar o salvamento principal", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state());
  const previous = memory.getItem(disk.keys.snapshot), next = state(); next.drafts.a.code = "print(2)";
  memory.rejectKey = disk.keys.snapshot;
  const result = disk.save(next);
  assert.equal(result.ok, true); assert.equal(result.snapshot, false); assert.ok(result.message.includes("cópia"));
  assert.equal(memory.getItem(disk.keys.snapshot), previous); assert.equal(JSON.parse(memory.getItem(key)).drafts.a.code, "print(2)");
});
check("Snapshot restaura após reabertura e arquiva o original truncado", () => {
  const memory = simulated(), first = store(memory), source = state(); source.drafts.a.code = "print(42)";
  first.load(); first.save(source); memory.setItem(key, "{truncado");
  const second = store(memory), loaded = second.load();
  assert.equal(loaded.status, "corrupt"); assert.equal(loaded.recovery.state.drafts.a.code, "print(42)");
  assert.equal(second.save(state()).ok, false); assert.equal(memory.getItem(key), "{truncado");
  const result = second.recover();
  assert.equal(result.ok, true); assert.equal(result.recovered, true); assert.deepEqual(result.state, source);
  assert.equal(JSON.parse(second.exportArchive()).entries[0].raw, "{truncado");
  assert.equal(second.exportOriginal(), "{truncado");
  assert.equal(store(memory).load().status, "ready");
});
check("Sem snapshot válido, recuperação não toca no original", () => {
  const memory = simulated({ [key]: "broken", [key + ":ultimo-valido"]: JSON.stringify({ version: 10, drafts: {} }) }), disk = store(memory);
  assert.equal(disk.load().recovery, null); assert.equal(disk.recover().status, "no-recovery"); assert.equal(memory.getItem(key), "broken");
});
check("Chave principal ausente não elimina um snapshot recuperável", () => {
  const previous = state(); previous.drafts.a.code = "print('recuperável')";
  const memory = simulated({ [key + ":ultimo-valido"]: JSON.stringify(previous) }), disk = store(memory), loaded = disk.load();
  assert.equal(loaded.status, "empty"); assert.equal(loaded.writable, false); assert.equal(loaded.recovery.state.drafts.a.code, previous.drafts.a.code);
  assert.equal(disk.save(state()).ok, false); assert.equal(memory.getItem(key), null);
  assert.equal(disk.recover().ok, true); assert.deepEqual(JSON.parse(memory.getItem(key)), previous);
});
check("Estado já salvo também recebe snapshot quando há espaço", () => {
  const raw = JSON.stringify(state()), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  const result = disk.save(state()); assert.equal(result.ok, true); assert.equal(result.snapshot, true);
  assert.equal(memory.getItem(disk.keys.snapshot), raw);
});
check("Falha de quota ao arquivar bloqueia recuperação e importação", () => {
  const memory = simulated(), first = store(memory); first.load(); first.save(state()); memory.setItem(key, "broken");
  const disk = store(memory); disk.load(); memory.rejectKey = disk.keys.archive;
  assert.equal(disk.recover().status, "quota"); assert.equal(memory.getItem(key), "broken");
  assert.equal(disk.replace(state()).status, "quota"); assert.equal(memory.getItem(key), "broken");
});
check("Importação explícita preserva versão futura e exige estrutura válida", () => {
  const raw = JSON.stringify({ version: 7, drafts: { a: "future" } }), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  assert.equal(disk.replace({}).status, "invalid"); assert.equal(memory.getItem(key), raw);
  assert.equal(disk.replace(state()).ok, true);
  assert.equal(JSON.parse(disk.exportArchive()).entries[0].raw, raw);
});
check("Arquivo de recuperação ilegível não é sobrescrito para restaurar outro", () => {
  const memory = simulated({ [key]: "broken", [key + ":ultimo-valido"]: JSON.stringify(state()), [key + ":recuperacao"]: "old broken archive" });
  const disk = store(memory); disk.load(); assert.equal(disk.recover().ok, false);
  assert.equal(memory.getItem(key), "broken"); assert.equal(disk.exportArchive(), "old broken archive");
});
check("Duas abas detectam conflito antes de salvar, importar ou apagar", () => {
  const memory = simulated({ [key]: JSON.stringify(state()) }), a = store(memory), b = store(memory);
  a.load(); b.load(); const next = state(); next.drafts.a.code = "aba A"; assert.equal(a.save(next).ok, true);
  const current = memory.getItem(key);
  assert.equal(b.check().status, "conflict"); assert.equal(b.save(state()).status, "conflict");
  assert.equal(b.replace(state()).status, "conflict"); assert.equal(b.clear().status, "conflict");
  assert.equal(memory.getItem(key), current);
  assert.equal(b.reload().state.drafts.a.code, "aba A"); assert.equal(b.save(next).ok, true);
});
check("Conflito também impede recuperar ou salvar após remoção externa", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state());
  memory.removeItem(key);
  assert.equal(disk.recover().status, "conflict"); assert.equal(disk.save(state()).status, "conflict"); assert.equal(memory.getItem(key), null);
});
check("Permissão de leitura removida durante a sessão impede gravações", () => {
  const raw = JSON.stringify(state()), memory = simulated({ [key]: raw }), disk = store(memory); disk.load(); memory.deniedReads = true;
  assert.equal(disk.check().status, "unavailable"); assert.equal(disk.save(state()).status, "unavailable");
  memory.deniedReads = false; assert.equal(memory.getItem(key), raw);
});
check("Releitura antes da mutação detecta mudança durante a criação do snapshot", () => {
  const raw = JSON.stringify(state()), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  const external = state(); external.drafts.a.code = "outra aba";
  memory.beforeSet = name => { if (name === disk.keys.snapshot) memory.data.set(key, JSON.stringify(external)); };
  const next = state(); next.drafts.a.code = "minha aba";
  assert.equal(disk.save(next).status, "conflict"); assert.equal(JSON.parse(memory.getItem(key)).drafts.a.code, "outra aba");
});
check("Dados desconhecidos sobrevivem à normalização sem restaurar registros removidos", () => {
  const source = state(); source.extra = { note: "extensão" }; source.drafts.a.extra = { layout: 7 };
  source.drafts.removed = { opaque: "exercício retirado" };
  source.learning.records.a = { attempts: 1, passes: 0, mastery: 0, extra: "metadado" };
  source.learning.attempts = [{ exerciseId: "a", pass: false, at: 42, extra: "observação" }, { exerciseId: "removed", untouched: "original" }];
  const raw = JSON.stringify(source), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  const normalized = progressEngine.validateBackup(source, exercises).state;
  normalized.drafts.a.code = "print(3)";
  assert.equal(disk.save(normalized).ok, true);
  const saved = JSON.parse(memory.getItem(key));
  assert.deepEqual(saved.extra, source.extra); assert.deepEqual(saved.drafts.a.extra, source.drafts.a.extra);
  assert.deepEqual(saved.drafts.removed, source.drafts.removed); assert.equal(saved.learning.records.a.extra, "metadado");
  assert.equal(saved.learning.attempts[0].extra, "observação"); assert.deepEqual(saved.learning.attempts[1], source.learning.attempts[1]);
  assert.equal(JSON.parse(disk.exportArchive()).entries[0].raw, raw);
  normalized.learning.attempts = [];
  assert.equal(disk.save(normalized).ok, true);
  assert.equal(JSON.parse(memory.getItem(key)).learning.attempts.some(row => row.exerciseId === "a"), false);
});
check("Digitação com desconhecidos arquiva apenas uma vez o original inicial", () => {
  const source = state(); source.drafts.removed = { code: "original indisponível" };
  const raw = JSON.stringify(source), memory = simulated({ [key]: raw }), disk = store(memory); disk.load();
  const local = progressEngine.validateBackup(source, exercises).state;
  for (let index = 0; index < 40; index++) {
    local.drafts.a.code += "x";
    assert.equal(disk.save(local).ok, true);
  }
  const entries = JSON.parse(disk.exportArchive()).entries;
  assert.equal(entries.length, 1); assert.equal(entries[0].raw, raw);
  assert.deepEqual(JSON.parse(memory.getItem(key)).drafts.removed, source.drafts.removed);
  assert.equal(JSON.parse(memory.getItem(key)).drafts.a.code, "x".repeat(40));
});
check("Exportação inclui desconhecidos e alterações locais mesmo durante conflito", () => {
  const source = state(); source.extra = { note: "extensão" }; source.drafts.a.extra = { hint: "preservada" };
  source.drafts.removed = { code: "indisponível" };
  const memory = simulated({ [key]: JSON.stringify(source) }), disk = store(memory); disk.load();
  const local = progressEngine.validateBackup(source, exercises).state; local.drafts.a.code = "minha alteração não salva";
  const external = state(); external.drafts.a.code = "outra aba"; memory.setItem(key, JSON.stringify(external));
  const before = [...memory.data.entries()], localBefore = structuredClone(local);
  assert.equal(disk.check().status, "conflict");
  const exported = disk.exportState(local);
  assert.equal(exported.drafts.a.code, "minha alteração não salva"); assert.deepEqual(exported.extra, source.extra);
  assert.deepEqual(exported.drafts.a.extra, source.drafts.a.extra); assert.deepEqual(exported.drafts.removed, source.drafts.removed);
  assert.deepEqual([...memory.data.entries()], before); assert.deepEqual(local, localBefore);
  exported.drafts.a.code = "modificado depois";
  assert.equal(disk.exportState(local).drafts.a.code, "minha alteração não salva");
});
check("Exportação em armazenamento inacessível conserva o trabalho em memória", () => {
  const memory = simulated(); memory.deniedReads = true;
  const disk = store(memory); disk.load(); const local = state(); local.drafts.a.code = "print('local')";
  assert.deepEqual(disk.exportState(local), local); assert.equal(memory.data.size, 0);
});
check("Índices de histórico preservam metadados após reordenar ou remover tentativas", () => {
  const source = state();
  source.learning.attempts = Array.from({ length: 400 }, (_, index) => ({ exerciseId: "a", pass: false, at: index,
    roundId: "round-" + index, extra: "nota " + index }));
  const memory = simulated({ [key]: JSON.stringify(source) }), disk = store(memory); disk.load();
  const local = progressEngine.validateBackup(source, exercises).state;
  local.learning.attempts = local.learning.attempts.slice(-200).reverse();
  assert.equal(disk.save(local).ok, true);
  const saved = JSON.parse(memory.getItem(key));
  assert.equal(saved.learning.attempts.length, 200);
  assert.equal(saved.learning.attempts[0].extra, "nota 399"); assert.equal(saved.learning.attempts[199].extra, "nota 200");
});
check("Cache de snapshot é invalidado quando seu conteúdo muda externamente", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state());
  memory.setItem(disk.keys.snapshot, "truncated snapshot");
  assert.equal(disk.recover().status, "no-recovery");
  const next = state(); next.drafts.a.code = "nova cópia válida"; memory.setItem(disk.keys.snapshot, JSON.stringify(next));
  assert.equal(disk.recover().ok, true); assert.equal(JSON.parse(memory.getItem(key)).drafts.a.code, "nova cópia válida");
});
check("Gravação inválida, referências circulares e chaves reservadas não mudam os dados", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state()); const before = memory.getItem(key);
  const circular = state(); circular.loop = circular;
  const reserved = JSON.parse('{"version":4,"drafts":{"__proto__":{"code":"bad"}}}');
  for (const value of [{ ...state(), drafts: [] }, circular, reserved]) assert.equal(disk.save(value).status, "invalid");
  assert.equal(memory.getItem(key), before);
});
check("Apagar remove progresso e snapshot sem ressuscitá-los; falha conserva o principal", () => {
  const memory = simulated(), disk = store(memory); disk.load(); disk.save(state());
  memory.deniedRemovals = true; assert.equal(disk.clear().ok, false); assert.ok(memory.getItem(key));
  memory.deniedRemovals = false; assert.equal(disk.clear().ok, true);
  assert.equal(memory.getItem(key), null); assert.equal(memory.getItem(disk.keys.snapshot), null); assert.equal(store(memory).load().status, "empty");
});
check("Apagar conteúdo protegido exige arquivar seu original", () => {
  const memory = simulated({ [key]: "broken" }), disk = store(memory); disk.load(); memory.rejectKey = disk.keys.archive;
  assert.equal(disk.clear().ok, false); assert.equal(memory.getItem(key), "broken");
  memory.rejectKey = null; assert.equal(disk.clear().ok, true); assert.equal(JSON.parse(disk.exportArchive()).entries[0].raw, "broken");
});
check("Apagar progresso ativo conserva arquivos de recuperação exportáveis", () => {
  const memory = simulated({ [key]: "broken" }), disk = store(memory); disk.load(); assert.equal(disk.replace(state()).ok, true);
  const archive = disk.exportArchive(); assert.equal(disk.clear().ok, true);
  assert.equal(memory.getItem(key), null); assert.equal(memory.getItem(disk.keys.snapshot), null); assert.equal(disk.exportArchive(), archive);
  assert.equal(store(memory).load().status, "empty");
});
console.log(checks + " verificações de armazenamento e recuperação passaram.");
