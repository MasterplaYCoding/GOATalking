import { useNavigate } from "react-router-dom";
import type { Poll } from "../../domain/Poll";
import { PollCardEdit } from "../../components/PollCardEdit";
import { useResponsive } from "../../hooks/useResponsive";

type PollPageProps = {
    pollId: string;
    polls: Poll[];
    onUpdatePoll: (pollId: string, updates: Partial<Poll>) => void;
};

export function PollEditPage({
    pollId,
    polls,
    onUpdatePoll,
}: PollPageProps) {
    const navigate = useNavigate(); // Hook added to power the back button
    const { isMobile } = useResponsive();

    const poll = polls.find((currentPoll) => currentPoll.id === pollId);

    if (!poll) {
        return (
            <div style={{ minHeight: "100vh", padding: "24px", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h1 style={{ color: "white", margin: 0 }}>Poll not found</h1>
            </div>
        );
    }

    return (
        <div style={{ position: "relative", minHeight: "100vh", width: "100%", padding: isMobile ? "20px 16px 24px" : "32px 24px", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "center" }}>
            
            {/* Absolute positioned back button in the top left */}
            <button 
                onClick={() => navigate(-1)} // Navigates back to the previous page
                style={{
                    position: "absolute",
                    top: isMobile ? "14px" : "40px",
                    left: isMobile ? "12px" : "40px",
                    background: "transparent",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: isMobile ? "1rem" : "1.1rem",
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

            {/* Width and height 100% removed so it naturally hugs the card and centers perfectly */}
            <div style={{ overflow: "hidden", width: "100%", maxWidth: "960px", marginTop: isMobile ? "36px" : 0 }}>
                <PollCardEdit
                    pollId={poll.id}
                    polls={polls}
                    onUpdatePoll={onUpdatePoll}
                />
            </div> 
        </div>
    );
}
