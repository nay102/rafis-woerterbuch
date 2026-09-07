import "./app.js";
import {mountAusbildungPage} from "./ausbildung.js";
import {initAusbildungLanguage} from "./ausbildung-language.js";

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
const updateTopButton = () => {
  topButton.hidden = window.scrollY < 500;
  const footerTop = document.querySelector(".footer").getBoundingClientRect().top;
  const clearance = Math.max(0, window.innerHeight - footerTop + 14);
  topButton.style.setProperty("--aus-footer-clearance", `${clearance}px`);
};
window.addEventListener("scroll", updateTopButton, {passive: true});
window.addEventListener("resize", updateTopButton, {passive: true});
updateTopButton();
topButton.addEventListener("click", () => {
  const title = document.getElementById("aus-title");
  title.tabIndex = -1;
  title.focus({preventScroll: true});
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo({top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
});
