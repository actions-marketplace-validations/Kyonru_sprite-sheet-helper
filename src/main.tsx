if (__CLI_BUILD__) await import("./lib/cli-bridge");
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TanStackDevtools } from "@tanstack/react-devtools";
import "react-complex-tree/lib/style-modern.css";
import "./index.css";
import App from "./App.tsx";
import StoreInspectorPanel from "../devtools/store";
import PubSubDevtoolPanel from "../devtools/pubsub-panel";
import { CrashRecoveryManager } from "./components/crash-recovery";
import { installReloadStatusDebug } from "./utils/reload-status-debug";

installReloadStatusDebug();

// --- design lab: the explored variants, kept for reference against the
// --- implementation. Dev-only, and stripped from every production build.
if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("design_lab") === "true"
) {
  const { default: DesignLabPage } = await import("./__design_lab/page");
  createRoot(document.getElementById("root")!).render(<DesignLabPage />);
} else {

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Headless CLI runs must stay isolated and deterministic — never
        restore a previous session's project state. */}
    {__CLI_BUILD__ ? (
      <App />
    ) : (
      <CrashRecoveryManager>
        <App />
      </CrashRecoveryManager>
    )}

    {import.meta.env.DEV && (
      <TanStackDevtools
        config={{
          urlFlag: "devtools",
          requireUrlFlag: true,
        }}
        plugins={[
          {
            id: "zustand-inspector",
            name: "Zustand Inspector",
            render: <StoreInspectorPanel />,
          },
          {
            id: "pub-sub",
            name: "PubSub",
            render: <PubSubDevtoolPanel />,
          },
        ]}
      />
    )}
  </StrictMode>,
);
}
