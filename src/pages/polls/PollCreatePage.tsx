import { useNavigate } from "react-router-dom";
import { PollCardCreate, type NewPollData } from "../../components/PollCardCreate";

type PollCreatePageProps = {
    onCreatePoll: (pollData: NewPollData) => void;
};

export function PollCreatePage({ onCreatePoll }: PollCreatePageProps) {
    const navigate = useNavigate();

    const handleCreateAndBack = (pollData: NewPollData) => {
        onCreatePoll(pollData); // 1. Save the new poll to your state
        navigate(-1);           // 2. Go back to your polls list
    };

    return (
        <div style={{ position: "relative", minHeight: "100vh", width: "100%", padding: "32px 24px", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "center" }}>
            
            {/* Absolute positioned back button in the top left */}
            <button 
                onClick={() => navigate(-1)}
                style={{
                    position: "absolute",
                    top: "40px",
                    left: "40px",
                    background: "transparent",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    zIndex: 50,
                    transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
                <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>arrow_back</span>
                Back
            </button>

            {/* Inner wrapper doesn't force 100% width/height so Flexbox centers it */}
            <div style={{ overflow: "hidden", width: "100%", display: "flex", justifyContent: "center" }}>
                <PollCardCreate onCreatePoll={handleCreateAndBack} />
            </div> 
        </div>
    );
}