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
  link.setAttribute("aria-label", "Sprachwelt");
  link.innerHTML = '<span aria-hidden="true">&lt;</span> Sprachwelt';
  document.body.appendChild(link);
}

function initCourseSectionMenu() {
  if (document.querySelector(".course-section-menu")) return;

  // Each label points to an existing section shared by the A1-B2 pages.
  const menuItems = [
    { label: "Course Overview", selector: ".overview-section", id: "course-overview" },
    { label: "Why Sprachwelt", selector: ".features-section", id: "why-sprachwelt" },
    { label: "Course Modules", selector: ".modules-section", id: "modules" },
    { label: "Learning Library", selector: ".learning-library", id: "library" },
    { label: "Practice Center", selector: ".exercise-section", id: "exercises" },
    { label: "Study Resources", selector: ".resources-section", id: "resources" },
    { label: "Study Tips", selector: ".study-support-section", id: "study-tips" }
  ];

  // Add stable targets only when their corresponding section exists.
  const availableItems = menuItems.flatMap(item => {
    const section = document.querySelector(item.selector);
    if (!section) return [];
    section.id ||= item.id;
    section.classList.add("course-section-menu-target");
    return [{ ...item, id: section.id }];
  });

  if (availableItems.length === 0) return;

  const menu = document.createElement("div");
  menu.className = "course-section-menu";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "course-section-menu-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "courseSectionMenuPanel");
  button.innerHTML = `
    <span class="course-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="course-menu-label">Menu</span>
  `;

  const panel = document.createElement("nav");
  panel.id = "courseSectionMenuPanel";
  panel.className = "course-section-menu-panel";
  panel.setAttribute("aria-label", "Course sections");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="course-section-nav">
      ${availableItems.map(item => `
        <a href="#${item.id}">${item.label}</a>
      `).join("")}
    </div>
  `;

  menu.append(button, panel);
  document.body.appendChild(menu);

  const setOpen = shouldOpen => {
    menu.classList.toggle("is-open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    panel.setAttribute("aria-hidden", String(!shouldOpen));
  };

  button.addEventListener("click", event => {
    event.stopPropagation();
    setOpen(!menu.classList.contains("is-open"));
  });

  panel.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    event.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    setOpen(false);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.addEventListener("click", event => {
    if (!menu.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
    setOpen(false);
    button.focus();
  });

  // The main header side panel takes priority over this section menu.
  document.querySelectorAll("#desktopMenuBtn, #mobileMenuBtn").forEach(sidePanelButton => {
    sidePanelButton.addEventListener("click", () => setOpen(false));
  });
}

function initResponsiveModuleReveal() {
  const modulesGrid = document.querySelector(".modules-grid");
  const revealButton = modulesGrid?.querySelector(".more-modules-note");
  if (!modulesGrid || !revealButton) return;

  modulesGrid.id ||= "courseModulesGrid";
  revealButton.setAttribute("aria-controls", modulesGrid.id);

  const setExpanded = shouldExpand => {
    modulesGrid.classList.toggle("show-all-modules", shouldExpand);
    revealButton.setAttribute("aria-expanded", String(shouldExpand));
  };

  revealButton.addEventListener("click", event => {
    event.stopPropagation();
    setExpanded(!modulesGrid.classList.contains("show-all-modules"));
  });

  // Any click outside the toggle returns the responsive grid to four modules.
  document.addEventListener("click", () => setExpanded(false));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setExpanded(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) setExpanded(false);
  });
}

export function initCourseInteractions() {
  initFaqAccordion();
  initExerciseFilters();
  initBackToSprachwelt();
  initCourseSectionMenu();
  initResponsiveModuleReveal();
  initBackToTop();
}
