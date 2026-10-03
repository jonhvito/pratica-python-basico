# Python, de cabeça

Bancada para aprender Python no seu ritmo, com 136 atividades em 11 unidades, correção no navegador, revisão adaptativa e desafios de integração.

**Site:** https://jonhvito.github.io/pratica-python-basico/

**Referências para aprofundar:** [site do professor](https://prdm0.github.io/curso_python/#/title-slide), [repositório do professor no GitHub](https://github.com/prdm0/curso_python) e [Python Iluminado](https://pythoniluminado.netlify.app/).

O repositório do professor orienta parte do mapeamento de tópicos do catálogo. Python Iluminado é um guia complementar para consulta. Os três links permanecem disponíveis no rodapé da aplicação.

Abra `index.html` diretamente ou use o site. Continue de onde parou, escolha um treino do dia ou faça o diagnóstico inicial. A lista permite buscar títulos e conceitos e filtrar exercícios não tentados, erros ou revisões pendentes. Veja [LEIA-ME.md](LEIA-ME.md) para conteúdo, funcionamento e limites da correção.

O progresso fica no navegador; exporte em **Dados** para levar a outro dispositivo. A importação valida o backup e mostra um resumo antes de substituir o progresso atual. A primeira correção de código precisa de internet para carregar Pyodide.

O diagnóstico guarda a primeira resposta e permite continuar quando você ainda não sabe. O painel distingue cobertura e evidência de autonomia. Dicas graduais, anotações de raciocínio, casos próprios e dois projetos ajudam a compreender e transferir o aprendizado. É possível baixar seu código como `.py`. Dados inválidos ficam protegidos, com opção de exportar o original e recuperar a última cópia válida.

## Publicação

GitHub Pages recebe apenas os arquivos da aplicação pela ação `.github/workflows/pages.yml`. Um push para `main` verifica o JavaScript e o catálogo e publica a atualização. Perfis de navegador, capturas e artefatos de teste são ignorados pelo Git e não são publicados.

## Verificação

Com Node 22 ou superior, execute os verificadores `conteudo.cjs`, `progresso.cjs`, `editor.cjs`, `armazenamento.cjs`, `planejamento.cjs` e `cache.cjs` na pasta `verificacao`. `node verificacao/python.cjs` usa Python local para soluções e regressões. A verificação completa com Chrome ou Edge é `node verificacao/verificar.cjs`; ela verifica Python no navegador, interface, persistência, desafios, impressão e cache offline. `--layout-only` verifica interface sem carregar Python. No Linux, use Chrome instalado ou configure `BROWSER_EXECUTABLE`. Esses comandos são opcionais para manutenção; abrir `index.html` continua suficiente para estudar. Veja [AGENTS.md](AGENTS.md) e [estado-atual.md](estado-atual.md).
