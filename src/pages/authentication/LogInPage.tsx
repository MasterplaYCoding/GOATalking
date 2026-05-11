import { useState } from "react";
import { TextInput } from "../../components/TextInput";
import { useResponsive } from "../../hooks/useResponsive";
import { trackUserActivity } from "../../services/browserMonitoringService";
import { hasValidationErrors, validateLogInInput } from "../../services/validationService";
import { theme } from "../../theme/theme";
import { useGlobalStore } from "../../store/useGlobalStore";
import { API_BASE_URL } from "../../config";

type LogInPageProps = {
  onSubmit: () => void;
  onSwitchToSignUp: () => void;
};

export function LogInPage({ onSubmit, onSwitchToSignUp }: LogInPageProps) {
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState(""); 

  const setCurrentUserId = useGlobalStore((state) => state.setCurrentUserId);

  const handleSubmit = async () => {
    const nextErrors = validateLogInInput({ email, password });
    setErrors(nextErrors);
    setServerError(""); 

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const userData = await response.json();

      setCurrentUserId(userData.id);
      trackUserActivity("auth", "log-in-submit");
      onSubmit();
    } catch {
      setServerError("Login failed. Please check your email and password.");
    }
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
        gap: isMobile ? "24px" : "40px",
      }}
    >
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: isMobile ? "120px" : "150px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : undefined }}>Authentication</h1>
      
      {serverError && (
        <div style={{ width: "100%", maxWidth: "400px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", textAlign: "center", fontSize: "0.95rem", fontWeight: "bold", border: "1px solid rgba(239, 68, 68, 0.5)" }}>
          {serverError}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: isMobile ? "24px" : "40px" }}>
        <TextInput value={email} onChange={setEmail} label="Email" error={errors.email} />
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
            boxShadow: theme.shadow?.sm || "0 1px 2px rgba(0,0,0,0.1)",
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
