const test = require("node:test");
const assert = require("node:assert/strict");
const { FIELD_SECTIONS, getFieldNames } = require("../shared/popup-schema.js");

test("schema do popup expõe as duas seções principais", () => {
  assert.equal(FIELD_SECTIONS.length, 2);
  assert.deepEqual(
    FIELD_SECTIONS.map((section) => section.title),
    ["Dados pessoais", "Dados estudantis"]
  );
});

test("todas as seções possuem summaryLabel preenchido", () => {
  for (const section of FIELD_SECTIONS) {
    assert.equal(typeof section.summaryLabel, "string");
    assert.ok(section.summaryLabel.trim().length > 0, `summaryLabel ausente em ${section.title}`);
  }
});

test("nomes dos campos são únicos e cobrem o formulário salvo", () => {
  const fieldNames = getFieldNames();
  const uniqueNames = new Set(fieldNames);

  assert.equal(fieldNames.length, uniqueNames.size);
  assert.deepEqual(fieldNames, [
    "nomeCompleto",
    "nome",
    "sobrenome",
    "email",
    "telefone",
    "cpf",
    "dataNascimento",
    "documentoEstudantil",
    "instituicaoEnsino",
    "curso",
    "dataExpiracao",
    "cidade",
    "estado"
  ]);
});

test("todos os campos possuem type e search válidos", () => {
  const allowedTypes = new Set(["text", "email", "tel", "date"]);

  for (const section of FIELD_SECTIONS) {
    for (const field of section.fields) {
      assert.ok(allowedTypes.has(field.type), `type inválido em ${field.name}: ${field.type}`);
      assert.equal(typeof field.search, "string");
      assert.ok(field.search.trim().length > 0, `search ausente em ${field.name}`);
    }
  }
});

test("campo de estado da instituição mantém restrições esperadas", () => {
  const estado = FIELD_SECTIONS
    .flatMap((section) => section.fields)
    .find((field) => field.name === "estado");

  assert.ok(estado);
  assert.equal(estado.label, "Estado / UF da instituição");
  assert.equal(estado.attributes.maxlength, "2");
  assert.equal(estado.attributes.autocapitalize, "characters");
});
