const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MIN_SCORE_GAP,
  rankFieldMatches,
  isCheckoutLikeFormData,
  compareCandidatePriority,
  isAmbiguousMatch,
  formatDateForField,
  formatStateForSelect
} = require("../shared/content-heuristics.js");
const {
  createInputField,
  topMatch
} = require("./helpers/content-test-factories.js");

test("heurística distingue nome de sobrenome em campos separados", () => {
  const nome = topMatch(
    {
      idText: "firstName",
      nameText: "firstName",
      labelText: "Nome",
      placeholderText: "Nome",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("firstName")
  );

  const sobrenome = topMatch(
    {
      idText: "lastName",
      nameText: "lastName",
      labelText: "Sobrenome",
      placeholderText: "Sobrenome",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("lastName")
  );

  assert.ok(nome);
  assert.ok(sobrenome);
  assert.equal(nome.fieldType, "nome");
  assert.equal(sobrenome.fieldType, "sobrenome");
});

test("heurística reconhece CPF em campo documentNumber com label CPF", () => {
  const match = topMatch(
    {
      idText: "documentNumber",
      nameText: "documentNumber",
      labelText: "CPF",
      nearestContainerText: "Tipo de documento CPF",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("documentNumber")
  );

  assert.ok(match);
  assert.equal(match.fieldType, "cpf");
  assert.ok(match.score > 150);
});

test("heurística penaliza campo de repetição de documento para não confundir com CPF", () => {
  const ranked = rankFieldMatches(
    {
      idText: "repeatDocumentNumber",
      nameText: "repeatDocumentNumber",
      labelText: "Repita o número do documento",
      nearestContainerText: "Repita o número do documento",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("repeatDocumentNumber")
  );

  const cpfMatch = ranked.find((entry) => entry.fieldType === "cpf");
  assert.ok(cpfMatch);
  assert.ok(cpfMatch.score < 120);
});

test("heurística prioriza dataNascimento para birthDate com DD/MM/AAAA", () => {
  const ranked = rankFieldMatches(
    {
      idText: "birthDate",
      nameText: "birthDate",
      labelText: "Data de nascimento",
      placeholderText: "DD/MM/AAAA",
      autocompleteText: "bday",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("birthDate")
  );

  const nascimento = ranked.find((entry) => entry.fieldType === "dataNascimento");
  const expiracao = ranked.find((entry) => entry.fieldType === "dataExpiracao");

  assert.ok(nascimento);
  assert.equal(ranked[0].fieldType, "dataNascimento");
  if (expiracao) {
    assert.ok(nascimento.score > expiracao.score);
  }
});

test("heurística reconhece CIE como documentoEstudantil", () => {
  const match = topMatch(
    {
      idText: "CIE",
      nameText: "CIE",
      labelText: "CIE",
      nearestContainerText: "O CIE é obrigatório",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("CIE")
  );

  assert.ok(match);
  assert.equal(match.fieldType, "documentoEstudantil");
  assert.ok(match.score > 150);
});

test("heurística reconhece institutionName como instituicaoEnsino", () => {
  const match = topMatch(
    {
      idText: "institutionName",
      nameText: "institutionName",
      labelText: "Nome da Instituição",
      nearestContainerText: "O nome da instituição é obrigatório",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("institutionName")
  );

  assert.ok(match);
  assert.equal(match.fieldType, "instituicaoEnsino");
  assert.ok(match.score > 150);
});

test("heurística reconhece city como cidade", () => {
  const match = topMatch(
    {
      idText: "city",
      nameText: "city",
      labelText: "Cidade",
      nearestContainerText: "A cidade é obrigatória",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("city")
  );

  assert.ok(match);
  assert.equal(match.fieldType, "cidade");
  assert.ok(match.score > 150);
});

test("heurística reconhece course como curso", () => {
  const match = topMatch(
    {
      idText: "course",
      nameText: "course",
      labelText: "Curso",
      nearestContainerText: "O curso é obrigatório",
      isVisible: true,
      isInHolderForm: true,
      tagName: "input"
    },
    createInputField("course")
  );

  assert.ok(match);
  assert.equal(match.fieldType, "curso");
  assert.ok(match.score > 150);
});

test("prioridade favorece holderForm acima de companion mesmo com score menor", () => {
  const holderCandidate = {
    metadata: {
      isInHolderForm: true,
      isVisible: true,
      isInCompanionForm: false
    },
    bestMatch: { score: 300 }
  };
  const companionCandidate = {
    metadata: {
      isInHolderForm: false,
      isVisible: true,
      isInCompanionForm: true
    },
    bestMatch: { score: 420 }
  };

  assert.ok(compareCandidatePriority(holderCandidate, companionCandidate) < 0);
});

test("formatação de dataNascimento e dataExpiracao converte para input type=date", () => {
  assert.equal(
    formatDateForField("25/07/1991", { inputType: "date" }),
    "1991-07-25"
  );
  assert.equal(
    formatDateForField("31/03/2027", { inputType: "date" }),
    "2027-03-31"
  );
});

test("formatação de data mantém formato dd/mm/aaaa para input text", () => {
  assert.equal(
    formatDateForField("1991-07-25", { inputType: "text" }),
    "25/07/1991"
  );
  assert.equal(
    formatDateForField("31-03-2027", { inputType: "text" }),
    "31/03/2027"
  );
});

test("seleção de estado em select retorna o value da opção compatível", () => {
  const field = {
    tagName: "select",
    options: [
      { value: "AC", textContent: "AC" },
      { value: "MG", textContent: "MG" },
      { value: "SP", textContent: "SP" }
    ]
  };

  assert.equal(formatStateForSelect("mg", field), "MG");
  assert.equal(formatStateForSelect("SP", field), "SP");
  assert.equal(formatStateForSelect("RJ", field), "");
});

test("casos ambíguos com score gap abaixo do mínimo são marcados como ambíguos", () => {
  const ambiguous = {
    bestMatch: { fieldType: "nome", score: 200 },
    secondBestMatch: { fieldType: "nomeCompleto", score: 200 - (MIN_SCORE_GAP - 1) }
  };
  const clear = {
    bestMatch: { fieldType: "nome", score: 200 },
    secondBestMatch: { fieldType: "nomeCompleto", score: 200 - MIN_SCORE_GAP }
  };

  assert.equal(isAmbiguousMatch(ambiguous), true);
  assert.equal(isAmbiguousMatch(clear), false);
});

test("checkout explícito é bloqueado por sinais fortes de pagamento", () => {
  const blocked = isCheckoutLikeFormData({
    id: "pay",
    className: "clearfix row",
    text: "Nome completo Parcelas Documento Código de segurança",
    hasSecureIframe: true,
    hasCheckoutAttribute: true,
    hasPaymentField: true
  });

  assert.equal(blocked, true);
});

test("formulário comum de titular não é tratado como checkout", () => {
  const blocked = isCheckoutLikeFormData({
    id: "holderForm",
    className: "row",
    text: "Nome Sobrenome CPF Data de nascimento CIE",
    hasSecureIframe: false,
    hasCheckoutAttribute: false,
    hasPaymentField: false
  });

  assert.equal(blocked, false);
});
