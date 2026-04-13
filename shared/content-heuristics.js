(function (globalScope) {
  // Matching thresholds
  const MIN_SCORE_GAP = 12;

  // Field heuristics
  const FIELD_DEFINITIONS = {
    nome: {
      dataKey: "nome",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", ""],
      ids: ["firstname", "first", "givenname", "given_name", "nome"],
      names: ["firstname", "first_name", "first", "givenname", "given_name", "nome"],
      labels: ["nome", "primeiro nome", "first name", "given name", "forename"],
      aliases: ["first", "first_name", "firstname", "given_name", "givenname", "forename", "nome"],
      autocompleteHints: ["given-name"],
      negatives: ["sobrenome", "lastname", "surname", "familyname", "full name", "nome completo"],
      priority: 100
    },
    sobrenome: {
      dataKey: "sobrenome",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", ""],
      ids: ["lastname", "last", "surname", "familyname", "family_name", "sobrenome"],
      names: ["lastname", "last_name", "last", "surname", "familyname", "family_name", "sobrenome"],
      labels: ["sobrenome", "last name", "surname", "family name", "apellido"],
      aliases: ["last", "last_name", "lastname", "surname", "familyname", "family_name", "sobrenome", "apellido"],
      autocompleteHints: ["family-name"],
      negatives: ["firstname", "given name", "primeiro nome", "nome completo", "full name"],
      priority: 100
    },
    nomeCompleto: {
      dataKey: "nomeCompleto",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", ""],
      ids: ["fullname", "full_name", "complete_name", "nomecompleto", "name"],
      names: ["fullname", "full_name", "complete_name", "nomecompleto", "name", "customername"],
      labels: ["nome completo", "full name", "complete name", "name"],
      aliases: ["fullname", "full_name", "name", "customername", "nomecompleto"],
      autocompleteHints: ["name"],
      negatives: ["firstname", "lastname", "sobrenome", "primeiro nome", "family name", "surname", "instituicao", "instituição", "course", "curso"],
      priority: 92
    },
    email: {
      dataKey: "email",
      elementTypes: ["input", "textarea"],
      inputTypes: ["email", "text", ""],
      ids: ["email", "mail", "c2email", "username"],
      names: ["email", "mail", "username"],
      labels: ["email", "e-mail", "mail"],
      aliases: ["email", "e-mail", "mail", "username"],
      autocompleteHints: ["email", "username"],
      negatives: ["codigo", "code", "verification", "token"],
      priority: 108
    },
    telefone: {
      dataKey: "telefone",
      elementTypes: ["input", "textarea"],
      inputTypes: ["tel", "text", ""],
      ids: ["phone", "telefone", "celular", "mobile", "whatsapp"],
      names: ["phone", "telefone", "celular", "mobile", "whatsapp"],
      labels: ["telefone", "celular", "whatsapp", "phone", "mobile"],
      aliases: ["phone", "telefone", "celular", "mobile", "whatsapp", "contato"],
      autocompleteHints: ["tel", "tel-national", "tel-country-code"],
      contextKeywords: ["telefone", "celular", "whatsapp", "phone", "mobile"],
      negatives: ["country", "codigo", "code"],
      priority: 104
    },
    cpf: {
      dataKey: "cpf",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", ""],
      ids: ["cpf", "documentnumber", "document_number", "docnumber", "doc_number", "dni"],
      names: ["cpf", "documentnumber", "document_number", "docnumber", "doc_number", "dni"],
      labels: ["cpf", "documento", "cadastro de pessoa fisica"],
      aliases: ["cpf", "documentnumber", "docnumber", "dni", "documento", "nrdocumento"],
      autocompleteHints: [],
      contextKeywords: ["cpf", "documento", "doc", "dni"],
      negatives: ["repeatdocumentnumber", "repita o numero do documento", "cie", "cnpj", "passport", "passaporte"],
      priority: 110
    },
    dataNascimento: {
      dataKey: "dataNascimento",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", "date", ""],
      ids: ["dateofbirth", "birthdate", "birth_date", "datanascimento", "dob"],
      names: ["dateofbirth", "birthdate", "birth_date", "datanascimento", "dob"],
      labels: ["data de nascimento", "date of birth", "birth date", "birthday", "nascimento", "dd/mm/aaaa"],
      aliases: ["dateofbirth", "birthdate", "birth_date", "dob", "datanascimento", "nascimento", "ddmmaaaa"],
      autocompleteHints: ["bday", "bday-day", "bday-month", "bday-year"],
      contextKeywords: ["nascimento", "birth", "birthday", "date of birth", "dd/mm/aaaa"],
      negatives: ["expiracao", "validade", "validity", "expiry", "expiration", "vencimento"],
      priority: 114
    },
    documentoEstudantil: {
      dataKey: "documentoEstudantil",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", ""],
      ids: ["cie", "studentdocument", "student_document", "matricula", "registrationnumber", "ra"],
      names: ["cie", "studentdocument", "student_document", "matricula", "registrationnumber", "ra"],
      labels: ["cie", "documento estudantil", "carteira estudantil", "matricula estudantil", "matricula", "registro academico", "ra"],
      aliases: ["cie", "studentdocument", "matricula", "registroacademico", "ra"],
      autocompleteHints: [],
      contextKeywords: ["cie", "estudantil", "matricula", "academico", "ra"],
      negatives: ["cpf", "documento", "codigo", "verification"],
      priority: 112
    },
    dataExpiracao: {
      dataKey: "dataExpiracao",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", "date", ""],
      ids: ["validitydate", "expirationdate", "expirydate", "expiry_date", "validade"],
      names: ["validitydate", "expirationdate", "expirydate", "expiry_date", "validade"],
      labels: ["data de expiracao", "data de expiração", "data de validade", "validade", "validity", "expiration", "expiry"],
      aliases: ["validitydate", "expirationdate", "expirydate", "expiry_date", "validade", "expiracao"],
      autocompleteHints: [],
      contextKeywords: ["validade", "validity", "expiration", "expiry", "expiracao", "expiração"],
      negatives: ["nascimento", "birth", "birthday"],
      priority: 114
    },
    instituicaoEnsino: {
      dataKey: "instituicaoEnsino",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", "", "textarea"],
      ids: ["institutionname", "institution", "school", "college", "university", "faculdade", "escola"],
      names: ["institutionname", "institution", "school", "college", "university", "faculdade", "escola"],
      labels: ["nome da instituicao", "nome da instituição", "instituicao", "instituição", "escola", "faculdade", "universidade", "school", "college", "university"],
      aliases: ["institutionname", "institution", "school", "college", "university", "faculdade", "escola"],
      autocompleteHints: ["organization"],
      contextKeywords: ["instituicao", "instituição", "escola", "faculdade", "universidade", "school", "college", "university"],
      negatives: ["curso", "course", "campus", "nome completo", "full name"],
      priority: 110
    },
    cidade: {
      dataKey: "cidade",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", "", "textarea"],
      ids: ["city", "cidade", "municipio", "localidade"],
      names: ["city", "cidade", "municipio", "localidade"],
      labels: ["cidade", "city", "municipio", "localidade"],
      aliases: ["city", "cidade", "municipio", "localidade"],
      autocompleteHints: ["address-level2", "address-city"],
      contextKeywords: ["cidade", "city", "municipio", "localidade"],
      negatives: ["estado", "uf", "country", "pais"],
      priority: 108
    },
    estado: {
      dataKey: "estado",
      elementTypes: ["select", "input", "textarea"],
      inputTypes: ["text", "", "textarea"],
      ids: ["state", "estado", "uf", "province", "region"],
      names: ["state", "estado", "uf", "province", "region"],
      labels: ["estado", "estado / uf", "uf", "state", "province", "regiao", "região"],
      aliases: ["state", "estado", "uf", "province", "region"],
      autocompleteHints: ["address-level1"],
      contextKeywords: ["estado", "uf", "state", "province", "regiao", "região"],
      negatives: ["instituicao", "instituição", "nome da instituicao", "nome da instituição", "country", "pais"],
      priority: 110
    },
    curso: {
      dataKey: "curso",
      elementTypes: ["input", "textarea"],
      inputTypes: ["text", "", "textarea"],
      ids: ["course", "curso", "program", "programa"],
      names: ["course", "curso", "program", "programa"],
      labels: ["curso", "course", "programa", "graduacao", "graduação"],
      aliases: ["course", "curso", "program", "programa"],
      autocompleteHints: [],
      contextKeywords: ["curso", "course", "programa", "graduacao", "graduação"],
      negatives: ["instituicao", "instituição", "school", "college", "university", "nome completo", "full name"],
      priority: 108
    }
  };

  // Checkout detection
  const CHECKOUT_DETECTION_KEYWORDS = [
    "mercadopago",
    "secure-fields",
    "payment",
    "pagamento",
    "checkout",
    "cardholdername",
    "card holder",
    "cardholder",
    "card number",
    "numero do cartao",
    "securitycode",
    "security code",
    "codigo de seguranca",
    "expirationdate",
    "expirydate",
    "installments",
    "parcelas",
    "docnumber",
    "doctype"
  ];

  // Normalization helpers
  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeText(value) {
    return normalizeWhitespace(String(value || ""))
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function normalizeIdentifier(value) {
    return normalizeText(value).replace(/[^a-z0-9]/g, "");
  }

  function buildTokenSet(value) {
    const normalized = normalizeText(value);
    const tokenMatches = normalized.match(/[a-z0-9]+/g) || [];
    return new Set(tokenMatches);
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function includesTerm(haystack, needle) {
    const normalizedHaystack = normalizeText(haystack);
    const normalizedNeedle = normalizeText(needle);
    if (!normalizedHaystack || !normalizedNeedle) {
      return false;
    }

    if (normalizedNeedle.includes(" ")) {
      return normalizedHaystack.includes(normalizedNeedle);
    }

    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedNeedle)}([^a-z0-9]|$)`);
    return pattern.test(normalizedHaystack);
  }

  // Metadata and matching helpers
  function supportsField(definition, field) {
    const tagName = (field.tagName || "input").toLowerCase();
    if (!(definition.elementTypes || []).includes(tagName)) {
      return false;
    }

    if (tagName === "select") {
      return true;
    }

    return (definition.inputTypes || []).includes((field.inputType || "").toLowerCase());
  }

  function createMetadata(parts) {
    const metadata = {
      idText: normalizeText(parts.idText),
      nameText: normalizeText(parts.nameText),
      placeholderText: normalizeText(parts.placeholderText),
      ariaLabelText: normalizeText(parts.ariaLabelText),
      labelText: normalizeText(parts.labelText),
      nearestContainerText: normalizeText(parts.nearestContainerText),
      autocompleteText: normalizeText(parts.autocompleteText),
      classText: normalizeText(parts.classText),
      roleText: normalizeText(parts.roleText),
      dataText: normalizeText(parts.dataText),
      formIdText: normalizeText(parts.formIdText),
      formNameText: normalizeText(parts.formNameText),
      formClassText: normalizeText(parts.formClassText),
      sectionText: normalizeText(parts.sectionText),
      isVisible: Boolean(parts.isVisible),
      isInHolderForm: Boolean(parts.isInHolderForm),
      isInCompanionForm: Boolean(parts.isInCompanionForm),
      tagName: (parts.tagName || "input").toLowerCase()
    };

    metadata.nearestText = [
      metadata.labelText,
      metadata.nearestContainerText,
      metadata.sectionText
    ].filter(Boolean).join(" | ");

    metadata.combinedText = [
      metadata.nameText,
      metadata.idText,
      metadata.placeholderText,
      metadata.ariaLabelText,
      metadata.labelText,
      metadata.nearestContainerText,
      metadata.dataText,
      metadata.autocompleteText,
      metadata.classText,
      metadata.roleText,
      metadata.formIdText,
      metadata.formNameText,
      metadata.formClassText,
      metadata.sectionText
    ].filter(Boolean).join(" | ");

    return metadata;
  }

  function hasPositiveSignal(definition, metadata) {
    const exactIdentifiers = [normalizeIdentifier(metadata.idText), normalizeIdentifier(metadata.nameText)].filter(Boolean);
    const softIdentifiers = [
      normalizeIdentifier(metadata.placeholderText),
      normalizeIdentifier(metadata.ariaLabelText),
      normalizeIdentifier(metadata.autocompleteText),
      normalizeIdentifier(metadata.dataText)
    ].filter(Boolean);
    const combinedText = metadata.combinedText;
    const exactLabel = metadata.labelText;
    const exactAutocomplete = metadata.autocompleteText;

    const identifierSignals = [...(definition.ids || []), ...(definition.names || []), ...(definition.aliases || [])]
      .map((value) => normalizeIdentifier(value))
      .filter(Boolean)
      .some((candidate) => {
        return exactIdentifiers.includes(candidate) ||
          exactIdentifiers.some((identifier) => identifier.includes(candidate) || candidate.includes(identifier)) ||
          softIdentifiers.includes(candidate) ||
          softIdentifiers.some((identifier) => identifier.includes(candidate) || candidate.includes(identifier));
      });

    const labelSignals = (definition.labels || []).some((label) => {
      const normalized = normalizeText(label);
      return Boolean(normalized) && (
        exactLabel === normalized ||
        includesTerm(metadata.nearestText, normalized) ||
        includesTerm(combinedText, normalized)
      );
    });

    const autocompleteSignals = (definition.autocompleteHints || []).some((hint) => {
      const normalized = normalizeText(hint);
      return Boolean(normalized) && (
        exactAutocomplete === normalized ||
        includesTerm(metadata.autocompleteText, normalized)
      );
    });

    const contextSignals = (definition.contextKeywords || []).some((keyword) => {
      return includesTerm(combinedText, keyword);
    });

    return identifierSignals || labelSignals || autocompleteSignals || contextSignals;
  }

  // Scoring and ranking
  function scoreField(definition, metadata, field) {
    if (!hasPositiveSignal(definition, metadata)) {
      return 0;
    }

    let score = definition.priority || 0;
    const exactIdentifiers = [normalizeIdentifier(metadata.idText), normalizeIdentifier(metadata.nameText)].filter(Boolean);
    const softIdentifiers = [
      normalizeIdentifier(metadata.placeholderText),
      normalizeIdentifier(metadata.ariaLabelText),
      normalizeIdentifier(metadata.autocompleteText),
      normalizeIdentifier(metadata.dataText)
    ].filter(Boolean);
    const exactLabel = metadata.labelText;
    const exactAutocomplete = metadata.autocompleteText;
    const combinedText = metadata.combinedText;
    const tokenSet = buildTokenSet(combinedText);

    for (const value of [...(definition.ids || []), ...(definition.names || [])]) {
      const candidate = normalizeIdentifier(value);
      if (!candidate) {
        continue;
      }

      if (exactIdentifiers.includes(candidate)) {
        score += 96;
      } else if (exactIdentifiers.some((identifier) => identifier.includes(candidate) || candidate.includes(identifier))) {
        score += 30;
      }

      if (softIdentifiers.includes(candidate)) {
        score += 46;
      } else if (softIdentifiers.some((identifier) => identifier.includes(candidate) || candidate.includes(identifier))) {
        score += 20;
      }
    }

    for (const label of definition.labels || []) {
      const normalized = normalizeText(label);
      if (!normalized) {
        continue;
      }

      if (exactLabel === normalized) {
        score += 62;
      } else if (includesTerm(metadata.nearestText, normalized)) {
        score += normalized.includes(" ") ? 28 : 18;
      } else if (includesTerm(combinedText, normalized)) {
        score += normalized.includes(" ") ? 18 : 10;
      }
    }

    for (const alias of definition.aliases || []) {
      const aliasId = normalizeIdentifier(alias);
      if (!aliasId) {
        continue;
      }

      if (exactIdentifiers.includes(aliasId)) {
        score += 64;
      } else if (softIdentifiers.includes(aliasId)) {
        score += 30;
      } else if (softIdentifiers.some((identifier) => identifier.includes(aliasId) || aliasId.includes(identifier))) {
        score += 12;
      }
    }

    for (const hint of definition.autocompleteHints || []) {
      const normalized = normalizeText(hint);
      if (exactAutocomplete === normalized) {
        score += 44;
      } else if (includesTerm(metadata.autocompleteText, normalized)) {
        score += 24;
      }
    }

    if (definition.contextKeywords && definition.contextKeywords.length > 0) {
      const overlap = definition.contextKeywords.filter((keyword) => tokenSet.has(normalizeIdentifier(keyword))).length;
      score += overlap * 8;
      if (overlap === 0) {
        score -= 12;
      }
    }

    for (const negative of definition.negatives || []) {
      const normalized = normalizeText(negative);
      if (includesTerm(combinedText, normalized)) {
        score -= normalized.includes(" ") ? 30 : 18;
      }
    }

    if (metadata.isVisible) {
      score += 18;
    }

    if (metadata.isInHolderForm) {
      score += 120;
    }

    if (metadata.isInCompanionForm) {
      score -= 80;
    }

    if (definition.dataKey === "email" && (field.inputType || "") === "email") {
      score += 28;
    }

    if (definition.dataKey === "telefone" && (field.inputType || "") === "tel") {
      score += 28;
    }

    if ((definition.dataKey === "dataNascimento" || definition.dataKey === "dataExpiracao") && (field.inputType || "") === "date") {
      score += 20;
    }

    if (definition.dataKey === "nomeCompleto" && (tokenSet.has("firstname") || tokenSet.has("lastname") || tokenSet.has("surname"))) {
      score -= 70;
    }

    if (definition.dataKey === "cpf" && (tokenSet.has("repeatdocumentnumber") || tokenSet.has("repeat") || tokenSet.has("confirm"))) {
      score -= 260;
    }

    if (definition.dataKey === "estado" && metadata.tagName === "select") {
      score += 16;
    }

    return Math.max(score, 0);
  }

  function rankFieldMatches(parts, field) {
    const metadata = createMetadata(parts || {});
    const descriptor = {
      tagName: (field && field.tagName) || metadata.tagName || "input",
      inputType: (field && field.inputType) || ""
    };

    return Object.entries(FIELD_DEFINITIONS)
      .filter(([, definition]) => supportsField(definition, descriptor))
      .map(([fieldType, definition]) => ({
        fieldType,
        score: scoreField(definition, metadata, descriptor)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);
  }

  function compareCandidatePriority(left, right) {
    const leftHolder = left.metadata.isInHolderForm ? 1 : 0;
    const rightHolder = right.metadata.isInHolderForm ? 1 : 0;
    if (leftHolder !== rightHolder) {
      return rightHolder - leftHolder;
    }

    const leftVisible = left.metadata.isVisible ? 1 : 0;
    const rightVisible = right.metadata.isVisible ? 1 : 0;
    if (leftVisible !== rightVisible) {
      return rightVisible - leftVisible;
    }

    const leftCompanion = left.metadata.isInCompanionForm ? 1 : 0;
    const rightCompanion = right.metadata.isInCompanionForm ? 1 : 0;
    if (leftCompanion !== rightCompanion) {
      return leftCompanion - rightCompanion;
    }

    return right.bestMatch.score - left.bestMatch.score;
  }

  function isAmbiguousMatch(result, minScoreGap = MIN_SCORE_GAP) {
    return Boolean(
      result &&
      result.bestMatch &&
      result.secondBestMatch &&
      result.bestMatch.score - result.secondBestMatch.score < minScoreGap
    );
  }

  // Formatting and fill value helpers
  function parseDateParts(value) {
    const normalized = String(value || "").trim();

    let match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return { year: match[1], month: match[2], day: match[3] };
    }

    match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return { day: match[1], month: match[2], year: match[3] };
    }

    match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      return { day: match[1], month: match[2], year: match[3] };
    }

    return null;
  }

  function formatDateForField(value, field) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }

    if ((field.inputType || "") === "date") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const parsed = parseDateParts(trimmed);
      if (!parsed) {
        return trimmed;
      }

      return `${parsed.year}-${parsed.month}-${parsed.day}`;
    }

    const parsed = parseDateParts(trimmed);
    if (!parsed) {
      return trimmed;
    }

    return `${parsed.day}/${parsed.month}/${parsed.year}`;
  }

  function formatStateForSelect(value, field) {
    const normalized = String(value || "").trim().toUpperCase();
    if (!normalized || (field.tagName || "").toLowerCase() !== "select") {
      return String(value || "").trim();
    }

    const option = Array.from(field.options || []).find((item) => {
      const optionValue = String(item.value || "").trim().toUpperCase();
      const optionLabel = String(item.textContent || "").trim().toUpperCase();
      return optionValue === normalized || optionLabel === normalized;
    });

    return option ? option.value : "";
  }

  function resolveFillValue(fieldType, field, profile, separatedNameFields) {
    if (fieldType === "nomeCompleto") {
      if (separatedNameFields.has("nome") || separatedNameFields.has("sobrenome")) {
        return "";
      }

      return String(profile.nomeCompleto || "").trim();
    }

    const definition = FIELD_DEFINITIONS[fieldType];
    if (!definition) {
      return "";
    }

    const rawValue = String(profile[definition.dataKey] || "").trim();
    if (!rawValue) {
      return "";
    }

    if (fieldType === "dataNascimento" || fieldType === "dataExpiracao") {
      return formatDateForField(rawValue, field);
    }

    if (fieldType === "estado") {
      return formatStateForSelect(rawValue, field);
    }

    return rawValue;
  }

  // Fill simulation helpers
  function applySimulatedValue(field, value) {
    if ((field.tagName || "").toLowerCase() === "select") {
      field.value = value;
      return field.value === value;
    }

    field.value = value;
    return valuesLookEquivalent(field.value, value);
  }

  function valuesLookEquivalent(currentValue, expectedValue) {
    const current = String(currentValue || "").trim();
    const expected = String(expectedValue || "").trim();
    if (current === expected) {
      return true;
    }

    const currentDigits = current.replace(/\D/g, "");
    const expectedDigits = expected.replace(/\D/g, "");
    if (currentDigits && expectedDigits && currentDigits === expectedDigits) {
      return true;
    }

    return false;
  }

  function simulateFillFlow(analysisResults, profile, options = {}) {
    const minScoreToFill = options.minScoreToFill || 78;
    const minScoreGap = options.minScoreGap || MIN_SCORE_GAP;
    const assignmentMap = new Map();
    const separatedNameFields = new Set();

    for (const result of analysisResults) {
      if (result.ignored || !result.bestMatch || result.bestMatch.score < minScoreToFill) {
        continue;
      }

      if (isAmbiguousMatch(result, minScoreGap)) {
        continue;
      }

      const bucket = assignmentMap.get(result.bestMatch.fieldType) || [];
      bucket.push(result);
      assignmentMap.set(result.bestMatch.fieldType, bucket);

      if (result.bestMatch.fieldType === "nome" || result.bestMatch.fieldType === "sobrenome") {
        separatedNameFields.add(result.bestMatch.fieldType);
      }
    }

    const filledResults = [];

    for (const [fieldType, candidates] of assignmentMap.entries()) {
      candidates.sort((a, b) => compareCandidatePriority(a, b));
      const bestCandidate = candidates[0];
      if (!bestCandidate) {
        continue;
      }

      const value = resolveFillValue(fieldType, bestCandidate.field, profile, separatedNameFields);
      if (!value) {
        continue;
      }

      const success = applySimulatedValue(bestCandidate.field, value);
      filledResults.push({
        fieldType,
        field: bestCandidate.field,
        value,
        success,
        metadata: bestCandidate.metadata
      });
    }

    return filledResults;
  }

  // Checkout detection helpers
  function isCheckoutLikeFormData(formData) {
    const formText = normalizeText([
      formData.id,
      formData.name,
      formData.className,
      formData.text
    ].filter(Boolean).join(" | "));

    const matchingKeywords = CHECKOUT_DETECTION_KEYWORDS.filter((keyword) => includesTerm(formText, keyword));

    if (formData.hasSecureIframe && (formData.hasCheckoutAttribute || formData.hasPaymentField)) {
      return true;
    }

    if ((formData.hasCheckoutAttribute || formData.hasPaymentField) && matchingKeywords.length >= 1) {
      return true;
    }

    return false;
  }

  // Public API
  const api = {
    MIN_SCORE_GAP,
    FIELD_DEFINITIONS,
    CHECKOUT_DETECTION_KEYWORDS,
    normalizeText,
    normalizeIdentifier,
    includesTerm,
    createMetadata,
    scoreField,
    rankFieldMatches,
    compareCandidatePriority,
    isAmbiguousMatch,
    parseDateParts,
    formatDateForField,
    formatStateForSelect,
    resolveFillValue,
    valuesLookEquivalent,
    simulateFillFlow,
    isCheckoutLikeFormData
  };

  globalScope.formlyContentHeuristics = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
