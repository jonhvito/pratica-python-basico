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

  const understanding = {
    logica: { question: "Quais dados entram, o que muda durante a solução e qual resultado deve sair?", explanation: "Explique por que cada etapa depende da anterior. O que ficaria impossível se duas etapas fossem trocadas?", transfer: "Invente um problema cotidiano diferente que use a mesma sequência de entrada, transformação e resultado. Escreva os passos sem consultar a solução.", criterion: "Separei os dados, as transformações e o resultado.", example: "# obter os dados\n# transformar os dados\n# apresentar o resultado" },
    sintaxe: { question: "Quais símbolos delimitam a instrução e quais linhas pertencem ao mesmo bloco?", explanation: "Escolha um símbolo ou recuo da resposta e explique seu papel para o interpretador.", transfer: "Escreva um bloco curto com outros nomes e outra mensagem. Marque onde o bloco começa e termina.", criterion: "Expliquei o papel dos delimitadores e da indentação.", example: 'if temperatura > 20:\n    print("quente")' },
    variaveis: { question: "Qual valor cada nome referencia antes e depois da próxima atribuição?", explanation: "Acompanhe um nome em duas etapas e explique o que mudou: a referência, o objeto ou ambos?", transfer: "Crie um exemplo com duas reatribuições ou duas referências à mesma lista. Preveja o resultado antes de conferir.", criterion: "Acompanhei valores e referências sem confundir atribuição com comparação.", example: "pontos = 2\npontos = pontos + 1" },
    tipos: { question: "Que tipo cada operação recebe e que tipo produz?", explanation: "Explique onde uma conversão é necessária e como o resultado mudaria sem ela.", transfer: "Troque um dado numérico por texto que representa um número. Compare as operações antes e depois da conversão.", criterion: "Identifiquei os tipos e justifiquei as conversões.", example: 'valor = int("4")' },
    numeros: { question: "Em que ordem as operações acontecem? O resultado precisa de inteiro, decimal, quociente ou resto?", explanation: "Escolha uma expressão e explique a ordem do cálculo com valores concretos.", transfer: "Crie outra expressão com os mesmos operadores e novos valores. Preveja como os parênteses mudariam o resultado.", criterion: "Justifiquei operadores e ordem das operações.", example: "grupos = 14 // 3\nsobra = 14 % 3" },
    strings: { question: "Quais posições do texto participam do resultado e quais limites ficam de fora?", explanation: "Mostre com um texto concreto quais caracteres são acessados ou transformados e por quê.", transfer: "Use um texto de outro tamanho, incluindo espaços ou maiúsculas. Preveja o comportamento antes de testar.", criterion: "Expliquei índices, limites ou transformações do texto.", example: 'palavra = "janela"\nparte = palavra[1:4]' },
    entrada: { question: "Quantas leituras são necessárias e que tipo cada dado precisa ter após input()?", explanation: "Explique o caminho de um dado: texto lido, conversão, cálculo e saída.", transfer: "Crie um caso com outra entrada válida e preveja a saída exata, incluindo espaços e linhas.", criterion: "Relacionei cada leitura, conversão e saída ao dado correspondente.", example: "quantidade = int(input())\n# use quantidade no processamento" },
    condicoes: { question: "Quais situações cada caminho cobre, especialmente no valor do limite?", explanation: "Justifique a ordem das condições e mostre um valor que percorre cada caminho.", transfer: "Crie casos imediatamente abaixo, no limite e acima de uma condição. Preveja o caminho de cada caso.", criterion: "Cobri os caminhos e justifiquei os valores de fronteira.", example: "if idade < 12:\n    # caminho abaixo do limite\n    pass" },
    lacos: { question: "Qual é o primeiro passo, o que muda em cada volta e o que garante a parada?", explanation: "Acompanhe as primeiras duas voltas e explique o que acontece na última.", transfer: "Mude o tamanho ou os limites da repetição. Preveja quantas voltas haverá e um resultado antes de executar.", criterion: "Expliquei início, atualização, limite e término do laço.", example: "for item in itens:\n    # processe um item por volta\n    pass" },
    acumuladores: { question: "O estado guarda uma soma, uma contagem ou outra informação? Qual deve ser seu valor inicial?", explanation: "Mostre o acumulador antes e depois de duas atualizações e explique o que cada mudança representa.", transfer: "Escolha dados em que somar valores e contar elementos produzam resultados diferentes. Explique qual operação o problema exige.", criterion: "Justifiquei o valor inicial e a atualização do acumulador.", example: "total = 0\n# atualize total durante a repetição" },
    listas: { question: "É necessário acessar, percorrer ou modificar a lista? A lista recebida deve ser preservada?", explanation: "Explique como sua solução trata os elementos e o que acontece com a lista original.", transfer: "Crie casos com lista vazia, um elemento e elementos repetidos quando forem aceitos pelo enunciado. Preveja os resultados.", criterion: "Expliquei o tratamento dos elementos, limites e mutação.", example: "resultado = []\n# construa o resultado sem perder os dados de entrada" },
    funcoes: { question: "O que a função recebe e qual valor precisa devolver para quem a chama?", explanation: "Descreva uma chamada concreta, relacionando cada argumento ao parâmetro e ao valor devolvido.", transfer: "Escreva uma nova chamada com outros argumentos válidos. Preveja o retorno e use-o em outra operação.", criterion: "Relacionei parâmetros, argumentos e retorno.", example: "def transforma(valor):\n    # calcule e devolva o resultado\n    pass" },
    retorno: { question: "Em qual linha a função encerra e o que quem chamou recebe?", explanation: "Explique a diferença entre o valor devolvido e o texto mostrado. Há algum caminho que chega ao fim sem return?", transfer: "Use o retorno em uma atribuição e depois em outra operação. Compare com uma versão que apenas usa print().", criterion: "Distingui return, encerramento da função e print.", example: "def transforma(valor):\n    resultado = valor\n    return resultado" },
    rastreamento: { question: "Qual instrução executa agora e quais valores ela altera antes da próxima linha?", explanation: "Mostre o estado antes e depois de duas instruções, incluindo somente as saídas realmente produzidas.", transfer: "Troque um valor inicial do código. Faça um novo teste de mesa e preveja a saída antes de executar.", criterion: "Acompanhei o estado e a saída na ordem real de execução.", example: "valor = 2\nvalor += 3\n# anote o estado após cada linha" },
    depuracao: { question: "Qual é o menor caso que reproduz o problema e qual diferença ele mostra?", explanation: "Explique a causa do erro, a mudança que a corrigiu e por que ela resolve o caso observado.", transfer: "Crie um caso que passaria antes da correção e outro que revelaria o defeito. Guarde ambos para testar novas mudanças.", criterion: "Liguei a hipótese de causa à evidência e a um teste.", example: "# preveja o resultado de um caso pequeno\n# compare a previsão com a execução" }
  };

  function supportFor(exercise) {
    const assigned = exerciseSkills[exercise.id] || exercise.skills || ["sintaxe"];
    const focus = exercise.kind === "trace" ? "rastreamento" : assigned[0];
    return understanding[focus] || understanding.logica;
  }

  function hintsFor(exercise) {
    const support = supportFor(exercise);
    const executable = exercise.kind === "program" || exercise.kind === "function";
    return [
      { title: "1 · Pergunta para começar", text: support.question },
      { title: "2 · Pista conceitual", text: exercise.hint || support.question },
      { title: "3 · Ponto de partida", text: executable ? "Complete este início justificando a próxima operação. Ele não é uma solução pronta." : "Acompanhe este exemplo curto e aplique o mesmo raciocínio à atividade.", code: executable && exercise.starter?.trim() ? exercise.starter.trimEnd() : support.example }
    ];
  }

  function explanationPrompt(exercise) { return supportFor(exercise).explanation; }
  function transferPrompt(exercise) { return supportFor(exercise).transfer; }
  function rubricFor(exercise) {
    return [supportFor(exercise).criterion, "Usei um exemplo concreto para sustentar minha explicação.", "Previ e conferi um caso diferente sem consultar a solução."];
  }

  const projects = {
    "curso-frequencias": {
      title: "Projeto · Relatório de frequências",
      briefing: "Você recebeu uma lista de códigos inteiros e precisa resumir quantas vezes cada código aparece. Entregue frequencias(valores): as chaves do dicionário são os inteiros convertidos para strings, e os valores são as contagens. Uma lista vazia produz {}.",
      steps: [
        "Plano: descreva como transformar uma lista em um relatório, o que precisa ser guardado durante o percurso e qual informação muda a cada elemento.",
        "Casos: antes de escrever a função, invente três listas e anote os dicionários esperados. Inclua repetição e ao menos um caso de fronteira.",
        "Implementação: escreva a função sem consultar a solução. Execute seus casos próprios, compare com suas previsões e depois confira os casos da atividade.",
        "Explicação: justifique por que a soma das contagens deve ser igual ao tamanho da lista. Use essa relação para conferir um conjunto de dados novo."
      ],
      edgeCases: [
        "Lista vazia: [] deve produzir {}.",
        "Um código repetido: [5, 5, 5] deve produzir {'5': 3}.",
        "Negativos e zero: [-2, 0, -2] deve produzir {'-2': 2, '0': 1}; a ordem das chaves não muda o relatório."
      ],
      rubric: [
        "Defini o contrato e previ os casos antes de executar.",
        "Minha função retorna chaves de texto e contagens coerentes, inclusive para a lista vazia.",
        "Expliquei como cada elemento contribui para o relatório e conferi a soma das contagens em um caso novo."
      ]
    },
    "curso-medias-filiais": {
      title: "Projeto · Resumo de vendas por filial",
      briefing: "Organize o resumo de uma rede de filiais. Entregue medias(vendas), recebendo {'filial': {'produto': [valores]}} e devolvendo os mesmos nomes e níveis, com a média em lugar de cada lista. Para uma lista vazia, use 0. Não junte produtos ou filiais diferentes.",
      steps: [
        "Plano: desenhe os níveis filial, produto e valores. Descreva qual parte do resultado será construída em cada nível e como uma lista vazia será tratada.",
        "Casos: monte duas filiais com produtos distintos e calcule as médias à mão. Acrescente uma lista vazia e preveja o resultado antes da execução.",
        "Implementação: escreva medias(vendas) sem consultar a solução. Execute seus dados, confira cada produto separadamente e depois verifique os casos da atividade.",
        "Explicação: mostre por que uma alteração nos dados de um produto deve afetar somente sua média. Modifique uma lista e preveja quais partes do resumo continuarão iguais."
      ],
      edgeCases: [
        "Nenhuma filial: {} deve produzir {}.",
        "Filial sem produtos: {'oeste': {}} deve preservar {'oeste': {}}.",
        "Produtos distintos: {'leste': {'cha': [2, 6], 'bolo': []}} deve produzir {'leste': {'cha': 4, 'bolo': 0}}."
      ],
      rubric: [
        "Decompus os níveis da estrutura e previ médias antes de executar.",
        "Preservei os nomes de filiais e produtos, tratando listas vazias com 0.",
        "Expliquei uma mudança isolada nos dados e conferi que as outras médias continuam iguais."
      ]
    }
  };

  function projectFor(exercise) {
    const project = projects[exercise?.id];
    return project ? { ...project, steps: project.steps.slice(), edgeCases: project.edgeCases.slice(), rubric: project.rubric.slice() } : null;
  }

  const materials = {
    logica: ["Sintaxe", "sintaxe"],
    sintaxe: ["Sintaxe", "sintaxe"],
    variaveis: ["Tipos de variáveis", "tipos-variaveis"],
    numeros: ["Números", "numeros"],
    strings: ["Strings", "strings"],
    entrada: ["Entrada de dados", "input"],
    condicoes: ["Condições: if, elif e else", "if-else"],
    lacos: ["Laços for", "for-loops"],
    listas: ["Listas", "listas"],
    funcoes: ["Funções", "funcoes"],
    depuracao: ["Erros, exceções e testes", "erros-excecoes-testes"]
  };

  function materialsFor(exercise) {
    const material = Object.prototype.hasOwnProperty.call(materials, exercise?.unit) ? materials[exercise.unit] : null;
    return material ? [{ title: "Python Iluminado · " + material[0], url: "https://pythoniluminado.netlify.app/" + material[1] + "/" }] : [];
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
    hintsFor,
    explanationPrompt,
    transferPrompt,
    rubricFor,
    projectFor,
    materialsFor,
    diagnosis
  };
})();
