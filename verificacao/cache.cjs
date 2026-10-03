"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const handlers = {}, deleted = [], opened = [], requests = [];
let cached = null, failNetwork = false, claimed = false;
const source = fs.readFileSync(require("node:path").join(__dirname, "../service-worker.js"), "utf8");
const current = source.match(/const cacheName = "([^"]+)"/)[1];
const context = {
  URL, Response,
  self: { location: { origin: "https://estudo.example" }, addEventListener: (type, fn) => { handlers[type] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => { claimed = true; } } },
  caches: {
    keys: async () => [current, "python-de-cabeca-v5", "outro-aplicativo-v1"],
    delete: async name => { deleted.push(name); return true; },
    open: async name => { opened.push(name); return { addAll: async paths => { assert.ok(paths.includes("./index.html")); assert.ok(paths.includes("./treinador.js")); }, match: async () => cached }; }
  },
  fetch: async request => { requests.push(request.url); if (failNetwork) throw new Error("offline"); return new Response("rede"); }
};
vm.runInNewContext(source, context);
async function lifetime(type) { let operation; handlers[type]({ waitUntil: promise => { operation = promise; } }); await operation; }
async function request(url, method = "GET") { let response; handlers.fetch({ request: { url, method }, respondWith: promise => { response = promise; } }); return response ? await response : null; }
(async () => {
  await lifetime("install"); await lifetime("activate");
  assert.deepEqual(deleted, ["python-de-cabeca-v5"]); assert.ok(claimed);
  cached = new Response("versão instalada");
  assert.equal(await (await request("https://estudo.example/index.html")).text(), "versão instalada");
  assert.equal(requests.length, 0, "Não mistura arquivos novos na versão instalada");
  assert.ok(opened.every(name => name === current), "Consulta apenas o cache da versão atual");
  cached = null;
  assert.equal(await (await request("https://estudo.example/recurso")).text(), "rede");
  failNetwork = true;
  assert.equal((await request("https://estudo.example/ausente")).status, 503);
  assert.equal(await request("https://cdn.example/python.js"), null);
  assert.equal(await request("https://estudo.example/dados", "POST"), null);
  console.log("OK: instalação coerente, limpeza isolada, versão preservada e falha offline controlada.");
})().catch(error => { console.error(error); process.exitCode = 1; });
