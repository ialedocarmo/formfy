(function (globalScope) {
  const ATTRIBUTE_PRESETS = {
    textNext: {
      autocomplete: "off",
      enterkeyhint: "next"
    },
    textDone: {
      autocomplete: "off",
      enterkeyhint: "done"
    },
    words: {
      autocapitalize: "words"
    },
    characters: {
      autocapitalize: "characters",
      spellcheck: "false"
    },
    email: {
      autocapitalize: "off",
      spellcheck: "false",
      inputmode: "email"
    },
    tel: {
      inputmode: "tel"
    },
    numericDocument: {
      inputmode: "numeric",
      maxlength: "14",
      spellcheck: "false"
    },
    stateCode: {
      maxlength: "2"
    }
  };

  function buildAttributes(...presetNames) {
    return Object.assign({}, ...presetNames.map((presetName) => ATTRIBUTE_PRESETS[presetName] || {}));
  }

  const FIELD_SECTIONS = [
    {
      title: "Dados pessoais",
      description: "Identificação e contato",
      summaryLabel: "Alternar seção de dados pessoais",
      fields: [
        {
          name: "nomeCompleto",
          label: "Nome completo",
          type: "text",
          search: "nome completo nomecompleto nome inteiro",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "nome",
          label: "Nome",
          type: "text",
          search: "nome primeiro nome",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "sobrenome",
          label: "Sobrenome",
          type: "text",
          search: "sobrenome ultimo nome",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          search: "email e-mail correio eletronico",
          attributes: buildAttributes("textNext", "email")
        },
        {
          name: "telefone",
          label: "Telefone",
          type: "tel",
          search: "telefone celular whatsapp contato",
          attributes: buildAttributes("textNext", "tel")
        },
        {
          name: "cpf",
          label: "CPF",
          type: "text",
          search: "cpf documento pessoal",
          attributes: buildAttributes("textNext", "numericDocument")
        },
        {
          name: "dataNascimento",
          label: "Data de nascimento",
          type: "date",
          search: "data de nascimento nascimento aniversario",
          attributes: buildAttributes("textNext")
        }
      ]
    },
    {
      title: "Dados estudantis",
      description: "Benefícios, instituição e localização",
      summaryLabel: "Alternar seção de dados estudantis",
      fields: [
        {
          name: "documentoEstudantil",
          label: "Documento estudantil",
          type: "text",
          search: "documento estudantil cie matricula registro academico ra",
          attributes: buildAttributes("textNext", "characters")
        },
        {
          name: "instituicaoEnsino",
          label: "Instituição de ensino",
          type: "text",
          search: "instituicao de ensino escola faculdade universidade instituicao",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "curso",
          label: "Curso",
          type: "text",
          search: "curso graduacao formacao",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "dataExpiracao",
          label: "Data de expiração",
          type: "date",
          search: "data de expiracao data de expiração validade vencimento",
          attributes: buildAttributes("textNext")
        },
        {
          name: "cidade",
          label: "Cidade da instituição",
          type: "text",
          search: "cidade da instituicao cidade da instituição municipio da instituicao",
          attributes: buildAttributes("textNext", "words")
        },
        {
          name: "estado",
          label: "Estado / UF da instituição",
          type: "text",
          search: "estado da instituicao estado da instituição uf da instituicao uf da instituição",
          attributes: buildAttributes("textDone", "characters", "stateCode")
        }
      ]
    }
  ];

  function getFieldNames() {
    return FIELD_SECTIONS.flatMap((section) => section.fields.map((field) => field.name));
  }

  const api = {
    FIELD_SECTIONS,
    getFieldNames
  };

  globalScope.formlyPopupSchema = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
