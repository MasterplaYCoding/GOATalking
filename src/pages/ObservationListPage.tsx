import { useEffect, useState } from "react";
import { useGlobalStore } from "../store/useGlobalStore";
import { API_BASE_URL } from "../config";
import { useResponsive } from "../hooks/useResponsive";

type ObservationRecord = {
  id: string;
  userId: string;
  reason: string;
  detectedAt: string;
  user: {
    username: string;
    email: string;
  };
};

export function ObservationListPage() {
  const { isMobile } = useResponsive();
  const currentUserId = useGlobalStore((state) => state.currentUserId);
  const token = useGlobalStore((state) => state.token); 
  
  const [records, setRecords] = useState<ObservationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  let isAdmin = false;
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      isAdmin = payload.role === "Admin";
    } catch (e) {
      console.error("Failed to parse token", e);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;

    const fetchObservations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/observations`, {
          headers: { 
            "x-user-id": currentUserId || "demo-user",
            "Authorization": `Bearer ${token}` 
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRecords(Array.isArray(data.data) ? data.data : data);
        }
      } catch (error) {
        console.error("Network Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();
  }, [isAdmin, currentUserId, token]);

  if (!isAdmin) {
    return (
      <div style={containerStyle}>
        <h1 style={{ color: "#ef4444", textAlign: "center", marginTop: "100px" }}>Access Denied</h1>
        <p style={{ color: "white", textAlign: "center" }}>You must be an Admin to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, padding: isMobile ? "20px 16px" : "40px 32px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <span style={{ fontSize: "2rem" }}>🚨</span>
          <div>
            <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "1.6rem" : "2.2rem" }}>
              Security Observation List
            </h1>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "white" }}>Loading security records...</p>
        ) : records.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "40px", borderRadius: "16px", textAlign: "center" }}>
            <p style={{ color: "#A7F3D0", fontSize: "1.1rem", margin: 0 }}>No suspicious activity detected yet.</p>
          </div>
        ) : (
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", overflowX: "auto", border: "1px solid rgba(255,255,255,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", color: "white" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.08)", textAlign: "left" }}>
                  <th style={thStyle}>Date & Time</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Flagged Reasons</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={tdStyle}>{new Date(record.detectedAt).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "bold" }}>{record.user?.username || "Unknown"}</div>
                      <div style={{ fontSize: "0.85rem", color: "#A7F3D0", opacity: 0.8 }}>{record.user?.email || "No Email"}</div>
                    </td>
                    <td style={tdStyle}>
                      {record.reason.split("|").map((reasonStr, index) => (
                        <div key={index} style={{ 
                          background: "rgba(239, 68, 68, 0.2)", color: "#FCA5A5", padding: "4px 8px", 
                          borderRadius: "4px", fontSize: "0.85rem", display: "inline-block", margin: "2px 4px 2px 0",
                          border: "1px solid rgba(239, 68, 68, 0.3)"
                        }}>
                          {reasonStr.trim()}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  background: "linear-gradient(to bottom right, #1F3D3A, #0D1A18)",
};
const thStyle: React.CSSProperties = { padding: "16px", fontSize: "0.95rem", fontWeight: 600, color: "#A7F3D0" };
const tdStyle: React.CSSProperties = { padding: "16px", verticalAlign: "top" };