export const SITE_CONFIG = {
  name: "Rafi's Wörterbuch",
  courseBrand: "Rafis Sprachwelt",
  currentOrigin: "https://nay102.github.io",
  basePath: "/rafis-woerterbuch/",
  customDomain: "",
  analyticsEndpoint: ""
};

export function siteRoot() {
  const configured = SITE_CONFIG.customDomain.trim();
  if (configured) return `https://${configured.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/`;
  return `${SITE_CONFIG.currentOrigin}${SITE_CONFIG.basePath}`;
}
