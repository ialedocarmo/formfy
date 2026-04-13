# Contribuindo para a formly

Obrigado por querer contribuir com a `formly`.

A ideia do projeto é manter a extensão simples, local, manual e conservadora. Antes de abrir uma contribuição, vale alinhar qualquer mudança com esses princípios.

## Antes de começar

- Leia o `README.md` para entender o escopo atual da extensão.
- Evite adicionar suporte a fluxos de checkout, pagamento, cartão, CVV, autenticação ou outros campos sensíveis.
- Prefira mudanças pequenas, focadas e fáceis de revisar.

## Como contribuir

1. Faça um fork do repositório.
2. Crie uma branch para sua mudança.
3. Faça suas alterações.
4. Rode os testes relevantes.
5. Abra um Pull Request descrevendo o problema e a solução.

## Desenvolvimento local

Depois de clonar o projeto, você pode rodar:

```powershell
npm run test
```

Ou, se quiser focar em uma parte específica:

```powershell
npm run test:popup
npm run test:content
```

Para testar a extensão manualmente:

1. Abra `chrome://extensions/`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactação`.
4. Selecione a pasta do projeto.
5. Use `Atualizar` sempre que mudar os arquivos.

## Direção técnica do projeto

Contribuições são bem-vindas principalmente em áreas como:

- melhorias de heurística para formulários reais não financeiros;
- melhorias de acessibilidade e usabilidade do popup;
- testes automatizados;
- documentação;
- estabilidade e manutenção do código.

## Commits

Este repositório usa mensagens de commit com emoji no início. Exemplos:

- `✨ feat: adiciona nova melhoria no popup`
- `🧪 test: cobre regressão da heurística`
- `📝 docs: atualiza README`
- `🎨 style: refina o visual do popup`
- `♻️ refactor: reorganiza módulo compartilhado`
- `🐛 fix: corrige bug de preenchimento`

## Pull Requests

Ao abrir um PR, tente incluir:

- o problema que motivou a mudança;
- a solução adotada;
- riscos ou limitações conhecidos;
- prints ou logs, quando fizer sentido;
- quais testes foram executados.

## Escopo fora do projeto

Para manter a proposta da `formly`, PRs que adicionem automação de checkout, pagamento, campos de cartão ou fluxos sensíveis podem ser recusados.

## Código de conduta

Ao participar deste projeto, siga o [Código de Conduta](./CODE_OF_CONDUCT.md).
