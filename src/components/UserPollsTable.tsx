import React, { useState } from "react";
import type { Poll } from "../domain/Poll";
import type { UserVotes } from "../domain/User";
import { theme } from "../theme/theme";
import { PollCard } from "./PollCard";

type UserPollsTableProps = {
  polls: Poll[];
  onAdd: () => void;
  onUpdate: (pollId: string) => void;
  onDelete: (pollId: string) => void;
  currentUserId: string;
  userVotes: UserVotes;
  onVote: (pollId: string, optionId: string, userId: string) => void;
};

// --- Helper: Calculate the Front Runner ---
const getFrontRunner = (options: Poll["options"]) => {
  if (!options || options.length === 0) return "No options";

  let maxVotes = -1;
  let leaders: string[] = [];

  options.forEach((opt) => {
    if (opt.votes > maxVotes) {
      maxVotes = opt.votes;
      leaders = [opt.text];
    } else if (opt.votes === maxVotes) {
      leaders.push(opt.text);
    }
  });

  if (maxVotes === 0) return "-";
  
  if (leaders.length > 1) {
    return `Tie`;
  }

  return leaders[0];
};

// --- Helper: Hex to RGB Converter ---
const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
};

// --- Helper: Color Interpolation Math ---
const getGradientColor = (index: number, maxIndex: number) => {
  const topRgb = hexToRgb(theme.colors?.secondary || "#47C7AA");
  const bottomRgb = hexToRgb(theme.colors?.primary || "#1F3D3A");
  
  const factor = maxIndex > 0 ? index / maxIndex : 1;

  const r = Math.round(topRgb[0] + factor * (bottomRgb[0] - topRgb[0]));
  const g = Math.round(topRgb[1] + factor * (bottomRgb[1] - topRgb[1]));
  const b = Math.round(topRgb[2] + factor * (bottomRgb[2] - topRgb[2]));

  return `rgb(${r}, ${g}, ${b})`;
};

