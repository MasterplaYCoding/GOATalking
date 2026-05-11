import { GlobalChat } from "../components/GlobalChat";
import { useResponsive } from "../hooks/useResponsive";

export function GlobalChatPage() {
  const { isMobile } = useResponsive();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "20px 16px 24px" : "40px 32px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : "2.5rem" }}>Global Chat</h1>
        <p style={{ color: "rgba(255,255,255,0.82)", margin: "8px 0 0 0" }}>
          Talk with everyone connected to GOATalking in one shared room.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <GlobalChat />
      </div>
    </div>
  );
}
