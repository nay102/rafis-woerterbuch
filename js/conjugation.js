const PERSON_KEYS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_formal"];
const REFLEXIVE_PRONOUNS = {
  ich: "mich",
  du: "dich",
  er_sie_es: "sich",
  wir: "uns",
  ihr: "euch",
  sie_formal: "sich"
};

const INSEPARABLE_PREFIXES = ["be", "emp", "ent", "er", "ge", "miss", "ver", "zer"];
const SEPARABLE_PREFIXES = [
  "ab",
  "an",
  "auf",
  "aus",
  "bei",
  "darauf",
  "durch",
  "entgegen",
  "ein",
  "gerade",
  "mit",
  "nach",
  "vor",
  "zu",
  "zurueck",
  "zurück",
  "runter",
  "raus",
  "rein",
  "schief",
  "statt",
  "teil",
  "um",
  "zusammen",
  "wahr",
  "weg",
  "weiter",
  "los",
  "fest",
  "fort",
  "heim",
  "her",
  "herab",
  "heran",
  "heraus",
  "herbei",
  "herein",
  "herum",
  "herunter",
  "hervor",
  "hin",
  "hinab",
  "hinauf",
  "hinaus",
  "hinein",
  "hinweg",
  "hinzu",
  "vorbei"
];

const AMBIGUOUS_VERBS = new Set([]);
const NON_SEPARABLE_VERBS = new Set([
  "antworten",
  "absolvieren",
  "einigen",
  "reinigen"
]);
const SEIN_AUXILIARY_VERBS = new Set([
  "ausbrechen",
  "auswandern",
  "begegnen",
  "einbrechen",
  "gelangen",
  "reisen",
  "spazieren",
  "stolpern",
  "verreisen",
  "verzweifeln",
  "scheitern",
  "aufstehen"
]);
const HABEN_AUXILIARY_VERBS = new Set(["herunterfahren"]);
const INSEPARABLE_EXTENDED_PREFIXES = ["über", "unter", "hinter"];
const IMPERATIVE_DU_OVERRIDES = {
  backen: "back",
  entlassen: "entlass",
  essen: "iss",
  fahren: "fahr",
  fallen: "fall",
  fangen: "fang",
  haben: "hab",
  halten: "halt",
  heißen: "heiße",
  laden: "lad",
  laufen: "lauf",
  lesen: "lies",
  reisen: "reise",
  schlafen: "schlaf",
  sein: "sei",
  tragen: "trag",
  treten: "tritt",
  stoßen: "stoß",
  verhalten: "verhalte",
  waschen: "wasch",
  werden: "werde",
  wissen: "wisse"
};

const IRREGULAR_OVERRIDE_FIELDS = [
  "praeteritum",
  "present_du",
  "present_er",
  "k1_du",
  "k1_ihr",
  "konjunktiv2_stem"
];

function endsWithParticle(value) {
  if (!value) return false;
  const text = String(value).trim().toLowerCase();
  return SEPARABLE_PREFIXES.some(prefix => text.endsWith(` ${prefix}`));
}

function startsWithParticle(value) {
  if (!value) return false;
  const text = String(value).trim().toLowerCase();
  return SEPARABLE_PREFIXES.some(prefix => text.startsWith(prefix));
}

function validateIrregularEntries(list) {
  (Array.isArray(list) ? list : []).forEach(entry => {
    const infinitive = normalizeWord(entry?.infinitive);
    if (!infinitive) return;

    if (infinitive.toLowerCase().startsWith("sich ")) {
      console.warn(
        `[irregular_verbs] "${infinitive}" should not include "sich". Use the base verb only.`
      );
    }

    if (/\s/.test(infinitive)) {
      console.warn(
        `[irregular_verbs] "${infinitive}" contains spaces. Use core verb only (no separable prefix).`
      );
    }

    IRREGULAR_OVERRIDE_FIELDS.forEach(field => {
      if (endsWithParticle(entry?.[field])) {
        console.warn(
          `[irregular_verbs] "${infinitive}" field "${field}" ends with a separable particle. Remove the particle from this field.`
        );
      }
    });

    if (startsWithParticle(entry?.partizip2)) {
      console.warn(
        `[irregular_verbs] "${infinitive}" field "partizip2" starts with a separable particle. Use core partizip2 only.`
      );
    }
  });
}

