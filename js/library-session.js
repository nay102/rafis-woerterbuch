import { getLibrarySession } from "./library-session-data.js";

const STORAGE_KEY = "rw_library_progress_v1";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function defaultProgress(session) {
  return { started: false, completedLessons: [], currentLesson: null, learnedItems: [], practiceAttempts: 0, guidedPracticeAttempts: 0, independentPracticeAttempts: 0,
    correct: 0, wrong: 0, masteryAttempts: 0, bestMasteryScore: 0,
    lastMasteryScore: 0, mastered: false, weakSkills: [], totalLessons: session.lessons?.length || 0, lastActivity: null };
}

export function getLibraryProgress(level, id) {
  const key = `${level}:${id}`;
  const session = getLibrarySession(level, id);
  const saved = { ...defaultProgress(session || {}), ...(readStore()[key] || {}) };
  if (!session) return saved;
  const lessonIds = new Set(session.lessons.map(lesson => lesson.id));
  const validSkills = new Set(session.masteryQuestions.map(question => question.skill).filter(Boolean));
  saved.completedLessons = [...new Set((Array.isArray(saved.completedLessons) ? saved.completedLessons : []).filter(lessonId => lessonIds.has(lessonId)))];
  saved.currentLesson = lessonIds.has(saved.currentLesson) ? saved.currentLesson : null;
  saved.weakSkills = [...new Set((Array.isArray(saved.weakSkills) ? saved.weakSkills : []).filter(skill => validSkills.has(skill)))];
  saved.totalLessons = session.lessons.length;
  return saved;
}

function saveProgress(session, patch) {
  const store = readStore();
  const key = `${session.level}:${session.id}`;
  store[key] = { ...defaultProgress(session), ...getLibraryProgress(session.level, session.id), ...patch, lastActivity: new Date().toISOString() };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* practice still works */ }
  return store[key];
}

