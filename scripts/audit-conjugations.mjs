import assert from "node:assert/strict";
import fs from "node:fs";
import { attachConjugations } from "../js/conjugation.js";

const parseJson = path =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, ""));
const words = parseJson("../js/words.json");
const irregularVerbs = parseJson("../js/irregular_verbs.json");
const verbs = words.filter(word => word.category === "Verben");
attachConjugations(verbs, irregularVerbs);

assert.equal(verbs.length, 527, "Unexpected Verben count");
assert.equal(
  verbs.filter(verb => !verb.conjugation).length,
  0,
  "Every verb must receive a conjugation"
);

const personPaths = [
  ["indikativ", "praesens"],
  ["indikativ", "praeteritum"],
  ["indikativ", "perfekt"],
  ["indikativ", "plusquamperfekt"],
  ["indikativ", "futur_i"],
  ["indikativ", "futur_ii"],
  ["konjunktiv_i", "praesens"],
  ["konjunktiv_i", "perfekt"],
  ["konjunktiv_i", "futur_i"],
  ["konjunktiv_ii", "praeteritum"],
  ["konjunktiv_ii", "plusquamperfekt"],
  ["konjunktiv_ii", "futur_i"],
  ["konjunktiv_ii", "futur_ii"]
];
const people = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_formal"];
let personFormsChecked = 0;

for (const verb of verbs) {
  for (const [mood, tense] of personPaths) {
    for (const person of people) {
      assert.ok(
        verb.conjugation[mood][tense][person],
        `${verb.word}: missing ${mood}.${tense}.${person}`
      );
      personFormsChecked += 1;
    }
  }
  for (const person of ["du", "ihr", "sie_formal"]) {
    assert.ok(
      verb.conjugation.imperativ.praesens[person],
      `${verb.word}: missing imperative ${person}`
    );
  }
  assert.ok(verb.conjugation.partizip.partizip_i, `${verb.word}: missing Partizip I`);
  assert.ok(verb.conjugation.partizip.partizip_ii, `${verb.word}: missing Partizip II`);
  assert.ok(verb.conjugation.infinitiv.praesens, `${verb.word}: missing infinitive`);
}

const serialized = JSON.stringify(verbs.map(verb => verb.conjugation));
for (const malformed of [
  /\bundefined\b/,
  /\bnull\b/,
  /eenen\b/,
  /teen\b/,
  /geüber/i,
  /geunter/i,
  /fortgebewegt/i
]) {
  assert.equal(malformed.test(serialized), false, `Malformed form matched ${malformed}`);
}

const expectedPrincipalForms = {
  verb3: ["schneidet", "schnitt", "hat geschnitten", "schnitten"],
  verb12: ["nennt", "nannte", "hat genannt", "nannten"],
  verb36: ["kommt rein", "kam rein", "ist reingekommen", "kamen rein"],
  verb75: ["absolviert", "absolvierte", "hat absolviert", "absolvierten"],
  verb87: ["verhält sich", "verhielt sich", "hat sich verhalten", "verhielten uns"],
  verb99: ["übernimmt", "übernahm", "hat übernommen", "übernahmen"],
  verb157: ["trägt bei", "trug bei", "hat beigetragen", "trugen bei"],
  verb183: ["probiert aus", "probierte aus", "hat ausprobiert", "probierten aus"],
  verb190: [
    "bewegt sich fort",
    "bewegte sich fort",
    "hat sich fortbewegt",
    "bewegten uns fort"
  ],
  verb200: ["bringt bei", "brachte bei", "hat beigebracht", "brachten bei"],
  verb233: ["vollzieht nach", "vollzog nach", "hat nachvollzogen", "vollzogen nach"],
  verb256: ["einigt sich", "einigte sich", "hat sich geeinigt", "einigten uns"],
  verb298: [
    "lässt sich beraten",
    "ließ sich beraten",
    "hat sich beraten lassen",
    "ließen uns beraten"
  ],
  verb447: ["reist", "reiste", "ist gereist", "reisten"],
  verb477: ["steht auf", "stand auf", "ist aufgestanden", "standen auf"],
  verb488: ["fährt", "fuhr", "ist gefahren", "fuhren"],
  verb509: ["ist", "war", "ist gewesen", "waren"]
};

for (const [id, expected] of Object.entries(expectedPrincipalForms)) {
  const conjugation = verbs.find(verb => verb.id === id)?.conjugation;
  assert.ok(conjugation, `Missing snapshot verb ${id}`);
  assert.deepEqual(
    [
      conjugation.indikativ.praesens.er_sie_es,
      conjugation.indikativ.praeteritum.er_sie_es,
      conjugation.indikativ.perfekt.er_sie_es,
      conjugation.indikativ.praeteritum.wir
    ],
    expected,
    id
  );
}

assert.equal(
  verbs.find(verb => verb.id === "verb488").conjugation.konjunktiv_ii.praeteritum.wir,
  "führen"
);
assert.equal(
  verbs.find(verb => verb.id === "verb509").conjugation.konjunktiv_ii.praeteritum.wir,
  "wären"
);
assert.equal(
  verbs.find(verb => verb.id === "verb33").conjugation.konjunktiv_i.perfekt.er_sie_es,
  "sei gelaufen"
);
assert.equal(
  verbs.find(verb => verb.id === "verb477").conjugation.imperativ.praesens.du,
  "steh auf"
);
assert.equal(
  verbs.find(verb => verb.id === "verb87").conjugation.imperativ.praesens.du,
  "verhalte dich"
);
assert.equal(
  verbs.find(verb => verb.id === "verb78").conjugation.partizip.partizip_i,
  "teilnehmend"
);
assert.equal(
  verbs.find(verb => verb.id === "verb43").conjugation.infinitiv.praesens,
  "sich erholen"
);

console.log(
  JSON.stringify(
    {
      verbs: verbs.length,
      irregularRoots: irregularVerbs.length,
      regular: verbs.filter(verb => verb.conjugation_status === "regular").length,
      irregular: verbs.filter(verb => verb.conjugation_status === "irregular").length,
      irregularCompound: verbs.filter(
        verb => verb.conjugation_status === "irregular compound"
      ).length,
      personFormsChecked,
      principalFormSnapshots: Object.keys(expectedPrincipalForms).length
    },
    null,
    2
  )
);
