export const A1_LIBRARY_TOPICS = Object.freeze([
  {id:"articles",label:"Articles",group:"grammar",lessons:6},
  {id:"pronouns",label:"Pronouns",group:"grammar",lessons:6},
  {id:"verb-conjugation",label:"Verb Conjugation",group:"grammar",lessons:7},
  {id:"sentence-structure",label:"Sentence Structure",group:"grammar",lessons:7},
  {id:"questions",label:"Questions",group:"grammar",lessons:7},
  {id:"negation",label:"Negation",group:"grammar",lessons:7},
  {id:"modal-verbs",label:"Modal Verbs",group:"grammar",lessons:7},
  {id:"cases",label:"Cases",group:"grammar",lessons:8},
  {id:"greetings",label:"Greetings & Introductions",group:"vocabulary",lessons:8},
  {id:"family",label:"Family",group:"vocabulary",lessons:8},
  {id:"food-drinks",label:"Food & Drinks",group:"vocabulary",lessons:8},
  {id:"numbers",label:"Numbers",group:"vocabulary",lessons:8},
  {id:"home",label:"Home",group:"vocabulary",lessons:8},
  {id:"travel",label:"Travel",group:"vocabulary",lessons:8},
  {id:"shopping",label:"Shopping",group:"vocabulary",lessons:8},
  {id:"school-work",label:"School & Work",group:"vocabulary",lessons:8}
]);

export const A1_PRACTICE_ACTIVITIES = Object.freeze([
  {id:"grammar",label:"Grammar Challenge",key:"rw_a1_grammar_challenge_v1"},
  {id:"flashcards",label:"Flashcard Trainer",key:"rw_a1_flashcards_v1"},
  {id:"matching",label:"Match the Words",key:"rw_a1_matching_v1"},
  {id:"listening",label:"Listen & Choose",key:"rw_a1_listening_v1"},
  {id:"reading",label:"Reading Practice",key:"rw_a1_reading_v1"},
  {id:"writing",label:"Sentence Builder",key:"rw_a1_sentence_builder_v1"},
  {id:"speaking",label:"Speaking Practice",key:"rw_a1_speaking_v1"},
  {id:"communication",label:"Real-Life Dialogues",key:"rw_a1_dialogues_v1"}
]);

