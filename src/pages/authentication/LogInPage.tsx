import { useState } from "react";
import { TextInput } from "../../components/TextInput";
import { theme } from "../../theme/theme";

type LogInPageProps = {
  onSubmit: () => void;
  onSwitchToSignUp: () => void;
};

export function LogInPage({ onSubmit, onSwitchToSignUp }: LogInPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "40px",
      }}
    >
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: "150px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0 }}>Authentication</h1>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "40px" }}>
        <TextInput value={username} onChange={setUsername} label="Email" />
        <TextInput value={password} onChange={setPassword} label="Password" type="password" />
      </div>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          onClick={onSubmit}
          style={{
            padding: "10px 20px",
            width: "100%",
            borderRadius: 14,
            border: "none",
            background: "#47C7AA",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: theme.shadow.sm,
            height: 40,
            margin: 0,
          }}
        >
          Log In
        </button>
        <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <span onClick={onSwitchToSignUp} style={{ color: "#47C7AA", cursor: "pointer" }}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
