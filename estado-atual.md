# Estado atual da aplicação

Atualizado em 04/11/2026.

## Aplicação e objetivo

`Python, de cabeça` é uma aplicação estática de estudo de Python, com 136 atividades em 11 unidades. Abre pelo `index.html` ou pelo GitHub Pages e usa HTML, CSS e JavaScript sem build ou backend. Oferece prática livre, sessões adaptativas, diagnóstico, caderno de erros, desafios de seis questões e impressão para prática no papel.

Em “Mais formas de praticar”, a seção independente “Lista da segunda avaliação” acrescenta os 20 exercícios e 67 subitens rotulados da lista fornecida pelo usuário, com revisão em 11 tópicos e correção por casos para 42 itens práticos. O exercício 1 não tem subitem rotulado; contando-o, são 68 tarefas principais. O catálogo anterior e seus identificadores não foram substituídos.

O progresso usa a chave `python-de-cabeca-v1` do `localStorage`, com estado na versão 4. Há exportação e importação de backup JSON. O interpretador Pyodide roda em um worker, é carregado pela internet e tem limite de execução de quatro segundos. O service worker armazena a interface; isso não garante correção Python totalmente offline.

## Manutenção

`AGENTS.md` aponta para este registro e exige sua atualização em toda alteração de código, interface, configuração, testes ou diretrizes, inclusive correções pequenas e refatorações. Cada commit deve conter seu próprio registro, com data, mudanças, motivo, áreas afetadas, validação e pendências. A descrição do funcionamento atual deve continuar coerente com o código.

Os commits seguem Conventional Commits, com prefixo convencional, descrição em português e título descritivo de até 72 caracteres. O corpo é escrito em português, em tópicos sobre as mudanças e seus efeitos, seguido de `Validação:` com comandos e resultados reais. Mudanças independentes são separadas por finalidade; alterações incompatíveis incluem indicação e migração. O objetivo de manutenção é aprendizagem contínua, com preservação dos dados existentes e abertura sem build.

As alterações foram separadas em diretrizes de manutenção, regras de progresso e backup, editor e diagnóstico, e integração da experiência de aprendizagem. Cada etapa atualiza este registro.

`README.md` apresenta o objetivo, início e retomada do estudo, recursos pedagógicos, dados locais, limites offline, referências e comandos opcionais de manutenção. O About de `jonhvito/pratica-python-basico` no GitHub descreve a aprendizagem com compreensão e autonomia, 136 atividades, treino adaptativo, revisões e correção no navegador, sem cadastro. Seu campo de site aponta para `https://jonhvito.github.io/pratica-python-basico/`.

## Experiência de aprendizagem

