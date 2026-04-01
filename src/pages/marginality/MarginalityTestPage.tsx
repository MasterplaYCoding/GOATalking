import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AGE_GROUP_DETAILS,
  type AgeGroupKey,
  type GroupAverageResult,
  type MarginalityQuestion,
  type MarginalityTest,
  type MarginalityTestResponse,
} from "../../domain/MarginalityTest";
import {
  getQuestionAverageByGroup,
  getQuestionOverallAverage,
  getResponsesForTest,
} from "../../services/marginalityTestService";
import { useResponsive } from "../../hooks/useResponsive";
import type { MarginalityDraftState } from "./flowTypes";

type MarginalityQuestionPageProps = {
  tests: MarginalityTest[];
  responses: MarginalityTestResponse[];
};

export function MarginalityTestPage({ tests, responses }: MarginalityQuestionPageProps) {
  const location = useLocation();
  const { testId, questionIndex } = useParams<{ testId: string; questionIndex: string }>();
  const draftState = location.state as MarginalityDraftState | undefined;
  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);

  if (!test || !draftState) {
    return <CenteredMessage message="Test session not found. Please start again." />;
  }

  const currentIndex = Number(questionIndex ?? 0);
  const question = test.questions[currentIndex];

  if (!question) {
    return <CenteredMessage message="Question not found." />;
  }

  return (
    <MarginalityQuestionScreen
      key={question.id}
      test={test}
      question={question}
      currentIndex={currentIndex}
      responses={responses}
      draftState={draftState}
    />
  );
}

type MarginalityQuestionScreenProps = {
  test: MarginalityTest;
  question: MarginalityQuestion;
  currentIndex: number;
  responses: MarginalityTestResponse[];
  draftState: MarginalityDraftState;
};

