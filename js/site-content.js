export const sitePhotos = {
  // Change photo filenames here first. Keep spaces as %20 for browser-safe paths.
  panel: {
    ausbildung: "assets/offline/panel-ausbildung.jpg",
    bangladesh: "assets/offline/panel-bangladesh.jpg",
    germany: "assets/offline/panel-germany.jpg",
    sprachwelt: "assets/branding/rafis-sprachwelt.png",

    settings: "assets/offline/panel-settings.jpg"
  },
  panelHero: {
    germany: "assets/offline/germany-hero.jpg",
    bangladesh: "assets/countries/bangladesh/City.jpg",
    ausbildung: "assets/offline/panel-ausbildung.jpg",
    sprachwelt: "assets/branding/rafis-sprachwelt.png",

  },
  germany: {
    hero: "assets/offline/germany-hero.jpg",
    city: "assets/offline/germany-city.jpg",
    culture: "assets/offline/germany-culture.jpg",
    history: "assets/offline/germany-history.jpg",
    education: "assets/offline/germany-education.jpg",
    work: "assets/offline/germany-work.jpg",
    language: "assets/offline/germany-language.jpg",
    spoken: "assets/offline/germany-spoken.jpg",
    food: "assets/offline/germany-food.jpg",
    sightseeing: "assets/offline/germany-sightseeing.jpg",
    religion: "assets/offline/germany-religion.jpg",
    companies: "assets/offline/germany-companies.jpg"
  },
  bangladesh: {
    city: "assets/countries/bangladesh/City.jpg",
    population: "assets/countries/bangladesh/population.jpg",
    history: "assets/countries/bangladesh/History.jpg",
    education: "assets/countries/bangladesh/Education.jpg",
    language: "assets/countries/bangladesh/Language.png",
    food: "assets/countries/bangladesh/food.jpg",
    sightseeing: "assets/countries/bangladesh/sightseeing.jpg",
    religion: "assets/countries/bangladesh/religion.png",
    economy: "assets/countries/bangladesh/economy.jpg"
  },
    sprachwelt: {
    a1: "assets/levels/a1.png",
    a2: "assets/levels/a2.png",
    b1: "assets/levels/b1.png",
    b2: "assets/levels/b2.png",
  }

};

export const panelPageContent = {
  ausbildung: {
    title: "📚 Ausbildung",
    image: sitePhotos.panelHero.ausbildung,
    description:
      "A detailed Ausbildung guide with official sources, 2026 funding information and an application roadmap for Bangladesh.",
    cards: [
      "Required German level and interview vocabulary.",
      "Common Ausbildung domains and starter phrases.",
      "Preparation checklist for documents and communication."
    ],
        footer: "© All rights reserved."
  },
  bangladesh: {
    title: "🇧🇩 Bangladesh",
    image: sitePhotos.panelHero.bangladesh,
    description:
      "A short overview of Bangladesh with practical language and cultural context for the side panel.",
    cards: [
      "Everyday vocabulary and common phrases related to daily life.",
      "A compact cultural snapshot for learners who want quick context.",
      "Useful bridge content for bilingual navigation inside the site."
    ]
  },
  about: {
    title: "🇩🇪 Germany",
    image: sitePhotos.panelHero.germany,
    description:
      "Useful orientation notes about life, culture, and practical language in Germany.",
    cards: [
      "Daily conversation language patterns and polite forms.",
      "Bureaucracy-related terms for official appointments.",
      "Integration tips and common social communication styles."
    ]
  },
  sprachwelt: {
    image: sitePhotos.panelHero.sprachwelt,
    description:
      "🚀✨Willkommen! Let’s make German simple.\nLearning German doesn't have to be overwhelming.\n👇 Choose your level below and click on it to explore lessons.",
cards: [
  {
    title: "German A1: \nDer perfekte Start",
    href: "a1/",
    image: sitePhotos.sprachwelt.a1,
    imagePosition: "center 40%",
    body: "Master the basics: greetings, core vocabulary, and simple grammar from scratch.",
    photo: "Deutsch A1"
  },
  {
    title: "German A2: \nMehr verstehen",
    href: "a2/",
    image: sitePhotos.sprachwelt.a2,
    imagePosition: "center 40%",
    body: "Build real-world conversational confidence and unlock essential everyday grammar.",
    photo: "Deutsch A2"
  },
    {
    title: "German B1:\nSicher sprechen",
    href: "b1/",
    image: sitePhotos.sprachwelt.b1,
    imagePosition: "center 40%",
    body: "Express your opinions smoothly and handle complex daily or work situations.",
    photo: "Deutsch B1"
  },
  {
    title: "German B2: \nFließend kommunizieren",
    href: "b2/",
    image: sitePhotos.sprachwelt.b2,
    imagePosition: "center 40%",
    body: "Dive into advanced idioms and nuanced debates to speak like a professional.",
    photo: "Deutsch B2"
  }
    ],
        footer: "© All rights reserved."
  },
  settings: {
    title: "⚙ Settings",
    image: sitePhotos.panel.settings,
    description: "Personalization and preference controls for your learning experience.",
    cards: [
      "Theme preference and display tuning options.",
      "Search behavior and accessibility-oriented controls.",
      "Account-linked personalization placeholders."
    ],
        footer: "© All rights reserved."
  }
};