function normalizeWord(value) {
  return String(value || "").trim();
}

function isVerbEntry(entry) {
  const type = String(entry?.type || "").toLowerCase();
  const category = String(entry?.category || "").toLowerCase();
  return type === "verb" || category === "verben";
}

function isInseparablePrefix(verb) {
  return [...INSEPARABLE_PREFIXES, ...INSEPARABLE_EXTENDED_PREFIXES].some(prefix =>
    verb.startsWith(prefix) && verb.length > prefix.length + 2
  );
}

function findSeparablePrefix(verb) {
  const sorted = [...SEPARABLE_PREFIXES].sort((a, b) => b.length - a.length);
  return (
    sorted.find(prefix => verb.startsWith(prefix) && verb.length > prefix.length + 2) ||
    null
  );
}

function getStem(verb) {
  if (verb.endsWith("eln")) {
    return verb.slice(0, -3) + "el";
  }
  if (verb.endsWith("ern")) {
    return verb.slice(0, -1);
  }
  if (verb.endsWith("en")) {
    return verb.slice(0, -2);
  }
  if (verb.endsWith("n")) {
    return verb.slice(0, -1);
  }
  return verb;
}

function needsE(stem) {
  if (/[dt]$/.test(stem)) return true;
  if (/[mn]$/.test(stem)) {
    const before = stem.at(-2);
    if (!before || /[aeiouäöüylrmn]/.test(before)) return false;
    if (before === "h") {
      const beforeH = stem.at(-3);
      return Boolean(beforeH && !/[aeiouäöü]/.test(beforeH));
    }
    return true;
  }
  return false;
}

function duEnding(stem) {
  if (/(s|ß|x|z|tz|ss)$/.test(stem)) return "t";
  return "st";
}

function joinStemEnding(stem, ending) {
  if (stem.endsWith("e") && ending.startsWith("e")) {
    return `${stem}${ending.slice(1)}`;
  }
  return `${stem}${ending}`;
}

function buildRegularBase(coreVerb) {
  const stem = getStem(coreVerb);
  const insertE = needsE(stem) ? "e" : "";
  const duEnd = duEnding(stem);

  const present = {
    ich: `${stem}e`,
    du: `${stem}${insertE}${duEnd}`,
    er_sie_es: `${stem}${insertE}t`,
    wir: coreVerb,
    ihr: `${stem}${insertE}t`,
    sie_formal: coreVerb
  };

  const preteriteBase = `${stem}${insertE}te`;
  const preterite = {
    ich: preteriteBase,
    du: `${preteriteBase}st`,
    er_sie_es: preteriteBase,
    wir: `${preteriteBase}n`,
    ihr: `${preteriteBase}t`,
    sie_formal: `${preteriteBase}n`
  };

  const k1Present = {
    ich: `${stem}e`,
    du: `${stem}est`,
    er_sie_es: `${stem}e`,
    wir: coreVerb,
    ihr: `${stem}et`,
    sie_formal: coreVerb
  };

  const partizipI = `${stem}end`;
  let partizipIISuffix = "t";
  if (!coreVerb.endsWith("ieren") && needsE(stem)) {
    partizipIISuffix = "et";
  }
  const partizipII = `${stem}${partizipIISuffix}`;

  return { present, preterite, k1Present, partizipI, partizipII, stem };
}

function applySeparablePrefix(forms, prefix) {
  if (!prefix) return forms;
  const withPrefix = {};
  PERSON_KEYS.forEach(key => {
    withPrefix[key] = `${forms[key]} ${prefix}`;
  });
  return withPrefix;
}

function applyReflexive(forms, isSeparable, prefix) {
  const result = {};
  PERSON_KEYS.forEach(key => {
    const pronoun = REFLEXIVE_PRONOUNS[key];
    if (isSeparable && prefix) {
      const base = forms[key].replace(new RegExp(`\\s${prefix}$`), "");
      result[key] = `${base} ${pronoun} ${prefix}`;
    } else {
      result[key] = `${forms[key]} ${pronoun}`;
    }
  });
  return result;
}

