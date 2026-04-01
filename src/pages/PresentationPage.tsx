import { theme } from "../theme/theme";
import { useResponsive } from "../hooks/useResponsive";

type PresentationPageProps = {
  onLogIn: () => void;
  onSignUp: () => void;
};

export function PresentationPage({ onLogIn, onSignUp }: PresentationPageProps) {
  const { isMobile } = useResponsive();
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "28px 16px" : "48px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? "22px" : "30px",
      }}
    >
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: isMobile ? "150px" : "200px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : undefined }}>GOATalking</h1>
      <p style={{ width: "100%", maxWidth: "720px", fontSize: isMobile ? 16 : 20, textAlign: "center", color: "white", margin: 0 }}>
        Everything is rankable.
      </p>
      <p style={{ width: "100%", maxWidth: "720px", fontSize: isMobile ? 16 : 20, textAlign: "center", color: "white", margin: 0, lineHeight: 1.45 }}>
        GOATalking is a discussion forum centered around ranking and debating the best of anything, from serious topics
        like the greatest football player of all time to random ones like the best day of the week.
      </p>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
        <button
          onClick={onSignUp}
          style={{
            height: 44,
            borderRadius: 14,
            border: "none",
            background: "#47C7AA",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: theme.shadow.sm,
          }}
        >
          Create Account
        </button>
        <button
          onClick={onLogIn}
          style={{
            height: 44,
            borderRadius: 14,
            border: "2px solid white",
            background: "transparent",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
