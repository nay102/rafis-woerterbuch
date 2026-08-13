const skills = {
  "word-recognition": {title: "Word & Phrase Recognition", topic: "greetings"},
  "numbers-time": {title: "Numbers, Prices & Time", topic: "numbers"},
  "sentence-comprehension": {title: "Everyday Sentences", topic: "home"},
  "question-response": {title: "Questions & Responses", topic: "greetings"},
  "mini-dialogue": {title: "Mini Dialogues", topic: "food-drinks"},
  "practical-information": {title: "Practical Information", topic: "travel"}
};
export const A1_LISTENING_SKILLS = Object.freeze(skills);
export const A1_LISTENING_PROGRESS_KEY = "rw_a1_listening_v1";

const task = (skill, id, speech, promptEn, options, answer, topic, speechParts = null) => ({
  id: `a1-listening-${skill}-${String(id).padStart(3, "0")}`,
  level: "A1", type: "listening", skill,
  speech, speechParts,
  promptEn, promptBn: "Audio শুনে সঠিক উত্তরটি বেছে নিন।",
  options, answer: options.indexOf(answer), transcript: speech,
  explanationEn: `The audio says “${speech.replaceAll("\n", " ")}”. The correct answer is “${answer}”.`,
  explanationBn: `Audio-তে “${speech.replaceAll("\n", " ")}” বলা হয়েছে। তাই সঠিক উত্তর “${answer}”।`,
  relatedTopic: topic || skills[skill].topic
});

