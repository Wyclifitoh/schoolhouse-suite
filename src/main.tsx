import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// A stale deploy can leave the browser holding hashed chunk URLs that no longer
// exist. Those dynamic-import failures used to surface as a blank white page.
// Reload once (guarded by sessionStorage) to pick up the fresh manifest.
const RELOAD_FLAG = "chuo-chunk-reload";
const isChunkError = (msg: string) =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    msg,
  );

const recoverFromChunkError = (message: string) => {
  if (!isChunkError(message)) return;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    return;
  }
  window.location.reload();
};

window.addEventListener("error", (e) =>
  recoverFromChunkError(String(e?.message || "")),
);
window.addEventListener("unhandledrejection", (e) =>
  recoverFromChunkError(
    String((e as PromiseRejectionEvent)?.reason?.message || ""),
  ),
);
window.addEventListener("load", () => {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* storage unavailable */
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
