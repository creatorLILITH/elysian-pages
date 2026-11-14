// Same-origin API base: the Next app serves both the pages and the API,
// so client code uses relative `/api/...` URLs.
export const API_BASE = "";

export const api = (path: string) => `${API_BASE}${path}`;
