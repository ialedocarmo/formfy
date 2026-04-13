const STORAGE_KEY = "formlyProfile";
const DEFAULT_DEBUG_STORAGE_KEY = "formlyDebug";
const FILL_MESSAGE_TYPE = "FORMLY_FILL_PAGE";

const POPUP_ERRORS = {
  missingDependencies: "[formly] Dependências do popup não foram carregadas corretamente.",
  missingElements: "[formly] Elementos obrigatórios do popup não encontrados:",
  loadFailureLog: "[formly] Falha ao carregar dados do popup:",
  saveFailureLog: "[formly] Falha ao salvar os dados:",
  debugFailureLog: "[formly] Falha ao atualizar o modo debug:",
  fillFailureLog: "[formly] Falha ao preencher a página atual:",
  activeTabNotFound: "Aba ativa não encontrada."
};

const POPUP_MESSAGES = {
  debugEnabled: "Modo debug ativado.",
  debugDisabled: "Modo debug desativado.",
  debugFailure: "Não foi possível atualizar o modo debug."
};

const popupSchema = window.formlyPopupSchema;
const popupSearch = window.formlyPopupSearch;
const popupRuntime = window.formlyPopupRuntime;
const popupBoot = window.formlyPopupBoot;
const contentConfig = window.formlyContentConfig;

const DEBUG_STORAGE_KEY = contentConfig?.DEBUG_STORAGE_KEY || DEFAULT_DEBUG_STORAGE_KEY;
const FIELD_SECTIONS = popupSchema?.FIELD_SECTIONS || [];
const getFieldNames = popupSchema?.getFieldNames || (() => []);
const fieldNames = getFieldNames();

const { resolveRuntimeBindings, getBootState } = popupBoot || createBootFallback();
const runtimeBindings = resolveRuntimeBindings({ popupSearch, popupRuntime });

const {
  runtimeStatusMessages,
  initMessages,
  normalizeText,
  matchesSearchTerm,
  getMissingKeys,
  getInitializationIssue,
  isUnsupportedTab,
  resolveFillErrorMessage,
  getFillStatusFromResponse,
  buildSearchViewState
} = runtimeBindings;

const elements = {
  form: document.getElementById("profileForm"),
  fillButton: document.getElementById("fillCurrentPage"),
  fillStatusMessage: document.getElementById("fillStatusMessage"),
  saveStatusMessage: document.getElementById("saveStatusMessage"),
  debugToggle: document.getElementById("debugToggle"),
  fieldSearch: document.getElementById("fieldSearch"),
  sectionsContainer: document.getElementById("sectionsContainer"),
  noResultsMessage: document.getElementById("noResultsMessage")
};

let fieldCards = [];
let sections = [];
let popupReady = false;

document.addEventListener("DOMContentLoaded", bootPopup);

