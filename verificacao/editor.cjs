const assert = require('node:assert/strict');
const path = require('node:path');

global.window = global;
for (const name of ['exercicios', 'curriculo', 'professor', 'aprendizagem']) require(path.join(__dirname, '..', name + '.js'));
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
assert.deepEqual(helpers.comparisonState('2.0', '2', { pass: true }), { difference: null, approved: true, abbreviated: false });
assert.equal(helpers.comparisonState("{'a': 1, 'b': 2}", "{'b': 2, 'a': 1}", { pass: true }).difference, null);
assert.equal(helpers.comparisonState('2.0', '2', { pass: false }).difference.column, 2);
assert.deepEqual(helpers.comparisonState('[]', '[]', { pass: false }), { difference: null, approved: false, abbreviated: false });
assert.equal(helpers.comparisonState('long', 'long', { gotTruncated: true }).abbreviated, true);

// DOM mínimo para verificar a semântica do feedback, sem depender de um navegador.
const { comparison } = require('../editor.js');
global.document = { createElement(tag) { return { tag, textContent: '', children: [], append(...nodes) { this.children.push(...nodes); } }; } };
function descendants(node) { return [node, ...node.children.flatMap(descendants)]; }
const approved = descendants(comparison('2.0', '2', { pass: true }));
assert.equal(approved.some(node => node.tag === 'mark'), false);
assert.equal(approved.some(node => node.className === 'comparison-position'), false);
assert.ok(approved.some(node => /Caso aprovado/.test(node.textContent)));
const failedComparison = descendants(comparison('2.0', '2', { pass: false }));
assert.ok(failedComparison.some(node => node.tag === 'mark'));
const truncated = descendants(comparison('x'.repeat(8000), 'x'.repeat(8000), { pass: false, expectedTruncated: true, expectedLength: 9000, gotTruncated: true, gotLength: 9001 }));
assert.ok(truncated.some(node => /8\.000 de 9001/.test(node.textContent)));
assert.ok(truncated.some(node => /não foi aprovado/.test(node.textContent)));
delete global.document;

for (const exercise of EXERCISES) {
  const hints = LEARNING_ENGINE.hintsFor(exercise);
  assert.equal(hints.length, 3, exercise.id);
  assert.equal(hints[1].text, exercise.hint, exercise.id);
  assert.ok(hints[0].text && hints[2].code, exercise.id);
  assert.ok(LEARNING_ENGINE.explanationPrompt(exercise).length > 20, exercise.id);
  assert.ok(LEARNING_ENGINE.transferPrompt(exercise).length > 20, exercise.id);
  assert.equal(LEARNING_ENGINE.rubricFor(exercise).length, 3, exercise.id);
  const materials = LEARNING_ENGINE.materialsFor(exercise);
  assert.equal(materials.length, 1, exercise.id);
  assert.match(materials[0].title, /^Python Iluminado · /, exercise.id);
  const url = new URL(materials[0].url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'pythoniluminado.netlify.app');
  assert.match(url.pathname, /^\/[a-z-]+\/$/);
}

assert.equal(LEARNING_ENGINE.materialsFor({ unit: 'condicoes' })[0].url, 'https://pythoniluminado.netlify.app/if-else/');
assert.deepEqual(LEARNING_ENGINE.materialsFor({ unit: 'indisponivel' }), []);
assert.deepEqual(LEARNING_ENGINE.materialsFor({ unit: 'constructor' }), []);
assert.deepEqual(LEARNING_ENGINE.materialsFor(null), []);
const changedMaterial = LEARNING_ENGINE.materialsFor({ unit: 'listas' });
changedMaterial[0].url = 'alterado';
assert.equal(LEARNING_ENGINE.materialsFor({ unit: 'listas' })[0].url, 'https://pythoniluminado.netlify.app/listas/');

const originalCatalogue = structuredClone(EXERCISES);
const projects = EXERCISES.map(exercise => ({ exercise, project: LEARNING_ENGINE.projectFor(exercise) })).filter(item => item.project);
assert.equal(EXERCISES.length, 136);
assert.deepEqual(projects.map(item => item.exercise.id).sort(), ['curso-frequencias', 'curso-medias-filiais']);
for (const { exercise, project } of projects) {
  assert.equal(exercise.kind, 'function');
  assert.match(project.briefing, new RegExp(exercise.fn + '\\('));
  assert.equal(project.steps.length, 4);
  assert.match(project.steps[0], /Plano/);
  assert.match(project.steps[1], /antes.*(?:execut|execução|função)/);
  assert.match(project.steps[2], /casos.*atividade/);
  assert.match(project.steps[3], /Explicação/);
  assert.equal(project.edgeCases.length, 3);
  assert.equal(project.rubric.length, 3);
  assert.ok(project.rubric.every(criterion => criterion.length > 30));
  project.steps[0] = 'alterado'; project.edgeCases[0] = 'alterado'; project.rubric[0] = 'alterado';
  const unchanged = LEARNING_ENGINE.projectFor(exercise);
  assert.match(unchanged.steps[0], /Plano/);
  assert.notEqual(unchanged.edgeCases[0], 'alterado');
  assert.notEqual(unchanged.rubric[0], 'alterado');
}
const frequencyProject = LEARNING_ENGINE.projectFor(EXERCISES.find(exercise => exercise.id === 'curso-frequencias'));
assert.match(frequencyProject.briefing, /strings/);
assert.ok(frequencyProject.edgeCases.some(text => text.includes("{'-2': 2, '0': 1}")));
const branchProject = LEARNING_ENGINE.projectFor(EXERCISES.find(exercise => exercise.id === 'curso-medias-filiais'));
assert.match(branchProject.briefing, /lista vazia.*0/);
assert.ok(branchProject.edgeCases.some(text => text.includes("{'oeste': {}}")));
assert.equal(LEARNING_ENGINE.projectFor(EXERCISES.find(exercise => exercise.id === 'ola')), null);
assert.equal(LEARNING_ENGINE.projectFor(null), null);
assert.deepEqual(EXERCISES, originalCatalogue);

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

console.log('OK: recuo, comparação semântica, diagnóstico, apoio gradual e dois projetos com plano, casos, implementação e explicação, preservando 136 atividades.');
