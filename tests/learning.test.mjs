import test from "node:test";
import assert from "node:assert/strict";
import {learningStorage,selectLearningOwner,progressRecords,mergeProgressRecords,applyProgressRecords} from "../js/learning-storage.js";
import {getDailyPlan,createDailyPlan,dailyStepUrl,localDay} from "../js/daily-plan.js";
import {getA1ProgressSummary,resetA1Progress} from "../js/a1-progress.js";
import {validateDictionary} from "../js/data-quality.js";
import {formatMeaningText,formatExamples,escapeHtml} from "../js/dictionary-format.js";

const store=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};};
const cards="rw_a1_flashcards_v1";

test("legacy guest progress stays separate from each account and resets stay deleted",()=>{
  globalThis.localStorage=store();localStorage.setItem(cards,JSON.stringify({totalCardsReviewed:4}));
  assert.equal(JSON.parse(learningStorage.getItem(cards)).totalCardsReviewed,4);
  selectLearningOwner("alice");assert.equal(learningStorage.getItem(cards),null);
  learningStorage.setItem(cards,JSON.stringify({totalCardsReviewed:9}));
  selectLearningOwner("bob");assert.equal(learningStorage.getItem(cards),null);
  selectLearningOwner("alice");assert.equal(JSON.parse(learningStorage.getItem(cards)).totalCardsReviewed,9);
  learningStorage.removeItem(cards);assert.equal(learningStorage.getItem(cards),null);
  assert.equal(progressRecords()[cards].value,null);
  selectLearningOwner("guest");assert.equal(JSON.parse(learningStorage.getItem(cards)).totalCardsReviewed,4);
});

test("two-device merge preserves different activities and newer reset tombstones",()=>{
  const a={[cards]:{value:'{"totalCardsReviewed":5}',updatedAt:20}},b={rw_a1_reading_v1:{value:'{"sessionsCompleted":1}',updatedAt:25},[cards]:{value:null,updatedAt:30}};
  const merged=mergeProgressRecords(a,b);
  assert.equal(merged[cards].value,null);assert.ok(merged.rw_a1_reading_v1);
  assert.deepEqual(mergeProgressRecords(merged,a),merged);
  assert.deepEqual(mergeProgressRecords({unknown:{value:"{}",updatedAt:1},[cards]:{value:[],updatedAt:2}},{}),{});
  selectLearningOwner("second-device");applyProgressRecords(merged);assert.equal(learningStorage.getItem(cards),null);assert.equal(JSON.parse(learningStorage.getItem("rw_a1_reading_v1")).sessionsCompleted,1);
});

test("daily checklist resumes, counts actual practice and rolls over on the local day",()=>{
  const storage=store(),today=new Date(2026,8,5,23,30);
  const plan=getDailyPlan(storage,today);assert.equal(plan.day,"2026-09-05");assert.equal(plan.steps.length,3);
  storage.setItem(cards,JSON.stringify({totalCardsReviewed:4}));assert.equal(getDailyPlan(storage,today).steps[0].complete,false);
  storage.setItem(cards,JSON.stringify({totalCardsReviewed:5}));assert.equal(getDailyPlan(storage,today).steps[0].complete,true);
  assert.equal(getDailyPlan(storage,today).steps[0].complete,true);
  const tomorrow=getDailyPlan(storage,new Date(2026,8,6,0,1));assert.equal(tomorrow.steps[0].complete,false);assert.equal(tomorrow.steps[0].baseline,5);
  assert.equal(localDay(today),"2026-09-05");
});

test("daily grammar and vocabulary focus create internal routes and keep unfinished learning",()=>{
  const storage=store(),summary=getA1ProgressSummary(storage);
  summary.focusAreas=[{id:"cases",label:"Cases"}];
  let plan=createDailyPlan(summary,storage);assert.equal(plan.steps[1].topic,"cases");assert.match(dailyStepUrl(plan.steps[1],1),/focus=cases/);
  summary.focusAreas=[{id:"travel",label:"Travel"}];plan=createDailyPlan(summary,storage);assert.equal(plan.steps[1].kind,"lesson");assert.match(dailyStepUrl(plan.steps[1],1),/topic=travel/);
  assert.equal(plan.steps[2].topic,summary.continueLearning.id);
});

test("A1 reset preserves other levels and clears the daily checklist",()=>{
  const storage=store();storage.setItem("rw_library_progress_v1",JSON.stringify({"A1:articles":{started:true},"A2:articles":{started:true}}));
  getDailyPlan(storage);storage.setItem(cards,"{}");resetA1Progress(storage);
  assert.deepEqual(JSON.parse(storage.getItem("rw_library_progress_v1")),{"A2:articles":{started:true}});
  assert.equal(storage.getItem(cards),null);assert.equal(storage.getItem("rw_daily_plan_v1"),null);
});

test("corrupt daily plans recover without trusting stored navigation",()=>{
  const storage=store();storage.setItem("rw_daily_plan_v1",'{"day":"2026-09-05","steps":[null]}');
  const plan=getDailyPlan(storage,new Date(2026,8,5));assert.equal(plan.steps.length,3);assert.match(dailyStepUrl(plan.steps[2],2),/^\.\.\/library-topic\/\?/);
});

test("previewing a plan on a second device does not create a newer cloud record",()=>{
  const storage=store();getDailyPlan(storage,new Date(2026,8,5),{persistNew:false});assert.equal(storage.getItem("rw_daily_plan_v1"),null);
});

test("language audit detects non-Bengali translations and missing noun plurals",()=>{
  const result=validateDictionary([{id:"sample",word:"Gesundheit",type:"Nomen",category:"Nomen",article:"wrong",meaning:"Health",englisch:["health"],bangla:["स्वास्थ्य"],examples:["Gesundheit!"]}]);
  for(const code of ["invalid-article","missing-plural","missing-bengali-script"])assert.ok(result.issues.some(issue=>issue.code===code));
});

test("extracted dictionary formatters preserve markup and escape plain meaning text",()=>{
  assert.equal(escapeHtml('<img>'),"&lt;img&gt;");
  assert.equal(formatMeaningText({meaning:'<b>Plural:</b> die Häuser'}),'<b>Plural:</b> die Häuser');
  assert.match(formatExamples({category:"Verben",examples:["[Präsens] Ich lerne."]}),/verb-example-tense/);
});

test("storage failure keeps the latest progress usable for the open page",()=>{
  globalThis.localStorage={getItem:()=>null,setItem:()=>{throw new Error("Quota exceeded");}};
  selectLearningOwner("quota-test");learningStorage.setItem(cards,'{"totalCardsReviewed":7}');
  assert.equal(JSON.parse(learningStorage.getItem(cards)).totalCardsReviewed,7);
});
