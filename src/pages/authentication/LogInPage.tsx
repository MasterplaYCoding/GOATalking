import { useState } from "react";
import { TextInput } from "../../components/TextInput";
import { useResponsive } from "../../hooks/useResponsive";
import { trackUserActivity } from "../../services/browserMonitoringService";
import { theme } from "../../theme/theme";
import { useGlobalStore } from "../../store/useGlobalStore";
import { API_BASE_URL } from "../../config";

type LogInPageProps = {
  onSubmit: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword?: () => void;
};

export function LogInPage({ onSubmit, onSwitchToSignUp, onSwitchToForgotPassword }: LogInPageProps) {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [serverError, setServerError] = useState("");

  const setCurrentUserId = useGlobalStore((state) => state.setCurrentUserId);
  const setToken = useGlobalStore((state) => state.setToken);
  const setUsers = useGlobalStore((state) => state.setUsers);
  const users = useGlobalStore((state) => state.users);

  const handleStepOneSubmit = async () => {
    setServerError("");
    if (!email || !password) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data = await response.json();

      if (data.requires2FA) {
        setPendingUserId(data.userId);
        setStep(2);
      }
    } catch {
      setServerError("Login failed. Please check your email and password.");
    }
  };

  const handleStepTwoSubmit = async () => {
    setServerError("");
    if (!twoFactorCode) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, code: twoFactorCode }),
      });

      if (!response.ok) throw new Error("Invalid or expired code");

      const { user, token } = await response.json();

      setCurrentUserId(user.id);
      setToken(token);
      setUsers([...users.filter((u) => u.id !== user.id), user]);
      
      trackUserActivity("auth", "log-in-2fa-submit");
      onSubmit();
    } catch {
      setServerError("Invalid or expired security code.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: isMobile ? "24px" : "40px" }}>
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: isMobile ? "120px" : "150px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : undefined }}>Authentication</h1>
      
      {serverError && (
        <div style={{ width: "100%", maxWidth: "400px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", textAlign: "center", fontSize: "0.95rem", fontWeight: "bold", border: "1px solid rgba(239, 68, 68, 0.5)" }}>
          {serverError}
        </div>
      )}

      {step === 1 ? (
        <>
          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: isMobile ? "24px" : "40px" }}>
            <TextInput value={email} onChange={setEmail} label="Email" />
            <TextInput value={password} onChange={setPassword} label="Password" type="password" />
          </div>

          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleStepOneSubmit} style={{ padding: "10px 20px", width: "100%", borderRadius: 14, border: "none", background: "#47C7AA", color: "white", fontSize: 16, cursor: "pointer", boxShadow: theme.shadow?.sm, height: 40 }}>
              Continue
            </button>
            <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center" }}>
              Don&apos;t have an account? <span onClick={onSwitchToSignUp} style={{ color: "#47C7AA", cursor: "pointer" }}>Sign Up</span>
            </p>
            {onSwitchToForgotPassword && (
              <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center", marginTop: 8 }}>
                Forgot your password? <span onClick={onSwitchToForgotPassword} style={{ color: "#47C7AA", cursor: "pointer" }}>Reset it here</span>
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: isMobile ? "24px" : "40px" }}>
            <p style={{ color: "white", textAlign: "center", margin: 0 }}>We sent a 6-digit code to your email.</p>
            <TextInput value={twoFactorCode} onChange={setTwoFactorCode} label="6-Digit Security Code" />
          </div>

          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleStepTwoSubmit} style={{ padding: "10px 20px", width: "100%", borderRadius: 14, border: "none", background: "#47C7AA", color: "white", fontSize: 16, cursor: "pointer", boxShadow: theme.shadow?.sm, height: 40 }}>
              Verify & Log In
            </button>
            <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center", cursor: "pointer" }} onClick={() => setStep(1)}>
              Back to Login
            </p>
          </div>
        </>
      )}
    </div>
  );
}