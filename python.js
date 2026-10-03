/* O worker é criado a partir deste arquivo para funcionar também ao abrir index.html
   por duplo clique (file://), sem servidor. Pyodide é o interpretador, não um framework. */
(function () {
  "use strict";

  function pythonWorker() {
    const base = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
    const harness = `
import ast, builtins, contextlib, copy, io, json, math, traceback

def _normalize(text):
    return "\\n".join(line.rstrip() for line in text.replace("\\r\\n", "\\n").split("\\n")).rstrip("\\n")

def _equal(actual, expected):
    if isinstance(expected, bool):
        return type(actual) is bool and actual == expected
    if expected is None:
        return actual is None
    if isinstance(expected, (int, float)):
        return type(actual) in (int, float) and math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(expected, list):
        return isinstance(actual, list) and len(actual) == len(expected) and all(_equal(a, b) for a, b in zip(actual, expected))
    return type(actual) is type(expected) and actual == expected

def _error(exc):
    line = getattr(exc, "lineno", None)
    for frame in traceback.extract_tb(exc.__traceback__):
        if frame.filename == "<resposta>":
            line = frame.lineno
    return {"kind": type(exc).__name__, "message": str(exc)[:1200], "line": line}

def _display(value, representation=False):
    text = repr(value) if representation else str(value)
    return {"text": text[:8000], "truncated": len(text) > 8000, "length": len(text)}

def _values(actual, expected, representation=False):
    got = _display(actual, representation)
    wanted = _display(expected, representation)
    return {"got": got["text"], "expected": wanted["text"],
            "gotTruncated": got["truncated"], "expectedTruncated": wanted["truncated"],
            "gotLength": got["length"], "expectedLength": wanted["length"]}

class _Output(io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 8000:
            raise RuntimeError("Saída muito longa. Confira se o print está em um laço sem fim.")
        return super().write(value)

def _check(payload):
    exercise = payload["exercise"]
    code = payload["code"]
    try:
        tree = ast.parse(code, filename="<resposta>")
        compiled = compile(tree, "<resposta>", "exec")
    except BaseException as exc:
        return {"error": _error(exc), "cases": []}

    # Regras didáticas simples. Não são um mecanismo de fiscalização/segurança.
    rules = []
    calls = {node.func.id if isinstance(node.func, ast.Name) else node.func.attr
             for node in ast.walk(tree) if isinstance(node, ast.Call)
             and isinstance(node.func, (ast.Name, ast.Attribute))}
    for forbidden in exercise.get("forbidden", []):
        if forbidden in calls:
            rules.append("Neste exercício, resolva sem " + forbidden + "().")
    loop = exercise.get("requireLoop")
    if exercise.get("requireComprehension") and not any(isinstance(node, ast.ListComp) for node in ast.walk(tree)):
        rules.append("O enunciado pede uma compreensão de lista.")
    if loop and not any(isinstance(node, ast.For if loop == "for" else ast.While) for node in ast.walk(tree)):
        rules.append("O enunciado pede um laço " + loop + " explícito.")
    if exercise["id"] == "filtra_pares" and "append" not in calls:
        rules.append("Treine a construção da lista usando append().")

    results = []
    for case in exercise["cases"]:
        output = _Output()
        inputs = iter(case.get("inputs", []))
        def read_input(prompt=""):
            try:
                return next(inputs)
            except StopIteration:
                raise EOFError("Seu código pediu mais entradas do que o enunciado fornece.") from None
        environment = {"__name__": "__main__", "__builtins__": dict(vars(builtins), input=read_input)}
        try:
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                # Um ambiente novo por caso evita usar funções de tentativas anteriores.
                exec(compiled, environment)
                if exercise["kind"] == "function":
                    function = environment.get(exercise["fn"])
                    if not callable(function):
                        raise NameError("Defina a função " + exercise["fn"] + " com o nome pedido.")
                    args = copy.deepcopy(case["args"])
                    actual = function(*args)
                    passed = _equal(actual, case["expected"])
                    changed = bool(exercise.get("preserveArgs") and args != case["args"])
                    passed = passed and not changed
                    result = dict(_values(actual, case["expected"], True), **{"pass": passed, "changed": changed})
                else:
                    actual = _normalize(output.getvalue())
                    expected = _normalize(case["expected"])
                    if exercise.get("numericOutput"):
                        try:
                            passed = math.isclose(float(actual), float(expected), rel_tol=1e-9, abs_tol=1e-9)
                        except ValueError:
                            passed = False
                    else:
                        passed = actual == expected
                    result = dict(_values(actual, expected), **{"pass": passed})
                result["stdout"] = output.getvalue() if exercise["kind"] == "function" else ""
                results.append(result)
        except BaseException as exc:
            expected = _display(case["expected"], exercise["kind"] == "function")
            results.append({"pass": False, "error": _error(exc), "expected": expected["text"],
                            "expectedTruncated": expected["truncated"], "expectedLength": expected["length"]})
    return {"cases": results, "rules": rules, "pass": not rules and all(result["pass"] for result in results)}

def _experiment(payload):
    # Caso exploratório: executa a resposta e apresenta a observação, sem nota ou domínio.
    exercise = payload["exercise"]
    output = _Output()
    phase = "code"
    try:
        if exercise.get("kind") not in ("program", "function"):
            raise ValueError("Casos próprios estão disponíveis para programas e funções.")
        tree = ast.parse(payload["code"], filename="<resposta>")
        compiled = compile(tree, "<resposta>", "exec")
        options = payload.get("options", {})
        supplied = options.get("inputs", [])
        if isinstance(supplied, str):
            supplied = supplied.replace("\\r\\n", "\\n").split("\\n") if supplied else []
        if not isinstance(supplied, list) or any(not isinstance(value, str) for value in supplied):
            raise ValueError("Forneça as entradas como linhas de texto.")
        inputs = iter(supplied)
        def read_input(prompt=""):
            try:
                return next(inputs)
            except StopIteration:
                raise EOFError("Seu código pediu mais entradas do que as linhas fornecidas.") from None
        environment = {"__name__": "__main__", "__builtins__": dict(vars(builtins), input=read_input)}
        args = []
        if exercise["kind"] == "function":
            phase = "arguments"
            if "arguments" in options:
                arguments = options["arguments"]
                if not isinstance(arguments, str) or len(arguments) > 8000:
                    raise ValueError("Use até 8.000 caracteres nos argumentos.")
                # O parser aceita literais Python separados por vírgulas. Nenhuma chamada é avaliada.
                call = ast.parse("_argumentos(" + arguments + ")", mode="eval").body
                if not isinstance(call, ast.Call) or not isinstance(call.func, ast.Name) or call.func.id != "_argumentos" or call.keywords:
                    raise ValueError("Forneça apenas argumentos posicionais em valores literais Python.")
                args = [ast.literal_eval(value) for value in call.args]
            else:
                args = copy.deepcopy(options.get("args", []))
                if not isinstance(args, list):
                    raise ValueError("Forneça os argumentos em uma lista.")
        phase = "code"
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compiled, environment)
            if exercise["kind"] == "function":
                function = environment.get(exercise["fn"])
                if not callable(function):
                    raise NameError("Defina a função " + exercise["fn"] + " com o nome pedido.")
                actual = function(*args)
            else:
                actual = output.getvalue()
        display = _display(actual, exercise["kind"] == "function")
        return {"got": display["text"], "gotTruncated": display["truncated"], "gotLength": display["length"],
                "stdout": output.getvalue() if exercise["kind"] == "function" else ""}
    except BaseException as exc:
        error = _error(exc)
        error["context"] = phase
        if phase == "arguments":
            error["line"] = None
        return {"error": error, "got": output.getvalue() if exercise.get("kind") == "program" else "",
                "stdout": output.getvalue() if exercise.get("kind") == "function" else ""}
`;

    let python;
    const ready = (async function () {
      importScripts(base + "pyodide.js");
      python = await loadPyodide({ indexURL: base });
      python.runPython(harness);
      self.postMessage({ type: "ready" });
    })();
    ready.catch(error => self.postMessage({ type: "boot-error", message: String(error) }));
    self.onmessage = async function (event) {
      try {
        await ready;
        python.globals.set("_payload_json", JSON.stringify(event.data.payload));
        const method = event.data.mode === "experiment" ? "_experiment" : "_check";
        const result = JSON.parse(python.runPython("json.dumps(" + method + "(json.loads(_payload_json)), ensure_ascii=False)"));
        self.postMessage({ type: "result", id: event.data.id, result });
      } catch (error) {
        self.postMessage({ type: "error", id: event.data.id, message: String(error) });
      } finally {
        if (python) python.globals.delete("_payload_json");
      }
    };
  }

  let worker = null;
  let readyPromise = null;
  let bootReject = null;
  let timer = null;
  let pending = null;
  let sequence = 0;
  let onStatus = () => {};

  function reset(message) {
    clearTimeout(timer);
    if (worker) worker.terminate();
    worker = null;
    readyPromise = null;
    if (bootReject) bootReject(new Error(message));
    bootReject = null;
    if (pending) pending.reject(new Error(message));
    pending = null;
    onStatus(message);
  }

  function boot() {
    if (readyPromise) return readyPromise;
    onStatus("Carregando Python… a primeira vez pode levar alguns segundos.");
    readyPromise = new Promise((resolve, reject) => {
      bootReject = reject;
      const url = URL.createObjectURL(new Blob(["(" + pythonWorker.toString() + ")()"], { type: "text/javascript" }));
      try {
        worker = new Worker(url);
      } catch (error) {
        bootReject = null;
        reject(error);
        return;
      } finally {
        URL.revokeObjectURL(url);
      }
      timer = setTimeout(() => reset("O Python demorou para carregar. Confira sua conexão e tente verificar novamente."), 60000);
      worker.onerror = event => {
        event.preventDefault();
        reset("Não foi possível executar Python. Confira sua conexão e tente verificar novamente.");
      };
      worker.onmessage = ({ data }) => {
        if (data.type === "ready") {
          clearTimeout(timer);
          bootReject = null;
          onStatus("Python pronto. Ctrl+Enter também verifica a resposta.");
          resolve();
        } else if (data.type === "boot-error") {
          reset("Não foi possível carregar Python. Confira sua conexão e tente verificar novamente.");
        } else if (pending && data.id === pending.id) {
          clearTimeout(timer);
          const request = pending;
          pending = null;
          if (data.type === "result") request.resolve(data.result);
          else resetAfterError(request, data.message);
        }
      };
    });
    return readyPromise;
  }

  function resetAfterError(request, detail) {
    reset("O interpretador precisou reiniciar. Tente verificar novamente.");
    request.reject(new Error("Falha no interpretador: " + detail));
  }

  async function execute(mode, payload) {
      try { await boot(); } catch (error) { readyPromise = null; throw error; }
      if (!worker) throw new Error("Execução interrompida. Você pode tentar novamente.");
      if (pending) throw new Error("Aguarde a execução atual terminar antes de iniciar outra.");
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending = { id, resolve, reject };
        timer = setTimeout(() => reset("Execução interrompida após 4 segundos. Confira se o laço termina e tente de novo."), 4000);
        worker.postMessage({ id, mode, payload });
      });
  }

  window.PythonRunner = {
    setStatus(callback) { onStatus = callback; },
    run(exercise, code) { return execute("check", { exercise, code }); },
    experiment(exercise, code, options = {}) { return execute("experiment", { exercise, code, options }); },
    stop() { reset("Execução interrompida. Seu código continua salvo para você corrigir."); }
  };
})();
