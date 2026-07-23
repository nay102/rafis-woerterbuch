/* Editable Practice Center content. Each bank is calibrated to its CEFR level. */
export const PRACTICE_TYPES = {
  grammar: { title: "Grammar Challenge", label: "Grammar", instruction: "Choose the grammatically correct answer." },
  flashcards: { title: "Vocabulary Trainer", label: "Vocabulary", instruction: "Choose the German word or expression that matches the prompt." },
  matching: { title: "Match the Words", label: "Vocabulary", instruction: "Match each German expression with its correct meaning." },
  listening: { title: "Listen & Choose", label: "Listening", instruction: "Play each sentence and choose what you hear or understand.", audio: true },
  reading: { title: "Reading Comprehension", label: "Reading", instruction: "Read the short text and select the best answer." },
  writing: { title: "Sentence Builder", label: "Writing", instruction: "Choose the sentence with correct spelling and word order." },
  speaking: { title: "Speaking Practice", label: "Speaking", instruction: "Choose the most natural response for each situation." },
  communication: { title: "Real-Life Dialogues", label: "Speaking", instruction: "Choose the most natural response for each everyday situation." }
};

const q = (prompt, options, answer, note, speech = "") => ({ prompt, options, answer, note, speech });

/* Original supplementary sets inspired by the topic breadth of established
   German exercise portals. They deliberately do not reproduce third-party text. */