function insertReflexive(auxForm, pronoun, rest) {
  return `${auxForm} ${pronoun} ${rest}`;
}

function buildImperative(presentForms, isSeparable, prefix, isReflexive, coreVerb) {
  let duForm = presentForms.du;
  let ihrForm = presentForms.ihr;
  let sieFormBase = presentForms.sie_formal;

  if (isSeparable && prefix) {
    const suffix = ` ${prefix}`;
    duForm = duForm.replace(suffix, "");
    ihrForm = ihrForm.replace(suffix, "");
    sieFormBase = sieFormBase.replace(suffix, "");
  }

  let baseDu = duForm;
  if (duForm.endsWith("st")) baseDu = duForm.slice(0, -2);
  else if (duForm.endsWith("t")) baseDu = duForm.slice(0, -1);

  let du = baseDu;
  let ihr = ihrForm;
  let sieForm = `${sieFormBase} Sie`;

  if (IMPERATIVE_DU_OVERRIDES[coreVerb]) {
    du = IMPERATIVE_DU_OVERRIDES[coreVerb];
  }

  if (isReflexive) {
    du = `${du} ${REFLEXIVE_PRONOUNS.du}`;
    ihr = `${ihr} ${REFLEXIVE_PRONOUNS.ihr}`;
    sieForm = `${sieFormBase} Sie ${REFLEXIVE_PRONOUNS.sie_formal}`;
  }

  if (isSeparable && prefix) {
    du = `${du} ${prefix}`;
    ihr = `${ihr} ${prefix}`;
    sieForm = `${sieForm} ${prefix}`;
  }

  return { du, ihr, sie_formal: sieForm };
}

