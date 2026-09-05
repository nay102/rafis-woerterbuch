// Editorial review date: update this only after rechecking the linked sources.
export const AUSBILDUNG_REVIEWED = "2026-09-05";
export const AUSBILDUNG_SOURCES = {
  overview: {title:"Make it in Germany · Training system",url:"https://www.make-it-in-germany.com/en/study-vocational-training/training-in-germany/vocational"},
  requirements: {title:"Make it in Germany · Entry requirements",url:"https://www.make-it-in-germany.com/en/study-vocational-training/training-in-germany/requirements-for-vocational-training"},
  visa: {title:"Make it in Germany · Training visa and 2026 funding",url:"https://www.make-it-in-germany.com/en/visa-residence/types/training"},
  dhaka: {title:"German Embassy Dhaka · Training visa checklist (15 January 2026)",url:"https://dhaka.diplo.de/bd-en/service/2685226-2685226"},
  dhakaFaq: {title:"German Embassy Dhaka · Ausbildung FAQ",url:"https://dhaka.diplo.de/bd-en/service/2729000-2729000"},
  fees: {title:"German Embassy Dhaka · Visa fees",url:"https://dhaka.diplo.de/bd-en/service/2668284-2668284"},
  pay: {title:"BIBB · Minimum training pay for 2026 starters",url:"https://www.bibb.de/de/199658.php"},
  search: {title:"Federal Employment Agency · Finding training",url:"https://www.arbeitsagentur.de/bildung/ausbildung/ausbildungsplatz-finden"},
  apply: {title:"Federal Employment Agency · Application process",url:"https://www.arbeitsagentur.de/bildung/bewerbung/bewerbungsprozess-ausbildung"},
  documents: {title:"Federal Employment Agency · Application documents",url:"https://web.arbeitsagentur.de/bildung/bewerbung/bewerbungsunterlagen"},
  profiles: {title:"Make it in Germany · Occupational profiles",url:"https://www.make-it-in-germany.com/en/study-vocational-training/training-in-germany/profiles"},
  nursing: {title:"Make it in Germany · Nursing training",url:"https://www.make-it-in-germany.com/en/study-vocational-training/training-in-germany/profiles/nursing-professional"},
  recruitment: {title:"Federal Employment Agency · Health-sector recruitment restrictions (PDF)",url:"https://www.arbeitsagentur.de/datei/rekrutierungs-und-vermittlungsverbot-who_ba146788.pdf"},
  countries: {title:"German law · Countries listed under §38 BeschV",url:"https://www.gesetze-im-internet.de/beschv_2013/anlage_1.html"},
  recruitmentLaw: {title:"German law · §38 BeschV",url:"https://www.gesetze-im-internet.de/beschv_2013/__38.html"},
  seeker: {title:"German law · §17, search for a training place",url:"https://www.gesetze-im-internet.de/aufenthg_2004/__17.html"},
  probation: {title:"German law · BBiG §20, probation",url:"https://www.gesetze-im-internet.de/bbig_2005/__20.html"},
  trainingLaw: {title:"German law · Vocational Training Act",url:"https://www.gesetze-im-internet.de/bbig_2005/BJNR093110005.html"},
  housing: {title:"Make it in Germany · Housing and registration",url:"https://www.make-it-in-germany.com/en/living-in-germany/housing-mobility/housing-registration"},
  future: {title:"Make it in Germany · After training",url:"https://www.make-it-in-germany.com/en/study-vocational-training/training-in-germany/prospects-after"}
};
const p = text => ({type:"paragraph",text});
const list = (...items) => ({type:"list",items});
const note = (title,text) => ({type:"note",title,text});
const table = (headers,rows) => ({type:"table",headers,rows});

