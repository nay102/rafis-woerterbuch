let allWords = [];

export function getAllWords() {
  return allWords;
}

export async function loadWords() {

  const response = await fetch("./js/words.json");
  const data = await response.json();

  // Ignore meta/helper rows used for internal guidance in words.json.
  allWords = (Array.isArray(data) ? data : []).filter(w => {
    if (!w || typeof w !== "object") return false;
    if (w._meta === true) return false;
    if (typeof w.id === "string" && w.id.startsWith("__")) return false;
    return typeof w.word === "string" && w.word.trim() !== "";
  });

  console.log("Words loaded from words.json", allWords);
}

