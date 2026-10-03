/* Persistência sem interface. Mantém a chave e o estado da aplicação na versão 4.
 *
 * Integração (incluir depois de progresso.js):
 * const store = STORAGE_ENGINE.create({ storage: () => localStorage, exercises });
 * const loaded = store.load();
 * const state = normalizeState(loaded.state || initialState());
 * const result = store.save(state); // nunca substitui conteúdo protegido/conflitante
 * const backupState = store.exportState(state); // inclui extensões e edições locais
 * store.recover(); // ação explícita: arquiva o original e restaura loaded.recovery
 * store.replace(importedState); // ação explícita após a prévia de importação
 * store.clear(); // apaga progresso ativo e snapshot; conserva arquivos de recuperação
 *
 * load: ready, empty, corrupt, future ou unavailable; raw conserva o texto original.
 * save/replace/recover/clear: { ok, status, message }; quota não apaga a chave atual.
 * reload/load adotam explicitamente o conteúdo atual; check detecta outra aba sem adotá-lo.
 * exportOriginal devolve o original desta leitura; exportArchive devolve originais
 * preservados em recuperações/importações ou quando exercícios ficaram indisponíveis.
 * exportState(state) não grava nem adota outra aba: combina o estado local com
 * extensões da leitura original. Funciona também enquanto um conflito impede salvar.
 *
 * Web Storage não oferece uma transação entre chaves nem compare-and-swap. A leitura
 * imediatamente antes de gravar protege conflitos usuais; uma corrida simultânea
 * entre processos ainda é possível. O snapshot é atualizado depois da chave principal;
 * se essa etapa falhar, o progresso atual continua salvo e o resultado informa o limite.
 */
