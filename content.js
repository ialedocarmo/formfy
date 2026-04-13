(function () {
  const config = window.formlyContentConfig;
  const heuristics = window.formlyContentHeuristics;

  if (!config) {
    console.error("[formly] Modulo de configuracao do content script nao foi carregado antes do content.js.");
    return;
  }

  if (!heuristics) {
    console.error("[formly] Modulo de heuristicas nao foi carregado antes do content script.");
    return;
  }

  const {
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
  } = config;

  const {
    FIELD_DEFINITIONS,
    MIN_SCORE_GAP,
    normalizeText,
    includesTerm,
    createMetadata,
    rankFieldMatches,
    compareCandidatePriority,
    isAmbiguousMatch,
    resolveFillValue,
    valuesLookEquivalent,
    isCheckoutLikeFormData
  } = heuristics;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== MESSAGE_TYPE) {
      return false;
    }

    fillPage()
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error(`${LOG_PREFIX} Erro inesperado ao preencher a pagina:`, error);
        sendResponse({
          success: false,
          message: "Ocorreu um erro ao tentar preencher a pagina atual."
        });
      });

    return true;
  });

  async function fillPage() {
    const stored = await chrome.storage.local.get([STORAGE_KEY, DEBUG_STORAGE_KEY]);
    const profile = stored[STORAGE_KEY] || {};
    const debugEnabled = Boolean(stored[DEBUG_STORAGE_KEY]);

    if (!hasAnyValue(profile)) {
      return {
        success: false,
        message: "Nenhum dado salvo foi encontrado no armazenamento local."
      };
    }

    const checkoutBlock = detectCheckoutContext();
    if (checkoutBlock.detected) {
      logWarn(debugEnabled, `${LOG_PREFIX} Checkout detectado e bloqueado por seguranca:`, checkoutBlock.reason);
      return {
        success: false,
        message: "Checkout ou pagamento detectado. O preenchimento foi bloqueado por seguranca."
      };
    }

    const fields = getCandidateFields();
    logGroupStart(debugEnabled, `${LOG_PREFIX} Analise de campos`);

    const analysisResults = fields.map((field) => analyzeField(field, profile));
    analysisResults.forEach((result) => logAnalysis(result, debugEnabled));

    const filledResults = fillBestMatches(analysisResults, profile, debugEnabled);
    logGroupEnd(debugEnabled);

    if (filledResults.length === 0) {
      return {
        success: false,
        message: "Nenhum campo compativel e seguro foi preenchido nesta pagina."
      };
    }

    return {
      success: true,
      message: `${filledResults.length} campo(s) preenchido(s) com seguranca na pagina atual.`
    };
  }

  function getCandidateFields() {
    return Array.from(document.querySelectorAll(CANDIDATE_FIELD_SELECTOR));
  }

  function detectCheckoutContext() {
    const forms = Array.from(document.querySelectorAll("form"));

    for (const form of forms) {
      if (isCheckoutLikeForm(form)) {
        return {
          detected: true,
          reason: `form#${form.id || "sem-id"}`
        };
      }
    }

    const secureIframe = document.querySelector(CHECKOUT_IFRAME_SELECTOR);
    const checkoutField = document.querySelector(CHECKOUT_FIELD_SELECTOR);

    if (secureIframe && checkoutField) {
      return {
        detected: true,
        reason: "campos seguros de pagamento detectados"
      };
    }

    return { detected: false, reason: "" };
  }

  function isCheckoutLikeForm(form) {
    return isCheckoutLikeFormData({
      id: form.id,
      name: form.getAttribute("name"),
      className: form.className,
      text: form.innerText || form.textContent || "",
      hasSecureIframe: form.querySelector(CHECKOUT_IFRAME_SELECTOR) !== null,
      hasCheckoutAttribute: form.querySelector("[data-checkout]") !== null,
      hasPaymentField: form.querySelector(CHECKOUT_FIELD_SELECTOR.replace("[data-checkout], ", "")) !== null
    });
  }

  function analyzeField(field, profile) {
    const metadata = buildFieldMetadata(field);
    const safeCheck = isFieldSafe(field, metadata);

    if (!safeCheck.safe) {
      return {
        field,
        metadata,
        ignored: true,
        ignoreReason: safeCheck.reason,
        bestMatch: null,
        secondBestMatch: null,
        scoreMap: {}
      };
    }

    const descriptor = {
      tagName: field.tagName.toLowerCase(),
      inputType: getNormalizedType(field)
    };
    const scoreEntries = rankFieldMatches(metadata, descriptor).filter((entry) => {
      const definition = FIELD_DEFINITIONS[entry.fieldType];
      const storedValue = definition ? String(profile[definition.dataKey] || "").trim() : "";
      return Boolean(storedValue);
    });

    return {
      field,
      metadata,
      ignored: false,
      ignoreReason: "",
      bestMatch: scoreEntries[0] || null,
      secondBestMatch: scoreEntries[1] || null,
      scoreMap: Object.fromEntries(scoreEntries.map((entry) => [entry.fieldType, entry.score]))
    };
  }

  function buildFieldMetadata(field) {
    const labelText = getAssociatedLabelText(field);
    const nearestContainerText = getNearestContainerText(field);
    const extraAttributes = [
      field.getAttribute("data-label"),
      field.getAttribute("data-name"),
      field.getAttribute("data-field"),
      field.getAttribute("data-testid"),
      field.getAttribute("data-qa"),
      field.getAttribute("autocomplete"),
      field.getAttribute("x-autocompletetype")
    ].filter(Boolean);

    const form = field.closest("form");
    const metadata = createMetadata({
      tagName: field.tagName.toLowerCase(),
      idText: field.id,
      nameText: field.name,
      placeholderText: field.placeholder,
      ariaLabelText: field.getAttribute("aria-label"),
      labelText,
      nearestContainerText,
      autocompleteText: field.getAttribute("autocomplete"),
      classText: field.className,
      roleText: field.getAttribute("role"),
      dataText: extraAttributes.join(" | "),
      formIdText: form ? form.id : "",
      formNameText: form ? form.getAttribute("name") : "",
      formClassText: form ? form.className : "",
      sectionText: getSectionText(field),
      isVisible: isFieldActuallyVisible(field),
      isInHolderForm: Boolean(field.closest("#holderForm")),
      isInCompanionForm: Boolean(field.closest("[id*='Companion'], [name*='Companion'], #companionForm"))
    });

    return {
      ...metadata,
      descriptor: getFieldDescriptor(field)
    };
  }

  function isFieldSafe(field, metadata) {
    if (!field || !(field instanceof HTMLElement)) {
      return { safe: false, reason: "Elemento invalido." };
    }

    if (field instanceof HTMLInputElement && field.type === "password") {
      return { safe: false, reason: "Campo de senha bloqueado." };
    }

    if (field.hidden || field.disabled || field.readOnly) {
      return { safe: false, reason: "Campo hidden, disabled ou readonly." };
    }

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden") {
      return { safe: false, reason: "Campo oculto por CSS." };
    }

    if (!metadata.combinedText) {
      return { safe: false, reason: "Sem pistas textuais suficientes." };
    }

    const blockedKeyword = BLOCKED_FIELD_KEYWORDS.find((keyword) => includesTerm(metadata.combinedText, keyword));

    if (blockedKeyword) {
      return {
        safe: false,
        reason: `Campo sensivel bloqueado por palavra-chave: ${blockedKeyword}.`
      };
    }

    return { safe: true, reason: "" };
  }

  function fillBestMatches(analysisResults, profile, debugEnabled) {
    const assignmentMap = new Map();
    const separatedNameFields = new Set();

    for (const result of analysisResults) {
      if (result.ignored || !result.bestMatch || result.bestMatch.score < MIN_SCORE_TO_FILL) {
        continue;
      }

      if (isAmbiguousMatch(result, MIN_SCORE_GAP)) {
        logInfo(debugEnabled, `${LOG_PREFIX} Campo ignorado por ambiguidade:`, {
          campo: result.metadata.descriptor,
          melhor: result.bestMatch,
          segundo: result.secondBestMatch
        });
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
      candidates.sort((left, right) => compareCandidatePriority(left, right));
      const bestCandidate = candidates[0];
      if (!bestCandidate) {
        continue;
      }

      const value = resolveFillValue(fieldType, {
        tagName: bestCandidate.field.tagName,
        inputType: getNormalizedType(bestCandidate.field),
        options: bestCandidate.field instanceof HTMLSelectElement ? Array.from(bestCandidate.field.options) : []
      }, profile, separatedNameFields);

      if (!value) {
        logInfo(debugEnabled, `${LOG_PREFIX} Campo nao preenchido por falta de valor salvo:`, bestCandidate.metadata.descriptor);
        continue;
      }

      const applied = applyValue(bestCandidate.field, value);
      logInfo(debugEnabled, `${LOG_PREFIX} Campo preenchido:`, {
        campo: bestCandidate.metadata.descriptor,
        tipoDetectado: fieldType,
        score: bestCandidate.bestMatch.score,
        valorAplicado: value,
        sucesso: applied
      });

      filledResults.push(bestCandidate);
    }

    return filledResults;
  }

  function applyValue(field, value) {
    if (field instanceof HTMLSelectElement) {
      return applySelectValue(field, value);
    }

    return applyInputLikeValue(field, value);
  }

  function applyInputLikeValue(field, value) {
    try {
      field.focus();
      const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      if (setter) {
        setter.call(field, value);
      } else {
        field.value = value;
      }

      field.setAttribute("value", value);
      field.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      field.dispatchEvent(new Event("blur", { bubbles: true }));
      return valuesLookEquivalent(field.value, value);
    } catch (error) {
      console.error(`${LOG_PREFIX} Falha ao aplicar valor em input:`, error);
      return false;
    }
  }

  function applySelectValue(field, value) {
    try {
      field.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;

      if (setter) {
        setter.call(field, value);
      } else {
        field.value = value;
      }

      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      field.dispatchEvent(new Event("blur", { bubbles: true }));
      return valuesLookEquivalent(field.value, value);
    } catch (error) {
      console.error(`${LOG_PREFIX} Falha ao aplicar valor em select:`, error);
      return false;
    }
  }

  function getAssociatedLabelText(field) {
    const labels = [];

    if (field.labels && field.labels.length > 0) {
      labels.push(...Array.from(field.labels).map((label) => label.innerText || label.textContent || ""));
    }

    if (field.id) {
      const safeId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(field.id) : field.id;
      labels.push(
        ...Array.from(document.querySelectorAll(`label[for="${safeId}"]`)).map(
          (label) => label.innerText || label.textContent || ""
        )
      );
    }

    const parentLabel = field.closest("label");
    if (parentLabel) {
      labels.push(parentLabel.innerText || parentLabel.textContent || "");
    }

    return labels.map((text) => normalizeWhitespace(text)).filter(Boolean).join(" | ");
  }

  function getNearestContainerText(field) {
    const candidates = [
      field.closest("[data-field]"),
      field.closest("[data-testid]"),
      field.closest(".field"),
      field.closest(".form-group"),
      field.closest(".floating-label-wrap"),
      field.closest(".input-group"),
      field.closest("fieldset"),
      field.parentElement,
      field.closest("div"),
      field.closest("section"),
      field.closest("li")
    ].filter(Boolean);

    for (const container of candidates) {
      const text = normalizeWhitespace(container.innerText || container.textContent || "");
      if (text) {
        return text.slice(0, MAX_CONTAINER_TEXT_LENGTH);
      }
    }

    return "";
  }

  function getSectionText(field) {
    const sectionCandidates = [
      field.closest("fieldset"),
      field.closest("section"),
      field.closest("form"),
      field.closest("[role='group']")
    ].filter(Boolean);

    for (const candidate of sectionCandidates) {
      const headings = Array.from(candidate.querySelectorAll("legend, h1, h2, h3, h4, h5, h6, .title, .subtitle"))
        .map((element) => normalizeWhitespace(element.innerText || element.textContent || ""))
        .filter(Boolean);

      if (headings.length > 0) {
        return headings.join(" | ").slice(0, MAX_CONTAINER_TEXT_LENGTH);
      }
    }

    return "";
  }

  function isFieldActuallyVisible(field) {
    if (!(field instanceof HTMLElement)) {
      return false;
    }

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }

    const rect = field.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getNormalizedType(field) {
    if (field instanceof HTMLTextAreaElement) {
      return "textarea";
    }

    return String(field.getAttribute("type") || "").toLowerCase();
  }

  function getFieldDescriptor(field) {
    const pieces = [
      field.tagName.toLowerCase(),
      field.id ? `#${field.id}` : "",
      field.name ? `[name="${field.name}"]` : "",
      field.placeholder ? `(placeholder="${field.placeholder}")` : ""
    ].filter(Boolean);

    return pieces.join("");
  }

  function hasAnyValue(profile) {
    return Object.values(profile).some((value) => String(value || "").trim());
  }

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function logAnalysis(result, debugEnabled) {
    if (!debugEnabled) {
      return;
    }

    if (result.ignored) {
      console.info(`${LOG_PREFIX} Campo ignorado:`, {
        campo: result.metadata.descriptor,
        motivo: result.ignoreReason
      });
      return;
    }

    console.info(`${LOG_PREFIX} Campo analisado:`, {
      campo: result.metadata.descriptor,
      texto: result.metadata.combinedText,
      score: result.scoreMap,
      melhorCorrespondencia: result.bestMatch,
      segundaMelhor: result.secondBestMatch,
      visivel: result.metadata.isVisible,
      holderForm: result.metadata.isInHolderForm,
      form: result.metadata.formIdText || result.metadata.formNameText || ""
    });
  }

  function logInfo(debugEnabled, ...args) {
    if (debugEnabled) {
      console.info(...args);
    }
  }

  function logWarn(debugEnabled, ...args) {
    if (debugEnabled) {
      console.warn(...args);
    }
  }

  function logGroupStart(debugEnabled, label) {
    if (debugEnabled) {
      console.groupCollapsed(label);
    }
  }

  function logGroupEnd(debugEnabled) {
    if (debugEnabled) {
      console.groupEnd();
    }
  }
})();
