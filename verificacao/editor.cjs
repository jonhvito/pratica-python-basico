const assert = require('node:assert/strict');
const path = require('node:path');

global.window = global;
for (const name of ['exercicios', 'curriculo', 'aprendizagem']) require(path.join(__dirname, '..', name + '.js'));
const { helpers } = require('../editor.js');

function edit(value, key, position = value.length, end = position) {
  const action = helpers.keyboardEdit(value, position, end, key);
  return action ? value.slice(0, action.start) + action.text + value.slice(action.end) : null;
}

assert.equal(edit('if n > 0:', 'Enter'), 'if n > 0:\n    ');
assert.equal(edit('    for n in itens: # percorre', 'Enter'), '    for n in itens: # percorre\n        ');
assert.equal(edit('    print(n)', 'Enter'), '    print(n)\n    ');
assert.equal(edit('texto = "fim:"', 'Enter'), 'texto = "fim:"\n');
assert.equal(edit('# if n > 0:', 'Enter'), '# if n > 0:\n');
assert.equal(edit('if n > 0 # falta :', 'Enter'), 'if n > 0 # falta :\n');
assert.equal(edit('if texto == "#":', 'Enter'), 'if texto == "#":\n    ');
assert.equal(edit('    ', 'Backspace'), '');
assert.equal(edit('      ', 'Backspace'), '    ');
assert.equal(edit('    n', 'Backspace'), null);
assert.equal(edit('    ', 'Backspace', 4, 2), null);
assert.equal(edit('x = 1\n    print(x)', 'Enter', 10), 'x = 1\n    \n    print(x)');
assert.deepEqual(helpers.firstDifference('a\n12', 'a\n13'), { offset: 3, line: 2, column: 2 });
assert.deepEqual(helpers.firstDifference('🐍a', '🐍b'), { offset: 1, line: 1, column: 2 });
assert.deepEqual(helpers.firstDifference('a', 'a\nb'), { offset: 1, line: 1, column: 2 });
assert.equal(helpers.firstDifference('same', 'same'), null);
assert.deepEqual(helpers.lineDifference('abc', 'abXc'), { start: 2, wantedEnd: 2, actualEnd: 3 });
assert.equal(helpers.visibleWhitespace('a \tb\r'), 'a·⇥b␍');
assert.deepEqual(helpers.boundedOutput(' 1\n2\n<script>\t\n'), { text: ' 1\n2\n<script>\t\n', truncated: false, length: 15 });
assert.deepEqual(helpers.boundedOutput('🐍'.repeat(8000)), { text: '🐍'.repeat(8000), truncated: false, length: 8000 });
assert.deepEqual(helpers.boundedOutput('🐍'.repeat(8001)), { text: '🐍'.repeat(8000), truncated: true, length: 8001 });

const loopExercise = EXERCISES.find(ex => ex.id === 'tabuada');
const loopResult = { pass: false, cases: [{ pass: false, expected: '2\n4', got: '3\n6' }] };
const loopTip = LEARNING_ENGINE.diagnosis(loopResult, loopExercise, 'for n in range(1, 3):\n    print(n * 3)');
assert.equal(loopTip.key, 'range');
assert.match(loopTip.title, /Hipótese/);
assert.match(loopTip.tip, /possibilidade|pode ser/);
assert.match(loopTip.detail, /Caso 1.*Entrada:.*Esperado:.*Obtido:/);

const fn = EXERCISES.find(ex => ex.id === 'media_lista');
const mixed = { pass: false, cases: [
  { pass: true, got: 'None', expected: 'None' },
  { pass: false, got: '3', expected: '5' }
] };
assert.notEqual(LEARNING_ENGINE.diagnosis(mixed, fn, 'def media_lista(numeros):\n    return None').key, 'return-print');
const none = { pass: false, cases: [{ pass: false, got: 'None', expected: '5' }] };
assert.equal(LEARNING_ENGINE.diagnosis(none, fn, 'def media_lista(numeros):\n    print(5)').key, 'return-print');
const error = { pass: false, cases: [
  { pass: true, got: '5', expected: '5' },
  { pass: false, error: { kind: 'ZeroDivisionError', message: 'division by zero', line: 3 }, expected: 'None' }
] };
const errorTip = LEARNING_ENGINE.diagnosis(error, fn, 'return total / len(numeros)');
assert.equal(errorTip.key, 'caso-vazio');
assert.doesNotMatch(errorTip.title, /Hipótese/);
assert.match(errorTip.detail, /Caso 2.*Argumentos:.*Esperado:/);
const changed = LEARNING_ENGINE.diagnosis({ pass: false, cases: [{ pass: false, changed: true, got: '[]', expected: '[]' }] }, EXERCISES.find(ex => ex.id === 'filtra_pares'), 'numeros.clear()');
assert.equal(changed.key, 'mutacao');

console.log('OK: recuo de Python, apagamento de recuo, localização de diferenças e dicas vinculadas ao primeiro caso que falhou.');
