# Diretrizes de manutenção

Leia [estado-atual.md](estado-atual.md) antes de alterar a aplicação. Esse arquivo é a referência do funcionamento atual, das decisões de implementação e das verificações realizadas.

- Toda alteração no código deve ser refletida em `estado-atual.md` no mesmo conjunto de mudanças, antes do commit. Descreva o comportamento resultante, os arquivos envolvidos, a validação realizada e os limites relevantes. Não registre testes como aprovados sem executá-los.
- Use commits curtos e descritivos, em português. O título deve explicar a mudança concreta, por exemplo: `Corrige revisão de tentativas repetidas`. Separe mudanças independentes quando isso facilitar entender a evolução e manter o código.
- Preserve o objetivo de aprendizagem contínua. Revisões, desafios e prática no papel são recursos de estudo; a página principal não deve depender de uma prova, data ou roteiro de véspera.
- Mantenha a abertura por `index.html`, sem build, backend ou dependências obrigatórias de instalação. Preserve os dados existentes e documente alterações no formato de progresso e backup.
- Verifique a sintaxe do JavaScript e o catálogo com `node verificacao/conteudo.cjs`. Para mudanças de interface, correção, persistência ou cache, execute também as verificações correspondentes da pasta `verificacao` e registre qualquer limitação.
- Ao adicionar um arquivo necessário à aplicação, atualize a lista do service worker e a publicação em `.github/workflows/pages.yml`.
