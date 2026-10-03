# Python, de cabeça

Bancada de aprendizagem contínua para estudar Python com compreensão e autonomia, no seu ritmo. São **136 atividades em 11 unidades**, da lógica e sintaxe até funções e depuração, com correção no próprio navegador.

**[Abrir a aplicação](https://jonhvito.github.io/pratica-python-basico/)** ou abrir `index.html` diretamente. Sem cadastro, build, backend ou instalação obrigatória.

## Como começar e continuar

1. Use **Diagnóstico inicial** para encontrar um ponto de partida. A primeira resposta fica registrada; **Não sei ainda** permite seguir sem precisar acertar tudo.
2. Escolha **Treino do dia** para uma sessão curta com revisão, recuperação de erros e conteúdo novo, ou explore livremente a **Trilha**.
3. Ao voltar, use **Continuar de onde parei**. Busque títulos ou conceitos e filtre atividades não tentadas, erros para revisar ou revisões pendentes.

## Recursos para aprender

- **Prática variada:** alternativas, ordenação, previsão de saída, programas e funções, com variações de casos quando disponíveis.
- **Apoio à escrita:** editor com recuo e números de linha, dicas graduais, soluções comentadas e comparação entre resultados esperados e obtidos.
- **Compreensão e transferência:** anotações de raciocínio, previsão e execução de casos próprios, dois projetos e download do código como `.py`.
- **Recuperação e revisão:** caderno com a tentativa original, investigação do erro, nova tentativa sem consulta e revisões espaçadas.
- **Acompanhamento:** cobertura do catálogo e indicador de autonomia separados. Repetir a mesma correção não aumenta o domínio; respostas sem apoio têm mais peso. Os indicadores orientam o estudo, sem certificar proficiência.
- **Integração:** desafios e impressão para praticar no papel, com interface adaptada ao celular e navegação por teclado.

Veja [LEIA-ME.md](LEIA-ME.md) para os conteúdos, modos de estudo e limites da correção.

## Dados e funcionamento offline

O progresso fica no navegador, sem sincronização automática. Use **Dados → Exportar backup** para guardar uma cópia ou levar o estudo a outro dispositivo. A importação valida o arquivo e mostra um resumo antes de substituir os dados atuais. Dados inválidos ficam protegidos, com opção de exportar o original e recuperar a última cópia válida, quando disponível. Limpar os dados do navegador pode remover o progresso.

A correção de programas e funções usa Python real via Pyodide e precisa de internet para carregar o interpretador. No GitHub Pages, a interface pode ser instalada e seus arquivos locais ficam em cache para uso offline; isso **não garante a correção Python offline**. Enunciados, anotações, dicas, soluções e atividades de leitura são locais. Rascunhos e histórico não são enviados a um servidor.

## Referências para aprofundar

- [Site do professor](https://prdm0.github.io/curso_python/#/title-slide): explicações e apresentação do curso.
- [Repositório do professor](https://github.com/prdm0/curso_python): referência para parte do mapeamento de tópicos do catálogo.
- [Python Iluminado](https://pythoniluminado.netlify.app/): guia complementar de explicações e exemplos.

Os exercícios da aplicação têm enunciados, casos e soluções próprios. Os três materiais permanecem no rodapé; o cabeçalho oferece acesso ao repositório deste projeto.

## Manutenção e publicação

As verificações são opcionais para desenvolvimento. Com **Node 22 ou superior**, execute na raiz do projeto:

```sh
node verificacao/conteudo.cjs
node verificacao/progresso.cjs
node verificacao/editor.cjs
node verificacao/armazenamento.cjs
node verificacao/planejamento.cjs
node verificacao/cache.cjs
```

- `node verificacao/python.cjs`: soluções e regressões com **Python 3 local**.
- `node verificacao/verificar.cjs --layout-only`: interface e persistência em **Chrome/Chromium ou Edge**, sem carregar Python.
- `node verificacao/verificar.cjs`: suíte completa, incluindo Python no navegador, desafios, impressão e recarga offline da interface. Exige internet para carregar Pyodide.

Se o navegador não for encontrado, configure `BROWSER_EXECUTABLE`. Capturas e artefatos são gerados em `verificacao/artefatos` e ignorados pelo Git.

A ação [.github/workflows/pages.yml](.github/workflows/pages.yml) verifica a sintaxe JavaScript, o catálogo, as regras de progresso, editor, armazenamento, planejamento e cache, as soluções com Python local e a interface em três larguras antes de publicar. Um push para `main` ou o acionamento manual do workflow inicia essa sequência. Apenas os arquivos da aplicação são publicados no GitHub Pages.

Antes de alterar o projeto, leia [AGENTS.md](AGENTS.md) e [estado-atual.md](estado-atual.md). Cada commit deve atualizar o estado atual e seguir Conventional Commits, com descrição e corpo em português e registro da validação realizada.