function createBootFallback() {
  const FALLBACK_STATUS_MESSAGES = {
    loadFailure: "Não foi possível carregar os dados salvos.",
    saveSuccess: "Dados salvos localmente no navegador.",
    saveFailure: "Não foi possível salvar os dados.",
    fillUnsupportedPage: "Abra uma página web comum para usar o preenchimento."
  };

  const FALLBACK_INIT_MESSAGES = {
    missingDependencies: "O popup não carregou todos os arquivos necessários. Atualize a extensão e tente novamente.",
    missingElements: "O popup não encontrou todos os elementos necessários para funcionar.",
    unavailableSearch: "Pesquisa indisponível enquanto o popup é recuperado.",
    unavailableAction: "O popup não está pronto para executar esta ação. Atualize a extensão e tente novamente."
  };

  function fallbackNormalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function fallbackMatchesSearchTerm(text, searchTerm) {
    const normalizedSearch = fallbackNormalizeText(searchTerm);
    if (!normalizedSearch) {
      return true;
    }

    return fallbackNormalizeText(text).includes(normalizedSearch);
  }

  function fallbackGetMissingKeys(record) {
    return Object.entries(record)
      .filter(([, value]) => !value)
      .map(([key]) => key);
  }

  function fallbackGetInitializationIssue({ missingElementNames = [], hasDependencies, initMessages = FALLBACK_INIT_MESSAGES }) {
    if (missingElementNames.length > 0) {
      return {
        reason: "missing-elements",
        message: initMessages.missingElements,
        missingElementNames
      };
    }

    if (!hasDependencies) {
      return {
        reason: "missing-dependencies",
        message: initMessages.missingDependencies,
        missingElementNames: []
      };
    }

    return null;
  }

  function fallbackGetFillStatusFromResponse(response, initMessages = FALLBACK_INIT_MESSAGES) {
    return {
      type: response?.success ? "success" : "error",
      message: response?.message || initMessages.unavailableAction
    };
  }

  function fallbackBuildSearchViewState(searchTerm, visibleCounts, normalize = fallbackNormalizeText) {
    const hasSearch = normalize(searchTerm).length > 0;
    const totalVisibleCards = visibleCounts.reduce((sum, count) => sum + count, 0);

    return {
      hasSearch,
      showNoResults: hasSearch && totalVisibleCards === 0,
      sections: visibleCounts.map((count) => ({
        empty: count === 0,
        open: hasSearch ? count > 0 : null,
        visibleCards: count
      }))
    };
  }

  return {
    resolveRuntimeBindings({ popupSearch, popupRuntime }) {
      const normalizeText = popupSearch?.normalizeText || fallbackNormalizeText;
      const initMessages = popupRuntime?.INIT_MESSAGES || FALLBACK_INIT_MESSAGES;

      return {
        runtimeStatusMessages: popupRuntime?.STATUS_MESSAGES || FALLBACK_STATUS_MESSAGES,
        initMessages,
        normalizeText,
        matchesSearchTerm: popupSearch?.matchesSearchTerm || fallbackMatchesSearchTerm,
        getMissingKeys: popupRuntime?.getMissingKeys || fallbackGetMissingKeys,
        getInitializationIssue: popupRuntime?.getInitializationIssue || fallbackGetInitializationIssue,
        isUnsupportedTab: popupRuntime?.isUnsupportedTab || (() => false),
        resolveFillErrorMessage: popupRuntime?.resolveFillErrorMessage || (() => initMessages.unavailableAction),
        getFillStatusFromResponse: popupRuntime?.getFillStatusFromResponse || ((response) => {
          return fallbackGetFillStatusFromResponse(response, initMessages);
        }),
        buildSearchViewState: popupRuntime?.buildSearchViewState || ((searchTerm, visibleCounts) => {
          return fallbackBuildSearchViewState(searchTerm, visibleCounts, normalizeText);
        })
      };
    },
    getBootState({ elements, hasDependencies, getMissingKeys, getInitializationIssue, initMessages }) {
      const missingElementNames = getMissingKeys(elements);
      const initializationIssue = getInitializationIssue({
        missingElementNames,
        hasDependencies,
        initMessages
      });

      return {
        missingElementNames,
        initializationIssue,
        canBoot: !initializationIssue
      };
    }
  };
}

function bootPopup() {
  const bootState = getBootState({
    elements,
    hasDependencies: hasRequiredDependencies(),
    getMissingKeys,
    getInitializationIssue,
    initMessages
  });

  if (!bootState.canBoot) {
    reportInitializationIssue(bootState.initializationIssue);
    failGracefully(bootState.initializationIssue.message);
    return;
  }

  bindEvents();
  popupReady = true;
  initializePopup();
}

function hasRequiredDependencies() {
  return Boolean(popupSchema && popupSearch && popupRuntime);
}

function reportInitializationIssue(issue) {
  if (issue.reason === "missing-elements") {
    console.error(`${POPUP_ERRORS.missingElements} ${issue.missingElementNames.join(", ")}`);
    return;
  }

  console.error(POPUP_ERRORS.missingDependencies, {
    hasPopupSchema: Boolean(popupSchema),
    hasPopupSearch: Boolean(popupSearch),
    hasPopupRuntime: Boolean(popupRuntime),
    hasPopupBoot: Boolean(popupBoot)
  });
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSave);
  elements.fillButton.addEventListener("click", handleFillCurrentPage);
  elements.fieldSearch.addEventListener("input", handleSearch);
  elements.debugToggle.addEventListener("change", handleDebugToggle);
}