export const AUSBILDUNG_SECTIONS = [
  {id:"basics",title:"What Ausbildung actually is",label:"The basics",sources:["overview"],blocks:[
    p("Ausbildung is vocational education for a specific occupation: you learn the theory, practise the work and take the required examinations. It is a route to a professional qualification, rather than simply a language course or a general job offer. An Auszubildender or Auszubildende is often called an Azubi."),
    p("In the dual system, a company provides practical training while a Berufsschule teaches the related theory. School may run on weekly days or in blocks. Many programmes begin in August or September; the advertised start date is what matters for your application."),
    list("Choose an occupation you can see yourself doing after graduation, including its less attractive daily tasks.","Consider whether you prefer practical training, university study, or a combination. Compare the actual qualification and curriculum before deciding.","Treat a place, a visa and a later skilled job as separate milestones. An offer does not complete the other steps automatically.")
  ]},
  {id:"routes",title:"Compare the training routes",label:"Training types",sources:["overview","requirements"],blocks:[
    table(["Route","Learning and payment","What to check"],[
      ["Duale / betriebliche Ausbildung","Company practice plus vocational school; a training allowance is paid.","Recognised occupation, company contract, school arrangements and the applicable training regulation."],
      ["Schulische Ausbildung","School-based education with practical placements; pay is not universal. Public schools are generally tuition-free; private fees may apply.","State recognition, admission rules, practical placements, tuition and how you will finance living costs."],
      ["Nursing professional training","A regulated route combining nursing school and clinical practice; remuneration is paid.","Exact qualification, school admission and health-sector recruitment rules; see the nursing section."],
      ["Duales Studium","Higher education combined with company experience; a different academic route.","University entrance eligibility, university admission, employer agreement and who pays any fees."]
    ]),
    p("Duration depends on the occupation and training model. Many dual programmes take around three years; some are shorter or longer. Use the specific training regulation and contract rather than assuming every Ausbildung lasts the same time.")
  ]},
  {id:"eligibility",title:"Education, age and previous experience",label:"Eligibility",sources:["requirements","dhakaFaq"],blocks:[
    p("Dual training has no universal legally required school-leaving grade: employers set selection criteria. School-based training generally requires formal recognition of the relevant school qualification. The responsible recognition authority is in the German federal state concerned."),
    p("There is no general maximum age for starting Ausbildung. The under-35 rule belongs to the training-place search visa, which is a different route. Older applicants should obtain advice about their individual residence requirements. A prior degree or career does not automatically disqualify someone."),
    note("For SSC / HSC holders in Bangladesh","Do not assume an SSC or HSC certificate has an automatic German equivalence or that one GPA guarantees acceptance. Ask the employer and school which qualification they require and which state authority, if any, must evaluate your documents. Dhaka’s FAQ leaves educational suitability to the employer, with an embassy plausibility check."),
    list("Explain study or employment gaps honestly using a consistent month-by-month CV.","Present relevant internships, work, practical projects or volunteering as evidence of interest; do not invent experience.","For recognition, ask for the exact document list before purchasing translations or assessments. School-certificate recognition and recognition of an existing professional qualification are different procedures.")
  ]},
  {id:"language",title:"German: admission, visa evidence and real working ability",label:"German level",sources:["visa","dhaka","nursing"],blocks:[
    p("The federal training-visa guide normally specifies B1 for qualified training, with assessment/preparatory-course exceptions. Dhaka’s January 2026 checklist states usually A2, or B1 for medical professions; its employer language-assessment option excludes medical professions. These statements do not override a school’s higher admission requirement."),
    note("A practical target","Plan for strong B1 and work toward B2, especially for patient-facing, customer-facing and classroom-heavy work. This is preparation advice, not a claim that B2 is a universal visa rule. Obtain written confirmation of the accepted certificate, level and deadline from your provider, and verify visa evidence with Dhaka."),
    list("Reading: understand a vacancy, a contract clause and a short workplace instruction.","Listening: follow a phone call, a safety instruction and a conversation at normal speed.","Speaking: explain your motivation, ask for clarification and describe a mistake without memorising a script.","Writing: compose a clear email and a short factual report.","Exam planning: check current test availability and keep enough time for results and a possible retake. English or IELTS does not replace a German requirement.")
  ]},
  {id:"occupations",title:"Choose a field that fits your strengths",label:"Career fields",sources:["profiles","nursing"],blocks:[
    p("Use these as research directions, not a list of guaranteed vacancies or visa-friendly employers. Search the exact German job title and compare individual advertisements."),
    table(["Field / search examples","Questions to ask yourself","Evidence to prepare"],[
      ["IT · Fachinformatiker/in","Do I enjoy debugging, systems or programming and explaining technical problems?","A small documented project; explain what you built and how you solved a problem."],
      ["Technical trades · Elektroniker/in, Mechatroniker/in","Am I comfortable with maths, practical work and precise safety instructions?","School strengths, practical tasks and an example of careful troubleshooting."],
      ["Logistics · Fachkraft für Lagerlogistik","Can I work accurately with goods, records and changing schedules?","Examples of organisation, reliability and handling physical work."],
      ["Hospitality · Hotelfachmann/-frau, Koch/Köchin","Can I manage guests, teamwork, time pressure and the advertised shifts?","Service experience, practical interest and a realistic understanding of the role."],
      ["Retail / commercial work · Kaufmann/-frau im Einzelhandel","Do I enjoy customer communication, products and numbers?","A customer-service example and clear spoken German."],
      ["Nursing · Pflegefachfrau/-mann","Am I prepared for personal care, documentation and responsibility?","Relevant experience if available; review the special Bangladesh recruitment section first."]
    ]),
    note("How to shortlist","Pick two or three related occupations. Compare tasks, school requirements, salary, location, commute, accommodation and training support in a simple table. The best fit is not necessarily the largest city or the highest advertised gross allowance.")
  ]},
  {id:"pay",title:"Training pay: gross, net and the 2026 minimum",label:"Training salary",sources:["pay","nursing"],blocks:[
    p("For covered dual training under BBiG / HwO beginning between 1 January and 31 December 2026, BIBB publishes these monthly minimum amounts. They are the rates for the 2026 starting cohort, not a salary promise for every occupation or every training model."),
    table(["Training year","Monthly minimum, gross"],[["Year 1","€724"],["Year 2","€854"],["Year 3","€977"],["Year 4, where applicable","€1,014"]]),
    p("Collective-agreement exceptions apply. The occupation, employer and relevant agreement determine the actual offer, which can be higher. Do not apply these BBiG figures automatically to every school-based or nursing programme."),
    p("Brutto means before deductions; Netto is the amount paid after deductions. Social insurance reduces gross training pay. Ask for a personalised payroll estimate rather than treating gross salary as your rent-and-food budget."),
    list("Read the allowance for every training year, not only the highest figure in the advertisement.","Check whether housing or meals are provided, optional or deducted from pay.","Ask which allowances are guaranteed and which depend on actual shifts or overtime.")
  ]},
  {id:"funding",title:"Visa funding and a realistic moving budget",label:"Money & costs",sources:["visa","fees"],blocks:[
    table(["Purpose","Published 2026 financial benchmark"],[
      ["Company-based training","€1,048 gross OR €822 net monthly training allowance is the published livelihood benchmark."],
      ["School-based training","At least €959 net per month; evidence may include a blocked account, declaration of commitment or scholarship."],
      ["Searching for a training place","€1,091 per month through a blocked account, or a declaration of commitment."]
    ]),
    p("If company training pay is insufficient, the federal guide permits supplementary proof for the shortfall, such as a blocked account or declaration of commitment. Ask the visa authority how your exact salary and any benefits will be assessed. The training-pay minimum and the visa funding benchmark serve different purposes."),
    p("Dhaka lists the standard adult national-visa fee as €75, payable in BDT at its exchange rate. Its current fee page also lists BDT 28,000 if document verification is required. Check exemptions and the current payable amount; verification is not an automatic charge for every applicant."),
    list("Before departure: budget for language study and exams, passport/document work, translations, visa-related costs, insurance and travel.","On arrival: allow for temporary accommodation, a rental deposit, first rent, transport, household essentials and a reserve until your first salary.","Every month: list rent and utilities, food, transport, phone, learning materials and personal commitments. Use quotes for your actual city.","Keep living-cost planning separate from visa calculations. Do not use an assumed future side job or an unconfirmed benefit to close a funding gap.")
  ]},
  {id:"bangladesh",title:"From Bangladesh: a step-by-step application roadmap",label:"Bangladesh route",sources:["apply","dhaka","dhakaFaq"],blocks:[
    note("বাংলাদেশ থেকে শুরু করুন","আগে পেশা ও যোগ্যতার শর্ত বুঝুন, জার্মান ভাষা শিখুন এবং উপযুক্ত প্রতিষ্ঠানে আবেদন করুন। চুক্তি পাওয়ার পর অর্থের প্রমাণ ও ভিসার প্রস্তুতি নিন। নার্সিংয়ের জন্য নিচের বিশেষ নিয়োগবিধি অবশ্যই পড়ুন।"),
    {type:"steps",items:[
      ["1. Choose the occupation","Write down why this work fits you, what the provider expects and which daily tasks you are willing to do. For healthcare, read the recruitment restrictions before seeking placement assistance."],
      ["2. Build a credible language and education profile","Prepare your school records, a chronological CV and relevant experience. Set a language-exam plan that fits the provider’s requirements."],
      ["3. Find suitable openings","Search official job tools and employer career pages. Check the training year and location. Keep the vacancy and requirements saved for reference."],
      ["4. Apply to the employer or school","Follow the advertised method. Use a specific cover letter and clearly named PDFs. Explain that you are currently in Bangladesh and would need the relevant entry permission."],
      ["5. Interview and verify the offer","Discuss tasks, school, language, pay, housing and the realistic start date. Check the organisation using contact details you locate independently."],
      ["6. Review and sign the training agreement","Read every page. Ask for clarification of salary, conditions and responsibilities before signing. Keep your own complete copy."],
      ["7. Prepare the visa stage","Use Dhaka’s current checklist and the vocational-training link to the Consular Services Portal. Arrange the relevant financial and insurance evidence."],
      ["8. Coordinate the start","Stay reachable, track requests and keep the employer informed. Plan travel only around the actual visa decision and agreed start arrangements."]
    ]},
    p("The embassy does not find an employer for applicants. A preparation plan helps you organise your work; it is not a guarantee of admission or a visa.")
  ]},
  {id:"find-apply",title:"Where to search and how to submit a strong application",label:"Find & apply",sources:["search","apply","documents"],blocks:[
    p("The Federal Employment Agency directs applicants to its Jobsuche for company training and Ausbildungssuche for school-based options. Employer career pages are also useful. Some schools require applications about a year ahead; deadlines vary."),
    list("Search combinations such as “Ausbildung Fachinformatiker 2027”, “Ausbildung Lagerlogistik [city]” or the precise job title you selected. Change the year to your target intake.","Read the entire vacancy: qualification, language, start date, location, application channel and required attachments.","Create an application log with employer, role, source URL, deadline, date sent, response and next action. Keep a copy of the exact documents sent.","Use the employer’s own portal when instructed. Follow its attachment format and file-size limits.","If an advertisement gives no response timetable, send one polite follow-up after a reasonable interval. Avoid sending repeated daily messages.")
  ]},
  {id:"application-pack",title:"Your application pack and interview preparation",label:"CV & interview",sources:["documents","apply"],blocks:[
    table(["Document","What to include"],[
      ["Lebenslauf / CV","A clear timeline of education, work and practical experience; contact details, language ability and relevant skills."],
      ["Anschreiben / cover letter","Why this occupation, why this organisation and which concrete examples show your suitability."],
      ["Supporting evidence","Relevant school records, qualifications, language certificates and experience documents requested in the advertisement."],
      ["Portfolio, where relevant","A few carefully explained projects or work samples; show your own contribution."]
    ]),
    p("Suggested interview practice: explain your current situation in two minutes, describe a real task you completed, explain a mistake you learned from, and answer why you chose this occupation. Use your own words. If you do not understand a question, ask for clarification."),
    {type:"phrases",items:[
      ["Warum möchten Sie diesen Beruf lernen?","Why do you want to learn this occupation?"],
      ["Könnten Sie die Frage bitte anders formulieren?","Could you please phrase the question differently?"],
      ["Wie ist der Berufsschulunterricht organisiert?","How are vocational-school classes organised?"],
      ["Welche Unterstützung gibt es beim Ausbildungsbeginn?","What support is available when training begins?"]
    ]},
    note("A useful question to ask","“Which requirements must I fulfil before signing, and which must be completed before the first training day?” Keep the answer in writing so you can plan language exams, recognition and travel realistically.")
  ]},
  {id:"dhaka-documents",title:"Dhaka visa preparation: documents and procedure",label:"Dhaka visa",sources:["dhaka"],blocks:[
    p("Dhaka accepts applications within its residence jurisdiction. Its training page links to digital.diplo.de. Follow the portal’s instructions and appointment process; do not substitute the internship booking route."),
    table(["Preparation summary","Items"],[
      ["Identity / forms","Passport, biometric photograph, signed application/declaration, passport data-page copy."],
      ["Training / education","Signed contract, Ausbildungsplan, school and qualification records; BA pre-approval if available (optional)."],
      ["Personal evidence","Language evidence, motivation letter and CV."],
      ["Start / insurance","Employer late-start approval if needed; employment health-insurance evidence and arrival-gap travel cover where necessary."]
    ]),
    p("Bengali documents need English or German translations; Dhaka prefers German rather than duplicate translations. Additional evidence may be requested. Its approximately four-week minimum processing statement excludes any promise about appointment waiting or your total timeline."),
    note("Use the full checklist","This is an orientation summary. Open the official checklist for passport specifications, document order, current submission instructions and your complete case requirements. Keep all confirmation messages and reference numbers.")
  ]},
  {id:"nursing-bangladesh",title:"Nursing: special rules for applicants in Bangladesh",label:"Nursing rules",sources:["nursing","recruitment","recruitmentLaw","countries"],blocks:[
    p("Full-time general nursing professional training lasts three years and ends with a state examination. The official profile specifies an intermediate school qualification, German at B1 or B2 depending on the state, health suitability and reliability evidence. Confirm the school’s exact rules. A short caregiver course does not automatically replace these requirements or confer the nursing qualification."),
    note("Check the recruitment route before paying anyone","Bangladesh appears in the annex to §38 BeschV. Recruitment and placement from listed countries into German health and care occupations are reserved to the Federal Employment Agency. The BA explicitly says this covers training placements too, and can include employer recruitment and advertising—not just private agency fees."),
    p("This is a restriction on recruitment and placement; it should not be presented as an automatic refusal of every individual visa application. For an independently initiated nursing application, obtain case-specific guidance from the BA and the visa authority about what is permitted. An agency describing its service as “only training” does not resolve this rule."),
    list("Ask for the precise qualification name: nursing professional and nursing assistant programmes have different requirements and outcomes.","Ask who the practical training provider and school are, and which placements form part of the programme.","Compare the actual pay and support with accommodation costs; do not rely on an agency’s salary illustration.","Prepare for personal care, documentation, teamwork and the advertised shifts. Choose nursing because the work suits you.")
  ]},
  {id:"seeker",title:"No contract yet? Understand the training-place search visa",label:"Search visa",sources:["seeker","visa"],blocks:[
    p("The §17 training-place search route is different from entering with an existing training place. It requires being under 35, sufficient German (B1 in the federal guide), secured living costs and an eligible school qualification: university access in Germany or the country where it was obtained, or a German school-abroad qualification."),
    p("The permitted search stay is up to nine months, with employment up to 20 hours weekly and trial work up to two weeks in total. Finding a place and obtaining the appropriate training residence permission remain separate steps. The 2026 funding benchmark is in the money section."),
    note("Choose the route deliberately","For someone preparing in Bangladesh, compare the cost of a search stay with applying from home. A search visa is not a promised training place. Do not treat a tourist visa, student visa or Opportunity Card as interchangeable with this route.")
  ]},
  {id:"timeline",title:"Plan your intake without relying on promised deadlines",label:"Timeline",sources:["overview","search"],blocks:[
    p("For a future intake, work backwards from the advertised start. The schedule below is an example for planning, not an official processing forecast. If you are starting preparation in September 2026, compare 2027 vacancies and any later rolling intakes with your actual language readiness."),
    table(["Planning stage","Useful work"],[
      ["12–18 months before your target, if available","Explore occupations; start German; collect school records; understand funding and recognition questions."],
      ["6–12 months before","Monitor openings, send tailored applications and practise interviews. Adjust to earlier employer deadlines."],
      ["Once you have an offer","Resolve conditions, obtain the contract and prepare the correct visa evidence immediately."],
      ["Before travel","Coordinate start date, housing and insurance after the visa outcome is clear."],
      ["If timing slips","Request a written revised start arrangement. Discuss the school calendar; an employer cannot always move the intake."]
    ])
  ]},
  {id:"contract",title:"Read the contract and understand your training rights",label:"Contract & rights",sources:["trainingLaw","probation"],blocks:[
    list("Confirm both parties, occupation, location, beginning and end, training structure and the designated training provider.","Check working time, paid leave, every year’s allowance, payment arrangements and any housing or meal deductions.","Read probation, termination and repayment terms. Ask for plain-language clarification before signing anything you do not understand.","Keep the training plan, school information and all signed copies. Discuss problems early with your trainer, school or the relevant chamber."),
    p("For training covered by BBiG, probation is between one and four months. Termination rules differ during and after probation. BBiG also provides training duties and protections, including release for relevant school/examination activities. Other training laws, including nursing rules, may differ."),
    note("If the training breaks down","Do not assume your residence permission remains unchanged after cancellation or an employer change. Contact the foreigners authority promptly and seek advice from the responsible training body before taking the next step.")
  ]},
  {id:"arrival",title:"Arriving in Germany and settling into training",label:"Arrival & daily life",sources:["housing","visa"],blocks:[
    p("Register your address with the local registration office within two weeks of moving in, using the landlord’s confirmation where required. Temporary accommodation may not support registration, so ask before booking."),
    list("Keep passport, visa, contract, accommodation details and insurance evidence accessible during travel.","Confirm your first-day contact, route to work and school timetable. Test the commute before training starts.","Arrange the bank account and payroll information requested by your employer; confirm health-insurance enrolment and coverage dates.","Arrange the relevant residence-permit procedure with the local foreigners authority before your entry permission expires.","Set a weekly study routine and keep training records current. Ask for help early if you cannot follow lessons or workplace instructions.","Check what rent includes, who pays utilities and how household bills are shared. Ask about staff accommodation, but do not assume it is free.") ,
    p("The training residence permit allows an independent secondary job of up to 20 hours per week. Check the permit, employer conditions and working-time limits before taking one; training remains your main purpose.")
  ]},
  {id:"after",title:"After graduation: employment and further education",label:"After Ausbildung",sources:["future","visa"],blocks:[
    p("Start discussing your next role before your final examinations. Your training employer may offer a job, but you can also apply elsewhere. Successful qualified training in Germany can open a job-search residence route of up to 18 months, subject to the applicable requirements."),
    p("Further options include occupational specialisation, Meister or technician qualifications and, where admission conditions are met, higher education. These are separate next steps, not automatic upgrades of your original certificate."),
    p("A settlement permit may be possible after German training and two years of subsequent work if the additional legal requirements are met. Graduation alone does not grant permanent residence or citizenship."),
    note("Judge outcomes realistically","Look at actual qualified-job offers, their gross and net pay, location and progression. There is no single guaranteed salary after Ausbildung across all occupations.")
  ]},
  {id:"mistakes",title:"Avoid expensive application mistakes",label:"Common mistakes",sources:["dhakaFaq","recruitment"],blocks:[
    list("Treating a language certificate as proof that every employer must accept you. Match each vacancy’s criteria.","Applying to unrelated occupations with identical motivation letters. Explain a coherent career choice.","Confusing a training allowance with take-home pay, or with sufficient visa funding.","Paying for a guaranteed contract, appointment or visa without independently verifying the provider and the promised service.","Sending your original passport or sensitive records to an unverified intermediary. Check the recipient and why the documents are needed.","Ignoring the healthcare recruitment restriction for Bangladesh. Read the nursing section before agreeing to placement services.","Using false experience, altered certificates or inconsistent dates. Make every claim verifiable.","Budgeting only for the flight. Housing and the period before your first salary need a plan too.")
  ]},
  {id:"faq",title:"Frequently asked questions",label:"FAQ",sources:[],blocks:[
    {type:"faq",items:[
      ["Can someone from Bangladesh apply?","There is a vocational-training visa process for applicants within Dhaka’s jurisdiction. Admission, funding, language and visa requirements must all be met. Healthcare recruitment has an additional restriction; read the dedicated section."],
      ["Is HSC enough?","There is no universal answer for every occupation. Check the employer, school and any required certificate-recognition decision. Do not rely on an agent’s blanket equivalence claim."],
      ["Do I need a blocked account for every paid Ausbildung?","Not necessarily. The assessment depends on the route, accepted income and any shortfall. Use the 2026 funding table and confirm the evidence for your case."],
      ["Can I apply while I am still learning German?","Ask the provider. If it accepts applications before your certificate is ready, state your real current level and planned exam date. Do not present a future level as an achieved qualification."],
      ["Is Ausbildung free?","Paid company training and school-based education have different arrangements. Even without tuition, language preparation, documents, relocation and living expenses still need funding."],
      ["Is the checklist a visa guarantee?","No. It helps you prepare, while the relevant authorities decide the application. Confirm the current official instructions before submitting."],
      ["Is all this information live?","No. This is an editorial guide reviewed on 5 September 2026. Source links let you check later changes; amounts, procedures and requirements can change."]
    ]}
  ]},
  {id:"glossary",title:"German terms you will see in applications",label:"Glossary",sources:[],blocks:[
    {type:"phrases",items:[
      ["Ausbildungsplatz","A training place / apprenticeship opening"],
      ["Ausbildungsvertrag","Training agreement"],
      ["Ausbildungsvergütung","Training allowance"],
      ["Berufsschule","Vocational school"],
      ["Ausbildungsplan","Training plan"],
      ["Zeugnisanerkennung","Recognition of a certificate"],
      ["Sperrkonto","Blocked account"],
      ["Verpflichtungserklärung","Formal declaration of commitment"],
      ["Vorabzustimmung","Pre-approval"],
      ["Probezeit","Probationary period"],
      ["Wohnungsgeberbestätigung","Landlord’s confirmation of residence"],
      ["Ausländerbehörde","Local foreigners authority"]
    ]}
  ]}
];

export const AUSBILDUNG_CHECKLIST = [
  ["occupation","I have shortlisted occupations and read their actual entry requirements."],
  ["language","I have a realistic language and exam plan."],
  ["education","I have checked which school records and recognition are needed."],
  ["cv","My CV, motivation and supporting evidence are consistent."],
  ["route","I understand my application route, including any healthcare recruitment restriction."],
  ["contract","I understand the offer, pay, location, school and contract conditions."],
  ["budget","I have calculated both visa funding and my moving/living budget."],
  ["official","I have reread the current Dhaka checklist and portal instructions."],
  ["arrival","I have a plan for housing, insurance, arrival and the agreed start date."]
];
