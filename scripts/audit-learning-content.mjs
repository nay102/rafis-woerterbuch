import fs from "node:fs";
import {validateDictionary} from "../js/data-quality.js";
import {attachConjugations} from "../js/conjugation.js";
import {A1_FLASHCARDS} from "../js/a1-flashcard-data.js";

const read = path => JSON.parse(fs.readFileSync(new URL(path,import.meta.url),"utf8").replace(/^\uFEFF/,""));
const words=read("../js/words.json").filter(word=>word && !word._meta && !word.id?.startsWith("__"));
attachConjugations(words,read("../js/irregular_verbs.json"));
const dictionary=validateDictionary(words),banks=[];
for(const file of fs.readdirSync(new URL("../js/",import.meta.url)).filter(name=>/^a1-.*data\.js$/.test(name))){
  const module=await import(new URL(`../js/${file}`,import.meta.url));
  for(const [name,validator] of Object.entries(module)) if(/^validate/.test(name)&&typeof validator==="function") banks.push({file,validator:name,issues:validator()});
}
const flashcardLanguageIssues=A1_FLASHCARDS.filter(card=>!card.english || !/[\u0980-\u09ff]/u.test(card.bengali||"")).map(card=>({id:card.id,german:card.german}));
const result={dictionary:{entries:dictionary.totalWords,counts:dictionary.counts,issues:dictionary.issues},banks,flashcards:{count:A1_FLASHCARDS.length,languageIssues:flashcardLanguageIssues},scope:"Automated structure and language-script checks. These do not certify the accuracy of every translation, synonym, example or CEFR label."};
console.log(JSON.stringify(result,null,2));
if(dictionary.counts.error||dictionary.counts.warning||banks.some(bank=>bank.issues.length)||flashcardLanguageIssues.length)process.exitCode=1;
