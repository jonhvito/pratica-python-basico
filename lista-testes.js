/* Casos finitos da lista. As regras AST são indícios, não prova de método. */
(function (root) {
  "use strict";
  const c = (args, expected, extra = {}) => ({ args, expected, ...extra });
  const out = (args, expectedStdout, kwargs) => c(args, null, { expectedStdout, ...(kwargs ? { kwargs } : {}) });
  const tup = (args, expected, extra = {}) => c(args, expected, { expectedTuple: true, ...extra });
  const err = (args, kwargs = {}) => c(args, null, { kwargs, expectedError: "TypeError" });
  const specs = {
    "1": ["sinal", [c([3.7], "+"), c([-2], "-"), c([0], "0")]],
    "2a": ["sinal_vec", [c([[4,-1,0,2.5,-0.3]], ["+","-","0","+","-"]), c([[]], [])], { calls: ["sinal"] }],
    "2b": ["conta_sinais", [c([[4,-1,0,2.5,-0.3]], {"+":2,"-":2,"0":1}), c([[]], {"+":0,"-":0,"0":0})], { calls: ["sinal_vec"] }],
    "3a": ["bissexto", [c([2024], true), c([1900], false), c([2000], true), c([2023], false)], { noIf: true }],
    "4b": ["soma_pares", [c([3,10], 28), c([2,2], 2), c([7,7], 0), c([1,5], 6)], {calls:["range"]}],
    "4c": ["contagem_regressiva", [out([3], "3\n2\n1\nFim\n"), out([1], "1\nFim\n")], { calls: ["range"] }],
    "6a": ["tree", [out([2], "*\n**\n"), out([3], "*\n**\n***\n")], { requireTextMult:true }],
    "6b": ["tree", [out([2], "*\n**\n"), out([5], "*\n**\n***\n****\n*****\n")], { nestedFor: true, noTextMult: true }],
    "6c": ["tree_inv", [out([3], "***\n**\n*\n"), out([1], "*\n")]],
    "6d": ["tree", [out([2], "*\n**\n"), out([3], "*\n**\n***\n")], { require: ["while"] }],
    "7a": ["tree_alt", [out([3], "*\n*-\n*-*\n"), out([4], "*\n*-\n*-*\n*-*-\n")], { nestedFor: true }],
    "7b": ["tree_alt", [out([3], "*\n*-\n*-*\n"), out([4], "o\no.\no.o\no.o.\n", { impar:"o", par:"." })]],
    "7c": ["tree_alt", [out([3], "*\n*-\n*-*\n"), out([4], "*\n*-\n*-*\n*-*-\n")], { singleLoop: true }],
    "8a": ["fatorial", [c([0],1), c([5],120), c([10],3628800), c([-3],null)], { require:["for"], forbidCalls:["factorial"] }],
    "8b": ["fatorial_while", [c([0],1), c([5],120), c([10],3628800), c([-3],null)], { require:["while"], forbidCalls:["factorial"] }],
    "9a": ["soma_geometrica", [c([0.5,5],1.96875), c([2,0],1), c([2,5],63)]],
    "10a": ["exp_aprox", [c([1,5],2.716666666666667), c([2,0],1), c([0,5],1)], { calls:["fatorial"] }],
    "10c": ["exp_rapida", [c([1,5],2.716666666666667), c([2,0],1), c([0,5],1)], { noPower:true, forbidCalls:["fatorial","factorial"] }],
    "11a": ["seno", [tup([0.5235987755982988],[0.5,5]), tup([0.5235987755982988],[0.49967417939436376,2], {kwargs:{tol:0.001}})], { require:["while","break"] }],
    "12a": ["eh_primo", [c([1],false), c([2],true), c([9],false), c([29],true)], { require:["break"] }],
    "12b": ["eh_primo", [c([1],false), c([2],true), c([49],false), c([97],true)], { require:["break"] }],
    "12c": ["primos_ate", [c([30],[2,3,5,7,11,13,17,19,23,29]), c([1],[]), c([2],[2])]],
    "13a": ["media_valida", [tup([[28.5,null,30.1,-99,27.8,31,null,29.6]],[29.4,3]), tup([[null,-99,null]],[null,3])], {require:["continue"]}],
    "13c": ["media_valida", [tup([[28.5,null,30.1,-99,27.8,31,null,29.6]],[29.4,3]), tup([[null,-99,null]],[null,3])], {forbidNodes:["continue"], requireIf:true}],
    "14a": ["passos_collatz", [c([6],8), c([1],0), c([3],7)], {require:["while"]}],
    "14b": ["sequencia_collatz", [c([6],[6,3,10,5,16,8,4,2,1]), c([1],[1])], {require:["while"]}],
    "15a": ["soma_digitos", [c([2026],10), c([9],9)], {require:["while"], forbidCalls:["str"]}],
    "15b": ["inverte", [c([12345],54321), c([1230],321)], {require:["while"], forbidCalls:["str"]}],
    "15c": ["eh_capicua", [c([12321],true), c([1230],false)], {forbidCalls:["str"]}],
    "15d": ["quantos_digitos", [c([90210],5), c([1],1)], {require:["while"], forbidCalls:["str"]}],
    "16a": ["frequencias", [c([["sim","não","sim","talvez","sim","não","sim","talvez","não","sim"]], {"sim":5,"não":3,"talvez":2}), c([[]],{})]],
    "16b": ["imprime_tabela", [c([{sim:5,"não":3,talvez:2}], null, {expectedStdoutTokens:[["Categoria","Abs.","Rel.","%"],["sim","5","0.50","50.0%"],["não","3","0.30","30.0%"],["talvez","2","0.20","20.0%"]]})]],
    "16c": ["moda", [c([{sim:5,"não":3,talvez:2}],"sim"), c([{a:1,b:4}],"b")], {calls:["items"]}],
    "17a": ["boletim", [c([{Diego:[7,7,6.9]}], null, {expectedLiteral:"{'Diego': (6.97, 'Prova final')}"}), c([{Ana:[8,7.5,9]}], null, {expectedLiteral:"{'Ana': (8.17, 'Aprovado')}"})]],
    "18a": ["produto_interno", [c([[1,2,3,4,5],[2.1,3.9,6.2,7.8,10.1]],110.2), c([[1],[1,2]],null)], {calls:["zip"]}],
    "18b": ["covariancia", [c([[1,2,3,4,5],[2.1,3.9,6.2,7.8,10.1]],4.975), c([[1,2],[2,4]],1)]],
    "18c": ["posicoes_do_maximo", [c([[3,7,1,7,2,7]],[1,3,5]), c([[5]],[0])], {calls:["enumerate"]}],
    "19a": ["pares_soma", [c([[2,7,4,5,1,6],8],null,{expectedLiteral:"[(2, 6), (7, 1)]"}), c([[1,1],2],null,{expectedLiteral:"[(1, 1)]"})], {nestedFor:true}],
    "19c": ["eh_palindromo", [c(["A base do teto desaba"],true), c(["Python"],false)], {require:["while","break"]}],
    "19d": ["fibonacci", [c([10],[0,1,1,2,3,5,8,13,21,34]), c([1],[0])]],
    "20c": ["resumo", [c([[4,1,3,2]],2.5,{kwargs:{medida:"mediana"}}), c([[2.5,3.14159,1],3],2.214), c([[1,2,3]],2), c([[1,2,3],1],2,{kwargs:{medida:"amplitude"}}), c([[1,2,3]],null,{kwargs:{medida:"outra"}}), err([], {dados:[1,2,3]}), err([[1,2,3],1,"mediana"]) ]],
    "20d": ["resumo", [c([[1,2,3]],2), c([[1,2,3]],2,{kwargs:{casas:1}}), err([[1,2,3],1]), err([], {dados:[1,2,3]})]]
  };
  const entries = Object.fromEntries(Object.entries(specs).map(([key, [fn, cases, didactic]]) => [key, {id:"lista-"+key, kind:"function", fn, cases, didactic:didactic || {}}]));
  const api = { entries };
  root.LISTA_TESTES = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
