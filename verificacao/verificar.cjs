/* Verificação opcional: node pratica-python-basico/verificacao/verificar.cjs
   Usa Node >= 22 e Chrome/Edge local, sem instalar dependências. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawn } = require("node:child_process");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(__dirname, "artefatos");
for (const file of ["curriculo.js", "aprendizagem.js", "treinador.js", "manifest.webmanifest", "service-worker.js", "icone.svg"]) {
  assert.ok(fs.existsSync(path.join(root, file)), "Arquivo necessário ausente: " + file);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./index.html");
fs.mkdirSync(artifacts, { recursive: true });
const profile = fs.mkdtempSync(path.join(artifacts, "perfil-"));
const executable = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(file => fs.existsSync(file));
assert.ok(executable, "Chrome ou Edge precisa estar instalado.");
const browser = spawn(executable, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let connection;
let offlineServer;
let sequence = 0;
const pending = new Map();
const errors = [];

async function waitFor(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    await pause(120);
  }
  throw new Error("Tempo esgotado: " + message);
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error("CDP demorou: " + method)); }, 90000);
    pending.set(id, { resolve, reject, timeout });
    connection.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

async function click(id) { await evaluate(`document.getElementById(${JSON.stringify(id)}).click()`); }
async function input(value) {
  await evaluate(`document.getElementById('answer').value = ${JSON.stringify(value)}; document.getElementById('answer').dispatchEvent(new Event('input', {bubbles: true}));`);
}
async function select(id) {
  await evaluate(`Array.from(document.querySelectorAll('.exercise-link')).find(button => button.textContent.includes(EXERCISES.find(ex => ex.id === ${JSON.stringify(id)}).title)).click()`);
}
async function checked() {
  await click("check-button");
  await waitFor(() => evaluate("!document.getElementById('check-button').disabled"), "correção", 80000);
  return evaluate("document.getElementById('feedback').textContent");
}

(async () => {
  const portFile = path.join(profile, "DevToolsActivePort");
  const port = await waitFor(() => {
    try { return fs.readFileSync(portFile, "utf8").split(/\r?\n/)[0]; }
    catch (error) { if (["ENOENT", "EBUSY"].includes(error.code)) return false; throw error; }
  }, "início do navegador");
  const targets = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  connection = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  connection.addEventListener("message", event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const request = pending.get(data.id);
      pending.delete(data.id);
      clearTimeout(request.timeout);
      if (data.error) request.reject(new Error(JSON.stringify(data.error)));
      else request.resolve(data.result);
    }
    if (data.method === "Runtime.exceptionThrown") errors.push(data.params.exceptionDetails);
  });
  await new Promise((resolve, reject) => { connection.addEventListener("open", resolve, { once: true }); connection.addEventListener("error", reject, { once: true }); });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1365, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: pathToFileURL(path.join(root, "index.html")).href });
  await waitFor(() => evaluate("typeof EXERCISES !== 'undefined' && document.querySelectorAll('.exercise-link').length === 136"), "página local");
  await evaluate("window.confirm = () => true");
  assert.deepEqual(await evaluate("(() => { const ids = [...document.querySelectorAll('[id]')].map(node => node.id); return ids.filter((id, index) => ids.indexOf(id) !== index); })()"), []);
  assert.equal(await evaluate("[...document.querySelectorAll('button')].every(button => (button.textContent || button.getAttribute('aria-label') || '').trim())"), true);
  assert.equal(await evaluate("document.getElementById('answer').value"), "");
  assert.deepEqual(await evaluate("({ exercises: EXERCISES.length, unique: new Set(EXERCISES.map(ex => ex.id)).size, units: CURRICULUM.units.length, kinds: [...new Set(EXERCISES.map(ex => ex.kind))].sort() })"), { exercises: 136, unique: 136, units: 11, kinds: ["choice", "function", "order", "program", "trace"] });
  await click("curriculum-button");
  assert.equal(await evaluate("document.getElementById('curriculum-dialog').open && document.querySelectorAll('.curriculum-card').length === 11"), true);
  await click("close-curriculum");
  await evaluate("(() => { const select = document.getElementById('unit-filter'); select.value = 'sintaxe'; select.dispatchEvent(new Event('change', { bubbles: true })); })()");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length"), 9);
  await evaluate("(() => { const select = document.getElementById('unit-filter'); select.value = 'all'; select.dispatchEvent(new Event('change', { bubbles: true })); })()");
  console.log("OK: página abre por file:// com 136 exercícios únicos, 11 unidades, cinco formatos de questão e filtro curricular.");
  await click("course-review-button");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length"), 12);
  assert.equal(await evaluate("document.getElementById('coach-title').textContent"), "Revisão do curso");
  await input("True\nFalse\nTrue");
  assert.match(await checked(), /Passou/);
  await click("practice-mode");
  await click("course-exam-button");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length"), 6);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('python-de-cabeca-v1')).exam.course"), true);
  await click("new-exam");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('python-de-cabeca-v1')).exam.course"), true);
  await click("practice-mode");
  console.log("OK: revisão guiada funciona e simulado do curso conserva seu perfil ao gerar nova prova.");

  if (process.argv.includes("--layout-only")) {
    await select("classifica");
    for (const width of [1365, 390]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, mobile: width === 390 });
      await select("classifica");
      await input("# rascunho");
      assert.equal(await evaluate("(() => { const nav = document.getElementById('exercise-list').getBoundingClientRect(); const active = document.querySelector('.exercise-link[aria-current=true]').getBoundingClientRect(); return active.top >= nav.top - 1 && active.bottom <= nav.bottom + 1; })()"), true);
      assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), true);
      await input("");
      const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: width === 390 });
      fs.writeFileSync(path.join(artifacts, width === 390 ? "celular.png" : "desktop.png"), Buffer.from(screenshot.data, "base64"));
    }
    console.log("OK: exercício ativo fica visível no menu ao navegar e digitar, no computador e no celular.");
    return;
  }

  await select("mesa_range");
  await input("2\n4\n6\n");
  assert.match(await checked(), /Passou/);
  assert.equal(await evaluate("document.getElementById('runtime-status').textContent.includes('primeira vez')"), true);
  console.log("OK: teste de mesa funciona antes de carregar Python.");

  await select("sintaxe-identificador");
  assert.equal(await evaluate("!document.getElementById('choice-panel').hidden && document.getElementById('editor-wrap').hidden"), true);
  await evaluate("(() => { const ex = EXERCISES.find(item => item.id === 'sintaxe-identificador'); document.querySelectorAll('.choice-option')[Number(ex.answer)].click(); })()");
  assert.match(await checked(), /Passou/);
  await select("logica-sequencia");
  assert.equal(await evaluate("!document.getElementById('order-panel').hidden && document.querySelectorAll('#order-lines li').length === 4"), true);
  await evaluate(`(() => {
    const expected = EXERCISES.find(item => item.id === "logica-sequencia").lines;
    for (let target = 0; target < expected.length; target += 1) {
      let guard = 20;
      while (guard-- > 0) {
        const rows = [...document.querySelectorAll("#order-lines li")];
        const current = rows.findIndex(row => row.querySelector("code").textContent === expected[target]);
        if (current <= target) break;
        rows[current].querySelector("button").click();
      }
    }
  })()`);
  assert.match(await checked(), /Passou/);
  console.log("OK: alternativas e ordenação ensinam conceitos sem exigir o editor de código.");

  await click("curriculum-button");
  await click("start-diagnostic");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length === 11 && JSON.parse(localStorage.getItem('python-de-cabeca-v1')).coach.type === 'diagnostic'"), true);
  await click("practice-mode");
  console.log("OK: diagnóstico inicial seleciona uma questão representativa de cada unidade.");

  await select("dobro_funcao");
  await evaluate("document.querySelector('[data-confidence=\"3\"]').click()");
  await input("def dobro(numero):\n    print(numero * 2)");
  assert.match(await checked(), /Ainda tem algo|ajustar/);
  assert.equal(await evaluate("(() => { const s = JSON.parse(localStorage.getItem('python-de-cabeca-v1')); return s.version === 4 && s.learning.attempts.some(a => a.exerciseId === 'dobro_funcao' && !a.pass && a.confidence === 3) && s.learning.records.dobro_funcao.dueAt > Date.now(); })()"), true);
  assert.equal(await evaluate("document.getElementById('mistakes-count').hidden"), false);
  await click("mistakes-button");
  assert.equal(await evaluate("document.getElementById('mistakes-dialog').open && document.querySelectorAll('.mistake-entry').length === 1"), true);
  await click("close-mistakes");
  await click("learning-button");
  assert.equal(await evaluate("document.getElementById('learning-dialog').open && document.querySelectorAll('.skill-card').length === 15 && document.querySelectorAll('.stat-card').length === 4"), true);
  await click("close-learning");
  console.log("OK: confiança, histórico, revisão, domínio e caderno de erros são atualizados por uma tentativa real.");

  await select("dobro");
  await click("new-variant");
  assert.equal(await evaluate("!document.getElementById('variant-label').hidden && document.getElementById('variant-label').textContent.includes('Variação')"), true);
  await input("numero = int(input())\nprint(numero * 2)");
  assert.match(await checked(), /Passou/);
  console.log("OK: uma nova variação troca os casos e continua corrigível pela solução geral.");

  await select("soma");
  await evaluate("document.querySelector('[data-format=\"bug\"]').click()");
  assert.equal(await evaluate("document.getElementById('answer').value.includes('return total') && !document.getElementById('challenge-note').hidden"), true);
  await evaluate("document.querySelector('[data-format=\"fade\"]').click()");
  assert.equal(await evaluate("document.getElementById('answer').value.includes('complete esta linha')"), true);
  await select("mesa_range");
  await click("add-trace-row");
  assert.equal(await evaluate("document.querySelectorAll('#trace-rows tr').length >= 2"), true);
  console.log("OK: caça ao bug, código incompleto e tabela de mesa funcionam sem servidor.");

  await click("coach-mode");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length === 5 && !document.getElementById('coach-panel').hidden"), true);
  assert.equal(await evaluate("(() => { const c = JSON.parse(localStorage.getItem('python-de-cabeca-v1')).coach; return c.ids.length === 5 && Object.keys(c.formats).length === 5 && Object.keys(c.variants).length === 5; })()"), true);
  await click("practice-mode");
  console.log("OK: treino do dia monta cinco etapas adaptativas com formatos e variações separados.");

  await select("soma");
  const draft = "# <textarea> & <script> fica como texto\ndef soma_lista(numeros):\n    return 9";
  await input(draft);
  await select("ola");
  await select("soma");
  assert.equal(await evaluate("document.getElementById('answer').value"), draft);
  await send("Page.reload");
  await waitFor(() => evaluate("document.getElementById('answer')?.value.includes('return 9')"), "rascunho após recarregar");
  assert.equal(await evaluate("document.getElementById('answer').value"), draft);
  await evaluate("window.confirm = () => true");
  console.log("OK: rascunhos persistem ao navegar e recarregar, preservando texto HTML.");

  const solutions = await evaluate("EXERCISES.filter(ex => ['program', 'function'].includes(ex.kind)).map(ex => ({ id: ex.id, code: ex.solution }))");
  for (const solution of solutions) {
    const result = await evaluate(`PythonRunner.run(EXERCISES.find(ex => ex.id === ${JSON.stringify(solution.id)}), ${JSON.stringify(solution.code)})`);
    assert.equal(result.pass, true, solution.id + ": " + JSON.stringify(result));
  }
  console.log("OK: " + solutions.length + " soluções executáveis passam em todos os casos no Python real.");

  async function run(id, code) { return evaluate(`PythonRunner.run(EXERCISES.find(ex => ex.id === ${JSON.stringify(id)}), ${JSON.stringify(code)})`); }
  assert.equal((await run("soma", "def soma_lista(numeros):\n    return sum(numeros)")).pass, false);
  assert.equal((await run("dobro_funcao", "def dobro(numero):\n    print(numero * 2)")).pass, false);
  const missing = await run("dobro_funcao", "x = 1");
  assert.equal(missing.cases[0].error.kind, "NameError");
  const syntax = await run("dobro_funcao", "def dobro(numero)\n    return numero * 2");
  assert.equal(syntax.error.kind, "SyntaxError");
  assert.equal(syntax.error.line, 1);
  assert.equal((await run("maior", "def maior_lista(numeros):\n    maior = 0\n    for n in numeros:\n        if n > maior:\n            maior = n\n    return maior")).pass, false);
  assert.equal((await run("dobro", 'x = int(input("Digite: "))\nprint(x + x)')).pass, true);
  assert.equal((await run("busca", "def contem(numeros, alvo):\n    for n in numeros:\n        if n == alvo:\n            return 1\n    return 0")).pass, false);
  console.log("OK: restrições, print/return, nomes antigos, linha de sintaxe, negativos e tipos booleanos.");

  await select("soma");
  await input("def soma_lista(numeros):\n    total = 0\n    for n in numeros:\n        total += n\n    return total");
  assert.match(await checked(), /Passou/);
  await input("def soma_lista(numeros):\n    return 1");
  assert.equal(await evaluate("document.getElementById('exercise-state').textContent"), "Em andamento");
  await evaluate("document.getElementById('hint-details').open = true");
  await pause(200);
  await input("def soma_lista(numeros):\n    total = 0\n    for n in numeros:\n        total += n\n    return total");
  await checked();
  assert.equal(await evaluate("document.getElementById('exercise-state').textContent"), "Resolvido com apoio");
  console.log("OK: editar invalida aprovação antiga e dicas registram uso de apoio.");

  await select("soma_ate");
  await input("while True:\n    pass");
  const timedOut = await checked();
  assert.match(timedOut, /4 segundos/);
  await input("n = int(input())\ntotal = 0\ni = 1\nwhile i <= n:\n    total += i\n    i += 1\nprint(total)");
  assert.match(await checked(), /Passou/);
  await input("while True:\n    pass");
  await click("check-button");
  await pause(200);
  await click("stop-button");
  await waitFor(() => evaluate("!document.getElementById('check-button').disabled"), "parada manual");
  assert.match(await evaluate("document.getElementById('feedback').textContent"), /interrompida/);
  console.log("OK: laço infinito termina por limite ou botão; interpretador recupera.");

  await click("exam-mode");
  assert.equal(await evaluate("document.querySelectorAll('.exercise-link').length"), 6);
  assert.equal(await evaluate("document.getElementById('study-tools').hidden && document.getElementById('check-button').hidden && document.getElementById('reference-button').disabled"), true);
  assert.equal(await evaluate("document.getElementById('answer').value"), "");
  const exam = await evaluate("JSON.parse(localStorage.getItem('python-de-cabeca-v1')).exam");
  for (const id of exam.ids) {
    await select(id);
    const solution = await evaluate(`EXERCISES.find(ex => ex.id === ${JSON.stringify(id)}).solution`);
    await input(solution);
  }
  await click("practice-mode");
  await select("soma");
  assert.match(await evaluate("document.getElementById('answer').value"), /total/);
  await click("exam-mode");
  await click("finish-exam");
  await waitFor(() => evaluate("document.getElementById('exam-title').textContent === 'Simulado corrigido'"), "entrega do simulado", 80000);
  assert.match(await evaluate("document.getElementById('exam-summary').textContent"), /6\/6/);
  assert.equal(await evaluate("document.getElementById('answer').disabled"), true);
  assert.equal(await evaluate("document.getElementById('study-tools').hidden"), false);
  console.log("OK: simulado isola rascunhos, oculta ajuda, corrige seis questões e libera soluções.");

  await evaluate("window.dispatchEvent(new Event('beforeprint'))");
  assert.equal(await evaluate("document.querySelectorAll('.print-exercise').length"), 6);
  const pdf = await send("Page.printToPDF", { printBackground: false, preferCSSPageSize: true });
  fs.writeFileSync(path.join(artifacts, "simulado.pdf"), Buffer.from(pdf.data, "base64"));
  await click("practice-mode");
  await select("classifica");
  const desktop = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifacts, "desktop.png"), Buffer.from(desktop.data, "base64"));
  await click("learning-button");
  assert.equal(await evaluate("(() => { const dialog = document.getElementById('learning-dialog'); return dialog.open && dialog.scrollWidth <= dialog.clientWidth + 1; })()"), true);
  const learningShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifacts, "aprendizado.png"), Buffer.from(learningShot.data, "base64"));
  await click("close-learning");
  await click("curriculum-button");
  assert.equal(await evaluate("(() => { const dialog = document.getElementById('curriculum-dialog'); return dialog.open && document.querySelectorAll('.curriculum-card').length === 11 && dialog.scrollWidth <= dialog.clientWidth + 1; })()"), true);
  const curriculumShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifacts, "trilha.png"), Buffer.from(curriculumShot.data, "base64"));
  await click("close-curriculum");
  await click("mistakes-button");
  assert.equal(await evaluate("(() => { const dialog = document.getElementById('mistakes-dialog'); return dialog.open && dialog.scrollWidth <= dialog.clientWidth + 1; })()"), true);
  const mistakesShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifacts, "caderno-erros.png"), Buffer.from(mistakesShot.data, "base64"));
  await click("close-mistakes");
  await click("coach-mode");
  const coachShot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(artifacts, "treino-dia.png"), Buffer.from(coachShot.data, "base64"));
  await click("practice-mode");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), true);
  const mobile = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(artifacts, "celular.png"), Buffer.from(mobile.data, "base64"));

  await click("data-button");
  await evaluate(`(() => {
    window.__backupDownload = null;
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { window.__backupBlob = blob; return "blob:teste-backup"; };
    HTMLAnchorElement.prototype.click = function () { window.__backupDownload = this.download; };
    window.__restoreCreateObjectURL = () => { URL.createObjectURL = originalCreate; };
  })()`);
  await click("export-data");
  assert.equal(await evaluate("window.__backupDownload.startsWith('python-de-cabeca-backup-') && window.__backupBlob.type === 'application/json' && window.__backupBlob.size > 500"), true);
  await evaluate(`(() => {
    window.__restoreCreateObjectURL();
    const saved = JSON.parse(localStorage.getItem("python-de-cabeca-v1"));
    saved.activeId = "divisao";
    saved.learning.streak.days = 7;
    const file = new File([JSON.stringify({ app: "python-de-cabeca", version: 4, state: saved })], "backup.json", { type: "application/json" });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.getElementById("import-data"); input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await waitFor(() => evaluate("document.getElementById('exercise-title')?.textContent === 'Quociente e resto' && JSON.parse(localStorage.getItem('python-de-cabeca-v1')).learning.streak.days === 7"), "importação do backup");
  console.log("OK: backup JSON é exportado e restaurado com rascunhos e histórico.");

  offlineServer = http.createServer((request, response) => {
    const requested = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = requested === "/" ? "index.html" : requested.replace(/^\//, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404); response.end("not found"); return;
    }
    const type = file.endsWith(".html") ? "text/html; charset=utf-8" : file.endsWith(".js") ? "text/javascript; charset=utf-8" : file.endsWith(".css") ? "text/css; charset=utf-8" : file.endsWith(".webmanifest") ? "application/manifest+json" : file.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { offlineServer.once("error", reject); offlineServer.listen(0, "127.0.0.1", resolve); });
  const offlinePort = offlineServer.address().port;
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:" + offlinePort + "/index.html" });
  await waitFor(() => evaluate("document.querySelectorAll('.exercise-link').length === 136"), "página servida por HTTP");
  await waitFor(() => evaluate("navigator.serviceWorker.ready.then(() => true)"), "service worker pronto");
  await waitFor(() => evaluate("caches.has('python-de-cabeca-v5')"), "cache offline preenchido");
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await send("Page.reload", { ignoreCache: true });
  await waitFor(() => evaluate("document.querySelectorAll('.exercise-link').length === 136"), "recarga offline", 20000);
  assert.equal(await evaluate("document.title"), "Python, de cabeça — bancada de prática");
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  console.log("OK: manifesto, service worker e cache permitem reabrir toda a interface sem rede no GitHub Pages.");
  assert.deepEqual(errors, [], "Sem exceções JavaScript na página.");
  console.log("OK: impressão, trilha, capturas de tela, largura de celular e console sem exceções.");
  console.log("TODAS AS VERIFICAÇÕES PASSARAM. Artefatos: " + artifacts);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (connection?.readyState === WebSocket.OPEN) {
    try { await send("Browser.close"); } catch (_) { /* Pode fechar antes da resposta. */ }
    connection.close();
  }
  browser.kill();
  if (offlineServer) await new Promise(resolve => offlineServer.close(resolve));
  for (const request of pending.values()) clearTimeout(request.timeout);
});
