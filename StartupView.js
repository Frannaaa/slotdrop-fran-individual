// View startup recovery. Product data and application state stay in their existing layers.
(() => {
  const root = document.getElementById("root");
  if (!root) return;
  let failed = false;
  let finished = false;

  function mounted() {
    return root.querySelector(".site-header") !== null;
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    observer.disconnect();
    window.removeEventListener("error", onError, true);
  }

  function showFailure() {
    if (mounted()) { finish(); return; }
    if (failed || finished) return;
    failed = true;

    const panel = document.createElement("section");
    panel.className = "boot-message state-panel error-panel";
    panel.setAttribute("role", "alert");
    const title = document.createElement("h1");
    title.textContent = "SlotDrop couldn't start.";
    const message = document.createElement("p");
    message.textContent = "A page resource didn't load. Check your connection and reload the page.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "button";
    retry.textContent = "Reload page";
    retry.addEventListener("click", () => window.location.reload());
    panel.append(title, message, retry);
    root.replaceChildren(panel);
  }

  function onError(event) {
    if (event.target?.tagName === "SCRIPT" || event.error) showFailure();
  }

  const observer = new MutationObserver(() => {
    if (mounted()) finish();
  });
  observer.observe(root, { childList: true, subtree: true });
  const timeout = setTimeout(showFailure, 20000);
  window.addEventListener("error", onError, true);
})();
