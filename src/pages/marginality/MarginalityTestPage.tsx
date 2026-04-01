import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { MarginalityTest } from "../../domain/MarginalityTest";
import { theme } from "../../theme/theme";
import type { MarginalityDraftState } from "./flowTypes";

type MarginalityQuestionPageProps = {
  tests: MarginalityTest[];
};

export function MarginalityTestPage({ tests }: MarginalityQuestionPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId, questionIndex } = useParams<{ testId: string; questionIndex: string }>();
  const draftState = location.state as MarginalityDraftState | undefined;

  const test = useMemo(() => tests.find((currentTest) => currentTest.id === testId), [testId, tests]);
  
  const [sliderValue, setSliderValue] = useState(50);
  const [hasVoted, setHasVoted] = useState(false); // Tracks if the user moved the slider
  const [showStats, setShowStats] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isInfoHovered, setIsInfoHovered] = useState(false); // Tracks tooltip hover

  if (!test || !draftState) {
    return <CenteredMessage message="Test session not found. Please start again." />;
  }

  const currentIndex = Number(questionIndex ?? 0);
  const question = test.questions[currentIndex];

  if (!question) {
    return <CenteredMessage message="Question not found." />;
  }

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
      
      // Reset animations and states for the incoming question
      setIsAnimatingOut(false);
      setShowStats(false);
      setHasVoted(false); // Lock the stats button again for the next question
      setSliderValue(50);
    }, 600);
  };

  // --- STYLES ---
  const cardStyle: React.CSSProperties = {
    width: "320px",
    height: "460px",
    backgroundColor: "#EEDCAE",
    borderRadius: "20px",
    boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
    border: "2px solid rgba(0,0,0,0.1)",
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #6EC1B8, #2E5652)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden" 
    }}>
      
      <style>{`
        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #4B6BFB, #8A2BE2, #FF2A2A);
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
      `}</style>

      {/* ========================================= */}
      {/* LEFT PANEL: Titles & Actions              */}
      {/* ========================================= */}
      <div style={{ position: "absolute", left: "8%", top: "45%", transform: "translateY(-50%)", zIndex: 10 }}>
        
        {/* Title with Info Hover */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontSize: "3.5rem", margin: 0, fontWeight: 900, textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}>
            <span style={{ color: "#4B6BFB" }}>Cold</span> <span style={{ color: "#222" }}>or</span> <span style={{ color: "#FF2A2A" }}>Hot</span> <span style={{ color: "#222" }}>?</span>
          </h1>
          
          <div 
            onMouseEnter={() => setIsInfoHovered(true)}
            onMouseLeave={() => setIsInfoHovered(false)}
            style={{ position: "relative", display: "flex", alignItems: "center", cursor: "help", marginTop: "12px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.8rem", color: "#222", opacity: 0.8 }}>info</span>
            
            {/* The Tooltip Cloud Dialog */}
            <div style={{
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
              opacity: isInfoHovered ? 1 : 0,
              visibility: isInfoHovered ? "visible" : "hidden",
              transition: "opacity 0.2s, visibility 0.2s",
              zIndex: 50,
            }}>
              {/* Little triangle pointing up */}
              <div style={{
                position: "absolute",
                top: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0, 
                height: 0, 
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid #1F3D3A"
              }} />
              This test measures how "Hot" (you strongly agree) or "Cold" (you strongly disagree) your takes are compared to the rest of the world!
            </div>
          </div>
        </div>

        {/* Stats Reveal Trigger */}
        <div style={{ marginTop: "120px" }}>
          <p style={{ color: "#E0F2F1", fontSize: "1rem", margin: "0 0 8px 0" }}>8% shift from public opinion</p>
          <button 
            onClick={() => setShowStats(!showStats)}
            disabled={!hasVoted}
            style={{
              backgroundColor: "#7BE4C6",
              color: "#1F3D3A",
              border: "none",
              padding: "10px 24px",
              borderRadius: "20px",
              fontWeight: "bold",
              cursor: hasVoted ? "pointer" : "not-allowed",
              opacity: hasVoted ? 1 : 0.4,
              boxShadow: hasVoted ? "0 4px 10px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (hasVoted) e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              if (hasVoted) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {!hasVoted ? "Vote to see stats" : showStats ? "Hide stats" : "See more stats"}
          </button>
        </div>
      </div>


      {/* ========================================= */}
      {/* CENTER: The Card Stack                    */}
      {/* ========================================= */}
      {/* Shifted up by 40px to create more breathing room for the slider */}
      <div style={{ position: "relative", width: "320px", height: "460px", zIndex: 5, marginTop: "-40px" }}>
        
        {!isLastQuestion && (
          <div style={{ ...cardStyle, transform: "rotate(6deg) translate(8px, 8px)", zIndex: 1 }} />
        )}
        
        {!isLastQuestion && (
          <div style={{ ...cardStyle, transform: "rotate(3deg) translate(4px, 4px)", zIndex: 2 }} />
        )}

        <div style={{ 
          ...cardStyle, 
          zIndex: 3,
          transform: isAnimatingOut ? "translate(150vw, -100px) rotate(45deg)" : "rotate(0deg) translate(0px, 0px)",
          opacity: isAnimatingOut ? 0 : 1,
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-in",
        }}>
          <p style={{ fontSize: "1.2rem", margin: "0 0 16px 0", textAlign: "center", color: "#555" }}>Take :</p>
          <h2 style={{ fontSize: "1.8rem", margin: 0, textAlign: "center", lineHeight: 1.3 }}>
            {question.text}
          </h2>
        </div>

      </div>


      {/* ========================================= */}
      {/* RIGHT PANEL: Stats Card (Slides in)       */}
      {/* ========================================= */}
      <div style={{ 
        ...cardStyle, 
        position: "absolute",
        left: "calc(50% + 180px)", 
        marginTop: "-40px", // Match the center stack shift
        zIndex: 4,
        padding: "24px 20px",
        textAlign: "center",
        fontSize: "0.95rem",
        lineHeight: 1.6,
        transform: isAnimatingOut 
          ? "translate(150vw, -100px) rotate(45deg)" 
          : showStats 
            ? "translateX(0) rotate(0deg)" 
            : "translateX(100vw) rotate(0deg)",
        opacity: isAnimatingOut ? 0 : showStats ? 1 : 0,
        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in-out",
        pointerEvents: showStats ? "auto" : "none", 
      }}>
        <p>You think is <strong>{sliderValue}% hot</strong> ({sliderValue >= 50 ? "agree" : "disagree"})</p>
        <p>8% shift from public opinion (52%)</p>
        <div style={{ width: "80%", height: "1px", background: "rgba(0,0,0,0.1)", margin: "16px auto" }} />
        <p>You are closer to a Gen Y than a Gen Z</p>
        <p>Gen Z (97'-): 46% hot (disagree)<br/>Gen Y (81'-96'): 55% hot (agree)</p>
        <p style={{ fontSize: "0.85rem", color: "#555" }}>The most marginal generation :<br/>Boomers (46'-64') - 20% (strongly disagree)</p>
        <div style={{ width: "80%", height: "1px", background: "rgba(0,0,0,0.1)", margin: "16px auto" }} />
        <p>You are really special in your country,<br/>most people disagree (30%)</p>
      </div>


      {/* ========================================= */}
      {/* BOTTOM PANEL: Slider and Next Button      */}
      {/* ========================================= */}
      <div style={{ 
        position: "absolute", 
        bottom: "6%", // Keeps the slider nicely anchored near the bottom
        width: "100%", 
        maxWidth: "500px", 
        textAlign: "center",
        zIndex: 10,
        opacity: isAnimatingOut ? 0.5 : 1,
        transition: "opacity 0.3s",
      }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "1.5rem" }}>
          <span>🥶</span>
          <span>🥵</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          className="custom-slider"
          value={sliderValue}
          onChange={(event) => {
            setSliderValue(Number(event.target.value));
            if (!hasVoted) setHasVoted(true); // Unlock stats when they move it!
          }}
        />

        <div style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "16px" }}>
          <button 
            onClick={() => navigate("/marginality-test")} 
            style={{ ...actionButtonStyle, background: "transparent", border: "2px solid rgba(255,255,255,0.2)", color: "#E0F2F1" }}
          >
            Quit
          </button>
          
          <button 
            onClick={handleNext} 
            disabled={isAnimatingOut || !hasVoted} // Optional: force them to vote before continuing
            style={{ 
              ...actionButtonStyle, 
              background: "#5E3B68", 
              color: "white",
              opacity: (!hasVoted || isAnimatingOut) ? 0.5 : 1,
              cursor: (!hasVoted || isAnimatingOut) ? "not-allowed" : "pointer"
            }}
          >
            {isLastQuestion ? "Finish Test" : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  padding: "10px 40px",
  borderRadius: "24px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  transition: "transform 0.2s, opacity 0.2s",
  border: "none",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

function CenteredMessage({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#2E5652" }}>
      <h1 style={{ color: "white", margin: 0 }}>{message}</h1>
    </div>
  );
}