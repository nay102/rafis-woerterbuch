/* =========================================================
   EDITABLE SAMPLE COURSE MODULES
   Replace these titles, descriptions, lessons, words and tasks later.
========================================================= */
const TITLES = {
  A1:["Getting Started","Everyday Communication","Grammar Essentials","Daily Situations","Reading & Listening","Speaking Practice","Writing Foundations","Home, Work & Travel","A1 Skills Review","Goethe A1 Preparation"],
  A2:["Getting Started","Everyday Communication","Grammar Practice","Daily Situations","Reading & Listening","Confident Conversations","Tenses & Narration","Travel, Services & Work","A2 Skills Review","Goethe A2 Preparation"],
  B1:["Getting Started","Everyday Communication","Grammar Practice","Daily Situations","Reading & Listening","Independent Speaking","Structured Writing","Work, Society & Media","B1 Skills Review","Goethe B1 Preparation"],
  B2:["Getting Started","Everyday Communication","Advanced Grammar","Daily Situations","Reading & Listening","Fluent Discussion","Advanced Writing","Media, Culture & Society","B2 Skills Review","Goethe B2 Preparation"]
};
const DESCRIPTIONS = [
  "Build the essential language foundation for this level through guided introductions, pronunciation, and useful first exchanges.",
  "Communicate naturally in familiar situations by asking questions, exchanging information, and responding appropriately.",
  "Develop accurate sentences with the grammar structures, verb patterns, and connectors required at this level.",
  "Apply German confidently in shopping, appointments, transport, restaurants, and everyday routines.",
  "Strengthen comprehension through graded texts, listening strategies, contextual vocabulary, and focused questions.",
  "Improve spoken fluency with guided dialogues, pronunciation practice, spontaneous responses, and clear interaction.",
  "Create clear messages, emails, descriptions, and structured texts appropriate for your current level.",
  "Use practical German across home, travel, work, services, culture, and wider social contexts.",
  "Combine reading, listening, speaking, writing, vocabulary, and grammar in an integrated skills review.",
  "Prepare for Goethe-style tasks with timed practice, exam strategies, model prompts, and a final self-check."
];
const MODULE_CONTENT = [
  {focus:"Foundation and pronunciation",lessons:["Greetings and introductions","Alphabet and sound patterns","Numbers, dates and personal details","Your first guided conversation"],words:[["begrüßen","to greet"],["sich vorstellen","to introduce oneself"],["buchstabieren","to spell"],["die Herkunft","origin"]],task:"Record a 60-second introduction including your name, origin, languages, and one personal detail."},
  {focus:"Interactive communication",lessons:["Asking useful questions","Family and personal information","Plans and preferences","Polite everyday responses"],words:[["die Frage","question"],["antworten","to answer"],["gemeinsam","together"],["sich verabreden","to arrange to meet"]],task:"Write and perform a six-line dialogue in which two people exchange information and make a plan."},
  {focus:"Grammar and sentence control",lessons:["Verb forms and tense","Articles and grammatical cases","Main-clause word order","Negation and connectors"],words:[["der Satz","sentence"],["die Zeitform","tense"],["verbinden","to connect"],["verneinen","to negate"]],task:"Write eight related sentences and mark the subject, conjugated verb, and connector in each one."},
  {focus:"German for real life",lessons:["Shopping and prices","Food and restaurants","Transport and directions","Appointments and routines"],words:[["bestellen","to order"],["umsteigen","to change transport"],["der Termin","appointment"],["die Quittung","receipt"]],task:"Plan a complete day in German including transport, an appointment, shopping, and a restaurant exchange."},
  {focus:"Comprehension strategies",lessons:["Reading for the main idea","Finding specific details","Listening for key words","Inferring meaning from context"],words:[["die Aussage","statement"],["erwähnen","to mention"],["verstehen","to understand"],["zusammenfassen","to summarize"]],task:"Read a short German text, write its main idea, and list four details without translating every word."},
  {focus:"Speaking confidence",lessons:["Pronunciation and rhythm","Keeping a conversation moving","Expressing views and preferences","Role-play and spontaneous response"],words:[["zustimmen","to agree"],["widersprechen","to disagree"],["erklären","to explain"],["die Aussprache","pronunciation"]],task:"Speak for two minutes on a familiar topic, then repeat with two new linking expressions."},
  {focus:"Purposeful writing",lessons:["Planning before writing","Messages and correspondence","Descriptions and narration","Editing for clarity and accuracy"],words:[["die Einleitung","introduction"],["beschreiben","to describe"],["begründen","to justify"],["überarbeiten","to revise"]],task:"Write a structured email of 80-150 words, then check greeting, paragraphing, verb position, and ending."},
  {focus:"Practical topic language",lessons:["Home and local environment","Travel and public services","Work and study","Culture, society and media"],words:[["die Umgebung","surroundings"],["die Dienstleistung","service"],["beruflich","professional"],["die Gesellschaft","society"]],task:"Choose one topic and create a mind map with 15 words, five collocations, and a short spoken summary."},
  {focus:"Integrated revision",lessons:["Grammar diagnostic","Vocabulary retrieval","Four-skills mini test","Personal revision planning"],words:[["wiederholen","to revise"],["die Stärke","strength"],["die Lücke","gap"],["der Fortschritt","progress"]],task:"Complete one timed task for each skill and create a seven-day plan based on the mistakes you identify."},
  {focus:"Goethe-style exam readiness",lessons:["Understanding the exam format","Reading and listening strategies","Writing task planning","Speaking test performance"],words:[["die Prüfung","exam"],["die Aufgabe","task"],["die Vorbereitung","preparation"],["bestehen","to pass"]],task:"Complete a timed mock section, check it with the criteria, and record three improvements for your next attempt."}
];

export function getCourseModule(level, number) {
  const safeLevel = TITLES[level] ? level : "A1";
  const safeNumber = Math.min(10, Math.max(1, Number(number) || 1));
  const content = MODULE_CONTENT[safeNumber - 1];
  return { level:safeLevel, number:safeNumber, title:TITLES[safeLevel][safeNumber-1], description:DESCRIPTIONS[safeNumber-1], ...content };
}
