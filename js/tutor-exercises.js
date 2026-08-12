const optionSets = {
  der: ["der", "den", "dem", "des"],
  den: ["der", "den", "dem", "des"],
  dem: ["der", "den", "dem", "des"],
  des: ["der", "den", "dem", "des"],
  die: ["die", "der", "den", "dem"],
  das: ["das", "der", "dem", "des"]
};
const exercise = (sentence, answer, explanationEn, explanationBn, topic, level = "A1") => ({
  sentence, options: optionSets[answer], answer, explanationEn, explanationBn, topic, level
});

export const CASE_EXERCISES = [
  exercise("Ich sehe ___ Mann.", "den", "sehen takes a direct accusative object.", "sehen verb-এর সরাসরি object Akkusativ হয়।", "akkusativ"),
  exercise("Wir kaufen ___ Tisch.", "den", "kaufen takes a direct accusative object.", "kaufen-এর সরাসরি object Akkusativ হয়।", "akkusativ"),
  exercise("Sie besucht ___ Arzt.", "den", "besuchen takes an accusative object.", "besuchen verb-এর object Akkusativ হয়।", "akkusativ"),
  exercise("Er braucht ___ Computer.", "den", "brauchen takes an accusative object.", "brauchen verb-এর object Akkusativ হয়।", "akkusativ"),
  exercise("Ich frage ___ Lehrer.", "den", "fragen takes the person in the accusative.", "fragen-এর person Akkusativ হয়।", "akkusativ", "A2"),
  exercise("Das Geschenk ist für ___ Vater.", "den", "für always takes the accusative.", "für সব সময় Akkusativ নেয়।", "prepositions"),
  exercise("Wir gehen durch ___ Park.", "den", "durch always takes the accusative.", "durch সব সময় Akkusativ নেয়।", "prepositions"),
  exercise("Er läuft um ___ See.", "den", "um takes the accusative here.", "এখানে um Akkusativ নেয়।", "prepositions"),
  exercise("Ich helfe ___ Mann.", "dem", "helfen takes a dative object.", "helfen verb-এর object Dativ হয়।", "dativ"),
  exercise("Sie dankt ___ Lehrer.", "dem", "danken takes a dative object.", "danken verb-এর object Dativ হয়।", "dativ"),
  exercise("Das Buch gehört ___ Schüler.", "dem", "gehören takes a dative object.", "gehören verb-এর object Dativ হয়।", "dativ", "A2"),
  exercise("Der Film gefällt ___ Vater.", "dem", "gefallen takes the person in the dative.", "gefallen-এর person Dativ হয়।", "dativ", "A2"),
  exercise("Ich antworte ___ Arzt.", "dem", "antworten takes a dative object.", "antworten verb-এর object Dativ হয়।", "dativ", "A2"),
  exercise("Wir sprechen mit ___ Nachbarn.", "dem", "mit always takes the dative.", "mit সব সময় Dativ নেয়।", "prepositions"),
  exercise("Er kommt aus ___ Garten.", "dem", "aus always takes the dative.", "aus সব সময় Dativ নেয়।", "prepositions"),
  exercise("Ich fahre zu ___ Bahnhof.", "dem", "zu always takes the dative.", "zu সব সময় Dativ নেয়।", "prepositions"),
  exercise("Das Auto steht vor ___ Haus.", "dem", "A fixed location with vor takes the dative.", "স্থির অবস্থানে vor Dativ নেয়।", "prepositions", "A2"),
  exercise("Ich stelle das Auto vor ___ Haus.", "das", "A destination with vor takes the accusative; Haus is neuter.", "গন্তব্য বোঝালে vor Akkusativ নেয়; Haus ক্লীবলিঙ্গ।", "prepositions", "A2"),
  exercise("Das Bild hängt an ___ Wand.", "der", "A fixed location with an takes the dative; Wand is feminine.", "স্থির অবস্থানে an Dativ নেয়; Wand স্ত্রীলিঙ্গ।", "prepositions", "A2"),
  exercise("Ich hänge das Bild an ___ Wand.", "die", "A destination with an takes the accusative; Wand is feminine.", "গন্তব্য বোঝালে an Akkusativ নেয়; Wand স্ত্রীলিঙ্গ।", "prepositions", "A2"),
  exercise("___ Mann gibt dem Kind ein Buch.", "der", "The subject is nominative masculine.", "কর্তা পুংলিঙ্গ Nominativ, তাই der।", "mixed"),
  exercise("Ich gebe ___ Mann das Geld.", "dem", "The recipient is dative masculine.", "প্রাপক পুংলিঙ্গ Dativ, তাই dem।", "mixed"),
  exercise("Ich kenne ___ Mann.", "den", "The known person is the accusative object.", "পরিচিত person এখানে Akkusativ object।", "mixed"),
  exercise("Das ist das Auto ___ Mannes.", "des", "Possession is expressed with masculine genitive des.", "মালিকানা বোঝাতে পুংলিঙ্গ Genitiv des হয়।", "mixed", "A2")
];

