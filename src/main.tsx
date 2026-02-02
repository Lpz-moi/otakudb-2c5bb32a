import { createRoot } from "react-dom/client";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element '#root' not found");
}

const root = createRoot(rootEl);

type BootstrapError = unknown;

function getErrorMessage(err: BootstrapError): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function resetServiceWorkerAndCaches() {
  // Unregister SW
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }

  // Clear Cache Storage
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
  }

  window.location.reload();
}

function BootstrapErrorScreen({ error }: { error: BootstrapError }) {
  const msg = getErrorMessage(error);
  const looksLikeSupabaseEnv = msg.toLowerCase().includes("supabaseurl is required");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-balance text-2xl font-semibold">
          Impossible de démarrer l’application
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {looksLikeSupabaseEnv
            ? "Le plus fréquent: un Service Worker / cache sert un bundle obsolète (variables d’environnement manquantes)."
            : "Une erreur de chargement a empêché l’application de s’initialiser."}
        </p>

        <div className="mt-6 rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Détail</p>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
            {msg}
          </pre>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => resetServiceWorkerAndCaches()}
          >
            Réinitialiser cache & recharger
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </div>
      </section>
    </main>
  );
}

(async () => {
  try {
    const mod = await import("./App.tsx");
    root.render(<mod.default />);
  } catch (err) {
    console.error("Bootstrap failed:", err);
    root.render(<BootstrapErrorScreen error={err} />);
  }
})();
