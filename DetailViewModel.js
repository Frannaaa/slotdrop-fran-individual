import { getProduct } from "./CatalogModel.js";
import { availabilityLabel } from "./CatalogViewModel.js";

export function useDetailViewModel(id) {
  const { useState, useEffect } = React;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: "loading", product: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: "loading", product: null, error: "" });
    if (!/^[1-9]\d*$/.test(id || "")) {
      setResult({ status: "empty", product: null, error: "" });
      return () => controller.abort();
    }
    getProduct(id, { signal: controller.signal })
      .then(rows => {
        if (controller.signal.aborted) return;
        const product = rows.length
          ? { ...rows[0], availability: availabilityLabel(rows[0].stock) }
          : null;
        setResult({ status: product ? "ready" : "empty", product, error: "" });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        const message = error.name === "TimeoutError"
          ? "The workshop took too long to load. Please try again."
          : error instanceof TypeError
            ? "We could not reach the workshop. Check your connection, then retry."
            : error.message;
        setResult({ status: "error", product: null, error: message });
      });
    return () => controller.abort();
  }, [id, attempt]);

  return { ...result, id, retry: () => setAttempt(value => value + 1) };
}
