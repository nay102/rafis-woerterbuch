const choice = (label, de, en, bn) => ({ label, de, en, bn });
const template = (id, category, title, grammar, groups) => ({ id, category, title, grammar, groups });

export const SENTENCE_TEMPLATES = [
  template("intro-name", "Introduce yourself", "My name is…", "present", [[
    choice("Ich heiße Rafi.", "Ich heiße Rafi.", "My name is Rafi.", "আমার নাম রাফি।"),
    choice("Ich bin Sara.", "Ich bin Sara.", "I am Sara.", "আমি সারা।"),
    choice("Mein Name ist Amir.", "Mein Name ist Amir.", "My name is Amir.", "আমার নাম আমির।")
  ]]),
  template("family", "Family", "Talk about family", "possessive", [[
    choice("Meine Schwester arbeitet.", "Meine Schwester arbeitet.", "My sister works.", "আমার বোন কাজ করে।"),
    choice("Mein Bruder studiert.", "Mein Bruder studiert.", "My brother studies.", "আমার ভাই পড়াশোনা করে।"),
    choice("Unsere Eltern wohnen in Dhaka.", "Unsere Eltern wohnen in Dhaka.", "Our parents live in Dhaka.", "আমাদের বাবা-মা ঢাকায় থাকেন।")
  ]]),
  template("home", "Home", "Describe your home", "dative location", [[
    choice("Die Lampe steht neben dem Sofa.", "Die Lampe steht neben dem Sofa.", "The lamp stands beside the sofa.", "বাতিটি সোফার পাশে আছে।"),
    choice("Das Bild hängt an der Wand.", "Das Bild hängt an der Wand.", "The picture hangs on the wall.", "ছবিটি দেয়ালে ঝুলছে।"),
    choice("Ich wohne in einer kleinen Wohnung.", "Ich wohne in einer kleinen Wohnung.", "I live in a small apartment.", "আমি একটি ছোট ফ্ল্যাটে থাকি।")
  ]]),
  template("routine", "Daily routine", "Build a routine sentence", "time expression", [[
    choice("Um sieben Uhr stehe ich auf.", "Um sieben Uhr stehe ich auf.", "I get up at seven o'clock.", "আমি সাতটায় উঠি।"),
    choice("Morgens trinke ich Kaffee.", "Morgens trinke ich Kaffee.", "I drink coffee in the morning.", "আমি সকালে কফি পান করি।"),
    choice("Abends lerne ich Deutsch.", "Abends lerne ich Deutsch.", "I study German in the evening.", "আমি সন্ধ্যায় জার্মান শিখি।")
  ]]),
  template("food", "Food", "Choose food and drink", "accusative", [[
    choice("Ich esse einen Apfel.", "Ich esse einen Apfel.", "I eat an apple.", "আমি একটি আপেল খাই।"),
    choice("Wir kochen eine Suppe.", "Wir kochen eine Suppe.", "We cook a soup.", "আমরা স্যুপ রান্না করি।"),
    choice("Sie trinkt ein Glas Wasser.", "Sie trinkt ein Glas Wasser.", "She drinks a glass of water.", "সে এক গ্লাস পানি পান করে।")
  ]]),
  template("shopping", "Shopping", "Ask in a shop", "modal", [[
    choice("Ich möchte dieses Hemd kaufen.", "Ich möchte dieses Hemd kaufen.", "I would like to buy this shirt.", "আমি এই শার্টটি কিনতে চাই।"),
    choice("Kann ich mit Karte bezahlen?", "Kann ich mit Karte bezahlen?", "Can I pay by card?", "আমি কি কার্ডে পরিশোধ করতে পারি?"),
    choice("Haben Sie diese Jacke in Größe M?", "Haben Sie diese Jacke in Größe M?", "Do you have this jacket in size M?", "আপনার কাছে কি এই জ্যাকেটটি এম সাইজে আছে?")
  ]]),
  template("appointment", "Appointments", "Arrange an appointment", "modal", [[
    choice("Ich möchte einen Termin vereinbaren.", "Ich möchte einen Termin vereinbaren.", "I would like to arrange an appointment.", "আমি একটি অ্যাপয়েন্টমেন্ট করতে চাই।"),
    choice("Können wir den Termin verschieben?", "Können wir den Termin verschieben?", "Can we postpone the appointment?", "আমরা কি অ্যাপয়েন্টমেন্টটি পিছিয়ে দিতে পারি?"),
    choice("Der Termin ist am Montag um zehn Uhr.", "Der Termin ist am Montag um zehn Uhr.", "The appointment is Monday at ten.", "অ্যাপয়েন্টমেন্ট সোমবার দশটায়।")
  ]]),
  template("travel", "Travel", "Travel situations", "prepositions", [[
    choice("Ich fahre morgen mit dem Zug nach Berlin.", "Ich fahre morgen mit dem Zug nach Berlin.", "I am traveling to Berlin by train tomorrow.", "আমি আগামীকাল ট্রেনে বার্লিন যাচ্ছি।"),
    choice("Der Zug fährt von Gleis drei ab.", "Der Zug fährt von Gleis drei ab.", "The train departs from platform three.", "ট্রেনটি তিন নম্বর প্ল্যাটফর্ম থেকে ছাড়ে।"),
    choice("Wir sind gestern in Hamburg angekommen.", "Wir sind gestern in Hamburg angekommen.", "We arrived in Hamburg yesterday.", "আমরা গতকাল হামবুর্গে পৌঁছেছি।")
  ]]),
  template("work", "Work", "Talk about work", "present/perfect", [[
    choice("Ich arbeite in einem Krankenhaus.", "Ich arbeite in einem Krankenhaus.", "I work in a hospital.", "আমি একটি হাসপাতালে কাজ করি।"),
    choice("Heute habe ich eine Besprechung.", "Heute habe ich eine Besprechung.", "I have a meeting today.", "আজ আমার একটি মিটিং আছে।"),
    choice("Ich habe den Bericht geschrieben.", "Ich habe den Bericht geschrieben.", "I wrote the report.", "আমি প্রতিবেদনটি লিখেছি।")
  ]]),
  template("ausbildung", "Ausbildung", "Talk about training", "weil", [[
    choice("Ich mache eine Ausbildung als Pflegefachmann.", "Ich mache eine Ausbildung als Pflegefachmann.", "I am training as a nursing professional.", "আমি নার্সিং পেশায় প্রশিক্ষণ নিচ্ছি।"),
    choice("Ich lerne Deutsch, weil ich eine Ausbildung machen möchte.", "Ich lerne Deutsch, weil ich eine Ausbildung machen möchte.", "I study German because I want to do vocational training.", "আমি জার্মান শিখি, কারণ আমি পেশাগত প্রশিক্ষণ নিতে চাই।"),
    choice("Ich weiß, dass die Ausbildung drei Jahre dauert.", "Ich weiß, dass die Ausbildung drei Jahre dauert.", "I know that the training lasts three years.", "আমি জানি যে প্রশিক্ষণটি তিন বছর স্থায়ী।")
  ]]),
  template("doctor", "Doctor", "At the doctor", "dative/modal", [[
    choice("Mir tut der Rücken weh.", "Mir tut der Rücken weh.", "My back hurts.", "আমার পিঠে ব্যথা।"),
    choice("Ich habe seit gestern Fieber.", "Ich habe seit gestern Fieber.", "I have had a fever since yesterday.", "গতকাল থেকে আমার জ্বর।"),
    choice("Können Sie mir helfen?", "Können Sie mir helfen?", "Can you help me?", "আপনি কি আমাকে সাহায্য করতে পারেন?")
  ]]),
  template("school", "School", "At school", "dass", [[
    choice("Ich lerne für die Prüfung.", "Ich lerne für die Prüfung.", "I am studying for the exam.", "আমি পরীক্ষার জন্য পড়ছি।"),
    choice("Der Lehrer erklärt den Schülern die Aufgabe.", "Der Lehrer erklärt den Schülern die Aufgabe.", "The teacher explains the task to the students.", "শিক্ষক শিক্ষার্থীদের কাজটি বুঝিয়ে দেন।"),
    choice("Ich glaube, dass die Aufgabe leicht ist.", "Ich glaube, dass die Aufgabe leicht ist.", "I think that the task is easy.", "আমি মনে করি কাজটি সহজ।")
  ]]),
  template("weather", "Weather", "Describe weather", "wenn", [[
    choice("Heute ist es sonnig.", "Heute ist es sonnig.", "It is sunny today.", "আজ রোদ আছে।"),
    choice("Morgen wird es regnen.", "Morgen wird es regnen.", "It will rain tomorrow.", "আগামীকাল বৃষ্টি হবে।"),
    choice("Wenn es regnet, bleibe ich zu Hause.", "Wenn es regnet, bleibe ich zu Hause.", "When it rains, I stay at home.", "বৃষ্টি হলে আমি বাড়িতে থাকি।")
  ]])
];