export const CATEGORY_EXPLANATIONS = {
  Verben: {
    de: "Verben beschreiben Handlungen, Vorgänge oder Zustände. Sie bilden das Zentrum eines Satzes, weil ohne Verb keine vollständige Aussage möglich ist.",
    en: "Verbs describe actions, processes, or states. They are the core of a sentence because no complete statement is possible without a verb.",
    bn: "ক্রিয়া কাজ, প্রক্রিয়া বা অবস্থা বোঝায়। বাক্যে ক্রিয়া সবচেয়ে গুরুত্বপূর্ণ, কারণ ক্রিয়া ছাড়া সম্পূর্ণ অর্থপূর্ণ বাক্য হয় না।"
  },
  Adjektiven: {
    de: "Adjektive beschreiben Eigenschaften von Personen, Dingen oder Situationen. Sie machen Aussagen genauer und helfen beim präzisen Ausdruck.",
    en: "Adjectives describe qualities of people, things, or situations. They make statements more precise and expressive.",
    bn: "বিশেষণ মানুষ, বস্তু বা অবস্থার গুণাবলি বোঝায়। এগুলো বাক্যকে আরও স্পষ্ট ও নির্ভুল করে।"
  },
  Adverbien: {
    de: "Adverbien ergänzen Verben, Adjektive oder ganze Sätze. Sie zeigen zum Beispiel Zeit, Ort, Art und Weise oder Grund einer Handlung.",
    en: "Adverbs modify verbs, adjectives, or whole sentences. They often express time, place, manner, or reason.",
    bn: "ক্রিয়াবিশেষণ ক্রিয়া, বিশেষণ বা পুরো বাক্যকে বিস্তারিত করে। এগুলো সাধারণত সময়, স্থান, ধরন বা কারণ বোঝায়।"
  },
  Nomen: {
    de: "Nomen benennen Personen, Dinge, Orte oder abstrakte Begriffe. Im Deutschen schreibt man Nomen immer groß, was sie leicht erkennbar macht.",
    en: "Nouns name people, things, places, or abstract concepts. In German, nouns are always capitalized, which makes them easy to recognize.",
    bn: "বিশেষ্য মানুষ, বস্তু, স্থান বা বিমূর্ত ধারণার নাম বোঝায়। জার্মান ভাষায় বিশেষ্য সব সময় বড় অক্ষরে লেখা হয়।"
  },
  "Nomen-Verb Verbindung": {
    de: "Nomen-Verb-Verbindungen sind feste Kombinationen aus Nomen und Verb. Sie werden in Alltag, Beruf und Prüfung sehr häufig verwendet.",
    en: "Noun-verb combinations are fixed expressions made of a noun and a verb. They are very common in daily life, work, and exams.",
    bn: "বিশেষ্য-ক্রিয়া সংযোগ হলো বিশেষ্য ও ক্রিয়ার স্থায়ী সমন্বয়। দৈনন্দিন জীবন, কাজ এবং পরীক্ষায় এগুলোর ব্যবহার অনেক বেশি।"
  },
  Redewendungen: {
    de: "Redewendungen sind feste sprachliche Ausdrücke mit übertragener Bedeutung. Sie helfen dabei, natürlicher und authentischer Deutsch zu sprechen.",
    en: "Idiomatic expressions are fixed phrases with figurative meaning. They help you speak German more naturally and authentically.",
    bn: "প্রবাদধর্মী বাক্যাংশ হলো স্থায়ী অভিব্যক্তি, যেগুলোর অর্থ প্রায়ই আক্ষরিক নয়। এগুলো জার্মানকে বেশি স্বাভাবিকভাবে বলতে সাহায্য করে।"
  },
  "Sprichwörter": {
    de: "Sprichwörter sind kurze, feste Sätze mit allgemeiner Lebensweisheit. Sie fassen Erfahrungen zusammen und werden oft im Alltag verwendet.",
    en: "Proverbs are short, fixed sayings that express general wisdom. They summarize experience and are often used in everyday language.",
    bn: "প্রবাদ হলো ছোট, স্থির বাক্য যেগুলো সাধারণ জীবনের জ্ঞান প্রকাশ করে। এগুলো অভিজ্ঞতা সংক্ষেপে তুলে ধরে এবং দৈনন্দিন কথায় ব্যবহৃত হয়।"
  },
  "Feste Wendungen": {
    de: "Feste Wendungen sind häufig gebrauchte Wortverbindungen mit klarer Bedeutung. Sie klingen natürlich und helfen beim flüssigen Sprechen.",
    en: "Fixed expressions are commonly used word combinations with a clear meaning. They sound natural and help you speak fluently.",
    bn: "স্থির বাক্যাংশ হলো নিয়মিত ব্যবহৃত শব্দসমষ্টি যার অর্থ নির্দিষ্ট। এগুলো প্রাকৃতিক শোনায় এবং সাবলীলভাবে বলতে সাহায্য করে।"
  },
  Slang: {
    de: "Slang ist lockere, informelle Alltagssprache. Er klingt natürlicher in Gesprächen mit Freunden und hilft, echte gesprochene Sprache besser zu verstehen.",
    en: "Slang is informal everyday language. It sounds more natural in casual conversations and helps you understand real spoken German better.",
    bn: "স্ল্যাং হলো অনানুষ্ঠানিক দৈনন্দিন ভাষা। বন্ধুর সাথে কথোপকথনে এটি বেশি স্বাভাবিক শোনায় এবং বাস্তব কথ্য জার্মান বুঝতে সাহায্য করে।"
  },
  "Schimpfwörter": {
    de: "Schimpfwörter sind beleidigende oder abwertende Ausdrücke. Diese Wörter können verletzend wirken und sollten nur mit großer Vorsicht verstanden, nicht aktiv genutzt werden.",
    en: "Insults are offensive or degrading expressions. They can hurt people and should be treated with great caution, mainly for understanding context.",
    bn: "গালিগালাজ বা অপমানজনক শব্দ হলো আঘাতমূলক ও অসম্মানজনক প্রকাশভঙ্গি। এগুলো কেবল বোঝার জন্য রাখা উচিত, ব্যবহার করার জন্য নয়।"
  },
  "Best YT Kanäle": {
    de: "Hier findest du empfehlenswerte YouTube-Kanäle zum Deutschlernen. Sie unterstützen Hörverstehen, Wortschatzaufbau und regelmäßige Motivation.",
    en: "Here you find recommended YouTube channels for learning German. They support listening skills, vocabulary growth, and consistent motivation.",
    bn: "এখানে জার্মান শেখার জন্য ভালো ইউটিউব চ্যানেলগুলো দেওয়া আছে। এগুলো শুনে বোঝা, শব্দভান্ডার বাড়ানো এবং ধারাবাহিক অনুশীলনে সাহায্য করে।"
  },
  "Filme & Serien": {
    de: "Filme und Serien verbessern Sprachgefühl und Hörverständnis durch echte Dialoge. Sie zeigen, wie Deutsch in natürlichen Situationen klingt.",
    en: "Movies and series improve language feel and listening comprehension through real dialogues. They show how German sounds in natural situations.",
    bn: "ফিল্ম ও সিরিজ বাস্তব সংলাপের মাধ্যমে ভাষার অনুভূতি ও শ্রবণ দক্ষতা বাড়ায়। এতে বোঝা যায় বাস্তব পরিস্থিতিতে জার্মান কেমন শোনায়।"
  }
};

