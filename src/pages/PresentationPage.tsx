import { theme } from "../theme/theme";

type PresentationPageProps = {
  onLogIn: () => void;
  onSignUp: () => void;
};

export function PresentationPage({ onLogIn, onSignUp }: PresentationPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "30px",
      }}
    >
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: "200px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0 }}>GOATalking</h1>
      <p style={{ width: "100%", maxWidth: "720px", fontSize: 20, textAlign: "center", color: "white", margin: 0 }}>
        Everything is rankable.
      </p>
      <p style={{ width: "100%", maxWidth: "720px", fontSize: 20, textAlign: "center", color: "white", margin: 0 }}>
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