const wordRows = [
 ["Guten Morgen!","What greeting did you hear?",["Good morning.","Good evening.","Good night."],"Good morning.","greetings"],
 ["Auf Wiedersehen!","Which farewell did you hear?",["Goodbye.","Welcome.","Thank you."],"Goodbye.","greetings"],
 ["die Fahrkarte","Which travel word did you hear?",["ticket","platform","station"],"ticket","travel"],
 ["der Kühlschrank","Which home item did you hear?",["refrigerator","wardrobe","washing machine"],"refrigerator","home"],
 ["Ich verstehe nicht.","What does the speaker mean about understanding?",["I don't understand.","I don't work.","I don't live here."],"I don't understand.","greetings"],
 ["Noch einmal, bitte.","What request did you hear?",["Once again, please.","One coffee, please.","Come tomorrow, please."],"Once again, please.","greetings"],
 ["die Schwester","Which family member did you hear?",["sister","mother","daughter"],"sister","family"],
 ["das Brötchen","Which food item did you hear?",["bread roll","cheese","apple"],"bread roll","food-drinks"],
 ["teuer","Which adjective did you hear?",["expensive","cheap","small"],"expensive","shopping"],
 ["arbeiten","Which activity did you hear?",["to work","to learn","to travel"],"to work","school-work"]
];
const numberRows = [
 ["einundzwanzig","Which number was spoken as einundzwanzig?",["12","21","31"],"21"],
 ["dreißig","Which number was spoken as dreißig?",["13","30","33"],"30"],
 ["Es kostet fünfzehn Euro.","What price did you hear for the item?",["€5","€15","€50"],"€15"],
 ["Das kostet zwei Euro fünfzig.","Which price was announced?",["€2.15","€2.50","€5.20"],"€2.50"],
 ["Der Kurs beginnt um neun Uhr dreißig.","When does the course begin?",["09:13","09:30","10:30"],"09:30"],
 ["Der Termin ist um acht Uhr fünfzehn.","What time is the appointment?",["08:15","08:30","08:50"],"08:15"],
 ["Der Bus fährt um acht Uhr fünfundvierzig.","When does the bus leave?",["08:15","08:40","08:45"],"08:45"],
 ["Der Zug kommt um vierzehn Uhr zwanzig.","When does the train arrive?",["14:02","14:20","15:20"],"14:20"],
 ["Der Termin ist am zwölften August.","On which date is the appointment?",["2 August","12 August","20 August"],"12 August"],
 ["Ich brauche siebzehn Euro.","How much money is needed?",["€7","€17","€70"],"€17"]
];
const sentenceRows = [
 ["Meine Schwester wohnt in Hamburg.","Where does the speaker's sister live?",["Berlin","Hamburg","München"],"Hamburg","family"],
 ["Ich fahre jeden Morgen mit dem Bus zur Arbeit.","How does the speaker travel to work?",["By train","By bus","By bicycle"],"By bus","school-work"],
 ["Am Samstag kaufe ich im Supermarkt ein.","When does the speaker go shopping?",["Friday","Saturday","Sunday"],"Saturday","shopping"],
 ["Mein Vater trinkt morgens Kaffee.","What does the speaker's father drink?",["Tea","Coffee","Water"],"Coffee","family"],
 ["Die Kinder spielen im Garten.","Where are the children playing?",["In the garden","At school","In the kitchen"],"In the garden","home"],
 ["Anna kauft eine rote Jacke.","What does Anna buy?",["A red jacket","A blue dress","Black shoes"],"A red jacket","shopping"],
 ["Wir essen heute Reis und Gemüse.","What are they eating today?",["Rice and vegetables","Bread and cheese","Soup and salad"],"Rice and vegetables","food-drinks"],
 ["Paul lernt am Abend Deutsch.","When does Paul study German?",["In the morning","At midday","In the evening"],"In the evening","school-work"],
 ["Der Schlüssel liegt auf dem Tisch.","Where is the key?",["On the table","Under the bed","In the bag"],"On the table","home"],
 ["Morgen fahren wir nach Berlin.","Where are they travelling tomorrow?",["Hamburg","Berlin","Bonn"],"Berlin","travel"],
 ["Ich stehe jeden Tag um sieben Uhr auf.","When does the speaker get up?",["06:00","07:00","08:00"],"07:00","numbers"],
 ["Im Büro arbeite ich von Montag bis Freitag.","On which days does the speaker work?",["Monday to Friday","Tuesday to Saturday","Only Sunday"],"Monday to Friday","school-work"]
];
const responseRows = [
 ["Woher kommst du?","Which response answers the origin question?",["Ich komme aus Bangladesch.","Ich wohne um acht Uhr.","Ich bin Lehrer."],"Ich komme aus Bangladesch.","greetings"],
 ["Wie geht es dir?","Which response answers how someone feels?",["Sehr gut, danke.","Aus Berlin.","Um zehn Uhr."],"Sehr gut, danke.","greetings"],
 ["Was möchten Sie trinken?","Which response orders a drink?",["Einen Tee, bitte.","Am Montag.","Mit dem Zug."],"Einen Tee, bitte.","food-drinks"],
 ["Wo wohnst du?","Which response gives a place of residence?",["Ich wohne in Köln.","Ich bin zwanzig.","Ich fahre morgen."],"Ich wohne in Köln.","home"],
 ["Wie alt bist du?","Which response gives an age?",["Ich bin neunzehn Jahre alt.","Ich heiße Karim.","Ich komme aus Bonn."],"Ich bin neunzehn Jahre alt.","numbers"],
 ["Wann beginnt der Kurs?","Which response gives the course time?",["Um neun Uhr.","Im Klassenzimmer.","Mit Anna."],"Um neun Uhr.","school-work"],
 ["Wie viel kostet die Jacke?","Which response gives the jacket price?",["Sie kostet dreißig Euro.","Sie ist blau.","Sie ist im Schrank."],"Sie kostet dreißig Euro.","shopping"],
 ["Fährst du mit dem Zug?","Which response answers the transport question?",["Ja, genau.","Nach Hamburg.","Am Bahnhof."],"Ja, genau.","travel"],
 ["Hast du Geschwister?","Which response answers the family question?",["Ja, einen Bruder.","Nein, in Berlin.","Um halb acht."],"Ja, einen Bruder.","family"],
 ["Entschuldigung, wo ist der Bahnhof?","Which response gives a direction?",["Geradeaus und dann links.","Um zehn Euro.","Am Dienstag."],"Geradeaus und dann links.","travel"]
];
const dialogueRows = [
 [[ ["A","Guten Tag. Was möchten Sie?"],["B","Einen Kaffee und ein Wasser, bitte."] ],"What does the customer order?",["Coffee and water","Tea and juice","Coffee and cake"],"Coffee and water","food-drinks"],
 [[ ["A","Entschuldigung, wann fährt der Zug nach Hamburg?"],["B","Um zehn Uhr zwanzig."] ],"When does the train to Hamburg leave?",["10:02","10:20","12:10"],"10:20","travel"],
 [[ ["A","Kann ich Ihnen helfen?"],["B","Ja, ich suche eine Jacke in Größe M."] ],"What is the customer looking for?",["Shoes","A jacket","A T-shirt"],"A jacket","shopping"],
 [[ ["A","Hast du Geschwister?"],["B","Ja, ich habe eine Schwester."] ],"Which sibling does B have?",["A brother","A sister","Two brothers"],"A sister","family"],
 [[ ["A","Wo ist mein Schlüssel?"],["B","Er liegt auf dem Küchentisch."] ],"Where does B say the key is?",["On the kitchen table","In the bedroom","Under the sofa"],"On the kitchen table","home"],
 [[ ["A","Wann ist der Deutschkurs?"],["B","Am Montag um neun Uhr."] ],"When is the German course?",["Monday at 09:00","Tuesday at 10:00","Friday at 09:00"],"Monday at 09:00","school-work"],
 [[ ["A","Was kostet das Brot?"],["B","Zwei Euro dreißig."] ],"How much does the bread cost?",["€2.03","€2.30","€3.20"],"€2.30","food-drinks"],
 [[ ["A","Guten Abend. Haben Sie ein Zimmer frei?"],["B","Ja, für zwei Nächte."] ],"For how long is the room available?",["One night","Two nights","Three nights"],"Two nights","travel"],
 [[ ["A","Wie kommst du zur Schule?"],["B","Ich fahre mit dem Fahrrad."] ],"How does B travel to school?",["By bus","By bicycle","On foot"],"By bicycle","school-work"],
 [[ ["A","Möchtest du eine Suppe?"],["B","Nein, danke. Ich nehme einen Salat."] ],"What does B choose?",["Soup","Salad","Cake"],"Salad","food-drinks"]
];
const practicalRows = [
 ["Der Zug nach Berlin fährt heute von Gleis fünf.","From which platform does the Berlin train leave?",["Platform 3","Platform 5","Platform 15"],"Platform 5","travel"],
 ["Der Supermarkt ist heute bis achtzehn Uhr geöffnet.","Until when is the supermarket open?",["16:00","18:00","20:00"],"18:00","shopping"],
 ["Der Deutschkurs ist am Dienstag und Donnerstag.","On which days is the German course?",["Monday and Wednesday","Tuesday and Thursday","Friday and Saturday"],"Tuesday and Thursday","school-work"],
 ["Achtung. Der Bus Nummer zwölf kommt zehn Minuten später.","What is delayed?",["Bus number 12","Train number 10","Bus number 20"],"Bus number 12","travel"],
 ["Die Praxis ist heute von acht bis sechzehn Uhr geöffnet.","What are today's opening hours?",["08:00–16:00","09:00–17:00","08:00–18:00"],"08:00–16:00","numbers"],
 ["Bitte kommen Sie morgen um elf Uhr ins Büro.","When should the listener come to the office?",["Today at 11:00","Tomorrow at 11:00","Tomorrow at 10:00"],"Tomorrow at 11:00","school-work"],
 ["Die Wohnung hat zwei Zimmer, eine Küche und ein Bad.","How many rooms does the apartment have?",["One","Two","Three"],"Two","home"],
 ["Heute gibt es im Café Kaffee und Kuchen für fünf Euro.","How much is the café offer?",["€4","€5","€15"],"€5","food-drinks"]
];