export const COMMON_MISTAKE_RULES = [
  {
    id: "gehen-perfect-auxiliary", level: "A1", topic: "perfekt",
    regex: /^\s*ich\s+habe\s+gegangen\s*[.!?]?\s*$/iu,
    suggestion: () => "Ich bin gegangen.",
    explanationEn: "gehen forms the Perfekt with sein: ich bin gegangen.",
    explanationBn: "gehen-এর Perfekt sein দিয়ে হয়: ich bin gegangen."
  },
  {
    id: "mit-masculine-mann", level: "A1", topic: "dativ",
    regex: /\bmit\s+den\s+Mann\b/iu,
    suggestion: sentence => sentence.replace(/\bmit\s+den\s+Mann\b/iu, "mit dem Mann"),
    explanationEn: "mit always takes the dative; masculine der Mann becomes dem Mann.",
    explanationBn: "mit সব সময় Dativ নেয়; der Mann বদলে dem Mann হয়।"
  },
  {
    id: "modal-zu-kommen", level: "A1/A2", topic: "modal-verbs",
    regex: /\b(ich|du|er|sie|es|wir|ihr|Sie)\s+(kann|kannst|können|könnt)\s+zu\s+kommen\b/iu,
    suggestion: sentence => sentence.replace(/\b(kann|kannst|können|könnt)\s+zu\s+kommen\b/iu, "$1 kommen"),
    explanationEn: "A modal verb is followed by the infinitive without zu.",
    explanationBn: "Modalverb-এর পরে infinitive-এর আগে zu হয় না।"
  },
  {
    id: "weil-ich-bin-adjective", level: "A2", topic: "weil",
    regex: /\bweil\s+ich\s+bin\s+(müde|krank|hungrig|glücklich|traurig)\b/iu,
    suggestion: sentence => sentence.replace(/\bweil\s+ich\s+bin\s+(müde|krank|hungrig|glücklich|traurig)\b/iu, "weil ich $1 bin"),
    explanationEn: "In a weil-clause, the conjugated verb normally goes to the end.",
    explanationBn: "weil-clause-এ conjugated verb সাধারণত শেষে যায়।"
  },
  {
    id: "dass-er-ist-adjective", level: "A2", topic: "dass",
    regex: /\bdass\s+er\s+ist\s+(müde|krank|hungrig|glücklich|traurig)\b/iu,
    suggestion: sentence => sentence.replace(/\bdass\s+er\s+ist\s+(müde|krank|hungrig|glücklich|traurig)\b/iu, "dass er $1 ist"),
    explanationEn: "In a dass-clause, the conjugated verb normally goes to the end.",
    explanationBn: "dass-clause-এ conjugated verb সাধারণত শেষে যায়।"
  },
  {
    id: "kein-predicate-adjective", level: "A1/A2", topic: "negation",
    regex: /\b(ist|bin|bist|sind|seid)\s+kein\s+(teuer|gut|schlecht|groß|klein|schnell|langsam)\b/iu,
    suggestion: sentence => sentence.replace(/\b(ist|bin|bist|sind|seid)\s+kein\s+(teuer|gut|schlecht|groß|klein|schnell|langsam)\b/iu, "$1 nicht $2"),
    explanationEn: "Use nicht to negate a predicate adjective; kein negates nouns.",
    explanationBn: "Predicate adjective নাকচ করতে nicht হয়; kein বিশেষ্য নাকচ করে।"
  }
];
