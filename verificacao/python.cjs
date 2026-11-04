/* Executa o mesmo harness do worker em Python local. Não instala Python ou Pyodide.
   Em ambientes que bloqueiam processos filhos: node verificacao/python.cjs --emit-python | python -
   A validação de CDN, worker e limite de quatro segundos continua no teste de navegador. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

global.window = global;
for (const name of ['exercicios', 'curriculo', 'professor', 'aprendizagem']) require(path.join(__dirname, '..', name + '.js'));
const source = fs.readFileSync(path.join(__dirname, '..', 'python.js'), 'utf8');
const match = source.match(/const harness = (`[\s\S]*?`);/);
assert.ok(match, 'Harness Python do worker não encontrado.');
const harness = vm.runInNewContext(match[1]);
const executable = EXERCISES.filter(exercise => ['function', 'program'].includes(exercise.kind));
const variants = executable.flatMap(exercise => [1, 7, 42, 123, 999].map(seed => LEARNING_ENGINE.materialize(exercise, seed)).filter(exercise => exercise.variantSeed).map(exercise => ({ exercise, code: exercise.solution })));
const traces = EXERCISES.filter(exercise => exercise.kind === 'trace').map(exercise => ({ exercise: { ...exercise, kind: 'program', cases: [{ inputs: [], expected: exercise.answer || exercise.solution }] }, code: exercise.code }));
const payloads = { solutions: executable.map(exercise => ({ exercise, code: exercise.solution })), variants, traces };
const lista = require('../lista-testes.js').entries;
const listaEncoded = Buffer.from(JSON.stringify(lista), 'utf8').toString('base64');
const referencias = fs.readFileSync(path.join(__dirname, 'lista-referencias.py'), 'utf8');
const encoded = Buffer.from(JSON.stringify(payloads), 'utf8').toString('base64');
const script = harness + `
import base64
_tests = json.loads(base64.b64decode("${encoded}"))
_counts = {}
for group, payloads in _tests.items():
    for payload in payloads:
        result = _check(payload)
        assert result.get("pass"), (group, payload["exercise"]["id"], result)
    _counts[group] = len(payloads)

_regressions = 1
def check_case(exercise, code):
    global _regressions
    _regressions += 1
    result = _check({"exercise": exercise, "code": code})
    assert result.get("pass"), result
    return result["cases"][0]

def experiment(exercise, code, options):
    global _regressions
    _regressions += 1
    result = _experiment({"exercise": exercise, "code": code, "options": options})
    assert "pass" not in result and "cases" not in result, result
    return result

primes = next(payload for payload in _tests["solutions"] if payload["exercise"]["id"] == "curso-primos")
prime_cases = _check(primes)["cases"]
assert all(case["got"] == case["expected"] for case in prime_cases), prime_cases
assert "..." not in prime_cases[0]["got"], prime_cases

function = {"id": "representation", "kind": "function", "fn": "test", "cases": [{"args": [], "expected": [1, 2, 3, 4, 5, 6, 7, 8]}]}
case = check_case(function, "def test():\\n    return list(range(1, 9))")
assert case["got"] == case["expected"] == "[1, 2, 3, 4, 5, 6, 7, 8]"
function["cases"][0]["expected"] = {"a": 1, "b": 2}
case = check_case(function, "def test():\\n    return {'b': 2, 'a': 1}")
assert case["got"] != case["expected"] and case["pass"], case
function["cases"][0]["expected"] = 2.0
case = check_case(function, "def test():\\n    return 2")
assert case["got"] != case["expected"] and case["pass"], case
function["cases"][0]["expected"] = ["x"] * 2000
case = check_case(function, "def test():\\n    return ['x'] * 2000")
assert len(case["got"]) == 8000 and case["gotLength"] == 10000 and case["gotTruncated"] and case["expectedTruncated"], case
function["cases"][0]["expected"] = "\\U0001f40d" * 8001
case = check_case(function, "def test():\\n    return '\\U0001f40d' * 8001")
assert len(case["got"]) == 8000 and case["gotLength"] == 8003, case

preserve = {"id": "preserve-kwargs", "kind": "function", "fn": "test", "preserveArgs": True,
            "cases": [{"args": [], "kwargs": {"valores": [1, 2]}, "expected": 3}]}
unchanged = check_case(preserve, "def test(*, valores):\\n    return sum(valores)")
assert not unchanged["changed"] and unchanged["got"] == "3", unchanged
mutated = _check({"exercise": preserve, "code": "def test(*, valores):\\n    resultado = sum(valores)\\n    valores.append(4)\\n    return resultado"})
_regressions += 1
assert not mutated["pass"] and mutated["cases"][0]["changed"] and mutated["cases"][0]["got"] == "3", mutated
assert preserve["cases"][0]["kwargs"]["valores"] == [1, 2]

program = {"id": "custom-program", "kind": "program"}
result = experiment(program, "a = int(input())\\nb = int(input())\\nprint(a + b)", {"inputs": "3\\r\\n4"})
assert result["got"] == "7\\n" and result["stdout"] == "", result
result = experiment(program, "print(input())", {"inputs": [""]})
assert result["got"] == "\\n", result
result = experiment(program, "print('antes')\\ninput()", {"inputs": []})
assert result["error"]["kind"] == "EOFError" and result["got"] == "antes\\n" and result["error"]["line"] == 2, result
result = experiment(program, "print('x' * 8001)", {})
assert result["error"]["kind"] == "RuntimeError", result

custom = {"id": "custom-function", "kind": "function", "fn": "sum_with"}
code = "def sum_with(values, extra):\\n    print('observacao')\\n    return sum(values) + extra"
result = experiment(custom, code, {"arguments": "[1, 2], 3"})
assert result["got"] == "6" and result["stdout"] == "observacao\\n", result
result = experiment(custom, code, {"args": [[1, 2], 3]})
assert result["got"] == "6", result
result = experiment(custom, code, {"arguments": "[1, 2], 3,"})
assert result["got"] == "6", result
result = experiment(custom, code, {"arguments": "[1, 2], extra=3"})
assert result["got"] == "6" and result["stdout"] == "observacao\\n", result
result = experiment(custom, code, {"arguments": "[1, 2], **{'extra': 3}"})
assert result["error"]["kind"] == "ValueError", result
special = {"id": "special", "kind": "function", "fn": "teste", "cases": [{"args": [3], "kwargs": {"opcao": 4}, "expected": [3, 4], "expectedTuple": True, "expectedStdout": "ok\\n"}]}
case = check_case(special, "def teste(x, /, *, opcao):\\n    print('ok')\\n    return (x, opcao)")
assert case["stdout"] == case["expectedStdout"] == "ok\\n", case
bad = _check({"exercise": special, "code": "def teste(x, /, *, opcao):\\n    return (x, opcao)"})
assert not bad["pass"] and not bad["cases"][0]["pass"], bad
assert bad["cases"][0]["expectedStdout"] == "ok\\n" and bad["cases"][0]["stdout"] == "" and not bad["cases"][0]["stdoutPass"], bad
special["cases"] = [{"args": [], "expected": [29.4, {"valor": [0.3]}], "expectedTuple": True}]
check_case(special, "def teste():\\n    return (29.40000000001, {'valor': [0.1 + 0.2]})")
special["cases"] = [{"args": [], "kwargs": {"x": 1}, "expected": None, "expectedError": "TypeError"}]
check_case(special, "def teste(x, /):\\n    return x")
result = experiment(custom, code, {"arguments": "__import__('os'), 3"})
assert result["error"]["kind"] == "ValueError", result
result = experiment(custom, code, {"arguments": "*[1, 2]"})
assert result["error"]["kind"] == "ValueError", result
result = experiment(custom, code, {"arguments": "1).foo(2"})
assert result["error"]["kind"] == "ValueError" and result["error"]["context"] == "arguments" and result["error"]["line"] is None, result
result = experiment(custom, code, {"arguments": "[1, 2],"})
assert result["error"]["kind"] == "TypeError" and result["stdout"] == "", result
result = experiment(custom, "def outra():\\n    return 1", {"arguments": "[1], 2"})
assert result["error"]["kind"] == "NameError", result
result = experiment(custom, "def sum_with(a, b)\\n    return a", {"arguments": "1, 2"})
assert result["error"]["kind"] == "SyntaxError" and result["error"]["line"] == 1, result
result = experiment({"kind": "choice"}, "", {})
assert result["error"]["kind"] == "ValueError", result
result = experiment(custom, "def sum_with(a, b):\\n    return 'x' * 9000", {"arguments": "None, {'a': True}"})
assert result["gotTruncated"] and result["gotLength"] == 9002 and len(result["got"]) == 8000, result
_counts["regressions"] = _regressions
${referencias}
_lista = json.loads(base64.b64decode("${listaEncoded}"))
assert set(solucoes) == set(_lista), (set(solucoes)-set(_lista),set(_lista)-set(solucoes))
for chave, exercise in _lista.items():
    resultado = _check({"exercise": exercise, "code": base + "\\n" + solucoes[chave]})
    assert resultado.get("pass"), (chave, resultado)
    errado = _check({"exercise": exercise, "code": "def " + exercise["fn"] + "(*args, **kwargs):\\n    return None"})
    assert not all(item["pass"] for item in errado["cases"]), (chave, errado)
restricao = _check({"exercise": _lista["8a"], "code": "import math\\ndef fatorial(n):\\n    for _ in range(1): pass\\n    return math.factorial(n) if n>=0 else None"})
assert all(item["pass"] for item in restricao["cases"]) and restricao["rules"], restricao
restricoes = {
 "2a": "def sinal_vec(valores):\\n    return ['+' if x>0 else '-' if x<0 else '0' for x in valores]",
 "3a": "def bissexto(ano):\\n    if ano%400==0: return True\\n    return ano%4==0 and ano%100!=0",
 "6b": "def tree(n):\\n    for i in range(1,n+1): print('*'*i)",
 "10a": "import math\\ndef exp_aprox(x,n):\\n    return sum(x**k/math.factorial(k) for k in range(n+1))",
 "10c": "import math\\ndef exp_rapida(x,n):\\n    return sum(x**k/math.factorial(k) for k in range(n+1))",
 "13a": "def media_valida(dados):\\n    validos=[v for v in dados if v is not None and v>=0]\\n    return (sum(validos)/len(validos) if validos else None,len(dados)-len(validos))",
 "15a": "def soma_digitos(n):\\n    while n<0: n+=1\\n    return sum(int(i) for i in str(n))",
}
for chave, codigo in restricoes.items():
    resultado = _check({"exercise": _lista[chave], "code": codigo})
    assert all(item["pass"] for item in resultado["cases"]) and resultado["rules"], (chave, resultado)
duplicada = _check({"exercise": _lista["6b"], "code": solucoes["6b"] + "\\n" + restricoes["6b"]})
assert all(item["pass"] for item in duplicada["cases"]) and duplicada["rules"], duplicada
assert not _check({"exercise": _lista["19a"], "code": "def pares_soma(valores, alvo):\\n    return [[2,6],[7,1]]"})["cases"][0]["pass"]
_counts["lista"] = len(_lista)
print(json.dumps({"status": "OK", "checks": _counts}, ensure_ascii=True))
`;

if (process.argv.includes('--emit-python')) {
  process.stdout.write(script);
} else {
  const commands = process.env.PYTHON ? [[process.env.PYTHON, []]] : process.platform === 'win32' ? [['python', []], ['py', ['-3']], ['python3', []]] : [['python3', []], ['python', []]];
  let result;
  let chosen;
  for (const [command, args] of commands) {
    result = spawnSync(command, [...args, '-'], { input: script, encoding: 'utf8', timeout: 45000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    chosen = command;
    if (!result.error || result.error.code !== 'ENOENT') break;
  }
  if (result.error) {
    console.error('Não foi possível executar Python local (' + chosen + '): ' + result.error.message + '.');
    console.error('Use PYTHON para informar um executável ou, quando processos filhos estiverem bloqueados, execute node verificacao/python.cjs --emit-python | python -.');
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'Python terminou sem resultado.\n');
    process.exitCode = 1;
  } else {
    assert.match(result.stdout, /"status": "OK"/, 'Python não confirmou as verificações.');
    process.stdout.write(result.stdout);
    console.log('OK: harness do worker em Python local; CDN e Pyodide não foram exercitados por este comando.');
  }
}
