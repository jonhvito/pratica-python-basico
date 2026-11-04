(function (root) {
  "use strict";
  function init(store) {
    const $ = id => document.getElementById(id);
    const data = root.LISTA_AVALIACAO;
    const dialog = $("lista-dialog"), select = $("lista-selecao"), code = $("lista-codigo"), notes = $("lista-notas");
    const state = () => {
      const current = store.getState();
      if (!current.listaAvaliacao) current.listaAvaliacao = { active: 1, drafts: {} };
      if (!Number.isInteger(current.listaAvaliacao.active)) current.listaAvaliacao.active = 1;
      return current.listaAvaliacao;
    };
    const draft = () => {
      const s = state(), id = String(s.active);
      if (!s.drafts[id]) s.drafts[id] = {};
      return s.drafts[id];
    };
    let running = false;
    for (const item of data.itens) {
      const option = document.createElement("option");
      option.value = item.numero;
      option.textContent = item.numero + ". " + item.titulo;
      select.append(option);
    }
    for (const [title, page, text] of data.revisao) {
      const section = document.createElement("details"), summary = document.createElement("summary"), p = document.createElement("p");
      summary.textContent = title + " · " + page; p.textContent = text;
      section.append(summary, p); $("lista-topicos").append(section);
    }
    function render() {
      const item = data.itens[state().active - 1], d = draft();
      select.value = item.numero;
      $("lista-exercicio-titulo").textContent = "Exercício " + item.numero + " · " + item.titulo;
      $("lista-pagina").textContent = "Lista original · página " + item.paginas;
      $("lista-primeira").hidden = !item.semConsulta;
      $("lista-enunciado").textContent = item.enunciado;
      $("lista-dica-texto").textContent = item.dica;
      $("lista-criterios-texto").textContent = item.criterios;
      $("lista-dica").open = false;
      $("lista-criterios").open = false;
      code.value = d.code || ""; notes.value = d.notes || "";
      const subitem = $("lista-subitem");
      subitem.replaceChildren();
      const available = Object.keys(root.LISTA_TESTES.entries).filter(key => Number(key.match(/^\d+/)[0]) === item.numero);
      if (!available.length) {
        const option = document.createElement("option"); option.value = ""; option.textContent = "Sem casos automáticos neste exercício"; subitem.append(option);
      }
      for (const key of available) {
        const option = document.createElement("option"); option.value = key;
        option.textContent = "Item " + key + " · " + root.LISTA_TESTES.entries[key].fn; subitem.append(option);
      }
      if (available.includes(d.subitem)) subitem.value = d.subitem;
      else if (!d.subitem && available.length) d.subitem = available[0];
      $("lista-verificar").disabled = !available.length;
      $("lista-dependencia-wrap").hidden = ![2, 10, 11].includes(item.numero);
      $("lista-dependencia").checked = false;
      $("lista-dependencia-wrap").lastChild.textContent = item.numero === 2 ? " Incluir código salvo do exercício 1 (sinal)" : " Incluir código salvo do exercício 8 (fatorial)";
      $("lista-saida").textContent = "A saída aparecerá aqui.";
    }
    function update() { draft().code = code.value; draft().notes = notes.value; store.scheduleSave(); }
    code.maxLength = notes.maxLength = 100000;
    code.addEventListener("input", update); notes.addEventListener("input", update);
    for (const field of [code, notes]) field.addEventListener("blur", store.save);
    let escapeTab = false;
    code.addEventListener("keydown", event => {
      if (event.key === "Escape") { escapeTab = true; event.stopPropagation(); return; }
      if (event.key === "Tab" && escapeTab) { escapeTab = false; return; }
      escapeTab = false;
      if (event.key === "Tab" && !event.shiftKey) { event.preventDefault(); code.setRangeText("    ", code.selectionStart, code.selectionEnd, "end"); update(); }
      else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); $("lista-executar").click(); }
      else if (event.key === "Enter" || event.key === "Backspace") {
        const edit = root.CodeEditor.helpers.keyboardEdit(code.value, code.selectionStart, code.selectionEnd, event.key);
        if (edit) { event.preventDefault(); code.setRangeText(edit.text, edit.start, edit.end, "end"); update(); }
      }
    });
    select.addEventListener("change", () => { if (running) return; state().active = Number(select.value); store.save(); render(); });
    $("lista-subitem").addEventListener("change", event => { draft().subitem = event.target.value; store.save(); });
    const status = () => { $("lista-save-status").textContent = $("storage-status").textContent; };
    new MutationObserver(status).observe($("storage-status"), { childList:true, subtree:true, characterData:true });
    $("lista-open").onclick = () => { render(); dialog.showModal(); };
    $("lista-close").onclick = () => { if (!running) { store.save(); dialog.close(); } };
    dialog.addEventListener("cancel", event => { if (running) event.preventDefault(); });
    async function run(check) {
      if (running) return;
      const n = state().active, dep = n === 2 ? 1 : 8;
      const prefix = $("lista-dependencia").checked ? (state().drafts[String(dep)]?.code || "") + "\n" : "";
      const submitted = prefix + code.value;
      const spec = root.LISTA_TESTES.entries[$("lista-subitem").value];
      if (check && !spec) return;
      running = true;
      for (const id of ["lista-selecao","lista-subitem","lista-codigo","lista-notas","lista-dependencia","lista-close","lista-executar","lista-verificar"]) $(id).disabled = true;
      $("lista-parar").hidden = false;
      $("lista-saida").textContent = "Carregando e executando Python…";
      try {
        const result = check ? await root.PythonRunner.run(spec, submitted) : await root.PythonRunner.experiment({ kind: "program" }, submitted, {});
        if (!check) $("lista-saida").textContent = result.error ? (result.got || "") + result.error.kind + ": " + result.error.message + (result.error.line ? " · linha " + result.error.line : "") : (result.got || "(nenhuma saída)");
        else if (result.error) $("lista-saida").textContent = result.error.kind + ": " + result.error.message + (result.error.line ? " · linha " + result.error.line : "");
        else {
          const lines = ["Casos de resultado:"];
          result.cases.forEach((test, index) => {
            lines.push("Caso " + (index + 1) + ": " + (test.pass ? "passou" : "não passou"));
            if (test.error) lines.push("Erro: " + test.error.kind + ": " + test.error.message);
            if (test.expected !== undefined) lines.push((test.expectedError ? "Erro esperado: " : "Retorno esperado: ") + test.expected, (test.expectedError ? "Erro obtido: " : "Retorno obtido: ") + (test.got ?? "(erro)"));
            if (test.expectedStdout !== undefined) lines.push("Saída esperada:\n" + test.expectedStdout, "Saída obtida:\n" + (test.stdout || "(vazia)"));
          });
          lines.push("", "Restrições didáticas (checagem parcial):", ...(result.rules.length ? result.rules : ["Nenhum indício contrário nas verificações disponíveis. Confira o método manualmente."]));
          $("lista-saida").textContent = lines.join("\n");
        }
      } catch (error) { $("lista-saida").textContent = error.message; }
      finally {
        running = false;
        for (const id of ["lista-selecao","lista-subitem","lista-codigo","lista-notas","lista-dependencia","lista-close","lista-executar"]) $(id).disabled = false;
        $("lista-verificar").disabled = !$("lista-subitem").value;
        $("lista-parar").hidden = true;
      }
    }
    $("lista-executar").onclick = () => run(false);
    $("lista-verificar").onclick = () => run(true);
    $("lista-parar").onclick = () => root.PythonRunner.stop();
    render(); status();
  }
  root.LISTA_INTERFACE = { init };
})(window);
