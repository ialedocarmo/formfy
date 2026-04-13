const test = require("node:test");
const assert = require("node:assert/strict");
const popupSearch = require("../shared/popup-search.js");
const popupRuntime = require("../shared/popup-runtime.js");
const {
  FALLBACK_INIT_MESSAGES,
  FALLBACK_STATUS_MESSAGES,
  resolveRuntimeBindings,
  getBootState
} = require("../shared/popup-boot.js");

test("resolveRuntimeBindings reaproveita as APIs reais de search e runtime quando disponíveis", () => {
  const bindings = resolveRuntimeBindings({ popupSearch, popupRuntime });

  assert.equal(bindings.runtimeStatusMessages, popupRuntime.STATUS_MESSAGES);
  assert.equal(bindings.initMessages, popupRuntime.INIT_MESSAGES);
  assert.equal(bindings.normalizeText, popupSearch.normalizeText);
  assert.equal(bindings.matchesSearchTerm, popupSearch.matchesSearchTerm);
  assert.equal(bindings.getMissingKeys, popupRuntime.getMissingKeys);
  assert.equal(bindings.getInitializationIssue, popupRuntime.getInitializationIssue);
  assert.equal(bindings.isUnsupportedTab, popupRuntime.isUnsupportedTab);
  assert.equal(bindings.resolveFillErrorMessage, popupRuntime.resolveFillErrorMessage);
  assert.equal(bindings.getFillStatusFromResponse, popupRuntime.getFillStatusFromResponse);
  assert.equal(bindings.buildSearchViewState, popupRuntime.buildSearchViewState);
});

test("resolveRuntimeBindings fornece fallbacks coerentes quando módulos compartilhados não carregam", () => {
  const bindings = resolveRuntimeBindings({ popupSearch: null, popupRuntime: null });

  assert.deepEqual(bindings.runtimeStatusMessages, FALLBACK_STATUS_MESSAGES);
  assert.deepEqual(bindings.initMessages, FALLBACK_INIT_MESSAGES);
  assert.equal(bindings.normalizeText("  CPF "), "cpf");
  assert.equal(bindings.matchesSearchTerm("Campo CPF", "cpf"), true);
  assert.deepEqual(bindings.getMissingKeys({ form: {}, fillButton: null }), ["fillButton"]);
  assert.deepEqual(bindings.getFillStatusFromResponse({ success: false }), {
    type: "error",
    message: FALLBACK_INIT_MESSAGES.unavailableAction
  });
  assert.equal(bindings.buildSearchViewState("cpf", [0, 0]).showNoResults, true);
});

test("getBootState entra em modo degradado quando há elementos ausentes", () => {
  const bindings = resolveRuntimeBindings({ popupSearch, popupRuntime });
  const bootState = getBootState({
    elements: {
      form: {},
      fillButton: null,
      fillStatusMessage: {},
      saveStatusMessage: {},
      debugToggle: {},
      fieldSearch: {},
      sectionsContainer: {},
      noResultsMessage: {}
    },
    hasDependencies: false,
    getMissingKeys: bindings.getMissingKeys,
    getInitializationIssue: bindings.getInitializationIssue,
    initMessages: bindings.initMessages
  });

  assert.equal(bootState.canBoot, false);
  assert.deepEqual(bootState.missingElementNames, ["fillButton"]);
  assert.deepEqual(bootState.initializationIssue, {
    reason: "missing-elements",
    message: popupRuntime.INIT_MESSAGES.missingElements,
    missingElementNames: ["fillButton"]
  });
});

test("getBootState entra em modo degradado quando faltam dependências, mesmo com DOM íntegro", () => {
  const bindings = resolveRuntimeBindings({ popupSearch, popupRuntime });
  const bootState = getBootState({
    elements: {
      form: {},
      fillButton: {},
      fillStatusMessage: {},
      saveStatusMessage: {},
      debugToggle: {},
      fieldSearch: {},
      sectionsContainer: {},
      noResultsMessage: {}
    },
    hasDependencies: false,
    getMissingKeys: bindings.getMissingKeys,
    getInitializationIssue: bindings.getInitializationIssue,
    initMessages: bindings.initMessages
  });

  assert.equal(bootState.canBoot, false);
  assert.deepEqual(bootState.missingElementNames, []);
  assert.deepEqual(bootState.initializationIssue, {
    reason: "missing-dependencies",
    message: popupRuntime.INIT_MESSAGES.missingDependencies,
    missingElementNames: []
  });
});

test("getBootState permanece consistente no caminho feliz de inicialização", () => {
  const bindings = resolveRuntimeBindings({ popupSearch, popupRuntime });
  const bootState = getBootState({
    elements: {
      form: {},
      fillButton: {},
      fillStatusMessage: {},
      saveStatusMessage: {},
      debugToggle: {},
      fieldSearch: {},
      sectionsContainer: {},
      noResultsMessage: {}
    },
    hasDependencies: true,
    getMissingKeys: bindings.getMissingKeys,
    getInitializationIssue: bindings.getInitializationIssue,
    initMessages: bindings.initMessages
  });

  assert.equal(bootState.canBoot, true);
  assert.deepEqual(bootState.missingElementNames, []);
  assert.equal(bootState.initializationIssue, null);
});
