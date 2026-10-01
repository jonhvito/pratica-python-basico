# Python, de cabeça

Abra **index.html** com dois cliques, de preferência no Chrome, Edge ou Firefox recente. Não precisa instalar nada, iniciar servidor ou executar comandos.

O objetivo é construir raciocínio e recuperar a escrita de Python para uma prova no papel. Há **136 exercícios em 11 unidades**, da lógica e sintaxe até funções e depuração. Além da lista livre e do simulado, o site funciona como um treinador adaptativo local: registra tentativas, identifica padrões de erro, agenda revisões e monta sessões curtas com base no que precisa de mais atenção.

## Revisão alinhada ao professor

Referência: [prdm0/curso_python](https://github.com/prdm0/curso_python), arquivo `index.qmd`, consultado em 01/10/2026. O material do professor foi usado para mapear tópicos; os novos enunciados, dados, casos e soluções foram elaborados para esta bancada.

O botão **Revisão guiada** reúne 12 questões de recuperação ativa. **Simulado do curso** seleciona seis questões em grupos distintos: condições, strings, laços, estruturas, compreensões e funções/séries. Essa prova inclui os tópicos avançados mesmo com progresso inicial; o modo **Prova** habitual continua adaptado à trilha.

As 36 atividades novas cobrem identidade, tipos, `math`, formatação, palíndromos, condições de fronteira, `enumerate`, `zip`, `break`, `continue`, fatorial, primos, tuplas, desempacotamento, dicionários, médias aninhadas, conjuntos, cópias, `sort`/`sorted`, compreensões, `*args`, `**kwargs`, `lambda`, `map`, `reduce`, padrões mutáveis e séries finitas. Turtle tem uma questão conceitual; a execução gráfica requer Python local. A unidade de Listas agora reúne as quatro estruturas de dados.

O roteiro de véspera sugere duas horas de revisão e prática no papel. Ele se baseia no conteúdo da referência, sem presumir o recorte da prova. Git, Linux, pip, ambientes virtuais e Jupyter aparecem no curso e são lembrados no roteiro, sem instalar ferramentas durante o estudo. Os títulos finais sobre recursão, closures, geradores, tratamento de erros e decoradores não têm desenvolvimento no arquivo consultado. O slide de fatorial contém um lapso para zero; aqui usamos **0! = 1**.

## Trilha de fundamentos

O botão **Trilha** organiza o conteúdo em Lógica, Sintaxe, Variáveis e tipos, Números, Strings, Entrada e saída, Condições, Laços, Listas, Funções e Depuração. O mapa mostra conceitos, pré-requisitos, domínio e a unidade recomendada. É possível abrir qualquer unidade pelo mapa ou pelo filtro lateral.

O **diagnóstico inicial** apresenta uma questão curta de cada unidade. Há cinco formatos de atividade: alternativas conceituais, ordenação de etapas, previsão de saída, programas completos e funções. Assim, o estudo trabalha o raciocínio anterior ao código e também a escrita real da linguagem.

## Como estudar

1. Tente escrever sem consulta. O campo começa vazio.
2. Se travar, abra a dica, a consulta rápida ou “Mostrar começo”.
3. Verifique. Leia o erro e compare os casos de teste, especialmente zero, negativos e listas vazias.
4. Use a solução comentada quando precisar. Depois, escolha “Refazer do zero” e escreva sem olhar.
5. Use **Prova** para seis questões executáveis com correção só na entrega. O relógio conta o tempo, sem prazo obrigatório. Use “Imprimir prova” para resolver à mão; para a correção automática, transcreva as respostas nos campos. No treino, a impressão inclui apenas o exercício aberto.

## Treino adaptativo

O botão **Treino do dia** monta uma sessão de cinco etapas combinando a unidade atual, revisão vencida, erro pendente, habilidade com baixo domínio e conteúdo novo. O mapa também cria treinos focados em uma unidade. A seleção é feita no próprio navegador, sem enviar respostas para um servidor.

Cada exercício pode ser praticado de cinco formas:

- **Do zero:** escrever toda a solução de memória.
- **Completar:** recuperar as linhas removidas de uma solução.
- **Caça ao bug:** corrigir uma solução quase certa.
- **Reconstruir:** observar uma solução por 20 segundos e reescrevê-la.
- **No papel:** resolver fora da tela, cronometrar e depois transcrever para correção.

O botão **Nova variação** troca os casos usados no exemplo e na correção em exercícios compatíveis. Assim, a lógica continua igual, mas não basta decorar resultados.

Antes de verificar, é possível registrar a confiança como “Chutei”, “Acho que está certo” ou “Tenho certeza”. O painel destaca acertos inseguros e erros cometidos com confiança alta, ajudando a calibrar a sensação de domínio.

## Aprendizado e revisão

- **Meu aprendizado** mostra tentativas, taxa de acerto, sequência de estudo e domínio por habilidade.
- **Caderno de erros** guarda o código que falhou, classifica o provável problema e permite voltar diretamente ao exercício.
- Um acerto agenda a próxima revisão em intervalos crescentes de 1, 3, 7, 15 e 30 dias. Errar traz a questão de volta mais cedo.
- Abrir dica, solução, consulta rápida ou começo sugerido marca aquela tentativa como feita com apoio.
- Nos testes de mesa há uma tabela opcional para registrar linha, variáveis e saída antes da resposta final.

O simulado seleciona seis exercícios de programação compatíveis com o ponto atual da trilha. Rascunhos, histórico, revisões e resultados são guardados no navegador, inclusive ao trocar de exercício. Treino livre, sessão adaptativa e simulado têm respostas separadas. Não há conta nem sincronização entre dispositivos. Use **Dados → Exportar backup** para gerar um arquivo JSON e **Importar backup** no outro navegador. Em navegação privada, ao mudar a pasta de lugar ou limpar os dados do navegador, o progresso pode deixar de estar disponível.

## Correção

- Programas recebem as entradas dos testes automaticamente. Cada `input()` consome uma entrada. O texto opcional passado a `input("Mensagem: ")` é ignorado na correção; textos extras em `print()` contam como saída.
- Funções recebem argumentos e são verificadas pelo valor retornado. `print()` não substitui `return`.
- Testes de mesa comparam a saída escrita e funcionam sem internet. Use uma linha para cada `print()`.
- Espaços no fim das linhas e quebras de linha finais não interferem. As demais diferenças de texto contam. Médias aceitam diferenças mínimas de ponto flutuante.
- Regras como “use for” e “sem sum()” têm uma checagem simples da estrutura do código. Isso ajuda no treino, mas não é uma fiscalização completa de todas as soluções possíveis. Passar nos casos não prova que o código funciona para toda entrada imaginável.
- Cada caso começa com um novo ambiente de variáveis. A execução fica em uma tarefa separada do navegador, com botão para parar e limite de quatro segundos por exercício. Interromper um laço exige recarregar o interpretador na próxima verificação.

## Arquivos e internet

HTML, CSS e JavaScript puro, sem framework, build, backend, gerenciador de pacotes, fontes externas ou cadastro. Tudo da versão nova está nesta pasta; o original não foi alterado.

- `index.html`: estrutura da página e consulta rápida.
- `styles.css`: estilos, versão para celular e impressão.
- `exercicios.js`: enunciados, casos de teste, dicas e soluções.
- `curriculo.js`: unidades, pré-requisitos e catálogo de 100 atividades de fundamentos.
- `professor.js`: 36 atividades adicionais e os grupos da revisão e do simulado do curso.
- `aprendizagem.js`: habilidades, variações, desafios e diagnóstico pedagógico.
- `treinador.js`: estado local, sessões, revisão, navegação, painéis, backup, simulado e impressão.
- `python.js`: correção com Python real, usando o mesmo Pyodide 0.26.4 da versão original. A execução em uma tarefa separada segue a [documentação do Pyodide](https://pyodide.org/en/0.26.4/usage/webworker.html).
- `manifest.webmanifest`, `service-worker.js` e `icone.svg`: instalação e cache da interface no GitHub Pages.

A **correção de código precisa de internet** para carregar o interpretador do CDN jsDelivr. No GitHub Pages, a interface pode ser instalada e seus arquivos locais são armazenados para uso offline; o carregamento do Python ainda depende do cache do navegador/CDN. Enunciados, sessões, histórico, caderno, dicas, soluções, impressão e testes de mesa são locais. A página não envia rascunhos ou histórico a um serviço: o Python roda no navegador.

## Verificação opcional para desenvolvimento

A pasta `verificacao` contém um script sem dependências para testar a página em Chrome/Edge oculto, com Node 22 ou superior: execute `node pratica-python-basico/verificacao/verificar.cjs` a partir da pasta que contém esta versão. Ele testa o currículo, todos os formatos, todas as soluções executáveis, salvamento, diagnóstico, erros, interrupção, simulado, impressão e recarga offline, e gera capturas e PDF em `verificacao/artefatos`. Nada disso é necessário para estudar: basta abrir `index.html`.