export const A1_MIXED_PROGRESS_KEY = "rw_a1_mixed_mastery_v1";
export const A1_PROGRESS_KEYS = Object.freeze(["rw_library_progress_v1", ...A1_PRACTICE_ACTIVITIES.map(item=>item.key), A1_MIXED_PROGRESS_KEY]);
const libraryLessonIds = Object.freeze({
  articles:["article-basics","definite-articles","indefinite-articles","plural-articles","gender-patterns","articles-in-context"],
  pronouns:["pronoun-basics","personal-pronouns","du-vs-sie","replace-nouns","possessive-pronouns","akkusativ-pronouns-intro"],
  "verb-conjugation":["verb-basics","regular-verbs","verb-spelling","sein","haben","stem-changing-verbs","separable-verbs"],
  "sentence-structure":["basic-sentence","verb-position-two","time-first","objects-and-details","time-manner-place","sentence-bracket","common-patterns"],
  questions:["question-basics","w-question-structure","wer-was","wo-woher-wohin","wann-wie","yes-no-questions","practical-questions"],
  negation:["negation-basics","nicht-basics","kein-basics","nicht-vs-kein","nicht-position","negative-answers","negation-in-context"],
  "modal-verbs":["modal-basics","koennen","muessen","wollen-moechten","duerfen","modal-sentence-bracket","modal-questions-context"],
  cases:["case-basics","nominativ","akkusativ","akkusativ-verbs","dativ","dativ-verbs","case-prepositions","case-comparison"],
  greetings:["basic-greetings","farewells","names","origin","residence","how-are-you","polite-expressions","complete-introduction"],
  family:["close-family","extended-family","partners-relationships","family-possessives","siblings-children","family-age","family-descriptions","family-tree"],
  "food-drinks":["basic-food","fruit-vegetables","drinks","meals","likes-dislikes","quantities","ordering","prices-shopping"],
  numbers:["numbers-0-20","numbers-21-99","hundreds-thousands","phone-numbers","prices-money","age-dates-years","time","numbers-in-context"],
  home:["rooms-home-types","furniture","household-objects","describing-home","es-gibt","basic-location","home-questions","apartment-advert"],
  travel:["transport","station-vocabulary","tickets","departure-arrival","travel-information","directions","airport","timetable"],
  shopping:["shops","clothes","colors","sizes-fit","products-prices","trying-on","shopping-quantities","checkout-payment"],
  "school-work":["school-objects","school-subjects","classroom-language","study-routine","professions","workplaces","working-hours","school-work-context"]
});
const labels = Object.fromEntries(A1_LIBRARY_TOPICS.map(topic=>[topic.id,topic.label]));
const skillMap = Object.freeze({
  articles:"articles",pronouns:"pronouns","verb-conjugation":"verb-conjugation",verbs:"verb-conjugation",
  "basic-word-order":"sentence-structure","verb-position-2":"sentence-structure","time-first":"sentence-structure",
  "separable-verbs":"verb-conjugation",questions:"questions","question-answer":"questions",negation:"negation",
  "modal-verbs":"modal-verbs","modal-structure":"modal-verbs",cases:"cases","case-chunks":"cases",
  greetings:"greetings",family:"family","food-drinks":"food-drinks",numbers:"numbers","numbers-time":"numbers",
  home:"home",travel:"travel","travel-transport":"travel",shopping:"shopping","shopping-prices":"shopping",
  "school-work":"school-work"
});
const skillLabels = Object.freeze({"numbers-time":"Numbers & Time","travel-transport":"Travel & Transport","shopping-prices":"Shopping & Prices","question-answer":"Questions & Answers","basic-word-order":"Basic Word Order","verb-position-2":"Verb Position 2","time-first":"Time-First Sentences","case-chunks":"Case Chunks","modal-structure":"Modal Verb Structure","separable-verbs":"Separable Verbs"});

const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const clampPercent = value => Math.max(0,Math.min(100,Math.round(number(value))));
function safeRead(storage,key){try{const value=JSON.parse(storage.getItem(key)||"null");return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}catch{return {};}}
function validDate(value){const time=Date.parse(value);return Number.isFinite(time)?new Date(time):null;}
function routeForTopic(id){return `../library-topic/?level=A1&topic=${encodeURIComponent(id)}`;}
function routeForPractice(id){return `../practice/?level=A1&type=${encodeURIComponent(id)}`;}
function weakest(stats,min,success,total="attempted"){
  return Object.entries(stats||{}).map(([id,row])=>({id,attempts:number(row?.[total]),rate:number(row?.[total])?number(row?.[success])/number(row?.[total]):1}))
    .filter(item=>item.attempts>=min&&item.rate<.8).sort((a,b)=>a.rate-b.rate)[0]||null;
}
function confidence(progress){const total=number(progress.again)+number(progress.okay)+number(progress.confident);if(total<3)return total?"Building Confidence":"Not Started";if(number(progress.confident)/total>=.6)return"Confident";if(number(progress.again)/total>=.45)return"Building Confidence";return"Growing Confidence";}