(function (root) {
  "use strict";
  const DEFAULT_KEY = "python-de-cabeca-v1";
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const errorText = error => error?.message || String(error);
  const isQuota = error => error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED" || error?.code === 22 || error?.code === 1014;

  function create(options = {}) {
    const key = options.key || DEFAULT_KEY;
    const snapshotKey = key + ":ultimo-valido";
    const archiveKey = key + ":recuperacao";
    const progress = options.progressEngine || root.PROGRESS_ENGINE ||
      (typeof require === "function" ? require("./progresso.js") : null);
    if (!progress?.validateBackup) throw new Error("O validador de progresso deve ser carregado antes do armazenamento.");
    const exercises = options.exercises;
    if (!Array.isArray(exercises) || !exercises.length) throw new Error("Informe os exercícios para validar o progresso.");
    const knownIds = new Set(exercises.map(item => typeof item === "string" ? item : item.id));
    const access = () => typeof options.storage === "function" ? options.storage() : options.storage;
    let storage, expectedRaw, originalRaw = null, originalState = null, canonicalState = null;
    let current = { status: "unavailable", state: null, raw: null, writable: false, recovery: null, warnings: [] };
    let initialized = false;
    let unknownArchived = false;
    let snapshotCachedRaw, snapshotCached = null;

    function inspect(raw) {
      if (raw === null) return { status: "empty", state: null, canonical: null, warnings: [] };
      try {
        const payload = JSON.parse(raw);
        const source = object(payload) && own(payload, "state") ? payload.state : payload;
        if ([payload?.version, source?.version].some(version => Number.isInteger(version) && version > 4)) {
          return { status: "future", state: null, canonical: null, warnings: [], message: "O progresso usa uma versão mais recente. O original foi mantido." };
        }
        const validated = progress.validateBackup(payload, exercises);
        return { status: "ready", state: clone(source), canonical: validated.state, warnings: validated.warnings };
      } catch (error) {
        return { status: "corrupt", state: null, canonical: null, warnings: [], message: errorText(error) };
      }
    }

    function readSnapshot() {
      try {
        const raw = storage.getItem(snapshotKey);
        if (raw === snapshotCachedRaw) return snapshotCached;
        const value = inspect(raw);
        snapshotCachedRaw = raw;
        snapshotCached = value.status === "ready" ? { raw, state: value.state, warnings: value.warnings } : null;
        return snapshotCached;
      } catch (_) { return null; }
    }

    function rememberSnapshot(raw, state, warnings) {
      snapshotCachedRaw = raw;
      snapshotCached = { raw, state, warnings };
    }

    function load() {
      initialized = true;
      unknownArchived = false;
      snapshotCachedRaw = undefined;
      snapshotCached = null;
      try {
        storage = access();
        if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") throw new Error("Armazenamento indisponível.");
        expectedRaw = storage.getItem(key);
        originalRaw = expectedRaw;
        const inspected = inspect(expectedRaw);
        originalState = inspected.state;
        canonicalState = inspected.canonical;
        current = { ...inspected, raw: expectedRaw, writable: ["ready", "empty"].includes(inspected.status), recovery: null };
        delete current.canonical;
        if (current.status !== "ready") current.recovery = readSnapshot();
        // Uma chave principal ausente com snapshot existente pode resultar de uma
        // limpeza parcial. A inicialização não substitui essa cópia por estado vazio.
        if (current.status === "empty" && current.recovery) {
          current.writable = false;
          current.message = "A chave principal está vazia, mas há uma cópia válida de recuperação.";
        }
      } catch (error) {
        expectedRaw = undefined; originalRaw = null; originalState = null; canonicalState = null;
        current = { status: "unavailable", state: null, raw: null, writable: false, recovery: null, warnings: [], message: errorText(error) };
      }
      return clone(current);
    }

    function failure(status, message) { return { ok: false, status, message }; }
    function check() {
      if (!initialized) load();
      if (expectedRaw === undefined) return failure("unavailable", "O navegador não permitiu ler o progresso. Esta aba conserva suas alterações em memória.");
      try {
        if (storage.getItem(key) !== expectedRaw) return failure("conflict", "O progresso mudou em outra aba. Exporte suas alterações antes de recarregar.");
      } catch (error) { return failure("unavailable", "Não foi possível conferir o progresso salvo: " + errorText(error)); }
      return { ok: true, status: current.status };
    }

    function rowKey(value) {
      if (!object(value)) return null;
      if (typeof value.id === "string") return "id:" + value.id;
      if (value.exerciseId && value.at !== undefined) return "attempt:" + value.exerciseId + ":" + value.at + ":" + (value.roundId || "");
      if (value.exerciseId && value.createdAt !== undefined) return "mistake:" + value.exerciseId + ":" + value.createdAt;
      if (value.roundId && value.at !== undefined) return "credit:" + value.roundId + ":" + value.at;
      return null;
    }

    // A interface normaliza campos conhecidos. Conserva extensões não compreendidas
    // pelo validador, sem ressuscitar os registros conhecidos removidos pelo usuário.
    function indexRows(rows) {
      const indexed = new Map();
      for (const row of rows) {
        const id = rowKey(row);
        if (id !== null && !indexed.has(id)) indexed.set(id, row);
      }
      return indexed;
    }

    // incoming já é uma cópia isolada. Clonar somente extensões evita serializar
    // outra vez todo o estado a cada nível da árvore; índices eliminam buscas n².
    function preserveUnknown(source, clean, incoming) {
      if (object(source) && object(clean) && object(incoming)) {
        for (const field of Object.keys(source)) {
          if (!own(clean, field) && !own(incoming, field)) incoming[field] = clone(source[field]);
          else if (own(clean, field) && own(incoming, field)) incoming[field] = preserveUnknown(source[field], clean[field], incoming[field]);
        }
        return incoming;
      }
      if (Array.isArray(source) && Array.isArray(clean) && Array.isArray(incoming)) {
        const cleanIndex = indexRows(clean), originalIndex = indexRows(source);
        for (let index = 0; index < incoming.length; index++) {
          const item = incoming[index];
          const id = rowKey(item);
          const previous = id === null ? clean[index] : cleanIndex.get(id);
          const original = id === null ? source[index] : originalIndex.get(id);
          if (previous && original) incoming[index] = preserveUnknown(original, previous, item);
        }
        let existing;
        for (const item of source) if (object(item) && typeof item.exerciseId === "string" && !knownIds.has(item.exerciseId)) {
          if (!existing) existing = new Set(incoming.map(row => JSON.stringify(row)));
          const serialized = JSON.stringify(item);
          if (!existing.has(serialized)) { incoming.push(clone(item)); existing.add(serialized); }
        }
        return incoming;
      }
      return incoming;
    }

    function archive(raw, reason) {
      if (raw === null) return;
      const existing = storage.getItem(archiveKey);
      let entries = [];
      if (existing !== null) {
        try {
          const parsed = JSON.parse(existing);
          if (!Array.isArray(parsed.entries) || !parsed.entries.every(item => object(item) && typeof item.raw === "string")) throw new Error("arquivo de recuperação inválido");
          entries = parsed.entries;
        } catch (_) {
          // Não substitui um arquivo de recuperação que também esteja ilegível.
          throw new Error("O arquivo de recuperação existente está ilegível; exporte-o antes de substituí-lo.");
        }
      }
      if (entries.some(item => item.raw === raw)) return;
      entries.push({ raw, reason, at: new Date().toISOString() });
      storage.setItem(archiveKey, JSON.stringify({ version: 1, entries }));
    }

    function prepareState(state, replace) {
      // A primeira validação rejeita valores que JSON.stringify normalizaria,
      // como undefined/NaN, antes de construir a cópia isolada para salvar/exportar.
      progress.validateBackup(state, exercises);
      const source = own(state, "state") ? state.state : state;
      const next = replace ? clone(source) : preserveUnknown(originalState, canonicalState, clone(source));
      next.version = 4;
      const validated = progress.validateBackup(next, exercises);
      return { next, validated, raw: JSON.stringify(next) };
    }

    function exportState(state) {
      if (!initialized) load();
      return prepareState(state, false).next;
    }

    function write(state, replace) {
      const available = check();
      if (!available.ok) return available;
      if (!replace && !current.writable) return failure(current.status, "O progresso original está protegido. Exporte-o ou restaure uma cópia válida antes de salvar.");
      let next, raw, validated;
      try {
        ({ next, raw, validated } = prepareState(state, replace));
      } catch (error) { return failure("invalid", "O progresso não foi salvo porque a estrutura é inválida: " + errorText(error)); }
      if (raw === expectedRaw) {
        if (readSnapshot()) return { ok: true, status: "saved", snapshot: true };
        try {
          storage.setItem(snapshotKey, raw);
          rememberSnapshot(raw, next, validated.warnings);
          return { ok: true, status: "saved", snapshot: true };
        } catch (error) {
          return { ok: true, status: "saved", snapshot: false, message: "O progresso atual já está salvo, mas a cópia de recuperação não pôde ser criada: " + errorText(error) };
        }
      }
      try {
        if (replace && !current.writable) archive(expectedRaw, current.status);
        else if (current.warnings.length && !unknownArchived) {
          // Conserva uma vez o original desta leitura. Cada tecla muda expectedRaw,
          // mas não justifica arquivar outra cópia completa dos mesmos desconhecidos.
          archive(originalRaw, "exercicios-indisponiveis");
          unknownArchived = true;
        }
        // Na primeira gravação, garante uma saída de recuperação para o estado
        // anterior. Se a quota impedir essa proteção, a chave principal permanece.
        if (current.status === "ready" && !readSnapshot()) {
          storage.setItem(snapshotKey, expectedRaw);
          rememberSnapshot(expectedRaw, originalState, current.warnings);
        }
        const latest = check();
        if (!latest.ok) return latest;
        storage.setItem(key, raw);
      } catch (error) {
        return failure(isQuota(error) ? "quota" : "unavailable", "O progresso anterior foi mantido. Não foi possível gravar: " + errorText(error));
      }
      expectedRaw = raw;
      originalState = next;
      canonicalState = validated.state;
      current = { status: "ready", state: next, raw, writable: true, warnings: validated.warnings, recovery: null };
      try {
        storage.setItem(snapshotKey, raw);
        rememberSnapshot(raw, next, validated.warnings);
        return { ok: true, status: "saved", snapshot: true };
      } catch (error) {
        return { ok: true, status: "saved", snapshot: false, message: "O progresso foi salvo, mas a cópia de recuperação não foi atualizada: " + errorText(error) };
      }
    }

    function recover() {
      const available = check();
      if (!available.ok) return available;
      const recovery = readSnapshot();
      if (!recovery) return failure("no-recovery", "Nenhuma cópia válida de recuperação está disponível.");
      const result = write(recovery.state, true);
      return result.ok ? { ...result, state: clone(current.state), recovered: true } : result;
    }

    // Remove apenas progresso ativo e snapshot. Os originais de recuperação
    // permanecem exportáveis; a confirmação da interface deve informar esse limite.
    function clear() {
      const available = check();
      if (!available.ok) return available;
      try {
        if (!current.writable) archive(expectedRaw, current.status);
        // A cópia é removida primeiro: uma falha não apaga a chave principal.
        storage.removeItem(snapshotKey);
        snapshotCachedRaw = null; snapshotCached = null;
        const latest = check();
        if (!latest.ok) return latest;
        storage.removeItem(key);
      } catch (error) { return failure("unavailable", "Não foi possível apagar o progresso: " + errorText(error)); }
      expectedRaw = null;
      originalState = null; canonicalState = null;
      current = { status: "empty", state: null, raw: null, writable: true, recovery: null, warnings: [] };
      return { ok: true, status: "empty" };
    }

    function exportArchive() {
      try { return (storage || access()).getItem(archiveKey); } catch (_) { return null; }
    }
    return Object.freeze({ load, reload: load, save: state => write(state, false), replace: state => write(state, true),
      recover, clear, check, exportState, exportOriginal: () => originalRaw, exportArchive,
      keys: Object.freeze({ main: key, snapshot: snapshotKey, archive: archiveKey }) });
  }

  const api = Object.freeze({ create, key: DEFAULT_KEY });
  root.STORAGE_ENGINE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
