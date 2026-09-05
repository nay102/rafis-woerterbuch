import { PRONOUNS_SESSION } from "./library-pronouns-data.js";
import { VERB_CONJUGATION_SESSION } from "./library-verbs-data.js";
import { SENTENCE_STRUCTURE_SESSION } from "./library-sentence-structure-data.js";
import { QUESTIONS_SESSION } from "./library-questions-data.js";
import { NEGATION_SESSION } from "./library-negation-data.js";
import { MODAL_VERBS_SESSION } from "./library-modal-verbs-data.js";
import { CASES_SESSION } from "./library-cases-data.js";
import { GREETINGS_SESSION } from "./library-greetings-data.js";
import { FAMILY_SESSION } from "./library-family-data.js";
import { FOOD_DRINKS_SESSION } from "./library-food-drinks-data.js";
import { NUMBERS_SESSION } from "./library-numbers-data.js";
import { HOME_SESSION } from "./library-home-data.js";
import { TRAVEL_SESSION } from "./library-travel-data.js";
import { SHOPPING_SESSION } from "./library-shopping-data.js";
import { SCHOOL_WORK_SESSION } from "./library-school-work-data.js";

const mc = (id, prompt, options, answer, explanationEn, explanationBn = "", skill = "articles", lessonId = "") => ({
  id, type: "multipleChoice", prompt, options, answer, explanationEn, explanationBn, skill, lessonId
});
const fill = (id, prompt, answer, explanationEn, explanationBn = "", skill = "articles", lessonId = "") => ({
  id, type: "fillBlank", prompt, answer, explanationEn, explanationBn, skill, lessonId
});
const block = (type, title, en, bn, items = []) => ({ type, title, en, bn, items });

