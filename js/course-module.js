import { initLevelPage } from "./level-page.js";
import { initAuthGate } from "./auth-gate.js";
import { getCourseModule } from "./course-module-data.js";

const params=new URLSearchParams(location.search),level=(params.get("level")||"A1").toUpperCase(),module=getCourseModule(level,params.get("module"));
const $=id=>document.getElementById(id);
document.title=`Module ${module.number}: ${module.title} | Rafis Sprachwelt ${module.level}`;
$("moduleBranding").textContent=`Rafis Sprachwelt - ${module.level}`;$("moduleBack").href=`${module.level.toLowerCase()}.html#modules`;$("moduleLevel").textContent=`${module.level} Course`;$("moduleNumber").textContent=`Module ${module.number} of 10`;$("moduleTitle").textContent=module.title;$("moduleDescription").textContent=module.description;$("moduleFocus").textContent=module.focus;
$("moduleOutcomes").innerHTML=module.lessons.map((lesson,index)=>`<article><span>${index+1}</span><div><small>Learning outcome</small><h3>${lesson}</h3><p>Understand the key language, study guided examples, and apply it independently in a relevant ${module.level} situation.</p></div></article>`).join("");
$("moduleLessons").innerHTML=module.lessons.map((lesson,index)=>`<article><span>Lesson ${index+1}</span><h3>${lesson}</h3><p>Explanation, model language, controlled practice, and a short communication activity.</p><small><i class="fa-regular fa-clock"></i> 25-35 minutes</small></article>`).join("");
$("moduleWords").innerHTML=module.words.map(([german,english])=>`<div><strong lang="de">${german}</strong><span>${english}</span></div>`).join("");$("moduleTask").textContent=module.task;
const previous=Math.max(1,module.number-1),next=Math.min(10,module.number+1);$("previousModule").href=`course-module.html?level=${module.level}&module=${previous}`;$("nextModule").href=`course-module.html?level=${module.level}&module=${next}`;$("previousModule").classList.toggle("disabled",module.number===1);$("nextModule").classList.toggle("disabled",module.number===10);
initAuthGate();initLevelPage();
