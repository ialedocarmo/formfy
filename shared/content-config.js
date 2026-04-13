(function (globalScope) {
  // Storage
  const STORAGE_KEY = "formlyProfile";
  const DEBUG_STORAGE_KEY = "formlyDebug";

  // Messaging
  const MESSAGE_TYPE = "FORMLY_FILL_PAGE";
  const LOG_PREFIX = "[formly]";

  // Matching
  const MAX_CONTAINER_TEXT_LENGTH = 240;
  const MIN_SCORE_TO_FILL = 78;

  // Selectors
  const CANDIDATE_FIELD_SELECTOR = [
    "input[type='text']",
    "input[type='email']",
    "input[type='tel']",
    "input[type='date']",
    "input:not([type])",
    "textarea",
    "select"
  ].join(", ");

  const CHECKOUT_IFRAME_SELECTOR = "iframe[src*='mercadopago'], iframe[src*='secure-fields'], iframe[name='cardNumber'], iframe[name='securityCode'], iframe[name='expirationDate']";
  const CHECKOUT_FIELD_SELECTOR = "[data-checkout], #cardNumber, #securityCode, #expirationDate, #installments, #docType, #docNumber";

  // Safety
  const BLOCKED_FIELD_KEYWORDS = [
    "password",
    "senha",
    "cartao",
    "card number",
    "numero do cartao",
    "cvv",
    "cvc",
    "pix",
    "banco",
    "bank",
    "agencia",
    "conta",
    "payment",
    "pagamento",
    "checkout",
    "otp",
    "token",
    "captcha",
    "verification code",
    "codigo de verificacao",
    "autenticacao",
    "authentication",
    "2fa",
    "one time password"
  ];

  const api = {
    STORAGE_KEY,
    DEBUG_STORAGE_KEY,
    MESSAGE_TYPE,
    MAX_CONTAINER_TEXT_LENGTH,
    MIN_SCORE_TO_FILL,
    LOG_PREFIX,
    CANDIDATE_FIELD_SELECTOR,
    CHECKOUT_IFRAME_SELECTOR,
    CHECKOUT_FIELD_SELECTOR,
    BLOCKED_FIELD_KEYWORDS
  };

  globalScope.formlyContentConfig = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
