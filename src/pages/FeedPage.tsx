import { useMemo, useState } from "react";
import { PollCard } from "../components/PollCard";
import type { Poll } from "../domain/Poll";
import { useResponsive } from "../hooks/useResponsive";
import type { UserVotes } from "../domain/User";

type FeedPageProps = {
  polls: Poll[];
  currentUserId: string;
  userVotes: UserVotes;
  onVote: (pollId: string, optionId: string, userId: string) => void;
};

const getEditDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
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

const isFuzzyMatch = (text: string, query: string): boolean => {
  if (!query) return true;

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedText.includes(normalizedQuery)) return true;

  const textWords = normalizedText.split(/[\s,.-]+/);
  const queryWords = normalizedQuery.split(/[\s,.-]+/);

  return queryWords.every((queryWord) =>
    textWords.some((textWord) => {
      const allowedTypos = queryWord.length > 5 ? 2 : 1;
      return getEditDistance(queryWord, textWord) <= allowedTypos;
    })
  );
};

export function FeedPage({ polls, currentUserId, userVotes, onVote }: FeedPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isMobile, isTablet } = useResponsive();

  const feedPolls = useMemo(
    () =>
      polls
        .filter((poll) => poll.ownerId !== currentUserId)
        .filter((poll) => {
          if (!searchQuery) return true;
          return isFuzzyMatch(poll.title, searchQuery) || isFuzzyMatch(poll.category, searchQuery);
        }),
    [polls, currentUserId, searchQuery]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        padding: isMobile ? "20px 16px 24px" : "0 24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "minmax(0, 1fr) minmax(0, 560px)" : "1fr 600px 1fr",
          gap: isMobile ? "20px" : "40px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isMobile ? "stretch" : "flex-end",
            paddingTop: isMobile ? 0 : "40px",
            order: isMobile ? 0 : 0,
          }}
        >
          <div style={{ width: "100%", maxWidth: isMobile ? "100%" : "250px" }}>
            <h1 style={{ color: "white", margin: 0, fontSize: isMobile ? "2rem" : "2.5rem", fontWeight: 800 }}>
              Feed
            </h1>
            <p style={{ color: "white", opacity: 0.85, margin: "8px 0 0", fontSize: isMobile ? "0.95rem" : "1.05rem", lineHeight: "1.5" }}>
              Discover and vote on trending topics.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            order: isMobile ? 2 : 1,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: isMobile ? "12px" : "60px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingTop: isMobile ? 0 : "16px",
            }}
          >
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
                <div key={poll.id} style={{ marginBottom: isMobile ? "20px" : "32px" }}>
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingTop: isMobile ? 0 : "40px",
            order: isMobile ? 1 : 2,
          }}
        >
          <label style={{ color: "white", fontSize: "1rem", fontWeight: 500, paddingLeft: "4px" }}>
            Search by title or category
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: isMobile ? "100%" : "280px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              borderRadius: "12px",
            }}
          >
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
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(10px)",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(event) => (event.target.style.borderColor = "rgba(255,255,255,0.4)")}
              onBlur={(event) => (event.target.style.borderColor = "rgba(255,255,255,0.15)")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