function practiceSummary(config,progress,now){
  const base={...config,route:routeForPractice(config.id),lastActivity:validDate(progress.lastActivity),started:false,metrics:[],weak:null};
  if(config.id==="grammar")return {...base,started:number(progress.attempts)>0,metrics:[["Best Score",`${clampPercent(progress.bestPercent)}%`],["Attempts",number(progress.attempts)]],weak:weakest(progress.skillStats,4,"correct","attempts")};
  if(config.id==="flashcards"){
    const records=Object.values(progress.cards||{}).filter(row=>row&&typeof row==="object"),due=records.filter(row=>validDate(row.nextReview)&&validDate(row.nextReview)<=now).length;
    return {...base,started:number(progress.totalSessions)>0||records.length>0,due,metrics:[["Mastered",records.filter(row=>row.state==="mastered").length],["Learning",records.filter(row=>row.state==="learning"||row.state==="review").length],["Due",due],["Sessions",number(progress.totalSessions)]]};
  }
  if(config.id==="matching"){const difficult=Object.values(progress.itemStats||{}).filter(row=>number(row.wrongAttempts)+number(row.hints)+number(row.assisted)>0).length;return {...base,started:number(progress.sessionsCompleted)>0,metrics:[["Sessions",number(progress.sessionsCompleted)],["Pairs Practised",number(progress.pairsPractised)],["Difficult Words",difficult]],weak:weakest(progress.topicStats,5,"independent","attempts")};}
  if(config.id==="listening")return {...base,started:number(progress.sessionsCompleted)>0,metrics:[["Best Score",`${clampPercent(progress.bestPercent)}%`],["Sessions",number(progress.sessionsCompleted)]],weak:weakest(progress.skillStats,4,"correct")};
  if(config.id==="reading")return {...base,started:number(progress.sessionsCompleted)>0,metrics:[["Best Score",`${clampPercent(progress.bestPercent)}%`],["Texts Completed",number(progress.textsCompleted)],["Sessions",number(progress.sessionsCompleted)]],weak:weakest(progress.skillStats,6,"correct")};
  if(config.id==="writing")return {...base,started:number(progress.sessionsCompleted)>0,metrics:[["Best Independent",`${number(progress.bestIndependent)} / 12`],["Sessions",number(progress.sessionsCompleted)]],weak:weakest(progress.skillStats,4,"independent")};
  if(config.id==="speaking")return {...base,started:number(progress.sessionsCompleted)>0||number(progress.tasksPractised)>0,metrics:[["Sessions",number(progress.sessionsCompleted)],["Tasks Completed",number(progress.tasksPractised)],["Confidence",confidence(progress)]],weak:Object.entries(progress.skillStats||{}).map(([id,row])=>({id,attempts:number(row.attempted),rate:number(row.attempted)?1-number(row.again)/number(row.attempted):1})).filter(x=>x.attempts>=4&&x.rate<.65).sort((a,b)=>a.rate-b.rate)[0]||null};
  const weak=Object.entries(progress.categoryStats||{}).map(([id,row])=>{const choices=number(row.natural)+number(row.acceptable)+number(row.assisted);return{id,attempts:number(row.dialogues),rate:choices?number(row.natural)/choices:1};}).filter(x=>x.attempts>=3&&x.rate<.7).sort((a,b)=>a.rate-b.rate)[0]||null;
  return {...base,started:number(progress.sessionsCompleted)>0,metrics:[["Dialogues Completed",number(progress.dialoguesCompleted)],["Sessions",number(progress.sessionsCompleted)],["Natural Choices",number(progress.naturalChoices)]],weak};
}

