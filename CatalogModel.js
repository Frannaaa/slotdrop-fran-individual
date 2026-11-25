// Model: configuration and HTTP only. No React, DOM or stock rules.
const COLUMNS = "id,sku,name,category,price,stock,image_url";

async function readRows(parameters, signal) {
  let config;
  try {
    config = await import("./config.js");
  } catch {
    throw new Error("The catalog is not configured yet. Create config.js using config.example.js, then reload this page.");
  }
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = config;
  if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR-PROJECT") ||
      !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.endsWith("...")) {
    throw new Error("The catalog is not configured yet. Add your project URL and publishable key to config.js, then reload this page.");
  }
  const url = new URL("rest/v1/products", SUPABASE_URL.replace(/\/?$/, "/"));
  url.search = parameters.toString();
  const timeout = AbortSignal.timeout(15000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: "application/json" },
    signal: requestSignal,
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Could not load workshops (${response.status}). Please try again.`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("The catalog returned an unreadable response. Please try again.");
  return rows;
}

export function listProducts({ query = "", category = "", stockFilter = "", limit, order = "name.asc,id.asc", signal } = {}) {
  const parameters = new URLSearchParams({ select: COLUMNS, order });
  if (query.trim()) {
    // Escape SQL pattern characters; URLSearchParams encodes query separators.
    const literal = query.trim().replace(/[\\%_*]/g, "\\$&");
    parameters.set("name", `ilike.*${literal}*`);
  }
  if (category) parameters.set("category", `eq.${category}`);
  if (stockFilter) parameters.set("stock", stockFilter);
  if (limit) parameters.set("limit", String(limit));
  return readRows(parameters, signal);
}

export function getProduct(id, { signal } = {}) {
  const parameters = new URLSearchParams({ select: COLUMNS, id: `eq.${id}`, limit: "1" });
  return readRows(parameters, signal);
}