function normalize(value) {
  return String(value || "").trim().toLocaleLowerCase("de-DE").replace(/[.!?]+$/g, "");
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function appendText(parent, tag, text, className) {
  if (!text) return;
  const node = el(tag, className, text);
  if (className?.includes("session-bn")) node.lang = "bn";
  parent.append(node);
}

function renderBlock(block, session) {
  const card = el("section", `session-block session-block--${block.type}`);
  appendText(card, "h3", block.title);
  appendText(card, "p", block.en, "session-block-en");
  appendText(card, "p", block.bn, "session-block-bn");
  if (block.columns && block.rows) {
    const wrap = el("div", "session-table-wrap");
    const table = el("table", "session-table");
    const head = el("thead"); const hr = el("tr");
    block.columns.forEach((column) => hr.append(el("th", "", column)));
    head.append(hr); table.append(head);
    const body = el("tbody");
    block.rows.forEach((row) => { const tr = el("tr"); row.forEach((cell) => tr.append(el("td", "", cell))); body.append(tr); });
    table.append(body); wrap.append(table); card.append(wrap);
  } else if (block.lines) {
    const dialogue = el("div", "session-dialogue");
    block.lines.forEach(([speaker, german, english, bengali]) => {
      const line = el("div", "session-dialogue-line");
      const germanText = el("span", "", german); germanText.lang = "de";
      const bengaliText = el("small", "", bengali); bengaliText.lang = "bn";
      line.append(el("strong", "", speaker), germanText, el("small", "", english), bengaliText);
      dialogue.append(line);
    });
    card.append(dialogue);
  } else if (block.type === "vocabularyCards" && block.items?.length) {
    const grid = el("div", "session-vocabulary-cards");
    block.items.forEach((item) => {
      const entry = el("article", "session-vocabulary-card");
      const germanTitle = el("h4", "", item.german); germanTitle.lang = "de"; entry.append(germanTitle);
      appendText(entry, "p", item.plural ? `Plural: ${item.plural}` : "", "session-vocabulary-plural");
      appendText(entry, "p", item.english, "session-vocabulary-meaning");
      appendText(entry, "p", item.bengali, "session-bn");
      const meta = el("div", "session-vocabulary-meta");
      if (item.category) meta.append(el("span", "", `Category: ${item.category}`));
      if (item.register) meta.append(el("span", "", `Register: ${item.register}`));
      if (meta.childElementCount) entry.append(meta);
      appendText(entry, "p", item.example ? `Example: ${item.example}` : "", "session-vocabulary-example");
      if (session) {
        const learned = Array.isArray(getLibraryProgress(session.level, session.id).learnedItems) ? getLibraryProgress(session.level, session.id).learnedItems : [];
        const learnedButton = el("button", "session-link-btn", learned.includes(item.german) ? "Learned ✓" : "Mark learned");
        learnedButton.type = "button";
        learnedButton.setAttribute("aria-pressed", String(learned.includes(item.german)));
        learnedButton.addEventListener("click", () => {
          const current = getLibraryProgress(session.level, session.id);
          const items = Array.isArray(current.learnedItems) ? current.learnedItems : [];
          const active = items.includes(item.german);
          const next = active ? items.filter((value) => value !== item.german) : [...items, item.german];
          saveProgress(session, { learnedItems: next });
          learnedButton.textContent = active ? "Mark learned" : "Learned ✓";
          learnedButton.setAttribute("aria-pressed", String(!active));
        });
        entry.append(learnedButton);
      }
      if (item.audioSrc) {
        const audioButton = el("button", "session-link-btn", "Play audio");
        audioButton.type = "button";
        audioButton.addEventListener("click", () => new Audio(item.audioSrc).play().catch(() => {}));
        entry.append(audioButton);
      }
      grid.append(entry);
    });
    card.append(grid);
  } else if (block.items?.length) {
    const list = el("div", block.type === "vocabulary" || block.type === "example" ? "session-vocabulary" : "session-chip-list");
    block.items.forEach((item) => {
      if (Array.isArray(item)) {
        const row = el("div", "session-vocabulary-row");
        item.forEach((part, index) => { const value = el(index ? "small" : "strong", "", part); if (!index) value.lang = "de"; if (index === 2) value.lang = "bn"; row.append(value); });
        list.append(row);
      } else list.append(el("span", "", item));
    });
    card.append(list);
  }
  return card;
}

function answerInput(question) {
  const area = el("div", "session-answer-area");
  if (question.type === "multipleChoice") {
    shuffle(question.options).forEach((option) => {
      const label = el("label", "session-option");
      const input = document.createElement("input"); input.type = "radio"; input.name = `answer-${question.id}`; input.value = option;
      label.append(input, el("span", "", option)); area.append(label);
    });
  } else if (question.type === "sorting") {
    const groups = Object.keys(question.groups);
    Object.entries(question.groups).flatMap(([group, words]) => words.map((word) => ({ group, word }))).sort(() => Math.random() - .5).forEach(({ word }) => {
      const row = el("label", "session-sort-row", word);
      const select = document.createElement("select"); select.dataset.word = word;
      select.append(new Option("Choose…", "")); groups.forEach((group) => select.append(new Option(group, group)));
      row.append(select); area.append(row);
    });
  } else {
    const input = document.createElement("input"); input.type = "text"; input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer"); input.placeholder = question.type === "errorCorrection" ? "Write the corrected form" : "Type your answer";
    area.append(input);
  }
  return area;
}

function checkQuestion(question, area) {
  if (question.type === "multipleChoice") return area.querySelector("input:checked")?.value === question.answer;
  if (question.type === "sorting") return [...area.querySelectorAll("select")].every((select) =>
    Object.entries(question.groups).some(([group, words]) => select.value === group && words.includes(select.dataset.word)));
  const accepted = question.acceptedAnswers?.length ? question.acceptedAnswers : [question.answer];
  return accepted.some((answer) => normalize(area.querySelector("input")?.value) === normalize(answer));
}

function submittedAnswer(question, area) {
  if (question.type === "multipleChoice") return area.querySelector("input:checked")?.value || "No answer";
  if (question.type === "sorting") return [...area.querySelectorAll("select")].map((s) => `${s.dataset.word}: ${s.value || "—"}`).join(", ");
  return area.querySelector("input")?.value.trim() || "No answer";
}

function renderRunner(host, questions, { session, label = "Practice", onFinish, recordProgress = true } = {}) {
  host.replaceChildren();
  if (!questions.length) return;
  let index = 0; let correct = 0; const mistakes = [];
  const render = () => {
    host.replaceChildren(); const question = questions[index];
    const progress = el("p", "session-question-count", `${label} · ${index + 1} of ${questions.length}`);
    const prompt = el("h3", "session-question-prompt", question.prompt);
    const area = answerInput(question); const feedback = el("div", "session-feedback"); feedback.setAttribute("aria-live", "polite");
    const submit = el("button", "session-primary-btn", "Check answer"); submit.type = "button";
    submit.addEventListener("click", () => {
      if (submit.dataset.checked) { index += 1; if (index < questions.length) render(); else onFinish?.({ correct, wrong: questions.length - correct, mistakes }); return; }
      if (question.type === "multipleChoice" && !area.querySelector("input:checked")) { feedback.textContent = "Choose an answer first."; return; }
      const isCorrect = checkQuestion(question, area); if (isCorrect) correct += 1;
      else mistakes.push({ question, learnerAnswer: submittedAnswer(question, area) });
      feedback.className = `session-feedback is-${isCorrect ? "correct" : "wrong"}`;
      feedback.replaceChildren(el("strong", "", isCorrect ? "Correct." : "Not quite."));
      if (!isCorrect && question.type !== "sorting") appendText(feedback, "p", `Correct: ${question.answer}`);
      appendText(feedback, "p", question.explanationEn); appendText(feedback, "p", question.explanationBn, "session-bn");
      area.querySelectorAll("input,select").forEach((control) => { control.disabled = true; });
      submit.dataset.checked = "true"; submit.textContent = index + 1 < questions.length ? "Next" : "See results";
    });
    host.append(progress, prompt, area, feedback, submit);
  };
  if (recordProgress) saveProgress(session, { started: true, practiceAttempts: getLibraryProgress(session.level, session.id).practiceAttempts + 1 });
  render();
}

export function renderLibrarySession(session, root) {
  const savedLesson = getLibraryProgress(session.level, session.id).currentLesson;
  const savedIndex = session.lessons.findIndex((lesson) => lesson.id === savedLesson);
  const state = { lesson: savedIndex >= 0 ? savedIndex : 0, masteryMistakes: [] };
  saveProgress(session, { started: true }); root.hidden = false; root.replaceChildren();
  const shell = el("div", "container session-layout"); const rail = el("nav", "session-rail"); rail.setAttribute("aria-label", "Learning session stages");
  const main = el("div", "session-main");
  const stages = [["goal","Progress"],["discover","Discover"],["discover","Learn"],["discover","Examples / In Context"],["guided","Guided Practice"],["real-life","Real-Life Application"],["independent","Independent Practice"],["mastery","Mastery Check"],["review","Review Mistakes"],["continue","Continue Learning"]];
  stages.forEach(([target, label], i) => { const button = el("button", "session-rail-btn", `${i + 1}. ${label}`); button.type="button"; button.addEventListener("click",()=>document.getElementById(`session-${target}`)?.scrollIntoView({behavior:"smooth",block:"start"})); rail.append(button); });

  const overview = el("section", "session-section session-section--progress", ""); overview.id = "session-goal";
  const stats = el("div", "session-progress-card");
  const updateStats = () => { const p=getLibraryProgress(session.level,session.id); const percent=Math.round((p.completedLessons.length/session.lessons.length)*100); stats.replaceChildren(el("strong","",`${percent}% progress`),el("span","",`${p.completedLessons.length} of ${session.lessons.length} lessons completed`),el("span","",`Current lesson: ${Math.min(state.lesson+1,session.lessons.length)} of ${session.lessons.length}`),el("span","",`Best mastery score: ${p.masteryAttempts ? `${p.bestMasteryScore}%` : "Not attempted"}`)); if(session.type==="vocabulary"&&Array.isArray(p.learnedItems))stats.append(el("span","",`Learned items: ${p.learnedItems.length}`)); };
  updateStats(); overview.append(stats); main.append(overview);

  const discover = el("section", "session-section"); discover.id="session-discover";
  discover.append(el("span","session-eyebrow","Discover · Learn · In Context")); const lessonHost=el("div","session-lesson-host"); discover.append(lessonHost); main.append(discover);
  const renderLesson = (lessonIndex) => {
    state.lesson=Math.max(0,Math.min(lessonIndex,session.lessons.length-1)); const lesson=session.lessons[state.lesson]; saveProgress(session,{currentLesson:lesson.id}); lessonHost.replaceChildren();
    const header=el("header","session-lesson-header"); header.append(el("p","",`Lesson ${state.lesson+1} of ${session.lessons.length} · ${lesson.estimatedMinutes} min`),el("h2","",lesson.titleEn),el("span","",lesson.titleDe),el("span","session-bn",lesson.titleBn)); lessonHost.append(header);
    lesson.blocks.forEach((item)=>lessonHost.append(renderBlock(item,session)));
    const checkpoint=el("div","session-checkpoint"); checkpoint.append(el("h3","","Checkpoint")); const runner=el("div"); checkpoint.append(runner); lessonHost.append(checkpoint);
    renderRunner(runner,lesson.checkpoint,{session,label:"Checkpoint",recordProgress:false,onFinish:({correct,wrong})=>{const p=getLibraryProgress(session.level,session.id);const completed=[...new Set([...p.completedLessons,lesson.id])];saveProgress(session,{completedLessons:completed,correct:p.correct+correct,wrong:p.wrong+wrong});runner.replaceChildren(el("p","session-result",`${correct} / ${correct+wrong} correct`));updateStats();}});
    const nav=el("div","session-lesson-nav"); const prev=el("button","session-secondary-btn","Previous"); prev.disabled=state.lesson===0; prev.onclick=()=>renderLesson(state.lesson-1);
    const next=el("button","session-primary-btn",state.lesson===session.lessons.length-1?"Complete lesson":"Next"); next.onclick=()=>{const p=getLibraryProgress(session.level,session.id);saveProgress(session,{completedLessons:[...new Set([...p.completedLessons,lesson.id])]});updateStats();if(state.lesson<session.lessons.length-1)renderLesson(state.lesson+1);else document.getElementById("session-guided")?.scrollIntoView({behavior:"smooth"});}; nav.append(prev,next);lessonHost.append(nav);
  }; renderLesson(state.lesson);

  function addPracticeSection(id,title,description,questions,attemptField) { const section=el("section","session-section");section.id=`session-${id}`;section.append(el("span","session-eyebrow",title),el("h2","",title),el("p","",description));const start=el("button","session-primary-btn","Start practice");const host=el("div","session-runner");start.onclick=()=>{start.hidden=true;const before=getLibraryProgress(session.level,session.id);saveProgress(session,{[attemptField]:(before[attemptField]||0)+1});renderRunner(host,questions,{session,label:title,recordProgress:false,onFinish:({correct,wrong})=>{const p=getLibraryProgress(session.level,session.id);saveProgress(session,{correct:p.correct+correct,wrong:p.wrong+wrong});host.replaceChildren(el("p","session-result",`${correct} / ${correct+wrong} correct`));}});};section.append(start,host);main.append(section);return section; }
  addPracticeSection("guided","Guided Practice",session.guidedPracticeDescription||"Work through the supplied guided tasks.",session.guidedPractice,"guidedPracticeAttempts");
  const realItems=Array.isArray(session.realLifePractice)?session.realLifePractice:[session.realLifePractice];const realSection=el("section","session-section");realSection.id="session-real-life";realSection.append(el("span","session-eyebrow","Real-Life Application"),el("h2","",realItems.length>1?"Everyday Dialogues":realItems[0].title));realItems.forEach((item)=>{if(realItems.length>1)realSection.append(el("h3","",item.title));const passage=el("div","session-passage");item.text.forEach(line=>passage.append(el("p","",line)));appendText(passage,"small",item.note);realSection.append(passage);});const realQuestions=realItems.flatMap((item)=>item.questions);const realStart=el("button","session-primary-btn","Answer reading questions");const realHost=el("div","session-runner");realStart.onclick=()=>{realStart.hidden=true;renderRunner(realHost,realQuestions,{session,label:"Reading",onFinish:({correct,wrong})=>realHost.replaceChildren(el("p","session-result",`${correct} / ${correct+wrong} correct`))});};realSection.append(realStart,realHost);main.append(realSection);
  if (session.productionPractice?.length) {
    const production=el("section","session-section"); production.id="session-production";
    production.append(el("span","session-eyebrow","Speaking & Writing"),el("h2","",session.productionPracticeTitle||"Say It Yourself"),el("p","","Read your answer aloud privately or type it for your own practice. This activity does not grade free text."));
    const grid=el("div","session-production-grid");
    session.productionPractice.forEach((item)=>{const card=el("article","session-production-card");card.append(el("h3","",item.prompt));const input=document.createElement("textarea");input.rows=3;input.placeholder="Type an optional practice answer";input.setAttribute("aria-label",item.prompt);const model=el("pre","session-production-model",item.model);model.hidden=true;const reveal=el("button","session-secondary-btn","Show model");reveal.type="button";reveal.onclick=()=>{model.hidden=!model.hidden;reveal.textContent=model.hidden?"Show model":"Hide model";};card.append(input,reveal,model);grid.append(card);});
    production.append(grid);main.append(production);
  }
  addPracticeSection("independent","Independent Practice","Type or choose your answers without hints.",session.independentPractice,"independentPracticeAttempts");
  if (session.commonMistakes?.length) {
    const mistakesSection=el("section","session-section");mistakesSection.id="session-common-mistakes";mistakesSection.append(el("span","session-eyebrow","Common Mistakes"),el("h2","","Avoid these beginner mistakes"));const mistakesList=el("div","session-review-list");session.commonMistakes.forEach((item)=>{const card=el("article","session-review-item");card.append(el("p","",`Not: ${item.wrong}`),el("p","",`Correct: ${item.correct}`));appendText(card,"p",item.explanation);appendText(card,"p",item.explanationBn,"session-bn");mistakesList.append(card);});mistakesSection.append(mistakesList);main.append(mistakesSection);
  }

  const mastery=el("section","session-section");mastery.id="session-mastery";mastery.append(el("span","session-eyebrow","Mastery Check"),el("h2","",session.masteryTitle||`Test your ${session.title.toLowerCase()} knowledge`),el("p","",`A session shows 10 questions from a ${session.masteryQuestions.length}-question bank. ${session.masteryThreshold}% is this course's configurable mastery target, not an official CEFR requirement.`));const masteryStart=el("button","session-primary-btn","Start mastery check");const masteryHost=el("div","session-runner");
  masteryStart.onclick=()=>{masteryStart.hidden=true;const selected=shuffle(session.masteryQuestions).slice(0,10);renderRunner(masteryHost,selected,{session,label:"Mastery",recordProgress:false,onFinish:({correct,wrong,mistakes})=>{state.masteryMistakes=mistakes;const score=Math.round(correct/selected.length*100);const p=getLibraryProgress(session.level,session.id);const weak=[...new Set(mistakes.map((m)=>m.question.skill).filter(Boolean))];const strengths=[...new Set(selected.map((q)=>q.skill).filter((skill)=>skill&&!weak.includes(skill)))];saveProgress(session,{masteryAttempts:p.masteryAttempts+1,lastMasteryScore:score,bestMasteryScore:Math.max(p.bestMasteryScore,score),mastered:p.mastered||score>=session.masteryThreshold,weakSkills:weak,correct:p.correct+correct,wrong:p.wrong+wrong});updateStats();const band=score>=session.masteryThreshold?"mastered":score>=60?"almost":"practice";const defaults={mastered:{title:"Topic Mastered",en:"Great work. You reached this topic's mastery target.",bn:"দারুণ। আপনি এই topic-এর mastery target পূরণ করেছেন।"},almost:{title:"Almost There",en:"Review your weak areas and try again.",bn:"ভুল হওয়া অংশগুলো review করে আবার চেষ্টা করুন।"},practice:{title:"Keep Practicing",en:"Review the related lessons, then try again.",bn:"সম্পর্কিত lesson-গুলো review করে আবার চেষ্টা করুন।"}};const result={...defaults[band],...(session.masteryMessages?.[band]||{})};masteryHost.replaceChildren(el("div","session-score",`${correct} / ${selected.length}`),el("strong","",`${score}%`),el("h3","",result.title),el("p","",result.en),el("p","session-bn",result.bn));if(strengths.length)masteryHost.append(el("p","",`Strengths: ${strengths.join(", ")}`));if(weak.length)masteryHost.append(el("p","",`Weak areas: ${weak.join(", ")}`));const reviewBtn=el("button","session-secondary-btn",score>=60?"Review Weak Areas":"Review Lessons");reviewBtn.disabled=!mistakes.length;reviewBtn.onclick=()=>renderReview();const retry=el("button","session-primary-btn",score>=session.masteryThreshold?"Practice Again":"Try Again");retry.onclick=()=>{masteryStart.hidden=false;masteryStart.click();};masteryHost.append(reviewBtn,retry);}});};mastery.append(masteryStart,masteryHost);main.append(mastery);
  const review=el("section","session-section");review.id="session-review";review.append(el("span","session-eyebrow","Review Mistakes"),el("h2","","Learn from this attempt"));const reviewHost=el("div","session-review-list");review.append(reviewHost);main.append(review);
  function renderReview(){reviewHost.replaceChildren();if(!state.masteryMistakes.length){reviewHost.append(el("p","","No mastery mistakes to review yet."));}state.masteryMistakes.forEach(({question,learnerAnswer})=>{const card=el("article","session-review-item");card.append(el("h3","",question.prompt),el("p","",`Your answer: ${learnerAnswer}`),el("p","",`Correct: ${question.answer}`),el("p","",question.explanationEn||"Review the related lesson."));if(question.lessonId){const button=el("button","session-link-btn","Review lesson");button.onclick=()=>{const i=session.lessons.findIndex((l)=>l.id===question.lessonId);if(i>=0){renderLesson(i);discover.scrollIntoView({behavior:"smooth"});}};card.append(button);}reviewHost.append(card);});review.scrollIntoView({behavior:"smooth"});}
  const completion=el("section","session-section session-completion");completion.id="session-continue";completion.append(el("span","session-eyebrow",session.isLibraryCoreComplete?"Library Core Complete":"Continue Learning"),el("h2","",session.completionTitle||"What you can do now"));const list=el("ul");session.completionKnowledge.forEach(item=>list.append(el("li","",item)));completion.append(list);const links=el("div","session-completion-links");const back=el("a","session-secondary-btn",session.isLibraryCoreComplete?`Review ${session.level} Learning Library`:`Back to ${session.level} Library`);back.href=`../${session.level.toLowerCase()}/#library`;links.append(back);if(session.isLibraryCoreComplete){const practiceAgain=el("a","session-primary-btn",`Practice ${session.title} Again`);practiceAgain.href=`./?level=${encodeURIComponent(session.level)}&topic=${encodeURIComponent(session.id)}#session-guided`;links.append(practiceAgain);}else if(session.nextTopic){const next=el("a","session-primary-btn",`Continue to ${session.nextTopicTitle||"Next Topic"}`);next.href=`./?level=${encodeURIComponent(session.level)}&topic=${encodeURIComponent(session.nextTopic)}`;links.append(next);}completion.append(links);main.append(completion);
  shell.append(rail,main);root.append(shell);
}

export function updateLibrarySessionCards() {
  document.querySelectorAll("[data-library-session-card]").forEach((card) => {
    const [level, id] = card.dataset.librarySessionCard.split(":");
    const session = getLibrarySession(level, id);
    const progressData = getLibraryProgress(level, id);
    const status = card.querySelector("[data-session-status]");
    const progress = card.querySelector("[data-session-progress]");
    const link = card.querySelector("a");
    const total = session?.lessons.length || progressData.totalLessons || 1;
    if (status) status.textContent = progressData.mastered ? "Mastered" : progressData.started ? "In Progress" : "Not Started";
    if (progress) {
      const completed = progressData.completedLessons?.length || 0;
      progress.textContent = progressData.started
        ? `${Math.round(completed / total * 100)}% · Best ${progressData.masteryAttempts ? `${progressData.bestMasteryScore}%` : "—"}`
        : `${total} Micro Lessons · ${session?.estimatedMinutes || "—"} min`;
    }
    if (link) link.textContent = progressData.mastered ? "Review Topic →" : progressData.started ? "Continue Learning →" : "Start Learning →";
  });
}
