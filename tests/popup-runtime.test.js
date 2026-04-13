const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STATUS_MESSAGES,
  INIT_MESSAGES,
  isUnsupportedTab,
  getMissingKeys,
  getInitializationIssue,
  resolveFillErrorMessage,
  getFillStatusFromResponse,
  buildSearchViewState
} = require("../shared/popup-runtime.js");

test("isUnsupportedTab detecta páginas internas e não bloqueia páginas web comuns", () => {
  assert.equal(isUnsupportedTab({ url: "chrome://extensions" }), true);
  assert.equal(isUnsupportedTab({ url: "edge://settings" }), true);
  assert.equal(isUnsupportedTab({ url: "file:///tmp/test.html" }), true);
  assert.equal(isUnsupportedTab({ url: "https://www.ticketmaster.com.br" }), false);
});

test("getMissingKeys retorna apenas os nomes dos elementos ausentes", () => {
  const missing = getMissingKeys({
    form: {},
    fillButton: null,
    fillStatusMessage: undefined,
    saveStatusMessage: {}
  });

  assert.deepEqual(missing, ["fillButton", "fillStatusMessage"]);
});

test("getInitializationIssue prioriza elementos ausentes antes de dependências", () => {
  const issue = getInitializationIssue({
    missingElementNames: ["form", "fillButton"],
    hasDependencies: false,
    initMessages: INIT_MESSAGES
  });

  assert.deepEqual(issue, {
    reason: "missing-elements",
    message: INIT_MESSAGES.missingElements,
    missingElementNames: ["form", "fillButton"]
  });
});

test("getInitializationIssue detecta dependências ausentes quando o DOM está íntegro", () => {
  const issue = getInitializationIssue({
    missingElementNames: [],
    hasDependencies: false,
    initMessages: INIT_MESSAGES
  });

  assert.deepEqual(issue, {
    reason: "missing-dependencies",
    message: INIT_MESSAGES.missingDependencies,
    missingElementNames: []
  });
});

test("getInitializationIssue retorna null quando popup pode iniciar normalmente", () => {
  const issue = getInitializationIssue({
    missingElementNames: [],
    hasDependencies: true,
    initMessages: INIT_MESSAGES
  });

  assert.equal(issue, null);
});

test("resolveFillErrorMessage retorna mensagem específica para content script indisponível", () => {
  const message = resolveFillErrorMessage(
    { url: "https://www.ticketmaster.com.br" },
    new Error("Could not establish connection. Receiving end does not exist.")
  );

  assert.equal(message, STATUS_MESSAGES.fillContentUnavailable);
});

test("resolveFillErrorMessage retorna mensagem específica para página restrita", () => {
  const message = resolveFillErrorMessage(
    { url: "https://example.com" },
    new Error("Cannot access contents of the page. Extension manifest must request permission to access the respective host.")
  );

  assert.equal(message, STATUS_MESSAGES.fillRestrictedPage);
});

test("resolveFillErrorMessage retorna mensagem específica para checkout bloqueado", () => {
  const message = resolveFillErrorMessage(
    { url: "https://example.com" },
    new Error("Checkout ou pagamento detectado")
  );

  assert.equal(message, STATUS_MESSAGES.fillCheckoutBlocked);
});

test("getFillStatusFromResponse usa fallback apropriado para sucesso e erro", () => {
  assert.deepEqual(getFillStatusFromResponse({ success: true }), {
    type: "success",
    message: STATUS_MESSAGES.fillSuccessFallback
  });

  assert.deepEqual(getFillStatusFromResponse({ success: false }), {
    type: "error",
    message: STATUS_MESSAGES.fillEmptyFallback
  });

  assert.deepEqual(getFillStatusFromResponse(null), {
    type: "error",
    message: STATUS_MESSAGES.fillNoResponse
  });
});

test("buildSearchViewState mostra no-results só quando há busca ativa sem campos visíveis", () => {
  const hiddenState = buildSearchViewState("cpf", [0, 0]);
  assert.equal(hiddenState.hasSearch, true);
  assert.equal(hiddenState.showNoResults, true);
  assert.deepEqual(hiddenState.sections.map((section) => section.open), [false, false]);

  const visibleState = buildSearchViewState("curso", [0, 2]);
  assert.equal(visibleState.hasSearch, true);
  assert.equal(visibleState.showNoResults, false);
  assert.deepEqual(visibleState.sections.map((section) => section.open), [false, true]);

  const idleState = buildSearchViewState("", [0, 0]);
  assert.equal(idleState.hasSearch, false);
  assert.equal(idleState.showNoResults, false);
  assert.deepEqual(idleState.sections.map((section) => section.open), [null, null]);
});
