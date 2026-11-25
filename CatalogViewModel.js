import { listProducts } from "./CatalogModel.js";

// This is the ONLY derived product field. It is not stored in PostgreSQL.
export function availabilityLabel(stock) {
  if (stock === 0) return "Sold out";
  if (stock === 1) return "Only 1 seat left";
  if (stock <= 3) return `Only ${stock} seats left`;
  return "Seats available";
}

export function useCatalogViewModel({ featured = false } = {}) {
  const { useState, useEffect } = React;
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: "loading", products: [], error: "" });

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: "loading", products: [], error: "" });
    const featuredOptions = featured ? { stockFilter: "gt.0", limit: 3, order: "id.asc" } : {};
    listProducts({ query, category, ...featuredOptions, signal: controller.signal })
      .then(rows => {
        if (controller.signal.aborted) return;
        const products = rows.map(row => ({ ...row, availability: availabilityLabel(row.stock) }));
        setResult({ status: products.length ? "ready" : "empty", products, error: "" });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        const message = error.name === "TimeoutError"
          ? "The catalog took too long to respond. Please try again."
          : error instanceof TypeError
            ? "We could not reach the catalog. Check your connection, then retry."
            : error.message;
        setResult({ status: "error", products: [], error: message });
      });
    return () => controller.abort();
  }, [query, category, featured, attempt]);

  function submitSearch(event) {
    event.preventDefault();
    setQuery(search.trim());
    // Searching the same phrase deliberately runs a fresh request too.
    setAttempt(value => value + 1);
  }

  function clearFilters() {
    setSearch("");
    setQuery("");
    setCategory("");
    setAttempt(value => value + 1);
  }

  return {
    ...result, search, query, category,
    setSearch, setCategory, submitSearch, clearFilters,
    retry: () => setAttempt(value => value + 1)
  };
}