export const GERMANY_PAGE_COPY = {
  en: {
    toggleLabel: "Deutsch",
    eyebrow: "Country Guide",
    title: "Germany",
    subtitle:
      "A structured overview of Germany's states, cities, history, education, language, food, landmarks, and economy.",
    heroImage: sitePhotos.panelHero.germany,
    stats: [
      { value: "16", label: "Federal states" },
      { value: "83.6M", label: "Population, 2025 estimate" },
      { value: "2,056", label: "Cities and towns with Stadt status" },
      { value: "10,753", label: "Municipalities, January 2024" },
      { value: "1957", label: "Founding EEC member" }
    ],
    statesTitle: "The 16 Federal States",
    statesIntro:
      "Germany is a federal republic. Each Bundesland has its own government and important responsibilities, especially in education, culture, policing, and local administration.",
    states: [
      "Baden-Württemberg (Stuttgart)",
      "Bavaria (Munich)",
      "Berlin (Berlin)",
      "Brandenburg (Potsdam)",
      "Bremen (Bremen)",
      "Hamburg (Hamburg)",
      "Hesse (Wiesbaden)",
      "Lower Saxony (Hanover)",
      "Mecklenburg-Vorpommern (Schwerin)",
      "North Rhine-Westphalia (Düsseldorf)",
      "Rhineland-Palatinate (Mainz)",
      "Saarland (Saarbrücken)",
      "Saxony (Dresden)",
      "Saxony-Anhalt (Magdeburg)",
      "Schleswig-Holstein (Kiel)",
      "Thuringia (Erfurt)"
    ],
    sections: [
      {
        title: "Cities and Structure",
        image: sitePhotos.germany.city,
        body:
          "Germany has 2,056 cities and towns with official Stadt status and 10,753 municipalities as of January 2024. Berlin is both the capital and a city-state. Other major urban centers include Hamburg, Munich, Cologne, Frankfurt, Stuttgart, Düsseldorf, Leipzig, Dortmund, Essen, and Bremen."
      },
      {
        title: "Population and Culture",
        image: sitePhotos.germany.culture,
        body:
          "Germany has about 83.6 million people according to 2025 EU figures. Its culture blends regional identity with modern urban life: classical music, literature, Christmas markets, football, festivals, punctuality, privacy, direct communication, and strong public institutions all shape daily life."
      },
      {
        title: "History and the European Union",
        image: sitePhotos.germany.history,
        body:
          "Modern Germany was shaped by the Holy Roman Empire, Prussia, industrialization, two world wars, division into West and East Germany, and reunification on 3 October 1990. Germany helped build post-war European cooperation through the Coal and Steel Community and was a founding member of the European Economic Community in 1957, which later became part of today's European Union."
      },
      {
        title: "Education System",
        image: sitePhotos.germany.education,
        body:
          "Education is mainly organized by the federal states. Children usually begin with Grundschule and then continue into secondary paths such as Gymnasium, Realschule, Hauptschule, Gesamtschule, or state-specific models. Higher education includes universities, universities of applied sciences, and vocational routes."
      },
      {
        title: "Ausbildung and Work Culture",
        image: sitePhotos.germany.work,
        body:
          "Ausbildung is Germany's respected vocational training path. The dual system combines paid practical training in a company with lessons at a Berufsschule. Many programs last two to three and a half years and lead into skilled careers in healthcare, crafts, industry, IT, logistics, hospitality, and business."
      },
      {
        title: "Language",
        image: sitePhotos.germany.language,
        body:
          "German is the official language and a key language of science, engineering, culture, and business in Europe. Standard German is used in education and administration, while regional dialects add strong local identity."
      },
      {
        title: "Where German Is Spoken",
        image: sitePhotos.germany.spoken,
        body:
          "German is an official language in Germany, Austria, Switzerland, Liechtenstein, Luxembourg, Belgium, and South Tyrol in Italy. It is also spoken by communities in neighboring countries and by German-speaking communities worldwide."
      },
      {
        title: "Food, Bread, and Everyday Taste",
        image: sitePhotos.germany.food,
        body:
          "Germany is famous for bread culture, bakeries, sausages, pretzels, potato dishes, cakes, and regional meals. Popular examples include Brötchen, rye bread, sourdough, Brezel, Currywurst, Schnitzel, Spätzle, Sauerkraut, Black Forest cake, and Stollen."
      },
      {
        title: "Sightseeing Highlights",
        image: sitePhotos.germany.sightseeing,
        body:
          "Famous places include the Brandenburg Gate, Berlin Museum Island, Cologne Cathedral, Neuschwanstein Castle, the Black Forest, the Rhine Valley, Heidelberg, Hamburg's Speicherstadt, Zugspitze, Dresden's old town, and the Romantic Road."
      },
      {
        title: "Religion and Society",
        image: sitePhotos.germany.religion,
        body:
          "Germany's religious landscape includes Christian traditions, a growing number of people without religious affiliation, and Muslim, Jewish, Buddhist, and other communities. Churches, cathedrals, mosques, synagogues, and civic traditions all contribute to the country's public life and local identity."
      },
      {
        title: "Famous Companies",
        image: sitePhotos.germany.companies,
        body:
          "Germany has a strong export and engineering economy. Well-known companies include Volkswagen, BMW, Mercedes-Benz, Bosch, Siemens, SAP, Deutsche Telekom, DHL Group, Bayer, BASF, Adidas, Puma, Allianz, and Lufthansa."
      }
    ],
    companiesTitle: "Company Snapshot",
    companies: [
      "Volkswagen: one of the world's largest automotive groups.",
      "BMW: premium cars and motorcycles, based in Munich.",
      "Mercedes-Benz: luxury vehicles, trucks, and automotive engineering heritage.",
      "Bosch: technology, mobility, industrial, and home solutions.",
      "Siemens: industrial technology, infrastructure, automation, and health technology.",
      "SAP: global enterprise software company founded in Walldorf.",
      "BASF: major chemical company headquartered in Ludwigshafen.",
      "Adidas and Puma: sportswear brands with roots in Herzogenaurach."
    ],
    note:
      "Numbers are a practical snapshot: Germany has 16 states, 2,056 cities/towns with Stadt status, and 10,753 municipalities as of January 2024."
  },
  de: {
    toggleLabel: "English",
    eyebrow: "Länderführer",
    title: "Deutschland",
    subtitle:
      "Ein strukturierter Überblick über Bundesländer, Städte, Geschichte, Bildung, Sprache, Essen, Sehenswürdigkeiten und Wirtschaft.",
    heroImage: sitePhotos.panelHero.germany,
    stats: [
      { value: "16", label: "Bundesländer" },
      { value: "83,6 Mio.", label: "Bevölkerung, Schätzung 2025" },
      { value: "2.056", label: "Städte mit Stadtrecht" },
      { value: "10.753", label: "Gemeinden, Januar 2024" },
      { value: "1957", label: "Gründungsmitglied der EWG" }
    ],
    statesTitle: "Die 16 Bundesländer",
    statesIntro:
      "Deutschland ist eine föderale Republik. Jedes Bundesland hat eine eigene Regierung und wichtige Aufgaben, besonders bei Bildung, Kultur, Polizei und Verwaltung.",
    states: [
      "Baden-Württemberg (Stuttgart)",
      "Bayern (München)",
      "Berlin (Berlin)",
      "Brandenburg (Potsdam)",
      "Bremen (Bremen)",
      "Hamburg (Hamburg)",
      "Hessen (Wiesbaden)",
      "Niedersachsen (Hannover)",
      "Mecklenburg-Vorpommern (Schwerin)",
      "Nordrhein-Westfalen (Düsseldorf)",
      "Rheinland-Pfalz (Mainz)",
      "Saarland (Saarbrücken)",
      "Sachsen (Dresden)",
      "Sachsen-Anhalt (Magdeburg)",
      "Schleswig-Holstein (Kiel)",
      "Thüringen (Erfurt)"
    ],
    sections: [
      {
        title: "Städte und Struktur",
        image: sitePhotos.germany.city,
        body:
          "Deutschland hat 2.056 Städte mit offiziellem Stadtrecht und 10.753 Gemeinden, Stand Januar 2024. Berlin ist Hauptstadt und zugleich Stadtstaat. Weitere große Zentren sind Hamburg, München, Köln, Frankfurt, Stuttgart, Düsseldorf, Leipzig, Dortmund, Essen und Bremen."
      },
      {
        title: "Bevölkerung und Kultur",
        image: sitePhotos.germany.culture,
        body:
          "Deutschland hat nach EU-Zahlen von 2025 rund 83,6 Millionen Einwohner. Die Kultur verbindet regionale Identität mit modernem Stadtleben: klassische Musik, Literatur, Weihnachtsmärkte, Fußball, Feste, Pünktlichkeit, Privatsphäre, direkte Kommunikation und starke öffentliche Institutionen prägen den Alltag."
      },
      {
        title: "Geschichte und Europäische Union",
        image: sitePhotos.germany.history,
        body:
          "Das moderne Deutschland wurde durch das Heilige Römische Reich, Preußen, Industrialisierung, zwei Weltkriege, die Teilung in West- und Ostdeutschland und die Wiedervereinigung am 3. Oktober 1990 geprägt. Deutschland förderte die europäische Zusammenarbeit nach dem Krieg und war 1957 Gründungsmitglied der Europäischen Wirtschaftsgemeinschaft, aus der später die heutige Europäische Union hervorging."
      },
      {
        title: "Bildungssystem",
        image: sitePhotos.germany.education,
        body:
          "Bildung wird vor allem von den Bundesländern organisiert. Kinder beginnen meist mit der Grundschule und wechseln danach in weiterführende Schulformen wie Gymnasium, Realschule, Hauptschule, Gesamtschule oder landesspezifische Modelle. Zur Hochschulbildung gehören Universitäten, Hochschulen für angewandte Wissenschaften und berufliche Wege."
      },
      {
        title: "Ausbildung und Arbeitskultur",
        image: sitePhotos.germany.work,
        body:
          "Die Ausbildung ist ein angesehener beruflicher Weg in Deutschland. Das duale System verbindet bezahlte praktische Arbeit in einem Betrieb mit Unterricht an der Berufsschule. Viele Ausbildungen dauern zwei bis dreieinhalb Jahre und führen in qualifizierte Berufe in Pflege, Handwerk, Industrie, IT, Logistik, Gastronomie und kaufmännischen Bereichen."
      },
      {
        title: "Sprache",
        image: sitePhotos.germany.language,
        body:
          "Deutsch ist die Amtssprache und eine wichtige Sprache für Wissenschaft, Technik, Kultur und Wirtschaft in Europa. Standarddeutsch wird in Bildung und Verwaltung genutzt, während Dialekte eine starke regionale Identität zeigen."
      },
      {
        title: "Wo Deutsch gesprochen wird",
        image: sitePhotos.germany.spoken,
        body:
          "Deutsch ist Amtssprache in Deutschland, Österreich, der Schweiz, Liechtenstein, Luxemburg, Belgien und Südtirol in Italien. Außerdem wird Deutsch in Nachbarländern und von deutschsprachigen Gemeinschaften weltweit gesprochen."
      },
      {
        title: "Essen, Brot und Alltagsgeschmack",
        image: sitePhotos.germany.food,
        body:
          "Deutschland ist bekannt für Brotkultur, Bäckereien, Wurst, Brezeln, Kartoffelgerichte, Kuchen und regionale Küche. Bekannte Beispiele sind Brötchen, Roggenbrot, Sauerteigbrot, Brezel, Currywurst, Schnitzel, Spätzle, Sauerkraut, Schwarzwälder Kirschtorte und Stollen."
      },
      {
        title: "Bekannte Sehenswürdigkeiten",
        image: sitePhotos.germany.sightseeing,
        body:
          "Berühmte Orte sind das Brandenburger Tor, die Berliner Museumsinsel, der Kölner Dom, Schloss Neuschwanstein, der Schwarzwald, das Rheintal, Heidelberg, die Hamburger Speicherstadt, die Zugspitze, die Dresdner Altstadt und die Romantische Straße."
      },
      {
        title: "Religion und Gesellschaft",
        image: sitePhotos.germany.religion,
        body:
          "Deutschlands religiöse Landschaft umfasst christliche Traditionen, viele Menschen ohne religiöse Bindung sowie muslimische, jüdische, buddhistische und weitere Gemeinschaften. Kirchen, Kathedralen, Moscheen, Synagogen und zivile Traditionen prägen gemeinsam das öffentliche Leben und die lokale Identität."
      },
      {
        title: "Bekannte Unternehmen",
        image: sitePhotos.germany.companies,
        body:
          "Deutschland hat eine starke Export- und Ingenieurwirtschaft. Bekannte Unternehmen sind Volkswagen, BMW, Mercedes-Benz, Bosch, Siemens, SAP, Deutsche Telekom, DHL Group, Bayer, BASF, Adidas, Puma, Allianz und Lufthansa."
      }
    ],
    companiesTitle: "Unternehmensüberblick",
    companies: [
      "Volkswagen: einer der größten Automobilkonzerne der Welt.",
      "BMW: Premium-Autos und Motorräder mit Sitz in München.",
      "Mercedes-Benz: Luxusfahrzeuge, Nutzfahrzeuge und lange Ingenieurtradition.",
      "Bosch: Technologie, Mobilität, Industrie- und Haushaltslösungen.",
      "Siemens: Industrietechnik, Infrastruktur, Automatisierung und Medizintechnik.",
      "SAP: globaler Anbieter für Unternehmenssoftware aus Walldorf.",
      "BASF: großer Chemiekonzern mit Hauptsitz in Ludwigshafen.",
      "Adidas und Puma: Sportmarken mit Wurzeln in Herzogenaurach."
    ],
    note:
      "Die Zahlen sind ein praktischer Überblick: Deutschland hat 16 Bundesländer, 2.056 Städte mit Stadtrecht und 10.753 Gemeinden, Stand Januar 2024."
  }
};