const SUPPLEMENTAL_BANKS = {
  A1: {
    grammar: [
      q("Anna ___ aus Österreich.", ["komme", "kommt", "kommen"], 1, "Anna is third-person singular, so kommen becomes kommt."),
      q("Das ist ___ Tasche.", ["ein", "eine", "einen"], 1, "Tasche is feminine: eine Tasche."),
      q("Wir fahren ___ dem Bus.", ["mit", "für", "ohne"], 0, "Transport is expressed with mit plus dative."),
      q("Heute ___ ich nicht arbeiten.", ["kann", "kannst", "können"], 0, "Ich takes kann."),
      q("Wo ___ deine Eltern?", ["wohnt", "wohnen", "wohnst"], 1, "The plural subject Eltern takes wohnen."),
      q("Ich trinke Kaffee, aber ich trinke ___ Tee.", ["nicht", "kein", "keinen"], 2, "Tee is masculine accusative, so use keinen." )
    ],
    vocabulary: [
      q("What is ‘the refrigerator’ in German?", ["der Kühlschrank", "der Schrank", "der Herd"], 0, "Der Kühlschrank means refrigerator."),
      q("die Fahrkarte", ["ticket", "timetable", "platform"], 0, "Die Fahrkarte is a travel ticket."),
      q("What is the opposite of groß?", ["klein", "kurz", "jung"], 0, "Klein is the opposite of groß."),
      q("das Frühstück", ["breakfast", "lunch", "dinner"], 0, "Das Frühstück is breakfast."),
      q("What does geöffnet mean?", ["closed", "open", "reserved"], 1, "Geöffnet means open."),
      q("die Ampel", ["traffic light", "bus stop", "crossing"], 0, "Die Ampel means traffic light.")
    ],
    communication: [
      q("You want to order water.", ["Ich hätte gern ein Wasser.", "Ich bin ein Wasser.", "Wo heißt Wasser?"], 0, "Ich hätte gern is a polite ordering phrase."),
      q("Woher kommst du?", ["Ich wohne um acht.", "Ich komme aus Bangladesh.", "Ich bin im Büro."], 1, "Woher asks about origin."),
      q("You did not understand.", ["Noch einmal, bitte.", "Guten Appetit.", "Bis morgen."], 0, "Noch einmal, bitte asks for repetition."),
      q("Entschuldigung, wo ist der Bahnhof?", ["Geradeaus und dann links.", "Zwei Fahrkarten, bitte.", "Der Zug ist schnell."], 0, "The question asks for directions."),
      q("Möchtest du einen Kaffee?", ["Ja, gern.", "Um halb zehn.", "Das macht fünf Euro."], 0, "Ja, gern naturally accepts an offer."),
      q("You are introduced to someone.", ["Freut mich.", "Gute Besserung.", "Keine Ursache."], 0, "Freut mich is used when meeting someone.")
    ],
    reading: [
      q("Text: Öffnungszeiten: Montag bis Freitag, 9–18 Uhr. Am Samstag geschlossen. Wann ist das Geschäft zu?", ["Montag", "Freitag", "Samstag"], 2, "Geschlossen means closed."),
      q("Text: Zimmer frei ab 1. Juni, 450 Euro im Monat. Ab wann ist das Zimmer frei?", ["Ab Mai", "Ab Juni", "Ab Juli"], 1, "The notice says ab 1. Juni."),
      q("Text: Liebe Lea, der Film beginnt um 19:30. Treffen wir uns um 19 Uhr vor dem Kino. Wann treffen sie sich?", ["18:30", "19:00", "19:30"], 1, "The meeting time is 19 Uhr."),
      q("Text: Zug RE 5 nach Köln: heute 15 Minuten später. Was hat der Zug?", ["Eine Verspätung", "Einen neuen Bahnhof", "Eine Reservierung"], 0, "Später indicates a delay."),
      q("Text: Tom isst kein Fleisch, aber gern Gemüse. Was isst Tom gern?", ["Fleisch", "Gemüse", "Fisch"], 1, "The text explicitly says gern Gemüse."),
      q("Text: Der Deutschkurs ist dienstags und donnerstags. An welchen Tagen ist der Kurs?", ["Montag und Mittwoch", "Dienstag und Donnerstag", "Freitag und Samstag"], 1, "Dienstags and donnerstags give the two days.")
    ]
  },
  A2: {
    grammar: [
      q("Nachdem ich gegessen hatte, ___ ich spazieren.", ["ging", "gehe", "gegangen"], 0, "The completed narrative continues in the simple past."),
      q("Wir freuen uns ___ den Urlaub.", ["auf", "über", "für"], 0, "Sich freuen auf refers to something in the future."),
      q("Das ist der Mann, ___ Auto vor dem Haus steht.", ["der", "dessen", "dem"], 1, "Dessen expresses possession for a masculine antecedent."),
      q("Du ___ mehr Wasser trinken.", ["solltest", "würdest", "hättest"], 0, "Solltest gives advice."),
      q("Die E-Mail wurde gestern ___ .", ["schicken", "geschickt", "schickte"], 1, "The passive uses wurde plus past participle."),
      q("Je früher wir fahren, ___ besser.", ["als", "desto", "denn"], 1, "The fixed comparison is je … desto.")
    ],
    vocabulary: [
      q("die Überweisung", ["bank transfer", "medical referral", "both can be correct"], 2, "Überweisung is used for both banking and medical referrals."),
      q("etwas umtauschen", ["to exchange an item", "to withdraw money", "to order online"], 0, "Umtauschen means exchange or return an item."),
      q("die Erfahrung", ["experience", "education", "permission"], 0, "Erfahrung means experience."),
      q("What is ‘available’?", ["erreichbar", "verfügbar", "notwendig"], 1, "Verfügbar means available."),
      q("sich bewerben um", ["to apply for", "to complain about", "to prepare for"], 0, "Sich bewerben um means apply for something."),
      q("die Umgebung", ["surroundings", "direction", "connection"], 0, "Umgebung describes the surrounding area.")
    ],
    communication: [
      q("Your train has been cancelled. Ask for an alternative.", ["Welche andere Verbindung kann ich nehmen?", "Wo kann ich absagen?", "Wie lange wohnen Sie hier?"], 0, "Verbindung is the appropriate word for a travel connection."),
      q("A hotel room is too noisy.", ["Könnte ich bitte ein ruhigeres Zimmer bekommen?", "Ich brauche einen späteren Zug.", "Das Zimmer schmeckt nicht."], 0, "This politely requests a quieter room."),
      q("Ask a colleague to cover your shift.", ["Könntest du meine Schicht übernehmen?", "Darf ich deine Rechnung zahlen?", "Soll ich die Wohnung kündigen?"], 0, "Eine Schicht übernehmen means cover a shift."),
      q("You are late for an appointment.", ["Entschuldigen Sie bitte meine Verspätung.", "Vielen Dank für die Einladung.", "Herzlichen Glückwunsch."], 0, "This is an appropriate apology for being late."),
      q("Ask whether card payment is possible.", ["Kann ich mit Karte bezahlen?", "Kann ich die Karte fahren?", "Kann ich bar bestellen?"], 0, "Mit Karte bezahlen is the standard expression."),
      q("Accept an invitation for Saturday.", ["Samstag passt mir gut.", "Samstag ist seit gestern.", "Samstag fällt mir aus."], 0, "Passt mir gut means the time suits you.")
    ],
    reading: [
      q("Text: Die Praxis bleibt vom 3. bis 10. August geschlossen. In dringenden Fällen wenden Sie sich an Dr. Klein. Was soll man im Notfall tun?", ["Bis September warten", "Dr. Klein kontaktieren", "Eine E-Mail an die Praxis schreiben"], 1, "The substitute doctor is named for urgent cases."),
      q("Text: Die Wohnung liegt zentral, hat aber keinen Aufzug. Für wen könnte das problematisch sein?", ["Für jemanden mit eingeschränkter Mobilität", "Für jemanden ohne Auto", "Für jemanden, der zentral wohnen möchte"], 0, "No lift can be a barrier for limited mobility."),
      q("Text: Wegen einer technischen Störung verzögert sich der Abflug voraussichtlich um 40 Minuten. Was wird angekündigt?", ["Ein Gatewechsel", "Eine Verspätung", "Eine Gepäckkontrolle"], 1, "Verzögert sich announces a delay."),
      q("Text: Bitte reichen Sie das Formular zusammen mit einer Kopie Ihres Ausweises ein. Was wird zusätzlich benötigt?", ["Ein Foto", "Eine Ausweiskopie", "Eine Rechnung"], 1, "The form must include a copy of the ID."),
      q("Text: Im Preis sind Frühstück und WLAN enthalten, die Nutzung der Sauna kostet extra. Was ist kostenlos dabei?", ["Sauna", "Abendessen", "Frühstück und WLAN"], 2, "Enthalten identifies what is included."),
      q("Text: Der Workshop findet nur statt, wenn sich mindestens acht Personen anmelden. Wovon hängt er ab?", ["Von der Teilnehmerzahl", "Vom Wetter", "Vom Preis"], 0, "The minimum number of registrations determines whether it runs.")
    ]
  },
  B1: {
    grammar: [
      q("Hätte ich das gewusst, ___ ich früher gekommen.", ["wäre", "würde", "bin"], 0, "The unreal past uses wäre plus gekommen."),
      q("Er tut so, als ___ er alles verstanden.", ["hat", "hätte", "haben"], 1, "Als ob/als uses Konjunktiv II for an unreal comparison."),
      q("Die Daten müssen sorgfältig ___ werden.", ["auswerten", "ausgewertet", "auswertete"], 1, "Modal passive: participle plus werden."),
      q("Während ___ Studiums arbeitete sie nebenbei.", ["ihres", "ihrem", "ihren"], 0, "Während commonly takes the genitive: ihres Studiums."),
      q("Wir suchen eine Lösung, ___ alle zufrieden sind.", ["mit der", "deren", "die"], 0, "Zufrieden sein mit requires mit plus dative."),
      q("Der Chef ließ den Bericht noch einmal ___ .", ["prüfen", "zu prüfen", "geprüft"], 0, "Lassen takes the bare infinitive." )
    ],
    vocabulary: [
      q("eine Frist einhalten", ["to meet a deadline", "to extend a deadline", "to miss a deadline"], 0, "Einhalten means comply with or meet a deadline."),
      q("nachvollziehbar", ["understandable", "unpredictable", "unnecessary"], 0, "Nachvollziehbar means comprehensible."),
      q("etwas berücksichtigen", ["to take something into account", "to reject something", "to publish something"], 0, "Berücksichtigen means consider."),
      q("die Auswirkung", ["impact/effect", "requirement", "agreement"], 0, "Auswirkung is an effect or consequence."),
      q("zuständig sein für", ["to be responsible for", "to be interested in", "to be suitable for"], 0, "Zuständig describes official responsibility."),
      q("der Aufwand", ["effort/expenditure", "revenue", "evidence"], 0, "Aufwand is the effort, time, or cost involved.")
    ],
    communication: [
      q("Interrupt politely in a meeting.", ["Darf ich kurz etwas ergänzen?", "Jetzt rede ich.", "Sie liegen falsch."], 0, "This asks permission to add a point."),
      q("Propose a compromise.", ["Wie wäre es, wenn wir beide Vorschläge kombinieren?", "Mein Vorschlag bleibt.", "Dann machen wir nichts."], 0, "The sentence offers a balanced compromise."),
      q("Ask for a deadline extension.", ["Wäre es möglich, die Frist um zwei Tage zu verlängern?", "Kann die Frist verschwinden?", "Ich ignoriere die Frist."], 0, "This is a polite formal request."),
      q("Respond constructively to criticism.", ["Danke für den Hinweis; ich werde das überprüfen.", "Das geht Sie nichts an.", "Kritik ist immer falsch."], 0, "Acknowledging and checking feedback is constructive."),
      q("Express uncertainty about information.", ["Soweit ich weiß, ist noch nichts entschieden.", "Das ist hundertprozentig so.", "Darüber darf niemand sprechen."], 0, "Soweit ich weiß appropriately limits certainty."),
      q("Summarize an agreement.", ["Wir halten also fest, dass der Termin verschoben wird.", "Wir reden irgendwann weiter.", "Der Termin war vielleicht gestern."], 0, "Festhalten is used to record a shared conclusion.")
    ],
    reading: [
      q("Text: Das Unternehmen ermöglicht flexible Arbeitszeiten, erwartet jedoch, dass alle Beschäftigten zwischen 10 und 15 Uhr erreichbar sind. Was ist verpflichtend?", ["Arbeitsbeginn um 10 Uhr", "Erreichbarkeit in der Kernzeit", "Tägliche Büroanwesenheit"], 1, "The required core availability is 10–15 Uhr."),
      q("Text: Obwohl die Teilnehmerzahl gestiegen ist, sind die Einnahmen gesunken, weil viele ermäßigte Karten verkauft wurden. Warum sanken die Einnahmen?", ["Wegen weniger Besucher", "Wegen vieler Rabatte", "Wegen höherer Kosten"], 1, "Ermäßigte Karten explain the lower revenue."),
      q("Text: Interessierte können sich formlos bewerben; ein tabellarischer Lebenslauf muss jedoch beigefügt werden. Was ist erforderlich?", ["Ein Motivationsvideo", "Ein Lebenslauf", "Ein Zeugnis"], 1, "The CV must be attached."),
      q("Text: Die Stadt will den Radverkehr fördern und plant daher zusätzliche geschützte Fahrradwege. Welches Ziel hat die Maßnahme?", ["Weniger Buslinien", "Mehr Sicherheit und Radverkehr", "Höhere Parkgebühren"], 1, "Protected lanes support cycling and safety."),
      q("Text: Die Garantie gilt nicht für Schäden, die durch unsachgemäße Nutzung entstanden sind. Wann greift sie nicht?", ["Bei einem Produktionsfehler", "Bei falscher Benutzung", "Innerhalb des ersten Jahres"], 1, "Unsachgemäße Nutzung means improper use."),
      q("Text: Die Autorin befürwortet digitale Lehrmittel, warnt aber davor, traditionelle Methoden vollständig zu ersetzen. Welche Position vertritt sie?", ["Nur digitale Methoden", "Eine ausgewogene Kombination", "Keine digitalen Medien"], 1, "She supports digital tools but not total replacement.")
    ]
  },
  B2: {
    grammar: [
      q("Die Ergebnisse sind weniger eindeutig, ___ zunächst angenommen wurde.", ["als", "wie", "denn"], 0, "Comparisons of inequality use als."),
      q("Der Vertrag gilt als ___, sobald beide Parteien unterschrieben haben.", ["abgeschlossen", "abzuschließen", "abschließen"], 0, "Gelten als is followed here by the participial adjective abgeschlossen."),
      q("Ohne rechtzeitig informiert worden zu sein, ___ sie keine Entscheidung treffen.", ["konnte", "könnte gewesen", "hatte"], 0, "The main past event uses konnte."),
      q("Es bedarf weiterer Maßnahmen, ___ das Ziel erreicht werden kann.", ["damit", "sodass", "obwohl"], 0, "Damit expresses purpose."),
      q("Der Ansatz ist sowohl kostengünstig ___ auch nachhaltig.", ["wie", "als", "und"], 1, "The fixed pair is sowohl … als auch."),
      q("Die Verordnung tritt in Kraft, ___ sie veröffentlicht worden ist.", ["nachdem", "während", "indem"], 0, "Nachdem marks the prior completed action.")
    ],
    vocabulary: [
      q("eine These untermauern", ["to substantiate a thesis", "to weaken a thesis", "to translate a thesis"], 0, "Untermauern means support with evidence."),
      q("unumstritten", ["undisputed", "unavoidable", "unresolved"], 0, "Unumstritten means not disputed."),
      q("etwas außer Acht lassen", ["to disregard something", "to emphasize something", "to complete something"], 0, "The phrase means fail to consider."),
      q("der Stellenwert", ["importance/status", "location", "shortcoming"], 0, "Stellenwert describes significance or standing."),
      q("weitreichend", ["far-reaching", "temporary", "measurable"], 0, "Weitreichend describes extensive consequences."),
      q("einer Annahme zugrunde liegen", ["to underlie an assumption", "to contradict an assumption", "to publish an assumption"], 0, "Zugrunde liegen means form the basis of something.")
    ],
    communication: [
      q("Challenge a conclusion diplomatically.", ["Diese Schlussfolgerung erscheint mir angesichts der Daten etwas voreilig.", "Das ist Unsinn.", "Sie verstehen die Daten nicht."], 0, "The wording questions the conclusion while remaining professional."),
      q("Distinguish fact from interpretation.", ["Die Zahlen sind belegt; ihre Deutung bleibt jedoch umstritten.", "Zahlen erklären sich selbst.", "Interpretationen sind Fakten."], 0, "This explicitly separates evidence and interpretation."),
      q("Signal a reservation in a proposal.", ["Grundsätzlich stimme ich zu, allerdings sehe ich ein Umsetzungsproblem.", "Ich lehne alles ab.", "Es gibt keinerlei Problem."], 0, "Allerdings introduces a specific reservation."),
      q("Request evidence for a claim.", ["Auf welche Quellen stützen Sie diese Aussage?", "Warum sagen Sie irgendetwas?", "Ist die Quelle schön?"], 0, "This formally asks for supporting sources."),
      q("Reframe a polarized debate.", ["Vielleicht sollten wir zunächst klären, welche Ziele beide Seiten teilen.", "Eine Seite muss verlieren.", "Die Debatte ist beendet."], 0, "It redirects attention to shared goals."),
      q("Conclude with a limitation.", ["Die Ergebnisse sind vielversprechend, lassen sich aber nicht ohne Weiteres verallgemeinern.", "Die Ergebnisse gelten überall.", "Weitere Forschung ist überflüssig."], 0, "The response recognizes promise and limits generalization.")
    ],
    reading: [
      q("Text: Die Untersuchung basiert auf Selbstauskünften. Verzerrungen lassen sich daher nicht vollständig ausschließen. Welche methodische Schwäche wird genannt?", ["Fehlende Finanzierung", "Möglicherweise ungenaue Selbstauskünfte", "Zu viele Messgeräte"], 1, "Self-reports can introduce response bias."),
      q("Text: Die Maßnahme entlastet kurzfristig den Haushalt, verlagert die Kosten jedoch auf kommende Jahre. Wie ist sie zu bewerten?", ["Dauerhaft kostenfrei", "Kurzfristig günstig, langfristig belastend", "Sofort wirkungslos"], 1, "The costs are postponed, not removed."),
      q("Text: Der Konsens beschränkt sich auf die Zielsetzung; über die konkrete Umsetzung herrscht weiterhin Uneinigkeit. Worüber besteht Einigkeit?", ["Über alle Details", "Über das Ziel", "Über den Zeitplan"], 1, "Only the objective is agreed upon."),
      q("Text: Die Nachfrage sank nicht trotz, sondern gerade wegen der umfangreichen Werbekampagne, die als aufdringlich wahrgenommen wurde. Was verursachte den Rückgang?", ["Fehlende Werbung", "Die negative Wirkung der Werbung", "Ein höherer Preis"], 1, "The campaign alienated potential customers."),
      q("Text: Der Bericht räumt Fortschritte ein, bemängelt jedoch, dass verbindliche Kriterien fehlen. Was kritisiert er?", ["Fehlende verpflichtende Standards", "Zu schnelle Fortschritte", "Zu viele Kontrollen"], 0, "Verbindliche Kriterien are mandatory standards."),
      q("Text: Was als Einzelfall begann, entwickelte sich zu einer Debatte von grundsätzlicher Bedeutung. Was geschah?", ["Das Thema verlor an Bedeutung", "Ein spezieller Fall löste eine breitere Debatte aus", "Die Debatte wurde sofort beendet"], 1, "The individual case expanded into a fundamental debate.")
    ]
  }
};

