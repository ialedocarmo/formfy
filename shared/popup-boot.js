(function (globalScope) {
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

  function resolveRuntimeBindings({ popupSearch, popupRuntime }) {
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
  }

  function getBootState({ elements, hasDependencies, getMissingKeys, getInitializationIssue, initMessages }) {
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

  const api = {
    FALLBACK_STATUS_MESSAGES,
    FALLBACK_INIT_MESSAGES,
    resolveRuntimeBindings,
    getBootState
  };

  globalScope.formlyPopupBoot = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
