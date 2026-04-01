import { useNavigate } from "react-router-dom";
import type { MarginalityTest, MarginalityTestResponse } from "../domain/MarginalityTest";
import { useResponsive } from "../hooks/useResponsive";

type MarginalityTestPageProps = {
  tests: MarginalityTest[];
  responses: MarginalityTestResponse[];
};

export function MarginalityTestPage({ tests, responses }: MarginalityTestPageProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: isMobile ? "20px 16px 96px" : "40px 32px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: isMobile ? "28px" : "48px", maxWidth: "700px" }}>
        <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : "2.5rem", lineHeight: 1.1 }}>Marginality Tests</h1>
        <p style={{ color: "white", margin: "12px 0 0 0", fontSize: isMobile ? "0.98rem" : "1.05rem", lineHeight: 1.5 }}>
          Pick a test and see how your answers compare with different demographic groups.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: isMobile ? "16px" : "24px",
          width: "100%",
          maxWidth: "1100px",
        }}
      >
        {tests.map((test) => {
          const responseCount = responses.filter((response) => response.testId === test.id).length;

          return (
            <button
              key={test.id}
              onClick={() => navigate(`/marginality-test/${test.id}/take`)}
              style={{
                backgroundColor: "#F0DDB3",
                borderRadius: "20px",
                padding: isMobile ? "18px" : "24px",
                border: "1px solid black",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                textAlign: "left",
                color: "inherit",
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "black", fontWeight: 700, fontSize: isMobile ? "0.92rem" : "1rem" }}>{test.topic}</span>
                <span style={{ color: "black", fontSize: "0.85rem" }}>{test.questions.length} questions</span>
              </div>

              <h2 style={{ color: "black", margin: 0, fontSize: isMobile ? "1.2rem" : "1.35rem", lineHeight: 1.25 }}>{test.title}</h2>
              <p style={{ color: "black", margin: 0, lineHeight: 1.45, fontSize: isMobile ? "0.94rem" : "1rem" }}>{test.description}</p>
              <p style={{ color: "black", margin: "8px 0 0", fontSize: "0.92rem" }}>{responseCount} saved responses</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
