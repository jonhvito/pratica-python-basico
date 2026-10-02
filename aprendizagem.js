/* Motor pedagógico local: metadados, variações e diagnósticos. */
(function () {
  "use strict";

  const skills = [
    { id: "logica", name: "Lógica", description: "Sequência, estado, decomposição e casos-limite." },
    { id: "sintaxe", name: "Sintaxe", description: "Aspas, parênteses, dois-pontos e indentação." },
    { id: "variaveis", name: "Variáveis", description: "Atribuição, nomes, referências e mudança de estado." },
    { id: "tipos", name: "Tipos", description: "Reconhecer, converter e combinar tipos corretamente." },
    { id: "numeros", name: "Números", description: "Operadores, conversões e precedência." },
    { id: "strings", name: "Strings", description: "Índices, recortes, métodos e formatação." },
    { id: "entrada", name: "Entrada e tipos", description: "input(), conversões e operadores." },
    { id: "condicoes", name: "Condições", description: "Comparações, if, elif e else." },
    { id: "lacos", name: "Laços", description: "for, while, range e repetição segura." },
    { id: "acumuladores", name: "Acumuladores", description: "Contadores, somas e atualização de estado." },
    { id: "listas", name: "Listas", description: "Percorrer, filtrar, indexar e preservar dados." },
    { id: "funcoes", name: "Funções", description: "Parâmetros, chamadas e organização." },
    { id: "retorno", name: "Retorno", description: "Diferença entre return e print." },
    { id: "rastreamento", name: "Teste de mesa", description: "Prever valores e saídas sem executar." },
    { id: "depuracao", name: "Depuração", description: "Interpretar erros, testar hipóteses e corrigir." }
  ];

  const exerciseSkills = {
    ola: ["sintaxe"],
    dobro: ["entrada", "sintaxe"],
    media: ["entrada", "sintaxe"],
    divisao: ["entrada"],
    aprovado: ["condicoes", "entrada"],
    sinal: ["condicoes"],
    maior_dois: ["condicoes", "entrada"],
    contagem: ["lacos", "sintaxe"],
    tabuada: ["lacos", "entrada"],
    soma_ate: ["lacos", "acumuladores"],
    vogais: ["lacos", "acumuladores"],
    dobro_funcao: ["funcoes", "retorno"],
    classifica: ["funcoes", "retorno", "condicoes"],
    soma: ["listas", "lacos", "acumuladores"],
    pares: ["listas", "lacos", "acumuladores"],
    maior: ["listas", "lacos", "condicoes"],
    menor: ["listas", "lacos", "condicoes"],
    media_lista: ["listas", "acumuladores", "retorno"],
    filtra_pares: ["listas", "lacos", "funcoes"],
    busca: ["listas", "condicoes", "retorno"],
    mesa_range: ["rastreamento", "lacos"],
    mesa_acumulador: ["rastreamento", "acumuladores"],
    mesa_return: ["rastreamento", "retorno", "funcoes"],
    mesa_lista: ["rastreamento", "listas"]
  };
  window.EXERCISES.forEach(exercise => {
    if (Array.isArray(exercise.skills) && exercise.skills.length) exerciseSkills[exercise.id] = exercise.skills;
  });

  const bugChallenges = {
    dobro: { code: "numero = input()\nprint(numero * 2)", briefing: "O resultado parece certo para 7? Descubra por que aparece 77." },
    media: { code: "nota1 = float(input())\nnota2 = float(input())\nmedia = nota1 + nota2 / 2\nprint(media)", briefing: "A ordem das operações alterou a média." },
    divisao: { code: "minutos = int(input())\nhoras = minutos / 60\nresto = minutos % 60\nprint(horas, resto)", briefing: "Horas completas não são uma divisão decimal." },
    aprovado: { code: "nota = float(input())\nif nota >= 5:\n    print(\"recuperacao\")\nelif nota >= 7:\n    print(\"aprovado\")\nelse:\n    print(\"reprovado\")", briefing: "Uma condição ampla está capturando notas que pertencem a outro caminho." },
    sinal: { code: "numero = int(input())\nif numero >= 0:\n    print(\"positivo\")\nelif numero < 0:\n    print(\"negativo\")\nelse:\n    print(\"zero\")", briefing: "O zero nunca chega ao último bloco." },
    maior_dois: { code: "a = int(input())\nb = int(input())\nif a < b:\n    print(a)\nelse:\n    print(b)", briefing: "A comparação escolhe justamente o lado errado." },
    contagem: { code: "for numero in range(1, 5):\n    print(numero)", briefing: "O limite final de range() não entra na sequência." },
    tabuada: { code: "numero = int(input())\nfor multiplicador in range(1, 5):\n    print(numero * multiplicador)", briefing: "Está faltando exatamente uma multiplicação." },
    soma_ate: { code: "n = int(input())\ntotal = 0\nnumero = 1\nwhile numero < n:\n    total += numero\n    numero += 1\nprint(total)", briefing: "Confira se o próprio n participa da soma." },
    vogais: { code: "texto = input()\nquantidade = 0\nfor letra in texto:\n    if letra in \"aeiou\":\n        quantidade += 1\nprint(quantidade)", briefing: "A solução funciona com minúsculas, mas não com CASA." },
    dobro_funcao: { code: "def dobro(numero):\n    print(numero * 2)", briefing: "A função mostra um valor, mas não o devolve." },
    classifica: { code: "def classifica_numero(num):\n    if num % 2 == 0:\n        return \"par\"\n    elif num == 0:\n        return \"zero\"\n    return \"impar\"", briefing: "Zero também é par. A ordem dos testes importa." },
    soma: { code: "def soma_lista(numeros):\n    total = 0\n    for numero in numeros:\n        total += numero\n        return total", briefing: "A função abandona o laço cedo demais." },
    pares: { code: "def conta_pares(numeros):\n    quantidade = 0\n    for numero in numeros:\n        if numero % 2 == 0:\n            quantidade += numero\n    return quantidade", briefing: "O acumulador está somando valores quando deveria contar elementos." },
    maior: { code: "def maior_lista(numeros):\n    maior = 0\n    for numero in numeros:\n        if numero > maior:\n            maior = numero\n    return maior", briefing: "Começar em zero falha quando todos os valores são negativos." },
    menor: { code: "def menor_lista(numeros):\n    menor = 0\n    for numero in numeros:\n        if numero < menor:\n            menor = numero\n    return menor", briefing: "Começar em zero falha quando todos os valores são positivos." },
    media_lista: { code: "def media_lista(numeros):\n    total = 0\n    for numero in numeros:\n        total += numero\n    return total / len(numeros)", briefing: "O que acontece quando a lista está vazia?" },
    filtra_pares: { code: "def filtra_pares(numeros):\n    for numero in numeros:\n        if numero % 2 != 0:\n            numeros.remove(numero)\n    return numeros", briefing: "Alterar a lista recebida enquanto ela é percorrida cria dois problemas." },
    busca: { code: "def contem(numeros, alvo):\n    for numero in numeros:\n        if numero == alvo:\n            return True\n        return False", briefing: "A busca desiste depois de olhar apenas o primeiro elemento." }
  };

  function hashSeed(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomFor(value) {
    let number = hashSeed(value) || 1;
    return function () {
      number += 0x6D2B79F5;
      let result = number;
      result = Math.imul(result ^ result >>> 15, result | 1);
      result ^= result + Math.imul(result ^ result >>> 7, result | 61);
      return ((result ^ result >>> 14) >>> 0) / 4294967296;
    };
  }

  function int(random, minimum, maximum) {
    return Math.floor(random() * (maximum - minimum + 1)) + minimum;
  }

  function cloneExercise(exercise) {
    return { ...exercise, cases: exercise.cases.map(test => ({ ...test, inputs: test.inputs?.slice(), args: test.args ? structuredClone(test.args) : undefined })) };
  }

  function materialize(exercise, seed) {
    if (!seed || !Array.isArray(exercise.cases) || exercise.kind === "trace" || exercise.id === "ola" || exercise.id === "contagem") return exercise;
    const copy = cloneExercise(exercise);
    const random = randomFor(exercise.id + ":" + seed);
    const positive = () => int(random, 2, 18);
    const signed = () => int(random, -18, 18);
    const makeList = (length = 5) => Array.from({ length }, signed);
    const cases = {
      dobro: () => { const n = positive(); return [{ inputs: [String(n)], expected: String(n * 2) }, { inputs: ["0"], expected: "0" }, { inputs: [String(-n)], expected: String(-n * 2) }]; },
      media: () => { const a = positive(); const b = positive() + 0.5; return [{ inputs: [String(a), String(b)], expected: String((a + b) / 2) }, { inputs: ["0", "0"], expected: "0.0" }]; },
      divisao: () => { const values = [int(random, 61, 359), int(random, 1, 59), int(random, 2, 6) * 60]; return values.map(value => ({ inputs: [String(value)], expected: Math.floor(value / 60) + " " + value % 60 })); },
      aprovado: () => { const values = [int(random, 70, 100) / 10, int(random, 50, 69) / 10, int(random, 0, 49) / 10]; return values.map(value => ({ inputs: [String(value)], expected: value >= 7 ? "aprovado" : value >= 5 ? "recuperacao" : "reprovado" })); },
      sinal: () => [positive(), -positive(), 0].map(value => ({ inputs: [String(value)], expected: value > 0 ? "positivo" : value < 0 ? "negativo" : "zero" })),
      maior_dois: () => [[signed(), signed()], [-positive(), -positive()], [7, 7]].map(([a, b]) => ({ inputs: [String(a), String(b)], expected: String(Math.max(a, b)) })),
      tabuada: () => { const value = signed(); return [{ inputs: [String(value)], expected: [1, 2, 3, 4, 5].map(n => value * n).join("\n") }]; },
      soma_ate: () => { const values = [int(random, 2, 12), 0, 1]; return values.map(value => ({ inputs: [String(value)], expected: String(value * (value + 1) / 2) })); },
      vogais: () => { const words = ["Abacaxi", "Programacao", "RITMO", "um algoritmo", "Python puro"]; const text = words[int(random, 0, words.length - 1)]; const count = [...text.toLowerCase()].filter(letter => "aeiou".includes(letter)).length; return [{ inputs: [text], expected: String(count) }, { inputs: [""], expected: "0" }]; },
      dobro_funcao: () => { const n = signed(); return [{ args: [n], expected: n * 2 }, { args: [2.5], expected: 5 }]; },
      classifica: () => [0, positive() * 2, positive() * 2 + 1, -positive() * 2].map(value => ({ args: [value], expected: value === 0 ? "zero" : value % 2 === 0 ? "par" : "impar" })),
      soma: () => { const list = makeList(); return [{ args: [list], expected: list.reduce((a, b) => a + b, 0) }, { args: [[]], expected: 0 }]; },
      pares: () => { const list = makeList(7); return [{ args: [list], expected: list.filter(n => n % 2 === 0).length }, { args: [[]], expected: 0 }]; },
      maior: () => { const list = makeList(6); return [{ args: [list], expected: Math.max(...list) }, { args: [[-9, -3, -12]], expected: -3 }]; },
      menor: () => { const list = makeList(6); return [{ args: [list], expected: Math.min(...list) }, { args: [[3, 8, 12]], expected: 3 }]; },
      media_lista: () => { const list = [positive(), positive(), positive()]; return [{ args: [list], expected: list.reduce((a, b) => a + b, 0) / list.length }, { args: [[]], expected: null }]; },
      filtra_pares: () => { const list = makeList(7); return [{ args: [list], expected: list.filter(n => n % 2 === 0) }, { args: [[]], expected: [] }]; },
      busca: () => { const list = makeList(6); const target = list[int(random, 0, list.length - 1)]; return [{ args: [list, target], expected: true }, { args: [list, 99], expected: false }, { args: [[], target], expected: false }]; }
    };
    if (!cases[exercise.id]) return exercise;
    copy.cases = cases[exercise.id]();
    copy.variantSeed = seed;
    return copy;
  }

  function fadedCode(solution, seed) {
    const lines = solution.split("\n");
    const candidates = lines.map((line, index) => ({ line, index })).filter(item => item.line.trim() && !item.line.trim().startsWith("#") && !item.line.trim().startsWith("def "));
    const amount = Math.max(1, Math.ceil(candidates.length * 0.42));
    const random = randomFor("fade:" + seed + ":" + solution);
    const selected = candidates.slice().sort(() => random() - 0.5).slice(0, amount);
    const hidden = new Set(selected.map(item => item.index));
    return lines.map((line, index) => hidden.has(index) ? line.match(/^\s*/)[0] + "# complete esta linha" : line).join("\n");
  }

  function bugFor(exercise) {
    return bugChallenges[exercise.id] || null;
  }

  function diagnosis(result, exercise, code) {
    const failedIndex = result?.cases?.findIndex(test => test.pass === false) ?? -1;
    const failedCase = failedIndex >= 0 ? result.cases[failedIndex] : null;
    const firstCaseError = failedCase?.error;
    const error = result?.error || firstCaseError;
    const normalizedCode = code || "";
    const concise = value => String(value ?? "").slice(0, 180).replace(/\n/g, " ↵ ");
    const test = exercise.cases?.[failedIndex];
    const inputDetail = test ? exercise.kind === "function" ? "Argumentos: " + concise(JSON.stringify(test.args)) : "Entrada: " + concise(JSON.stringify(test.inputs || [])) : "";
    const caseDetail = failedCase ? "Caso " + (failedIndex + 1) + (inputDetail ? " · " + inputDetail : "") + " · Esperado: " + concise(failedCase.expected) + (failedCase.error ? "" : " · Obtido: " + (failedCase.got === "" ? "(saída vazia)" : concise(failedCase.got))) : "";
    if (error) {
      const known = {
        SyntaxError: ["sintaxe", "Erro de sintaxe", "Confira dois-pontos, parênteses, aspas e operadores de comparação."],
        IndentationError: ["indentacao", "Indentação", "Use quatro espaços e confira onde cada bloco começa e termina."],
        TabError: ["indentacao", "Tabs e espaços", "Use apenas quatro espaços por nível de recuo."],
        NameError: ["nomes", "Nome não definido", "Confira se o nome foi escrito igual e criado antes do uso."],
        TypeError: ["tipos", "Tipos incompatíveis", "Confira conversões, parâmetros e operações entre texto e número."],
        ValueError: ["conversao", "Conversão de valor", "Confira se a entrada pode ser convertida com int() ou float()."],
        IndexError: ["indices", "Índice fora da lista", "Índices começam em zero e terminam em len(lista) - 1."],
        ZeroDivisionError: ["caso-vazio", "Divisão por zero", "Trate lista vazia ou divisor zero antes da conta."],
        EOFError: ["entrada", "Entradas em excesso", "Cada input() consome uma entrada; confira quantas o enunciado fornece."],
        "Resposta em branco": ["em-branco", "Resposta em branco", "Comece decompondo o enunciado em entrada, processamento e saída."]
      };
      const data = known[error.kind] || ["execucao", error.kind || "Erro de execução", "Leia a linha indicada e reduza o problema a uma operação por vez."];
      return { key: data[0], title: data[1], tip: data[2], detail: [error.message || "", caseDetail].filter(Boolean).join(" · ") };
    }
    if (result?.rules?.length) return { key: "restricao", title: "Estrutura pedida", tip: result.rules[0], detail: [result.rules.join(" "), caseDetail].filter(Boolean).join(" · ") };
    if (exercise.kind === "function" && failedCase?.got === "None") {
      return { key: "return-print", title: "Retorno da função", tip: "Este caso esperava outro valor, mas a função devolveu None. Confira o return em cada caminho; print() apenas mostra texto.", detail: caseDetail };
    }
    if (failedCase?.changed) {
      return { key: "mutacao", title: "Lista recebida alterada", tip: "Este exercício pede preservar a lista recebida. Confira as operações que modificam os argumentos e construa uma nova lista para devolver.", detail: caseDetail };
    }
    if (failedCase && /range\s*\(/.test(normalizedCode) && String(exercise.group || "").includes("Laços")) {
      return { key: "range", title: "Hipótese: limites do range", tip: "Uma possibilidade é o limite do laço: range() exclui o limite final. Compare os valores gerados no caso que falhou; a operação feita dentro do laço também pode ser a causa.", detail: caseDetail };
    }
    if (failedCase && (exercise.id === "soma_ate" || exerciseSkills[exercise.id]?.includes("acumuladores"))) {
      return { key: "acumulador", title: "Hipótese: acumulador ou contador", tip: "Uma possibilidade é a atualização do acumulador. Confira valor inicial, atualização e posição do return/print usando o caso que falhou.", detail: caseDetail };
    }
    if (exercise.kind === "trace") return { key: "rastreamento", title: "Teste de mesa", tip: "Anote o valor de cada variável após cada linha e compare com o primeiro caso que falhou.", detail: caseDetail || "A saída prevista não corresponde." };
    return { key: "casos", title: "Investigue o caso que falhou", tip: "Compare entrada, esperado e obtido antes de escolher uma hipótese. Teste limites como zero, negativos, empate ou lista vazia quando forem relevantes para o enunciado.", detail: caseDetail || "Confira o resultado e a estrutura pedida." };
  }

  window.LEARNING_ENGINE = {
    skills,
    exerciseSkills,
    skillsFor(exerciseId) { return exerciseSkills[exerciseId] || ["sintaxe"]; },
    materialize,
    fadedCode,
    bugFor,
    diagnosis
  };
})();
