import { getQuestionCount } from "./practice-data.js";

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
        const matches = selected === "all" || type === selected;
        card.dataset.filterMatch = String(matches);
      });

      document.querySelector(".exercise-grid")?.dispatchEvent(new Event("exercisefilterchange"));
    });
  });
}

function initPracticeCounts() {
  document.querySelectorAll(".exercise-card").forEach(card => {
    const link = card.querySelector('a[href*="practice.html"]');
    const countLabel = card.querySelector(".exercise-meta span");
    if (!link || !countLabel) return;

    const url = new URL(link.href, location.href);
    const level = (url.searchParams.get("level") || "A1").toUpperCase();
    const type = url.searchParams.get("type") || "grammar";
    const count = getQuestionCount(level, type);
    countLabel.textContent = `${count} Questions`;
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

  // Pointer users can reveal the menu without clicking. A short close delay
  // leaves enough time to move from the trigger into the panel below it.
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (supportsHover) {
    let hoverCloseTimer;
    const cancelHoverClose = () => window.clearTimeout(hoverCloseTimer);
    const scheduleHoverClose = () => {
      cancelHoverClose();
      hoverCloseTimer = window.setTimeout(() => {
        if (!button.matches(":hover") && !panel.matches(":hover")) setOpen(false);
      }, 180);
    };

    button.addEventListener("mouseenter", () => {
      cancelHoverClose();
      setOpen(true);
    });
    button.addEventListener("mouseleave", scheduleHoverClose);
    panel.addEventListener("mouseenter", cancelHoverClose);
    panel.addEventListener("mouseleave", scheduleHoverClose);
  }

  button.addEventListener("click", event => {
    event.stopPropagation();
    setOpen(supportsHover || !menu.classList.contains("is-open"));
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

function initCardReveals() {
  const responsiveQuery = window.matchMedia("(max-width: 991px)");
  const revealGroups = [
    {
      grid: document.querySelector(".exercise-grid"),
      cards: [...document.querySelectorAll(".exercise-grid .exercise-card")],
      text: "There are more exercises. Click here to practice more.",
      filterEvent: "exercisefilterchange"
    },
    ...[...document.querySelectorAll(".learning-library .library-grid")].map(grid => ({
      grid,
      cards: [...grid.querySelectorAll(".library-card")],
      text: "There are more topics. Click here to explore more."
    }))
  ];

  revealGroups.forEach((group, groupIndex) => {
    if (
      !group.grid
      || group.cards.length <= 4
      || group.grid.querySelector(":scope > .card-reveal-note")
    ) return;

    const gridId = group.grid.id || `revealCardGrid${groupIndex + 1}`;
    group.grid.id = gridId;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "more-modules-note card-reveal-note";
    button.textContent = group.text;
    button.setAttribute("aria-controls", gridId);
    button.setAttribute("aria-expanded", "false");
    group.grid.append(button);

    let isExpanded = false;
    const animateCard = (card, revealOrder) => {
      card.getAnimations().forEach(animation => animation.cancel());
      // Keep the card visible after the controlled reveal animation finishes,
      // without reactivating its original page-load animation.
      card.classList.add("reveal-animation-managed");
      card.style.setProperty("--reveal-order", revealOrder);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.animate(
        [
          { opacity: 0, transform: "translateY(50px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        {
          duration: reduceMotion ? 1 : 800,
          delay: reduceMotion ? 0 : revealOrder * 80,
          easing: "ease",
          fill: "backwards"
        }
      );
    };

    const syncCards = (animateNewCards = false) => {
      const matchingCards = group.cards.filter(card => card.dataset.filterMatch !== "false");
      const shouldLimitCards = responsiveQuery.matches;

      group.cards.forEach(card => {
        const matchingIndex = matchingCards.indexOf(card);
        const wasHidden = card.hidden;
        const shouldHide = matchingIndex === -1
          || (shouldLimitCards && !isExpanded && matchingIndex >= 4);
        card.hidden = shouldHide;

        if (animateNewCards && wasHidden && !shouldHide && matchingIndex >= 4) {
          animateCard(card, matchingIndex - 4);
        }
      });

      const hasMoreCards = shouldLimitCards && matchingCards.length > 4;
      const buttonAnchor = matchingCards[Math.min(3, matchingCards.length - 1)];
      if (buttonAnchor) buttonAnchor.insertAdjacentElement("afterend", button);
      button.hidden = !hasMoreCards;
      button.setAttribute("aria-expanded", String(isExpanded && hasMoreCards));
    };

    const setExpanded = shouldExpand => {
      const shouldAnimate = shouldExpand && !isExpanded;
      isExpanded = shouldExpand;
      syncCards(shouldAnimate);
    };

    button.addEventListener("click", event => {
      event.stopPropagation();
      setExpanded(!isExpanded);
    });

    document.addEventListener("click", () => {
      if (isExpanded) setExpanded(false);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && isExpanded) {
        setExpanded(false);
        button.focus();
      }
    });

    if (group.filterEvent) {
      group.grid.addEventListener(group.filterEvent, () => {
        setExpanded(false);
      });
    }

    responsiveQuery.addEventListener?.("change", () => {
      setExpanded(false);
    });

    syncCards();
  });
}

export function initCourseInteractions() {
  initFaqAccordion();
  initExerciseFilters();
  initPracticeCounts();
  initBackToSprachwelt();
  initCourseSectionMenu();
  initResponsiveModuleReveal();
  initCardReveals();
  initBackToTop();
}
