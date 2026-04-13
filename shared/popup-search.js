(function (globalScope) {
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function splitSearchTerms(searchTerm) {
    return normalizeText(searchTerm)
      .split(/\s+/)
      .filter(Boolean);
  }

  function splitSearchGroups(searchTerm) {
    return String(searchTerm || "")
      .split("|")
      .map((group) => splitSearchTerms(group))
      .filter((group) => group.length > 0);
  }

  function matchesSearchTerm(searchText, searchTerm) {
    const normalizedSearchText = normalizeText(searchText);
    const searchGroups = splitSearchGroups(searchTerm);

    return searchGroups.length === 0 || searchGroups.some((group) => {
      return group.every((term) => normalizedSearchText.includes(term));
    });
  }

  const api = {
    normalizeText,
    splitSearchTerms,
    splitSearchGroups,
    matchesSearchTerm
  };

  globalScope.formlyPopupSearch = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