export function getA1ProgressSummary(storage=localStorage,now=new Date()){
  const libraryStore=safeRead(storage,"rw_library_progress_v1");
  const library=A1_LIBRARY_TOPICS.map(topic=>{
    const raw=libraryStore[`A1:${topic.id}`]||{},validLessons=new Set(libraryLessonIds[topic.id]),completedLessons=[...new Set(Array.isArray(raw.completedLessons)?raw.completedLessons.filter(id=>validLessons.has(id)):[])];
    const completed=completedLessons.length>=topic.lessons,masteryAttempts=number(raw.masteryAttempts),bestMastery=clampPercent(raw.bestMasteryScore),mastered=Boolean(raw.mastered)||(masteryAttempts>0&&bestMastery>=80);
    const started=Boolean(raw.started)||completedLessons.length>0||masteryAttempts>0;
    return {...topic,route:routeForTopic(topic.id),started,completed,mastered,completedLessons:completedLessons.length,bestMastery,masteryAttempts,lastActivity:validDate(raw.lastActivity),weakSkills:Array.isArray(raw.weakSkills)?raw.weakSkills:[]};
  });
  const practices=A1_PRACTICE_ACTIVITIES.map(config=>{const item=practiceSummary(config,safeRead(storage,config.key),now);return item.weak?{...item,weak:{...item.weak,label:skillLabels[item.weak.id]||labels[skillMap[item.weak.id]]||item.weak.id}}:item;});
  const completedLibrary=library.filter(item=>item.completed).length,startedPractice=practices.filter(item=>item.started).length;
  const journey=clampPercent((completedLibrary/library.length*.6+startedPractice/practices.length*.4)*100);
  const unfinished=library.filter(item=>item.started&&!item.completed).sort((a,b)=>(b.lastActivity?.getTime()||0)-(a.lastActivity?.getTime()||0));
  const continueLearning=unfinished[0]||library.find(item=>!item.started)||library[0];
  const continuePractice=[...practices].filter(item=>item.lastActivity).sort((a,b)=>b.lastActivity-a.lastActivity)[0]||null;
  const signals=new Map();
  const addSignal=(rawId,source,severity,attempts,route)=>{const id=skillMap[rawId]||rawId;if(!labels[id]||attempts<=0)return;const current=signals.get(id)||{id,label:labels[id],score:0,evidence:[],attempts:0,route:routeForTopic(id)};current.score+=severity*Math.min(3,1+attempts/10);current.attempts+=attempts;if(!current.evidence.some(item=>item.source===source))current.evidence.push({source,route});signals.set(id,current);};
  library.forEach(item=>{if(item.masteryAttempts&&item.bestMastery<80)addSignal(item.id,"Library Mastery",(80-item.bestMastery)/25,item.masteryAttempts,item.route);});
  practices.forEach(item=>{if(item.weak)addSignal(item.weak.id,item.label,Math.max(.25,1-item.weak.rate),item.weak.attempts,item.route);});
  const mixedRaw=safeRead(storage,A1_MIXED_PROGRESS_KEY),mixed={attempts:number(mixedRaw.attempts),bestPercent:clampPercent(mixedRaw.bestPercent),lastPercent:clampPercent(mixedRaw.lastPercent),bestScore:number(mixedRaw.bestScore),lastScore:number(mixedRaw.lastScore),focusAreas:Array.isArray(mixedRaw.focusAreas)?mixedRaw.focusAreas:[],lastActivity:validDate(mixedRaw.lastActivity),route:"../mixed-mastery/?level=A1"};
  mixed.focusAreas.forEach(id=>addSignal(id,"A1 Mixed Mastery",.3,1,mixed.route));
  const focusAreas=[...signals.values()].sort((a,b)=>b.evidence.length-a.evidence.length||b.score-a.score||b.attempts-a.attempts).slice(0,5);
  const due=practices.find(item=>item.id==="flashcards")?.due||0;
  let recommendation={title:continueLearning.label,reason:continueLearning.started?"Continue your unfinished Learning Library topic.":"Start with the next topic in your A1 learning path.",label:continueLearning.started?"Continue Learning":"Start A1",route:continueLearning.route};
  if(!unfinished.length&&library.some(item=>item.completed&&item.masteryAttempts&&item.bestMastery<80)){const item=library.find(row=>row.completed&&row.masteryAttempts&&row.bestMastery<80);recommendation={title:`Review ${item.label}`,reason:"This completed topic is below its current mastery target.",label:"Review Topic",route:item.route};}
  else if(!unfinished.length&&due>0)recommendation={title:"Review Due Flashcards",reason:`${due} card${due===1?" is":"s are"} ready for review.`,label:"Review Due Cards",route:routeForPractice("flashcards")};
  else if(library.every(item=>item.completed)&&!due&&focusAreas.length){const area=focusAreas[0];recommendation={title:`Practise ${area.label}`,reason:`Repeated evidence appears in ${area.evidence.map(x=>x.source).join(" and ")}.`,label:"Review Focus Area",route:area.route};}
  else if(library.every(item=>item.completed)&&!practices.every(item=>item.started)){const item=practices.find(row=>!row.started);recommendation={title:item.label,reason:"Try an A1 Practice Center activity you have not used yet.",label:"Start Practice",route:item.route};}
  else if(library.every(item=>item.completed)&&practices.every(item=>item.started)&&!mixed.attempts)recommendation={title:"Take an A1 Mixed Mastery Review",reason:"You have completed the Library path and used every Practice Center activity.",label:"Start Mixed Review",route:mixed.route};
  else if(mixed.attempts&&mixed.lastPercent<70)recommendation={title:"Review Your Mixed Mastery Focus Areas",reason:`Your latest review performance was ${mixed.lastPercent}%. Review the identified areas before another mixed session.`,label:"Review Again",route:mixed.route};
  const recent=[...library.map(item=>({...item,kind:"Library",detail:item.completed?"Topic completed":item.mastered?"Topic mastered":`${item.completedLessons} of ${item.lessons} lessons`})),...practices.map(item=>({...item,kind:"Practice",detail:item.started?item.metrics.slice(0,2).map(([a,b])=>`${a}: ${b}`).join(" · "):""})),...(mixed.lastActivity?[{label:"A1 Mixed Mastery",lastActivity:mixed.lastActivity,kind:"Capstone",detail:`${mixed.lastPercent}% Review Performance`}]:[])].filter(item=>item.lastActivity).sort((a,b)=>b.lastActivity-a.lastActivity).slice(0,8);
  return {journey,library:{items:library,completed:completedLibrary,mastered:library.filter(x=>x.mastered).length,grammarMastered:library.filter(x=>x.group==="grammar"&&x.mastered).length,vocabularyMastered:library.filter(x=>x.group==="vocabulary"&&x.mastered).length},practice:{items:practices,started:startedPractice},mixed,continueLearning,continuePractice,focusAreas,recommendation,dueFlashcards:due,recent,lastActivity:recent[0]?.lastActivity||null};
}