export function UserPollsTable({ polls, onAdd, onUpdate, onDelete, currentUserId, userVotes, onVote }: UserPollsTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [hoveredPollId, setHoveredPollId] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = viewMode === "table" ? 4 : 6;
  const totalPages = Math.ceil(polls.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));

  const currentPolls = polls.slice(
    safeCurrentPage * ITEMS_PER_PAGE,
    (safeCurrentPage + 1) * ITEMS_PER_PAGE
  );

  const topColor = theme.colors?.secondary || "#47C7AA";
  const bottomColor = theme.colors?.primary || "#1F3D3A";
  const verticalGradient = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;

  const ShortDivider = ({ color }: { color: string }) => (
    <div 
      style={{ 
        width: "50%", 
        height: "1px", 
        background: color, 
        margin: "0 auto",
        opacity: 0.3
      }} 
    />
  );

  return (
    // Added overflow: "hidden" here so the container perfectly contains the content
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
      
      {/* Hide scrollbars for Webkit browsers (Chrome/Safari) */}
      <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {polls.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "white", fontSize: "1rem" }}>You haven't posted any polls yet.</p>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            // ================== TABLE VIEW ==================
            <div
              style={{
                position: "relative", 
                display: "flex",
                flexDirection: "column",
                flex: 1, 
                borderStyle: "solid",
                borderWidth: "2px",
                borderImage: `${verticalGradient} 1`,
                textAlign: "center",
                overflow: "hidden", // Table fits perfectly, so we hide overflow
              }}
            >
              {[20, 40, 60, 80].map((percent) => (
                <div
                  key={percent}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${percent}%`,
                    width: "2px",
                    background: verticalGradient,
                    zIndex: 0, 
                  }}
                />
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", zIndex: 1 }}>
                {["Thumbnail", "Title", "Votes", "Frontrunner", "Date posted"].map((head, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 6px",
                      fontWeight: "bold",
                      fontSize: "clamp(0.85rem, 1.1vw, 1.05rem)",
                      color: "white", 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {head}
                  </div>
                ))}
              </div>

              {currentPolls.map((poll, rowIndex) => {
                const rowColor = getGradientColor(rowIndex, ITEMS_PER_PAGE - 1);
                const isSelected = selectedPollId === poll.id;
                const isHovered = hoveredPollId === poll.id;

                return (
                  <div 
                    key={poll.id}
                    onClick={() => setSelectedPollId(poll.id)}
                    onMouseEnter={() => setHoveredPollId(poll.id)}
                    onMouseLeave={() => setHoveredPollId(null)}
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(5, 1fr)", 
                      flex: 1, 
                      zIndex: 1,
                      cursor: "pointer",
                      backgroundColor: isSelected 
                        ? "rgba(255, 255, 255, 0.2)" 
                        : isHovered 
                        ? "rgba(255, 255, 255, 0.05)" 
                        : "transparent",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    {/* Column 1: Thumbnail */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rowIndex > 0 && <ShortDivider color={rowColor} />}
                      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "8px" }}>
                        <div style={{ width: "100%", maxWidth: "90px", aspectRatio: "16 / 9", borderRadius: "8px", overflow: "hidden" }}>
                          <img src={poll.imageUrl} alt={poll.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      </div>
                    </div>
                    {/* Column 2: Title */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rowIndex > 0 && <ShortDivider color={rowColor} />} 
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                        <span style={{ color: "white", fontSize: "clamp(0.8rem, 1vw, 0.95rem)", fontWeight: isSelected ? "bold" : 500 }}>{poll.title}</span>
                      </div>
                    </div>
                    {/* Column 3: Votes */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rowIndex > 0 && <ShortDivider color={rowColor} />}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                        <span style={{ color: "white", fontSize: "clamp(0.8rem, 1vw, 0.95rem)", fontWeight: isSelected ? "bold" : 600 }}>
                          {poll.interactionCount >= 1000000 ? `${(poll.interactionCount / 1000000).toFixed(1)} mil` : poll.interactionCount >= 1000 ? `${(poll.interactionCount / 1000).toFixed(0)} k` : poll.interactionCount}
                        </span>
                      </div>
                    </div>
                    {/* Column 4: Frontrunner */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rowIndex > 0 && <ShortDivider color={rowColor} />}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", paddingLeft: "12px", paddingRight: "12px" }}>
                        <span style={{ color: "white", fontSize: "clamp(0.8rem, 1vw, 0.95rem)", fontWeight: isSelected ? "bold" : 500, overflow: "hidden", textOverflow: "ellipsis" }}>{getFrontRunner(poll.options)}</span>
                      </div>
                    </div>
                    {/* Column 5: Date Posted */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {rowIndex > 0 && <ShortDivider color={rowColor} />}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                        <span style={{ color: "white", fontSize: "clamp(0.8rem, 1vw, 0.95rem)", fontWeight: isSelected ? "bold" : 400 }}>
                          {poll.dateCreated.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, '-')} 
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          ) : (

            // ================== GRID VIEW ==================
            <div 
              className="hide-scroll"
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "24px", 
                flex: 1,
                minHeight: 0, // CRITICAL: Allows flex child to not overflow parent
                overflowY: "auto", // Allows internal scrolling if cards are too tall
                padding: "8px", // Breathing room for hover drop-shadows
                scrollbarWidth: "none", // Firefox scrollbar hide
              }}
            >
              {currentPolls.map((poll) => {
                const isSelected = selectedPollId === poll.id;
                const isHovered = hoveredPollId === poll.id;

                return (
                  <div
                    key={poll.id}
                    onClick={() => setSelectedPollId(poll.id)}
                    onMouseEnter={() => setHoveredPollId(poll.id)}
                    onMouseLeave={() => setHoveredPollId(null)}
                    style={{
                      cursor: "pointer",
                      borderRadius: "24px", 
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? `0 0 0 4px ${topColor}` : "none",
                      transform: isHovered && !isSelected ? "translateY(-4px)" : "none",
                    }}
                  >
                    <div style={{ pointerEvents: "none", height: "100%" }}>
                      <PollCard
                        pollId={poll.id}
                        polls={polls}
                        currentUserId={currentUserId}
                        userVotes={userVotes}
                        onVote={onVote}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* BOTTOM CONTROLS: Action Buttons, View Toggle, Pagination */}
      {/* ======================================================== */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr auto 1fr", 
          alignItems: "center", 
          gap: "32px", // Added guaranteed spacing between columns!
          padding: "0 4px", 
          flexShrink: 0 
        }}
      >
        
        {/* Left: Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifySelf: "flex-start" }}>
          <ActionButton icon="add" text="Add" onClick={onAdd} />
          <ActionButton 
            icon="edit" 
            text="Update" 
            onClick={() => selectedPollId && onUpdate(selectedPollId)} 
            disabled={!selectedPollId} 
          />
          <ActionButton 
            icon="delete" 
            text="Delete" 
            onClick={() => selectedPollId && onDelete(selectedPollId)} 
            disabled={!selectedPollId} 
            isDanger={true}
          />
        </div>

        {/* Center: View Toggle Switch */}
        <div 
          style={{ 
            display: "flex", 
            background: "rgba(255, 255, 255, 0.05)", 
            borderRadius: "12px", 
            padding: "4px", 
            gap: "4px",
            justifySelf: "center"
          }}
        >
          <button
            onClick={() => setViewMode("table")}
            style={{
              background: viewMode === "table" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: viewMode === "table" ? topColor : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "6px 12px",
              transition: "all 0.2s"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>table_rows</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              background: viewMode === "grid" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: viewMode === "grid" ? topColor : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "6px 12px",
              transition: "all 0.2s"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>grid_view</span>
          </button>
        </div>

        {/* Right: Pagination */}
        <div style={{ justifySelf: "flex-end" }}>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "0.85rem", color: "white", fontWeight: 500 }}>
                {safeCurrentPage + 1} / {totalPages}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(0, p - 1));
                    setSelectedPollId(null); 
                  }}
                  disabled={safeCurrentPage === 0}
                  style={{
                    cursor: safeCurrentPage === 0 ? "not-allowed" : "pointer",
                    opacity: safeCurrentPage === 0 ? 0.3 : 1,
                    backgroundColor: "transparent",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>arrow_back</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
                    setSelectedPollId(null); 
                  }}
                  disabled={safeCurrentPage >= totalPages - 1}
                  style={{
                    cursor: safeCurrentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                    opacity: safeCurrentPage >= totalPages - 1 ? 0.3 : 1,
                    backgroundColor: "transparent",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ActionButton component remains identical
type ActionButtonProps = {
  icon: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  isDanger?: boolean;
};

function ActionButton({ icon, text, onClick, disabled, isDanger = false }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        backgroundColor: isDanger ? "transparent" : theme.colors?.secondary || "#E0E7E6",
        color: isDanger ? "#ef4444" : theme.colors?.primary || "#1F3D3A",
        border: isDanger ? "2px solid #ef4444" : "none",
        padding: "8px 16px",
        borderRadius: "8px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.9rem",
        transition: "all 0.2s",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>{icon}</span>
      {text}
    </button>
  );
}
