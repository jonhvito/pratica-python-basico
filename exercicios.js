/* Exercícios editáveis, sem bibliotecas. Os gabaritos são exemplos, não respostas únicas. */
window.EXERCISES = [
  {
    id: "ola", group: "01 · Aquecimento", title: "A primeira linha", kind: "program",
    prompt: 'Escreva um programa que mostre exatamente a frase: Voltei ao Python.',
    rule: "Não precisa ler nenhuma entrada. Atenção às aspas e aos parênteses.",
    cases: [{ inputs: [], expected: "Voltei ao Python." }],
    starter: "# Escreva uma chamada de print abaixo.\n",
    hint: 'print() escreve na saída. Um texto precisa estar entre aspas simples ou duplas.',
    solution: 'print("Voltei ao Python.")',
    note: "As aspas delimitam o texto, mas não aparecem na saída."
  },
  {
    id: "dobro", group: "01 · Aquecimento", title: "Ler, converter, calcular", kind: "program",
    prompt: "Leia um número inteiro com input() e mostre o dobro dele.",
    rule: "Imprima só o resultado. Cada caso de teste fornece a entrada automaticamente.",
    cases: [{ inputs: ["7"], expected: "14" }, { inputs: ["0"], expected: "0" }, { inputs: ["-3"], expected: "-6" }],
    starter: "numero = int(input())\n",
    hint: 'input() retorna texto. int(input()) converte para inteiro. Texto multiplicado por 2 se repete: "7" * 2 vira "77".',
    solution: "numero = int(input())\ndobro = numero * 2\nprint(dobro)",
    note: "O nome da variável pode mudar. A conversão é o que permite fazer a conta."
  },
  {
    id: "media", group: "01 · Aquecimento", title: "Média de duas notas", kind: "program",
    prompt: "Leia duas notas, uma por input(), e mostre a média aritmética delas. As notas podem ter casas decimais.",
    rule: "Use float() para converter e imprima só a média. Não precisa arredondar.",
    numericOutput: true,
    cases: [{ inputs: ["6", "8"], expected: "7.0" }, { inputs: ["5.5", "8"], expected: "6.75" }, { inputs: ["0", "0"], expected: "0.0" }],
    starter: "nota1 = float(input())\n",
    hint: "Leia a segunda nota. Some as duas dentro de parênteses antes de dividir por 2.",
    solution: "nota1 = float(input())\nnota2 = float(input())\nmedia = (nota1 + nota2) / 2\nprint(media)",
    note: "Sem os parênteses, só a segunda nota seria dividida por 2."
  },
  {
    id: "divisao", group: "01 · Aquecimento", title: "Quociente e resto", kind: "program",
    prompt: "Leia um inteiro não negativo que representa minutos. Mostre as horas completas e os minutos restantes, nessa ordem, separados por um espaço.",
    rule: "Exemplo: 135 minutos correspondem a 2 horas e 15 minutos. Use // e %.",
    cases: [{ inputs: ["135"], expected: "2 15" }, { inputs: ["60"], expected: "1 0" }, { inputs: ["45"], expected: "0 45" }, { inputs: ["0"], expected: "0 0" }],
    starter: "minutos = int(input())\n",
    hint: "// faz a divisão inteira; % dá o resto. print(a, b) separa os valores por um espaço.",
    solution: "minutos = int(input())\nhoras = minutos // 60\nresto = minutos % 60\nprint(horas, resto)",
    note: "É o mesmo raciocínio de dividir uma quantidade em grupos completos e sobras."
  },
  {
    id: "aprovado", group: "02 · Decisões", title: "Três caminhos", kind: "program",
    prompt: 'Leia uma nota. Mostre "aprovado" se ela for maior ou igual a 7, "recuperacao" se for maior ou igual a 5 e menor que 7, ou "reprovado" se for menor que 5.',
    rule: "Imprima as palavras em minúsculas, sem acentos.",
    cases: [{ inputs: ["7"], expected: "aprovado" }, { inputs: ["5"], expected: "recuperacao" }, { inputs: ["6.9"], expected: "recuperacao" }, { inputs: ["4.9"], expected: "reprovado" }],
    starter: "nota = float(input())\n",
    hint: "Comece pela faixa mais alta. Se nota >= 7 for falso, o elif já está trabalhando com notas menores que 7.",
    solution: 'nota = float(input())\nif nota >= 7:\n    print("aprovado")\nelif nota >= 5:\n    print("recuperacao")\nelse:\n    print("reprovado")',
    note: "As três alternativas são exclusivas. Cada bloco tem dois-pontos e recuo."
  },
  {
    id: "sinal", group: "02 · Decisões", title: "Positivo, negativo ou zero", kind: "program",
    prompt: 'Leia um inteiro e imprima "positivo", "negativo" ou "zero", conforme o valor.',
    rule: "Lembre que comparar é diferente de atribuir.",
    cases: [{ inputs: ["4"], expected: "positivo" }, { inputs: ["-2"], expected: "negativo" }, { inputs: ["0"], expected: "zero" }],
    starter: "numero = int(input())\n",
    hint: "Teste > 0 e < 0. O else cobre o único caso restante: zero.",
    solution: 'numero = int(input())\nif numero > 0:\n    print("positivo")\nelif numero < 0:\n    print("negativo")\nelse:\n    print("zero")',
    note: "Também vale testar numero == 0 primeiro e organizar as outras condições depois."
  },
  {
    id: "maior_dois", group: "02 · Decisões", title: "Maior de dois", kind: "program",
    prompt: "Leia dois inteiros, um por input(), e imprima o maior deles. Se forem iguais, imprima esse valor uma vez.",
    rule: "Resolva usando comparação, sem max().", forbidden: ["max"],
    cases: [{ inputs: ["4", "9"], expected: "9" }, { inputs: ["8", "2"], expected: "8" }, { inputs: ["5", "5"], expected: "5" }, { inputs: ["-7", "-2"], expected: "-2" }],
    starter: "a = int(input())\nb = int(input())\n",
    hint: "Se a > b, imprima a. Caso contrário, b já resolve inclusive o empate.",
    solution: "a = int(input())\nb = int(input())\nif a > b:\n    print(a)\nelse:\n    print(b)",
    note: "Não é necessário um terceiro caminho para o empate neste enunciado."
  },
  {
    id: "contagem", group: "03 · Laços", title: "O limite do range", kind: "program",
    prompt: "Usando for e range(), mostre os números de 1 a 5, um por linha.",
    rule: "Não há entrada. O número 5 deve aparecer na saída.", requireLoop: "for",
    cases: [{ inputs: [], expected: "1\n2\n3\n4\n5" }],
    starter: "# Escreva o for e seu bloco.\n",
    hint: "range(inicio, fim) inclui o início, mas exclui o fim. Para chegar a 5, pare em 6.",
    solution: "for numero in range(1, 6):\n    print(numero)",
    note: "O print fica dentro do laço para acontecer uma vez por número."
  },
  {
    id: "tabuada", group: "03 · Laços", title: "Uma tabuada curta", kind: "program",
    prompt: "Leia um inteiro e mostre seus produtos por 1, 2, 3, 4 e 5, um resultado por linha, usando for.",
    rule: "Imprima apenas os produtos, sem rótulos como '2 x 3 ='.", requireLoop: "for",
    cases: [{ inputs: ["3"], expected: "3\n6\n9\n12\n15" }, { inputs: ["0"], expected: "0\n0\n0\n0\n0" }, { inputs: ["-2"], expected: "-2\n-4\n-6\n-8\n-10" }],
    starter: "numero = int(input())\n",
    hint: "O número lido fica fixo. O multiplicador percorre range(1, 6).",
    solution: "numero = int(input())\nfor multiplicador in range(1, 6):\n    print(numero * multiplicador)",
    note: "A variável do for recebe um novo valor a cada repetição."
  },
  {
    id: "soma_ate", group: "03 · Laços", title: "Somar com while", kind: "program",
    prompt: "Leia um inteiro n maior ou igual a zero. Usando while, calcule e imprima a soma de 1 até n, incluindo n. Para n = 0, a soma é 0.",
    rule: "Use um acumulador e atualize o contador a cada volta.", requireLoop: "while",
    cases: [{ inputs: ["4"], expected: "10" }, { inputs: ["1"], expected: "1" }, { inputs: ["0"], expected: "0" }, { inputs: ["10"], expected: "55" }],
    starter: "n = int(input())\ntotal = 0\nnumero = 1\n",
    hint: "Enquanto numero <= n, some numero ao total e aumente numero em 1. Imprima depois do laço.",
    solution: "n = int(input())\ntotal = 0\nnumero = 1\nwhile numero <= n:\n    total += numero\n    numero += 1\nprint(total)",
    note: "Se esquecer numero += 1, a condição pode nunca se tornar falsa."
  },
  {
    id: "vogais", group: "03 · Laços", title: "Percorrer um texto", kind: "program",
    prompt: "Leia uma palavra ou frase e conte suas vogais (a, e, i, o, u), usando for. Considere maiúsculas e minúsculas. Imprima a contagem.",
    rule: "As entradas dos testes não têm letras acentuadas. Espaços não contam.", requireLoop: "for",
    cases: [{ inputs: ["Python"], expected: "1" }, { inputs: ["CASA"], expected: "2" }, { inputs: ["um dia"], expected: "3" }, { inputs: [""], expected: "0" }],
    starter: "texto = input()\nquantidade = 0\n",
    hint: 'Percorra texto.lower(). Para cada letra, teste se ela está em "aeiou" com in.',
    solution: 'texto = input()\nquantidade = 0\nfor letra in texto.lower():\n    if letra in "aeiou":\n        quantidade += 1\nprint(quantidade)',
    note: "O contador aumenta só quando a condição é verdadeira."
  },
  {
    id: "dobro_funcao", group: "04 · Listas e funções", title: "De imprimir a retornar", kind: "function", fn: "dobro",
    prompt: "Escreva a função dobro(numero), que recebe um número e retorna o dobro dele.",
    rule: "Escreva a definição completa. Não use input(): o valor chega pelo parâmetro. Retorne o resultado com return.",
    cases: [{ args: [5], expected: 10 }, { args: [0], expected: 0 }, { args: [-3], expected: -6 }, { args: [2.5], expected: 5 }],
    starter: "def dobro(numero):\n    pass\n",
    hint: "def nome(parametro): abre a função. return devolve o valor para quem chamou; print não substitui return.",
    solution: "def dobro(numero):\n    return numero * 2",
    note: "Uma função que só imprime e não tem return devolve None."
  },
  {
    id: "classifica", group: "04 · Listas e funções", title: "Par, ímpar ou zero", kind: "function", fn: "classifica_numero",
    prompt: 'Escreva classifica_numero(num), que retorna "zero" se num for 0, "par" se for par e "impar" se for ímpar.',
    rule: "Retorne uma string em minúsculas, sem acento.",
    cases: [{ args: [0], expected: "zero" }, { args: [4], expected: "par" }, { args: [7], expected: "impar" }, { args: [-8], expected: "par" }, { args: [-3], expected: "impar" }],
    starter: "def classifica_numero(num):\n    pass\n",
    hint: "Zero também é par, então teste zero primeiro. Um número par deixa resto 0 na divisão por 2.",
    solution: 'def classifica_numero(num):\n    if num == 0:\n        return "zero"\n    elif num % 2 == 0:\n        return "par"\n    else:\n        return "impar"',
    note: "return encerra a chamada. Também seria correto usar if separados depois de retornar no caso zero."
  },
  {
    id: "soma", group: "04 · Listas e funções", title: "Soma de uma lista", kind: "function", fn: "soma_lista",
    prompt: "Escreva soma_lista(numeros), que retorna a soma dos elementos de uma lista, usando um for manual.",
    rule: "Não use sum(). Para uma lista vazia, retorne 0.", forbidden: ["sum"], requireLoop: "for",
    cases: [{ args: [[4, 8, 15, 16, 23, 42]], expected: 108 }, { args: [[1, 1, 1]], expected: 3 }, { args: [[]], expected: 0 }, { args: [[-5, 5]], expected: 0 }],
    starter: "def soma_lista(numeros):\n    pass\n",
    hint: "Comece total = 0 antes do for. Some cada elemento e retorne só depois que o laço acabar.",
    solution: "def soma_lista(numeros):\n    total = 0\n    for numero in numeros:\n        total += numero\n    return total",
    note: "Se return ficar dentro do for, a função para no primeiro elemento."
  },
  {
    id: "pares", group: "04 · Listas e funções", title: "Contar pares", kind: "function", fn: "conta_pares",
    prompt: "Escreva conta_pares(numeros), que retorna quantos elementos da lista são pares. Use um for manual.",
    rule: "Zero conta como par. Para lista vazia, retorne 0.", requireLoop: "for",
    cases: [{ args: [[4, 7, 8, 15, 16, 23, 42, 9]], expected: 4 }, { args: [[1, 3, 5]], expected: 0 }, { args: [[0, -2, 6]], expected: 3 }, { args: [[]], expected: 0 }],
    starter: "def conta_pares(numeros):\n    pass\n",
    hint: "É um contador: some 1, e não o próprio número, quando numero % 2 == 0.",
    solution: "def conta_pares(numeros):\n    quantidade = 0\n    for numero in numeros:\n        if numero % 2 == 0:\n            quantidade += 1\n    return quantidade",
    note: "O incremento fica dentro do if, que fica dentro do for. O return fica fora dos dois."
  },
  {
    id: "maior", group: "04 · Listas e funções", title: "Maior valor", kind: "function", fn: "maior_lista",
    prompt: "Escreva maior_lista(numeros), que retorna o maior elemento da lista.",
    rule: "A lista tem ao menos um elemento. Use for, sem max().", forbidden: ["max"], requireLoop: "for",
    cases: [{ args: [[12, 45, 3, 67, 22, 8]], expected: 67 }, { args: [[-5, -10, -2]], expected: -2 }, { args: [[9]], expected: 9 }, { args: [[1, 2, 100, 3]], expected: 100 }],
    starter: "def maior_lista(numeros):\n    pass\n",
    hint: "Comece com numeros[0], não com 0. Assim funciona quando todos os números são negativos.",
    solution: "def maior_lista(numeros):\n    maior = numeros[0]\n    for numero in numeros:\n        if numero > maior:\n            maior = numero\n    return maior",
    note: "Comparar o primeiro elemento com ele mesmo é inofensivo e mantém o código simples."
  },
  {
    id: "menor", group: "04 · Listas e funções", title: "Menor valor", kind: "function", fn: "menor_lista",
    prompt: "Escreva menor_lista(numeros), que retorna o menor elemento da lista.",
    rule: "A lista tem ao menos um elemento. Use for, sem min().", forbidden: ["min"], requireLoop: "for",
    cases: [{ args: [[12, 45, 3, 67, 22, 8]], expected: 3 }, { args: [[-5, -10, -2]], expected: -10 }, { args: [[9]], expected: 9 }, { args: [[5, 5, 5]], expected: 5 }],
    starter: "def menor_lista(numeros):\n    pass\n",
    hint: "Mesmo padrão do maior valor: inicialize com o primeiro elemento e inverta a comparação.",
    solution: "def menor_lista(numeros):\n    menor = numeros[0]\n    for numero in numeros:\n        if numero < menor:\n            menor = numero\n    return menor",
    note: "Começar em zero falharia em uma lista que só tem números positivos."
  },
  {
    id: "media_lista", group: "04 · Listas e funções", title: "Média com caso vazio", kind: "function", fn: "media_lista",
    prompt: "Escreva media_lista(numeros), que retorna a média dos elementos. Se a lista estiver vazia, retorne None.",
    rule: "Some usando for, sem sum(). Use len() para o tamanho.", forbidden: ["sum"], requireLoop: "for",
    cases: [{ args: [[6, 8, 10]], expected: 8 }, { args: [[2.5, 4]], expected: 3.25 }, { args: [[]], expected: null }, { args: [[-4]], expected: -4 }],
    starter: "def media_lista(numeros):\n    pass\n",
    hint: "Teste len(numeros) == 0 antes da divisão. Nesse caso, retorne None sem aspas.",
    solution: "def media_lista(numeros):\n    if len(numeros) == 0:\n        return None\n    total = 0\n    for numero in numeros:\n        total += numero\n    return total / len(numeros)",
    note: "Aqui None significa que não há média a calcular. É diferente de uma média igual a zero."
  },
  {
    id: "filtra_pares", group: "04 · Listas e funções", title: "Construir outra lista", kind: "function", fn: "filtra_pares",
    prompt: "Escreva filtra_pares(numeros), que retorna uma nova lista só com os números pares, na mesma ordem e mantendo repetições.",
    rule: "Use for e append(). Não altere a lista recebida.", requireLoop: "for", preserveArgs: true,
    cases: [{ args: [[3, 2, 8, 5, 2]], expected: [2, 8, 2] }, { args: [[1, 3]], expected: [] }, { args: [[]], expected: [] }, { args: [[0, -4, -1]], expected: [0, -4] }],
    starter: "def filtra_pares(numeros):\n    pass\n",
    hint: "Crie uma lista vazia antes do for. Para cada par, chame resultado.append(numero). Retorne a lista depois do laço.",
    solution: "def filtra_pares(numeros):\n    resultado = []\n    for numero in numeros:\n        if numero % 2 == 0:\n            resultado.append(numero)\n    return resultado",
    note: "append altera a lista e retorna None. Não escreva resultado = resultado.append(numero)."
  },
  {
    id: "busca", group: "04 · Listas e funções", title: "Encontrar um valor", kind: "function", fn: "contem",
    prompt: "Escreva contem(numeros, alvo), que percorre a lista com for e retorna True se encontrar alvo, ou False se não encontrar.",
    rule: "Use os valores booleanos True e False, sem aspas. Faça a busca com comparação dentro do laço.", requireLoop: "for",
    cases: [{ args: [[2, 4, 6], 6], expected: true }, { args: [[2, 4, 6], 2], expected: true }, { args: [[2, 4, 6], 3], expected: false }, { args: [[], 0], expected: false }],
    starter: "def contem(numeros, alvo):\n    pass\n",
    hint: "Você pode retornar True assim que encontrar. Só retorne False depois de percorrer tudo.",
    solution: "def contem(numeros, alvo):\n    for numero in numeros:\n        if numero == alvo:\n            return True\n    return False",
    note: "Se False ficar dentro do for, você desiste antes de verificar o segundo elemento."
  },
  {
    id: "mesa_range", group: "05 · Teste de mesa", title: "Quantas voltas?", kind: "trace",
    prompt: "Sem executar, escreva exatamente o que este programa imprime, uma linha por saída.",
    rule: "Responda com a saída, não com código Python.",
    code: "for n in range(2, 7, 2):\n    print(n)", answer: "2\n4\n6",
    hint: "Os três argumentos são início, fim e passo. Comece em 2, some 2 e pare antes de 7.",
    solution: "2\n4\n6", note: "n recebe 2, depois 4, depois 6. O próximo seria 8, fora do intervalo."
  },
  {
    id: "mesa_acumulador", group: "05 · Teste de mesa", title: "Acompanhar o acumulador", kind: "trace",
    prompt: "Faça o teste de mesa e escreva cada linha impressa. Observe onde está o print.",
    rule: "No papel, anote as colunas n e total a cada volta.",
    code: "total = 0\nfor n in [2, 5, 1]:\n    total += n\n    print(total)", answer: "2\n7\n8",
    hint: "O print está dentro do for. Ele mostra a soma parcial, não apenas a soma final.",
    solution: "2\n7\n8", note: "As atualizações são 0 + 2 = 2, depois 2 + 5 = 7, depois 7 + 1 = 8."
  },
  {
    id: "mesa_return", group: "05 · Teste de mesa", title: "Um return adiantado", kind: "trace",
    prompt: "Esta função tem um erro de lógica. Sem corrigir o código, escreva o que será impresso.",
    rule: "Responda o que o código faz, mesmo que não seja o que o autor queria.",
    code: "def soma(numeros):\n    total = 0\n    for n in numeros:\n        total += n\n        return total\n\nprint(soma([3, 4, 5]))", answer: "3",
    hint: "return encerra a função imediatamente. Veja o recuo: ele está dentro do for.",
    solution: "3", note: "Só o primeiro elemento é somado. Para somar tudo, o return deveria estar fora do laço."
  },
  {
    id: "mesa_lista", group: "05 · Teste de mesa", title: "Índices e tamanho", kind: "trace",
    prompt: "Acompanhe as mudanças na lista e escreva as duas linhas impressas.",
    rule: "Lembre que o primeiro índice é 0.",
    code: "valores = [10, 20, 30]\nvalores[1] = 5\nvalores.append(40)\nprint(valores[1])\nprint(len(valores))", answer: "5\n4",
    hint: "A atribuição substitui um elemento. append acrescenta um novo elemento ao final.",
    solution: "5\n4", note: "A lista fica [10, 5, 30, 40]. O elemento de índice 1 é 5, e há quatro elementos."
  }
];