export const LEVEL_BANKS = {
  A1: {
    grammar: [q("___ Name ist Sara.",["Mein","Meine","Meinen"],0,"Name is masculine: mein Name."),q("Wir ___ in Berlin.",["wohnt","wohnen","wohnst"],1,"Wir takes the -en verb ending."),q("Ich kaufe ___ Apfel.",["ein","eine","einen"],2,"Apfel is masculine and accusative."),q("___ du Deutsch?",["Sprechen","Sprichst","Sprecht"],1,"Du takes sprichst." )],
    vocabulary: [q("What is ‘the train station’ in German?",["der Bahnhof","die Küche","das Rathaus"],0,"Der Bahnhof means train station."),q("die Familie",["family","company","holiday"],0,"Die Familie means family."),q("What is ‘expensive’?",["billig","teuer","langsam"],1,"Teuer means expensive."),q("der Mittwoch",["Wednesday","Monday","weekend"],0,"Mittwoch is Wednesday.")],
    communication: [q("Someone says: Guten Morgen!",["Guten Morgen!","Gute Nacht!","Entschuldigung!"],0,"Return the same morning greeting."),q("Wie heißen Sie?",["Ich komme aus Dhaka.","Ich heiße Rafi.","Mir geht es gut."],1,"The question asks your name."),q("Was kostet das?",["Es kostet fünf Euro.","Es ist Montag.","Ich bin zwanzig."],0,"Answer with a price."),q("Danke schön!",["Bitte schön!","Auf Wiedersehen!","Keine Ahnung."],0,"Bitte is the natural response.")],
    reading: [q("Text: Lena wohnt in Bonn und arbeitet in einem Café. Wo wohnt Lena?",["In Berlin","In Bonn","In Wien"],1,"The text says ‘wohnt in Bonn’."),q("Text: Der Kurs beginnt um neun Uhr. Wann beginnt er?",["Um 8 Uhr","Um 9 Uhr","Um 10 Uhr"],1,"Neun Uhr is 9:00."),q("Text: Paul kauft Brot und Milch. Was kauft er?",["Obst","Brot und Milch","Kaffee"],1,"Both items are named directly."),q("Text: Am Sonntag bleibt Mia zu Hause. Was macht Mia?",["Sie reist.","Sie arbeitet.","Sie bleibt zu Hause."],2,"The final phrase gives the answer.")]
  },
  A2: {
    grammar: [q("Gestern ___ ich lange gearbeitet.",["habe","bin","werde"],0,"Arbeiten forms the perfect with haben."),q("Ich bleibe zu Hause, ___ ich krank bin.",["denn","weil","oder"],1,"Weil introduces a subordinate clause."),q("Kannst du ___ helfen?",["mich","mir","mein"],1,"Helfen requires the dative."),q("Der Film ist ___ als das Buch.",["spannend","spannender","am spannendsten"],1,"Als signals the comparative.")],
    vocabulary: [q("die Verspätung",["delay","departure","platform"],0,"Verspätung means delay."),q("What is ‘to make an appointment’?",["einen Termin vereinbaren","eine Reise absagen","Geld abheben"],0,"This is the standard expression."),q("die Unterkunft",["accommodation","information","experience"],0,"Unterkunft is a place to stay."),q("sich erholen",["to hurry","to recover/relax","to complain"],1,"Sich erholen means to recover or relax.")],
    communication: [q("You cannot attend an appointment.",["Ich möchte den Termin absagen.","Ich hätte gern die Rechnung.","Ich steige hier aus."],0,"Absagen means cancel."),q("Wie war dein Urlaub?",["Seit zwei Wochen.","Er war sehr erholsam.","Nach Italien."],1,"The question asks for an evaluation."),q("Could you speak more slowly?",["Könnten Sie bitte langsamer sprechen?","Darf ich hier bezahlen?","Wann fährt der Zug ab?"],0,"This is a polite request."),q("Was würdest du empfehlen?",["Ich empfehle die Suppe.","Ich habe reserviert.","Es tut mir leid."],0,"Recommend an option.")],
    reading: [q("Text: Wegen Bauarbeiten fährt der Bus heute nicht. Warum fällt der Bus aus?",["Wegen des Wetters","Wegen Bauarbeiten","Wegen eines Unfalls"],1,"The reason is stated first."),q("Text: Nora sucht eine Wohnung mit Balkon, höchstens 700 Euro. Was ist wichtig?",["Ein Garten","Ein Balkon und der Preis","Drei Schlafzimmer"],1,"Both requirements appear in the text."),q("Text: Bitte melden Sie sich bis Freitag an. Was muss man tun?",["Am Freitag kommen","Vor Freitag bezahlen","Sich spätestens Freitag anmelden"],2,"Bis Freitag gives the deadline."),q("Text: Das Geschäft öffnet samstags erst um zehn. Wann öffnet es?",["Um 8","Um 9","Um 10"],2,"Erst um zehn means not before 10.")]
  },
  B1: {
    grammar: [q("Wenn ich mehr Zeit hätte, ___ ich öfter lesen.",["werde","würde","wurde"],1,"Konjunktiv II uses würde here."),q("Das ist die Kollegin, mit ___ ich arbeite.",["die","der","deren"],1,"Mit requires dative; feminine relative pronoun der."),q("Obwohl es regnete, ___ wir spazieren.",["gingen","gegangen","gehen würden"],0,"A completed past action uses Präteritum here."),q("Die Aufgabe muss heute ___ werden.",["erledigen","erledigt","erledigte"],1,"Passive: participle + werden.")],
    vocabulary: [q("eine Entscheidung treffen",["to postpone a decision","to make a decision","to explain a decision"],1,"Treffen combines with Entscheidung."),q("zuverlässig",["reliable","temporary","suspicious"],0,"Zuverlässig means dependable."),q("What means ‘to take responsibility’?",["Verantwortung übernehmen","Rücksicht nehmen","in Anspruch nehmen"],0,"Übernehmen is used with Verantwortung."),q("die Voraussetzung",["requirement/prerequisite","consequence","exception"],0,"Voraussetzung is a condition required beforehand.")],
    communication: [q("Politely disagree in a discussion.",["Das ist falsch.","Ich sehe das etwas anders.","Das interessiert mich nicht."],1,"This expresses respectful disagreement."),q("Ask for clarification.",["Könnten Sie genauer erklären, was Sie damit meinen?","Würden Sie das vermeiden?","Darf ich widersprechen?"],0,"The sentence explicitly requests clarification."),q("Give a balanced opinion.",["Einerseits ist es praktisch, andererseits teuer.","Es ist auf jeden Fall perfekt.","Dazu sage ich nichts."],0,"Einerseits/andererseits balances two views."),q("Make a formal complaint.",["Ich möchte mich über die Lieferung beschweren.","Die Lieferung war komisch.","Schick das noch mal."],0,"This is appropriately formal.")],
    reading: [q("Text: Homeoffice spart Fahrzeit, kann jedoch den Austausch im Team erschweren. Welcher Nachteil wird genannt?",["Höhere Fahrtkosten","Weniger Austausch","Längere Arbeitszeit"],1,"The contrast after jedoch names the disadvantage."),q("Text: Die Veranstaltung wurde aufgrund geringer Nachfrage verschoben. Warum?",["Der Raum war belegt.","Es gab zu wenig Interesse.","Der Referent war krank."],1,"Geringe Nachfrage means insufficient interest."),q("Text: Bewerbungen, die nach dem 15. Mai eingehen, werden nicht berücksichtigt. Was gilt?",["Späte Bewerbungen zählen nicht.","Alle bekommen eine Antwort.","Die Frist beginnt am 15. Mai."],0,"After the deadline, applications are excluded."),q("Text: Trotz Kritik hält die Stadt an ihrem Verkehrskonzept fest. Was macht die Stadt?",["Sie ändert alles.","Sie beendet das Projekt.","Sie behält den Plan bei."],2,"An etwas festhalten means retain it.")]
  },
  B2: {
    grammar: [q("Die Maßnahme zielt darauf ab, den Verbrauch ___ .",["senken","zu senken","gesenkt"],1,"Darauf abzielen takes an infinitive clause with zu."),q("Kaum ___ die Sitzung begonnen, kam es zum Streit.",["hatte","war","wurde"],0,"Past perfect marks the earlier event."),q("Der Bericht, ___ Ergebnisse umstritten sind, wird geprüft.",["dessen","deren","dem"],0,"Bericht is masculine; possessive relative pronoun dessen."),q("Es ist davon auszugehen, dass die Kosten ___ .",["steigen","gestiegen","zu steigen"],0,"Dass requires a finite verb at the end.")],
    vocabulary: [q("etwas in Frage stellen",["to confirm something","to question something","to postpone something"],1,"The phrase means to doubt or challenge."),q("nachhaltig",["sustainable","unavoidable","profitable"],0,"Nachhaltig means sustainable/lasting."),q("eine Entwicklung begünstigen",["to encourage a development","to reverse a development","to overlook a development"],0,"Begünstigen means favor or facilitate."),q("die Tragweite",["scope/significance","procedure","credibility"],0,"Tragweite describes the extent or consequences.")],
    communication: [q("Qualify a strong claim academically.",["Das ist immer so.","Vieles deutet darauf hin, dass …","Das weiß doch jeder."],1,"This presents evidence without overstating certainty."),q("Redirect a formal discussion.",["Kehren wir zur Ausgangsfrage zurück.","Das Thema ist langweilig.","Reden wir über etwas anderes."],0,"This is precise and appropriately formal."),q("Acknowledge and counter an argument.",["Zwar ist der Einwand berechtigt, dennoch …","Das stimmt überhaupt nicht.","Vielleicht, vielleicht nicht."],0,"Zwar … dennoch concedes before countering."),q("Express a nuanced conclusion.",["Zusammenfassend überwiegen die Vorteile, sofern …","Alles ist gut.","Es gibt nur Nachteile."],0,"The condition makes the conclusion nuanced.")],
    reading: [q("Text: Die Reform mag kurzfristig Kosten verursachen, dürfte sich langfristig jedoch auszahlen. Welche Bewertung trifft zu?",["Nur kurzfristig positiv","Langfristig vermutlich vorteilhaft","Grundsätzlich wirkungslos"],1,"Dürfte sich auszahlen signals a likely long-term benefit."),q("Text: Die Studie erlaubt keine kausalen Schlüsse, da lediglich Zusammenhänge erfasst wurden. Was ist die Einschränkung?",["Zu wenige Themen","Keine Ursache-Wirkung-Aussage","Fehlende Veröffentlichung"],1,"Correlation alone cannot establish causation."),q("Text: Der Vorschlag stieß parteiübergreifend auf Zustimmung. Was bedeutet das?",["Nur eine Partei stimmte zu.","Mehrere politische Lager unterstützten ihn.","Die Abstimmung wurde vertagt."],1,"Parteiübergreifend means across party lines."),q("Text: Die Autorin relativiert ihre These im letzten Abschnitt. Was tut sie?",["Sie formuliert sie differenzierter.","Sie wiederholt sie wörtlich.","Sie beweist sie endgültig."],0,"Relativieren means qualify or limit a claim.")]
  }
};

export function getQuestions(level, type) {
  const bank = LEVEL_BANKS[level] || LEVEL_BANKS.A1;
  const extra = SUPPLEMENTAL_BANKS[level] || SUPPLEMENTAL_BANKS.A1;
  const fullBank = {
    grammar: [...bank.grammar, ...extra.grammar],
    vocabulary: [...bank.vocabulary, ...extra.vocabulary],
    communication: [...bank.communication, ...extra.communication],
    reading: [...bank.reading, ...extra.reading]
  };
  if (type === "grammar" || type === "writing") return fullBank.grammar;
  if (type === "reading") return fullBank.reading;
  if (type === "flashcards" || type === "matching") return fullBank.vocabulary;
  return fullBank.communication.map(item => type === "listening" ? { ...item, speech: item.prompt } : item);
}

export const getQuestionCount = (level, type) => getQuestions(level, type).length;
