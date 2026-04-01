import { useState, type ReactNode } from "react";
import type { Poll } from "../domain/Poll";
import { theme } from "../theme/theme";
import { getCurrentStandings } from "../services/pollService";

type PollCardEditProps = {
    pollId: string;
    polls: Poll[];
    onUpdatePoll: (pollId: string, updates: Partial<Poll>) => void;
};

export function PollCardEdit({ pollId, polls, onUpdatePoll }: PollCardEditProps) {
    const poll = polls.find((currentPoll) => currentPoll.id === pollId);

    const [editedTitle, setEditedTitle] = useState(poll?.title ?? "");
    const [editedDescription, setEditedDescription] = useState(poll?.description ?? "");
    const [editedImageUrl, setEditedImageUrl] = useState(poll?.imageUrl ?? "");

    if (!poll) {
        return null;
    }

    const handleSaveDetails = () => {
        onUpdatePoll(poll.id, {
            title: editedTitle,
            description: editedDescription,
            imageUrl: editedImageUrl,
        });
    };


    return (
        <div
            style={{
                width: "50%",
                backgroundColor: "#C4DBD5",
                borderRadius: "20px",
                padding: "24px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}>
            <h2 style={{ margin: 0, color: "#1F3D3A" }}>Edit Poll</h2>

            <FieldRow label="Title">
                <input
                    value={editedTitle}
                    onChange={(event) => setEditedTitle(event.target.value)}
                    placeholder="Poll title"
                    style={inputStyle}
                />
            </FieldRow>

            <FieldRow label="Description">
                <textarea
                    value={editedDescription}
                    onChange={(event) => setEditedDescription(event.target.value)}
                    placeholder="Poll description"
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
            </FieldRow>

            <FieldRow label="Photo URL">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) 220px",
                        gap: "16px",
                        alignItems: "stretch",
                    }}
                >
                    <input
                        value={editedImageUrl}
                        onChange={(event) => setEditedImageUrl(event.target.value)}
                        placeholder="https://..."
                        style={inputStyle}
                    />
                    <div
                        style={{
                            aspectRatio: "16 / 9",
                            borderRadius: "18px",
                            border: "2px solid #6F9D96",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.18)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {editedImageUrl ? (
                            <img
                                src={editedImageUrl}
                                alt={editedTitle || "Poll"}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        ) : (
                            <p style={{ margin: 0, color: "#315B58", textAlign: "center", padding: "12px" }}>16:9 preview</p>
                        )}
                    </div>
                </div>
            </FieldRow>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <PollResults poll={poll} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h3 style={{ margin: 0, color: "#1F3D3A" }}>Poll Details</h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "16px",
                    }}
                >
                    <DetailLabel label="Comments" value={String(poll.nrMessages)} />
                    <DetailLabel label="Votes" value={String(poll.interactionCount)} />
                    <DetailLabel label="Posted on" value={poll.dateCreated.toLocaleDateString()} />
                    <button onClick={handleSaveDetails} style={primaryButtonStyle}>
                        Update Poll
                    </button>
                </div>
            </div>
        </div>
    );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "130px 1fr",
                alignItems: "start",
                gap: "14px",
            }}
        >
            <label style={{ color: "#1F3D3A", fontWeight: 700, paddingTop: "12px" }}>{label}</label>
            <div>{children}</div>
        </div>
    );
}

function DetailLabel({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
            }}
        >
            <span style={{ color: "#315B58", fontSize: 12, fontWeight: 700 }}>{label}</span>
            <span style={{ color: "#1F3D3A", fontSize: 15 }}>{value}</span>
        </div>
    );
}

const PollResults = ({ poll }: { poll: Poll }) => {
    // 1. Setup Pagination State
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 4; // 2x2 grid = 4 items per page

    // 2. Get and slice the data for the current page
    const standings = getCurrentStandings(poll);
    const totalPages = Math.ceil(standings.length / ITEMS_PER_PAGE);

    const currentOptions = standings.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0, color: "#1F3D3A" }}>Poll Options</h3>

            {/* 3. The Grid Layout */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr", // Creates two equal columns
                    gap: "12px",
                    minHeight: "60px" // Optional: prevents the UI from jumping if the last page has fewer items
                }}
            >
                {currentOptions.map(([option, percentage]) => (
                    <p key={option.id} style={{ margin: 0, padding: 0 }}>
                        {option.text} ({percentage.toFixed(1)}%)
                    </p>
                ))}
            </div>

            {/* 4. Pagination Controls (Only show if there's more than 1 page) */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 0}
                        style={{
                            cursor: currentPage === 0 ? "not-allowed" : "pointer",
                            opacity: currentPage === 0 ? 0.5 : 1,
                            backgroundColor: theme.colors.secondary,
                            color: theme.colors.primary,            
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>&larr;</span> Prev
                    </button>

                    <span style={{ fontSize: "14px", color: "#666" }}>
                        Page {currentPage + 1} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages - 1}
                        style={{ 
                            cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer", 
                            opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                            backgroundColor: theme.colors.secondary,
                            color: theme.colors.primary,            
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px" }}
                    >
                        Next &rarr;
                    </button>
                </div>
            )}
        </div>
    );
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: theme.spacing.md,
    borderRadius: 16,
    border: "2px solid #6F9D96",
    background: "transparent",
    color: "#1F3D3A",
    outline: "none",
    fontSize: 14,
};

const primaryButtonStyle = {
    height: 40,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#47C7AA",
    color: "white",
    cursor: "pointer",
    boxShadow: theme.shadow.sm,
};
