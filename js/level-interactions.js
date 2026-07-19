function initFaqAccordion() {
  document.querySelectorAll(".faq-item").forEach((item, index) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    const answerId = answer.id || `level-faq-answer-${index + 1}`;
    answer.id = answerId;
    question.type = "button";
    question.setAttribute("aria-controls", answerId);
    question.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");
    answer.setAttribute("aria-hidden", item.classList.contains("active") ? "false" : "true");
    answer.style.maxHeight = item.classList.contains("active") ? `${answer.scrollHeight}px` : "0px";

    question.addEventListener("click", () => {
      const shouldOpen = !item.classList.contains("active");

      document.querySelectorAll(".faq-item.active").forEach(openItem => {
        if (openItem === item) return;
        openItem.classList.remove("active");
        openItem.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
        const openAnswer = openItem.querySelector(".faq-answer");
        openAnswer?.setAttribute("aria-hidden", "true");
        if (openAnswer) openAnswer.style.maxHeight = "0px";
      });

      item.classList.toggle("active", shouldOpen);
      question.setAttribute("aria-expanded", String(shouldOpen));
      answer.setAttribute("aria-hidden", String(!shouldOpen));
      answer.style.maxHeight = shouldOpen ? `${answer.scrollHeight}px` : "0px";
    });
  });
}

function initExerciseFilters() {
  const filter = document.querySelector(".exercise-filter");
  const cards = Array.from(document.querySelectorAll(".exercise-card"));
  if (!filter || cards.length === 0) return;

  filter.querySelectorAll("button").forEach(button => {
    button.type = "button";
    button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");

    button.addEventListener("click", () => {
      const selected = button.textContent.trim().toLowerCase();

      filter.querySelectorAll("button").forEach(item => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      cards.forEach(card => {
        const type = card.querySelector(".exercise-type")?.textContent.trim().toLowerCase() || "";
        const matches = selected === "all" || type === selected || (selected === "goethe prep" && type.includes("goethe"));
        card.hidden = !matches;
      });
    });
  });
}

function initBackToTop() {
  if (document.querySelector(".back-to-top")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.textContent = "^";
  document.body.appendChild(button);

  const syncVisibility = () => {
    button.classList.toggle("is-visible", window.scrollY > 500);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  syncVisibility();
  window.addEventListener("scroll", syncVisibility, { passive: true });
}

function initBackToSprachwelt() {
  if (document.querySelector(".back-to-sprachwelt")) return;

  const link = document.createElement("a");
  link.className = "back-to-sprachwelt";
  link.href = "../index.html?page=sprachwelt";
  link.setAttribute("aria-label", "Back to Sprachwelt");
  link.innerHTML = '<span aria-hidden="true">&lt;</span> Back to Sprachwelt';
  document.body.appendChild(link);
}

export function initCourseInteractions() {
  initFaqAccordion();
  initExerciseFilters();
  initBackToSprachwelt();
  initBackToTop();
}