export const LIBRARY_SESSIONS = {
  "A1:articles": {
    id: "articles",
    level: "A1",
    title: "Articles",
    germanTitle: "Artikel",
    type: "grammar",
    estimatedMinutes: 35,
    difficulty: "Beginner",
    masteryThreshold: 80,
    shortDescriptionEn: "Learn how German nouns use der, die, das, ein and eine, and build the habit of learning every noun together with its article.",
    shortDescriptionBn: "German noun-এর সঙ্গে der, die, das, ein এবং eine কীভাবে ব্যবহার করতে হয় শিখুন এবং প্রতিটি noun article-সহ শেখার অভ্যাস তৈরি করুন।",
    topicGoalEn: "Understand the basic German article system and correctly use the most important definite and indefinite articles with common A1 nouns.",
    topicGoalBn: "German-এর basic article system বুঝে সাধারণ A1 noun-এর সঙ্গে সঠিক definite ও indefinite article ব্যবহার করতে পারা।",
    prerequisites: ["Basic understanding that German has nouns.", "Ability to recognize simple German words.", "No previous knowledge of German cases is required."],
    objectives: [
      "Explain that German nouns have grammatical gender.", "Recognize masculine, feminine and neuter nouns.",
      "Use der, die and das with basic singular nouns.", "Use ein, eine and ein with basic singular nouns.",
      "Recognize that plural nouns use die as the definite article.", "Understand that there is no plural form of ein/eine.",
      "Learn nouns together with their articles.", "Recognize useful noun-ending patterns without treating them as absolute rules.",
      "Distinguish first mention with ein/eine from later reference with der/die/das.", "Correct common beginner article mistakes."
    ],
    lessons: [
      {
        id: "article-basics", titleEn: "What Is an Article?", titleDe: "Was ist ein Artikel?", titleBn: "Artikel কী?", estimatedMinutes: 5,
        blocks: [
          block("paragraph", "What articles show", "German nouns normally have a grammatical gender: masculine, feminine or neuter. The article helps show the noun's gender. German nouns are written with a capital letter.", "German noun-এর grammatical gender থাকে: Maskulin, Feminin অথবা Neutrum। Noun-এর article দেখে সাধারণত তার gender বোঝা যায়। German noun capital letter দিয়ে লেখা হয়।", ["der Mann", "die Frau", "das Kind"]),
          { type: "comparison", title: "The three genders", columns: ["Gender", "Article", "Example", "English", "বাংলা"], rows: [["Masculine", "der", "der Mann", "the man", "লোকটি / পুরুষটি"], ["Feminine", "die", "die Frau", "the woman", "মহিলাটি"], ["Neuter", "das", "das Kind", "the child", "শিশুটি"]] },
          block("tip", "Learn the article together with the noun", "Do not learn “Tisch = table”. Learn “der Tisch = table”. Do not learn “Wohnung = apartment”. Learn “die Wohnung = apartment”. Treat the article as part of the vocabulary item.", "শুধু Tisch বা Wohnung শিখবেন না। der Tisch এবং die Wohnung হিসেবে শিখুন। Article-কে noun-এর একটি অংশ হিসেবে মনে রাখুন।")
        ],
        checkpoint: [
          mc("cp1-1", "Which form should you learn?", ["Tisch", "der Tisch", "Tisch der", "ein der Tisch"], "der Tisch", "Excellent. Learn German nouns together with their articles.", "Article-সহ noun শিখুন: der Tisch।", "learning-habit", "article-basics"),
          mc("cp1-2", "Which German form is written correctly?", ["das buch", "Das buch", "das Buch", "Das Buch"], "das Buch", "The article is normally lowercase, but the noun begins with a capital letter: das Buch.", "Article সাধারণত lowercase হয়, কিন্তু German noun capital letter দিয়ে শুরু হয়: das Buch।", "capitalization", "article-basics")
        ]
      },
      {
        id: "definite-articles", titleEn: "der, die and das", titleDe: "der, die und das", titleBn: "der, die এবং das", estimatedMinutes: 6,
        blocks: [
          block("rule", "Basic definite articles", "der, die and das are the basic definite articles. Here: der → masculine singular, die → feminine singular, das → neuter singular. All three can correspond to English “the”.", "der, die এবং das basic definite article। der → masculine singular, die → feminine singular, das → neuter singular। তিনটিই English “the”-এর মতো কাজ করতে পারে।"),
          { type: "vocabulary", title: "Masculine examples", items: [["der Mann", "the man", "লোকটি"], ["der Tisch", "the table", "টেবিলটি"], ["der Apfel", "the apple", "আপেলটি"], ["der Bahnhof", "the train station", "রেলস্টেশনটি"], ["der Beruf", "the profession", "পেশাটি"]] },
          { type: "vocabulary", title: "Feminine examples", items: [["die Frau", "the woman", "মহিলাটি"], ["die Schule", "the school", "স্কুলটি"], ["die Wohnung", "the apartment", "ফ্ল্যাটটি / বাসাটি"], ["die Tasche", "the bag", "ব্যাগটি"], ["die Arbeit", "the work", "কাজটি"]] },
          { type: "vocabulary", title: "Neuter examples", items: [["das Kind", "the child", "শিশুটি"], ["das Buch", "the book", "বইটি"], ["das Haus", "the house", "বাড়িটি"], ["das Auto", "the car", "গাড়িটি"], ["das Handy", "the mobile phone", "মোবাইল ফোনটি"]] },
          block("tip", "Memory tip", "Do not translate der, die and das into different English words. The important difference is grammatical gender.", "der, die এবং das-এর জন্য আলাদা English meaning খুঁজবেন না। মূল পার্থক্য হলো grammatical gender।")
        ],
        checkpoint: [["Mann", "der", "masculine"], ["Schule", "die", "feminine"], ["Buch", "das", "neuter"], ["Wohnung", "die", "feminine"], ["Auto", "das", "neuter"]].map(([noun, answer, gender], i) => mc(`cp2-${i+1}`, `___ ${noun}`, ["der", "die", "das"], answer, `${noun} is ${gender}: ${answer} ${noun}.`, "", "definite-article", "definite-articles"))
      },
      {
        id: "indefinite-articles", titleEn: "ein, eine and ein", titleDe: "ein, eine und ein", titleBn: "ein, eine এবং ein", estimatedMinutes: 6,
        blocks: [
          block("paragraph", "Indefinite articles", "Use an indefinite article for one person or thing that is not a specific known one. Masculine: ein. Feminine: eine. Neuter: ein.", "নির্দিষ্টভাবে পরিচিত নয় এমন একটি person বা thing-এর জন্য indefinite article ব্যবহার হয়। Masculine: ein, Feminine: eine, Neuter: ein।"),
          { type: "comparison", title: "Definite and indefinite", columns: ["Gender", "Definite", "Indefinite"], rows: [["Masculine", "der Mann", "ein Mann"], ["Feminine", "die Frau", "eine Frau"], ["Neuter", "das Kind", "ein Kind"]] },
          { type: "example", title: "Simple examples", items: [["Das ist ein Mann.", "That is a man.", "এটি একজন পুরুষ।"], ["Das ist eine Frau.", "That is a woman.", "এটি একজন মহিলা।"], ["Das ist ein Kind.", "That is a child.", "এটি একটি শিশু।"], ["Das ist ein Auto.", "That is a car.", "এটি একটি গাড়ি।"], ["Das ist eine Tasche.", "That is a bag.", "এটি একটি ব্যাগ।"]] },
          block("warning", "A1 scope", "Article forms can change later because of German cases. For now, focus only on these basic forms.", "পরবর্তী grammar topic-এ case-এর কারণে article পরিবর্তিত হতে পারে। এখানে শুধু basic form শিখুন।")
        ],
        checkpoint: [["Mann", "ein"], ["Frau", "eine"], ["Kind", "ein"], ["Wohnung", "eine"], ["Auto", "ein"]].map(([noun, answer], i) => mc(`cp3-${i+1}`, `Das ist ___ ${noun}.`, answer === "ein" ? ["ein", "eine", "die"] : ["ein", "eine", "das"], answer, `${answer} ${noun} is the basic indefinite form.`, "", "indefinite-article", "indefinite-articles"))
      },
      {
        id: "plural-articles", titleEn: "Articles in the Plural", titleDe: "Artikel im Plural", titleBn: "Plural-এর Article", estimatedMinutes: 5,
        blocks: [
          block("rule", "Plural rule", "The basic definite article for plural nouns is die: die Männer, die Frauen, die Kinder, die Bücher, die Autos.", "Basic definite plural article হলো die: die Männer, die Frauen, die Kinder, die Bücher, die Autos।"),
          { type: "comparison", title: "Singular and plural", columns: ["Singular", "Plural"], rows: [["der Mann", "die Männer"], ["die Frau", "die Frauen"], ["das Kind", "die Kinder"], ["das Buch", "die Bücher"], ["das Auto", "die Autos"]] },
          block("paragraph", "Two uses of die", "die can mark feminine singular (die Frau) or plural (die Frauen). The noun form helps show singular or plural.", "die feminine singular (die Frau) অথবা plural (die Frauen) হতে পারে। Noun-এর form দেখে number বোঝা যায়।"),
          block("warning", "No plural ein/eine", "German does not use ein or eine as a plural indefinite article. Say “Das sind Bücher”, not “ein Bücher”.", "Plural-এর জন্য ein/eine ব্যবহার হয় না। Das sind Bücher বলুন; ein Bücher ভুল।")
        ],
        checkpoint: [mc("cp4-1", "What is the basic definite article for plural nouns?", ["der", "die", "das", "ein"], "die", "German uses die for the basic definite plural form.", "Basic definite plural form হলো die।", "plural", "plural-articles"), mc("cp4-2", "Which is correct?", ["ein Bücher", "eine Bücher", "die Bücher", "das Bücher"], "die Bücher", "Bücher is plural, so use die Bücher.", "Bücher plural, তাই die Bücher।", "plural", "plural-articles")]
      },
      {
        id: "gender-patterns", titleEn: "Useful Gender Clues", titleDe: "Hilfen beim Genus", titleBn: "Gender চেনার কিছু Useful Pattern", estimatedMinutes: 6,
        blocks: [
          block("warning", "Patterns are clues", "You cannot always know a noun's gender by looking at it. The safest strategy is learning the noun with its article. Some endings are useful clues.", "শুধু noun দেখে gender সবসময় নিশ্চিত হওয়া যায় না। Article-সহ noun শেখাই সবচেয়ে নিরাপদ। কিছু ending clue দেয়।"),
          block("rule", "Often feminine", "Nouns ending in -ung, -heit, -keit and -schaft are very often feminine.", "-ung, -heit, -keit এবং -schaft ending-যুক্ত noun সাধারণত feminine।", ["die Wohnung", "die Gesundheit", "die Möglichkeit", "die Freundschaft"]),
          block("rule", "Neuter -chen", "Diminutive nouns ending in -chen are neuter.", "-chen ending-যুক্ত diminutive noun neuter।", ["das Mädchen", "das Brötchen"]),
          block("tip", "Do not overguess", "Patterns help, but do not replace vocabulary learning. Save “die Wohnung”, not simply “Wohnung”.", "Pattern helpful হলেও vocabulary শেখার বিকল্প নয়। die Wohnung হিসেবে শিখুন।")
        ],
        checkpoint: [mc("cp5-1", "Which article fits Wohnung?", ["der", "die", "das"], "die", "Wohnung ends in -ung, and -ung nouns are normally feminine.", "Wohnung -ung দিয়ে শেষ; সাধারণত feminine।", "gender-pattern", "gender-patterns"), mc("cp5-2", "Which is correct?", ["der Mädchen", "die Mädchen", "das Mädchen"], "das Mädchen", "Mädchen ends in -chen, which is neuter.", "Mädchen -chen দিয়ে শেষ, তাই neuter।", "gender-pattern", "gender-patterns")]
      },
      {
        id: "articles-in-context", titleEn: "Articles in Real German", titleDe: "Artikel im Kontext", titleBn: "Real Sentence-এ Article", estimatedMinutes: 6,
        blocks: [
          block("rule", "First mention and known thing", "A simple A1 pattern: introduce a person or thing with ein/eine; later, when it is known, use der/die/das.", "সহজ A1 pattern: প্রথমবার ein/eine; পরে পরিচিত হলে der/die/das।", ["Das ist eine Frau. Die Frau heißt Anna."]),
          { type: "dialogue", title: "A book", lines: [["A", "Was ist das?", "What is that?", "ওটা কী?"], ["B", "Das ist ein Buch.", "That is a book.", "ওটা একটি বই।"], ["A", "Ist das das Deutschbuch?", "Is that the German book?", "ওটা কি German বইটি?"], ["B", "Ja, das ist das Deutschbuch.", "Yes, that is the German book.", "হ্যাঁ, ওটাই German বইটি।"]] },
          { type: "example", title: "Another context", items: [["Das ist ein Haus. Das Haus ist groß.", "That is a house. The house is big.", "ওটা একটি বাড়ি। বাড়িটি বড়।"]] }
        ],
        checkpoint: [mc("cp6-1", "Das ist ___ Auto. ___ Auto ist neu.", ["ein / Das", "das / Ein", "eine / Die", "ein / Der"], "ein / Das", "The car is introduced with ein. It is then known, so use das Auto.", "প্রথমে ein Auto; পরে পরিচিত বলে das Auto।", "context-use", "articles-in-context")]
      }
    ],
    guidedPractice: [
      ...[["Tisch","der"],["Lampe","die"],["Handy","das"],["Wohnung","die"],["Auto","das"],["Mann","der"],["Schule","die"],["Buch","das"]].map(([noun, answer], i) => mc(`gp-def-${i+1}`, `___ ${noun}`, ["der","die","das"], answer, `${answer} ${noun}`, "", "definite-article")),
      ...[["Mann","ein"],["Tasche","eine"],["Auto","ein"],["Schule","eine"],["Kind","ein"]].map(([noun, answer], i) => mc(`gp-ind-${i+1}`, `Das ist ___ ${noun}.`, ["ein","eine"], answer, `${answer} ${noun}`, "", "indefinite-article")),
      { id: "gp-sort", type: "sorting", prompt: "Sort each noun by article.", groups: { der: ["Mann", "Tisch", "Apfel"], die: ["Frau", "Wohnung", "Schule"], das: ["Buch", "Kind", "Auto"] }, explanationEn: "Learn each noun together with its article.", skill: "definite-article" },
      ...[["das Frau","die Frau","Frau is feminine.","Frau feminine noun, তাই die Frau।"],["der Auto","das Auto","Auto is neuter.","Auto neuter।"],["eine Mann","ein Mann","Mann is masculine, so use ein.","Mann masculine, তাই ein Mann।"],["ein Frauen","Frauen","There is no plural indefinite article ein/eine. The definite form is die Frauen.","Plural-এর জন্য ein/eine নেই; definite form die Frauen।"]].map(([wrong, answer, en, bn], i) => ({ id:`gp-error-${i+1}`, type:"errorCorrection", prompt:`Correct: ${wrong}`, answer, explanationEn:en, explanationBn:bn, skill:"error-correction" }))
    ],
    realLifePractice: {
      id: "real-life-classroom", title: "Im Klassenzimmer",
      text: ["Das ist ein Tisch.", "Auf dem Tisch liegt ein Buch.", "Das ist eine Lampe.", "Die Lampe ist neu.", "Das Buch ist blau."],
      note: "Treat “auf dem Tisch” only as part of this reading; its case grammar belongs to another topic.",
      questions: [
        mc("rl-1", "Which noun is masculine?", ["Lampe","Tisch","Buch"], "Tisch", "Tisch is masculine: der Tisch."),
        fill("rl-2", "Which noun is feminine?", "Lampe", "Lampe is feminine: die Lampe."),
        fill("rl-3", "Which noun is neuter?", "Buch", "Buch is neuter: das Buch."),
        fill("rl-4", "Which phrase introduces the lamp?", "eine Lampe", "The lamp is introduced with eine Lampe."),
        mc("rl-5", "Why does the next sentence say “Die Lampe”?", ["The lamp is already known in context", "All lamps are masculine", "Plural nouns use das"], "The lamp is already known in context", "The lamp has already been introduced and is now known in context.", "Lampe-টি আগে introduce হয়েছে, তাই এখন পরিচিত এবং die Lampe ব্যবহৃত হয়েছে।", "context-use")
      ]
    },
    independentPractice: [
      ...[["Bahnhof","der"],["Arbeit","die"],["Haus","das"],["Beruf","der"],["Tasche","die"],["Kind","das"],["Apfel","der"],["Wohnung","die"]].map(([noun, answer], i) => fill(`ip-def-${i+1}`, `___ ${noun}`, answer, `${answer} ${noun}`, "", "definite-article")),
      ...[["Buch","ein"],["Frau","eine"],["Haus","ein"],["Tasche","eine"],["Mann","ein"]].map(([noun, answer], i) => fill(`ip-ind-${i+1}`, `Das ist ___ ${noun}.`, answer, `${answer} ${noun}`, "", "indefinite-article")),
      ...[["die Frau","singular"],["die Frauen","plural"],["die Kinder","plural"],["das Kind","singular"],["die Bücher","plural"]].map(([phrase, answer], i) => mc(`ip-num-${i+1}`, phrase, ["singular","plural"], answer, `${phrase} is ${answer}.`, "", "plural"))
    ],
    masteryQuestions: [
      ...[["Mann","der"],["Frau","die"],["Kind","das"],["Wohnung","die"],["Bahnhof","der"]].map(([noun,a],i)=>mc(`m-${i+1}`,`___ ${noun}`,["der","die","das"],a,`${a} ${noun}`,"","definite-article",a==="die"&&noun==="Wohnung"?"gender-patterns":"definite-articles")),
      mc("m-6","Das ist ___ Mann.",["ein","eine","die"],"ein","Mann is masculine: ein Mann.","","indefinite-article","indefinite-articles"),
      mc("m-7","Das ist ___ Tasche.",["ein","eine","das"],"eine","Tasche is feminine: eine Tasche.","","indefinite-article","indefinite-articles"),
      mc("m-8","Das ist ___ Auto.",["ein","eine","der"],"ein","Auto is neuter: ein Auto.","","indefinite-article","indefinite-articles"),
      mc("m-9","Which is correct?",["die Bücher","ein Bücher","das Bücher","eine Bücher"],"die Bücher","Bücher is plural, so use die Bücher.","","plural","plural-articles"),
      mc("m-10","What is the basic definite article for plural nouns?",["der","die","das","ein"],"die","The basic definite plural article is die.","","plural","plural-articles"),
      mc("m-11","Which is feminine?",["der Tisch","die Schule","das Buch"],"die Schule","Schule is feminine.","","definite-article","definite-articles"),
      mc("m-12","Which is neuter?",["der Apfel","die Tasche","das Handy"],"das Handy","Handy is neuter.","","definite-article","definite-articles"),
      mc("m-13","Which is masculine?",["die Arbeit","das Haus","der Beruf"],"der Beruf","Beruf is masculine.","","definite-article","definite-articles"),
      mc("m-14","Which form should a beginner ideally memorize?",["Wohnung","die Wohnung","Wohnung die","eine die Wohnung"],"die Wohnung","Learn nouns together with their articles.","","learning-habit","article-basics"),
      mc("m-15","Which sentence is correct?",["Das ist eine Frau.","Das ist ein Frau.","Das ist einen Frau.","Das ist das eine Frau."],"Das ist eine Frau.","Frau is feminine, so use eine Frau.","","indefinite-article","indefinite-articles"),
      mc("m-16","Which is correct?",["der Mädchen","die Mädchen","das Mädchen"],"das Mädchen","Nouns ending in -chen are neuter.","","gender-pattern","gender-patterns"),
      mc("m-17","Which article fits Wohnung?",["der","die","das"],"die","Wohnung ends in -ung, and -ung nouns are normally feminine.","","gender-pattern","gender-patterns"),
      mc("m-18","Das ist ___ Haus. ___ Haus ist groß.",["ein / Das","das / Ein","eine / Die","ein / Der"],"ein / Das","First mention: ein Haus. Known thing: das Haus.","","context-use","articles-in-context"),
      mc("m-19","Which sentence contains a plural noun?",["Die Frau ist hier.","Das Kind spielt.","Die Frauen sind hier.","Der Mann arbeitet."],"Die Frauen sind hier.","Frauen is plural.","","plural","plural-articles"),
      mc("m-20","Which statement is correct?",["Every German noun uses der.","Every German noun uses die.","German singular nouns can have der, die or das.","All plural nouns use das."],"German singular nouns can have der, die or das.","German has masculine, feminine and neuter singular nouns.","","articles","article-basics")
    ],
    completionKnowledge: ["der / die / das", "ein / eine / ein", "plural die", "learn noun + article", "basic gender patterns", "articles in simple context"],
    masteryMessages: {
      mastered: { title: "Topic Mastered", en: "Great work. You understand the basic A1 article system.", bn: "দারুণ। আপনি A1-এর basic article system ভালোভাবে বুঝেছেন।" },
      almost: { title: "Almost There", en: "You understand much of the topic, but a little more practice will help.", bn: "Topic-এর বেশিরভাগ অংশ আপনি বুঝেছেন। আরেকটু practice করলে mastery হবে।" },
      practice: { title: "Keep Practicing", en: "Review the lessons marked below, then try the mastery check again.", bn: "নিচের lesson-গুলো আবার review করুন, তারপর Mastery Check আবার চেষ্টা করুন।" }
    },
    nextTopicTitle: "Pronouns",
    nextTopic: "pronouns"
  },
  "A1:pronouns": PRONOUNS_SESSION,
  "A1:verb-conjugation": VERB_CONJUGATION_SESSION,
  "A1:sentence-structure": SENTENCE_STRUCTURE_SESSION,
  "A1:questions": QUESTIONS_SESSION,
  "A1:negation": NEGATION_SESSION,
  "A1:modal-verbs": MODAL_VERBS_SESSION,
  "A1:cases": CASES_SESSION,
  "A1:greetings": GREETINGS_SESSION,
  "A1:family": FAMILY_SESSION,
  "A1:food-drinks": FOOD_DRINKS_SESSION,
  "A1:numbers": NUMBERS_SESSION,
  "A1:home": HOME_SESSION,
  "A1:travel": TRAVEL_SESSION,
  "A1:shopping": SHOPPING_SESSION,
  "A1:school-work": SCHOOL_WORK_SESSION
};

export function getLibrarySession(level, id) {
  return LIBRARY_SESSIONS[`${String(level).toUpperCase()}:${id}`] || null;
}