const simple = (skill, rows) => rows.map((row, index) => task(skill, index + 1, ...row));
const dialogues = dialogueRows.map((row, index) => {
  const [parts, prompt, options, answer, topic] = row;
  const speech = parts.map(([speaker, text]) => `${speaker}: ${text}`).join("\n");
  return task("mini-dialogue", index + 1, speech, prompt, options, answer, topic, parts.map(([speaker, text]) => ({speaker, text})));
});
const raw = [
  ...simple("word-recognition", wordRows), ...simple("numbers-time", numberRows),
  ...simple("sentence-comprehension", sentenceRows), ...simple("question-response", responseRows),
  ...dialogues, ...simple("practical-information", practicalRows)
];
export const A1_LISTENING_TASKS = Object.freeze(raw.map((item, index) => Object.freeze({...item, difficulty: index % 5 < 2 ? "easy" : index % 5 < 4 ? "medium" : "challenge"})));

export function validateA1ListeningBank(tasks = A1_LISTENING_TASKS) {
  const errors = [], ids = new Set(), prompts = new Set();
  if (tasks.length < 60) errors.push(`Expected at least 60 tasks; found ${tasks.length}.`);
  tasks.forEach(item => {
    if (!item.id || ids.has(item.id)) errors.push(`Duplicate/missing ID: ${item.id}`); ids.add(item.id);
    if (!item.promptEn || prompts.has(item.promptEn)) errors.push(`Duplicate/missing prompt: ${item.id}`); prompts.add(item.promptEn);
    if (item.level !== "A1" || !skills[item.skill] || !["easy","medium","challenge"].includes(item.difficulty)) errors.push(`Invalid metadata: ${item.id}`);
    if (!item.speech || !item.transcript || item.options?.length !== 3 || new Set(item.options).size !== 3 || item.options.some(option => !String(option).trim()) || item.answer < 0 || item.answer > 2) errors.push(`Invalid task content: ${item.id}`);
    if (!item.explanationEn || !item.explanationBn || !item.relatedTopic) errors.push(`Missing explanation/topic: ${item.id}`);
    if (item.speechParts && item.speechParts.some(part => !part.speaker || !part.text)) errors.push(`Malformed dialogue: ${item.id}`);
  });
  return errors;
}