function buildConjugationFromRegular(coreVerb, options) {
  const { isSeparable, prefix, isReflexive, fullVerb, infinitiveLabel } = options;
  const base = buildRegularBase(coreVerb);

  const present = isSeparable ? applySeparablePrefix(base.present, prefix) : base.present;
  const preterite = isSeparable ? applySeparablePrefix(base.preterite, prefix) : base.preterite;
  const k1Present = isSeparable ? applySeparablePrefix(base.k1Present, prefix) : base.k1Present;

  const partizipII = (() => {
    if (isSeparable && prefix) {
      if (coreVerb.endsWith("ieren") || isInseparablePrefix(coreVerb)) {
        return `${prefix}${base.partizipII}`;
      }
      return `${prefix}ge${base.partizipII}`;
    }
    if (coreVerb.endsWith("ieren")) return base.partizipII;
    if (isInseparablePrefix(coreVerb)) return base.partizipII;
    return `ge${base.partizipII}`;
  })();

  const partizipIBase =
    isSeparable && prefix ? `${prefix}${base.partizipI}` : base.partizipI;
  const partizipI = isReflexive ? `sich ${partizipIBase}` : partizipIBase;

  const presentFinal = isReflexive ? applyReflexive(present, isSeparable, prefix) : present;
  const preteriteFinal = isReflexive ? applyReflexive(preterite, isSeparable, prefix) : preterite;
  const k1Final = isReflexive ? applyReflexive(k1Present, isSeparable, prefix) : k1Present;

  const aux = SEIN_AUXILIARY_VERBS.has(fullVerb.toLowerCase()) ? "sein" : "haben";
  const perf = {};
  const plusperf = {};
  const futurI = {};
  const futurII = {};

  PERSON_KEYS.forEach(key => {
    const pronoun = REFLEXIVE_PRONOUNS[key];
    const auxPresent =
      key === "ich"
        ? aux === "sein"
          ? "bin"
          : "habe"
        : key === "du"
          ? aux === "sein"
            ? "bist"
            : "hast"
          : key === "er_sie_es"
            ? aux === "sein"
              ? "ist"
              : "hat"
            : key === "ihr"
              ? aux === "sein"
                ? "seid"
                : "habt"
              : aux === "sein"
                ? "sind"
                : "haben";
    const auxPast =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "war"
          : "hatte"
        : key === "du"
          ? aux === "sein"
            ? "warst"
            : "hattest"
          : key === "ihr"
            ? aux === "sein"
              ? "wart"
              : "hattet"
            : aux === "sein"
              ? "waren"
              : "hatten";
    const auxFutur =
      key === "ich"
        ? "werde"
        : key === "du"
          ? "wirst"
          : key === "er_sie_es"
            ? "wird"
            : key === "ihr"
              ? "werdet"
              : "werden";

    perf[key] = isReflexive
      ? insertReflexive(auxPresent, pronoun, partizipII)
      : `${auxPresent} ${partizipII}`;
    plusperf[key] = isReflexive
      ? insertReflexive(auxPast, pronoun, partizipII)
      : `${auxPast} ${partizipII}`;
    futurI[key] = isReflexive
      ? insertReflexive(auxFutur, pronoun, fullVerb)
      : `${auxFutur} ${fullVerb}`;
    futurII[key] = isReflexive
      ? insertReflexive(auxFutur, pronoun, `${partizipII} ${aux}`)
      : `${auxFutur} ${partizipII} ${aux}`;
  });

  const k1Perf = {};
  const k1Futur = {};
  const k2Pret = { ...preteriteFinal };
  const k2Plus = {};
  const k2Futur = {};
  const k2Futur2 = {};

  PERSON_KEYS.forEach(key => {
    const pronoun = REFLEXIVE_PRONOUNS[key];
    const auxK1 =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "sei"
          : "habe"
        : key === "du"
          ? aux === "sein"
            ? "seiest"
            : "habest"
          : key === "ihr"
            ? aux === "sein"
              ? "seiet"
              : "habet"
            : aux === "sein"
              ? "seien"
              : "haben";
    const auxK2 =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "wäre"
          : "hätte"
        : key === "du"
          ? aux === "sein"
            ? "wärest"
            : "hättest"
          : key === "ihr"
            ? aux === "sein"
              ? "wäret"
              : "hättet"
            : aux === "sein"
              ? "wären"
              : "hätten";
    const auxWuerde =
      key === "ich"
        ? "würde"
        : key === "du"
          ? "würdest"
          : key === "er_sie_es"
            ? "würde"
            : key === "ihr"
              ? "würdet"
              : "würden";
    const auxWerden =
      key === "ich"
        ? "werde"
        : key === "du"
          ? "werdest"
          : key === "er_sie_es"
            ? "werde"
            : key === "ihr"
              ? "werdet"
              : "werden";

    k1Perf[key] = isReflexive
      ? insertReflexive(auxK1, pronoun, partizipII)
      : `${auxK1} ${partizipII}`;
    k1Futur[key] = isReflexive
      ? insertReflexive(auxWerden, pronoun, fullVerb)
      : `${auxWerden} ${fullVerb}`;
    k2Plus[key] = isReflexive
      ? insertReflexive(auxK2, pronoun, partizipII)
      : `${auxK2} ${partizipII}`;
    k2Futur[key] = isReflexive
      ? insertReflexive(auxWuerde, pronoun, fullVerb)
      : `${auxWuerde} ${fullVerb}`;
    k2Futur2[key] = isReflexive
      ? insertReflexive(auxWuerde, pronoun, `${partizipII} ${aux}`)
      : `${auxWuerde} ${partizipII} ${aux}`;
  });

  return {
    indikativ: {
      praesens: presentFinal,
      praeteritum: preteriteFinal,
      perfekt: perf,
      plusquamperfekt: plusperf,
      futur_i: futurI,
      futur_ii: futurII
    },
    konjunktiv_i: {
      praesens: k1Final,
      perfekt: k1Perf,
      futur_i: k1Futur
    },
    konjunktiv_ii: {
      praeteritum: k2Pret,
      plusquamperfekt: k2Plus,
      futur_i: k2Futur,
      futur_ii: k2Futur2
    },
    imperativ: {
      praesens: buildImperative(present, isSeparable, prefix, isReflexive, coreVerb)
    },
    partizip: {
      partizip_i: partizipI,
      partizip_ii: partizipII
    },
    infinitiv: {
      praesens: infinitiveLabel || fullVerb
    }
  };
}

