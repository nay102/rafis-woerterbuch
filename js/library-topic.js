import { initLevelPage } from "./level-page.js";
import { initAuthGate } from "./auth-gate.js";
import { TOPIC_ORDER, LIBRARY_TOPICS } from "./library-topic-data.js";

const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2"]);
const LEVEL_GUIDANCE = {
  A1: "At A1, focus on recognizing the core pattern and producing short, accurate sentences.",
  A2: "At A2, connect the pattern to longer everyday communication and its common variations.",
  B1: "At B1, use the topic flexibly in connected speech and writing with greater accuracy.",
  B2: "At B2, refine nuance, register, precision, and stylistic control."
};

function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function topicUrl(level, slug) {
  return `library-topic.html?level=${encodeURIComponent(level)}&topic=${encodeURIComponent(slug)}`;
}

function renderTopicPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedLevel = (params.get("level") || "A1").toUpperCase();
  const level = VALID_LEVELS.has(requestedLevel) ? requestedLevel : "A1";
  const requestedTopic = params.get("topic") || TOPIC_ORDER[0];
  const slug = LIBRARY_TOPICS[requestedTopic] ? requestedTopic : TOPIC_ORDER[0];
  const topic = LIBRARY_TOPICS[slug];

  document.title = `${topic.title} | Rafis Sprachwelt ${level}`;
  text("topicBranding", `Rafis Sprachwelt - ${level}`);
  text("breadcrumbLevel", level);
  text("breadcrumbType", topic.type);
  text("topicLevelBadge", `Level ${level}`);
  text("topicTitle", topic.title);
  text("topicIntroduction", topic.introduction);
  text("topicOverview", `${topic.overview} ${LEVEL_GUIDANCE[level]}`);
  text("topicTip", topic.tip);

  const backLink = document.getElementById("topicBackLink");
  if (backLink) backLink.href = `${level.toLowerCase()}.html#library`;

  const metaGrid = document.getElementById("topicMetaGrid");
  if (metaGrid) {
    const metadata = [
      ["fa-layer-group", "Topic Type", topic.type],
      ["fa-bullseye", "Learning Focus", topic.focus],
      ["fa-clock", "Study Time", topic.time]
    ];
    metaGrid.innerHTML = metadata.map(([icon, label, value]) => `
      <article class="topic-meta-card">
        <span><i class="fa-solid ${icon}" aria-hidden="true"></i></span>
        <div><small>${label}</small><strong>${value}</strong></div>
      </article>`).join("");
  }

  const pointsGrid = document.getElementById("keyPointsGrid");
  if (pointsGrid) {
    pointsGrid.innerHTML = topic.points.map(([heading, description], index) => `
      <article class="key-point-card">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h3>${heading}</h3>
        <p>${description}</p>
      </article>`).join("");
  }

  const examples = document.getElementById("topicExamples");
  if (examples) {
    examples.innerHTML = topic.examples.map(([german, english, note]) => `
      <tr><td lang="de">${german}</td><td>${english}</td><td>${note}</td></tr>`).join("");
  }

  const practiceList = document.getElementById("practiceList");
  if (practiceList) {
    practiceList.innerHTML = topic.practice.map((activity, index) => `
      <li><span>${index + 1}</span><p>${activity}</p></li>`).join("");
  }

  const currentIndex = TOPIC_ORDER.indexOf(slug);
  const previousSlug = TOPIC_ORDER[(currentIndex - 1 + TOPIC_ORDER.length) % TOPIC_ORDER.length];
  const nextSlug = TOPIC_ORDER[(currentIndex + 1) % TOPIC_ORDER.length];
  const previousLink = document.getElementById("previousTopic");
  const nextLink = document.getElementById("nextTopic");

  if (previousLink) {
    previousLink.href = topicUrl(level, previousSlug);
    previousLink.querySelector("strong").textContent = LIBRARY_TOPICS[previousSlug].title;
  }
  if (nextLink) {
    nextLink.href = topicUrl(level, nextSlug);
    nextLink.querySelector("strong").textContent = LIBRARY_TOPICS[nextSlug].title;
  }
}

renderTopicPage();
initAuthGate();
initLevelPage();
