# Estado atual da aplicação

Atualizado em 02/10/2026.

## Aplicação e objetivo

`Python, de cabeça` é uma aplicação estática de estudo de Python, com 136 atividades em 11 unidades. Abre pelo `index.html` ou pelo GitHub Pages e usa HTML, CSS e JavaScript sem build ou backend. Oferece prática livre, sessões adaptativas, diagnóstico, caderno de erros, desafios de seis questões e impressão para prática no papel.

O progresso usa a chave `python-de-cabeca-v1` do `localStorage`, com estado na versão 4. Há exportação e importação de backup JSON. O interpretador Pyodide roda em um worker, é carregado pela internet e tem limite de execução de quatro segundos. O service worker armazena a interface; isso não garante correção Python totalmente offline.

## Manutenção

`AGENTS.md` aponta para este registro e exige sua atualização em toda alteração de código, interface, configuração, testes ou diretrizes, inclusive correções pequenas e refatorações. Cada commit deve conter seu próprio registro, com data, mudanças, motivo, áreas afetadas, validação e pendências. A descrição do funcionamento atual deve continuar coerente com o código.

Os commits seguem Conventional Commits, com prefixo convencional, descrição em português e título descritivo de até 72 caracteres. O corpo é escrito em português, em tópicos sobre as mudanças e seus efeitos, seguido de `Validação:` com comandos e resultados reais. Mudanças independentes são separadas por finalidade; alterações incompatíveis incluem indicação e migração. O objetivo de manutenção é aprendizagem contínua, com preservação dos dados existentes e abertura sem build.

As alterações foram separadas em diretrizes de manutenção, regras de progresso e backup, editor e diagnóstico, e integração da experiência de aprendizagem. Cada etapa atualiza este registro.

## Experiência de aprendizagem

`index.html`, `styles.css`, `manifest.webmanifest` e `treinador.js` apresentam a aplicação como um espaço de estudo contínuo. O roteiro de véspera, a data fixa e o bloco de prioridades para amanhã foram removidos. A entrada oferece continuar o estudo, montar o treino do dia e iniciar o diagnóstico. Revisão de fundamentos e desafio de integração ficam em “Mais formas de praticar”; os 136 exercícios foram preservados.

A busca por título ou conceito aceita diferenças de acentuação e combina unidade com situação: todos, não tentados, erros para revisar e revisão pendente. Digitar na busca mantém o foco. Um resultado vazio permite limpar filtros sem quebrar o exercício aberto ou seus botões de navegação. A lista lateral tem limite de altura também entre 801 e 899 pixels de largura.

Alternativas preservam espaços, tabulações e quebras de linha. Trechos com várias linhas usam fonte monoespaçada para distinguir blocos com e sem indentação, também no celular.

O último modo de estudo e os identificadores das rodadas são persistidos. “Continuar de onde parei” retoma sessões e desafios abertos após recarregar. A troca de sessão pede confirmação quando substituir respostas em andamento. Durante a correção, alterações de exercício, formato e sessão ficam bloqueadas; a entrega guarda o contexto da tentativa para impedir atribuir um resultado à resposta errada.