function buildConjugationFromIrregular(coreVerb, irregular, options) {
  const {
    isSeparable,
    prefix,
    isReflexive,
    fullVerb,
    infinitiveLabel,
    matchType
  } = options;
  const base = buildRegularBase(coreVerb);
  const presentStem = irregular.present_stem || null;

  const present = {
    ich: irregular.present_ich || (presentStem ? `${presentStem}e` : base.present.ich),
    du: irregular.present_du || (presentStem ? `${presentStem}${duEnding(presentStem)}` : base.present.du),
    er_sie_es: irregular.present_er || (presentStem ? `${presentStem}t` : base.present.er_sie_es),
    wir: irregular.present_wir || base.present.wir,
    ihr: irregular.present_ihr || base.present.ihr,
    sie_formal: irregular.present_sie_formal || base.present.sie_formal
  };

  const praeteritumStem = irregular.praeteritum_stem || irregular.praeteritum;
  const preterite = {
    ich: irregular.praeteritum,
    du: `${praeteritumStem}st`,
    er_sie_es: irregular.praeteritum,
    wir: joinStemEnding(praeteritumStem, "en"),
    ihr: `${praeteritumStem}t`,
    sie_formal: joinStemEnding(praeteritumStem, "en")
  };

  const k1Present = {
    ich: irregular.k1_ich || present.ich,
    du: irregular.k1_du || `${getStem(coreVerb)}est`,
    er_sie_es: irregular.k1_er || present.ich,
    wir: irregular.k1_wir || base.present.wir,
    ihr: irregular.k1_ihr || `${getStem(coreVerb)}et`,
    sie_formal: irregular.k1_sie_formal || base.present.sie_formal
  };

  let partizipII = irregular.partizip2;
  if (isSeparable && prefix && matchType === "core") {
    partizipII = `${prefix}${partizipII}`;
  }

  const presentFinal = isSeparable ? applySeparablePrefix(present, prefix) : present;
  const preteriteFinal = isSeparable ? applySeparablePrefix(preterite, prefix) : preterite;
  const k1Final = isSeparable ? applySeparablePrefix(k1Present, prefix) : k1Present;

  const presentRef = isReflexive ? applyReflexive(presentFinal, isSeparable, prefix) : presentFinal;
  const preteriteRef = isReflexive ? applyReflexive(preteriteFinal, isSeparable, prefix) : preteriteFinal;
  const k1Ref = isReflexive ? applyReflexive(k1Final, isSeparable, prefix) : k1Final;

  const normalizedFullVerb = fullVerb.toLowerCase();
  const aux = HABEN_AUXILIARY_VERBS.has(normalizedFullVerb)
    ? "haben"
    : SEIN_AUXILIARY_VERBS.has(normalizedFullVerb)
      ? "sein"
      : irregular.aux || "haben";
  const perf = {};
  const plusperf = {};
  const futurI = {};
  const futurII = {};

  PERSON_KEYS.forEach(key => {
    const pronoun = REFLEXIVE_PRONOUNS[key];
    const auxPresent =
      key === "ich"
        ? aux === "sein"
          ? "bin"
          : "habe"
        : key === "du"
          ? aux === "sein"
            ? "bist"
            : "hast"
          : key === "er_sie_es"
            ? aux === "sein"
              ? "ist"
              : "hat"
            : key === "ihr"
              ? aux === "sein"
                ? "seid"
                : "habt"
              : aux === "sein"
                ? "sind"
                : "haben";
    const auxPast =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "war"
          : "hatte"
        : key === "du"
          ? aux === "sein"
            ? "warst"
            : "hattest"
          : key === "ihr"
            ? aux === "sein"
              ? "wart"
              : "hattet"
            : aux === "sein"
              ? "waren"
              : "hatten";
    const auxFutur =
      key === "ich"
        ? "werde"
        : key === "du"
          ? "wirst"
          : key === "er_sie_es"
            ? "wird"
            : key === "ihr"
              ? "werdet"
              : "werden";

    perf[key] = isReflexive
      ? insertReflexive(auxPresent, pronoun, partizipII)
      : `${auxPresent} ${partizipII}`;
    plusperf[key] = isReflexive
      ? insertReflexive(auxPast, pronoun, partizipII)
      : `${auxPast} ${partizipII}`;
    futurI[key] = isReflexive
      ? insertReflexive(auxFutur, pronoun, fullVerb)
      : `${auxFutur} ${fullVerb}`;
    futurII[key] = isReflexive
      ? insertReflexive(auxFutur, pronoun, `${partizipII} ${aux}`)
      : `${auxFutur} ${partizipII} ${aux}`;
  });

  const k2Stem = irregular.konjunktiv2_stem || praeteritumStem;
  const k2Pret = {
    ich: k2Stem,
    du: `${k2Stem}st`,
    er_sie_es: k2Stem,
    wir: joinStemEnding(k2Stem, "en"),
    ihr: `${k2Stem}t`,
    sie_formal: joinStemEnding(k2Stem, "en")
  };
  const k2PretFinal = isSeparable ? applySeparablePrefix(k2Pret, prefix) : k2Pret;
  const k2PretRef = isReflexive ? applyReflexive(k2PretFinal, isSeparable, prefix) : k2PretFinal;

  const k1Perf = {};
  const k1Futur = {};
  const k2Plus = {};
  const k2Futur = {};
  const k2Futur2 = {};

  PERSON_KEYS.forEach(key => {
    const pronoun = REFLEXIVE_PRONOUNS[key];
    const auxK1 =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "sei"
          : "habe"
        : key === "du"
          ? aux === "sein"
            ? "seiest"
            : "habest"
          : key === "ihr"
            ? aux === "sein"
              ? "seiet"
              : "habet"
            : aux === "sein"
              ? "seien"
              : "haben";
    const auxK2 =
      key === "ich" || key === "er_sie_es"
        ? aux === "sein"
          ? "wäre"
          : "hätte"
        : key === "du"
          ? aux === "sein"
            ? "wärest"
            : "hättest"
          : key === "ihr"
            ? aux === "sein"
              ? "wäret"
              : "hättet"
            : aux === "sein"
              ? "wären"
              : "hätten";
    const auxWuerde =
      key === "ich"
        ? "würde"
        : key === "du"
          ? "würdest"
          : key === "er_sie_es"
            ? "würde"
            : key === "ihr"
              ? "würdet"
              : "würden";
    const auxWerden =
      key === "ich"
        ? "werde"
        : key === "du"
          ? "werdest"
          : key === "er_sie_es"
            ? "werde"
            : key === "ihr"
              ? "werdet"
              : "werden";

    k1Perf[key] = isReflexive
      ? insertReflexive(auxK1, pronoun, partizipII)
      : `${auxK1} ${partizipII}`;
    k1Futur[key] = isReflexive
      ? insertReflexive(auxWerden, pronoun, fullVerb)
      : `${auxWerden} ${fullVerb}`;
    k2Plus[key] = isReflexive
      ? insertReflexive(auxK2, pronoun, partizipII)
      : `${auxK2} ${partizipII}`;
    k2Futur[key] = isReflexive
      ? insertReflexive(auxWuerde, pronoun, fullVerb)
      : `${auxWuerde} ${fullVerb}`;
    k2Futur2[key] = isReflexive
      ? insertReflexive(auxWuerde, pronoun, `${partizipII} ${aux}`)
      : `${auxWuerde} ${partizipII} ${aux}`;
  });

  return {
    indikativ: {
      praesens: presentRef,
      praeteritum: preteriteRef,
      perfekt: perf,
      plusquamperfekt: plusperf,
      futur_i: futurI,
      futur_ii: futurII
    },
    konjunktiv_i: {
      praesens: k1Ref,
      perfekt: k1Perf,
      futur_i: k1Futur
    },
    konjunktiv_ii: {
      praeteritum: k2PretRef,
      plusquamperfekt: k2Plus,
      futur_i: k2Futur,
      futur_ii: k2Futur2
    },
    imperativ: {
      praesens: buildImperative(
        presentFinal,
        isSeparable,
        prefix,
        isReflexive,
        coreVerb
      )
    },
    partizip: {
      partizip_i: isReflexive
        ? `sich ${isSeparable && prefix ? prefix : ""}${base.partizipI}`
        : `${isSeparable && prefix ? prefix : ""}${base.partizipI}`,
      partizip_ii: partizipII
    },
    infinitiv: {
      praesens: infinitiveLabel || fullVerb
    }
  };
}