function MarginalityQuestionScreen({
  test,
  question,
  currentIndex,
  responses,
  draftState,
}: MarginalityQuestionScreenProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const existingAnswer = draftState.answers[question.id];
  const [sliderValue, setSliderValue] = useState(existingAnswer ?? 50);
  const [hasVoted, setHasVoted] = useState(typeof existingAnswer === "number");
  const [showStats, setShowStats] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const testResponses = useMemo(() => getResponsesForTest(responses, test.id), [responses, test.id]);
  const overallAverage = useMemo(
    () => getQuestionOverallAverage(testResponses, question.id),
    [question.id, testResponses]
  );
  const ageGroupAverages = useMemo(
    () => getQuestionAverageByGroup(testResponses, question.id, "ageGroup"),
    [question.id, testResponses]
  );
  const countryAverages = useMemo(
    () => getQuestionAverageByGroup(testResponses, question.id, "country"),
    [question.id, testResponses]
  );
  const watchingAverages = useMemo(
    () => getQuestionAverageByGroup(testResponses, question.id, "footballWatchingLevel"),
    [question.id, testResponses]
  );

  const summary = useMemo(
    () => buildVoteSummary(sliderValue, overallAverage),
    [overallAverage, sliderValue]
  );
  const ageInsights = useMemo(
    () => buildAgeInsights(ageGroupAverages, sliderValue, draftState.profile.ageGroup),
    [ageGroupAverages, draftState.profile.ageGroup, sliderValue]
  );
  const countryInsight = useMemo(
    () => buildSingleGroupInsight(countryAverages, draftState.profile.country, sliderValue, "country"),
    [countryAverages, draftState.profile.country, sliderValue]
  );
  const watchingInsight = useMemo(
    () =>
      buildSingleGroupInsight(
        watchingAverages,
        draftState.profile.footballWatchingLevel,
        sliderValue,
        "watching habit"
      ),
    [draftState.profile.footballWatchingLevel, sliderValue, watchingAverages]
  );

  const isLastQuestion = currentIndex === test.questions.length - 1;

  const handleNext = () => {
    setIsAnimatingOut(true);

    setTimeout(() => {
      const nextAnswers = {
        ...draftState.answers,
        [question.id]: sliderValue,
      };

      const nextState: MarginalityDraftState = {
        profile: draftState.profile,
        answers: nextAnswers,
      };

      if (isLastQuestion) {
        navigate(`/marginality-test/${test.id}/report`, { state: nextState });
      } else {
        navigate(`/marginality-test/${test.id}/questions/${currentIndex + 1}`, { state: nextState });
      }
    }, 500);
  };

  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #6EC1B8, #2E5652)",
          padding: "20px 16px 24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <p style={{ color: "#DCEFEB", margin: "0 0 8px 0", fontSize: "0.9rem" }}>
            Question {currentIndex + 1} of {test.questions.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "2.2rem", margin: 0, fontWeight: 900, lineHeight: 1.05 }}>
              <span style={{ color: "#4B6BFB" }}>Cold</span>{" "}
              <span style={{ color: "#102724" }}>or</span>{" "}
              <span style={{ color: "#FF2A2A" }}>Hot</span>
              <span style={{ color: "#102724" }}>?</span>
            </h1>
            <InfoPopover />
          </div>
        </div>

        <div style={{ ...cardStyle, position: "static", width: "100%", height: "auto", minHeight: "260px", padding: "24px" }}>
          <p style={{ fontSize: "1rem", margin: "0 0 12px 0", textAlign: "center", color: "#555" }}>Take:</p>
          <h2 style={{ fontSize: "1.45rem", margin: 0, textAlign: "center", lineHeight: 1.35 }}>{question.text}</h2>
        </div>

        {hasVoted && (
          <p style={{ color: "#EAF6F2", fontSize: "0.95rem", margin: 0, lineHeight: 1.45 }}>
            {summary}
          </p>
        )}

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "18px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "1.2rem" }}>
            <span role="img" aria-label="cold face">🥶</span>
            <span role="img" aria-label="hot face">🥵</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            className="custom-slider"
            value={sliderValue}
            onChange={(event) => {
              setSliderValue(Number(event.target.value));
              if (!hasVoted) {
                setHasVoted(true);
              }
            }}
          />
          <div style={{ marginTop: "12px", color: "#F3FBF8", fontSize: "0.95rem", textAlign: "center" }}>{sliderValue}%</div>
        </div>

        <button
          onClick={() => setShowStats((current) => !current)}
          disabled={!hasVoted}
          style={{
            backgroundColor: "#7BE4C6",
            color: "#1F3D3A",
            border: "none",
            padding: "12px 18px",
            borderRadius: "20px",
            fontWeight: 700,
            cursor: hasVoted ? "pointer" : "not-allowed",
            opacity: hasVoted ? 1 : 0.45,
          }}
        >
          {!hasVoted ? "Vote to see stats" : showStats ? "Hide stats" : "See stats"}
        </button>

        {showStats && (
          <div style={{ ...statsCardStyle, position: "static", width: "100%", height: "auto", marginTop: 0, left: "auto", transform: "none", opacity: 1 }}>
            <p style={statsTextStyle}>
              You answered <strong>{sliderValue}%</strong>, which means you <strong>{agreementTone(sliderValue)}</strong> this take.
            </p>
            <p style={statsTextStyle}>
              The current overall average is <strong>{formatPercent(overallAverage)}</strong>, so you are{" "}
              <strong>{formatSignedDistance(sliderValue - overallAverage)}</strong> away from the crowd on this question.
            </p>
            <Divider />
            <p style={statsTextStyle}>
              Your generation is <strong>{ageInsights.currentGroupLabel}</strong> at <strong>{formatPercent(ageInsights.currentGroupAverage)}</strong>.
            </p>
            <p style={statsTextStyle}>
              You are closest to <strong>{ageInsights.closestGroupLabel}</strong> and furthest from <strong>{ageInsights.furthestGroupLabel}</strong>.
            </p>
            <p style={statsTextStyle}>{ageInsights.groupsLine}</p>
            <Divider />
            <p style={statsTextStyle}>{countryInsight}</p>
            <p style={statsTextStyle}>{watchingInsight}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate("/marginality-test")}
            style={{ ...actionButtonStyle, flex: 1, background: "transparent", border: "2px solid rgba(255,255,255,0.25)", color: "#E0F2F1" }}
          >
            Quit
          </button>
          <button
            onClick={handleNext}
            disabled={isAnimatingOut || !hasVoted}
            style={{
              ...actionButtonStyle,
              flex: 1,
              background: "#5E3B68",
              color: "white",
              opacity: !hasVoted || isAnimatingOut ? 0.5 : 1,
              cursor: !hasVoted || isAnimatingOut ? "not-allowed" : "pointer",
            }}
          >
            {isLastQuestion ? "Finish Test" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #6EC1B8, #2E5652)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "32px 24px 120px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(to right, #4B6BFB, #8A2BE2, #FF5F56);
          outline: none;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 4px solid #C4DBD5;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        @keyframes card-slide-in {
          from {
            transform: translateX(110vw) rotate(18deg);
            opacity: 0;
          }
          to {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ position: "absolute", left: "6%", top: "18%", width: "min(360px, 28vw)", zIndex: 10 }}>
        <p style={{ color: "#DCEFEB", margin: "0 0 8px 0", fontSize: "0.92rem", letterSpacing: "0.06em" }}>
          Question {currentIndex + 1} of {test.questions.length}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontSize: "3.5rem", margin: 0, fontWeight: 900, lineHeight: 1.05 }}>
            <span style={{ color: "#4B6BFB" }}>Cold</span>{" "}
            <span style={{ color: "#102724" }}>or</span>{" "}
            <span style={{ color: "#FF2A2A" }}>Hot</span>
            <span style={{ color: "#102724" }}>?</span>
          </h1>
          <InfoPopover />
        </div>

        <div style={{ marginTop: "88px" }}>
          {hasVoted && (
            <p style={{ color: "#EAF6F2", fontSize: "0.98rem", margin: "0 0 10px 0", lineHeight: 1.45 }}>
              {summary}
            </p>
          )}

          <button
            onClick={() => setShowStats((current) => !current)}
            disabled={!hasVoted}
            style={{
              backgroundColor: "#7BE4C6",
              color: "#1F3D3A",
              border: "none",
              padding: "10px 24px",
              borderRadius: "20px",
              fontWeight: 700,
              cursor: hasVoted ? "pointer" : "not-allowed",
              opacity: hasVoted ? 1 : 0.45,
            }}
          >
            {!hasVoted ? "Vote to see stats" : showStats ? "Hide stats" : "See stats"}
          </button>
        </div>
      </div>

      <div style={{ position: "relative", width: "320px", height: "460px", zIndex: 5, marginTop: "-40px" }}>
        {!isLastQuestion && (
          <div
            style={{
              ...cardStyle,
              transform: "rotate(6deg) translate(8px, 8px)",
              zIndex: 1,
            }}
          />
        )}
        {!isLastQuestion && (
          <div
            style={{
              ...cardStyle,
              transform: "rotate(3deg) translate(4px, 4px)",
              zIndex: 2,
            }}
          />
        )}

        <div
          style={{
            ...cardStyle,
            zIndex: 3,
            transform: isAnimatingOut ? "translate(150vw, -100px) rotate(45deg)" : "rotate(0deg)",
            opacity: isAnimatingOut ? 0 : 1,
            transition: "transform 0.5s ease, opacity 0.35s ease",
            animation: isAnimatingOut ? undefined : "card-slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <p style={{ fontSize: "1.05rem", margin: "0 0 16px 0", textAlign: "center", color: "#555" }}>Take:</p>
          <h2 style={{ fontSize: "1.7rem", margin: 0, textAlign: "center", lineHeight: 1.3 }}>{question.text}</h2>
        </div>
      </div>

      <div
        style={{
          ...statsCardStyle,
          transform: isAnimatingOut ? "translateX(120vw)" : showStats ? "translateX(0)" : "translateX(110vw)",
          opacity: isAnimatingOut ? 0 : showStats ? 1 : 0,
          pointerEvents: showStats ? "auto" : "none",
        }}
      >
        <p style={statsTextStyle}>
          You answered <strong>{sliderValue}%</strong>, which means you <strong>{agreementTone(sliderValue)}</strong> this take.
        </p>
        <p style={statsTextStyle}>
          The current overall average is <strong>{formatPercent(overallAverage)}</strong>, so you are{" "}
          <strong>{formatSignedDistance(sliderValue - overallAverage)}</strong> away from the crowd on this question.
        </p>

        <Divider />

        <p style={statsTextStyle}>
          Your generation is <strong>{ageInsights.currentGroupLabel}</strong> at{" "}
          <strong>{formatPercent(ageInsights.currentGroupAverage)}</strong>.
        </p>
        <p style={statsTextStyle}>
          You are closest to <strong>{ageInsights.closestGroupLabel}</strong> and furthest from{" "}
          <strong>{ageInsights.furthestGroupLabel}</strong>.
        </p>
        <p style={statsTextStyle}>{ageInsights.groupsLine}</p>

        <Divider />

        <p style={statsTextStyle}>{countryInsight}</p>
        <p style={statsTextStyle}>{watchingInsight}</p>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "6%",
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
          zIndex: 10,
          opacity: isAnimatingOut ? 0.5 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "1.45rem" }}>
          <span role="img" aria-label="cold face">
            🥶
          </span>
          <span role="img" aria-label="hot face">
            🥵
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          className="custom-slider"
          value={sliderValue}
          onChange={(event) => {
            setSliderValue(Number(event.target.value));
            if (!hasVoted) {
              setHasVoted(true);
            }
          }}
        />

        <div style={{ marginTop: "12px", color: "#F3FBF8", fontSize: "0.95rem" }}>{sliderValue}%</div>

        <div style={{ marginTop: "28px", display: "flex", justifyContent: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/marginality-test")}
            style={{
              ...actionButtonStyle,
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.25)",
              color: "#E0F2F1",
            }}
          >
            Quit
          </button>

          <button
            onClick={handleNext}
            disabled={isAnimatingOut || !hasVoted}
            style={{
              ...actionButtonStyle,
              background: "#5E3B68",
              color: "white",
              opacity: !hasVoted || isAnimatingOut ? 0.5 : 1,
              cursor: !hasVoted || isAnimatingOut ? "not-allowed" : "pointer",
            }}
          >
            {isLastQuestion ? "Finish Test" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  width: "320px",
  height: "460px",
  backgroundColor: "#EEDCAE",
  borderRadius: "20px",
  boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
  border: "2px solid rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "32px",
  boxSizing: "border-box",
  position: "absolute",
  fontFamily: "Georgia, serif",
  color: "#222",
};

const statsCardStyle: React.CSSProperties = {
  ...cardStyle,
  position: "absolute",
  left: "calc(50% + 180px)",
  marginTop: "-40px",
  zIndex: 4,
  padding: "24px 22px",
  textAlign: "left",
  fontSize: "0.95rem",
  lineHeight: 1.55,
  transition: "transform 0.45s ease, opacity 0.3s ease",
  alignItems: "stretch",
  justifyContent: "flex-start",
};

const statsTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#222",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "10px 40px",
  borderRadius: "24px",
  fontSize: "1.05rem",
  fontWeight: 700,
  transition: "transform 0.2s, opacity 0.2s",
  border: "none",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

function Divider() {
  return <div style={{ width: "100%", height: "1px", background: "rgba(0,0,0,0.12)", margin: "16px 0" }} />;
}

function InfoPopover() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", cursor: "help", marginTop: "10px" }}
    >
      <span style={{ fontSize: "1.7rem", color: "#102724", opacity: 0.85 }}>i</span>
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "12px",
          backgroundColor: "#1F3D3A",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          width: "240px",
          fontSize: "0.95rem",
          lineHeight: 1.4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? "visible" : "hidden",
          transition: "opacity 0.2s, visibility 0.2s",
          zIndex: 50,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "8px solid #1F3D3A",
          }}
        />
        This test measures how hot or cold your take is compared with the people who already answered it.
      </div>
    </div>
  );
}

