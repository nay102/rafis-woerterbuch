import {initLevelPage} from "./level-page.js";
import {mountAusbildungPage} from "./ausbildung.js";
import {initAusbildungLanguage} from "./ausbildung-language.js";

initLevelPage();
mountAusbildungPage(document.getElementById("ausbildungGuide"));
initAusbildungLanguage();

function followSectionLink() {
  const id = window.location.hash.slice(1);
  if (!id.startsWith("aus-")) return;
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({block: "start"});
}
requestAnimationFrame(followSectionLink);
window.addEventListener("hashchange", followSectionLink);

const topButton = document.getElementById("ausScrollTop");
const updateTopButton = () => { topButton.hidden = window.scrollY < 500; };
window.addEventListener("scroll", updateTopButton, {passive: true});
updateTopButton();
topButton.addEventListener("click", () => {
  const title = document.getElementById("aus-title");
  title.tabIndex = -1;
  title.focus({preventScroll: true});
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo({top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
  });
}
