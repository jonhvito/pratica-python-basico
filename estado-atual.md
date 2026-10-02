# Estado atual da aplicação

Atualizado em 02/10/2026.

## Base existente

`Python, de cabeça` é uma aplicação estática de estudo de Python, com 136 atividades em 11 unidades. Abre pelo `index.html` ou pelo GitHub Pages e usa HTML, CSS e JavaScript sem build ou backend. Oferece prática livre, sessões adaptativas, diagnóstico, caderno de erros, desafios de seis questões e impressão para prática no papel.

O progresso usa a chave `python-de-cabeca-v1` do `localStorage`, com estado na versão 4. Há exportação e importação de backup JSON. O interpretador Pyodide roda em um worker, é carregado pela internet e tem limite de execução de quatro segundos. O service worker armazena a interface; isso não garante correção Python totalmente offline.

## Manutenção

`AGENTS.md` aponta para este registro e exige atualizar o estado atual em toda alteração de código, no mesmo commit. Os commits devem ser curtos, descritivos e separados por finalidade. O objetivo de manutenção é aprendizagem contínua, com preservação dos dados existentes e abertura sem build.

Este primeiro registro documenta a base anterior à integração das melhorias. A interface existente ainda contém um roteiro de véspera; a revisão em andamento remove essa dependência de uma prova e amplia navegação, editor, feedback, domínio e validação de backups. Os próximos commits registrarão cada implementação e sua integração.

## Validação

O catálogo foi conferido com `node verificacao/conteudo.cjs`: 136 atividades, 11 unidades e seis grupos distintos no desafio de integração. Este commit adiciona apenas as diretrizes e o registro de estado; não altera o comportamento da aplicação.
