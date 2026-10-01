# Python, de cabeça

Bancada de prática para Programação Estatística com Python, com 136 atividades, correção com Python no navegador, revisão adaptativa e simulado no papel.

**Site:** https://jonhvito.github.io/pratica-python-basico/

**Referência do curso:** https://github.com/prdm0/curso_python

Abra `index.html` diretamente ou use o site. Veja [LEIA-ME.md](LEIA-ME.md) para o roteiro de estudo, conteúdo, funcionamento e limites da correção. O progresso fica no navegador; exporte em **Dados** para levar a outro dispositivo. A primeira correção de código precisa de internet para carregar Pyodide.

## Publicação

GitHub Pages recebe apenas os arquivos da aplicação pela ação `.github/workflows/pages.yml`. Um push para `main` verifica o JavaScript e o catálogo e publica a atualização. Perfis de navegador, capturas e artefatos de teste são ignorados pelo Git e não são publicados.

## Verificação

Com Node 22 ou superior, execute `node verificacao/conteudo.cjs`. A verificação completa, no Windows com Chrome ou Edge, é `node verificacao/verificar.cjs`; ela verifica soluções em Python, interface, persistência, simulados, impressão e cache offline.
