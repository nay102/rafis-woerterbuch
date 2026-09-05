import {learningStorage} from "./learning-storage.js";
import {getA1ProgressSummary, A1_LIBRARY_TOPICS} from "./a1-progress.js";

export const DAILY_PLAN_KEY = "rw_daily_plan_v1";
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
const read = (key, storage) => { try { return JSON.parse(storage.getItem(key)) || {}; } catch { return {}; } };
function evidence(step, storage) {
  if (step.kind === "cards") return Number(read("rw_a1_flashcards_v1",storage).totalCardsReviewed) || 0;
  if (step.kind === "grammar") return Number(read("rw_a1_grammar_challenge_v1",storage).attempts) || 0;
  const topic = read("rw_library_progress_v1",storage)[`A1:${step.topic}`] || {};
  return new Set(topic.completedLessons || []).size + (Number(topic.masteryAttempts)||0) + (Number(topic.practiceAttempts)||0);
}
export function createDailyPlan(summary, storage = learningStorage, now = new Date()) {
  const weak = summary.focusAreas[0];
  const grammarSkills = new Set(["articles","pronouns","verb-conjugation","sentence-structure","questions","negation","modal-verbs","cases"]);
  const weakTopic = weak && A1_LIBRARY_TOPICS.find(topic=>topic.id===weak.id);
  const nextTopic = weakTopic?.id === summary.continueLearning.id && !grammarSkills.has(weakTopic.id)
    ? summary.library.items.find(topic=>!topic.completed && topic.id!==weakTopic.id) || summary.continueLearning
    : summary.continueLearning;
  const steps = [
    {kind:"cards",title:summary.dueFlashcards ? "Review 5 due or learning cards" : "Learn 5 vocabulary cards",minutes:3,target:5},
    weakTopic && !grammarSkills.has(weakTopic.id)
      ? {kind:"lesson",title:`Review ${weakTopic.label}`,topic:weakTopic.id,minutes:3,target:1}
      : {kind:"grammar",title:weak && grammarSkills.has(weak.id) ? `Practise ${weak.label}` : "Practise 5 grammar questions",topic:grammarSkills.has(weak?.id)?weak.id:"",minutes:3,target:1},
    {kind:"lesson",title:`Continue ${nextTopic.label}`,topic:nextTopic.id,minutes:4,target:1}
  ].map(step => ({...step,baseline:evidence(step,storage),complete:false}));
  return {day:localDay(now),steps};
}
export function getDailyPlan(storage = learningStorage, now = new Date(), {persistNew = true} = {}) {
  let plan = read(DAILY_PLAN_KEY,storage);
  const valid = plan.day === localDay(now) && Array.isArray(plan.steps) && plan.steps.length === 3 &&
    plan.steps.every((step,index) => step && (index===1?["grammar","lesson"].includes(step.kind):step.kind===["cards","grammar","lesson"][index]) && typeof step.title === "string" && Number.isFinite(step.baseline) && step.target === (index===0?5:1) && (step.kind!=="lesson" || A1_LIBRARY_TOPICS.some(topic=>topic.id===step.topic)));
  if (!valid) { plan=createDailyPlan(getA1ProgressSummary(storage,now),storage,now); if(persistNew)storage.setItem(DAILY_PLAN_KEY,JSON.stringify(plan)); }
  let changed=false;
  for (const step of plan.steps) if (!step.complete && evidence(step,storage) >= step.baseline + step.target) { step.complete=true; changed=true; }
  if (changed) storage.setItem(DAILY_PLAN_KEY,JSON.stringify(plan));
  return plan;
}
export function dailyStepUrl(step,index) {
  const query = new URLSearchParams({level:"A1",daily:"1",step:String(index)});
  if (step.kind === "lesson") { query.set("topic",step.topic); return `../library-topic/?${query}`; }
  query.set("type",step.kind === "cards" ? "flashcards" : "grammar");
  if (step.kind === "grammar" && step.topic) query.set("focus",step.topic);
  return `../practice/?${query}`;
}
export function renderDailyPlan(host) {
  if (!host) return;
  // Merely opening a second device must not overwrite its saved cloud checklist.
  const plan=getDailyPlan(learningStorage,new Date(),{persistNew:false});host.replaceChildren();
  const intro=document.createElement("p");
  const done=plan.steps.filter(step=>step.complete).length;
  intro.textContent=done===3?"Today's practice is complete. Come back tomorrow for your next plan.":`${done} of 3 steps complete · About 10 minutes, at your own pace. Your checklist saves automatically.`;
  const list=document.createElement("ol");list.className="daily-steps";
  plan.steps.forEach((step,index)=>{
    const row=document.createElement("li"), label=document.createElement("span"), link=document.createElement("a");
    label.textContent=`${step.complete?"✓ ":""}${step.title} · about ${step.minutes} min`;
    link.href=dailyStepUrl(step,index);link.className="progress-primary-link";
    link.textContent=step.complete?"Practise again":index===plan.steps.findIndex(item=>!item.complete)?"Start / Continue":"Open step";
    link.setAttribute("aria-label",`${link.textContent}: ${step.title}`);
    link.addEventListener("click",()=>getDailyPlan());
    row.append(label,link);list.append(row);
  });
  host.append(intro,list);
}
export function initDailyReturn() {
  const query=new URLSearchParams(location.search);
  if(query.get("daily")!=="1" || query.get("level")!=="A1" || document.getElementById("dailyReturn"))return;
  const index=Number(query.get("step"));if(!Number.isInteger(index)||index<0||index>2)return;
  const main=document.querySelector("main");if(!main)return;
  const bar=document.createElement("aside");bar.id="dailyReturn";bar.className="daily-return";bar.setAttribute("aria-label","Today's practice");
  const message=document.createElement("span"), link=document.createElement("a");link.href="../progress/?level=A1#daily";link.textContent="Return to today's plan";
  message.setAttribute("role","status");bar.append(message,link);main.prepend(bar);
  const update=()=>{const plan=getDailyPlan();message.textContent=plan.steps[index].complete?"Step complete. Continue with your next activity.":`Today's practice · Step ${index+1} of 3`;
  };
  update();window.addEventListener("learning-progress-changed",update);
}