function parseVerb(word) {
  const normalized = normalizeWord(word);
  if (!normalized) return null;
  let isReflexive = false;
  let base = normalized;
  if (base.startsWith("sich ")) {
    isReflexive = true;
    base = base.slice(5).trim();
  }
  if (!base || base.includes(" ")) {
    return null;
  }
  if (NON_SEPARABLE_VERBS.has(base.toLowerCase())) {
    return {
      fullVerb: base,
      infinitiveLabel: normalized,
      coreVerb: base,
      prefix: null,
      isSeparable: false,
      isReflexive
    };
  }
  const prefix = findSeparablePrefix(base);
  // A longer separable particle (for example "bei-" in "beitragen") must
  // take precedence over a shorter inseparable-looking prefix such as "be-".
  const isSeparable = Boolean(prefix);
  const core = isSeparable ? base.slice(prefix.length) : base;
  return {
    fullVerb: base,
    infinitiveLabel: normalized,
    coreVerb: core,
    prefix,
    isSeparable,
    isReflexive
  };
}

function buildIrregularMap(list) {
  const map = new Map();
  (Array.isArray(list) ? list : []).forEach(entry => {
    const infinitive = normalizeWord(entry?.infinitive).toLowerCase();
    if (!infinitive) return;
    map.set(infinitive, entry);
  });
  return map;
}

