import { GermanSpeech } from "./a1-listening.js";
import { A1_SPEAKING_PROGRESS_KEY, A1_SPEAKING_SKILLS, A1_SPEAKING_TASKS, validateA1SpeakingBank } from "./a1-speaking-data.js";

const shuffle = input => { const out = [...input]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const readProgress = () => { try { return JSON.parse(localStorage.getItem(A1_SPEAKING_PROGRESS_KEY) || "null") || {}; } catch { return {}; } };

export function createA1SpeakingSession(previousIds = [], skills = null, limit = 10) {
  const previous = new Set(previousIds), chosen = [];
  if (skills?.length) {
    const quota = Math.ceil(limit / skills.length);
    skills.forEach(skill => chosen.push(...shuffle(A1_SPEAKING_TASKS.filter(task => task.skill === skill && !previous.has(task.id))).slice(0, quota)));
    if (chosen.length < limit) chosen.push(...shuffle(A1_SPEAKING_TASKS.filter(task => skills.includes(task.skill) && !chosen.some(row => row.id === task.id))).slice(0, limit - chosen.length));
  } else {
    const quotas = {"repeat-pronounce":2,"question-answer":2,"personal-introduction":1,"everyday-speaking":2,description:1,"mini-talk":2};
    Object.entries(quotas).forEach(([skill, count]) => {
      const pool = A1_SPEAKING_TASKS.filter(task => task.skill === skill);
      chosen.push(...[...shuffle(pool.filter(task => !previous.has(task.id))), ...shuffle(pool.filter(task => previous.has(task.id)))].slice(0, count));
    });
  }
  const selected = shuffle(chosen.slice(0, limit));
  const warm = selected.findIndex(task => task.skill === "repeat-pronounce");
  if (warm > 0) [selected[0], selected[warm]] = [selected[warm], selected[0]];
  return selected;
}

export function updateSpeakingCard() {
  const card = document.querySelector("[data-a1-speaking]"); if (!card) return;
  card.querySelector("[data-speaking-count]")?.replaceChildren(document.createTextNode(`${A1_SPEAKING_TASKS.length} Speaking Prompts · 10 per Session`));
  const status = card.querySelector("[data-speaking-status]"); if (!status) return;
  const progress = readProgress(); status.textContent = progress.sessionsCompleted ? `${progress.sessionsCompleted} Session${progress.sessionsCompleted === 1 ? "" : "s"} · ${progress.confident || 0} Confident` : "Not Started";
}

export function initA1Speaking(setSharedPage) {
  const $ = id => document.getElementById(id), errors = validateA1SpeakingBank();
  if (errors.length) { console.error("A1 speaking bank validation failed.", errors); $("practiceForm").textContent = "Speaking Practice is temporarily unavailable because its local prompt data could not be validated."; $("submitPractice").hidden = true; return; }
  let progress = readProgress();
  const validTaskIds = new Set(A1_SPEAKING_TASKS.map(task => task.id));
  progress.skillStats = Object.fromEntries(Object.entries(progress.skillStats || {}).filter(([skill]) => A1_SPEAKING_SKILLS[skill]));
  progress.taskStats = Object.fromEntries(Object.entries(progress.taskStats || {}).filter(([id]) => validTaskIds.has(id)));
  progress.lastSessionIds = Array.isArray(progress.lastSessionIds) ? progress.lastSessionIds.filter(id => validTaskIds.has(id)) : [];
  let session = [], index = 0, results = [], mode = "balanced", completed = false, attemptMade = false, exampleShown = false, helpShown = false, rating = "", taskRecordings = 0, taskModelPlays = 0;
  let stream = null, recorder = null, chunks = [], recordingUrl = "", timerId = 0, seconds = 0, recordingToken = 0;
  const speech = new GermanSpeech(state => updateSpeechStatus(state));
  setSharedPage("A1 Speaking Practice", "Speak German with guided prompts, local recording, playback and honest self-review. No recording is uploaded or permanently saved.");
  $("practiceType").textContent = "Speaking"; $("questionCount").textContent = `${A1_SPEAKING_TASKS.length} local prompts · 10 per session`; $("submitPractice").hidden = true;
  $("practiceResult").setAttribute("aria-live", "polite"); document.querySelector(".practice-sheet")?.classList.add("speaking-sheet");
  const help = document.querySelector(".practice-help"); if (help) { help.querySelector("h2").textContent = "Speak, listen and self-review"; help.querySelector("p").textContent = "Record with your browser or practise aloud without recording. Example answers are models, not the only valid answers."; help.querySelector("small").textContent = "Recordings remain in memory for the current task and are never uploaded."; }
  const persist = () => { progress.lastActivity = new Date().toISOString(); localStorage.setItem(A1_SPEAKING_PROGRESS_KEY, JSON.stringify(progress)); };
  const announce = text => { const live = document.querySelector(".speaking-live"); if (live) live.textContent = text; };
  function updateSpeechStatus(state) { const node = document.querySelector(".speaking-speech-status"); if (!node) return; node.textContent = state === "playing" ? "Playing German…" : state === "unavailable" ? "German speech is not available on this device/browser." : state === "error" ? "German playback could not be completed." : "German model ready"; }
  function mimeType() { if (!("MediaRecorder" in window)) return ""; return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported?.(type)) || ""; }
  function stopTracks() { stream?.getTracks().forEach(track => track.stop()); stream = null; }
  function clearTimer() { clearInterval(timerId); timerId = 0; }
  function discardRecording() { if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = ""; chunks = []; }
  function cleanupTask() {
    speech.cancel(); clearTimer(); recordingToken++;
    if (recorder?.state === "recording") { recorder.ondataavailable = null; recorder.onstop = null; try { recorder.stop(); } catch {} }
    recorder = null; stopTracks(); discardRecording();
  }
  function playGerman(text, slow = false) { if (recorder?.state === "recording") { announce("Stop recording before playing German."); return; } if (speech.play({speech: text}, slow ? .78 : .94)) taskModelPlays++; }
  async function startRecording() {
    if (recorder?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) { announce("Microphone recording is not supported here. Use Practice Without Recording."); return; }
    speech.cancel(); discardRecording(); const token = ++recordingToken;
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio: true});
      if (token !== recordingToken) { stopTracks(); return; }
      const format = mimeType(); recorder = format ? new MediaRecorder(stream, {mimeType: format}) : new MediaRecorder(stream); chunks = []; seconds = 0;
      recorder.ondataavailable = event => { if (token === recordingToken && event.data?.size) chunks.push(event.data); };
      recorder.onstop = () => {
        clearTimer(); stopTracks();
        if (token !== recordingToken) return;
        const blob = new Blob(chunks, {type: recorder?.mimeType || format || "audio/webm"}); if (blob.size) recordingUrl = URL.createObjectURL(blob);
        recorder = null; attemptMade = true; renderTask(); announce(recordingUrl ? "Recording ready to play." : "Recording stopped, but no audio was captured.");
      };
      recorder.start(); taskRecordings++; renderTask(); announce("Recording started.");
      const limit = Math.min(60, session[index].targetSeconds + 15);
      timerId = setInterval(() => { seconds++; const timer = document.querySelector(".speaking-timer"); if (timer) timer.textContent = `${seconds}s / ${limit}s`; if (seconds >= limit) stopRecording(); }, 1000);
    } catch (error) {
      stopTracks(); recorder = null;
      announce(error?.name === "NotAllowedError" ? "Microphone permission was denied. You can practise aloud without recording." : "The microphone could not be started. You can practise aloud without recording.");
    }
  }
  function stopRecording() { if (recorder?.state !== "recording") return; announce("Recording stopped."); try { recorder.stop(); } catch { clearTimer(); stopTracks(); recorder = null; renderTask(); } }
  function practiceWithoutRecording() { attemptMade = true; renderTask(); announce("Practice without recording selected. You can now use the example and self-check."); }
  function saveRating(value) {
    if (!attemptMade) return; rating = value; completed = true;
    const task = session[index], stat = progress.skillStats[task.skill] || {attempted:0,again:0,okay:0,confident:0}; stat.attempted++; stat[value]++; progress.skillStats[task.skill] = stat;
    const item = progress.taskStats[task.id] || {attempts:0,again:0,okay:0,confident:0,recordings:0,modelPlays:0,durationSeconds:0}; item.attempts++; item[value]++; item.recordings = (item.recordings || 0) + taskRecordings; item.modelPlays = (item.modelPlays || 0) + taskModelPlays; item.durationSeconds = (item.durationSeconds || 0) + seconds; item.lastPractised = new Date().toISOString(); progress.taskStats[task.id] = item;
    progress.tasksPractised = (progress.tasksPractised || 0) + 1; progress[value] = (progress[value] || 0) + 1; progress.recordingSeconds = (progress.recordingSeconds || 0) + seconds; results.push({task, rating:value, durationSeconds:seconds}); persist(); renderTask();
  }
  function renderStart() {
    const form = $("practiceForm"); form.replaceChildren();
    const box = make("section", "speaking-start"); box.append(make("span", "speaking-mic-icon", "🎙️"), make("h2", "", "10 Guided Speaking Tasks"), make("p", "", "Listen when helpful, speak aloud, play back your recording and complete an honest self-check."), make("small", "", "Microphone access is optional and requested only when you press Start Recording. Audio is never uploaded or saved permanently."));
    const button = make("button", "challenge-primary", "Start Speaking"); button.type = "button"; button.addEventListener("click", () => startSession()); box.append(button); form.append(box); updateHeader(0, 10);
  }
  function startSession(skills = null) { cleanupTask(); mode = skills?.length ? "weak" : "balanced"; session = createA1SpeakingSession(progress.lastSessionIds || [], skills, skills?.length ? 8 : 10); index = 0; results = []; $("practiceResult").hidden = true; $("practiceForm").hidden = false; resetTaskState(); renderTask(); }
  function resetTaskState() { attemptMade = false; exampleShown = false; helpShown = false; completed = false; rating = ""; seconds = 0; taskRecordings = 0; taskModelPlays = 0; }
  function updateHeader(done = index, total = session.length || 10) { $("answeredCount").textContent = `${done} of ${total} completed`; $("progressFill").style.width = `${done / total * 100}%`; }
  function renderTask() {
    const task = session[index], form = $("practiceForm"); form.replaceChildren(); const recording = recorder?.state === "recording";
    const live = make("p", "speaking-live"); live.setAttribute("aria-live", "polite");
    const header = make("div", "speaking-task-header"); header.append(make("span", "speaking-skill", A1_SPEAKING_SKILLS[task.skill].title), make("strong", "", `Speaking ${index + 1} of ${session.length}`), make("small", "", `${task.difficulty} · about ${task.targetSeconds}s`));
    const prompt = make("section", "speaking-prompt"); prompt.append(make("p", "speaking-instruction", task.instructionEn)); const bn = make("p", "speaking-bn", task.instructionBn); bn.lang = "bn"; const de = make("h2", "speaking-german", task.promptDe); de.lang = "de"; prompt.append(bn, de);
    if (["personal-introduction", "question-answer"].includes(task.skill)) prompt.append(make("small", "speaking-safety", "You may use real or fictional information. Never share private contact or identity details."));
    const speechControls = make("div", "speaking-speech-controls"); const speechText = task.skill === "repeat-pronounce" ? task.modelSpeech : task.promptDe;
    const hear = make("button", "speaking-secondary", task.skill === "repeat-pronounce" ? "🔊 Hear Model" : "🔊 Hear Prompt"); hear.type = "button"; hear.disabled = recording; hear.addEventListener("click", () => playGerman(speechText));
    const slow = make("button", "speaking-secondary", "🐢 Slow"); slow.type = "button"; slow.disabled = recording; slow.addEventListener("click", () => playGerman(speechText, true));
    const speechStatus = make("span", "speaking-speech-status", "German model ready"); speechStatus.setAttribute("aria-live", "polite"); speechControls.append(hear, slow, speechStatus);
    const support = make("section", "speaking-support"); support.append(make("h3", "", "Speaking Support")); const chips = make("div", "speaking-support-chips"); task.support.slice(0, helpShown ? task.support.length : 2).forEach(text => { const chip = make("span", "", text); chip.lang = "de"; chips.append(chip); }); support.append(chips);
    if (task.support.length > 2 && !helpShown) { const more = make("button", "speaking-link-button", "More Help"); more.type = "button"; more.addEventListener("click", () => { helpShown = true; renderTask(); }); support.append(more); }
    if (task.skill === "repeat-pronounce") { const model = make("p", "speaking-repeat-model", task.modelAnswer); model.lang = "de"; support.append(model); }
    const recordBox = make("section", `speaking-record${recording ? " is-recording" : ""}`); recordBox.append(make("h3", "", recording ? "Recording…" : recordingUrl ? "Your Recording" : "Speak Now"));
    const timer = make("p", "speaking-timer", recording ? `${seconds}s / ${Math.min(60, task.targetSeconds + 15)}s` : `Target: about ${task.targetSeconds} seconds`); timer.setAttribute("aria-label", recording ? `Recording time ${seconds} seconds` : `Target speaking time approximately ${task.targetSeconds} seconds`); recordBox.append(timer);
    const controls = make("div", "speaking-record-controls");
    if (recording) { const stop = make("button", "speaking-stop", "■ Stop Recording"); stop.type = "button"; stop.addEventListener("click", stopRecording); controls.append(stop); }
    else {
      const start = make("button", "speaking-record-button", recordingUrl ? "🎙️ Record Again" : "🎙️ Start Recording"); start.type = "button"; start.addEventListener("click", startRecording); controls.append(start);
      if (recordingUrl) { const audio = document.createElement("audio"); audio.controls = true; audio.src = recordingUrl; audio.preload = "metadata"; audio.setAttribute("aria-label", "Play my speaking recording"); controls.append(audio); const del = make("button", "speaking-secondary", "Delete Recording"); del.type = "button"; del.addEventListener("click", () => { discardRecording(); announce("Recording deleted."); renderTask(); }); controls.append(del); }
      const without = make("button", "speaking-secondary", "I Practised Aloud Without Recording"); without.type = "button"; without.disabled = attemptMade; without.addEventListener("click", practiceWithoutRecording); controls.append(without);
    }
    recordBox.append(controls);
    form.append(header, live, prompt, speechControls, support, recordBox);
    if (attemptMade) renderReview(task, form);
    updateHeader(index, session.length);
  }
  function renderReview(task, form) {
    const review = make("section", "speaking-review");
    const reveal = make("button", "speaking-secondary", exampleShown ? "Example Answer Shown" : "Show Example Answer"); reveal.type = "button"; reveal.disabled = exampleShown; reveal.addEventListener("click", () => { exampleShown = true; renderTask(); }); review.append(reveal);
    if (exampleShown || task.skill === "repeat-pronounce") { const example = make("div", "speaking-example"); example.append(make("h3", "", "Example Answer")); const text = make("p", "", task.modelAnswer); text.lang = "de"; example.append(text, make("small", "", "This is one possible model, not the only valid answer.")); review.append(example); }
    const check = make("fieldset", "speaking-self-check"); check.append(make("legend", "", "Self Check")); task.selfCheck.forEach((text, i) => { const label = document.createElement("label"), input = document.createElement("input"); input.type = "checkbox"; input.name = `self-check-${i}`; label.append(input, make("span", "", text)); check.append(label); }); review.append(check);
    const confidence = make("fieldset", "speaking-confidence"); confidence.append(make("legend", "", "How did that feel?")); [["again", "Again"], ["okay", "Okay"], ["confident", "Confident"]].forEach(([value, label]) => { const button = make("button", rating === value ? "is-selected" : "", label); button.type = "button"; button.disabled = completed; button.setAttribute("aria-label", `Rate this speaking task: ${label}`); button.addEventListener("click", () => saveRating(value)); confidence.append(button); }); review.append(confidence);
    if (completed) { const next = make("button", "challenge-primary speaking-next", index === session.length - 1 ? "View Session Summary" : "Next Speaking Task →"); next.type = "button"; next.addEventListener("click", () => { cleanupTask(); if (index === session.length - 1) showResults(); else { index++; resetTaskState(); renderTask(); } }); review.append(next); }
    const link = make("a", "challenge-topic-link", "Review related Learning Library topic →"); link.href = `../library-topic/?level=A1&topic=${encodeURIComponent(task.relatedTopic)}`; review.append(link); form.append(review);
  }
  function weakSkills() { return Object.entries(progress.skillStats).filter(([, stat]) => stat.attempted >= 4 && stat.again / stat.attempted >= .35).sort((a,b) => b[1].again / b[1].attempted - a[1].again / a[1].attempted).slice(0,2).map(([skill]) => skill); }
  function showResults() {
    cleanupTask(); if (mode === "balanced") { progress.sessionsCompleted = (progress.sessionsCompleted || 0) + 1; progress.lastSessionIds = session.map(task => task.id); persist(); }
    $("practiceForm").hidden = true; const result = $("practiceResult"); result.hidden = false;
    const count = value => results.filter(row => row.rating === value).length, recordedSeconds = results.reduce((total, row) => total + row.durationSeconds, 0); result.replaceChildren(make("span", "", mode === "weak" ? "Focused Speaking Complete" : "Speaking Practice Complete"), make("strong", "", `${results.length} tasks`), make("p", "speaking-result-label", `Again ${count("again")} · Okay ${count("okay")} · Confident ${count("confident")}`), make("p", "", recordedSeconds ? `${recordedSeconds} seconds of recorded speaking this session` : "Completed through aloud practice and self-review"));
    const grid = make("div", "speaking-breakdown"); Object.keys(A1_SPEAKING_SKILLS).forEach(skill => { const rows = results.filter(row => row.task.skill === skill); if (!rows.length) return; const card = make("div", rows.some(row => row.rating === "again") ? "needs-review" : "is-strong"); card.append(make("strong", "", A1_SPEAKING_SKILLS[skill].title), make("span", "", `${rows.filter(row => row.rating === "confident").length} confident · ${rows.filter(row => row.rating === "again").length} again`)); grid.append(card); });
    const actions = make("div", "speaking-result-actions"), weak = weakSkills(); const focus = make("button", "", "Practice Weak Areas"); focus.type = "button"; focus.disabled = !weak.length; focus.addEventListener("click", () => startSession(weak)); const again = make("button", "", "Practice Again"); again.type = "button"; again.addEventListener("click", () => startSession()); const back = make("a", "challenge-back-link", "Back to Practice Center"); back.href = "../a1/#exercises"; actions.append(focus, again, back); result.append(grid, actions); result.scrollIntoView({behavior:"smooth", block:"start"}); updateHeader(session.length, session.length);
  }
  addEventListener("pagehide", cleanupTask, {once:true}); addEventListener("beforeunload", cleanupTask, {once:true}); renderStart();
}
