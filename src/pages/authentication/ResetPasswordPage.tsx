import { useState, useEffect } from "react";
import { TextInput } from "../../components/TextInput";
import { useResponsive } from "../../hooks/useResponsive";
import { theme } from "../../theme/theme";
import { API_BASE_URL } from "../../config";

export function ResetPasswordPage() {
  const { isMobile } = useResponsive();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) setToken(tokenParam);
  }, []);

  const handleSubmit = async () => {
    if (!newPassword || !token) return;
    setStatus("idle");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) throw new Error("Reset failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ color: "white" }}>Invalid or missing reset token.</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: isMobile ? "24px" : "40px" }}>
      <img src="/logo.png" alt="GOATalking Logo" style={{ width: isMobile ? "120px" : "150px", margin: "20px 0" }} />
      <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : undefined }}>Create New Password</h1>

      {status === "error" && (
        <div style={{ width: "100%", maxWidth: "400px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", textAlign: "center", fontWeight: "bold" }}>
          Link expired or invalid. Please request a new one.
        </div>
      )}

      {status === "success" ? (
        <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <p style={{ color: "#47C7AA", fontSize: "1.1rem", fontWeight: "bold" }}>Password successfully reset!</p>
          <a href="/login" style={{ textDecoration: "none" }}>
            <button style={{ marginTop: "20px", padding: "10px 20px", width: "100%", borderRadius: 14, border: "none", background: "#47C7AA", color: "white", fontSize: 16, cursor: "pointer" }}>
              Go to Login
            </button>
          </a>
        </div>
      ) : (
        <>
          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: isMobile ? "24px" : "40px" }}>
            <TextInput value={newPassword} onChange={setNewPassword} label="New Password" type="password" />
          </div>

          <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleSubmit} style={{ padding: "10px 20px", width: "100%", borderRadius: 14, border: "none", background: "#47C7AA", color: "white", fontSize: 16, cursor: "pointer", boxShadow: theme.shadow?.sm, height: 40 }}>
              Update Password
            </button>
          </div>
        </>
      )}
    </div>
  );
}