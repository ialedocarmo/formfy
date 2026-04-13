# formly

`formly` é uma extensão Chrome Manifest V3 para preenchimento manual e seguro de formulários. Os dados ficam salvos localmente no navegador com `chrome.storage.local`, e o preenchimento só acontece quando o usuário clica em **Preencher página atual** no popup.

A extensão foi desenhada para priorizar controle manual, comportamento conservador e bloqueio explícito de cenários sensíveis, como checkout e pagamento.

## Principais recursos

- Salva dados localmente no navegador.
- Preenche formulários apenas por ação manual.
- Usa heurística para reconhecer campos reais por `id`, `name`, `label`, `placeholder`, `autocomplete` e contexto próximo.
- Detecta checkout/pagamento e bloqueia o preenchimento por segurança.
- Possui busca rápida no popup para localizar campos.
- Possui modo `debug` opcional direto no popup para inspecionar logs detalhados.
- Tem testes automatizados para popup, configuração e heurística de preenchimento.

## Estrutura do projeto

```text
formly/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── styles.css
├── shared/
│   ├── content-config.js
│   ├── content-heuristics.js
│   ├── popup-boot.js
│   ├── popup-runtime.js
│   ├── popup-schema.js
│   └── popup-search.js
├── tests/
│   ├── content-config.test.js
│   ├── content-flow.test.js
│   ├── content-heuristics.test.js
│   ├── popup-boot.test.js
│   ├── popup-runtime.test.js
│   ├── popup-schema.test.js
│   ├── popup-search.test.js
│   └── helpers/
└── README.md
```

## Como carregar no Chrome

1. Abra `chrome://extensions/`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactação`.
4. Selecione a pasta `formly`.
5. Sempre que fizer alterações no projeto, clique em `Atualizar` na extensão.

## Como usar

1. Abra o popup da extensão.
2. Preencha ou revise seus dados.
3. Clique em `Salvar`.
4. Abra uma página web com formulário compatível.
5. Clique em `Preencher página atual`.

## Campos suportados no popup

### Dados pessoais

- Nome completo
- Nome
- Sobrenome
- E-mail
- Telefone
- CPF
- Data de nascimento

### Dados estudantis

- Documento estudantil
- Instituição de ensino
- Curso
- Data de expiração
- Cidade da instituição
- Estado / UF da instituição

## Modo debug

O popup possui um toggle `Modo debug`.

Quando ativado:
- o `content.js` volta a registrar análise de campos, ambiguidades, campos preenchidos e campos ignorados no console da página;
- isso ajuda a ajustar a heurística em formulários reais.

Quando desativado:
- a extensão volta ao modo normal, sem logs detalhados de análise.

## Como testar

### Teste manual

1. Abra o popup.
2. Salve alguns dados.
3. Acesse uma página com formulário comum.
4. Clique em `Preencher página atual`.
5. Verifique os campos preenchidos.
6. Se necessário, ative o `Modo debug` e abra o console da página para inspecionar os logs.

### Teste automatizado

No diretório do projeto, rode:

```powershell
npm run test
```

Scripts úteis:

```powershell
npm run test:popup
npm run test:content
npm run test:watch
```

## O que a heurística considera

A análise dos campos usa uma combinação de sinais, como:

- `id`
- `name`
- `label`
- `placeholder`
- `autocomplete`
- texto próximo do container
- contexto do formulário
- prioridade de blocos relevantes, como `holderForm`, em vez de campos de acompanhante

Também existe tratamento específico para casos comuns como:

- `nome` vs `sobrenome`
- `CPF`
- `dataNascimento`
- `dataExpiracao`
- `estado` em `select`
- formulários com campos duplicados na mesma página

## Comportamento e limites

- A extensão não envia dados para servidores externos.
- Os dados ficam somente em `chrome.storage.local`.
- O preenchimento acontece apenas por ação manual do usuário.
- A extensão não submete formulários, não clica em botões, não navega, não recarrega a página e não interage com captcha.
- A extensão bloqueia explicitamente formulários de checkout ou pagamento.
- Campos sensíveis ou fora do escopo são ignorados, como senha, cartão, CVV, checkout, pagamento, token, OTP e autenticação.
- Apenas campos compatíveis entram na análise.
- O comportamento é conservador: em caso de ambiguidade, a extensão pode preferir não preencher.

## Checkout e pagamento

A `formly` foi desenhada para **não** preencher fluxos de pagamento.

A extensão detecta sinais fortes de checkout, como:

- `data-checkout`
- `iframe` de campos seguros
- campos típicos como `cardNumber`, `securityCode`, `expirationDate`, `installments`, `docType` e `docNumber`

Quando esse contexto é detectado, o popup exibe uma mensagem de bloqueio por segurança e o preenchimento não é executado.

## Limitações conhecidas

- Formulários com estrutura muito genérica ou pouco semântica podem não ser reconhecidos corretamente.
- Em páginas muito dinâmicas, alguns campos podem ser reescritos pelo próprio site depois do preenchimento.
- O resultado depende da qualidade dos atributos do formulário real.
- Em cenários ambíguos, a extensão pode deixar campos sem preencher de propósito.

## Arquitetura resumida

- `popup.html`, `popup.js` e `styles.css`: interface da extensão.
- `shared/popup-schema.js`: schema declarativo dos campos e seções do popup.
- `shared/popup-search.js`: lógica pura da busca rápida.
- `shared/popup-runtime.js`: mensagens e regras de runtime do popup.
- `shared/popup-boot.js`: integração leve do boot do popup e fallbacks.
- `shared/content-config.js`: constantes fixas do content script.
- `shared/content-heuristics.js`: heurística pura de matching, formatação e decisão.
- `content.js`: integração com DOM da página e aplicação do preenchimento.

## Testes existentes

O projeto já cobre:

- schema do popup
- busca do popup
- runtime do popup
- boot degradado do popup
- configuração compartilhada do content script
- heurística de matching
- fluxo final de preenchimento com DOM simulado leve

## Contribuindo

Contribuições são bem-vindas.

Antes de abrir um PR:

- leia o [guia de contribuição](./CONTRIBUTING.md);
- siga o [código de conduta](./CODE_OF_CONDUCT.md);
- mantenha o escopo seguro da extensão;
- use commits com emoji no início da mensagem.

## Licença

Este projeto está licenciado sob a [MIT License](./LICENSE).

## Privacidade e segurança

- Revise periodicamente os dados salvos no popup.
- Use a extensão apenas em páginas confiáveis.
- Proteja seu perfil do Chrome e seu dispositivo.
- A proposta da `formly` é ser local, manual e conservadora.

## Próximos passos possíveis

- Persistir o estado aberto/fechado das seções do popup.
- Exibir uma prévia curta dos dados salvos antes do preenchimento.
- Criar uma página local de demonstração para testes manuais.
- Adicionar exportação e importação local de perfil.
- Evoluir a suíte para testes com DOM mais real no `content.js`.
