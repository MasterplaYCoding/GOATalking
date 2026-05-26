import { useState } from "react";
import { TextInput } from "../../components/TextInput";
import { useResponsive } from "../../hooks/useResponsive";
import { theme } from "../../theme/theme";
import { API_BASE_URL } from "../../config";

type ForgotPasswordPageProps = {
  onBackToLogin: () => void;
};

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const { isMobile } = useResponsive();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!email) return;
    setStatus("idle");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: isMobile ? "24px" : "40px" }}>
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: isMobile ? "120px" : "150px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : undefined }}>Reset Password</h1>

      {status === "error" && (
        <div style={{ width: "100%", maxWidth: "400px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", textAlign: "center", fontWeight: "bold" }}>
          Failed to send request. Try again.
        </div>
      )}

      {status === "success" ? (
        <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <p style={{ color: "#47C7AA", fontSize: "1.1rem", fontWeight: "bold" }}>Reset link sent!</p>
          <p style={{ color: "white" }}>Check your email inbox for further instructions.</p>
          <button onClick={onBackToLogin} style={{ marginTop: "20px", padding: "10px 20px", width: "100%", borderRadius: 14, border: "1px solid #47C7AA", background: "transparent", color: "#47C7AA", fontSize: 16, cursor: "pointer" }}>
            Return to Login
          </button>
        </div>
      ) : (
        <>
          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: isMobile ? "24px" : "40px" }}>
            <p style={{ color: "white", textAlign: "center", margin: 0 }}>Enter your email and we will send you a reset link.</p>
            <TextInput value={email} onChange={setEmail} label="Email Address" />
          </div>

          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleSubmit} style={{ padding: "10px 20px", width: "100%", borderRadius: 14, border: "none", background: "#47C7AA", color: "white", fontSize: 16, cursor: "pointer", boxShadow: theme.shadow?.sm, height: 40 }}>
              Send Reset Link
            </button>
            <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center", cursor: "pointer" }} onClick={onBackToLogin}>
              Back to Login
            </p>
          </div>
        </>
      )}
    </div>
  );
}