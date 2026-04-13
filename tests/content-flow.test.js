const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createMetadata,
  simulateFillFlow
} = require("../shared/content-heuristics.js");
const {
  createInputField,
  createSelectField,
  createAnalysisResult
} = require("./helpers/content-test-factories.js");

test("fluxo final prioriza campos do holderForm em vez de registration e companion", () => {
  const profile = {
    nomeCompleto: "Alessandra Silva Souza do Carmo",
    nome: "Alessandra",
    sobrenome: "Silva Souza do Carmo",
    cpf: "397.232.238-05",
    dataNascimento: "25/07/1991",
    estado: "MG"
  };

  const registrationName = createInputField("firstName");
  const holderName = createInputField("firstName");
  const companionName = createInputField("firstNameCompanion");
  const holderSurname = createInputField("lastName");

  const results = [
    createAnalysisResult(
      {
        idText: "firstName",
        nameText: "firstName",
        labelText: "Nome",
        placeholderText: "Nome",
        formIdText: "registrationForm",
        isVisible: true,
        isInHolderForm: false,
        isInCompanionForm: false
      },
      registrationName
    ),
    createAnalysisResult(
      {
        idText: "firstName",
        nameText: "firstName",
        labelText: "Nome",
        placeholderText: "Nome",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      holderName
    ),
    createAnalysisResult(
      {
        idText: "firstNameCompanion",
        nameText: "firstNameCompanion",
        labelText: "Nome",
        placeholderText: "Nome",
        formIdText: "holder-companion-form",
        isVisible: true,
        isInHolderForm: false,
        isInCompanionForm: true
      },
      companionName
    ),
    createAnalysisResult(
      {
        idText: "lastName",
        nameText: "lastName",
        labelText: "Sobrenome",
        placeholderText: "Sobrenome",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      holderSurname
    )
  ];

  const filled = simulateFillFlow(results, profile);

  assert.equal(holderName.value, "Alessandra");
  assert.equal(holderSurname.value, "Silva Souza do Carmo");
  assert.equal(registrationName.value, "");
  assert.equal(companionName.value, "");
  assert.equal(filled.find((entry) => entry.fieldType === "nome").field, holderName);
});

test("fluxo final escolhe dateOfBirth do holderForm e aplica formato correto", () => {
  const profile = {
    dataNascimento: "25/07/1991"
  };

  const genericBirthDate = createInputField("birthDate", "text");
  const holderDateOfBirth = createInputField("dateOfBirth", "text");

  const results = [
    createAnalysisResult(
      {
        idText: "birthDate",
        nameText: "birthDate",
        labelText: "Data de nascimento",
        placeholderText: "DD/MM/AAAA",
        formIdText: "registrationForm",
        isVisible: true,
        isInHolderForm: false,
        isInCompanionForm: false
      },
      genericBirthDate
    ),
    createAnalysisResult(
      {
        idText: "dateOfBirth",
        nameText: "dateOfBirth",
        labelText: "Data de nascimento",
        placeholderText: " ",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      holderDateOfBirth
    )
  ];

  const filled = simulateFillFlow(results, profile);

  assert.equal(holderDateOfBirth.value, "25/07/1991");
  assert.equal(genericBirthDate.value, "");
  assert.equal(filled[0].fieldType, "dataNascimento");
});

test("fluxo final aplica estado em select do holderForm", () => {
  const profile = {
    estado: "MG"
  };

  const stateSelect = createSelectField("state", [
    { value: "AC", textContent: "AC" },
    { value: "MG", textContent: "MG" },
    { value: "SP", textContent: "SP" }
  ]);

  const results = [
    createAnalysisResult(
      {
        idText: "state",
        nameText: "state",
        labelText: "Estado / UF",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false,
        tagName: "select"
      },
      stateSelect
    )
  ];

  const filled = simulateFillFlow(results, profile);

  assert.equal(stateSelect.value, "MG");
  assert.equal(filled[0].value, "MG");
});

test("fluxo final preenche CIE, instituição, cidade e curso corretos no holderForm", () => {
  const profile = {
    documentoEstudantil: "E047AA",
    instituicaoEnsino: "PUC Minas",
    cidade: "Belo Horizonte",
    curso: "Engenharia de software"
  };

  const cieField = createInputField("CIE");
  const institutionField = createInputField("institutionName");
  const cityField = createInputField("city");
  const courseField = createInputField("course");
  const companionCityField = createInputField("cityCompanion");

  const results = [
    createAnalysisResult(
      {
        idText: "CIE",
        nameText: "CIE",
        labelText: "CIE",
        nearestContainerText: "O CIE é obrigatório",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      cieField
    ),
    createAnalysisResult(
      {
        idText: "institutionName",
        nameText: "institutionName",
        labelText: "Nome da Instituição",
        nearestContainerText: "O nome da instituição é obrigatório",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      institutionField
    ),
    createAnalysisResult(
      {
        idText: "city",
        nameText: "city",
        labelText: "Cidade",
        nearestContainerText: "A cidade é obrigatória",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      cityField
    ),
    createAnalysisResult(
      {
        idText: "course",
        nameText: "course",
        labelText: "Curso",
        nearestContainerText: "O curso é obrigatório",
        formIdText: "holderForm",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false
      },
      courseField
    ),
    createAnalysisResult(
      {
        idText: "cityCompanion",
        nameText: "cityCompanion",
        labelText: "Cidade",
        nearestContainerText: "Cidade do acompanhante",
        formIdText: "holder-companion-form",
        isVisible: true,
        isInHolderForm: false,
        isInCompanionForm: true
      },
      companionCityField
    )
  ];

  const filled = simulateFillFlow(results, profile);

  assert.equal(cieField.value, "E047AA");
  assert.equal(institutionField.value, "PUC Minas");
  assert.equal(cityField.value, "Belo Horizonte");
  assert.equal(courseField.value, "Engenharia de software");
  assert.equal(companionCityField.value, "");

  assert.equal(filled.find((entry) => entry.fieldType === "documentoEstudantil").field, cieField);
  assert.equal(filled.find((entry) => entry.fieldType === "instituicaoEnsino").field, institutionField);
  assert.equal(filled.find((entry) => entry.fieldType === "cidade").field, cityField);
  assert.equal(filled.find((entry) => entry.fieldType === "curso").field, courseField);
});

test("fluxo final ignora candidato ambíguo com gap abaixo do mínimo", () => {
  const ambiguousField = createInputField("name");

  const results = [
    {
      field: ambiguousField,
      metadata: createMetadata({
        idText: "name",
        nameText: "name",
        labelText: "Nome",
        isVisible: true,
        isInHolderForm: true,
        isInCompanionForm: false,
        tagName: "input"
      }),
      ignored: false,
      ignoreReason: "",
      bestMatch: { fieldType: "nome", score: 220 },
      secondBestMatch: { fieldType: "nomeCompleto", score: 215 },
      scoreMap: {
        nome: 220,
        nomeCompleto: 215
      }
    }
  ];

  const filled = simulateFillFlow(results, {
    nome: "Alessandra",
    nomeCompleto: "Alessandra Silva Souza do Carmo"
  });

  assert.equal(filled.length, 0);
  assert.equal(ambiguousField.value, "");
});
