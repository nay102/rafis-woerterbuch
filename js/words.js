let allWords = [];

export function getAllWords() {
  return allWords;
}

export async function loadWords() {
  const [wordsResponse, irregularResponse] = await Promise.all([
    fetch("./js/words.json"),
    fetch("./js/irregular_verbs.json")
  ]);
  const data = await wordsResponse.json();
  let irregularVerbs = [];
  try {
    if (irregularResponse.ok) {
      irregularVerbs = await irregularResponse.json();
    }
  } catch (error) {
    irregularVerbs = [];
  }

  // Ignore meta/helper rows used for internal guidance in words.json.
  allWords = (Array.isArray(data) ? data : []).filter(w => {
    if (!w || typeof w !== "object") return false;
    if (w._meta === true) return false;
    if (typeof w.id === "string" && w.id.startsWith("__")) return false;
    return typeof w.word === "string" && w.word.trim() !== "";
  });

  const { attachConjugations } = await import("./conjugation.js");
  attachConjugations(allWords, irregularVerbs);

  console.log("Words loaded from words.json", allWords);
}

