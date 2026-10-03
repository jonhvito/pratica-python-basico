# Diretrizes de manutenção

Leia [estado-atual.md](estado-atual.md) antes de alterar a aplicação. Esse arquivo é a referência do funcionamento atual, das decisões de implementação e das verificações realizadas.

## Atualização obrigatória do estado atual

- Toda alteração de código, interface, configuração, testes ou diretrizes de manutenção deve atualizar `estado-atual.md`. Isso vale também para correções pequenas e refatorações que preservem o comportamento.
- Atualize o registro durante o trabalho e revise-o antes de cada commit. Não deixe a documentação para um commit posterior nem considere uma explicação no chat como substituto.
- O mesmo commit que altera o projeto deve incluir a atualização correspondente de `estado-atual.md`. Quando o trabalho for dividido em vários commits, cada um deve registrar apenas o que entrega naquela etapa.
- Mantenha a descrição do funcionamento atual coerente com o código e acrescente tópicos no registro de alterações contendo: data, o que foi feito, motivo, arquivos ou áreas afetadas, validação e limites ou pendências relevantes.
- Registre os comandos realmente executados e seus resultados. Se uma verificação não foi feita ou falhou, informe isso e o motivo; nunca registre sucesso por suposição.
- Antes de criar o commit, confira o diff preparado para confirmar que o código e o registro descrevem a mesma mudança. Se falta essa atualização, o commit ainda não está pronto.

## Convenção obrigatória de commits

- Use Conventional Commits: `<tipo>: <descrição>` ou `<tipo>(<escopo>): <descrição>`.
- Os tipos seguem os prefixos convencionais: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `style`, `build`, `ci`, `chore` e `revert`. Escolha o tipo que representa o objetivo principal da mudança; o escopo é opcional.
- Escreva a descrição do título e todo o corpo em português. Os prefixos convencionais permanecem como definidos acima. Prefira verbos que expliquem a ação, como `corrige`, `adiciona`, `documenta` ou `melhora`.
- O título deve ser curto, descritivo e ter até 72 caracteres. Diga o que mudou; evite títulos genéricos como `fix: ajustes`, `chore: alterações` ou `docs: atualização`.
- Separe mudanças independentes em commits por finalidade. Cada commit deve formar uma etapa coerente e verificável, acompanhada do seu registro em `estado-atual.md`.
- Depois do título, deixe uma linha em branco e escreva o corpo em tópicos objetivos. Explique o que foi feito e o efeito ou motivo de cada mudança relevante; não use apenas uma lista de arquivos.
- Inclua ao final um bloco `Validação:` com comandos e resultados. Quando não houver testes aplicáveis, explique por quê e informe a conferência realizada. Registre falhas, limitações ou pendências sem apresentá-las como verificações aprovadas.
- Para mudanças incompatíveis, use `!` no título e um rodapé `BREAKING CHANGE:` com a explicação e o caminho de migração em português.
- Em mensagens de várias linhas pela CLI, prefira `git commit --file` com um arquivo de mensagem para preservar tópicos e quebras de linha.

### Exemplo de mensagem

O exemplo abaixo é ilustrativo: substitua os tópicos e a validação pelos fatos da mudança que está sendo entregue.

```text
fix: preserva progresso ao repetir a correção

- Impede que a mesma tentativa aumente o domínio mais de uma vez.
- Mantém a revisão agendada e preserva respostas restauradas de backups.
- Atualiza estado-atual.md com o comportamento e os limites da correção.

Validação:
- node verificacao/progresso.cjs: 22 verificações passaram.
- git diff --check: passou.
```

## Regras da aplicação

- Preserve o objetivo de aprendizagem contínua. Revisões, desafios e prática no papel são recursos de estudo; a página principal não deve depender de uma prova, data ou roteiro de véspera.
- Mantenha a abertura por `index.html`, sem build, backend ou dependências obrigatórias de instalação. Preserve os dados existentes e documente alterações no formato de progresso e backup.
- Em alterações de código, verifique a sintaxe do JavaScript e o catálogo com `node verificacao/conteudo.cjs`. Para mudanças de interface, correção, persistência ou cache, execute também as verificações correspondentes da pasta `verificacao` e registre qualquer limitação.
- Em alterações exclusivamente documentais, confira a coerência dos documentos e execute `git diff --check`. Não é necessário repetir os testes da aplicação; registre essa justificativa na validação da mudança.
- Ao adicionar um arquivo necessário à aplicação, atualize a lista do service worker e a publicação em `.github/workflows/pages.yml`.