O cabeçalho oferece acesso ao [repositório do projeto](https://github.com/jonhvito/pratica-python-basico), no canto superior direito, com ícone do GitHub e texto visível. Abre em nova aba com indicação acessível e área de toque de 44 pixels. No celular, o link fica na primeira linha junto à identidade, e as ações de estudo ocupam as linhas seguintes. O ícone SVG está embutido no HTML, com atribuição e licença dos Octicons, sem carregar recurso externo.

`index.html`, `styles.css`, `manifest.webmanifest` e `treinador.js` apresentam a aplicação como um espaço de estudo contínuo. O roteiro de véspera, a data fixa e o bloco de prioridades para amanhã foram removidos. A entrada oferece continuar o estudo, montar o treino do dia e iniciar o diagnóstico. Revisão de fundamentos e desafio de integração ficam em “Mais formas de praticar”; os 136 exercícios foram preservados.

A busca por título ou conceito aceita diferenças de acentuação e combina unidade com situação: todos, não tentados, erros para revisar e revisão pendente. Digitar na busca mantém o foco. Um resultado vazio permite limpar filtros sem quebrar o exercício aberto ou seus botões de navegação. A lista lateral tem limite de altura também entre 801 e 899 pixels de largura.

Alternativas preservam espaços, tabulações e quebras de linha. Trechos com várias linhas usam fonte monoespaçada para distinguir blocos com e sem indentação, também no celular.

No celular, catálogo e filtros começam recolhidos; selecionar uma atividade leva ao enunciado. A seleção de alternativas e movimentação de etapas preservam o foco. Há salto direto ao exercício, rótulos em português na tabela de mesa, alvos de toque maiores e fonte de 16 pixels no editor estreito. A interface informa os limites da correção quando está sem internet.

O último modo de estudo e os identificadores das rodadas são persistidos. “Continuar de onde parei” retoma sessões e desafios abertos após recarregar. A troca de sessão pede confirmação quando substituir respostas em andamento. Durante a correção, alterações de exercício, formato e sessão ficam bloqueadas; a entrega guarda o contexto da tentativa para impedir atribuir um resultado à resposta errada.

O rodapé mantém três referências, que abrem em nova aba: [site do professor](https://prdm0.github.io/curso_python/#/title-slide), [repositório do professor no GitHub](https://github.com/prdm0/curso_python) e [Python Iluminado](https://pythoniluminado.netlify.app/). O repositório orienta parte do mapeamento de tópicos; Python Iluminado é material complementar. Os enunciados, dados e soluções da bancada são próprios. `README.md` e `LEIA-ME.md` descrevem essa experiência e as referências.

## Progresso e backup

`planejamento.js` concentra sequência, pré-requisitos, seleção de sessões e triagem. O diagnóstico reúne seis tarefas de escrita, quatro de leitura e uma de ordenação. Guarda a primeira resposta, permite “Não sei ainda” e termina com onze respostas registradas, sem exigir onze acertos. Seu resultado orienta um ponto de partida provisório; não declara unidades consolidadas. Diagnósticos antigos sem essa evidência pedem nova triagem.

O painel distingue cobertura do catálogo e indicador de autonomia entre atividades praticadas. A consolidação exige também acertos sem apoio. Sessões reservam espaço para revisão, recuperação e conteúdo novo elegível; erros duplicados de uma atividade não multiplicam sua prioridade. Alternativas, ordenação e leitura usam formato próprio sem contabilizar apoio invisível. A prática livre continua disponível em todas as unidades.

`progresso.js` acrescenta regras independentes da interface para domínio, revisão e validação de backups. Conferir novamente uma rodada concluída não aumenta domínio nem adia sua revisão. Uma variação real tem crédito limitado; revisão após intervalo e resposta sem apoio fornecem evidência mais forte. Tentativas com apoio têm ganho limitado, e erros repetidos recebem uma penalidade por rodada.

`seedCompletedRound` permite migrar respostas já aprovadas preservando pontuação, contadores e datas anteriores. `validateBackup` confere versões 1 a 4, rascunhos, resultados, históricos, datas e sessões antes de permitir substituição de dados. Exercícios indisponíveis são ignorados com aviso; estruturas inválidas são rejeitadas. O formato do estado continua na versão 4, com metadados opcionais de rodada e crédito.

`treinador.js` usa o módulo na correção e na restauração de respostas antigas, comparando os casos reais da variação. O uso de apoio é registrado na tentativa entregue e não muda retroativamente ao abrir uma dica depois de um acerto. Na importação, um arquivo de até 5 MB é validado e mostra rascunhos, tentativas e erros pendentes antes de substituir o progresso. É possível exportar os dados atuais ou cancelar. Um arquivo inválido não altera o progresso salvo.

`verificacao/progresso.cjs` cobre essas regras, a migração e os formatos de backup.

`armazenamento.js` protege a leitura e a escrita. Dados inválidos, versões futuras, falhas de acesso e alterações feitas em outra aba não são substituídos automaticamente. Um aviso persistente permite exportar o original sem transformações, recuperar a última cópia válida ou recarregar após um conflito. As chaves auxiliares `python-de-cabeca-v1:ultimo-valido` e `python-de-cabeca-v1:recuperacao` guardam a cópia válida e originais protegidos. Campos e atividades desconhecidos são preservados em gravações e exportações; atividades indisponíveis não aparecem no caderno. Limpar o progresso remove a cópia válida, mas conserva arquivos de recuperação anteriores.

A digitação agrupa gravações em 350 ms e grava imediatamente ao sair do campo, navegar ou receber `pagehide`. A cópia válida pode ficar desatualizada se sua gravação falhar após salvar o progresso principal; a interface informa essa condição. O armazenamento local não oferece uma transação entre abas, embora alterações detectáveis sejam bloqueadas antes de escrever.

## Editor e diagnóstico

`estudo.js` oferece três níveis de dica, perguntas de explicação e transferência, anotações pessoais, critérios de revisão, leitura por unidade, casos próprios e exportação `.py`. Dois projetos — frequências e vendas por filial — aproveitam atividades existentes com plano, previsão de casos, implementação e explicação. Notas, previsões e entradas próprias acompanham o backup e permanecem ao refazer o código. A experimentação aceita argumentos literais Python ou entradas por linha e não atribui domínio.

O caderno guarda a variação e a correção original, mostra entrada/esperado/obtido e permite registrar hipótese e caso de recuperação. Investigar restaura a tentativa original; refazer sem consulta abre uma rodada nos mesmos casos. A recuperação independente encerra somente erros da variação testada, mesmo quando o limite diário impede ganhar domínio. Conferir novamente uma rodada já encerrada não resolve novos erros.

`editor.js` mantém o campo de texto nativo e oferece números de linha, rolagem sincronizada, recuo ao pressionar Enter, remoção de recuo com Backspace e indicação acessível da linha com erro. A inserção nativa preserva desfazer/refazer quando disponível. A comparação de resultados mostra a primeira diferença, evidencia espaços e limites de linha e oferece um bloco recolhido com os dois resultados completos, limitado a 8.000 caracteres por saída.

`aprendizagem.js` vincula o diagnóstico ao primeiro caso que falhou, com entrada, esperado e obtido. Orientações inferidas para `range` e acumuladores aparecem como hipóteses. Um retorno `None` válido não é tratado como erro de `return`. `treinador.js` conecta o editor e a comparação à interface; `styles.css` oferece os destaques e a apresentação responsiva. A consulta rápida diferencia explicitamente `=`, `==` e `>=`.

`verificacao/editor.cjs` cobre recuo, comentários e strings, localização Unicode de diferenças e diagnósticos. O catálogo e suas soluções permanecem os mesmos.

## Cache e publicação

`service-worker.js` usa o cache `python-de-cabeca-v16`, incluindo os módulos de progresso, editor, armazenamento, planejamento, estudo e os três módulos da lista. `.github/workflows/pages.yml` verifica sintaxe, módulos puros, catálogo da lista, Python local e interface antes de publicar. As fontes de manutenção, as soluções de referência em `verificacao/lista-referencias.py` e os artefatos de teste não entram na lista de arquivos públicos. O envio para `main` aciona a publicação; a validação local não certifica uma execução futura do workflow nem a disponibilidade da nova revisão no Pages.

O cache remove somente versões antigas de `python-de-cabeca-v`; caches de outras aplicações da mesma origem são preservados. Os arquivos da versão instalada não são atualizados individualmente em segundo plano. Recursos ausentes sem rede recebem resposta controlada 503.

## Validação

Rodada de 04/11/2026: sintaxe JavaScript, catálogo anterior, progresso/backup (36 verificações), editor, armazenamento (31), planejamento (19), cache, catálogo da lista e Python local aprovados. A suíte Python inclui as 56 soluções anteriores, 90 variações, 47 leituras, 28 regressões e as 42 soluções de referência da lista, com casos que rejeitam respostas incorretas e indícios de descumprimento das restrições. `node verificacao/verificar.cjs` passou com Pyodide, execução da dependência `sinal → sinal_vec`, correção de argumentos nomeados e funções impressoras, backups, importação da lista sem `active`, conflito visível no modal e três larguras. As capturas de resultados em computador e celular foram inspecionadas. Uma execução anterior do navegador excedeu o tempo na recarga, sem causa determinada; execuções completas posteriores passaram. Após o ajuste final de `preserveArgs` para argumentos nomeados, sintaxe, Python local e catálogo foram repetidos; o navegador não foi repetido para esse ajuste isolado, coberto por duas regressões locais. `git diff --check` aprovado. Estes resultados não substituem uma execução de CI Linux após o push.

Rodada integrada de 03/10/2026: sintaxe de todos os arquivos `.js` e `.cjs`, catálogo, editor, cache, 36 verificações de progresso/backup, 31 de armazenamento e 19 de planejamento aprovados. O pipeline `node verificacao/python.cjs --emit-python | python -` aprovou 56 soluções, 90 variações, 47 leituras e 22 regressões. `node verificacao/verificar.cjs` passou com Pyodide, diagnóstico pela primeira resposta, dicas graduais, casos próprios sem crédito, notas preservadas ao refazer, exportação de backup e `.py`, interrupção de laço, impressão, três larguras, recarga offline e console sem exceções. Capturas do painel e projeto no celular foram inspecionadas.

- `node verificacao/conteudo.cjs`: aprovado, com 136 atividades, 11 unidades e seis grupos distintos no desafio de integração.
- `node --check progresso.js` e `node verificacao/progresso.cjs`: aprovados; 22 verificações de domínio, migração e backup.
- `node --check editor.js`, `node --check aprendizagem.js` e `node verificacao/editor.cjs`: aprovados.
- Sintaxe de todos os arquivos JavaScript e `git diff --check`: aprovados.
- `node verificacao/verificar.cjs --layout-only`: aprovado, com busca mantendo foco, migração de resposta antiga, recuo/desfazer/refazer e layout em 1365, 850 e 390 pixels.
- `node verificacao/verificar.cjs`: aprovado na rodada final, incluindo as 56 soluções executáveis em Python real, proteção durante correção assíncrona, persistência, prévia e rejeição de backup inválido, desafios, interrupção de laço, impressão e recarga offline da interface. As capturas de computador e celular foram inspecionadas.

O verificador usa um perfil temporário do sistema para evitar a sincronização do Drive ao iniciar o navegador. O carregamento inicial do CDN pode ser repetido uma vez pelo teste se atingir o prazo da aplicação. Tentativas anteriores encontraram atraso do navegador ou do CDN; a rodada final completa passou. Capturas e PDF são gerados em `verificacao/artefatos`, ignorada pelo Git.

## Limites atuais

O progresso é local ao navegador, sem conta ou sincronização automática. A correção Python depende do carregamento do CDN; o cache da interface não garante o interpretador offline. O limite de execução continua em quatro segundos. Domínio e dicas são indicadores de estudo; os casos de teste e as verificações estruturais não provam correção para todas as entradas possíveis.

## Lista da segunda avaliação

`lista-avaliacao.js` reúne enunciados adaptados, dicas, critérios pessoais e páginas da fonte local `../lista_python.pdf` (22 páginas, exercícios a partir da página 11), sem publicar o PDF ou dados de contato. `lista-testes.js` define casos para 42 itens práticos. `lista-interface.js` oferece seleção de exercício/subitem, editor, execução livre e verificação por casos em um diálogo próprio. Os exercícios 1, 2, 6, 7 e 8 destacam a orientação do professor para refazer sem consultar anotações; revisão, dicas e critérios permanecem recolhidos até ação do estudante.

A correção compara retorno e saída impressa, aceita tuplas e argumentos nomeados e usa tolerância numérica recursiva. Em 16b, compara as colunas e seus valores, sem exigir espaçamento idêntico. Os indícios AST aparecem separados dos casos e não verificam integralmente o método: conversões por alternativas a `str`, por exemplo, podem escapar. Explicações, previsões e subitens sem casos exigem autoconferência. Não há nota automática de prosa nem ganho de domínio na trilha anterior. Casos fora do domínio definido pela lista não ganham requisitos presumidos; a política de empate da moda deve ser explicada pelo estudante.

Há um rascunho de código e notas por exercício; o seletor indica qual subitem será conferido sobre esse código. Para os exercícios 2, 10 e 11, o estudante pode incluir explicitamente o código salvo do exercício 1 ou 8. Esse código é executado integralmente, inclusive chamadas de demonstração; a correção compara somente a saída da chamada avaliada. Durante execução ou correção, editor e controles de contexto ficam bloqueados; há interrupção explícita e o mesmo limite de quatro segundos.

O campo opcional `listaAvaliacao` integra o estado e os backups versão 4, sem trocar a chave principal ou apagar dados anteriores. Código e notas têm limite de 100.000 caracteres por campo. A ausência de `active` é compatível e a interface usa o primeiro exercício. Campos desconhecidos de versões suportadas são preservados na gravação, exportação e importação; versões futuras continuam protegidas/rejeitadas. O aviso de persistência também aparece no diálogo da lista. O ambiente `.venv` da pasta superior aponta para outra máquina e não foi alterado; a validação usou o Python disponível neste computador, sem novas dependências obrigatórias.

## Registro de alterações

### 04/11/2026 — Lista da segunda avaliação com correção por subitem

- **O que foi feito:** seção própria com 20 exercícios, 67 subitens rotulados, revisão, dicas sob demanda, 42 itens com casos Python e autoconferência dos demais; rascunhos/notas no backup e destaque à primeira tentativa sem consulta em 1, 2, 6, 7 e 8. Catálogo antigo preservado.
- **Motivo:** incorporar a lista disponibilizada pelo professor sem tratar exercícios antigos semelhantes como equivalentes nem substituir a proposta de aprendizagem contínua por uma página dependente de prova ou data.
- **Áreas afetadas:** três módulos `lista-*.js`, interface, executor Python, validação/importação do progresso, documentação, cache v16, workflow de publicação e testes. Novos recursos do executor cobrem argumentos nomeados, tuplas, dicionários com tolerância, exceções esperadas, saída impressa e indícios estruturais locais.
- **Validação:** `node --check` em JavaScript/CJS; `node verificacao/conteudo.cjs`, `progresso.cjs`, `editor.cjs`, `armazenamento.cjs`, `planejamento.cjs`, `cache.cjs`, `lista.cjs` e `python.cjs`; `node verificacao/verificar.cjs` com Pyodide; capturas de resultados em computador/celular inspecionadas; `git diff --check`. Catálogo novo e Python local foram repetidos pelo coordenador ao conferir a integração. Fonte PDF e critérios numéricos também passaram por conferência independente.
- **Limites:** checagens finitas e AST parciais, sem certificação de método ou proficiência; parte da lista requer execução exploratória/autoconferência. Há um único código por exercício, não versões independentes por subitem. Uma execução de navegador excedeu o tempo de recarga; as posteriores passaram, sem diagnóstico da causa inicial. Publicação será disparada pelo push autorizado, não por esta validação local.

### 03/10/2026 — Apresentação no README e no About

- **O que foi feito:** README organizado com início e retomada, recursos atuais, limites do progresso local e do Python offline, comandos de verificação e etapas reais da publicação. About atualizado no GitHub com a descrição “Aplicação para aprender Python com compreensão e autonomia: 136 atividades, treino adaptativo, revisões e correção no navegador. Sem cadastro.” e endereço do site.
- **Motivo:** o About ainda apresentava revisão para prova e simulados, sem link para a aplicação; o README resumia a publicação apenas como verificação de JavaScript e catálogo, omitindo as verificações adicionais atuais.
- **Áreas afetadas:** `README.md`, este registro e os campos descrição/site do repositório no GitHub. As três referências pedagógicas foram preservadas. Nenhum arquivo de execução, formato de dados ou configuração de publicação foi alterado.
- **Validação:** conferência com `index.html`, `treinador.js`, `estudo.js`, verificadores e `.github/workflows/pages.yml`; referências locais do README verificadas com PowerShell; `git diff --check` aprovado. `gh repo edit jonhvito/pratica-python-basico --description ... --homepage ...` concluído e `gh repo view jonhvito/pratica-python-basico --json description,homepageUrl` confirmou os dois campos no GitHub.
- **Limites:** testes da aplicação não foram repetidos porque a alteração é exclusivamente documental e de apresentação do repositório. A consulta inicial do GitHub foi bloqueada pela rede do sandbox e concluída ao repetir com acesso à rede. O About já está publicado; o README local será atualizado no GitHub quando o commit for enviado.

### 03/10/2026 — Repositório do projeto no cabeçalho

- **O que foi feito:** link com ícone SVG do GitHub e texto no topo direito, nova aba indicada, foco visível e alvo de toque de 44 pixels; posição adaptada ao celular e cache v14.
- **Motivo:** facilitar encontrar o código e acompanhar o projeto, mantendo as três referências pedagógicas no rodapé. O endereço foi conferido em `git remote -v`.
- **Áreas afetadas:** `index.html`, `styles.css`, `service-worker.js` e captura do verificador de interface. Ícone embutido com licença MIT dos Octicons; nenhum arquivo ou dependência de execução adicionado.
- **Validação:** `node --check service-worker.js`, `node --check verificacao/verificar.cjs`, `node verificacao/conteudo.cjs`, `node verificacao/cache.cjs`, `git diff --check` e `node verificacao/verificar.cjs --layout-only`: aprovados. Cabeçalho conferido no navegador em 1365, 850 e 390 pixels, sem transbordamento; capturas de computador e celular inspecionadas.
- **Limites:** alteração de apresentação e link; a suíte Python completa não foi repetida porque execução, correção e dados não mudaram. O ícone aparece offline; acessar o repositório exige internet.

### 03/10/2026 — Compreensão, experimentação e recuperação do erro

- **O que foi feito:** integração de dicas graduais, explicação/transferência, critérios pessoais, casos próprios com previsão, projetos, leitura por unidade e exportação `.py`; caderno com variação, correção original e reflexão; cache v13. Refazer preserva notas e dados experimentais. Importar ou limpar cancela gravação pendente antes da substituição.
- **Motivo:** tornar o acerto uma oportunidade de compreender, inventar casos e recuperar o raciocínio; evitar apagar notas ou ressuscitar dados anteriores após importar. A recuperação do erro é separada do ganho diário de domínio e exige a mesma variação em uma nova rodada sem apoio.
- **Áreas afetadas:** `estudo.js`, aprendizagem, treinador, interface, estilos, publicação, verificações e guias. Catálogo continua com 136 atividades; dados continuam na versão 4 com campos opcionais já validados.
- **Validação:** sintaxe de todos os JavaScript, `node verificacao/conteudo.cjs`, `node verificacao/editor.cjs`, `node verificacao/progresso.cjs` (36), `node verificacao/armazenamento.cjs` (31), `node verificacao/planejamento.cjs` (19), cache e pipeline Python local aprovados. A suíte completa de navegador passou, inclusive backup das notas/entradas, arquivo `.py` exato, projetos sem transbordar no celular e recarga offline. `git diff --check` aprovado; capturas inspecionadas.
- **Falhas corrigidas durante validação:** uma expectativa antiga de quatro cartões não correspondia às seis medidas novas; teste atualizado. O caso de exportar código e importar logo depois revelou gravação antiga pendente sobrescrevendo a importação; timer cancelado e regressão aprovada. Revisão independente confirmou a preservação das notas ao refazer.
- **Limites:** explicações e projetos usam critérios pessoais, sem nota automática ou medição de retenção com estudantes. Experimentos respeitam o limite de execução e não aplicam as restrições didáticas da correção. CI Linux e leitores de tela/aparelhos físicos não foram executados localmente. O interpretador continua dependendo do carregamento inicial pela internet.

### 03/10/2026 — Diagnóstico, sequência e recomendações por evidência

- **O que foi feito:** planejador independente com sequência explícita e pré-requisitos, seleção equilibrada de sessões, formatos próprios para questões sem escrita, painel com cobertura e autonomia separadas e diagnóstico pela primeira resposta. Cache v12 e publicação incluem o módulo. Backup versão 4 aceita novos campos opcionais de evidência, reflexão e contexto do erro.
- **Motivo:** reconhecimento de alternativas não comprova escrita; erros duplicados e apoio oculto distorciam recomendações. Repetir após corrigir não deve apagar a primeira evidência da triagem.
- **Áreas afetadas:** `planejamento.js`, progresso e backups, interface, cache, publicação e regressões. Nenhuma atividade removida, nenhum bloqueio à prática livre.
- **Validação:** sintaxe, `node verificacao/planejamento.cjs` (19 verificações), `node verificacao/progresso.cjs` (36), catálogo e diff passaram. `node verificacao/verificar.cjs --layout-only` passou com recuperação, busca, retomada e três larguras, sem exceções JavaScript.
- **Limites:** os indicadores são regras transparentes de estudo, sem calibração estatística ou teste longitudinal com estudantes. Escrita no diagnóstico depende de carregar Python; pode ser pulada. Novos casos completos de triagem serão conferidos na rodada final de navegador.

### 03/10/2026 — Verificações automáticas na publicação

- **O que foi feito:** workflow com Ubuntu 24.04, Node 22 e Python 3.12, sintaxe, módulos de regressão, soluções Python locais e interface em três larguras antes de publicar; capturas guardadas mesmo em falha. Verificador descobre navegador Linux ou caminho configurado e trata encerramento precoce.
- **Motivo:** impedir publicar regressões cobertas pelos testes sem exigir instalação de dependências na aplicação ou depender do CDN para validar soluções na CI.
- **Áreas afetadas:** `.github/workflows/pages.yml` e `verificacao/verificar.cjs`; funcionamento e formato de progresso preservados.
- **Validação:** sintaxe do verificador, YAML conferido com PyYAML e `git diff --check` passaram. Executável inexistente retornou código 1 com mensagem controlada de inicialização. A suíte Python local já passou nesta revisão; Chrome real será repetido na rodada integrada.
- **Limites:** workflow não executado no GitHub nesta máquina; Linux será validado quando houver envio para o repositório. A execução completa local continua cobrindo Pyodide e recarga offline, enquanto a CI usa o teste de interface e Python local.

### 03/10/2026 — Representações coerentes e correção semântica

- **O que foi feito:** representação consistente dos resultados Python até 8.000 caracteres, aviso explícito de truncamento e comparação sem destaque de erro quando o caso foi aprovado semanticamente; cache v11. Módulos de apoio oferecem dicas graduais, explicação, transferência e dois projetos sobre atividades existentes. O executor recebe uma API isolada para experimentar entradas próprias; esses recursos terão controles na interface na próxima etapa.
- **Motivo:** listas aprovadas podiam parecer diferentes porque `reprlib` abreviava somente o resultado obtido; números tolerados e dicionários equivalentes não devem sugerir erro de formatação.
- **Áreas afetadas:** `python.js`, `editor.js`, integração de comparação e testes do executor/editor. Soluções e contratos do catálogo preservados.
- **Validação:** `node verificacao/python.cjs --emit-python | python -` aprovou 56 soluções, 90 variações, 47 leituras e 22 regressões; testes do editor, sintaxe, catálogo e diff aprovados. O comando direto com subprocesso encontrou `EPERM` no sandbox; o pipeline usa o Python local. Pyodide e interface serão conferidos na rodada integrada.
- **Limites:** 8.000 caracteres continuam sendo o limite de apresentação, indicado quando atingido; a aprovação depende dos casos e regras do exercício. A API experimental não atribui domínio.

### 03/10/2026 — Proteção, recuperação e gravação do progresso

- **O que foi feito:** módulo de armazenamento com cópia válida, exportação do original, arquivo de recuperação, proteção de versões futuras e conflitos entre abas; preservação de campos desconhecidos; gravações agrupadas durante digitação e cache v10.
- **Motivo:** impedir que uma falha de leitura apague silenciosamente o progresso e evitar trabalho pesado a cada tecla. A revisão identificou e corrigiu cópias repetidas de dados desconhecidos e buscas quadráticas em históricos.
- **Áreas afetadas:** `armazenamento.js`, interface de dados, `treinador.js`, estilos, cache, publicação e verificações de armazenamento e navegador. O formato principal permanece na versão 4; as duas chaves auxiliares são locais.
- **Validação:** `node --check treinador.js`, `node --check armazenamento.js`, `node verificacao/armazenamento.cjs` (31 verificações), `node verificacao/conteudo.cjs`, `git diff --check` e `node verificacao/verificar.cjs --layout-only`: aprovados. No navegador, JSON truncado permaneceu intacto e a restauração preservou o original; gravação agrupada e layouts 1365, 850 e 390 pixels passaram.
- **Limites:** Web Storage não oferece transações entre abas; mudanças simultâneas na janela mínima entre comparação e escrita ainda podem concorrer. Quota pode impedir atualizar a cópia válida após salvar o principal, com aviso. Medições de histórico sintético não representam desempenho em aparelho físico. Limpar progresso conserva arquivos de recuperação anteriores.

### 02/10/2026 — Navegação no celular e foco acessível

- **O que foi feito:** catálogo recolhido no celular, foco no enunciado ao navegar, preservação de foco nas alternativas e etapas, atalho ao exercício, rótulos traduzidos e controles de toque maiores; indicação de modo offline e cache v9.
- **Motivo:** reduzir a distância até a atividade e permitir estudo com teclado, toque e tecnologias assistivas sem perder a posição.
- **Áreas afetadas:** `index.html`, `styles.css`, `treinador.js`, cache e verificador de interface; dados existentes preservados.
- **Validação:** sintaxe de `treinador.js` e `verificacao/verificar.cjs`, `node verificacao/conteudo.cjs`, `node verificacao/editor.cjs`, `node verificacao/cache.cjs`, `git diff --check` e `node verificacao/verificar.cjs --layout-only`: aprovados. Capturas de computador e celular inspecionadas; seleção mantém o foco e catálogo móvel fecha ao navegar.
- **Limites:** teclado virtual e leitor de tela em aparelhos físicos não foram testados; nenhuma declaração de conformidade integral de acessibilidade. A correção Python offline depende de já ter carregado o interpretador na aba.

### 02/10/2026 — Cache isolado e atualização coerente

- **O que foi feito:** limpeza apenas dos caches desta aplicação, leitura exclusiva da versão atual e manutenção do conjunto instalado até a próxima versão; cache v8.
- **Motivo:** evitar apagar caches de outros aplicativos e combinar arquivos de versões diferentes numa atualização.
- **Áreas afetadas:** `service-worker.js`, `verificacao/cache.cjs`, verificador de navegador e workflow de publicação.
- **Validação:** `node --check service-worker.js`, `node --check verificacao/verificar.cjs`, `node verificacao/cache.cjs`, `node verificacao/conteudo.cjs` e `git diff --check`: aprovados. A simulação verificou preservação de cache alheio, instalação, ausência de atualização parcial e resposta offline 503.
- **Limites:** a correção Python ainda depende do CDN; recarga offline real e atualização entre versões serão executadas na rodada integrada. O número do cache no verificador é lido do service worker.

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
