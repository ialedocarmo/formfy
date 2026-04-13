(function (globalScope) {
  const STATUS_MESSAGES = {
    loadFailure: "Não foi possível carregar os dados salvos.",
    saveSuccess: "Dados salvos localmente no navegador.",
    saveFailure: "Não foi possível salvar os dados.",
    fillSuccessFallback: "Preenchimento concluído.",
    fillEmptyFallback: "Nenhum campo compatível foi preenchido.",
    fillNoResponse: "A página atual não respondeu ao comando de preenchimento.",
    fillFailure: "Não foi possível preencher esta página. Verifique se ela permite extensões.",
    fillUnsupportedPage: "Abra uma página web comum para usar o preenchimento.",
    fillContentUnavailable: "A página atual não está pronta para receber o preenchimento. Recarregue a página e tente novamente.",
    fillRestrictedPage: "Esta página não permite preenchimento pela extensão.",
    fillCheckoutBlocked: "Checkout ou pagamento detectado. O preenchimento foi bloqueado por segurança."
  };

  const INIT_MESSAGES = {
    missingDependencies: "O popup não carregou todos os arquivos necessários. Atualize a extensão e tente novamente.",
    missingElements: "O popup não encontrou todos os elementos necessários para funcionar.",
    unavailableSearch: "Pesquisa indisponível enquanto o popup é recuperado.",
    unavailableAction: "O popup não está pronto para executar esta ação. Atualize a extensão e tente novamente."
  };

  const UNSUPPORTED_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:"];

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getMissingKeys(record) {
    return Object.entries(record)
      .filter(([, value]) => !value)
      .map(([key]) => key);
  }

  function getInitializationIssue({ missingElementNames = [], hasDependencies, initMessages = INIT_MESSAGES }) {
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

  function isUnsupportedTab(tab) {
    const url = String(tab?.url || "").toLowerCase();
    return UNSUPPORTED_PROTOCOLS.some((protocol) => url.startsWith(protocol));
  }

  function resolveFillErrorMessage(tab, error) {
    const message = String(error?.message || error || "");
    const normalized = normalizeText(message);

    if (isUnsupportedTab(tab)) {
      return STATUS_MESSAGES.fillUnsupportedPage;
    }

    if (normalized.includes("receiving end does not exist") || normalized.includes("could not establish connection")) {
      return STATUS_MESSAGES.fillContentUnavailable;
    }

    if (normalized.includes("cannot access") || normalized.includes("permission") || normalized.includes("forbidden")) {
      return STATUS_MESSAGES.fillRestrictedPage;
    }

    if (normalized.includes("checkout") || normalized.includes("pagamento") || normalized.includes("payment")) {
      return STATUS_MESSAGES.fillCheckoutBlocked;
    }

    return STATUS_MESSAGES.fillFailure;
  }

  function getFillStatusFromResponse(response) {
    if (!response) {
      return {
        type: "error",
        message: STATUS_MESSAGES.fillNoResponse
      };
    }

    return {
      type: response.success ? "success" : "error",
      message: response.message || (response.success ? STATUS_MESSAGES.fillSuccessFallback : STATUS_MESSAGES.fillEmptyFallback)
    };
  }

  function buildSearchViewState(searchTerm, visibleCounts, normalize = normalizeText) {
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

  const api = {
    STATUS_MESSAGES,
    INIT_MESSAGES,
    UNSUPPORTED_PROTOCOLS,
    normalizeText,
    getMissingKeys,
    getInitializationIssue,
    isUnsupportedTab,
    resolveFillErrorMessage,
    getFillStatusFromResponse,
    buildSearchViewState
  };

  globalScope.formlyPopupRuntime = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
