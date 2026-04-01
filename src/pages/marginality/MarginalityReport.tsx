import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { MarginalityTest, MarginalityTestResponse } from "../../domain/MarginalityTest";
import { createMarginalityResponse, getDistanceFromOtherGroups } from "../../services/marginalityTestService";
import { theme } from "../../theme/theme";
import type { MarginalityDraftState } from "./flowTypes";

type MarginalityReportProps = {
  tests: MarginalityTest[];
  responses: MarginalityTestResponse[];
  currentUserId: string;
  onSubmitResponse: (response: MarginalityTestResponse) => void;
};

export function MarginalityReport({ tests, responses, currentUserId, onSubmitResponse }: MarginalityReportProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);
  const draftState = location.state as MarginalityDraftState | undefined;

  const draftResponse = useMemo(() => {
    if (!test || !draftState) {
      return null;
    }

    return createMarginalityResponse(
      test.id,
      currentUserId,
      draftState.profile,
      Object.entries(draftState.answers).map(([questionId, agreement]) => ({
        questionId,
        agreement,
      }))
    );
  }, [currentUserId, draftState, test]);

  useEffect(() => {
    if (!draftResponse) {
      return;
    }

    const alreadySaved = responses.some(
      (response) => response.testId === draftResponse.testId && response.userId === draftResponse.userId
    );

    if (!alreadySaved) {
      onSubmitResponse(draftResponse);
    }
  }, [draftResponse, onSubmitResponse, responses]);

  if (!test || !draftState || !draftResponse) {
    return <CenteredMessage message="Marginality report unavailable. Please retake the test." />;
  }

  const ageReport = getDistanceFromOtherGroups(draftResponse, responses, "ageGroup");
  const countryReport = getDistanceFromOtherGroups(draftResponse, responses, "country");
  const watchingReport = getDistanceFromOtherGroups(draftResponse, responses, "footballWatchingLevel");

  const overallMarginality = (
    (ageReport.overallAverageDistance + countryReport.overallAverageDistance + watchingReport.overallAverageDistance) / 3
  ).toFixed(1);

  const breakdown = [
    { label: `Other ${draftState.profile.ageGroup}`, value: ageReport.overallAverageDistance },
    { label: `People in ${draftState.profile.country}`, value: countryReport.overallAverageDistance },
    { label: `${draftState.profile.footballWatchingLevel} watchers`, value: watchingReport.overallAverageDistance },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
      <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "40px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", maxWidth: "680px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ color: "white", marginTop: 0, fontSize: "2rem", marginBottom: "8px" }}>Your Marginality Report</h2>
          <p style={{ color: "#C4DBD5", margin: 0, fontSize: "1rem" }}>{test.title}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `conic-gradient(${theme.colors?.secondary || "#47C7AA"} ${overallMarginality}%, rgba(255,255,255,0.1) ${overallMarginality}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "156px",
                height: "156px",
                borderRadius: "50%",
                backgroundColor: "#162b29",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: "2.8rem", fontWeight: 800 }}>{overallMarginality}%</span>
              <span style={{ color: theme.colors?.secondary || "#47C7AA", fontSize: "0.85rem", fontWeight: "bold" }}>Marginal</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "32px" }}>
          {breakdown.map((item) => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "white", marginBottom: "8px" }}>
                <span>{item.label}</span>
                <span style={{ color: theme.colors?.secondary || "#47C7AA", fontWeight: 700 }}>{item.value.toFixed(1)}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, item.value)}%`,
                    height: "100%",
                    backgroundColor: theme.colors?.secondary || "#47C7AA",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/marginality-test")}
          style={{
            width: "100%",
            background: `linear-gradient(to right, ${theme.colors?.secondary || "#47C7AA"}, ${theme.colors?.primary || "#315B58"})`,
            color: "white",
            border: "none",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Return to Tests
        </button>
      </div>
    </div>
  );
}

function CenteredMessage({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ color: "white", margin: 0 }}>{message}</h1>
    </div>
  );
}