export function resetA1Progress(storage=localStorage){
  const library=safeRead(storage,"rw_library_progress_v1"),preserved=Object.fromEntries(Object.entries(library).filter(([key])=>!key.startsWith("A1:")));
  if(Object.keys(preserved).length)storage.setItem("rw_library_progress_v1",JSON.stringify(preserved));else storage.removeItem("rw_library_progress_v1");
  A1_PRACTICE_ACTIVITIES.forEach(item=>storage.removeItem(item.key));
  storage.removeItem(A1_MIXED_PROGRESS_KEY);
}

export function validateA1ProgressConfig(){
  const errors=[],topicIds=A1_LIBRARY_TOPICS.map(x=>x.id),activityIds=A1_PRACTICE_ACTIVITIES.map(x=>x.id);
  if(topicIds.length!==16||new Set(topicIds).size!==16)errors.push("Expected 16 unique Library topics.");
  if(activityIds.length!==8||new Set(activityIds).size!==8)errors.push("Expected 8 unique Practice activities.");
  if(A1_LIBRARY_TOPICS.some(x=>!x.label||!x.lessons||!x.group))errors.push("Invalid Library configuration.");
  if(A1_LIBRARY_TOPICS.some(x=>libraryLessonIds[x.id]?.length!==x.lessons))errors.push("Invalid Library lesson metadata.");
  if(A1_PRACTICE_ACTIVITIES.some(x=>!x.label||!x.key))errors.push("Invalid Practice configuration.");
  return errors;
}
