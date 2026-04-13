const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STORAGE_KEY,
  DEBUG_STORAGE_KEY,
  MESSAGE_TYPE,
  CANDIDATE_FIELD_SELECTOR,
  CHECKOUT_IFRAME_SELECTOR,
  CHECKOUT_FIELD_SELECTOR,
  BLOCKED_FIELD_KEYWORDS
} = require("../shared/content-config.js");

test("content-config expõe as chaves principais esperadas", () => {
  assert.equal(STORAGE_KEY, "formlyProfile");
  assert.equal(DEBUG_STORAGE_KEY, "formlyDebug");
  assert.equal(MESSAGE_TYPE, "FORMLY_FILL_PAGE");
});

test("content-config mantém os seletores principais de campos candidatos", () => {
  assert.match(CANDIDATE_FIELD_SELECTOR, /input\[type='text'\]/);
  assert.match(CANDIDATE_FIELD_SELECTOR, /input\[type='email'\]/);
  assert.match(CANDIDATE_FIELD_SELECTOR, /input\[type='tel'\]/);
  assert.match(CANDIDATE_FIELD_SELECTOR, /textarea/);
  assert.match(CANDIDATE_FIELD_SELECTOR, /select/);
});

test("content-config mantém os seletores principais de checkout", () => {
  assert.match(CHECKOUT_IFRAME_SELECTOR, /mercadopago/);
  assert.match(CHECKOUT_IFRAME_SELECTOR, /secure-fields/);
  assert.match(CHECKOUT_FIELD_SELECTOR, /\[data-checkout\]/);
  assert.match(CHECKOUT_FIELD_SELECTOR, /#cardNumber/);
  assert.match(CHECKOUT_FIELD_SELECTOR, /#securityCode/);
  assert.match(CHECKOUT_FIELD_SELECTOR, /#installments/);
});

test("content-config mantém palavras bloqueadas sensíveis essenciais", () => {
  assert.ok(BLOCKED_FIELD_KEYWORDS.includes("password"));
  assert.ok(BLOCKED_FIELD_KEYWORDS.includes("senha"));
  assert.ok(BLOCKED_FIELD_KEYWORDS.includes("checkout"));
  assert.ok(BLOCKED_FIELD_KEYWORDS.includes("pagamento"));
  assert.ok(BLOCKED_FIELD_KEYWORDS.includes("captcha"));
});
