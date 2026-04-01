import { useState } from "react";
import { TextInput } from "../../components/TextInput";
import { trackUserActivity } from "../../services/browserMonitoringService";
import { hasValidationErrors, validateSignUpInput } from "../../services/validationService";
import { theme } from "../../theme/theme";

type SignUpPageProps = {
  onSubmit: () => void;
  onSwitchToLogIn: () => void;
};

export function SignUpPage({ onSubmit, onSwitchToLogIn }: SignUpPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mail, setMail] = useState("");
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const handleSubmit = () => {
    const nextErrors = validateSignUpInput({
      username,
      email: mail,
      password,
    });
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    trackUserActivity("auth", "sign-up-submit");
    onSubmit();
  };

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
      <h1 style={{ color: "white", margin: 0 }}>Register Now</h1>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <TextInput value={username} onChange={setUsername} label="Username" error={errors.username} />
        <TextInput value={mail} onChange={setMail} label="Email" error={errors.email} />
        <TextInput value={password} onChange={setPassword} label="Password" type="password" error={errors.password} />
      </div>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          onClick={handleSubmit}
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
          Sign Up
        </button>
        <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center" }}>
          Already have an account?{" "}
          <span onClick={onSwitchToLogIn} style={{ color: "#47C7AA", cursor: "pointer" }}>
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}
