import { useState, useMemo } from "react";
import { PollCard } from "../components/PollCard";
import type { Poll } from "../domain/Poll";
import type { UserVotes } from "../domain/User";

// Note: I removed onCreatePoll and onLogOut from the props since we aren't using them here anymore!
type FeedPageProps = {
  polls: Poll[];
  currentUserId: string;
  userVotes: UserVotes;
  onVote: (pollId: string, optionId: string, userId: string) => void;
};

// --- Helper: Levenshtein Distance for Fuzzy Searching ---
const getEditDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, 
        matrix[j - 1][i] + 1, 
        matrix[j - 1][i - 1] + indicator 
      );
    }
  }
  return matrix[b.length][a.length];
};

// --- Helper: Fuzzy Match Logic ---
const isFuzzyMatch = (text: string, query: string): boolean => {
  if (!query) return true;
  
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedText.includes(normalizedQuery)) return true;

  const textWords = normalizedText.split(/[\s,.-]+/);
  const queryWords = normalizedQuery.split(/[\s,.-]+/);

  return queryWords.every((qWord) => {
    return textWords.some((tWord) => {
      const allowedTypos = qWord.length > 5 ? 2 : 1;
      return getEditDistance(qWord, tWord) <= allowedTypos;
    });
  });
};


export function FeedPage({ polls, currentUserId, userVotes, onVote }: FeedPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const feedPolls = useMemo(() => {
    return polls
      .filter((poll) => poll.ownerId !== currentUserId) 
      .filter((poll) => { 
        if (!searchQuery) return true;
        return isFuzzyMatch(poll.title, searchQuery) || isFuzzyMatch(poll.category, searchQuery);
      });
  }, [polls, currentUserId, searchQuery]);

  return (
    // Outer container locks the page to screen height
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", overflow: "hidden", padding: "0px 24px 0 24px", boxSizing: "border-box" }}>
      
      {/* THE 3-COLUMN GRID: 
        1fr (Left) | 600px (The Feed) | 1fr (Right Search) 
      */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 600px 1fr", 
          gap: "40px", 
          width: "100%", 
          maxWidth: "1200px", // Slightly tighter to keep things looking connected
          height: "100%" 
        }}
      >
        
        {/* ========================================= */}
        {/* LEFT COLUMN: Feed Text                    */}
        {/* ========================================= */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop: "40px" }}>
          {/* Constrain width so it aligns nicely against the middle column */}
          <div style={{ width: "100%", maxWidth: "250px" }}>
            <h1 style={{ color: "white", margin: 0, fontSize: "2.5rem", fontWeight: 800 }}>Feed</h1>
            <p style={{ color: "white", opacity: 0.85, margin: "8px 0 0", fontSize: "1.05rem", lineHeight: "1.5" }}>
              Discover and vote on trending topics.
            </p>
          </div>
        </div>


        {/* ========================================= */}
        {/* MIDDLE COLUMN: JUST The Feed              */}
        {/* ========================================= */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden"}}>
          
          {/* The Scrolling Polls List */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: "auto", 
              paddingBottom: "60px", 
              scrollbarWidth: "none", // Hides scrollbar in Firefox
              msOverflowStyle: "none", // Hides scrollbar in IE/Edge
              paddingTop: "16px"
            }}
          >
            {/* CSS to hide scrollbar in Chrome/Safari/Webkit */}
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {feedPolls.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.6)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.5 }}>
                  search_off
                </span>
                <p style={{ margin: 0, fontSize: "1.1rem" }}>No polls found.</p>
              </div>
            ) : (
              feedPolls.map((poll) => (
                <div key={poll.id} style={{ marginBottom: "32px" }}>
                  <PollCard
                    pollId={poll.id}
                    polls={polls}
                    currentUserId={currentUserId}
                    userVotes={userVotes}
                    onVote={onVote}
                  />
                </div>
              ))
            )}
          </div>
        </div>


        {/* ========================================= */}
        {/* RIGHT COLUMN: Search Engine               */}
        {/* ========================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "40px" }}>
          
          {/* Search Label */}
          <label style={{ color: "white", fontSize: "1rem", fontWeight: 500, paddingLeft: "4px" }}>
            Search by title or category
          </label>
          
          {/* Search Bar (Made smaller with maxWidth and reduced padding) */}
          <div style={{ position: "relative", width: "100%", maxWidth: "280px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
            <span 
              className="material-symbols-outlined" 
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6F9D96", fontSize: "1.2rem" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px", // Reduced padding
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(10px)",
                color: "white",
                fontSize: "0.95rem", // Slightly smaller text
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
