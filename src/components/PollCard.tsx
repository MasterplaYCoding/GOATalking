import { useState } from "react";
import type { Poll } from "../domain/Poll";
import { theme } from "../theme/theme";
import { getCurrentStandings } from "../services/pollService";
import type { UserVotes } from "../domain/User";

type PollCardProps = {
  pollId: string;
  polls: Poll[];
  onVote: (pollId: string, optionId: string, userId: string) => void;
  currentUserId?: string;
  userVotes?: UserVotes; 
};

const getBarColor = (percentage: number): string => {
  if (percentage >= 80) return "#22c55e";
  if (percentage >= 60) return "#84cc16";
  if (percentage >= 40) return "#eab308";
  if (percentage >= 20) return "#f97316";
  return "#ef4444";
};

const StatsComp = ({ span_icon, text }: { span_icon: string; text: string }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1cqw" }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "4.5cqw", color: "#1F3D3A" }}
      >
        {span_icon}
      </span>
      <span style={{ color: "#1F3D3A", fontSize: "3cqw", fontWeight: 500 }}>
        {text}
      </span>
    </div>
  );
};

const PollResults = ({ 
  poll, 
  onVote, 
  currentUserId, 
  userVotes 
}: { 
  poll: Poll; 
  onVote: PollCardProps["onVote"]; 
  currentUserId?: string;
  userVotes?: UserVotes;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const standings = getCurrentStandings(poll);
  const totalPages = Math.ceil(standings.length / ITEMS_PER_PAGE);

  const currentOptions = standings.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Find out which option the user has voted for in this poll
  const selectedOptionId = currentUserId ? userVotes?.[poll.id]?.[currentUserId] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2cqw", width: "100%", flex: 1 }}>
      
      {/* Options Container */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-evenly", width: "100%" }}>
        {currentOptions.map(([option, percentage]) => {
          
          // Boolean check to see if this is the highlighted option
          const isSelected = option.id === selectedOptionId;

          return (
            <div
              key={option.id}
              onClick={() => {
                if (currentUserId) {
                  onVote(poll.id, option.id, currentUserId);
                } else {
                  console.warn("User must be logged in to vote.");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3cqw",
                width: "100%",
                cursor: "pointer",
                
                // --- HIGHLIGHT STYLING ---
                // We use your theme colors here!
                backgroundColor: isSelected ? theme.colors?.primary || "#1F3D3A" : "transparent",
                border: isSelected 
                  ? `2px solid ${theme.colors?.secondary || "#47C7AA"}` 
                  : "2px solid transparent", // Keep an invisible border so the layout doesn't jump
                
                padding: "1.5cqw 2cqw", // Add a little padding so the text doesn't touch the new border
                borderRadius: "12px",
                boxSizing: "border-box",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <span
                style={{
                  flex: 1,
                  margin: 0,
                  fontWeight: 500,
                  color: "#1F3D3A", 
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: "3.5cqw", 
                }}
              >
                {option.text}
              </span>

              <div
                style={{
                  flex: 1.5,
                  height: "2cqw",
                  backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "#E0E7E6",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "flex-end",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: getBarColor(percentage),
                    borderRadius: "4px",
                    transition: "width 0.5s ease-out, background-color 0.5s ease-out",
                  }}
                />
              </div>

              <span
                style={{
                  minWidth: "4ch",
                  textAlign: "right",
                  margin: 0,
                  fontWeight: "bold",
                  color: "#1F3D3A",
                  fontSize: "3.5cqw",
                }}
              >
                {percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 0}
            style={{
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              opacity: currentPage === 0 ? 0.5 : 1,
              backgroundColor: theme.colors?.secondary || "#E0E7E6",
              color: theme.colors?.primary || "#1F3D3A",
              border: "none",
              padding: "1.5cqw 3cqw",
              borderRadius: "6px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "1cqw",
              fontSize: "3cqw", 
            }}
          >
            <span>&larr;</span> Prev
          </button>

          <span style={{ fontSize: "2.8cqw", color: "#666" }}>
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages - 1}
            style={{
              cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
              backgroundColor: theme.colors?.secondary || "#E0E7E6",
              color: theme.colors?.primary || "#1F3D3A",
              border: "none",
              padding: "1.5cqw 3cqw",
              borderRadius: "6px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "1cqw",
              fontSize: "3cqw",
            }}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
};


export function PollCard({
  pollId,
  polls,
  onVote,
  currentUserId,
  userVotes
}: PollCardProps) {
  const poll = polls.find((currentPoll) => currentPoll.id === pollId);

  if (!poll) {
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "4 / 5",             
        containerType: "inline-size",     
        overflow: "hidden",               
        backgroundColor: "#C4DBD5",
        borderRadius: "20px",
        padding: "4% 6%",         
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h2 style={{ margin: 0, color: "#1F3D3A", textAlign: "center", fontSize: "6cqw", flexShrink: 0 }}>
        {poll.title}
      </h2>

      <div
        style={{
          width: "75%",
          aspectRatio: "16 / 9",
          flexShrink: 0,                  
          borderRadius: "18px",
          border: "2px solid #6F9D96",
          overflow: "hidden",
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "3cqw 0"
        }}
      >
        {poll.imageUrl ? (
          <img
            src={poll.imageUrl}
            alt={poll.title || "Poll"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <p style={{ margin: 0, color: "#315B58", textAlign: "center", padding: "12px", fontSize: "3cqw" }}>
            16:9 preview
          </p>
        )}
      </div>

      <p style={{ margin: 0, color: "#1F3D3A", textAlign: "center", fontSize: "3.5cqw", flexShrink: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {poll.description}
      </p>


      <PollResults 
        poll={poll} 
        onVote={onVote} 
        currentUserId={currentUserId} 
        userVotes={userVotes} 
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
          marginTop: "3cqw",
          flexShrink: 0
        }}
      >
        <StatsComp span_icon="chat" text={poll.interactionCount.toString()} />
        <StatsComp span_icon="campaign" text={poll.interactionCount.toString()} />
        <StatsComp span_icon="today" text={poll.dateCreated.toLocaleDateString()} />
      </div>
    </div>
  );
}
