import { initLevelPage } from "./level-page.js";
import { initAuthGate } from "./auth-gate.js";

/* =========================================================
   EDITABLE COURSE INFORMATION

   Replace the sample contact details and level values below.
   WhatsApp must contain the country code and digits only.
========================================================= */

const COURSE_CONTACT = {
  whatsappNumber: "8801988064328",
  whatsappDisplay: "+880 19-88064328",
  email: "rafikul.islam005r@gmail.com"
};

const COURSE_DATA = {
  A1: {
    available: true,
    name: "German A1",
    description: "Build a confident German foundation through live instruction, guided practice, and structured support designed for complete beginners.",
    coursePrice: "৳ 6,000",
    preparationPrice: "৳ 1,000",
    examPrice: "৳ 800",
    privatePrice: "৳ 10,000",
    duration: "10-12 weeks",
    schedule: "Sat, Mon & Wed, 9:00 PM",
    startDate: "15 October 2026",
    examDate: "20 February 2027",
    studyTime: "2-2.5 live hours weekly",
    materials: "Digital notes, worksheets & class recordings"
  },
  A2: {
    available: true,
    name: "German A2",
    description: "Expand everyday communication, grammar, listening, and writing through a guided live-online program for progressing learners.",
    coursePrice: "৳ 8,000",
    preparationPrice: "৳ 1,500",
    examPrice: "৳ 800",
    privatePrice: "৳ 12,000",
    duration: "10-14 weeks",
    schedule: "Sun, Tue & Thu, 9:00 PM",
    startDate: "18 October 2026",
    examDate: "28 February 2027",
    studyTime: "2-2.5 live hours weekly",
    materials: "Digital notes, worksheets & class recordings"
  },
  B1: {
    available: false,
    name: "German B1",
    description: "Develop independent German communication with focused speaking, writing, grammar, vocabulary, and examination-oriented practice.",
    coursePrice: "৳ 10,000",
    preparationPrice: "৳ 5,000",
    examPrice: "৳ 1,000",
    privatePrice: "৳ 15,000",
    duration: "12-16 weeks",
    schedule: "Fri, Sun & Tue, 9:00 PM",
    startDate: "23 October 2026",
    examDate: "15 March 2027",
    studyTime: "2-2.5 live hours weekly",
    materials: "Digital notes, mock tests & class recordings"
  },
  B2: {
    available: false,
    name: "German B2",
    description: "Refine advanced communication and accuracy through live discussion, complex texts, writing feedback, and focused exam preparation.",
    coursePrice: "৳ 15,000",
    preparationPrice: "৳ 3,000",
    examPrice: "৳ 2,000",
    privatePrice: "৳ 20,000",
    duration: "16-18 weeks",
    schedule: "Thu, Sat & Mon, 9:00 PM",
    startDate: "29 October 2026",
    examDate: "30 March 2027",
    studyTime: "2-2.5 live hours weekly",
    materials: "Advanced notes, mock tests & class recordings"
  }
};

const ALLOWED_LEVELS = new Set(Object.keys(COURSE_DATA));

function getSelectedLevel() {
  const requestedLevel = new URLSearchParams(window.location.search)
    .get("level")
    ?.toUpperCase();
  return ALLOWED_LEVELS.has(requestedLevel) ? requestedLevel : "A1";
}

function buildPackageData(level, course) {
  const packages = [
    {
      icon: "fa-solid fa-laptop-file",
      eyebrow: "Complete Program",
      title: `${level} Online Course`,
      description: `The complete live ${level} course, including Goethe-standard exam preparation and realistic mock tests.`,
      price: course.coursePrice,
      date: course.startDate,
      duration: course.duration,
      schedule: course.schedule,
      features: ["Live Google Meet classes", course.materials, "Goethe-standard exam preparation", "Realistic mock tests and feedback"]
    },
    {
      icon: "fa-solid fa-list-check",
      eyebrow: "Focused Preparation",
      title: `${level} Exam Preparation`,
      description: "A preparation-only package for learners who have completed the level and now want focused Goethe-standard exam training.",
      price: course.preparationPrice,
      date: `Starts ${course.startDate}`,
      duration: "6 weeks",
      schedule: "2 live sessions weekly",
      features: ["No full language course", "Live exam-strategy classes", "Four Goethe-standard mock tests", "Speaking and writing feedback"]
    },
    {
      icon: "fa-solid fa-display",
      eyebrow: "Online Assessment",
      title: `${level} Online Exam`,
      description: "A Goethe-standard online mock examination for evaluating your readiness. This is not an official Goethe-Institut certificate exam.",
      price: course.examPrice,
      date: course.examDate,
      duration: "One online exam session",
      schedule: "Google Meet · scheduled slot",
      features: ["Goethe-standard exam format", "Online supervised session", "Four-skill performance report", "Results and improvement feedback"]
    },
    {
      icon: "fa-solid fa-user-graduate",
      eyebrow: "Private Learning",
      title: `${level} Private Course`,
      description: `Personalized one-to-one ${level} instruction with a flexible plan, individual feedback, and lessons adapted to your goals.`,
      price: course.privatePrice,
      date: "Flexible starting date",
      duration: course.duration,
      schedule: "Private schedule by agreement",
      features: ["One-to-one Google Meet classes", "Personal learning plan", "Flexible class scheduling", "Individual feedback and support"]
    }
  ];

  // Complete Program, Private Course, Focused Preparation, Online Exam.
  return [packages[0], packages[3], packages[1], packages[2]];
}

