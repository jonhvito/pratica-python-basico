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
assert result["error"]["kind"] == "ValueError", result
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