O rodapé mantém três referências, que abrem em nova aba: [site do professor](https://prdm0.github.io/curso_python/#/title-slide), [repositório do professor no GitHub](https://github.com/prdm0/curso_python) e [Python Iluminado](https://pythoniluminado.netlify.app/). O repositório orienta parte do mapeamento de tópicos; Python Iluminado é material complementar. Os enunciados, dados e soluções da bancada são próprios. `README.md` e `LEIA-ME.md` descrevem essa experiência e as referências.

## Progresso e backup

`progresso.js` acrescenta regras independentes da interface para domínio, revisão e validação de backups. Conferir novamente uma rodada concluída não aumenta domínio nem adia sua revisão. Uma variação real tem crédito limitado; revisão após intervalo e resposta sem apoio fornecem evidência mais forte. Tentativas com apoio têm ganho limitado, e erros repetidos recebem uma penalidade por rodada.

`seedCompletedRound` permite migrar respostas já aprovadas preservando pontuação, contadores e datas anteriores. `validateBackup` confere versões 1 a 4, rascunhos, resultados, históricos, datas e sessões antes de permitir substituição de dados. Exercícios indisponíveis são ignorados com aviso; estruturas inválidas são rejeitadas. O formato do estado continua na versão 4, com metadados opcionais de rodada e crédito.

`treinador.js` usa o módulo na correção e na restauração de respostas antigas, comparando os casos reais da variação. O uso de apoio é registrado na tentativa entregue e não muda retroativamente ao abrir uma dica depois de um acerto. Na importação, um arquivo de até 5 MB é validado e mostra rascunhos, tentativas e erros pendentes antes de substituir o progresso. É possível exportar os dados atuais ou cancelar. Um arquivo inválido não altera o progresso salvo.

`verificacao/progresso.cjs` cobre essas regras, a migração e os formatos de backup.

## Editor e diagnóstico

`editor.js` mantém o campo de texto nativo e oferece números de linha, rolagem sincronizada, recuo ao pressionar Enter, remoção de recuo com Backspace e indicação acessível da linha com erro. A inserção nativa preserva desfazer/refazer quando disponível. A comparação de resultados mostra a primeira diferença, evidencia espaços e limites de linha e oferece um bloco recolhido com os dois resultados completos, limitado a 8.000 caracteres por saída.

`aprendizagem.js` vincula o diagnóstico ao primeiro caso que falhou, com entrada, esperado e obtido. Orientações inferidas para `range` e acumuladores aparecem como hipóteses. Um retorno `None` válido não é tratado como erro de `return`. `treinador.js` conecta o editor e a comparação à interface; `styles.css` oferece os destaques e a apresentação responsiva. A consulta rápida diferencia explicitamente `=`, `==` e `>=`.

`verificacao/editor.cjs` cobre recuo, comentários e strings, localização Unicode de diferenças e diagnósticos. O catálogo e suas soluções permanecem os mesmos.

## Cache e publicação

`service-worker.js` usa o cache `python-de-cabeca-v7`, incluindo `progresso.js` e `editor.js`. `.github/workflows/pages.yml` verifica os três conjuntos de testes sem navegador e publica também os novos módulos. As fontes de manutenção e os artefatos de teste não entram na lista de arquivos públicos. Os commits desta revisão são locais; a publicação ocorre quando forem enviados para `main` no GitHub.

## Validação

- `node verificacao/conteudo.cjs`: aprovado, com 136 atividades, 11 unidades e seis grupos distintos no desafio de integração.
- `node --check progresso.js` e `node verificacao/progresso.cjs`: aprovados; 22 verificações de domínio, migração e backup.
- `node --check editor.js`, `node --check aprendizagem.js` e `node verificacao/editor.cjs`: aprovados.
- Sintaxe de todos os arquivos JavaScript e `git diff --check`: aprovados.
- `node verificacao/verificar.cjs --layout-only`: aprovado, com busca mantendo foco, migração de resposta antiga, recuo/desfazer/refazer e layout em 1365, 850 e 390 pixels.
- `node verificacao/verificar.cjs`: aprovado na rodada final, incluindo as 56 soluções executáveis em Python real, proteção durante correção assíncrona, persistência, prévia e rejeição de backup inválido, desafios, interrupção de laço, impressão e recarga offline da interface. As capturas de computador e celular foram inspecionadas.

O verificador usa um perfil temporário do sistema para evitar a sincronização do Drive ao iniciar o navegador. O carregamento inicial do CDN pode ser repetido uma vez pelo teste se atingir o prazo da aplicação. Tentativas anteriores encontraram atraso do navegador ou do CDN; a rodada final completa passou. Capturas e PDF são gerados em `verificacao/artefatos`, ignorada pelo Git.

## Limites atuais

O progresso é local ao navegador, sem conta ou sincronização automática. A correção Python depende do carregamento do CDN; o cache da interface não garante o interpretador offline. O limite de execução continua em quatro segundos. Domínio e dicas são indicadores de estudo; os casos de teste e as verificações estruturais não provam correção para todas as entradas possíveis.

## Registro de alterações

### 02/10/2026 — Indentação nas alternativas

- **O que foi feito:** preservação dos espaços e quebras de linha nas alternativas, com fonte monoespaçada para código em várias linhas; cache da interface atualizado para v7.
- **Motivo:** as alternativas A e C de “Bloco bem indentado” pareciam iguais porque o HTML colapsava a indentação, impedindo responder pela compreensão.
- **Áreas afetadas:** `treinador.js`, `styles.css`, `service-worker.js` e `verificacao/verificar.cjs`; catálogo e formato do progresso preservados.
- **Validação:** `node --check treinador.js`, `node --check verificacao/verificar.cjs`, `node verificacao/conteudo.cjs`, `git diff --check` e `node verificacao/verificar.cjs --layout-only`: aprovados. O verificador confirmou alternativas com recuo em 1365 e 390 pixels e o layout em 1365, 850 e 390 pixels, abrindo por `file://`.
- **Limites:** o teste foi executado com permissão de execução fora do sandbox para iniciar Chrome/Edge com perfil temporário. Correção Python e cache não foram repetidos nesta etapa; serão conferidos na rodada completa das alterações seguintes.

### 02/10/2026 — Diretrizes de estado e commits

- **O que foi feito:** explicitação da atualização obrigatória de `estado-atual.md` no mesmo commit de cada mudança, inclusive etapas separadas.
- **Motivo:** manter a documentação coerente com o projeto e facilitar entender sua evolução e manutenção.
- **Áreas afetadas:** `AGENTS.md` e a seção de manutenção deste registro; nenhuma alteração no comportamento da aplicação.
- **Commits:** adoção explícita de Conventional Commits, títulos curtos e descritivos em português, corpo em tópicos e bloco de validação com resultados reais. O guia inclui um exemplo de mensagem e orientação para mudanças incompatíveis.
- **Validação:** `git diff --check` aprovado; leitura dos dois documentos para conferir coerência. Testes da aplicação não foram repetidos porque a mudança é exclusivamente documental; os resultados da implementação anterior estão na seção de validação.
- **Pendências:** nenhuma para esta revisão documental.