function buildVoteSummary(value: number, overallAverage: number): string {
  const difference = value - overallAverage;
  const side = difference >= 0 ? "hotter" : "colder";

  return `You are ${Math.abs(difference).toFixed(0)} points ${side} than the current average on this take.`;
}

function buildAgeInsights(
  ageGroupAverages: GroupAverageResult[],
  sliderValue: number,
  currentAgeGroup: AgeGroupKey
) {
  const fallbackGroups = Object.keys(AGE_GROUP_DETAILS).map((key) => ({
    label: key,
    averageAgreement: 0,
    responsesCount: 0,
  }));
  const groups = ageGroupAverages.length > 0 ? ageGroupAverages : fallbackGroups;
  const currentGroupAverage =
    groups.find((group) => group.label === currentAgeGroup)?.averageAgreement ?? 0;

  const sortedByDistance = [...groups].sort(
    (left, right) =>
      Math.abs(sliderValue - left.averageAgreement) - Math.abs(sliderValue - right.averageAgreement)
  );
  const closest = sortedByDistance[0];
  const furthest = sortedByDistance[sortedByDistance.length - 1];

  return {
    currentGroupLabel: AGE_GROUP_DETAILS[currentAgeGroup].label,
    currentGroupAverage,
    closestGroupLabel: AGE_GROUP_DETAILS[closest?.label as AgeGroupKey]?.label ?? closest?.label ?? "the closest group",
    furthestGroupLabel:
      AGE_GROUP_DETAILS[furthest?.label as AgeGroupKey]?.label ?? furthest?.label ?? "the furthest group",
    groupsLine: groups
      .map((group) => {
        const label = AGE_GROUP_DETAILS[group.label as AgeGroupKey]?.label ?? group.label;

        return `${label}: ${formatPercent(group.averageAgreement)}`;
      })
      .join(" • "),
  };
}