function resolveIrregular(verbInfo, irregularMap) {
  const fullKey = verbInfo.fullVerb.toLowerCase();
  const coreKey = verbInfo.coreVerb.toLowerCase();
  if (irregularMap.has(fullKey)) {
    return { entry: irregularMap.get(fullKey), matchType: "full" };
  }
  if (verbInfo.isSeparable && irregularMap.has(coreKey)) {
    return { entry: irregularMap.get(coreKey), matchType: "core" };
  }
  return null;
}

function buildReflexiveLassenCompound(innerVerb) {
  const presentLassen = {
    ich: "lasse",
    du: "lässt",
    er_sie_es: "lässt",
    wir: "lassen",
    ihr: "lasst",
    sie_formal: "lassen"
  };
  const preteriteLassen = {
    ich: "ließ",
    du: "ließt",
    er_sie_es: "ließ",
    wir: "ließen",
    ihr: "ließt",
    sie_formal: "ließen"
  };
  const k1Lassen = {
    ich: "lasse",
    du: "lassest",
    er_sie_es: "lasse",
    wir: "lassen",
    ihr: "lasset",
    sie_formal: "lassen"
  };
  const k2Lassen = {
    ich: "ließe",
    du: "ließest",
    er_sie_es: "ließe",
    wir: "ließen",
    ihr: "ließet",
    sie_formal: "ließen"
  };
  const auxPresent = {
    ich: "habe",
    du: "hast",
    er_sie_es: "hat",
    wir: "haben",
    ihr: "habt",
    sie_formal: "haben"
  };
  const auxPast = {
    ich: "hatte",
    du: "hattest",
    er_sie_es: "hatte",
    wir: "hatten",
    ihr: "hattet",
    sie_formal: "hatten"
  };
  const auxK1 = {
    ich: "habe",
    du: "habest",
    er_sie_es: "habe",
    wir: "haben",
    ihr: "habet",
    sie_formal: "haben"
  };
  const auxK2 = {
    ich: "hätte",
    du: "hättest",
    er_sie_es: "hätte",
    wir: "hätten",
    ihr: "hättet",
    sie_formal: "hätten"
  };
  const werden = {
    ich: "werde",
    du: "wirst",
    er_sie_es: "wird",
    wir: "werden",
    ihr: "werdet",
    sie_formal: "werden"
  };
  const werdenK1 = {
    ich: "werde",
    du: "werdest",
    er_sie_es: "werde",
    wir: "werden",
    ihr: "werdet",
    sie_formal: "werden"
  };
  const wuerde = {
    ich: "würde",
    du: "würdest",
    er_sie_es: "würde",
    wir: "würden",
    ihr: "würdet",
    sie_formal: "würden"
  };
  const fullInfinitive = `sich ${innerVerb} lassen`;
  const mapPersons = callback =>
    Object.fromEntries(PERSON_KEYS.map(key => [key, callback(key, REFLEXIVE_PRONOUNS[key])]));

  return {
    indikativ: {
      praesens: mapPersons((key, pronoun) => `${presentLassen[key]} ${pronoun} ${innerVerb}`),
      praeteritum: mapPersons(
        (key, pronoun) => `${preteriteLassen[key]} ${pronoun} ${innerVerb}`
      ),
      perfekt: mapPersons(
        (key, pronoun) => `${auxPresent[key]} ${pronoun} ${innerVerb} lassen`
      ),
      plusquamperfekt: mapPersons(
        (key, pronoun) => `${auxPast[key]} ${pronoun} ${innerVerb} lassen`
      ),
      futur_i: mapPersons(
        (key, pronoun) => `${werden[key]} ${pronoun} ${innerVerb} lassen`
      ),
      futur_ii: mapPersons(
        (key, pronoun) => `${werden[key]} ${pronoun} haben ${innerVerb} lassen`
      )
    },
    konjunktiv_i: {
      praesens: mapPersons((key, pronoun) => `${k1Lassen[key]} ${pronoun} ${innerVerb}`),
      perfekt: mapPersons((key, pronoun) => `${auxK1[key]} ${pronoun} ${innerVerb} lassen`),
      futur_i: mapPersons(
        (key, pronoun) => `${werdenK1[key]} ${pronoun} ${innerVerb} lassen`
      )
    },
    konjunktiv_ii: {
      praeteritum: mapPersons((key, pronoun) => `${k2Lassen[key]} ${pronoun} ${innerVerb}`),
      plusquamperfekt: mapPersons(
        (key, pronoun) => `${auxK2[key]} ${pronoun} ${innerVerb} lassen`
      ),
      futur_i: mapPersons((key, pronoun) => `${wuerde[key]} ${pronoun} ${innerVerb} lassen`),
      futur_ii: mapPersons(
        (key, pronoun) => `${wuerde[key]} ${pronoun} haben ${innerVerb} lassen`
      )
    },
    imperativ: {
      praesens: {
        du: `lass dich ${innerVerb}`,
        ihr: `lasst euch ${innerVerb}`,
        sie_formal: `lassen Sie sich ${innerVerb}`
      }
    },
    partizip: {
      partizip_i: "-",
      partizip_ii: `${innerVerb} lassen`
    },
    infinitiv: {
      praesens: fullInfinitive
    }
  };
}

export function attachConjugations(words, irregularList) {
  validateIrregularEntries(irregularList);
  const irregularMap = buildIrregularMap(irregularList);
  (words || []).forEach(word => {
    if (!isVerbEntry(word)) return;
    if (normalizeWord(word.word).toLowerCase() === "sich beraten lassen") {
      word.conjugation_status = "irregular compound";
      word.conjugation = buildReflexiveLassenCompound("beraten");
      return;
    }
    const info = parseVerb(word.word);
    if (!info) return;

    const irregular = resolveIrregular(info, irregularMap);
    if (irregular) {
      word.conjugation_status = "irregular";
      word.conjugation = buildConjugationFromIrregular(info.coreVerb, irregular.entry, {
        ...info,
        matchType: irregular.matchType
      });
      return;
    }

    if (AMBIGUOUS_VERBS.has(info.coreVerb.toLowerCase())) {
      word.conjugation_status = "needs decision";
    } else {
      word.conjugation_status = "regular";
    }

    word.conjugation = buildConjugationFromRegular(info.coreVerb, info);
  });
}


