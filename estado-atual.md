# Estado atual da aplicação

Atualizado em 02/10/2026.

## Base existente

`Python, de cabeça` é uma aplicação estática de estudo de Python, com 136 atividades em 11 unidades. Abre pelo `index.html` ou pelo GitHub Pages e usa HTML, CSS e JavaScript sem build ou backend. Oferece prática livre, sessões adaptativas, diagnóstico, caderno de erros, desafios de seis questões e impressão para prática no papel.

O progresso usa a chave `python-de-cabeca-v1` do `localStorage`, com estado na versão 4. Há exportação e importação de backup JSON. O interpretador Pyodide roda em um worker, é carregado pela internet e tem limite de execução de quatro segundos. O service worker armazena a interface; isso não garante correção Python totalmente offline.

## Manutenção

`AGENTS.md` aponta para este registro e exige atualizar o estado atual em toda alteração de código, no mesmo commit. Os commits devem ser curtos, descritivos e separados por finalidade. O objetivo de manutenção é aprendizagem contínua, com preservação dos dados existentes e abertura sem build.

O registro acompanha a implementação por etapas. A integração da nova interface de estudo contínuo acontece em um commit próprio, depois dos módulos abaixo.

## Progresso e backup

`progresso.js` acrescenta regras independentes da interface para domínio, revisão e validação de backups. Conferir novamente uma rodada concluída não aumenta domínio nem adia sua revisão. Uma variação real tem crédito limitado; revisão após intervalo e resposta sem apoio fornecem evidência mais forte. Tentativas com apoio têm ganho limitado, e erros repetidos recebem uma penalidade por rodada.

`seedCompletedRound` permite migrar respostas já aprovadas preservando pontuação, contadores e datas anteriores. `validateBackup` confere versões 1 a 4, rascunhos, resultados, históricos, datas e sessões antes de permitir substituição de dados. Exercícios indisponíveis são ignorados com aviso; estruturas inválidas são rejeitadas. O formato do estado continua na versão 4, com metadados opcionais de rodada e crédito.

`verificacao/progresso.cjs` cobre essas regras e a migração. A aplicação passa a usar o módulo no commit de integração; sua adição isolada mantém o comportamento da interface existente.

## Validação

- `node verificacao/conteudo.cjs`: aprovado, com 136 atividades, 11 unidades e seis grupos distintos no desafio de integração.
- `node --check progresso.js` e `node verificacao/progresso.cjs`: aprovados; 22 verificações de domínio, migração e backup.
