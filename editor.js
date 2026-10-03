/* Editor leve: mantém o textarea nativo e acrescenta apoio à escrita e à revisão. */
(function (root) {
  "use strict";

  function statementBeforeComment(line) {
    let quote = "";
    let escaped = false;
    let statement = "";
    for (const character of line) {
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === quote) quote = "";
        statement += " ";
      } else if (character === "#") break;
      else if (character === "'" || character === '"') { quote = character; statement += " "; }
      else statement += character;
    }
    return statement;
  }

  function keyboardEdit(value, start, end, key) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const beforeCursor = value.slice(lineStart, start);
    if (key === "Enter") {
      const indentation = beforeCursor.match(/^[ \t]*/)[0];
      const opensBlock = /^\s*(?:async\s+)?(?:if\b|elif\b|else\b|for\b|while\b|def\b|class\b|try\b|except\b|finally\b|with\b|match\b|case\b).*:\s*$/.test(statementBeforeComment(beforeCursor));
      return { start, end, text: "\n" + indentation + (opensBlock ? "    " : "") };
    }
    if (key === "Backspace" && start === end && /^ +$/.test(beforeCursor)) {
      const amount = beforeCursor.length % 4 || 4;
      return { start: start - amount, end, text: "" };
    }
    return null;
  }

  function firstDifference(expected, got) {
    const wanted = Array.from(String(expected));
    const actual = Array.from(String(got));
    let offset = 0;
    while (offset < wanted.length && offset < actual.length && wanted[offset] === actual[offset]) offset += 1;
    if (offset === wanted.length && offset === actual.length) return null;
    let line = 1;
    let column = 1;
    for (let index = 0; index < offset; index += 1) {
      if (wanted[index] === "\n") { line += 1; column = 1; }
      else column += 1;
    }
    return { offset, line, column };
  }

  function lineDifference(expected, got) {
    const wanted = Array.from(expected);
    const actual = Array.from(got);
    let start = 0;
    while (start < wanted.length && start < actual.length && wanted[start] === actual[start]) start += 1;
    let suffix = 0;
    while (suffix < wanted.length - start && suffix < actual.length - start && wanted[wanted.length - 1 - suffix] === actual[actual.length - 1 - suffix]) suffix += 1;
    return { start, wantedEnd: wanted.length - suffix, actualEnd: actual.length - suffix };
  }

  function visibleWhitespace(value) {
    return value.replace(/ /g, "·").replace(/\t/g, "⇥").replace(/\r/g, "␍");
  }

  function boundedOutput(value, limit = 8000) {
    const characters = Array.from(String(value));
    return { text: characters.slice(0, limit).join(""), truncated: characters.length > limit, length: characters.length };
  }

  function element(tag, content, className) {
    const node = root.document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function comparisonState(expected, got, options = {}) {
    const difference = firstDifference(String(expected ?? ""), String(got ?? ""));
    // A aprovação usa a comparação de valores do interpretador, não sua representação textual.
    return { difference: options.pass === true ? null : difference, approved: options.pass === true,
      abbreviated: Boolean(options.expectedTruncated || options.gotTruncated) };
  }

  function comparison(expected, got, options = {}) {
    const wanted = String(expected ?? "");
    const actual = String(got ?? "");
    const state = comparisonState(wanted, actual, options);
    const difference = state.difference;
    const section = element("section", undefined, "output-comparison");

    function appendFullResults() {
      const details = element("details", undefined, "comparison-full");
      details.append(element("summary", state.abbreviated ? "Ver resultados apresentados" : "Ver resultados completos"));
      const columns = element("div", undefined, "comparison-values");
      for (const [label, value, sourceTruncated, sourceLength] of [["Esperado", wanted, options.expectedTruncated, options.expectedLength], ["Obtido", actual, options.gotTruncated, options.gotLength]]) {
        const column = element("div");
        const output = boundedOutput(value);
        column.append(element("strong", label, "comparison-label"));
        if (!value) column.append(element("p", "Saída vazia.", "comparison-note"));
        column.append(element("pre", output.text));
        if (output.truncated || sourceTruncated) {
          const length = Number.isInteger(sourceLength) && sourceLength >= output.length ? sourceLength : output.length;
          column.append(element("p", "Resultado abreviado: exibidos os primeiros 8.000" + (length > 8000 ? " de " + length : "") + " caracteres.", "comparison-note"));
        }
        columns.append(column);
      }
      details.append(columns);
      section.append(details);
    }

    if (!difference) {
      const message = state.approved ? "Caso aprovado: os valores atendem à comparação pedida." :
        options.pass === false ? (state.abbreviated ? "Os trechos apresentados coincidem, mas o caso não foi aprovado. Resultados abreviados podem esconder diferenças após o limite de apresentação." : "As representações apresentadas coincidem, mas o caso não foi aprovado. Confira os critérios e as restrições do exercício.") :
        state.abbreviated ? "Os trechos apresentados coincidem; há resultados abreviados." : "Esperado e obtido: mesmos valores apresentados.";
      section.append(element("p", message, state.approved || options.pass !== false ? "comparison-match" : "comparison-note"));
      if (wanted === actual) {
        const preview = boundedOutput(wanted || "(saída vazia)", 2400);
        section.append(element("pre", preview.text + (preview.truncated || state.abbreviated ? "\n… prévia abreviada" : "")));
      } else {
        section.append(element("p", "A ordem de apresentação ou a precisão numérica pode variar sem alterar a aprovação.", "comparison-note"));
      }
      appendFullResults();
      return section;
    }

    section.append(element("p", "Primeira diferença: linha " + difference.line + ", coluna " + difference.column + ".", "comparison-position"));
    const wantedLines = wanted.split("\n");
    const actualLines = actual.split("\n");
    const wantedLine = wantedLines[difference.line - 1] ?? "";
    const actualLine = actualLines[difference.line - 1] ?? "";
    const changed = lineDifference(wantedLine, actualLine);
    const whitespace = /[ \t\r]/.test(Array.from(wantedLine).slice(changed.start, changed.wantedEnd).join("") + Array.from(actualLine).slice(changed.start, changed.actualEnd).join(""));
    const values = element("div", undefined, "comparison-values");

    function output(label, lines, line, end, entireOutput) {
      const column = element("div");
      column.append(element("strong", label, "comparison-label"));
      const pre = element("pre");
      const characters = Array.from(line);
      const from = Math.max(0, changed.start - 80);
      const to = Math.min(characters.length, Math.max(end + 80, changed.start + 80), from + 480);
      const display = value => whitespace ? visibleWhitespace(value) : value;
      if (from) pre.append(element("span", "…"));
      pre.append(element("span", display(characters.slice(from, changed.start).join(""))));
      const highlighted = characters.slice(changed.start, Math.min(end, to)).join("");
      const boundary = !entireOutput ? "⟨saída vazia⟩" : difference.line < lines.length ? "⟨fim da linha⟩" : "⟨fim da saída⟩";
      const marker = highlighted || (changed.start < characters.length ? "⟨nenhum caractere⟩" : boundary);
      if (wantedLine !== actualLine) pre.append(element("mark", highlighted ? display(highlighted) : marker, "comparison-changed"));
      pre.append(element("span", display(characters.slice(Math.min(end, to), to).join(""))));
      if (to < characters.length) pre.append(element("span", "…"));
      // Uma quebra ou linha ausente também é uma diferença, mesmo quando o texto desta linha coincide.
      if (wantedLine === actualLine) {
        pre.append(element("mark", difference.line < lines.length ? " ⟨quebra de linha⟩" : " " + boundary, "comparison-changed"));
      }
      column.append(pre);
      values.append(column);
    }

    output("Esperado · linha " + difference.line, wantedLines, wantedLine, changed.wantedEnd, wanted);
    output("Obtido · linha " + difference.line, actualLines, actualLine, changed.actualEnd, actual);
    section.append(values);
    if (whitespace) section.append(element("p", "Nesta prévia: · representa espaço, ⇥ representa tabulação e ␍ representa retorno de carro.", "comparison-note"));
    section.append(element("p", "O destaque mostra a primeira linha diferente" + (wantedLines.length > 1 || actualLines.length > 1 ? "; a saída esperada tem " + wantedLines.length + " linha(s) e a obtida tem " + actualLines.length + " linha(s)." : ".") + " Trechos longos são abreviados.", "comparison-note"));
    appendFullResults();
    return section;
  }

  function attach(field, options = {}) {
    const document = field.ownerDocument;
    const gutter = options.gutter || document.getElementById("line-numbers");
    const status = options.status || document.getElementById("editor-status");
    const numberList = document.createElement("div");
    numberList.className = "line-numbers-inner";
    if (gutter) gutter.replaceChildren(numberList);
    let codeMode = true;
    let errorLine = null;
    let count = 0;
    let inputSerial = 0;

    function alignScroll() {
      numberList.style.transform = "translateY(" + -field.scrollTop + "px)";
    }

    function sync(settings = {}) {
      if (typeof settings.codeMode === "boolean") codeMode = settings.codeMode;
      if (Object.prototype.hasOwnProperty.call(settings, "errorLine")) errorLine = Number.isInteger(settings.errorLine) && settings.errorLine > 0 ? settings.errorLine : null;
      const lineCount = field.value.split("\n").length;
      if (lineCount !== count) {
        const fragment = document.createDocumentFragment();
        for (let line = 1; line <= lineCount; line += 1) {
          const number = document.createElement("span");
          number.className = "editor-line-number";
          number.textContent = line;
          fragment.append(number);
        }
        numberList.replaceChildren(fragment);
        count = lineCount;
      }
      for (let index = 0; index < numberList.children.length; index += 1) {
        numberList.children[index].classList.toggle("has-error", codeMode && index + 1 === errorLine);
      }
      const message = codeMode && errorLine && errorLine <= count ? "Erro indicado na linha " + errorLine + ". Consulte o resultado abaixo para corrigir." : "";
      if (status && status.textContent !== message) { status.textContent = message; status.hidden = !message; }
      alignScroll();
    }

    function keydown(event) {
      if (!codeMode || field.disabled || field.readOnly || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const edit = keyboardEdit(field.value, field.selectionStart, field.selectionEnd, event.key);
      if (!edit) return;
      event.preventDefault();
      const beforeInput = inputSerial;
      let inserted = false;
      // A inserção nativa preserva Ctrl+Z nos navegadores que a oferecem.
      if (document.activeElement === field && typeof document.execCommand === "function") {
        field.setSelectionRange(edit.start, edit.end);
        try { inserted = document.execCommand("insertText", false, edit.text); } catch (_) { /* Fallback para o textarea. */ }
      }
      if (!inserted) field.setRangeText(edit.text, edit.start, edit.end, "end");
      if (inputSerial === beforeInput) field.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function input() { inputSerial += 1; sync({ errorLine: null }); }
    field.addEventListener("input", input);
    field.addEventListener("scroll", alignScroll);
    field.addEventListener("keydown", keydown);
    sync();
    return {
      sync,
      destroy() {
        field.removeEventListener("input", input);
        field.removeEventListener("scroll", alignScroll);
        field.removeEventListener("keydown", keydown);
      }
    };
  }

  const api = { attach, comparison, helpers: { keyboardEdit, firstDifference, lineDifference, visibleWhitespace, boundedOutput, comparisonState } };
  root.CodeEditor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
