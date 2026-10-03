(function () {
  "use strict";

  function create(options) {
    const $ = id => document.getElementById(id);
    const engine = options.engine;
    const node = (tag, text, className) => {
      const item = document.createElement(tag);
      if (text !== undefined) item.textContent = text;
      if (className) item.className = className;
      return item;
    };
    const section = $("learning-workbench");
    const reflection = node("details");
    reflection.id = "reflection-details";
    reflection.append(node("summary", "Explique e leve a ideia para outro caso"));
    const explanation = node("p"); explanation.id = "explanation-prompt";
    const transfer = node("p"); transfer.id = "transfer-prompt";
    const notesLabel = node("label", "Seu raciocínio, previsão e o que mudou após conferir"); notesLabel.htmlFor = "reflection-notes";
    const notes = node("textarea"); notes.id = "reflection-notes"; notes.maxLength = 8000; notes.rows = 4;
    const rubric = node("ul"); rubric.id = "reflection-rubric";
    reflection.append(explanation, transfer, notesLabel, notes, node("p", "Anotação pessoal salva no backup. Sua explicação não recebe nota automática.", "small muted"), node("strong", "Confira sua explicação"), rubric);

    const experiment = node("details"); experiment.id = "experiment-details";
    experiment.append(node("summary", "Experimente um caso que você inventou"));
    const inputLabel = node("label"); inputLabel.htmlFor = "experiment-input";
    const input = node("textarea"); input.id = "experiment-input"; input.rows = 3; input.maxLength = 8000; input.spellcheck = false;
    const help = node("p", "", "small muted"); help.id = "experiment-help"; input.setAttribute("aria-describedby", help.id);
    const emptyLabel = node("label");
    const emptyInput = node("input"); emptyInput.type = "checkbox"; emptyInput.id = "experiment-empty-input";
    emptyLabel.append(emptyInput, document.createTextNode(" Fornecer uma entrada vazia quando o campo acima estiver vazio"));
    const predictionLabel = node("label", "Antes de executar: qual resultado você prevê?"); predictionLabel.htmlFor = "experiment-prediction";
    const prediction = node("textarea"); prediction.id = "experiment-prediction"; prediction.rows = 2; prediction.maxLength = 8000;
    const run = node("button", "Executar meu caso", "quiet"); run.id = "run-experiment"; run.type = "button";
    const output = node("div"); output.id = "experiment-result"; output.setAttribute("role", "status"); output.hidden = true;
    experiment.append(inputLabel, input, help, emptyLabel, predictionLabel, prediction, run, node("p", "Esta execução não atribui domínio. Compare o resultado com sua previsão e depois verifique a atividade.", "small muted"), output);

    const project = node("details"); project.id = "project-details";
    const materials = node("nav"); materials.id = "topic-materials"; materials.setAttribute("aria-label", "Leitura sobre esta unidade");
    const exportButton = node("button", "Baixar meu código .py", "quiet"); exportButton.id = "export-python"; exportButton.type = "button";
    section.append(project, reflection, experiment, materials, exportButton);

    const nextHint = node("button", "Mais uma pista", "quiet"); nextHint.id = "next-hint"; nextHint.type = "button";
    $("hint-details").append(nextHint);
    function renderHints() {
      const hints = engine.hintsFor(options.getExercise());
      const level = Math.min(hints.length, Math.max(1, options.getDraft().hintsLevel || 1));
      const content = $("hint-text"); content.replaceChildren();
      hints.slice(0, level).forEach((hint, index) => {
        content.append(node("strong", (index + 1) + ". " + hint.title), node("p", hint.text));
        if (hint.code) content.append(node("pre", hint.code));
      });
      nextHint.hidden = level >= hints.length;
    }
    $("hint-details").addEventListener("toggle", () => {
      if (!$("hint-details").open) return;
      options.getDraft().hintsLevel = Math.max(1, options.getDraft().hintsLevel || 1);
      options.markHelp(); renderHints();
    });
    nextHint.onclick = () => {
      if (options.isBusy()) return;
      options.getDraft().hintsLevel = Math.min(3, Math.max(1, options.getDraft().hintsLevel || 1) + 1);
      options.markHelp(); renderHints();
    };
    for (const [field, key] of [[notes, "reflection"], [input, "experimentInput"], [prediction, "experimentPrediction"]]) {
      field.addEventListener("input", () => { options.getDraft()[key] = field.value; options.scheduleSave(); if (field !== notes) output.hidden = true; });
      field.addEventListener("blur", options.save);
    }
    exportButton.onclick = () => {
      if (options.isBusy()) return;
      const url = URL.createObjectURL(new Blob([options.getAnswer()], { type: "text/x-python;charset=utf-8" }));
      const link = node("a"); link.href = url; link.download = options.getExercise().id + ".py"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    run.onclick = async () => {
      if (options.isBusy()) return;
      const exercise = options.getExercise(), code = options.getAnswer();
      output.replaceChildren(); output.hidden = false;
      if (!code.trim()) { output.append(node("p", "Escreva seu código antes de executar um caso.")); return; }
      options.save(); options.setBusy(true); run.textContent = "Executando…";
      try {
        const result = await window.PythonRunner.experiment(exercise, code, exercise.kind === "function" ? { arguments: input.value } : { inputs: input.value === "" && emptyInput.checked ? [""] : input.value });
        if (result.error) options.appendError(output, result.error);
        else output.append(node("strong", exercise.kind === "function" ? "Retorno da função" : "Saída do programa"), node("pre", result.got || "(saída vazia)"));
        if (result.gotTruncated) output.append(node("p", "Resultado abreviado aos primeiros 8.000 caracteres.", "small muted"));
        if (result.stdout && exercise.kind === "function") output.append(node("strong", "Texto mostrado por print()"), node("pre", result.stdout));
        if (prediction.value.trim()) output.append(node("strong", "Sua previsão"), node("pre", prediction.value));
        output.append(node("p", "O resultado confirma sua previsão? Explique uma diferença antes de alterar o código.", "small muted"));
      } catch (error) { output.append(node("p", error.message, "error-text")); }
      finally { run.textContent = "Executar meu caso"; options.setBusy(false); }
    };

    function setBusy(value) {
      for (const control of [notes, input, emptyInput, prediction, run, nextHint, exportButton]) control.disabled = value;
    }
    function render() {
      const exercise = options.getExercise(), draft = options.getDraft();
      section.hidden = options.getMode() === "exam" && !options.isSubmitted();
      notes.value = draft.reflection || "";
      explanation.textContent = engine.explanationPrompt(exercise); transfer.textContent = engine.transferPrompt(exercise);
      rubric.replaceChildren(...engine.rubricFor(exercise).map(text => node("li", text)));
      const executable = ["program", "function"].includes(exercise.kind);
      experiment.hidden = !executable; exportButton.hidden = !executable;
      if (executable) {
        emptyLabel.hidden = exercise.kind === "function"; emptyInput.checked = false;
        const test = exercise.cases[0];
        input.value = draft.experimentInput ?? (exercise.kind === "function" ? test.args.map(options.pyRepr).join(", ") : test.inputs.join("\n"));
        prediction.value = draft.experimentPrediction || "";
        inputLabel.textContent = exercise.kind === "function" ? "Argumentos da função, separados por vírgula" : "Entradas do programa, uma por linha";
        help.textContent = exercise.kind === "function" ? "Use valores literais Python: 3, [1, 2], 'texto', True ou None. Chamadas e expressões não são aceitas neste campo." : "Cada input() lê uma linha. Deixe o campo vazio quando o programa não recebe entradas.";
      }
      output.hidden = true;
      const definition = engine.projectFor(exercise); project.hidden = !definition;
      project.replaceChildren();
      if (definition) {
        project.append(node("summary", definition.title), node("p", definition.briefing));
        const steps = node("ol"); definition.steps.forEach(text => steps.append(node("li", text)));
        const cases = node("ul"); definition.edgeCases.forEach(text => cases.append(node("li", text)));
        const checklist = node("ul"); definition.rubric.forEach(text => checklist.append(node("li", text)));
        project.append(steps, node("strong", "Casos para conferir"), cases, node("strong", "Critérios para sua revisão"), checklist);
      }
      materials.replaceChildren();
      for (const material of engine.materialsFor(exercise)) {
        const link = node("a", material.title + " ↗"); link.href = material.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.onclick = options.markHelp; materials.append(link);
      }
      renderHints(); setBusy(options.isBusy());
    }
    return { render, setBusy, invalidate() { output.hidden = true; } };
  }
  window.STUDY_WORKBENCH = { create };
})();
