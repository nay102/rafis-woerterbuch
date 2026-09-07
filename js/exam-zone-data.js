export const EXAM_PROVIDERS = [
  { id: "goethe", name: "Goethe", description: "Goethe exam preparation" },
  { id: "telc", name: "telc", description: "telc exam preparation" }
];

export const EXAM_LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export const EXAM_CATEGORIES = [
  { id: "exam-papers", title: "Model & practice papers", description: "Complete practice sets and sample examination papers.", icon: "file-lines" },
  { id: "preparation-books", title: "Preparation books", description: "Study guides and books for a structured preparation plan.", icon: "book-open" },
  { id: "reading", title: "Lesen · Reading", description: "Reading passages, question sets and comprehension tasks.", icon: "glasses" },
  { id: "listening", title: "Hören · Listening", description: "Listening worksheets, transcripts and companion audio.", icon: "headphones" },
  { id: "writing", title: "Schreiben · Writing", description: "Writing prompts, model responses and useful expressions.", icon: "pen-nib" },
  { id: "speaking", title: "Sprechen · Speaking", description: "Speaking topics, presentation prompts and partner tasks.", icon: "comments" },
  { id: "grammar-vocabulary", title: "Grammar & vocabulary", description: "Focused revision sheets and exam vocabulary collections.", icon: "spell-check" },
  { id: "answer-keys", title: "Answer keys & guidance", description: "Solutions, explanations and assessment guidance.", icon: "list-check" }
];

// Add real entries after uploading files to protected Firebase Storage.
// See docs/exam-zone-materials.md. Never put public download URLs here.
export const EXAM_MATERIALS = [];

export function isValidMaterial(item) {
  return Boolean(item && typeof item.id === "string" && /^[a-z0-9-]+$/.test(item.id)
    && typeof item.title === "string" && item.title.trim()
    && EXAM_PROVIDERS.some(provider => provider.id === item.provider)
    && EXAM_LEVELS.includes(item.level)
    && EXAM_CATEGORIES.some(category => category.id === item.category)
    && typeof item.storagePath === "string"
    && /^exam-zone\/[a-zA-Z0-9/_ .()-]+\.(pdf|mp3|m4a|wav)$/i.test(item.storagePath)
    && !item.storagePath.split("/").includes(".."));
}

export function filterMaterials(materials, { provider, level, category = "all", query = "" }) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return materials.filter(item => isValidMaterial(item)
    && item.provider === provider && item.level === level
    && (category === "all" || item.category === category)
    && terms.every(term => `${item.title} ${item.description || ""} ${item.edition || ""}`.toLocaleLowerCase().includes(term)));
}
