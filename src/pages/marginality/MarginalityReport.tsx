import { useEffect, useMemo, useRef} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import youImage from "../../assets/you.png";
import {
  AGE_GROUP_DETAILS,
  type AgeGroupKey,
  type MarginalityTest,
  type MarginalityTestResponse,
} from "../../domain/MarginalityTest";
import { createMarginalityResponse, getDistanceFromOtherGroups } from "../../services/marginalityTestService";
import type { MarginalityDraftState } from "./flowTypes";

type MarginalityReportProps = {
  tests: MarginalityTest[];
  responses: MarginalityTestResponse[];
  currentUserId: string;
  onSubmitResponse: (response: MarginalityTestResponse) => void;
};

export function MarginalityReport({
  tests,
  responses,
  currentUserId,
  onSubmitResponse,
}: MarginalityReportProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);
  const draftState = location.state as MarginalityDraftState | undefined;

  const hasSubmitted = useRef(false);

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
    if (draftResponse && !hasSubmitted.current) {
      hasSubmitted.current = true;
      onSubmitResponse(draftResponse);
    }
  }, [draftResponse, onSubmitResponse]);

  if (!test || !draftState || !draftResponse) {
    return <CenteredMessage message="Marginality report unavailable. Please retake the test." />;
  }

  const ageReport = getDistanceFromOtherGroups(draftResponse, responses, "ageGroup");
  const countryReport = getDistanceFromOtherGroups(draftResponse, responses, "country");
  const watchingReport = getDistanceFromOtherGroups(draftResponse, responses, "footballWatchingLevel");
  const favoriteClubReport = draftState.profile.favoriteClub
    ? getDistanceFromOtherGroups(draftResponse, responses, "favoriteClub")
    : null;

  const overallMarginality =
    (ageReport.overallAverageDistance + countryReport.overallAverageDistance + watchingReport.overallAverageDistance) / 3;

  const orderedGenerationDistances = [...ageReport.distancesByGroup].sort(
    (left, right) => left.averageDistance - right.averageDistance
  );

  const categoryLabels = [
    `${draftState.profile.country}: ${countryReport.overallAverageDistance.toFixed(1)}% distance`,
    `${draftState.profile.footballWatchingLevel} watchers: ${watchingReport.overallAverageDistance.toFixed(1)}% distance`,
  ];

  if (favoriteClubReport && draftState.profile.favoriteClub) {
    categoryLabels.push(
      `${draftState.profile.favoriteClub} fans: ${favoriteClubReport.overallAverageDistance.toFixed(1)}% distance`
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",

      }}
    >
      <div
        style={{
          backgroundColor: "#F0DDB3",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid black",
          maxWidth: "860px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ color: "black", marginTop: 0, fontSize: "2rem", marginBottom: "8px" }}>Final Report</h2>
          <p style={{ color: "black", margin: 0, fontSize: "1rem" }}>{test.title}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "100%",          
              maxWidth: "250px",     
              minWidth: "120px",      
              aspectRatio: "1 / 1",   
              containerType: "inline-size", 
              borderRadius: "50%",
              background: `conic-gradient(#2F6F67 ${overallMarginality}%, rgba(0,0,0,0.08) ${overallMarginality}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "77%",      
                height: "77%",
                borderRadius: "50%",
                backgroundColor: "#F7EACE",
                border: "1px solid rgba(0,0,0,0.14)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "black",
              }}
            >
              <span style={{ fontSize: "20cqi", fontWeight: 800, lineHeight: 1 }}>
                {overallMarginality.toFixed(1)}%
              </span>

              <span style={{ color: "#2F6F67", fontSize: "7cqi", fontWeight: 700, marginTop: "2cqi" }}>
                Marginality level
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <ComparisonTile imageSrc={youImage} label="You" value={`${overallMarginality.toFixed(1)}%`} />
          {orderedGenerationDistances.map((item) => (
            <ComparisonTile
              key={item.label}
              imageSrc={AGE_GROUP_DETAILS[item.label as AgeGroupKey]?.imageSrc ?? ""}
              label={AGE_GROUP_DETAILS[item.label as AgeGroupKey]?.label ?? item.label}
              value={`${item.averageDistance.toFixed(1)}%`}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-around", marginBottom: "28px" }}>
          {categoryLabels.map((label) => (
            <p key={label} style={{ margin: 0, color: "black", fontSize: "0.98rem" }}>
              {label}
            </p>
          ))}
        </div>

        <button
          onClick={() => navigate("/marginality-test")}
          style={{
            width: "20%",
            minWidth: "180px",
            background: "#2F6F67",
            color: "white",
            border: "none",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Return to Tests
        </button>
      </div>
    </div>
  );
}

function ComparisonTile({ imageSrc, label, value }: { imageSrc: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "black" }}>
      <div
        style={{
          width: "130px",
          height: "130px",
          margin: "0 auto 10px",
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
      </div>
      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{label}</div>
      {label !== "You" && (
        <div style={{ marginTop: "4px" }}>{value}</div>
      )}
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
