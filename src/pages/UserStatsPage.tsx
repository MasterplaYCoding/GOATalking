import { useMemo } from "react";
import type { Poll } from "../domain/Poll";
import type { UserVotes } from "../domain/User"; // 1. IMPORT USERVOTES
import { UserPollsTable } from "../components/UserPollsTable";

// 2. ADD THE MISSING PROPS HERE
type UserStatsPageProps = {
    polls: Poll[];
    onAdd: () => void;
    onUpdate: (pollId: string) => void;
    onDelete: (pollId: string) => void;
    currentUserId: string;
    userVotes: UserVotes;
    onVote: (pollId: string, optionId: string, userId: string) => void;
    onRunCrudDemo: () => void;
    isCrudDemoRunning: boolean;
};

// --- Our custom Color Palette (Light to Dark) ---
const CHART_COLORS = [
    "#A3E4D7", // Very Light Mint (0-10 / 0-30%)
    "#73C6B6", // Light Teal
    "#47C7AA", // Secondary Color (Theme)
    "#315B58", // Dark Teal
    "#1F3D3A", // Primary Color (Theme)
];

// --- Reusable Pie Chart Component ---
type ChartDataPoint = {
    label: string;
    value: number;
    color: string;
};

const PieChartCard = ({ title, description, data }: { title: string; description: string; data: ChartDataPoint[] }) => {
    // Calculate total to find percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Generate the dynamic conic-gradient string
    let cumulativePercent = 0;
    const gradientStops = total === 0
        ? "#e0e0e0 0% 100%" // Gray circle if there is no data at all
        : data.map((item) => {
            const percent = (item.value / total) * 100;
            const stop = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
            cumulativePercent += percent;
            return stop;
        }).join(", ");

    return (
        <div
            style={{
                backgroundColor: "#C4DBD5",
                borderRadius: "20px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                height: "100%",
                minHeight: "420px", 
                boxSizing: "border-box",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
        >
            <h3 style={{ margin: "0 0 8px 0", color: "#1F3D3A", textAlign: "center" }}>{title}</h3>
            <p style={{ margin: "0 0 24px 0", color: "#315B58", textAlign: "center", fontSize: "0.9rem" }}>
                {description}
            </p>

            {/* The Dynamic CSS Pie Chart */}
            <div
                style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "50%",
                    background: `conic-gradient(${gradientStops})`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginBottom: "32px",
                    flexShrink: 0,
                }}
            />

            {/* The Legend */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.map((item, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: item.color }} />
                            <span style={{ color: "#1F3D3A", fontWeight: 500 }}>{item.label}</span>
                        </div>
                        <span style={{ color: "#315B58", fontWeight: "bold" }}>
                            {item.value} {item.value === 1 ? "poll" : "polls"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 3. DESTRUCTURE THE MISSING PROPS HERE
export function UserStatsPage({
    polls,
    onAdd,
    onUpdate,
    onDelete,
    currentUserId,
    userVotes,
    onVote,
    onRunCrudDemo,
    isCrudDemoRunning,
}: UserStatsPageProps) {
    
    // 4. FILTER SO THE DASHBOARD ONLY SHOWS THE CURRENT USER'S POLLS
    const userPolls = useMemo(() => {
        return polls.filter(poll => poll.ownerId === currentUserId);
    }, [polls, currentUserId]);

    // --- CHART 1 LOGIC: Poll Interactions ---
    const interactionData = useMemo(() => {
        const bins = [0, 0, 0, 0, 0];

        userPolls.forEach(poll => {
            const count = poll.interactionCount;
            if (count <= 10) bins[0]++;
            else if (count <= 50) bins[1]++;
            else if (count <= 100) bins[2]++;
            else if (count <= 500) bins[3]++;
            else bins[4]++;
        });

        return [
            { label: "0 - 10", value: bins[0], color: CHART_COLORS[0] },
            { label: "11 - 50", value: bins[1], color: CHART_COLORS[1] },
            { label: "51 - 100", value: bins[2], color: CHART_COLORS[2] },
            { label: "101 - 500", value: bins[3], color: CHART_COLORS[3] },
            { label: "500+", value: bins[4], color: CHART_COLORS[4] },
        ];
    }, [userPolls]);

    // --- CHART 2 LOGIC: Frontrunner Dominance ---
    const dominanceData = useMemo(() => {
        const bins = [0, 0, 0, 0, 0];

        userPolls.forEach(poll => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

            if (totalVotes === 0) {
                bins[0]++;
                return;
            }

            const maxVotes = Math.max(...poll.options.map(opt => opt.votes));
            const percentage = (maxVotes / totalVotes) * 100;

            if (percentage <= 30) bins[0]++;
            else if (percentage <= 50) bins[1]++;
            else if (percentage <= 60) bins[2]++;
            else if (percentage <= 80) bins[3]++;
            else bins[4]++;
        });

        return [
            { label: "0% - 30%", value: bins[0], color: CHART_COLORS[0] },
            { label: "31% - 50%", value: bins[1], color: CHART_COLORS[1] },
            { label: "51% - 60%", value: bins[2], color: CHART_COLORS[2] },
            { label: "61% - 80%", value: bins[3], color: CHART_COLORS[3] },
            { label: "80%+", value: bins[4], color: CHART_COLORS[4] },
        ];
    }, [userPolls]);

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "40px 32px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "32px",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <h1 style={{ color: "white", margin: 0, fontSize: "2.5rem" }}>Creator Dashboard</h1>
                <p style={{ color: "white", margin: "8px 0 0 0", fontSize: "1.1rem" }}>
                    Track the performance and engagement of your polls.
                </p>
                <button
                    onClick={onRunCrudDemo}
                    disabled={isCrudDemoRunning}
                    style={{
                        marginTop: "14px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.35)",
                        background: isCrudDemoRunning ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                        color: "white",
                        padding: "8px 16px",
                        fontWeight: 700,
                        cursor: isCrudDemoRunning ? "not-allowed" : "pointer",
                    }}
                >
                    {isCrudDemoRunning ? "CRUD demo running..." : "Run CRUD demo thread"}
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1fr",
                    gap: "24px",
                    alignItems: "start",
                    maxWidth: "1600px",
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {/* LEFT COLUMN: Interaction Chart */}
                <div style={{ position: "sticky", top: "40px" }}>
                    <PieChartCard
                        title="Poll Interactions"
                        description="Total votes per poll"
                        data={interactionData}
                    />
                </div>

                {/* CENTER COLUMN: The Table */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "20px",
                        padding: "24px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                >
                    <h2 style={{ color: "white", marginTop: 0, marginBottom: "24px" }}>
                        Recent Polls
                    </h2>
                    <UserPollsTable
                        polls={userPolls}
                        onAdd={onAdd}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        currentUserId={currentUserId}
                        userVotes={userVotes}
                        onVote={onVote}
                    />
                </div>

                {/* RIGHT COLUMN: Dominance Chart */}
                <div style={{ position: "sticky", top: "40px" }}>
                    <PieChartCard
                        title="Frontrunner Dominance"
                        description="Vote % held by the leading option"
                        data={dominanceData}
                    />
                </div>
            </div>
        </div>
    );
}