function failGracefully(message) {
  popupReady = false;

  if (elements.fillButton) {
    elements.fillButton.disabled = true;
    elements.fillButton.setAttribute("aria-disabled", "true");
  }

  if (elements.fieldSearch) {
    elements.fieldSearch.disabled = true;
    elements.fieldSearch.placeholder = initMessages.unavailableSearch;
  }

  if (elements.debugToggle) {
    elements.debugToggle.disabled = true;
    elements.debugToggle.setAttribute("aria-disabled", "true");
  }

  if (elements.form) {
    const controls = Array.from(elements.form.querySelectorAll("input, button, textarea, select"));
    for (const control of controls) {
      if (control !== elements.fillButton && control !== elements.fieldSearch && control !== elements.debugToggle) {
        control.disabled = true;
      }
    }
  }

  if (elements.sectionsContainer) {
    elements.sectionsContainer.replaceChildren();
  }

  if (elements.noResultsMessage) {
    elements.noResultsMessage.hidden = true;
  }

  clearAllStatus();
  setFillStatus(message, "error");
}

async function initializePopup() {
  try {
    renderSections();
    await populateFormFromStorage();
    updateSearchResults("");
    clearAllStatus();
  } catch (error) {
    console.error(POPUP_ERRORS.loadFailureLog, error);
    setSaveStatus(runtimeStatusMessages.loadFailure, "error");
  }
}

function renderSections() {
  elements.sectionsContainer.replaceChildren(...FIELD_SECTIONS.map(createSection));
  refreshSectionReferences();
}

function refreshSectionReferences() {
  fieldCards = Array.from(elements.sectionsContainer.querySelectorAll("[data-field-card]"));
  sections = Array.from(elements.sectionsContainer.querySelectorAll("[data-section]"));
}

function createSection(sectionConfig) {
  const details = createElement("details", {
    className: "section-card",
    attributes: { "data-section": "" }
  });
  details.open = true;

  const summary = createElement("summary", {
    attributes: { "aria-label": sectionConfig.summaryLabel }
  });
  const summaryText = createElement("div");
  summaryText.append(
    createElement("strong", { textContent: sectionConfig.title }),
    createElement("span", { textContent: sectionConfig.description })
  );
  summary.appendChild(summaryText);

  const fieldset = createElement("fieldset", {
    className: "section-fieldset",
    attributes: { "aria-label": `Campos de ${sectionConfig.title.toLowerCase()}` }
  });
  const legend = createElement("legend", {
    className: "sr-only",
    textContent: sectionConfig.title
  });
  const grid = createElement("div", { className: "field-grid" });

  for (const fieldConfig of sectionConfig.fields) {
    grid.appendChild(createFieldCard(fieldConfig));
  }

  fieldset.append(legend, grid);
  details.append(summary, fieldset);
  return details;
}

function createFieldCard(fieldConfig) {
  const label = createElement("label", {
    className: "field",
    attributes: { "data-field-card": "" },
    dataset: { search: fieldConfig.search }
  });

  const title = createElement("span", { textContent: fieldConfig.label });
  const input = createElement("input", {
    properties: {
      type: fieldConfig.type,
      name: fieldConfig.name
    },
    attributes: fieldConfig.attributes || {}
  });

  label.append(title, input);
  return label;
}

async function populateFormFromStorage() {
  const storedState = await loadStoredState();

  for (const fieldName of fieldNames) {
    const input = getFieldInput(fieldName);
    if (input) {
      input.value = storedState.profile[fieldName] || "";
    }
  }

  elements.debugToggle.checked = Boolean(storedState.debugEnabled);
}

async function loadStoredState() {
  const stored = await chrome.storage.local.get([STORAGE_KEY, DEBUG_STORAGE_KEY]);

  return {
    profile: stored[STORAGE_KEY] || {},
    debugEnabled: Boolean(stored[DEBUG_STORAGE_KEY])
  };
}

async function handleSave(event) {
  event.preventDefault();

  if (!popupReady) {
    setSaveStatus(initMessages.unavailableAction, "error");
    return;
  }

  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: collectFormData() });
    clearFillStatus();
    setSaveStatus(runtimeStatusMessages.saveSuccess, "success");
  } catch (error) {
    console.error(POPUP_ERRORS.saveFailureLog, error);
    setSaveStatus(runtimeStatusMessages.saveFailure, "error");
  }
}