function renderCourseFacts(course) {
  const facts = [
    ["fa-regular fa-calendar", "Course Duration", course.duration],
    ["fa-regular fa-clock", "Class Schedule", course.schedule],
    ["fa-solid fa-hourglass-half", "Study Time", course.studyTime],
    ["fa-solid fa-book-open", "Study Materials", course.materials]
  ];

  document.getElementById("courseFacts").innerHTML = facts.map(([icon, label, value]) => `
    <article class="course-fact-card">
      <span><i class="${icon}" aria-hidden="true"></i></span>
      <div><small>${label}</small><strong>${value}</strong></div>
    </article>
  `).join("");
}

function renderPackages(level, course) {
  const packages = buildPackageData(level, course);
  const grid = document.getElementById("coursePackageGrid");

  grid.innerHTML = packages.map((item, index) => `
    <article class="course-package-card${index === 0 ? " course-package-card--featured" : ""}">
      ${index === 0 ? '<span class="package-popular">Most Complete</span>' : ""}
      <div class="package-icon"><i class="${item.icon}" aria-hidden="true"></i></div>
      <span class="package-eyebrow">${item.eyebrow}</span>
      <h2>${item.title}</h2>
      <p class="package-description">${item.description}</p>
      <div class="package-price"><strong>${item.price}</strong><small>Sample price</small></div>
      <dl class="package-meta">
        <div><dt><i class="fa-regular fa-calendar" aria-hidden="true"></i> Date</dt><dd>${item.date}</dd></div>
        <div><dt><i class="fa-regular fa-clock" aria-hidden="true"></i> Duration</dt><dd>${item.duration}</dd></div>
        <div><dt><i class="fa-solid fa-video" aria-hidden="true"></i> Schedule</dt><dd>${item.schedule}</dd></div>
      </dl>
      <ul>${item.features.map(feature => `<li><i class="fa-solid fa-check" aria-hidden="true"></i>${feature}</li>`).join("")}</ul>
      <button class="package-purchase" type="button" data-package="${item.title}">
        Purchase <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </button>
    </article>
  `).join("");
}

function setupPurchaseModal(level) {
  const modal = document.getElementById("purchaseModal");
  const selection = document.getElementById("purchaseSelection");
  const whatsapp = document.getElementById("purchaseWhatsapp");
  const email = document.getElementById("purchaseEmail");
  const modalTitle = document.getElementById("purchaseModalTitle");
  const isAvailable = COURSE_DATA[level].available;
  let previouslyFocused = null;

  document.getElementById("whatsappDisplay").textContent = COURSE_CONTACT.whatsappDisplay;
  document.getElementById("emailDisplay").textContent = COURSE_CONTACT.email;

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("purchase-modal-open");
    previouslyFocused?.focus();
  };

  document.getElementById("coursePackageGrid").addEventListener("click", event => {
    const button = event.target.closest(".package-purchase");
    if (!button) return;

    const packageName = button.dataset.package;
    const message = `Hello, I am interested in the ${packageName} (${level}) from Rafis Sprachwelt.`;
    previouslyFocused = button;
    selection.textContent = `${packageName} · Level ${level}`;
    modalTitle.textContent = isAvailable ? "Purchase Your Package" : "Enrollment Opening Soon";
    modal.classList.toggle("is-unavailable", !isAvailable);
    whatsapp.href = `https://wa.me/${COURSE_CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
    email.href = `mailto:${COURSE_CONTACT.email}?subject=${encodeURIComponent(`${packageName} purchase request`)}&body=${encodeURIComponent(message)}`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("purchase-modal-open");
    modal.querySelector(".purchase-close")?.focus();
  });

  modal.querySelectorAll("[data-close-purchase]").forEach(control => {
    control.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

function initEnrollmentPage() {
  const level = getSelectedLevel();
  const course = COURSE_DATA[level];

  document.title = `${course.name} Online Course | Rafis Sprachwelt`;
  document.getElementById("courseBranding").textContent = `Rafis Sprachwelt - ${level}`;
  document.getElementById("enrollmentTitle").textContent = `${course.name} Online Course`;
  document.getElementById("enrollmentIntro").textContent = course.description;
  document.getElementById("packagesTitle").textContent = `${level} Course Options`;
  document.getElementById("levelBackLink").href = `${level.toLowerCase()}.html`;

  renderCourseFacts(course);
  renderPackages(level, course);
  setupPurchaseModal(level);
}

initAuthGate();
initLevelPage();
initEnrollmentPage();