function buildSingleGroupInsight(
  groups: GroupAverageResult[],
  currentLabel: string,
  sliderValue: number,
  groupName: string
): string {
  const matchingGroup = groups.find(
    (group) => group.label.toLowerCase() === currentLabel.toLowerCase()
  );

  if (!matchingGroup) {
    return `There is not enough ${groupName} data yet to compare your answer.`;
  }

  const difference = sliderValue - matchingGroup.averageAgreement;
  const direction = difference >= 0 ? "hotter" : "colder";

  return `${currentLabel} currently averages ${formatPercent(
    matchingGroup.averageAgreement
  )}, so you are ${Math.abs(difference).toFixed(0)} points ${direction} than that group.`;
}

function agreementTone(value: number): string {
  if (value >= 75) {
    return "strongly agree with";
  }

  if (value >= 50) {
    return "slightly agree with";
  }

  if (value >= 25) {
    return "slightly disagree with";
  }

  return "strongly disagree with";
}

function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

function formatSignedDistance(value: number): string {
  const direction = value >= 0 ? "hotter" : "colder";

  return `${Math.abs(value).toFixed(0)} points ${direction}`;
}

function CenteredMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#2E5652",
      }}
    >
      <h1 style={{ color: "white", margin: 0 }}>{message}</h1>
    </div>
  );
}
