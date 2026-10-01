/* LEGADO: mantido apenas como referência da primeira versão. A página atual usa treinador.js. */
(function () {
  "use strict";
  const exercises = window.EXERCISES;
  const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
  const $ = id => document.getElementById(id);
  const storageKey = "python-de-cabeca-v1";
  const normal = text => text.replace(/\r\n/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").replace(/\n+$/, "");
  let storageAvailable = true;
  let mode = "practice";
  let busy = false;
  let cancelled = false;
  let escapeTab = false;
  let state = { activeId: exercises[0].id, drafts: {}, exam: null };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === "object") {
      if (byId.has(saved.activeId)) state.activeId = saved.activeId;
      for (const exercise of exercises) {
        const draft = saved.drafts?.[exercise.id];
        if (draft && typeof draft.code === "string") {
          state.drafts[exercise.id] = { code: draft.code, helped: !!draft.helped, result: validResult(draft.result) };
        }
      }
      const exam = saved.exam;
      if (exam && Array.isArray(exam.ids) && exam.ids.length === 6 && new Set(exam.ids).size === 6 &&
          exam.ids.every(id => byId.has(id)) && Number.isFinite(exam.startedAt) && exam.answers && typeof exam.answers === "object") {
        state.exam = {
          ids: exam.ids, activeId: exam.ids.includes(exam.activeId) ? exam.activeId : exam.ids[0],
          startedAt: exam.startedAt, finishedAt: Number.isFinite(exam.finishedAt) ? exam.finishedAt : null,
          answers: Object.fromEntries(exam.ids.map(id => [id, typeof exam.answers[id] === "string" ? exam.answers[id] : ""])),
          results: Object.fromEntries(exam.ids.map(id => [id, validResult(exam.results?.[id])]))
        };
        if (state.exam.finishedAt && !exam.ids.every(id => state.exam.results[id])) state.exam.finishedAt = null;
      }
    }
  } catch (_) { storageAvailable = false; }

  function validResult(result) {
    return result && typeof result === "object" && Array.isArray(result.cases) &&
      result.cases.every(item => item && typeof item.pass === "boolean") ? result : null;
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      storageAvailable = true;
    } catch (_) { storageAvailable = false; }
    $("storage-status").textContent = storageAvailable
      ? "Rascunhos salvos neste navegador."
      : "O navegador não permitiu salvar. Mantenha esta aba aberta para não perder os rascunhos.";
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function pyRepr(value) {
    if (value === null) return "None";
    if (typeof value === "boolean") return value ? "True" : "False";
    if (Array.isArray(value)) return "[" + value.map(pyRepr).join(", ") + "]";
    return JSON.stringify(value);
  }

  function currentExercise() { return byId.get(mode === "exam" ? state.exam.activeId : state.activeId); }
  function currentList() { return mode === "exam" ? state.exam.ids.map(id => byId.get(id)) : exercises; }
  function draft(id) { return state.drafts[id] || (state.drafts[id] = { code: "", helped: false, result: null }); }
  function answerFor(id) { return mode === "exam" ? state.exam.answers[id] : draft(id).code; }
  function resultFor(id) { return mode === "exam" ? (state.exam.finishedAt ? state.exam.results[id] : null) : draft(id).result; }

  function recordInput() {
    const exercise = currentExercise();
    if (mode === "exam") state.exam.answers[exercise.id] = $("answer").value;
    else {
      draft(exercise.id).code = $("answer").value;
      draft(exercise.id).result = null;
    }
    save();
    $("feedback").hidden = true;
    renderNavigation();
    renderState();
  }

  function renderState() {
    const exercise = currentExercise();
    const result = resultFor(exercise.id);
    let label = answerFor(exercise.id).trim() ? "Em andamento" : "Para tentar";
    if (mode === "exam" && !state.exam.finishedAt) label = answerFor(exercise.id).trim() ? "Resposta guardada" : "Em branco";
    else if (result?.pass) label = mode === "practice" && draft(exercise.id).helped ? "Resolvido com apoio" : "Resolvido";
    else if (result) label = "Para revisar";
    $("exercise-state").textContent = label;
    $("exercise-state").className = "tag" + (result?.pass ? " success" : "");
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
      button.type = "button";
      button.disabled = busy;
      button.setAttribute("aria-current", String(exercise.id === currentExercise().id));
      const result = resultFor(exercise.id);
      const mark = result?.pass ? "✓" : result ? "↺" : answerFor(exercise.id).trim() ? "·" : "";
      button.setAttribute("aria-label", exercise.title + (result?.pass ? ", resolvido" : result ? ", para revisar" : ""));
      button.append(element("span", String(index + 1).padStart(2, "0"), "exercise-number"), element("span", exercise.title), element("span", mark, "exercise-mark"));
      button.onclick = () => navigate(exercise.id);
      nav.append(button);
    });
    nav.scrollTop = scrollPosition;
    const selected = nav.querySelector('[aria-current="true"]');
    const navBounds = nav.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    if (selectedBounds.bottom > navBounds.bottom) nav.scrollTop += selectedBounds.bottom - navBounds.bottom;
    else if (selectedBounds.top < navBounds.top) nav.scrollTop -= navBounds.top - selectedBounds.top;
    const done = list.filter(exercise => mode === "exam" && !state.exam.finishedAt ? answerFor(exercise.id).trim() : resultFor(exercise.id)?.pass).length;
    $("progress-label").textContent = mode === "exam" && !state.exam.finishedAt ? "Questões preenchidas" : "Exercícios resolvidos";
    $("progress-count").textContent = done + " / " + list.length;
    $("progress").max = list.length;
    $("progress").value = done;
    $("progress").setAttribute("aria-label", $("progress-label").textContent);
  }

  function navigate(id) {
    if (busy) return;
    if (mode === "exam") state.exam.activeId = id;
    else state.activeId = id;
    save();
    render();
    $("exercise-title").focus({ preventScroll: true });
  }

  function renderExample(exercise) {
    const container = $("example");
    container.replaceChildren();
    container.hidden = exercise.kind === "trace";
    if (exercise.kind === "trace") return;
    const example = exercise.cases[0];
    const input = exercise.kind === "function" ? exercise.fn + "(" + example.args.map(pyRepr).join(", ") + ")" : example.inputs.join("\n") || "Sem entrada";
    const output = exercise.kind === "function" ? pyRepr(example.expected) : example.expected;
    [[exercise.kind === "function" ? "EXEMPLO DE CHAMADA" : "EXEMPLO DE ENTRADA", input], [exercise.kind === "function" ? "RETORNO ESPERADO" : "SAÍDA ESPERADA", output]].forEach(([label, value]) => {
      const block = element("div");
      block.append(element("span", label, "example-label"), element("pre", value));
      container.append(block);
    });
  }

  function render() {
    const exercise = currentExercise();
    const exam = mode === "exam";
    const submitted = exam && !!state.exam.finishedAt;
    const list = currentList();
    const index = list.findIndex(item => item.id === exercise.id);
    $("practice-mode").setAttribute("aria-pressed", String(!exam));
    $("exam-mode").setAttribute("aria-pressed", String(exam));
    $("exam-panel").hidden = !exam;
    $("sidebar-note").textContent = exam ? (submitted ? "Correção liberada. Revise cada questão." : "Escreva as 6 respostas antes de corrigir.") : "Comece do zero. A dica fica a um clique.";
    $("exercise-meta").textContent = (exam ? "QUESTÃO " + (index + 1) + " · " : "") + exercise.group.replace(/^\d+ · /, "");
    $("exercise-title").textContent = exercise.title;
    $("exercise-prompt").textContent = exercise.prompt;
    $("exercise-rule").textContent = exercise.rule;
    renderExample(exercise);
    $("trace").hidden = exercise.kind !== "trace";
    $("trace-code").textContent = exercise.code || "";
    $("answer-label").textContent = exercise.kind === "trace" ? "A saída que você prevê" : "Seu código";
    $("editor-type").textContent = exercise.kind === "trace" ? "Teste de mesa" : "Python 3";
    $("answer").value = answerFor(exercise.id);
    $("answer").placeholder = exercise.kind === "trace" ? "Escreva a saída, uma linha por vez…" : "Comece aqui, de memória…";
    $("answer").disabled = busy || submitted;
    $("editor-help").textContent = exam ? "Use 4 espaços para cada recuo. A correção aparece depois de entregar." : "Tab = 4 espaços · Esc e depois Tab = sair do campo · Ctrl+Enter = verificar";
    $("check-button").hidden = exam;
    $("skeleton-button").hidden = exam || exercise.kind === "trace";
    $("retry-button").hidden = exam;
    $("study-tools").hidden = exam && !submitted;
    $("hint-details").open = false;
    $("solution-details").open = false;
    $("hint-text").textContent = exercise.hint;
    $("solution-code").textContent = exercise.solution;
    $("solution-note").textContent = exercise.note;
    $("reference-button").disabled = busy || (exam && !submitted);
    $("print-button").textContent = exam ? "Imprimir prova" : "Imprimir exercício";
    $("position").textContent = (index + 1) + " de " + list.length;
    $("previous-button").disabled = busy || index === 0;
    $("next-button").disabled = busy || index === list.length - 1;
    $("finish-exam").hidden = submitted;
    $("exam-title").textContent = submitted ? "Simulado corrigido" : "Simulado de 6 questões";
    $("exam-description").textContent = submitted ? "Abra as questões para ver os testes e as soluções. O tempo abaixo é o total até a entrega." : "Sem dicas e sem correção entre questões. Se quiser, resolva no papel e transcreva antes de entregar. O relógio só mede seu tempo; não há limite.";
    $("exam-summary").hidden = !submitted;
    if (submitted) {
      const count = state.exam.ids.filter(id => state.exam.results[id]?.pass).length;
      $("exam-summary").textContent = count + "/6 questões corretas. " + (count === 6 ? "Agora vale repetir no papel, sem consultar." : "Reveja as marcadas com ↺ e depois tente outro simulado.");
    }
    renderNavigation();
    renderState();
    renderFeedback(resultFor(exercise.id), exercise);
    updateClock();
  }

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

  function appendError(container, error) {
    container.append(element("p", error.kind + (error.line ? " · linha " + error.line : ""), "error-text"));
    container.append(element("pre", error.message));
    if (errorTips[error.kind]) container.append(element("p", errorTips[error.kind]));
  }

  function renderFeedback(result, exercise) {
    const container = $("feedback");
    container.replaceChildren();
    container.hidden = !result;
    if (!result) return;
    container.append(element("h3", result.pass ? "Passou. Agora tente repetir de memória." : "Ainda tem algo para ajustar.", result.pass ? "success-text" : "error-text"));
    if (result.error) appendError(container, result.error);
    if (result.rules?.length) result.rules.forEach(rule => container.append(element("p", rule, "error-text")));
    const results = result.cases || [];
    if (results.length) container.append(element("p", results.filter(item => item.pass).length + "/" + results.length + " casos passaram."));
    results.forEach((item, index) => {
      const details = element("details");
      details.open = !item.pass;
      details.append(element("summary", (item.pass ? "✓" : "↺") + " Caso " + (index + 1)));
      if (exercise.kind !== "trace") {
        const test = exercise.cases[index];
        const input = exercise.kind === "function" ? exercise.fn + "(" + test.args.map(pyRepr).join(", ") + ")" : test.inputs.join("\n") || "Sem entrada";
        details.append(element("pre", (exercise.kind === "function" ? "Chamada: " : "Entrada:\n") + input));
      }
      if (item.error) appendError(details, item.error);
      else {
        details.append(element("pre", "Esperado:\n" + item.expected + "\n\nObtido:\n" + (item.got === "" ? "(saída vazia)" : item.got)));
        if (item.got === "None" && !item.pass && exercise.kind === "function") details.append(element("p", "A função devolveu None. Faltou return? print() não devolve o resultado."));
        if (item.changed) details.append(element("p", "A lista recebida foi alterada. Crie outra lista para devolver."));
        if (item.stdout) details.append(element("pre", "Seu print mostrou (não é o retorno):\n" + item.stdout));
      }
      container.append(details);
    });
    if (result.pass && mode === "practice" && draft(exercise.id).helped) container.append(element("p", "Você usou apoio nesta tentativa. Use “Refazer do zero” para treinar sem consulta."));
  }

  function setBusy(value) {
    busy = value;
    ["check-button", "skeleton-button", "retry-button", "practice-mode", "exam-mode", "finish-exam", "new-exam", "print-button"].forEach(id => { $(id).disabled = value; });
    $("stop-button").hidden = !value;
    $("answer").disabled = value || (mode === "exam" && !!state.exam.finishedAt);
    $("reference-button").disabled = value || (mode === "exam" && !state.exam.finishedAt);
    const index = currentList().findIndex(item => item.id === currentExercise().id);
    $("previous-button").disabled = value || index === 0;
    $("next-button").disabled = value || index === currentList().length - 1;
    renderNavigation();
  }

  async function grade(exercise, code) {
    if (!code.trim()) return { pass: false, cases: [], error: { kind: "Resposta em branco", message: "Escreva sua resposta antes de conferir." } };
    if (exercise.kind === "trace") {
      const pass = normal(code) === normal(exercise.answer);
      return { pass, cases: [{ pass, got: normal(code), expected: exercise.answer }] };
    }
    return window.PythonRunner.run(exercise, code);
  }

  async function checkAnswer() {
    if (busy || mode !== "practice") return;
    const exercise = currentExercise();
    setBusy(true);
    $("check-button").textContent = "Verificando…";
    $("feedback").hidden = true;
    try {
      draft(exercise.id).result = await grade(exercise, draft(exercise.id).code);
      save();
      renderFeedback(draft(exercise.id).result, exercise);
    } catch (error) {
      $("feedback").replaceChildren(element("p", error.message, "error-text"));
      $("feedback").hidden = false;
    } finally {
      setBusy(false);
      $("check-button").textContent = "Verificar resposta";
      renderState();
    }
  }

  function createExam() {
    // Uma questão de cada grupo; a sexta reforça listas e funções.
    const groups = [...new Set(exercises.map(exercise => exercise.group))];
    const choose = pool => pool[Math.floor(Math.random() * pool.length)].id;
    const ids = groups.map(group => choose(exercises.filter(exercise => exercise.group === group)));
    const extra = choose(exercises.filter(exercise => exercise.kind === "function" && !ids.includes(exercise.id)));
    ids.splice(4, 0, extra);
    state.exam = { ids, activeId: ids[0], answers: Object.fromEntries(ids.map(id => [id, ""])), results: {}, startedAt: Date.now(), finishedAt: null };
    save();
  }

  async function finishExam() {
    if (busy || state.exam.finishedAt) return;
    const blanks = state.exam.ids.filter(id => !state.exam.answers[id].trim()).length;
    if (!window.confirm("Entregar as 6 respostas e liberar a correção?" + (blanks ? " Há " + blanks + " questão(ões) em branco." : ""))) return;
    const submittedAt = Date.now();
    cancelled = false;
    setBusy(true);
    state.exam.results = {};
    $("exam-summary").hidden = false;
    try {
      for (const [index, id] of state.exam.ids.entries()) {
        if (cancelled) throw new Error("Correção interrompida. Suas respostas estão guardadas; você pode entregar novamente.");
        $("exam-summary").textContent = "Corrigindo questão " + (index + 1) + " de 6…";
        state.exam.results[id] = await grade(byId.get(id), state.exam.answers[id]);
      }
      state.exam.finishedAt = submittedAt;
      save();
      render();
    } catch (error) {
      state.exam.results = {};
      save();
      $("exam-summary").textContent = error.message + " O simulado ainda não foi entregue.";
    } finally { setBusy(false); }
  }

  function updateClock() {
    if (mode !== "exam") return;
    const seconds = Math.max(0, Math.floor(((state.exam.finishedAt || Date.now()) - state.exam.startedAt) / 1000));
    $("exam-clock").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  }

  function markHelp() {
    if (mode !== "practice") return;
    draft(currentExercise().id).helped = true;
    save();
    renderState();
  }

  function buildPrintSheet() {
    const sheet = $("print-sheet");
    sheet.replaceChildren();
    const heading = element("div", undefined, "print-heading");
    heading.append(element("h1", "Python, de cabeça."), element("p", "Nome: ____________________________________    Data: ____/____/______"), element("p", "Escreva à mão, sem consulta. Confira nomes, dois-pontos, recuos e a posição do return."));
    sheet.append(heading);
    const selected = mode === "exam" ? currentList() : [currentExercise()];
    selected.forEach((exercise, index) => {
      const block = element("article", undefined, "print-exercise");
      block.append(element("h2", (index + 1) + ". " + exercise.title), element("p", exercise.prompt), element("p", exercise.rule));
      if (exercise.kind === "trace") block.append(element("pre", exercise.code));
      else {
        const test = exercise.cases[0];
        const input = exercise.kind === "function" ? exercise.fn + "(" + test.args.map(pyRepr).join(", ") + ")" : test.inputs.join(", ") || "sem entrada";
        block.append(element("pre", "Exemplo: " + input + " → " + (exercise.kind === "function" ? pyRepr(test.expected) : test.expected.replace(/\n/g, " / "))));
      }
      const lines = element("div", undefined, "writing-lines");
      for (let i = 0; i < 8; i++) lines.append(element("span"));
      block.append(lines);
      sheet.append(block);
    });
  }

  $("answer").addEventListener("input", recordInput);
  $("answer").addEventListener("keydown", event => {
    if (event.key === "Escape") { escapeTab = true; return; }
    if (event.key === "Tab" && escapeTab) { escapeTab = false; return; }
    escapeTab = false;
    if (event.key === "Tab" && !event.shiftKey && !$("answer").disabled) {
      event.preventDefault();
      const field = $("answer");
      field.setRangeText("    ", field.selectionStart, field.selectionEnd, "end");
      recordInput();
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && mode === "practice") { event.preventDefault(); checkAnswer(); }
  });
  $("check-button").onclick = checkAnswer;
  $("stop-button").onclick = () => { cancelled = true; window.PythonRunner.stop(); };
  $("skeleton-button").onclick = () => {
    if (draft(currentExercise().id).code.trim() && !window.confirm("Substituir o rascunho pelo começo sugerido?")) return;
    $("answer").value = currentExercise().starter;
    recordInput();
    markHelp();
    $("answer").focus();
  };
  $("retry-button").onclick = () => {
    if (draft(currentExercise().id).code.trim() && !window.confirm("Apagar esta resposta e tentar novamente do zero?")) return;
    state.drafts[currentExercise().id] = { code: "", helped: false, result: null };
    save(); render(); $("answer").focus();
  };
  ["hint-details", "solution-details"].forEach(id => $(id).addEventListener("toggle", () => { if ($(id).open) markHelp(); }));
  $("reference-button").onclick = () => { markHelp(); $("reference-dialog").showModal(); };
  $("close-reference").onclick = () => $("reference-dialog").close();
  $("practice-mode").onclick = () => { mode = "practice"; render(); };
  $("exam-mode").onclick = () => { if (!state.exam) createExam(); mode = "exam"; render(); };
  $("new-exam").onclick = () => {
    if (!window.confirm("Gerar outro simulado? As respostas do simulado atual serão substituídas. O treino continua salvo.")) return;
    createExam(); render();
  };
  $("finish-exam").onclick = finishExam;
  $("previous-button").onclick = () => { const list = currentList(); navigate(list[list.findIndex(item => item.id === currentExercise().id) - 1].id); };
  $("next-button").onclick = () => { const list = currentList(); navigate(list[list.findIndex(item => item.id === currentExercise().id) + 1].id); };
  $("print-button").onclick = () => { buildPrintSheet(); window.print(); };
  window.addEventListener("beforeprint", buildPrintSheet);
  window.PythonRunner.setStatus(message => { $("runtime-status").textContent = message; });
  setInterval(updateClock, 1000);
  render();
  save();
})();
