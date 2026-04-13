const {
  rankFieldMatches,
  createMetadata
} = require("../../shared/content-heuristics.js");

function createInputField(name, inputType = "text") {
  return {
    tagName: "input",
    inputType,
    name,
    value: ""
  };
}

function createSelectField(name, options) {
  return {
    tagName: "select",
    inputType: "",
    name,
    value: "",
    options
  };
}

function createAnalysisResult(parts, field) {
  const ranked = rankFieldMatches(parts, field);

  return {
    field,
    metadata: createMetadata({
      ...parts,
      tagName: field.tagName
    }),
    ignored: false,
    ignoreReason: "",
    bestMatch: ranked[0] || null,
    secondBestMatch: ranked[1] || null,
    scoreMap: Object.fromEntries(ranked.map((entry) => [entry.fieldType, entry.score]))
  };
}

function topMatch(parts, field) {
  return rankFieldMatches(parts, field)[0] || null;
}

module.exports = {
  createInputField,
  createSelectField,
  createAnalysisResult,
  topMatch
};
