const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeText, splitSearchTerms, splitSearchGroups, matchesSearchTerm } = require("../shared/popup-search.js");

test("normalizeText remove acentos e padroniza para minúsculas", () => {
  assert.equal(normalizeText("Instituição de Ensino"), "instituicao de ensino");
  assert.equal(normalizeText("  CPF  "), "cpf");
});

test("splitSearchTerms separa busca em múltiplos termos normalizados", () => {
  assert.deepEqual(splitSearchTerms("  CPF   instituição  "), ["cpf", "instituicao"]);
  assert.deepEqual(splitSearchTerms(""), []);
});

test("splitSearchGroups separa grupos por pipe preservando termos internos", () => {
  assert.deepEqual(splitSearchGroups("cidade instituicao | curso"), [["cidade", "instituicao"], ["curso"]]);
  assert.deepEqual(splitSearchGroups(" |  "), []);
});

test("splitSearchGroups ignora pipes duplicados e grupos vazios", () => {
  assert.deepEqual(splitSearchGroups("cidade || curso"), [["cidade"], ["curso"]]);
  assert.deepEqual(splitSearchGroups("|| cidade ||| curso ||"), [["cidade"], ["curso"]]);
});

test("matchesSearchTerm encontra termos compatíveis do popup", () => {
  const searchText = "cidade da instituição | cidade | instituicaoEnsino";

  assert.equal(matchesSearchTerm(searchText, "instituição"), true);
  assert.equal(matchesSearchTerm(searchText, "cidade"), true);
  assert.equal(matchesSearchTerm(searchText, "curso"), false);
});

test("matchesSearchTerm exige que todos os termos de uma busca múltipla apareçam", () => {
  const searchText = "cidade da instituição | cidade | instituicaoEnsino";

  assert.equal(matchesSearchTerm(searchText, "cidade instituição"), true);
  assert.equal(matchesSearchTerm(searchText, "cidade curso"), false);
});

test("matchesSearchTerm aceita grupos alternativos com pipe como OU", () => {
  const searchText = "cidade da instituição | cidade | instituicaoEnsino";

  assert.equal(matchesSearchTerm(searchText, "curso | cidade"), true);
  assert.equal(matchesSearchTerm(searchText, "cpf | curso"), false);
  assert.equal(matchesSearchTerm(searchText, "cidade instituicao | curso"), true);
});

test("matchesSearchTerm tolera espaços estranhos e termos vazios misturados", () => {
  const searchText = "cidade da instituição | cidade | instituicaoEnsino";

  assert.equal(matchesSearchTerm(searchText, "  cidade    |   "), true);
  assert.equal(matchesSearchTerm(searchText, "   |   curso   |   cidade   "), true);
  assert.equal(matchesSearchTerm(searchText, "   |   curso   |   cpf   "), false);
});

test("matchesSearchTerm aceita busca vazia para exibir todos os campos", () => {
  assert.equal(matchesSearchTerm("nome completo | nomeCompleto", ""), true);
});
