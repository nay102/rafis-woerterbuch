export function getBasePath() {
  const { hostname, pathname } = window.location;

  // GitHub Pages project site: /<repo>/
  if (hostname.endsWith("github.io")) {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}/` : "/";
  }

  // Local/custom host root
  return "/";
}

export function buildRouteUrl(params) {
  const base = getBasePath();
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function setSingleRouteParam(key, value) {
  const params = new URLSearchParams();
  params.set(key, value);
  history.pushState(null, "", buildRouteUrl(params));
}

export function setHomeRoute() {
  history.pushState(null, "", buildRouteUrl(new URLSearchParams()));
}
