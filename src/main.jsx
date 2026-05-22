import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import CosmicHaloVisual from "../engines/cosmic-halo/CosmicHalo";
import "./index.css";

const ENGINES = [
  { id: "cosmic-halo", label: "🌌 Cosmic Halo 3D" },
  { id: "dr-autoparts", label: "🔧 Dr. Auto Parts Brake Sim" },
  { id: "pix-gateway", label: "💸 Pix Gateway" },
  { id: "aurora-logger", label: "📋 Aurora Logger" },
];

function App() {
  const [active, setActive] = useState("cosmic-halo");

  return (
    <div style={{ fontFamily: "monospace", background: "#050508", minHeight: "100vh", color: "#f2f2f4" }}>
      {/* Nav */}
      <nav style={{ display: "flex", gap: "12px", padding: "16px 24px", borderBottom: "1px solid #1a1a26" }}>
        <span style={{ color: "#00f3ff", fontWeight: "bold", marginRight: "16px" }}>VINCENT VISUAL ENGINES</span>
        {ENGINES.map((e) => (
          <button
            key={e.id}
            onClick={() => setActive(e.id)}
            style={{
              background: active === e.id ? "#00f3ff22" : "transparent",
              border: `1px solid ${active === e.id ? "#00f3ff" : "#1a1a26"}`,
              color: active === e.id ? "#00f3ff" : "#a1a1aa",
              padding: "6px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
          >
            {e.label}
          </button>
        ))}
      </nav>

      {/* Engine Canvas */}
      <div style={{ height: "calc(100vh - 60px)", position: "relative" }}>
        {active === "cosmic-halo" && <CosmicHaloVisual />}
        {active === "dr-autoparts" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#a1a1aa", fontSize: "13px" }}>
            ➜ Importe ThreeEngineVisual de ../engines/dr-autoparts/ThreeEngineVisual.jsx
          </div>
        )}
        {active === "pix-gateway" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#a1a1aa", fontSize: "13px" }}>
            ➜ Importe PixVisual de ../engines/pix-gateway/PixVisual.jsx
          </div>
        )}
        {active === "aurora-logger" && (
          <div style={{ padding: "32px", fontSize: "12px", color: "#22c55e", fontFamily: "monospace" }}>
            <div style={{ color: "#4ade80", marginBottom: "8px" }}>$ tail -f aurora-engine.log</div>
            <div>[2026-05-22 08:29:00] [INFO]: Aurora Logger inicializado.</div>
            <div>[2026-05-22 08:29:01] [INFO]: Sistema operacional — 100% funcional.</div>
            <div style={{ color: "#22c55e", fontWeight: "bold" }}>[2026-05-22 08:29:02] [SUCCESS]: Log rotacional ativo.</div>
            <div style={{ color: "#00f3ff" }}>[2026-05-22 08:29:03] [DEBUG]: Cache hit ratio 98.4%.</div>
            <div style={{ color: "#f59e0b" }}>[2026-05-22 08:29:05] [WARN]: Rate limit threshold: 82%.</div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