async function handleDebugToggle(event) {
  const debugEnabled = event.target.checked;

  if (!popupReady) {
    event.target.checked = !debugEnabled;
    setSaveStatus(initMessages.unavailableAction, "error");
    return;
  }

  try {
    await chrome.storage.local.set({ [DEBUG_STORAGE_KEY]: debugEnabled });
    clearFillStatus();
    setSaveStatus(debugEnabled ? POPUP_MESSAGES.debugEnabled : POPUP_MESSAGES.debugDisabled, "success");
  } catch (error) {
    event.target.checked = !debugEnabled;
    console.error(POPUP_ERRORS.debugFailureLog, error);
    setSaveStatus(POPUP_MESSAGES.debugFailure, "error");
  }
}

async function handleFillCurrentPage() {
  if (!popupReady) {
    setFillStatus(initMessages.unavailableAction, "error");
    return;
  }

  let activeTab = null;

  try {
    activeTab = await getActiveTab();

    if (isUnsupportedTab(activeTab)) {
      setFillStatus(runtimeStatusMessages.fillUnsupportedPage, "error");
      return;
    }

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: FILL_MESSAGE_TYPE
    });

    const fillStatus = getFillStatusFromResponse(response);
    clearSaveStatus();
    setFillStatus(fillStatus.message, fillStatus.type);
  } catch (error) {
    console.error(POPUP_ERRORS.fillFailureLog, error);
    setFillStatus(resolveFillErrorMessage(activeTab, error), "error");
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab || typeof tab.id !== "number") {
    throw new Error(POPUP_ERRORS.activeTabNotFound);
  }

  return tab;
}

function handleSearch(event) {
  if (!popupReady) {
    return;
  }

  updateSearchResults(event.target.value);
}

function updateSearchResults(searchTerm) {
  for (const card of fieldCards) {
    const searchText = buildFieldSearchText(card);
    const shouldShow = matchesSearchTerm(searchText, searchTerm);

    card.classList.toggle("is-filtered-out", !shouldShow);
  }

  const visibleCounts = sections.map((section) => section.querySelectorAll("[data-field-card]:not(.is-filtered-out)").length);
  const searchState = buildSearchViewState(searchTerm, visibleCounts, normalizeText);

  sections.forEach((section, index) => {
    const sectionState = searchState.sections[index];
    section.classList.toggle("is-empty", sectionState.empty);

    if (searchState.hasSearch) {
      section.open = sectionState.open;
    }
  });

  updateNoResultsState(searchState.showNoResults);
}

function updateNoResultsState(shouldShow) {
  elements.noResultsMessage.hidden = !shouldShow;
}

function buildFieldSearchText(card) {
  return [
    card.dataset.search,
    card.textContent,
    card.querySelector("input")?.name
  ].filter(Boolean).join(" | ");
}

function collectFormData() {
  return Object.fromEntries(
    fieldNames.map((fieldName) => {
      const input = getFieldInput(fieldName);
      return [fieldName, input ? String(input.value || "").trim() : ""];
    })
  );
}

function getFieldInput(fieldName) {
  return elements.form.elements.namedItem(fieldName);
}

function setFillStatus(message, type) {
  elements.fillStatusMessage.textContent = message;
  elements.fillStatusMessage.className = `status-message ${type}`;
}

function setSaveStatus(message, type) {
  elements.saveStatusMessage.textContent = message;
  elements.saveStatusMessage.className = `status-message status-message--form ${type}`;
}

function clearFillStatus() {
  elements.fillStatusMessage.textContent = "";
  elements.fillStatusMessage.className = "status-message";
}

function clearSaveStatus() {
  elements.saveStatusMessage.textContent = "";
  elements.saveStatusMessage.className = "status-message status-message--form";
}

function clearAllStatus() {
  if (elements.fillStatusMessage) {
    clearFillStatus();
  }

  if (elements.saveStatusMessage) {
    clearSaveStatus();
  }
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.textContent) {
    element.textContent = options.textContent;
  }

  for (const [key, value] of Object.entries(options.attributes || {})) {
    element.setAttribute(key, value);
  }

  for (const [key, value] of Object.entries(options.dataset || {})) {
    element.dataset[key] = value;
  }

  for (const [key, value] of Object.entries(options.properties || {})) {
    element[key] = value;
  }

  return element;
}
