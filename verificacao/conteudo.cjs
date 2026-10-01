const assert = require('node:assert/strict');
const path = require('node:path');
global.window = global;
for (const name of ['exercicios', 'curriculo', 'professor', 'aprendizagem']) require(path.join(__dirname, '..', name + '.js'));
assert.equal(EXERCISES.length, 136);
assert.equal(new Set(EXERCISES.map(e => e.id)).size, EXERCISES.length);
assert.equal(EXERCISES.filter(e => e.courseAligned).length, 36);
assert.equal(CURRICULUM.units.length, 11);
const skills = new Set(LEARNING_ENGINE.skills.map(s => s.id));
for (const ex of EXERCISES) {
  assert.ok(CURRICULUM.unitById[ex.unit], ex.id);
  assert.ok(ex.skills.every(s => skills.has(s)), 'Habilidade inválida: ' + ex.id);
  if (['function', 'program'].includes(ex.kind)) assert.ok(ex.cases.length && ex.solution, ex.id);
}
assert.equal(COURSE_REVIEW.examPools.length, 6);
const ids = new Set();
for (const pool of COURSE_REVIEW.examPools) for (const id of pool) {
  const ex = EXERCISES.find(e => e.id === id);
  assert.ok(ex && ['function', 'program'].includes(ex.kind), id);
  assert.ok(!ids.has(id), 'Questão repetida entre grupos: ' + id);
  ids.add(id);
}
assert.equal(new Set(COURSE_REVIEW.reviewIds).size, 12);
assert.ok(COURSE_REVIEW.reviewIds.every(id => EXERCISES.some(e => e.id === id)));
console.log('OK: 136 atividades, 36 alinhadas ao curso, 11 unidades e seis grupos distintos no simulado.');