export const BANGLADESH_PAGE_COPY = {
  en: {
    toggleLabel: "Deutsch",
    title: "Bangladesh",
    heroImage: sitePhotos.panelHero.bangladesh,
    subtitle:
      "A polished overview of Bangladesh's divisions, cities, history, education, language, food, landmarks, and economy.",
    stats: [
      { value: "8", label: "Administrative divisions" },
      { value: "173M+", label: "Population estimate" },
      { value: "Dhaka", label: "Capital city" },
      { value: "1971", label: "Independence year" },
      { value: "Bengali", label: "Official language" }
    ],
    divisionsTitle: "The 8 Divisions",
    divisionsIntro:
      "Bangladesh is divided into eight divisions, each with its own administrative center and strong regional identity. The structure keeps government, services, and local culture closely connected to everyday life.",
    divisions: [
      "Dhaka Division",
      "Chattogram Division",
      "Khulna Division",
      "Rajshahi Division",
      "Barishal Division",
      "Sylhet Division",
      "Rangpur Division",
      "Mymensingh Division"
    ],
    sections: [
      {
        title: "Cities and Structure",
        image: sitePhotos.bangladesh.city,
        body:
          "Dhaka is the capital and a fast-moving megacity, while Chattogram, Khulna, Rajshahi, Sylhet, Barishal, Rangpur, and Mymensingh each bring their own regional identity. Bangladesh balances dense urban life with powerful local communities and a strong national center."
      },
      {
        title: "Population and Culture",
        image: sitePhotos.bangladesh.population,
        body:
          "Bangladesh has one of the largest populations in the world and a rich culture shaped by language, literature, music, festivals, family life, and hospitality. Pohela Boishakh, cricket, traditional dress, and everyday creativity are all part of the national rhythm."
      },
      {
        title: "History and Independence",
        image: sitePhotos.bangladesh.history,
        body:
          "Modern Bangladesh emerged after the 1971 Liberation War and the long struggle for self-determination. Its identity is rooted in the Bengali language movement, a powerful independence story, and a civic culture shaped by resilience and pride."
      },
      {
        title: "Education System",
        image: sitePhotos.bangladesh.education,
        body:
          "Education runs from primary school through secondary and higher education, with public and private institutions serving a large and ambitious student population. English, Bengali, science, and technical training all play important roles in study and career planning."
      },
      {
        title: "Language",
        image: sitePhotos.bangladesh.language,
        body:
          "Bengali is the official and most widely spoken language in Bangladesh. It is central to literature, identity, public life, and the country's cultural confidence, while English is widely used in education, business, and professional settings."
      },
      {
        title: "Food and Everyday Taste",
        image: sitePhotos.bangladesh.food,
        body:
          "Bangladeshi food is fragrant, generous, and deeply regional. Rice, fish, lentils, bhorta, curries, biryani, pitha, and sweets like mishti are everyday anchors, with local spice blends bringing warmth and character to the table."
      },
      {
        title: "Sightseeing Highlights",
        image: sitePhotos.bangladesh.sightseeing,
        body:
          "Notable places include Cox's Bazar, Sundarbans, Srimangal, Lalbagh Fort, Ahsan Manzil, Sixty Dome Mosque, Sonargaon, and the tea gardens of Sylhet. The country combines river landscapes, heritage sites, and natural beauty in a striking way."
      },
      {
        title: "Religion and Society",
        image: sitePhotos.bangladesh.religion,
        body:
          "Bangladesh is shaped by a diverse social fabric with Islam as the majority religion and significant Hindu, Buddhist, and Christian communities contributing to public life. Festivals, charity, neighborhood ties, and family traditions all reflect a social culture that is warm and community-oriented."
      },
      {
        title: "Economy and Industry",
        image: sitePhotos.bangladesh.economy,
        body:
          "Bangladesh is known for garments, textiles, agriculture, remittances, pharmaceuticals, shipbuilding, leather, jute, and a growing digital economy. Its economy is energetic, export-focused, and shaped by entrepreneurship and resilience."
      }
    ],
    snapshotTitle: "Economic Snapshot",
    snapshot: [
      "Garments: a major export engine and global supply-chain backbone.",
      "Agriculture: rice, jute, fish, tea, and diverse local food production.",
      "Pharmaceuticals: an important domestic industry with regional reach.",
      "Shipbuilding: a rising industrial capability with practical export value.",
      "ICT and services: a fast-growing space for startups and digital work.",
      "Remittances: a key source of national income and household support.",
      "Leather and footwear: established manufacturing and export sectors.",
      "Jute heritage: a classic material that still shapes industry and identity."
    ],
    note:
      "Bangladesh is a country of strong language pride, regional depth, and fast-moving modern growth. The divisions, cities, and industries all show a nation building forward with confidence."
  },
  de: {
    toggleLabel: "English",
    title: "Bangladesch",
    heroImage: sitePhotos.panelHero.bangladesh,
    subtitle:
      "Ein hochwertiger Überblick über die Divisionen, Städte, Geschichte, Bildung, Sprache, Essen, Sehenswürdigkeiten und Wirtschaft von Bangladesch.",
    stats: [
      { value: "8", label: "Verwaltungsdivisionen" },
      { value: "173 Mio.+", label: "Bevölkerungsschätzung" },
      { value: "Dhaka", label: "Hauptstadt" },
      { value: "1971", label: "Unabhängigkeitsjahr" },
      { value: "Bengalisch", label: "Amtssprache" }
    ],
    divisionsTitle: "Die 8 Divisionen",
    divisionsIntro:
      "Bangladesch ist in acht Divisionen gegliedert, die jeweils ein eigenes Verwaltungszentrum und eine starke regionale Identität haben. Diese Struktur hält Regierung, Dienstleistungen und lokales Leben eng miteinander verbunden.",
    divisions: [
      "Dhaka Division",
      "Chattogram Division",
      "Khulna Division",
      "Rajshahi Division",
      "Barishal Division",
      "Sylhet Division",
      "Rangpur Division",
      "Mymensingh Division"
    ],
    sections: [
      {
        title: "Städte und Struktur",
        image: sitePhotos.bangladesh.city,
        body:
          "Dhaka ist die Hauptstadt und eine dynamische Megastadt, während Chattogram, Khulna, Rajshahi, Sylhet, Barishal, Rangpur und Mymensingh jeweils ihre eigene regionale Prägung mitbringen. Bangladesch verbindet dichtes Stadtleben mit starken lokalen Gemeinschaften und einem klaren nationalen Zentrum."
      },
      {
        title: "Bevölkerung und Kultur",
        image: sitePhotos.bangladesh.population,
        body:
          "Bangladesch gehört zu den bevölkerungsreichsten Ländern der Welt und besitzt eine reiche Kultur, die von Sprache, Literatur, Musik, Festen, Familienleben und Gastfreundschaft geprägt ist. Pohela Boishakh, Cricket, traditionelle Kleidung und alltägliche Kreativität gehören zum nationalen Rhythmus."
      },
      {
        title: "Geschichte und Unabhängigkeit",
        image: sitePhotos.bangladesh.history,
        body:
          "Das moderne Bangladesch entstand nach dem Befreiungskrieg von 1971 und dem langen Kampf um Selbstbestimmung. Seine Identität wurzelt in der bengalischen Sprachbewegung, einer kraftvollen Unabhängigkeitsgeschichte und einer von Resilienz und Stolz geprägten Zivilgesellschaft."
      },
      {
        title: "Bildungssystem",
        image: sitePhotos.bangladesh.education,
        body:
          "Das Bildungssystem reicht von der Grundschule bis zur weiterführenden und höheren Bildung, wobei öffentliche und private Einrichtungen eine große und ehrgeizige Studentenschaft versorgen. Englisch, Bengalisch, Naturwissenschaften und technische Ausbildung spielen wichtige Rollen bei Studium und Berufsplanung."
      },
      {
        title: "Sprache",
        image: sitePhotos.bangladesh.language,
        body:
          "Bengalisch ist die Amtssprache und die am weitesten verbreitete Sprache in Bangladesch. Sie ist zentral für Literatur, Identität, öffentliches Leben und kulturelles Selbstbewusstsein, während Englisch in Bildung, Wirtschaft und beruflichen Kontexten weit verbreitet ist."
      },
      {
        title: "Essen und Alltag",
        image: sitePhotos.bangladesh.food,
        body:
          "Die Küche Bangladeschs ist aromatisch, großzügig und stark regional geprägt. Reis, Fisch, Linsen, Bhorta, Currys, Biryani, Pitha und Süßspeisen wie Mishti gehören zum Alltag, während lokale Gewürzmischungen Wärme und Charakter auf den Teller bringen."
      },
      {
        title: "Sehenswürdigkeiten",
        image: sitePhotos.bangladesh.sightseeing,
        body:
          "Zu den bekannten Orten gehören Cox's Bazar, die Sundarbans, Srimangal, Lalbagh Fort, Ahsan Manzil, die Sixty Dome Mosque, Sonargaon und die Teeplantagen von Sylhet. Das Land verbindet Flusslandschaften, Kulturerbe und Natur auf eindrucksvolle Weise."
      },
      {
        title: "Religion und Gesellschaft",
        image: sitePhotos.bangladesh.religion,
        body:
          "Bangladesch ist von einem vielfältigen sozialen Gefüge geprägt, in dem der Islam die Mehrheitsreligion ist und hinduistische, buddhistische und christliche Gemeinschaften das öffentliche Leben mitprägen. Feste, Wohltätigkeit, Nachbarschaft und Familientraditionen spiegeln eine warme, gemeinschaftsorientierte Kultur wider."
      },
      {
        title: "Wirtschaft und Industrie",
        image: sitePhotos.bangladesh.economy,
        body:
          "Bangladesch ist bekannt für Bekleidung, Textilien, Landwirtschaft, Rücküberweisungen, Pharmazeutika, Schiffbau, Leder, Jute und eine wachsende digitale Wirtschaft. Die Wirtschaft ist energiegeladen, exportorientiert und von Unternehmergeist und Widerstandskraft geprägt."
      }
    ],
    snapshotTitle: "Wirtschaftssnapshot",
    snapshot: [
      "Bekleidung: ein zentraler Exportmotor und Teil globaler Lieferketten.",
      "Landwirtschaft: Reis, Jute, Fisch, Tee und vielfältige lokale Produktion.",
      "Pharmazeutika: eine wichtige heimische Industrie mit regionaler Reichweite.",
      "Schiffbau: eine wachsende industrielle Stärke mit Exportpotenzial.",
      "IT und Dienstleistungen: ein schnell wachsender Bereich für Startups und digitale Arbeit.",
      "Rücküberweisungen: eine wichtige Einkommensquelle für Haushalte und Land.",
      "Leder und Schuhe: etablierte Produktions- und Exportsektoren.",
      "Jute-Erbe: ein klassisches Material, das Industrie und Identität weiterhin prägt."
    ],
    note:
      "Bangladesch ist ein Land mit starkem Sprachbewusstsein, regionaler Tiefe und schnellem modernem Wachstum. Die Divisionen, Städte und Branchen zeigen ein Land, das selbstbewusst nach vorne geht."
  }
};
